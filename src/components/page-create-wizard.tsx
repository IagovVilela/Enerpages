"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPage } from "@/actions/studio";
import { PAGE_TEMPLATE_META, type PageTemplateId } from "@/puck/page-templates";
import { SEGMENTS } from "@/puck/schema";
import { cn } from "@/lib/cn";

type Step = 1 | 2;

export function PageCreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [templateId, setTemplateId] = useState<PageTemplateId | null>(null);
  const [clientName, setClientName] = useState("");
  const [slug, setSlug] = useState("");
  const [segment, setSegment] = useState<(typeof SEGMENTS)[number]>("local");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!templateId || !clientName.trim() || !slug.trim()) return;
    setBusy(true);
    setError("");
    const result = await createPage({
      clientName: clientName.trim(),
      slug: slug.trim().toLowerCase(),
      segment,
      templateId,
    });
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    router.push(`/pages/${result.id}`);
  }

  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em]">Nova página</p>
          <h1 className="text-4xl tracking-tight">
            {step === 1 ? "Escolha um modelo" : "Dados do cliente"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-neutral-600">
            {step === 1
              ? "Comece com um layout pronto. Depois o editor abre direto para você ajustar."
              : "Defina nome, subdomínio e segmento. Ao criar, o editor abre direto."}
          </p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--studio-accent)]">
          Passo {step} de 2
        </p>
      </div>

      {step === 1 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {PAGE_TEMPLATE_META.map((tpl) => {
            const active = templateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setTemplateId(tpl.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  active ? "border-[var(--studio-accent)] bg-white" : "border-[var(--studio-line)] bg-white/70 hover:bg-white",
                )}
              >
                <div
                  className="mb-3 h-14 overflow-hidden rounded-lg border border-[var(--studio-line)]"
                  style={{ background: `linear-gradient(135deg, ${tpl.swatch} 0%, #0b0e15 72%)` }}
                />
                <p className="text-sm font-semibold">{tpl.label}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{tpl.tagline}</p>
                <p className="mt-2 font-mono text-[10px] text-neutral-400">{tpl.layoutHint}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-4 border border-[var(--studio-line)] bg-white p-5">
          <label className="grid gap-1 text-sm">
            Nome do cliente
            <input
              className="border px-3 py-2"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Atelier Luna"
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            Subdomínio
            <input
              className="border px-3 py-2"
              value={slug}
              onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="atelier-luna"
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            Segmento
            <select
              className="border px-3 py-2"
              value={segment}
              onChange={(event) => setSegment(event.target.value as (typeof SEGMENTS)[number])}
            >
              {SEGMENTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          disabled={busy || step === 1}
          onClick={() => setStep(1)}
          className="border border-[var(--studio-line)] px-3 py-2 text-sm disabled:opacity-40"
        >
          Voltar
        </button>
        {step === 1 ? (
          <button
            type="button"
            disabled={!templateId}
            onClick={() => setStep(2)}
            className="bg-[var(--studio-ink)] px-4 py-2 text-sm text-[var(--studio-bg)] disabled:opacity-50"
          >
            Usar este modelo
          </button>
        ) : (
          <button
            type="button"
            disabled={busy || !clientName.trim() || !slug.trim()}
            onClick={submit}
            className="bg-[var(--studio-ink)] px-4 py-2 text-sm text-[var(--studio-bg)] disabled:opacity-50"
          >
            {busy ? "Criando…" : "Criar e abrir editor"}
          </button>
        )}
      </div>
    </main>
  );
}
