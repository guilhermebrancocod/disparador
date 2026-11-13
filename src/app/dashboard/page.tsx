"use client"

import { useRef, useState } from "react"
import {
  Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CircleAlert, Download, EllipsisVertical, Mail, Menu, MessageCircle,
  RefreshCw, Send, Settings, Upload, Users, X,
} from "lucide-react"

type Contact = {
  company: string
  email: string
  valid: boolean
  status: "Enviado" | "Pendente" | "Inválido" | "Falhou"
  sentAt: string
  attempts: number
  replied: boolean
}

const contacts: Contact[] = [
  { company: "Loja Alpha", email: "contato@alpha.com.br", valid: true, status: "Enviado", sentAt: "13/11/2026 14:22", attempts: 1, replied: true },
  { company: "Loja Beta", email: "comercial@beta.com.br", valid: true, status: "Pendente", sentAt: "—", attempts: 0, replied: false },
  { company: "Loja Gama", email: "email-invalido@", valid: false, status: "Inválido", sentAt: "—", attempts: 0, replied: false },
  { company: "Loja Delta", email: "vendas@delta.com.br", valid: true, status: "Enviado", sentAt: "13/11/2026 14:20", attempts: 1, replied: false },
  { company: "Loja Ômega", email: "contato@omega.com.br", valid: true, status: "Falhou", sentAt: "13/11/2026 14:18", attempts: 2, replied: false },
]

const statusStyles = {
  Enviado: "bg-emerald-50 text-emerald-700",
  Pendente: "bg-amber-50 text-amber-700",
  Inválido: "bg-rose-50 text-rose-700",
  Falhou: "bg-red-50 text-red-700",
}

export default function DashboardPage() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<number[]>([])

  const toggleAll = () =>
    setSelected(selected.length === contacts.length ? [] : contacts.map((_, index) => index))

  const refresh = () => {
    setRefreshing(true)
    window.setTimeout(() => setRefreshing(false), 700)
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
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-700 text-xs font-bold">GB</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Guilherme Branco</p>
              <p className="truncate text-xs text-slate-400">gmail@gmail.com</p>
            </div>
          </div>
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
            <button className="hidden h-11 shrink-0 items-center gap-2 rounded-lg bg-violet-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 sm:flex">
              <Send className="size-4" /> Iniciar disparos
            </button>
          </header>

          <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Contatos importados", value: "50", icon: Users, color: "text-violet-700", bg: "bg-violet-50" },
              { label: "E-mails válidos", value: "46", icon: Check, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Enviados", value: "30", icon: Send, color: "text-violet-700", bg: "bg-violet-50" },
              { label: "Respostas", value: "4", icon: MessageCircle, color: "text-violet-700", bg: "bg-violet-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <article key={label} className="flex min-h-[100px] items-center gap-4 rounded-xl border border-slate-200/80 bg-white px-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                <span className={`grid size-12 shrink-0 place-items-center rounded-full ${bg} ${color}`}><Icon className="size-6" strokeWidth={2} /></span>
                <div><strong className="block text-2xl font-bold leading-none">{value}</strong><span className="mt-2 block text-sm text-slate-500">{label}</span></div>
              </article>
            ))}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold">Contatos (50)</h2>
              <div className="flex flex-wrap gap-2">
                <button className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold transition hover:bg-slate-50"><Download className="size-4" /> Modelo CSV</button>
                <input ref={fileInput} type="file" accept=".csv" className="hidden" />
                <button onClick={() => fileInput.current?.click()} className="flex h-10 items-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white transition hover:bg-violet-800"><Upload className="size-4" /> Importar CSV</button>
                <button onClick={refresh} aria-label="Atualizar contatos" className="grid size-10 place-items-center rounded-lg border border-slate-200 transition hover:bg-slate-50"><RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} /></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="bg-slate-50/90 text-xs font-semibold text-slate-700">
                  <tr>
                    <th className="w-14 px-5 py-4"><input aria-label="Selecionar todos" type="checkbox" checked={selected.length === contacts.length} onChange={toggleAll} className="size-4 accent-violet-700" /></th>
                    <th className="px-3 py-4">Empresa <span className="text-slate-400">↕</span></th>
                    <th className="px-3 py-4">E-mail <span className="text-slate-400">↕</span></th>
                    <th className="px-3 py-4 text-center">E-mail válido</th>
                    <th className="px-3 py-4">Status</th>
                    <th className="px-3 py-4">Data de envio <span className="text-slate-400">↕</span></th>
                    <th className="px-3 py-4 text-center">Tentativas</th>
                    <th className="px-3 py-4 text-center">Respondeu</th>
                    <th className="px-5 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact, index) => (
                    <tr key={contact.email} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                      <td className="px-5 py-4"><input aria-label={`Selecionar ${contact.company}`} type="checkbox" checked={selected.includes(index)} onChange={() => setSelected((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])} className="size-4 accent-violet-700" /></td>
                      <td className="px-3 py-4 font-medium">{contact.company}</td>
                      <td className="px-3 py-4">{contact.email}</td>
                      <td className="px-3 py-4 text-center">{contact.valid ? <Check className="mx-auto size-5 rounded-full bg-emerald-500 p-1 text-white" strokeWidth={3} /> : <X className="mx-auto size-5 rounded-full bg-red-500 p-1 text-white" strokeWidth={3} />}</td>
                      <td className="px-3 py-4"><span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusStyles[contact.status]}`}>{contact.status}</span></td>
                      <td className="px-3 py-4 text-slate-600">{contact.sentAt}</td>
                      <td className="px-3 py-4 text-center">{contact.attempts}</td>
                      <td className="px-3 py-4 text-center">{contact.replied ? <Check className="mx-auto size-5 rounded-full bg-emerald-500 p-1 text-white" strokeWidth={3} /> : <span className="text-slate-400">—</span>}</td>
                      <td className="px-5 py-4 text-center"><button aria-label={`Ações de ${contact.company}`} className="rounded-md p-1 text-slate-500 hover:bg-slate-100"><EllipsisVertical className="size-5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-slate-500">Exibindo 1–5 de 50 contatos</p>
              <div className="flex items-center gap-1.5">
                <button aria-label="Primeira página" className="grid size-9 place-items-center rounded-lg border text-slate-400" disabled><ChevronsLeft className="size-4" /></button>
                <button aria-label="Página anterior" className="grid size-9 place-items-center rounded-lg border text-slate-400" disabled><ChevronLeft className="size-4" /></button>
                <button className="grid size-9 place-items-center rounded-lg bg-violet-700 font-semibold text-white">1</button>
                <button className="grid size-9 place-items-center rounded-lg font-medium hover:bg-slate-100">2</button>
                <button className="grid size-9 place-items-center rounded-lg font-medium hover:bg-slate-100">3</button>
                <span className="grid size-9 place-items-center text-slate-500">…</span>
                <button className="grid size-9 place-items-center rounded-lg font-medium hover:bg-slate-100">10</button>
                <button aria-label="Próxima página" className="grid size-9 place-items-center rounded-lg hover:bg-slate-100"><ChevronRight className="size-4" /></button>
                <button aria-label="Última página" className="grid size-9 place-items-center rounded-lg border hover:bg-slate-100"><ChevronsRight className="size-4" /></button>
              </div>
            </footer>
          </section>

          <button className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-700 text-sm font-semibold text-white sm:hidden"><Send className="size-4" /> Iniciar disparos</button>
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-400 sm:hidden"><CircleAlert className="size-4" /> Deslize a tabela para ver mais colunas.</p>
        </div>
      </main>
    </div>
  )
}
