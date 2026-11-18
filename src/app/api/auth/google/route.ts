import { NextResponse } from "next/server"
import { googleAuthUrl, signOAuthState } from "@/lib/google-oauth"
import { requireUser } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  const user = await requireUser(request)
  if (!user) {
    return NextResponse.json({ error: "Sessão inválida. Entre de novo." }, { status: 401 })
  }

  const url = googleAuthUrl(signOAuthState(user.id))
  if (!url) {
    return NextResponse.json(
      { error: "Preencha GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI no .env." },
      { status: 500 }
    )
  }

  return NextResponse.json({ url })
}
