import { createHmac, timingSafeEqual } from "node:crypto"

const gmailScope = "openid email https://www.googleapis.com/auth/gmail.send"

function googleEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) return null
  return { clientId, clientSecret, redirectUri }
}

export function signOAuthState(userId: string) {
  const secret = process.env.GOOGLE_CLIENT_SECRET
  if (!secret) throw new Error("GOOGLE_CLIENT_SECRET ausente.")

  const payload = Buffer.from(JSON.stringify({
    userId,
    exp: Date.now() + 10 * 60 * 1000,
  })).toString("base64url")
  const signature = createHmac("sha256", secret).update(payload).digest("base64url")
  return `${payload}.${signature}`
}

export function readOAuthState(state: string) {
  const secret = process.env.GOOGLE_CLIENT_SECRET
  if (!secret) return null

  const [payload, signature] = state.split(".")
  if (!payload || !signature) return null

  const expected = createHmac("sha256", secret).update(payload).digest("base64url")
  const received = Buffer.from(signature)
  const valid = Buffer.from(expected)
  if (received.length !== valid.length || !timingSafeEqual(received, valid)) return null

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      userId?: string
      exp?: number
    }
    if (!data.userId || !data.exp || data.exp < Date.now()) return null
    return data.userId
  } catch {
    return null
  }
}

export function googleAuthUrl(state: string) {
  const env = googleEnv()
  if (!env) return null

  const params = new URLSearchParams({
    client_id: env.clientId,
    redirect_uri: env.redirectUri,
    response_type: "code",
    scope: gmailScope,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

type GoogleToken = {
  access_token: string
  expires_in: number
  refresh_token?: string
}

async function requestToken(body: URLSearchParams) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof payload.error_description === "string"
      ? payload.error_description
      : "O Google recusou a troca do código."
    throw new Error(message)
  }
  return payload as GoogleToken
}

export async function exchangeGoogleCode(code: string) {
  const env = googleEnv()
  if (!env) throw new Error("Variáveis do Google ausentes no .env.")

  return requestToken(new URLSearchParams({
    code,
    client_id: env.clientId,
    client_secret: env.clientSecret,
    redirect_uri: env.redirectUri,
    grant_type: "authorization_code",
  }))
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const env = googleEnv()
  if (!env) throw new Error("Variáveis do Google ausentes no .env.")

  return requestToken(new URLSearchParams({
    refresh_token: refreshToken,
    client_id: env.clientId,
    client_secret: env.clientSecret,
    grant_type: "refresh_token",
  }))
}

export async function googleAccountEmail(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) return null
  const profile = await response.json().catch(() => ({}))
  return typeof profile.email === "string" ? profile.email : null
}

export function buildRawMessage(input: {
  fromName: string
  fromEmail: string
  to: string
  subject: string
  body: string
}) {
  const fromName = input.fromName.replace(/[\r\n"]/g, " ").trim() || "Prospect Mail"
  const fromEmail = input.fromEmail.replace(/[\r\n]/g, "").trim()
  const to = input.to.replace(/[\r\n]/g, "").trim()
  const subject = input.subject.replace(/[\r\n]/g, " ").trim()
  const encodedSubject = /^[\x20-\x7E]*$/.test(subject)
    ? subject
    : `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`

  const message = [
    `From: "${fromName}" <${fromEmail}>`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    input.body.replace(/\r?\n/g, "\r\n"),
  ].join("\r\n")

  return Buffer.from(message, "utf8").toString("base64url")
}

export async function sendGmailMessage(accessToken: string, raw: string) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof payload.error?.message === "string"
      ? payload.error.message
      : "O Gmail recusou o envio."
    throw new Error(message)
  }
  return typeof payload.id === "string" ? payload.id : null
}
