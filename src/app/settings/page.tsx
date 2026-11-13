"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Box,
  Braces,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  Italic,
  Link as LinkIcon,
  Mail,
  Menu,
  MessageCircle,
  Network,
  Redo2,
  RotateCcw,
  Save,
  Send,
  Settings,
  SlidersHorizontal,
  Underline,
  X,
} from "lucide-react"

const defaultMessage = `Olá, {{empresa}}!

Tudo bem?

Trabalho com desenvolvimento de sistemas e automação de processos para o setor automotivo.

Gostaria de apresentar algumas soluções que podem ajudar no seu negócio.

Podemos agendar uma breve conversa?`

const tabs = [
  { label: "Canais", icon: Box },
  { label: "Modelos", icon: Mail },
  { label: "Variáveis", icon: Braces },
  { label: "Integrações", icon: Network },
]

export default function SettingsPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("Canais")
  const [channel, setChannel] = useState<"email" | "whatsapp">("email")
  const [enabled, setEnabled] = useState(true)
  const [sender, setSender] = useState("Guilherme Branco")
  const [email, setEmail] = useState("guilherme@mail.com")
  const [subject, setSubject] = useState("Uma oportunidade para a {{empresa}}")
  const [message, setMessage] = useState(defaultMessage)
  const [saved, setSaved] = useState(false)

  const restoreDefaults = () => {
    setSender("Guilherme Branco")
    setEmail("guilherme@mail.com")
    setSubject("Uma oportunidade para a {{empresa}}")
    setMessage(defaultMessage)
  }

  const save = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  const preview = (text: string) => text.replaceAll("{{empresa}}", "Loja Alpha")

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950">
      {menuOpen && (
        <button aria-label="Fechar menu" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setMenuOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col bg-[#11182b] text-white transition-transform duration-200 lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-white/7 px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-violet-600 shadow-lg shadow-violet-950/30"><Mail className="size-[19px]" /></span>
            <span className="text-[18px] font-bold tracking-tight">Prospect Mail</span>
          </Link>
          <button className="text-slate-400 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X className="size-5" /></button>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-6">
          <Link href="/dashboard" className="flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
            <Send className="size-[18px]" /> Disparos
          </Link>
          <Link href="/settings" className="flex h-12 items-center gap-3 rounded-lg bg-white/10 px-4 text-sm font-semibold shadow-sm">
            <Settings className="size-[18px]" /> Configurações
          </Link>
        </nav>

        <div className="border-t border-white/8 p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-700 text-xs font-bold">GB</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Guilherme Branco</p>
              <p className="truncate text-xs text-slate-400">guilherme@mail.com</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[250px]">
        <header className="border-b border-slate-200 bg-[#fafbfe]">
          <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-7 lg:px-9 lg:pt-7">
            <div className="flex items-start gap-3">
              <button className="mt-1 grid size-9 place-items-center rounded-lg border bg-white lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu className="size-5" /></button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-[30px]">Configurações</h1>
                <p className="mt-1 text-sm text-slate-500">Configure os canais, modelos de mensagem e variáveis de personalização.</p>
              </div>
            </div>

            <nav className="mt-6 flex gap-2 overflow-x-auto" aria-label="Seções de configuração">
              {tabs.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setActiveTab(label)}
                  className={`flex h-12 shrink-0 items-center gap-2 border-b-2 px-5 text-sm font-semibold transition ${activeTab === label ? "border-violet-700 text-violet-700" : "border-transparent text-slate-600 hover:text-slate-950"}`}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-7 lg:px-9">
          {activeTab !== "Canais" ? (
            <section className="grid min-h-[480px] place-items-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div>
                <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-violet-50 text-violet-700"><SlidersHorizontal className="size-6" /></span>
                <h2 className="text-xl font-bold">{activeTab}</h2>
                <p className="mt-2 max-w-sm text-sm text-slate-500">Esta seção está pronta para receber suas configurações de {activeTab.toLowerCase()}.</p>
              </div>
            </section>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
              <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
                <h2 className="mb-5 text-lg font-bold">Canais de disparo</h2>
                <div className="space-y-3">
                  <button onClick={() => setChannel("email")} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${channel === "email" ? "border-violet-200 bg-violet-50/70" : "border-transparent hover:bg-slate-50"}`}>
                    <span className="grid size-10 place-items-center rounded-lg bg-white text-violet-700 shadow-sm"><Mail className="size-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 font-bold">E-mail <small className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Ativado</small></span>
                      <span className="mt-1 block text-xs text-slate-500">Configurar remetente, assinatura e limites</span>
                    </span>
                    <ChevronRight className="size-5 text-violet-700" />
                  </button>

                  <button onClick={() => setChannel("whatsapp")} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${channel === "whatsapp" ? "border-emerald-200 bg-emerald-50/60" : "border-transparent hover:bg-slate-50"}`}>
                    <span className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><MessageCircle className="size-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 font-bold">WhatsApp <small className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Em breve</small></span>
                      <span className="mt-1 block text-xs text-slate-500">Configurar número, modelos e envios</span>
                    </span>
                    <ChevronRight className="size-5 text-slate-500" />
                  </button>
                </div>

                <div className="mt-5 flex gap-3 rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                  <Info className="mt-0.5 size-4 shrink-0 text-slate-700" />
                  <div><strong className="mb-1 block text-slate-800">Novos canais em breve</strong>O envio por WhatsApp será liberado em uma próxima versão, com uso da API oficial.</div>
                </div>
              </aside>

              {channel === "whatsapp" ? (
                <section className="grid min-h-[550px] place-items-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <div>
                    <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600"><MessageCircle className="size-7" /></span>
                    <h2 className="text-xl font-bold">WhatsApp em breve</h2>
                    <p className="mt-2 max-w-sm text-sm text-slate-500">Estamos preparando a integração com a API oficial do WhatsApp.</p>
                  </div>
                </section>
              ) : (
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.04)] sm:p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-lg bg-violet-50 text-violet-700"><Mail className="size-5" /></span>
                      <div><h2 className="text-lg font-bold">E-mail</h2><p className="text-xs text-slate-500">Defina as configurações de envio e a mensagem padrão.</p></div>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                      <button type="button" role="switch" aria-checked={enabled} onClick={() => setEnabled(!enabled)} className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-violet-700" : "bg-slate-300"}`}>
                        <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition ${enabled ? "left-6" : "left-1"}`} />
                      </button>
                      {enabled ? "Ativado" : "Desativado"}
                    </label>
                  </div>

                  <div className="pt-5">
                    <h3 className="mb-3 text-sm font-bold">Remetente</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="text-xs font-semibold">Nome do remetente <span className="text-red-500">*</span>
                        <input value={sender} onChange={(event) => setSender(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                      </label>
                      <label className="text-xs font-semibold">E-mail de envio <span className="text-red-500">*</span>
                        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                      </label>
                    </div>

                    <h3 className="mb-3 mt-6 text-sm font-bold">Modelo de mensagem padrão</h3>
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                      <div>
                        <label className="block text-xs font-semibold">Assunto <span className="text-red-500">*</span>
                          <input value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                        </label>
                        <label className="mt-4 block text-xs font-semibold">Mensagem <span className="text-red-500">*</span></label>
                        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                          <div className="flex flex-wrap items-center gap-1 border-b bg-slate-50 px-2 py-2 text-slate-700">
                            {[Bold, Italic, Underline, LinkIcon, AlignLeft, AlignCenter, AlignRight, Redo2].map((Icon, index) => (
                              <button key={index} type="button" className="grid size-8 place-items-center rounded hover:bg-slate-200"><Icon className="size-4" /></button>
                            ))}
                            <button type="button" className="ml-auto flex h-8 items-center gap-1.5 rounded px-2 text-xs font-semibold hover:bg-slate-200"><Braces className="size-4" /> Variáveis <ChevronDown className="size-3" /></button>
                          </div>
                          <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="h-[245px] w-full resize-none p-4 text-sm leading-relaxed outline-none" />
                        </div>
                      </div>

                      <aside className="rounded-xl bg-slate-50 p-4">
                        <h4 className="mb-3 text-sm font-bold">Pré-visualização</h4>
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                          <div className="flex gap-1.5 bg-slate-200 px-3 py-2"><i className="size-2 rounded-full bg-slate-400" /><i className="size-2 rounded-full bg-slate-400" /><i className="size-2 rounded-full bg-slate-400" /></div>
                          <div className="border-b px-4 py-3 text-[10px] text-slate-500">
                            <p>De: <span className="ml-3 text-slate-700">{sender} &lt;{email}&gt;</span></p>
                            <p className="mt-2">Assunto: <strong className="ml-2 text-slate-800">{preview(subject)}</strong></p>
                          </div>
                          <div className="whitespace-pre-wrap p-4 text-xs leading-relaxed text-slate-800">{preview(message)}</div>
                        </div>
                      </aside>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button onClick={save} className="flex h-10 items-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white transition hover:bg-violet-800">
                        {saved ? <Check className="size-4" /> : <Save className="size-4" />} {saved ? "Configurações salvas" : "Salvar configurações"}
                      </button>
                      <button onClick={restoreDefaults} className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold transition hover:bg-slate-50"><RotateCcw className="size-4" /> Restaurar padrão</button>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
