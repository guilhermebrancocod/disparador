import { NextResponse } from "next/server"
import { buildRawMessage, refreshGoogleAccessToken, sendGmailMessage } from "@/lib/google-oauth"
import { getSupabaseAdmin, requireUser } from "@/lib/supabase-admin"

type ContactRow = {
  id: string
  company: string
  email: string
  attempts: number
  sent_at: string | null
}

function personalize(template: string, contact: ContactRow) {
  return template
    .replaceAll("{{empresa}}", contact.company)
    .replaceAll("{{email}}", contact.email)
}

export async function POST(request: Request) {
  const user = await requireUser(request)
  if (!user) {
    return NextResponse.json({ error: "Sessão inválida. Entre de novo." }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY ausente no .env." }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const contactIds = Array.isArray(body.contactIds)
    ? body.contactIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
    : []

  const { data: integration, error: integrationError } = await admin
    .from("integrations")
    .select("id, account_email, access_token, refresh_token, token_expires_at, connected")
    .eq("user_id", user.id)
    .eq("provider", "gmail")
    .maybeSingle()

  if (integrationError) {
    return NextResponse.json({ error: integrationError.message }, { status: 500 })
  }

  if (!integration?.connected || !integration.refresh_token) {
    return NextResponse.json(
      { code: "gmail_not_connected", error: "Conecte o Gmail antes de disparar." },
      { status: 409 }
    )
  }

  const { data: channel, error: channelError } = await admin
    .from("channels")
    .select("enabled, sender_name, subject, message")
    .eq("user_id", user.id)
    .eq("type", "email")
    .maybeSingle()

  if (channelError) {
    return NextResponse.json({ error: channelError.message }, { status: 500 })
  }

  if (!channel?.enabled) {
    return NextResponse.json({ error: "Ative o canal de e-mail em Configurações." }, { status: 400 })
  }

  if (!channel.subject?.trim() || !channel.message?.trim()) {
    return NextResponse.json({ error: "Preencha o assunto e a mensagem em Configurações." }, { status: 400 })
  }

  let query = admin
    .from("contacts")
    .select("id, company, email, attempts, sent_at")
    .eq("user_id", user.id)
    .eq("email_valid", true)
    .in("status", ["pending", "failed"])

  if (contactIds.length > 0) query = query.in("id", contactIds)

  const { data: contacts, error: contactsError } = await query
  if (contactsError) {
    return NextResponse.json({ error: contactsError.message }, { status: 500 })
  }

  const recipients = (contacts ?? []) as ContactRow[]
  if (recipients.length === 0) {
    return NextResponse.json({
      sent: 0,
      failed: 0,
      message: contactIds.length > 0
        ? "Nenhum contato selecionado está pendente e com e-mail válido."
        : "Nenhum contato pendente com e-mail válido.",
    })
  }

  let accessToken = integration.access_token as string | null
  const expiresAt = integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : 0
  if (!accessToken || expiresAt < Date.now() + 60_000) {
    try {
      const refreshed = await refreshGoogleAccessToken(integration.refresh_token)
      accessToken = refreshed.access_token
      await admin.from("integrations").update({
        access_token: refreshed.access_token,
        token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", integration.id)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível renovar o acesso ao Gmail."
      return NextResponse.json({ error: message }, { status: 401 })
    }
  }

  const fromEmail = integration.account_email as string | null
  if (!fromEmail) {
    return NextResponse.json({ error: "A conta Gmail conectada não tem e-mail. Conecte de novo." }, { status: 400 })
  }

  let sent = 0
  let failed = 0

  for (const contact of recipients) {
    let messageId: string | null = null
    let errorMessage: string | null = null

    try {
      const raw = buildRawMessage({
        fromName: channel.sender_name?.trim() || "Prospect Mail",
        fromEmail,
        to: contact.email,
        subject: personalize(channel.subject, contact),
        body: personalize(channel.message, contact),
      })
      messageId = await sendGmailMessage(accessToken, raw)
      sent += 1
    } catch (error) {
      failed += 1
      errorMessage = error instanceof Error ? error.message : "Falha ao enviar."
    }

    await admin.from("contacts").update({
      status: errorMessage ? "failed" : "sent",
      sent_at: errorMessage ? contact.sent_at : new Date().toISOString(),
      attempts: contact.attempts + 1,
      updated_at: new Date().toISOString(),
    }).eq("id", contact.id).eq("user_id", user.id)

    await admin.from("send_attempts").insert({
      contact_id: contact.id,
      user_id: user.id,
      status: errorMessage ? "failed" : "sent",
      provider_message_id: messageId,
      error_message: errorMessage,
    })
  }

  const message = failed > 0
    ? `${sent} enviado(s) e ${failed} com falha.`
    : `${sent} e-mail(s) enviado(s).`

  return NextResponse.json({ sent, failed, message })
}
