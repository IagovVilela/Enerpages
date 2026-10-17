"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BG_ARTS,
  BODY_FONTS,
  DISPLAY_FONTS,
  PERSONALITIES,
  SEGMENTS,
} from "@/puck/schema";
import { PAGE_TEMPLATE_META } from "@/puck/page-templates";
import { FONT_BY_PERSONALITY } from "@/lib/ai/archetypes";
import { canvasBgArtStyle } from "@/lib/canvas/bg-art";
import { MaskedPhoneInput } from "@/components/masked-phone-input";
import { formatInstagramHandle } from "@/lib/br-input-masks";
import { emptyIntake, type IntakePayload } from "@/lib/intake/schema";
import { cn } from "@/lib/cn";
import { fontAssets } from "@/puck/fonts";

const STEPS = [
  { id: 1, title: "Negócio", blurb: "Quem você é e o que oferece." },
  { id: 2, title: "Contato", blurb: "Como o visitante fala com você." },
  { id: 3, title: "Visual", blurb: "Cores, tipografia e clima da marca." },
  { id: 4, title: "Textos", blurb: "Tom de voz e mensagens principais." },
  { id: 5, title: "Modelo", blurb: "Escolha um ponto de partida de layout." },
] as const;

type Props = {
  token: string;
  initial: IntakePayload;
  locked?: boolean;
  lockMessage?: string;
};

function storageKey(token: string) {
  return `enerpages.intake.${token}`;
}

export function IntakeWizard({ token, initial, locked, lockMessage }: Props) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<IntakePayload>(initial);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(Boolean(locked));

  useEffect(() => {
    if (locked) return;
    try {
      const raw = window.localStorage.getItem(storageKey(token));
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<IntakePayload>;
      setData(emptyIntake({ ...initial, ...parsed }));
    } catch {
      /* ignore */
    }
  }, [token, locked, initial]);

  useEffect(() => {
    if (locked || done) return;
    try {
      window.localStorage.setItem(storageKey(token), JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data, token, locked, done]);

  const progress = useMemo(() => (step / STEPS.length) * 100, [step]);

  function patch<K extends keyof IntakePayload>(key: K, value: IntakePayload[K]) {
    setData((prev) => {
      if (key === "personality") {
        const personality = value as IntakePayload["personality"];
        const fonts = FONT_BY_PERSONALITY[personality];
        return {
          ...prev,
          personality,
          fontDisplay: fonts.display,
          fontBody: fonts.body,
        };
      }
      return { ...prev, [key]: value };
    });
  }

  const previewFonts = fontAssets(data.fontDisplay, data.fontBody);
  const previewArt = canvasBgArtStyle(data.bgArt, {
    primary: safeHex(data.primaryColor),
    strength: 55,
    preview: true,
  });

  function validateStep(current: number) {
    if (current === 1) {
      if (data.clientName.trim().length < 2) return "Informe o nome do negócio.";
      if (!data.services.trim()) return "Liste ao menos um serviço ou oferta.";
    }
    if (current === 2) {
      if (!data.whatsapp.trim() && !data.phone.trim() && !data.email.trim()) {
        return "Informe WhatsApp, telefone ou e-mail.";
      }
    }
    if (current === 5 && !data.templateId) return "Escolha um modelo.";
    return "";
  }

  function next() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep((value) => Math.min(STEPS.length, value + 1));
  }

  function back() {
    setError("");
    setStep((value) => Math.max(1, value - 1));
  }

  async function submit() {
    const message = validateStep(5) || validateStep(1) || validateStep(2);
    if (message) {
      setError(message);
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/intake/${token}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error || "Não foi possível enviar. Tente de novo.");
        return;
      }
      try {
        window.localStorage.removeItem(storageKey(token));
      } catch {
        /* ignore */
      }
      setDone(true);
    } catch {
      setError("Falha de rede. Verifique a conexão e tente outra vez.");
    } finally {
      setPending(false);
    }
  }

  if (done || locked) {
    return (
      <div className="mx-auto max-w-xl border border-[var(--studio-line)] bg-white p-8 text-center shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--studio-accent)]">Pronto</p>
        <h1 className="mt-2 text-3xl tracking-tight">Recebemos suas preferências</h1>
        <p className="mt-3 text-sm text-neutral-600">
          {lockMessage ||
            "A equipe monta sua página com base no que você enviou e avisa quando estiver pronta para revisar."}
        </p>
      </div>
    );
  }

  const current = STEPS[step - 1];

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <header className="grid gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--studio-accent)]">
          Briefing do cliente · etapa {step} de {STEPS.length}
        </p>
        <h1 className="text-3xl tracking-tight sm:text-4xl">{current.title}</h1>
        <p className="text-sm text-neutral-600">{current.blurb}</p>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--studio-line)]">
          <div className="h-full bg-[var(--studio-ink)] transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="grid gap-4 border border-[var(--studio-line)] bg-white p-5 sm:p-6">
        {step === 1 ? (
          <>
            <Field label="Nome do negócio">
              <input className="border px-3 py-2" value={data.clientName} onChange={(e) => patch("clientName", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Segmento">
                <select className="border px-3 py-2" value={data.segment} onChange={(e) => patch("segment", e.target.value as IntakePayload["segment"])}>
                  {SEGMENTS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Objetivo principal">
                <select className="border px-3 py-2" value={data.goal} onChange={(e) => patch("goal", e.target.value as IntakePayload["goal"])}>
                  <option value="captar">Captar contato</option>
                  <option value="agendar">Agendar</option>
                  <option value="vender">Vender</option>
                </select>
              </Field>
            </div>
            <Field label="Público">
              <textarea className="min-h-20 border px-3 py-2" value={data.audience} onChange={(e) => patch("audience", e.target.value)} placeholder="Para quem é a página?" />
            </Field>
            <Field label="Serviços / ofertas">
              <textarea className="min-h-24 border px-3 py-2" value={data.services} onChange={(e) => patch("services", e.target.value)} placeholder="Separe por vírgula ou linha" />
            </Field>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Field label="WhatsApp">
              <MaskedPhoneInput
                mode="whatsapp"
                className="border px-3 py-2"
                value={data.whatsapp}
                onChange={(value) => patch("whatsapp", value)}
                placeholder="(11) 99999-0000 ou +1555…"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Telefone">
                <MaskedPhoneInput
                  className="border px-3 py-2"
                  value={data.phone}
                  onChange={(value) => patch("phone", value)}
                  placeholder="(11) 99999-0000"
                />
              </Field>
              <Field label="E-mail">
                <input className="border px-3 py-2" type="email" value={data.email} onChange={(e) => patch("email", e.target.value)} />
              </Field>
            </div>
            <Field label="Instagram">
              <input
                className="border px-3 py-2"
                value={data.instagram}
                onChange={(e) => patch("instagram", formatInstagramHandle(e.target.value))}
                placeholder="@sua_marca"
                autoComplete="off"
              />
            </Field>
            <Field label="Endereço / área de atendimento">
              <textarea className="min-h-20 border px-3 py-2" value={data.address} onChange={(e) => patch("address", e.target.value)} />
            </Field>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div className="grid gap-1.5">
              <Field label="Personalidade">
                <select className="border px-3 py-2" value={data.personality} onChange={(e) => patch("personality", e.target.value as IntakePayload["personality"])}>
                  {PERSONALITIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
              <p className="text-[11px] text-neutral-500">
                Troca tipografia sugerida (título + texto). Você ainda pode ajustar as fontes abaixo.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cor principal">
                <div className="flex gap-2">
                  <input type="color" className="h-10 w-14 border bg-white p-1" value={safeHex(data.primaryColor)} onChange={(e) => patch("primaryColor", e.target.value)} />
                  <input className="flex-1 border px-3 py-2" value={data.primaryColor} onChange={(e) => patch("primaryColor", e.target.value)} />
                </div>
              </Field>
              <Field label="Cor de fundo">
                <div className="flex gap-2">
                  <input type="color" className="h-10 w-14 border bg-white p-1" value={safeHex(data.backgroundColor)} onChange={(e) => patch("backgroundColor", e.target.value)} />
                  <input className="flex-1 border px-3 py-2" value={data.backgroundColor} onChange={(e) => patch("backgroundColor", e.target.value)} />
                </div>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fonte de títulos">
                <select className="border px-3 py-2" value={data.fontDisplay} onChange={(e) => patch("fontDisplay", e.target.value as IntakePayload["fontDisplay"])}>
                  {DISPLAY_FONTS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fonte de texto">
                <select className="border px-3 py-2" value={data.fontBody} onChange={(e) => patch("fontBody", e.target.value as IntakePayload["fontBody"])}>
                  {BODY_FONTS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Arte de fundo">
              <select className="border px-3 py-2" value={data.bgArt} onChange={(e) => patch("bgArt", e.target.value as IntakePayload["bgArt"])}>
                {BG_ARTS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <div
              className={cn("border border-[var(--studio-line)] p-4", previewFonts.className)}
              style={{
                backgroundColor: safeHex(data.backgroundColor),
                color: "#1c1915",
                ...previewArt,
              }}
            >
              <p
                className="text-xs uppercase tracking-[0.16em]"
                style={{ color: safeHex(data.primaryColor) }}
              >
                Prévia · {data.personality} · {data.bgArt}
              </p>
              <p
                className="mt-2 text-3xl"
                style={{ fontFamily: `var(${previewFonts.displayVar}), serif` }}
              >
                {data.clientName || "Sua marca"}
              </p>
              <p
                className="mt-1 text-sm"
                style={{ fontFamily: `var(${previewFonts.bodyVar}), sans-serif` }}
              >
                {data.tagline || "Texto de apoio da marca."}
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                {data.fontDisplay} + {data.fontBody}
              </p>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Field label="Tom de voz">
              <input className="border px-3 py-2" value={data.tone} onChange={(e) => patch("tone", e.target.value)} placeholder="Ex.: direto, acolhedor, técnico" />
            </Field>
            <Field label="Diferenciais">
              <textarea className="min-h-24 border px-3 py-2" value={data.differentials} onChange={(e) => patch("differentials", e.target.value)} />
            </Field>
            <Field label="Título principal (hero)">
              <input className="border px-3 py-2" value={data.headline} onChange={(e) => patch("headline", e.target.value)} />
            </Field>
            <Field label="Frase de apoio">
              <textarea className="min-h-20 border px-3 py-2" value={data.tagline} onChange={(e) => patch("tagline", e.target.value)} />
            </Field>
            <Field label="Referências (sites, concorrentes, mood)">
              <textarea className="min-h-20 border px-3 py-2" value={data.references} onChange={(e) => patch("references", e.target.value)} />
            </Field>
          </>
        ) : null}

        {step === 5 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {PAGE_TEMPLATE_META.map((template) => {
              const active = data.templateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  className={cn(
                    "grid gap-2 border p-4 text-left transition",
                    active ? "border-[var(--studio-ink)] bg-[var(--studio-ink)] text-[var(--studio-bg)]" : "border-[var(--studio-line)] bg-white hover:border-[var(--studio-ink)]",
                  )}
                  onClick={() => patch("templateId", template.id)}
                >
                  <span className="h-2 w-10" style={{ background: active ? "currentColor" : template.swatch }} />
                  <strong className="text-lg">{template.label}</strong>
                  <span className={cn("text-sm", active ? "opacity-90" : "text-neutral-600")}>{template.tagline}</span>
                  <span className="text-[11px] uppercase tracking-[0.12em] opacity-70">{template.layoutHint}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[var(--studio-accent)]">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="border px-4 py-2 text-sm disabled:opacity-40" onClick={back} disabled={step === 1 || pending}>
          Voltar
        </button>
        {step < STEPS.length ? (
          <button type="button" className="bg-[var(--studio-ink)] px-4 py-2 text-sm text-[var(--studio-bg)]" onClick={next}>
            Continuar
          </button>
        ) : (
          <button
            type="button"
            className="bg-[var(--studio-ink)] px-4 py-2 text-sm text-[var(--studio-bg)] disabled:opacity-50"
            disabled={pending}
            onClick={() => void submit()}
          >
            {pending ? "Enviando…" : "Enviar preferências"}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

function safeHex(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#8f3d2b";
}
