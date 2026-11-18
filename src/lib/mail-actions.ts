import { getSupabase } from "@/lib/supabase"

async function accessToken() {
  const supabase = getSupabase()
  if (!supabase) throw new Error("Preencha as chaves do Supabase no .env e reinicie o servidor.")

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error("Entre na conta antes de continuar.")
  return token
}

export async function startGoogleOAuth() {
  const token = await accessToken()
  const response = await fetch("/api/auth/google", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || typeof body.url !== "string") {
    throw new Error(typeof body.error === "string" ? body.error : "Não foi possível iniciar o Google.")
  }
  window.location.href = body.url
}

export async function dispatchEmails(contactIds: string[]) {
  const token = await accessToken()
  const response = await fetch("/api/dispatch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contactIds }),
  })
  const body = await response.json().catch(() => ({}))
  return { status: response.status, body }
}
