"use client";

import { useState } from "react";
import { PAGE_TEMPLATE_META, type CanvasPageTemplateId } from "@/lib/canvas/page-templates";
import { cn } from "@/lib/cn";

type Step = 1 | 2 | 3;

export function CanvasOnboarding({
  open,
  busy,
  onPickTemplate,
  onOpenTheme,
  onPublish,
  onSkip,
}: {
  open: boolean;
  busy?: boolean;
  onPickTemplate: (id: CanvasPageTemplateId) => void;
  onOpenTheme: () => void;
  onPublish: () => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [picked, setPicked] = useState<CanvasPageTemplateId | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/45" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[1] flex max-h-[min(94svh,780px)] w-full max-w-3xl flex-col overflow-hidden border border-[var(--studio-line)] bg-[var(--studio-bg)] shadow-2xl max-sm:rounded-b-none"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--studio-line)] px-4 py-4 sm:px-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--studio-accent)]">
              Primeiros passos · {step} de 3
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-brand-display)] text-xl font-medium tracking-tight sm:text-2xl">
              {step === 1 ? "Escolha um modelo" : step === 2 ? "Ajuste o tema" : "Publique e veja no ar"}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-neutral-600">
              {step === 1
                ? "Comece com um layout pronto. Você pode trocar depois."
                : step === 2
                  ? "Cores e tipografia ficam no painel direito do editor."
                  : "Publicar atualiza o site que seus clientes veem (motor Ze)."}
            </p>
          </div>
          <button type="button" disabled={busy} onClick={onSkip} className="border border-[var(--studio-line)] px-3 py-1.5 text-xs">
            Pular
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {step === 1 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {PAGE_TEMPLATE_META.map((tpl) => {
                const active = picked === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    disabled={busy}
                    onClick={() => setPicked(tpl.id)}
                    className={cn(
                      "border p-3 text-left transition disabled:opacity-50",
                      active ? "border-[var(--studio-ink)] bg-white" : "border-[var(--studio-line)] hover:border-[var(--studio-ink)]/40",
                    )}
                  >
                    <div
                      className="mb-3 h-14 overflow-hidden border border-[var(--studio-line)]"
                      style={{ background: `linear-gradient(135deg, ${tpl.swatch} 0%, #1c1915 72%)` }}
                    />
                    <p className="font-medium">{tpl.label}</p>
                    <p className="mt-1 text-xs text-neutral-600">{tpl.tagline}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500">{tpl.vibe}</p>
                  </button>
                );
              })}
            </div>
          ) : null}
          {step === 2 ? (
            <div className="grid gap-3 text-sm">
              <p>No painel direito você ajusta cor primária, fundo, texto e arte de fundo.</p>
              <button
                type="button"
                className="w-fit border border-[var(--studio-line)] bg-white px-3 py-2"
                onClick={() => {
                  onOpenTheme();
                  setStep(3);
                }}
              >
                Entendi — ver tema
              </button>
            </div>
          ) : null}
          {step === 3 ? (
            <div className="grid gap-3 text-sm">
              <p>Quando estiver pronto, publique. O visitante vê o canvas Ze se você publicou neste ambiente.</p>
              <button
                type="button"
                className="w-fit bg-[var(--studio-ink)] px-4 py-2 text-[var(--studio-bg)] disabled:opacity-50"
                disabled={busy}
                onClick={onPublish}
              >
                Publicar agora
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 justify-between gap-2 border-t border-[var(--studio-line)] px-4 py-3">
          <button
            type="button"
            className="border px-3 py-2 text-sm disabled:opacity-40"
            disabled={step === 1 || busy}
            onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)))}
          >
            Voltar
          </button>
          {step === 1 ? (
            <button
              type="button"
              className="bg-[var(--studio-ink)] px-4 py-2 text-sm text-[var(--studio-bg)] disabled:opacity-50"
              disabled={!picked || busy}
              onClick={() => {
                if (!picked) return;
                onPickTemplate(picked);
                setStep(2);
              }}
            >
              Usar modelo
            </button>
          ) : step === 2 ? (
            <button type="button" className="bg-[var(--studio-ink)] px-4 py-2 text-sm text-[var(--studio-bg)]" onClick={() => setStep(3)}>
              Continuar
            </button>
          ) : (
            <button type="button" className="border px-4 py-2 text-sm" disabled={busy} onClick={onSkip}>
              Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function hasSeenCanvasOnboarding() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem("enerpages.canvasStudioSeen") === "1";
}

export function markCanvasOnboardingSeen() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("enerpages.canvasStudioSeen", "1");
}
