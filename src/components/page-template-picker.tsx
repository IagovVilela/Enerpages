"use client";

import { PAGE_TEMPLATE_META, type PageTemplateId } from "@/puck/page-templates";
import { cn } from "@/lib/cn";

export function PageTemplatePicker({
  open,
  busy,
  selected,
  onClose,
  onPick,
  title = "Escolha um layout completo",
  description = "Cada modelo tem composição, cores e tipografia próprias. Você pode trocar depois no editor.",
}: {
  open: boolean;
  busy?: boolean;
  selected?: PageTemplateId | null;
  onClose?: () => void;
  onPick: (id: PageTemplateId) => void;
  title?: string;
  description?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      {onClose ? (
        <button type="button" className="absolute inset-0 bg-black/45" aria-label="Fechar" onClick={onClose} />
      ) : (
        <div className="absolute inset-0 bg-black/45" aria-hidden />
      )}
      <div className="relative z-[1] max-h-[min(92svh,720px)] w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--studio-line)] bg-[var(--studio-bg)] shadow-2xl max-sm:max-h-[92svh] max-sm:rounded-t-2xl max-sm:rounded-b-none">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--studio-line)] px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Modelos de página</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
            <p className="mt-1 max-w-xl text-sm text-neutral-600 max-sm:text-xs">{description}</p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs text-neutral-600 hover:bg-white"
            >
              Fechar
            </button>
          ) : null}
        </div>
        <div className="grid max-h-[min(70vh,560px)] gap-3 overflow-y-auto p-4 sm:grid-cols-2 sm:p-5 max-sm:max-h-[calc(92svh-7rem)]">
          {PAGE_TEMPLATE_META.map((tpl) => {
            const active = selected === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                disabled={busy}
                onClick={() => onPick(tpl.id)}
                className={cn(
                  "group rounded-xl border p-3 text-left transition disabled:opacity-50",
                  active
                    ? "border-[var(--studio-accent)] bg-white"
                    : "border-[var(--studio-line)] bg-white/70 hover:border-[var(--studio-accent)]/50 hover:bg-white",
                )}
              >
                <div
                  className="mb-3 h-16 overflow-hidden rounded-lg border border-[var(--studio-line)]"
                  style={{ background: `linear-gradient(135deg, ${tpl.swatch} 0%, #09090b 72%)` }}
                >
                  <div className="flex h-full items-end p-2">
                    <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/85">{tpl.vibe}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold">{tpl.label}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{tpl.tagline}</p>
                <p className="mt-2 font-mono text-[10px] text-neutral-400">{tpl.layoutHint}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
