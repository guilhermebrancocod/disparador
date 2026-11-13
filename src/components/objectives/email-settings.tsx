
"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  MessageCircle,
  Save,
  RotateCcw,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

type EmailSettings = {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
};

const defaultSettings: EmailSettings = {
  senderName: "Guilherme Branco",
  senderEmail: "",
  subject: "Uma oportunidade para a {{empresa}}",
  message: `Olá, {{empresa}}!

Tudo bem?

Trabalho com desenvolvimento de sistemas e automação de processos para empresas.

Gostaria de apresentar algumas soluções que podem ajudar no seu negócio.

Podemos agendar uma breve conversa?

Atenciosamente,
Guilherme Branco`,
};

export function EmailSettings() {
  const [settings, setSettings] =
    useState<EmailSettings>(defaultSettings);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("prospect-email-settings");

    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {
        console.error("Configurações locais inválidas");
      }
    }
  }, []);

  function update<K extends keyof EmailSettings>(
    field: K,
    value: EmailSettings[K]
  ) {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function saveSettings() {
    localStorage.setItem(
      "prospect-email-settings",
      JSON.stringify(settings)
    );
    setSaved(true);
  }

  function restoreSettings() {
    setSettings(defaultSettings);
    localStorage.removeItem("prospect-email-settings");
    setSaved(false);
  }

  function preview(text: string) {
    return text.replaceAll("{{empresa}}", "Loja Alpha");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Configure seus canais e modelos de mensagem.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Canais de disparo</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Mail className="size-5 text-violet-600" />
                <span className="font-medium">E-mail</span>
              </div>
              <Badge>Disponível</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 opacity-60">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-5 text-green-600" />
                <span className="font-medium">WhatsApp</span>
              </div>
              <Badge variant="secondary">Em breve</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuração de e-mail</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome do remetente</Label>
                <Input
                  value={settings.senderName}
                  onChange={(e) =>
                    update("senderName", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>E-mail do remetente</Label>
                <Input
                  type="email"
                  placeholder="seuemail@gmail.com"
                  value={settings.senderEmail}
                  onChange={(e) =>
                    update("senderEmail", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input
                value={settings.subject}
                onChange={(e) =>
                  update("subject", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                rows={10}
                value={settings.message}
                onChange={(e) =>
                  update("message", e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Variável disponível: {"{{empresa}}"}
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Eye className="size-4" />
                <h3 className="font-semibold">Pré-visualização</h3>
              </div>

              <p className="text-sm">
                <strong>De:</strong> {settings.senderName} &lt;
                {settings.senderEmail || "seuemail@gmail.com"}&gt;
              </p>

              <p className="mt-2 text-sm">
                <strong>Assunto:</strong> {preview(settings.subject)}
              </p>

              <hr className="my-4" />

              <p className="whitespace-pre-wrap text-sm">
                {preview(settings.message)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={saveSettings}>
                <Save className="mr-2 size-4" />
                Salvar configurações
              </Button>

              <Button
                variant="outline"
                onClick={restoreSettings}
              >
                <RotateCcw className="mr-2 size-4" />
                Restaurar padrão
              </Button>
            </div>

            {saved && (
              <p className="text-sm text-green-600">
                Configurações salvas neste navegador.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}