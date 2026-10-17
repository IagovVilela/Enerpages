"use client";

import { useState } from "react";
import { PAGE_TEMPLATE_META, type PageTemplateId } from "@/puck/page-templates";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "enerpages.studioSeen";

export function hasSeenStudioOnboarding() {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markStudioOnboardingSeen() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

type Step = 1 | 2 | 3;

type Props = {
  open: boolean;
  busy?: boolean;
  publicUrl: string;
  onPickTemplate: (id: PageTemplateId) => void;
  onOpenTheme: () => void;
  onPublish: () => void;
  onSkip: () => void;
};

export function StudioOnboarding({
  open,
  busy,
  publicUrl,
  onPickTemplate,
  onOpenTheme,
  onPublish,
  onSkip,
}: Props) {
  const [step, setStep] = useState<Step>(1);
  const [picked, setPicked] = useState<PageTemplateId | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/45" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-onboard-title"
        className="relative z-[1] flex max-h-[min(94svh,780px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--studio-line)] bg-[var(--studio-bg)] shadow-2xl max-sm:rounded-b-none"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--studio-line)] px-4 py-4 sm:px-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--studio-accent)]">
              Primeiros passos · {step} de 3
            </p>
            <h2 id="studio-onboard-title" className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              {step === 1 ? "Escolha um modelo" : step === 2 ? "Ajuste o tema" : "Publique e veja no ar"}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-neutral-600">
              {step === 1
                ? "Comece com um layout pronto. Você pode trocar depois."
                : step === 2
                  ? "Cores, tipografia e arte de fundo no painel Tema."
                  : "Publicar atualiza o site que o cliente vê no subdomínio."}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onSkip}
            className="shrink-0 rounded-lg border border-[var(--studio-line)] px-3 py-1.5 text-xs text-neutral-600 hover:bg-white"
          >
            Pular
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {step === 1 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {PAGE_TEMPLATE_META.slice(0, 8).map((tpl) => {
                const active = picked === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    disabled={busy}
                    onClick={() => setPicked(tpl.id)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition disabled:opacity-50",
                      active
                        ? "border-[var(--studio-accent)] bg-white"
                        : "border-[var(--studio-line)] bg-white/70 hover:border-[var(--studio-accent)]/50",
                    )}
                  >
                    <div
                      className="mb-3 h-14 overflow-hidden rounded-lg border border-[var(--studio-line)]"
                      style={{ background: `linear-gradient(135deg, ${tpl.swatch} 0%, #09090b 72%)` }}
                    />
                    <p className="text-sm font-semibold">{tpl.label}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{tpl.tagline}</p>
                  </button>
                );
              })}
            </div>
          ) : null}

          {step === 2 ? (
            <button
              type="button"
              className="w-full rounded-xl border border-[var(--studio-line)] bg-white/70 px-4 py-4 text-left transition hover:border-[var(--studio-accent)]/50"
              onClick={onOpenTheme}
            >
              <p className="text-sm font-semibold">Abrir painel de tema</p>
              <p className="mt-1 text-xs text-neutral-500">Cores, fundo, tipografia e forma da página.</p>
            </button>
          ) : null}

          {step === 3 ? (
            <div className="rounded-xl border border-[var(--studio-line)] bg-white/70 p-5">
              <p className="text-sm text-neutral-600">
                Ao publicar, o endereço{" "}
                <span className="font-medium text-[var(--studio-accent)]">{publicUrl}</span> passa a mostrar o rascunho
                atual.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[var(--studio-line)] px-4 py-3 sm:px-5">
          <button
            type="button"
            disabled={busy || step === 1}
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
            className="rounded-lg border border-[var(--studio-line)] px-3 py-2 text-sm text-neutral-600 disabled:opacity-40"
          >
            Voltar
          </button>
          {step === 1 ? (
            <button
              type="button"
              disabled={busy || !picked}
              onClick={() => {
                if (!picked) return;
                onPickTemplate(picked);
                setStep(2);
              }}
              className="rounded-lg bg-[var(--studio-ink)] px-4 py-2 text-sm font-semibold text-[var(--studio-bg)] disabled:opacity-50"
            >
              Usar este modelo
            </button>
          ) : null}
          {step === 2 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setStep(3)}
              className="rounded-lg bg-[var(--studio-ink)] px-4 py-2 text-sm font-semibold text-[var(--studio-bg)]"
            >
              Continuar
            </button>
          ) : null}
          {step === 3 ? (
            <button
              type="button"
              disabled={busy}
              onClick={onPublish}
              className="rounded-lg bg-[var(--studio-ink)] px-4 py-2 text-sm font-semibold text-[var(--studio-bg)] disabled:opacity-50"
            >
              Publicar e ver site
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
