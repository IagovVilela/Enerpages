"use client";

import { Render, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { useState } from "react";
import { config } from "@/puck/config";
import type { PageDocument } from "@/puck/schema";
import { cn } from "@/lib/cn";

type Viewport = "mobile" | "tablet" | "desktop";

const WIDTHS: Record<Viewport, number> = {
  mobile: 390,
  tablet: 768,
  desktop: 1280,
};

export function ProposalPreviewModal({
  open,
  proposal,
  busy,
  onClose,
  onEdit,
}: {
  open: boolean;
  proposal: { label: string; direction: string; data: PageDocument } | null;
  busy?: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [viewport, setViewport] = useState<Viewport>("desktop");

  if (!open || !proposal) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-[var(--studio-bg)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--studio-line)] px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Pré-visualização</p>
          <h2 className="text-lg font-semibold tracking-tight">{proposal.label}</h2>
          <p className="text-sm text-neutral-600">{proposal.direction}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {(
            [
              ["mobile", "Celular"],
              ["tablet", "Tablet"],
              ["desktop", "Desktop"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={cn(
                "border px-2 py-1",
                viewport === id ? "bg-[var(--studio-ink)] text-[var(--studio-bg)]" : "bg-white",
              )}
              onClick={() => setViewport(id)}
            >
              {label}
            </button>
          ))}
          <button type="button" className="border px-3 py-1.5" onClick={onClose} disabled={busy}>
            Voltar
          </button>
          <button
            type="button"
            className="bg-[var(--studio-ink)] px-3 py-1.5 text-[var(--studio-bg)] disabled:opacity-50"
            onClick={onEdit}
            disabled={busy}
          >
            {busy ? "Abrindo editor…" : "Editar no Puck"}
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto bg-neutral-200/60 p-4 md:p-8">
        <div
          className="mx-auto min-h-full overflow-hidden border border-[var(--studio-line)] bg-white shadow-lg"
          style={{ width: "100%", maxWidth: WIDTHS[viewport] }}
        >
          <div className="landing">
            <Render config={config} data={proposal.data as Data} />
          </div>
        </div>
      </div>
    </div>
  );
}
