"use client"

import { FormEvent, useState } from "react"
import { getSupabase } from "@/lib/supabase"

export function AuthPanel({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const supabase = getSupabase()
    if (!supabase) return

    setPending(true)
    setError(null)
    setInfo(null)

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })

      if (signUpError) {
        setError(signUpError.message)
        setPending(false)
        return
      }

      if (!data.session) {
        setInfo("Conta criada. Confirme o e-mail, se o projeto exigir, e depois entre.")
        setMode("signin")
        setPending(false)
        return
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setPending(false)
        return
      }
    }

    setPending(false)
    onAuthenticated()
  }

  return (
    <form onSubmit={submit} className="mb-6 max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">{mode === "signin" ? "Entrar" : "Criar conta"}</h2>
      <p className="mt-1 text-sm text-slate-500">
        As tabelas usam a sessão do Supabase. Sem login, a consulta volta vazia.
      </p>

      {mode === "signup" && (
        <label className="mt-4 block text-xs font-semibold">
          Nome
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>
      )}

      <label className="mt-4 block text-xs font-semibold">
        E-mail
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
      </label>

      <label className="mt-4 block text-xs font-semibold">
        Senha
        <input
          required
          type="password"
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
      </label>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {info && <p className="mt-3 text-sm text-amber-700">{info}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
        >
          {pending ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
        </button>
        <button
          type="button"
          className="text-sm font-semibold text-violet-700"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin")
            setError(null)
            setInfo(null)
          }}
        >
          {mode === "signin" ? "Criar uma conta" : "Já tenho conta"}
        </button>
      </div>
    </form>
  )
}
