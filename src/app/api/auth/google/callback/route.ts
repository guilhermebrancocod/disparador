import { NextResponse } from "next/server"
import { exchangeGoogleCode, googleAccountEmail, readOAuthState } from "@/lib/google-oauth"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

function dashboardUrl(request: Request, params: Record<string, string>) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
  const target = new URL("/dashboard", appUrl)
  for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value)
  return target
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const oauthError = url.searchParams.get("error")
  if (oauthError) {
    return NextResponse.redirect(dashboardUrl(request, {
      gmail: "error",
      reason: oauthError === "access_denied" ? "A conexão com o Google foi cancelada." : oauthError,
    }))
  }

  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const userId = state ? readOAuthState(state) : null
  if (!code || !userId) {
    return NextResponse.redirect(dashboardUrl(request, {
      gmail: "error",
      reason: "O retorno do Google veio sem uma sessão válida.",
    }))
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return NextResponse.redirect(dashboardUrl(request, {
      gmail: "error",
      reason: "SUPABASE_SERVICE_ROLE_KEY ausente no .env.",
    }))
  }

  try {
    const tokens = await exchangeGoogleCode(code)
    const accountEmail = await googleAccountEmail(tokens.access_token)
    const { data: existing } = await admin
      .from("integrations")
      .select("refresh_token")
      .eq("user_id", userId)
      .eq("provider", "gmail")
      .maybeSingle()

    const refreshToken = tokens.refresh_token || existing?.refresh_token
    if (!refreshToken) {
      return NextResponse.redirect(dashboardUrl(request, {
        gmail: "error",
        reason: "O Google não devolveu o refresh token. Remova o acesso do app na conta Google e conecte de novo.",
      }))
    }

    const { data: profile } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle()
    if (!profile) {
      await admin.from("profiles").insert({
        id: userId,
        full_name: accountEmail ?? "Usuário",
        email: accountEmail ?? "",
      })
    }

    const { error } = await admin.from("integrations").upsert(
      {
        user_id: userId,
        provider: "gmail",
        account_email: accountEmail,
        access_token: tokens.access_token,
        refresh_token: refreshToken,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        connected: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    )

    if (error) {
      return NextResponse.redirect(dashboardUrl(request, { gmail: "error", reason: error.message }))
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Falha ao conectar o Gmail."
    return NextResponse.redirect(dashboardUrl(request, { gmail: "error", reason }))
  }

  return NextResponse.redirect(dashboardUrl(request, { gmail: "connected" }))
}
