"use client"

import { useEffect, useRef, useState } from "react"
import Papa from "papaparse"
import {
  Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CircleAlert, Download, EllipsisVertical, Mail, Menu, MessageCircle,
  RefreshCw, Send, Settings, Upload, Users, X,
} from "lucide-react"
import { AuthPanel } from "@/components/auth-panel"
import { accountFromUser } from "@/lib/account"
import { dispatchEmails, startGoogleOAuth } from "@/lib/mail-actions"
import { getSupabase } from "@/lib/supabase"
import { useSession } from "@/lib/use-session"

type ContactStatus = "pending" | "sent" | "invalid" | "failed"

type Contact = {
  id: string
  company: string
  email: string
  email_valid: boolean
  status: ContactStatus
  sent_at: string | null
  attempts: number
  replied: boolean
}

const statusLabel: Record<ContactStatus, string> = {
  sent: "Enviado",
  pending: "Pendente",
  invalid: "Inválido",
  failed: "Falhou",
}

const statusStyles: Record<ContactStatus, string> = {
  sent: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  invalid: "bg-rose-50 text-rose-700",
  failed: "bg-red-50 text-red-700",
}

const pageSize = 10
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatSentAt(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

export default function DashboardPage() {
  const fileInput = useRef<HTMLInputElement>(null)
  const { user, loading: sessionLoading, configError, refresh: refreshSession } = useSession()
  const account = accountFromUser(user)
  const [menuOpen, setMenuOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function loadContacts(userId = user?.id) {
    const supabase = getSupabase()
    if (!supabase || !userId) {
      setContacts([])
      return
    }

    setRefreshing(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from("contacts")
      .select("id, company, email, email_valid, status, sent_at, attempts, replied")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setContacts([])
    } else {
      setContacts((data ?? []) as Contact[])
    }

    setRefreshing(false)
  }

  useEffect(() => {
    if (sessionLoading || !user) {
      setContacts([])
      return
    }

    void loadContacts(user.id)
    // loadContacts is recreated each render and only needs the signed-in user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, user?.id])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const gmail = params.get("gmail")
    if (!gmail) return

    if (gmail === "connected") {
      setNotice("Gmail conectado. Clique em Iniciar disparos para enviar aos contatos pendentes.")
      setError(null)
    } else {
      setError(params.get("reason") || "Não foi possível conectar o Gmail.")
    }

    window.history.replaceState(null, "", "/dashboard")
  }, [])

  const validCount = contacts.filter((contact) => contact.email_valid).length
  const sentCount = contacts.filter((contact) => contact.status === "sent").length
  const repliedCount = contacts.filter((contact) => contact.replied).length
  const pageCount = Math.max(1, Math.ceil(contacts.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageContacts = contacts.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const rangeStart = contacts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, contacts.length)

  const toggleAll = () =>
    setSelected(selected.length === contacts.length ? [] : contacts.map((contact) => contact.id))

  function downloadTemplate() {
    const blob = new Blob(["empresa,email\n"], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "modelo-contatos.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  async function importCsv(file: File) {
    if (!user) {
      setError("Entre na conta antes de importar contatos.")
      return
    }

    const supabase = getSupabase()
    if (!supabase) return

    const text = await file.text()
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    })
    const rows = parsed.data
      .map((row) => ({
        company: (row.empresa || row.Empresa || row.company || "").trim(),
        email: (row.email || row.Email || row["e-mail"] || "").trim(),
      }))
      .filter((row) => row.company || row.email)

    if (rows.length === 0) {
      setError("O CSV não tem linhas. Use as colunas empresa e email.")
      return
    }

    const payload = rows.map((row) => {
      const valid = emailPattern.test(row.email)
      return {
        user_id: user.id,
        company: row.company || "—",
        email: row.email,
        email_valid: valid,
        status: valid ? "pending" : "invalid",
        attempts: 0,
        replied: false,
      }
    })

    setRefreshing(true)
    const { error: insertError } = await supabase.from("contacts").insert(payload)
    if (insertError) {
      setError(insertError.message)
      setRefreshing(false)
      return
    }

    setNotice(`${payload.length} contato(s) importado(s).`)
    setPage(1)
    await loadContacts(user.id)
  }

  async function startDispatch() {
    if (!user) {
      setError("Entre na conta antes de disparar.")
      return
    }

    setSending(true)
    setError(null)
    setNotice(null)

    try {
      const result = await dispatchEmails(selected)
      if (result.status === 409 && result.body.code === "gmail_not_connected") {
        await startGoogleOAuth()
        return
      }

      if (result.status >= 400) {
        setError(typeof result.body.error === "string" ? result.body.error : "Falha ao disparar.")
        return
      }

      setNotice(typeof result.body.message === "string" ? result.body.message : "Disparo concluído.")
      await loadContacts(user.id)
    } catch (dispatchError) {
      setError(dispatchError instanceof Error ? dispatchError.message : "Falha ao disparar.")
    } finally {
      setSending(false)
    }
  }

  async function signOut() {
    await getSupabase()?.auth.signOut()
    setContacts([])
    setSelected([])
    setNotice(null)
    await refreshSession()
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950">
      {menuOpen && (
        <button aria-label="Fechar menu" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setMenuOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col bg-[#11182b] text-white transition-transform duration-200 lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-white/7 px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-violet-600 shadow-lg shadow-violet-950/30">
              <Mail className="size-[19px]" />
            </span>
            <span className="text-[18px] font-bold tracking-tight">Prospect Mail</span>
          </div>
          <button className="text-slate-400 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X className="size-5" /></button>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-6">
          <a href="/dashboard" className="flex h-12 items-center gap-3 rounded-lg bg-white/10 px-4 text-sm font-semibold shadow-sm">
            <Send className="size-[18px]" /> Disparos
          </a>
          <a href="/settings" className="flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
            <Settings className="size-[18px]" /> Configurações
          </a>
        </nav>

        <div className="border-t border-white/8 p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-700 text-xs font-bold">{account.initials}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{account.name}</p>
              <p className="truncate text-xs text-slate-400">{account.email}</p>
            </div>
          </div>
          {user && (
            <button onClick={() => void signOut()} className="mt-3 text-xs font-semibold text-slate-300 hover:text-white">
              Sair
            </button>
          )}
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[250px]">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-7 lg:px-9 lg:py-8">
          <header className="mb-7 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <button className="mt-1 grid size-9 place-items-center rounded-lg border bg-white lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu className="size-5" /></button>
              <div>
                <p className="mb-1 text-sm font-medium text-slate-500">Disparos</p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-[31px]">Prospecção por E-mail</h1>
                <p className="mt-1 text-sm text-slate-500 sm:text-base">Importe seus contatos, configure a mensagem e acompanhe os envios.</p>
              </div>
            </div>
            <button
              onClick={() => void startDispatch()}
              disabled={sending || !user}
              className="hidden h-11 shrink-0 items-center gap-2 rounded-lg bg-violet-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 disabled:opacity-60 sm:flex"
            >
              <Send className="size-4" /> {sending ? "Enviando..." : "Iniciar disparos"}
            </button>
          </header>

          {configError && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{configError}</p>
          )}
          {error && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}
          {notice && (
            <p className="mb-4 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">{notice}</p>
          )}

          {!sessionLoading && !user && !configError && (
            <AuthPanel onAuthenticated={() => void refreshSession()} />
          )}

          <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Contatos importados", value: contacts.length, icon: Users, color: "text-violet-700", bg: "bg-violet-50" },
              { label: "E-mails válidos", value: validCount, icon: Check, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Enviados", value: sentCount, icon: Send, color: "text-violet-700", bg: "bg-violet-50" },
              { label: "Respostas", value: repliedCount, icon: MessageCircle, color: "text-violet-700", bg: "bg-violet-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <article key={label} className="flex min-h-[100px] items-center gap-4 rounded-xl border border-slate-200/80 bg-white px-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                <span className={`grid size-12 shrink-0 place-items-center rounded-full ${bg} ${color}`}><Icon className="size-6" strokeWidth={2} /></span>
                <div><strong className="block text-2xl font-bold leading-none">{sessionLoading || refreshing ? "…" : value}</strong><span className="mt-2 block text-sm text-slate-500">{label}</span></div>
              </article>
            ))}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold">Contatos ({contacts.length})</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={downloadTemplate} className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold transition hover:bg-slate-50"><Download className="size-4" /> Modelo CSV</button>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void importCsv(file)
                    event.target.value = ""
                  }}
                />
                <button onClick={() => fileInput.current?.click()} className="flex h-10 items-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white transition hover:bg-violet-800"><Upload className="size-4" /> Importar CSV</button>
                <button onClick={() => void loadContacts()} aria-label="Atualizar contatos" className="grid size-10 place-items-center rounded-lg border border-slate-200 transition hover:bg-slate-50"><RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} /></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="bg-slate-50/90 text-xs font-semibold text-slate-700">
                  <tr>
                    <th className="w-14 px-5 py-4"><input aria-label="Selecionar todos" type="checkbox" checked={contacts.length > 0 && selected.length === contacts.length} onChange={toggleAll} className="size-4 accent-violet-700" /></th>
                    <th className="px-3 py-4">Empresa</th>
                    <th className="px-3 py-4">E-mail</th>
                    <th className="px-3 py-4 text-center">E-mail válido</th>
                    <th className="px-3 py-4">Status</th>
                    <th className="px-3 py-4">Data de envio</th>
                    <th className="px-3 py-4 text-center">Tentativas</th>
                    <th className="px-3 py-4 text-center">Respondeu</th>
                    <th className="px-5 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pageContacts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-10 text-center text-sm text-slate-500">
                        {sessionLoading ? "Carregando contatos..." : "Nenhum contato importado."}
                      </td>
                    </tr>
                  ) : pageContacts.map((contact) => (
                    <tr key={contact.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                      <td className="px-5 py-4"><input aria-label={`Selecionar ${contact.company}`} type="checkbox" checked={selected.includes(contact.id)} onChange={() => setSelected((current) => current.includes(contact.id) ? current.filter((item) => item !== contact.id) : [...current, contact.id])} className="size-4 accent-violet-700" /></td>
                      <td className="px-3 py-4 font-medium">{contact.company}</td>
                      <td className="px-3 py-4">{contact.email}</td>
                      <td className="px-3 py-4 text-center">{contact.email_valid ? <Check className="mx-auto size-5 rounded-full bg-emerald-500 p-1 text-white" strokeWidth={3} /> : <X className="mx-auto size-5 rounded-full bg-red-500 p-1 text-white" strokeWidth={3} />}</td>
                      <td className="px-3 py-4"><span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusStyles[contact.status]}`}>{statusLabel[contact.status]}</span></td>
                      <td className="px-3 py-4 text-slate-600">{formatSentAt(contact.sent_at)}</td>
                      <td className="px-3 py-4 text-center">{contact.attempts}</td>
                      <td className="px-3 py-4 text-center">{contact.replied ? <Check className="mx-auto size-5 rounded-full bg-emerald-500 p-1 text-white" strokeWidth={3} /> : <span className="text-slate-400">—</span>}</td>
                      <td className="px-5 py-4 text-center"><button aria-label={`Ações de ${contact.company}`} className="rounded-md p-1 text-slate-500 hover:bg-slate-100"><EllipsisVertical className="size-5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-slate-500">
                {contacts.length === 0 ? "Nenhum contato" : `Exibindo ${rangeStart}–${rangeEnd} de ${contacts.length} contatos`}
              </p>
              <div className="flex items-center gap-1.5">
                <button aria-label="Primeira página" className="grid size-9 place-items-center rounded-lg border text-slate-400 disabled:opacity-40" disabled={currentPage === 1} onClick={() => setPage(1)}><ChevronsLeft className="size-4" /></button>
                <button aria-label="Página anterior" className="grid size-9 place-items-center rounded-lg border text-slate-400 disabled:opacity-40" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="size-4" /></button>
                <button className="grid size-9 place-items-center rounded-lg bg-violet-700 font-semibold text-white">{currentPage}</button>
                <button aria-label="Próxima página" className="grid size-9 place-items-center rounded-lg border disabled:opacity-40" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight className="size-4" /></button>
                <button aria-label="Última página" className="grid size-9 place-items-center rounded-lg border disabled:opacity-40" disabled={currentPage === pageCount} onClick={() => setPage(pageCount)}><ChevronsRight className="size-4" /></button>
              </div>
            </footer>
          </section>

          <button
            onClick={() => void startDispatch()}
            disabled={sending || !user}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-700 text-sm font-semibold text-white disabled:opacity-60 sm:hidden"
          >
            <Send className="size-4" /> {sending ? "Enviando..." : "Iniciar disparos"}
          </button>
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-400 sm:hidden"><CircleAlert className="size-4" /> Deslize a tabela para ver mais colunas.</p>
        </div>
      </main>
    </div>
  )
}
