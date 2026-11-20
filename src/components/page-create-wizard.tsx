"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPage } from "@/actions/studio";
import { TEMPLATE_SEGMENT } from "@/lib/ai/segment-roster";
import { segmentLabel } from "@/lib/segment-labels";
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
  const [services, setServices] = useState("");
  const [tone, setTone] = useState("");
  const [goal, setGoal] = useState<"vender" | "agendar" | "captar">("captar");
  const [busy, setBusy] = useState<"ai" | "model" | null>(null);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState("");

  async function submit(useAi: boolean) {
    if (!templateId || !clientName.trim() || !slug.trim()) return;
    setBusy(useAi ? "ai" : "model");
    setError("");
    setCreatedId("");
    let result: Awaited<ReturnType<typeof createPage>>;
    try {
      result = await createPage({
        clientName: clientName.trim(),
        slug: slug.trim().toLowerCase(),
        segment,
        templateId,
        useAi,
        services: services.trim(),
        tone: tone.trim(),
        goal,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setError(
        message === "Failed to fetch"
          ? "A ligação com o estúdio caiu. Recarregue a página e tente de novo."
          : "Não foi possível criar a página. Tente de novo.",
      );
      setBusy(null);
      return;
    }
    if (!result.ok) {
      setError(result.error);
      setBusy(null);
      return;
    }
    if (result.warning) {
      setCreatedId(result.id);
      setError(result.warning);
      setBusy(null);
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
              ? "O modelo define o layout. A IA escreve os textos em cima dele, sem trocar as seções. Quer 3 layouts do mesmo segmento? Use o briefing."
              : "Conte o que o cliente oferece. A IA reescreve a página e o editor abre em seguida."}
          </p>
        </div>
        <div className="grid gap-2 justify-items-end">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--studio-accent)]">
            Passo {step} de 2
          </p>
          {step === 1 ? (
            <a
              href="/briefing"
              className="text-xs font-medium text-neutral-600 underline-offset-2 hover:underline"
            >
              Gerar 3 propostas do segmento →
            </a>
          ) : null}
        </div>
      </div>

      {step === 1 ? (
        <div className="grid gap-8">
          {PAGE_TEMPLATE_META.filter((tpl) => tpl.id === "blank").map((tpl) => (
            <section key={tpl.id} className="grid gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Em branco</h2>
              <button
                type="button"
                onClick={() => setTemplateId(tpl.id)}
                className={cn(
                  "max-w-md rounded-xl border p-3 text-left transition",
                  templateId === tpl.id ? "border-[var(--studio-accent)] bg-white" : "border-[var(--studio-line)] bg-white/70 hover:bg-white",
                )}
              >
                <p className="text-sm font-semibold">{tpl.label}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{tpl.tagline}</p>
              </button>
            </section>
          ))}
          {SEGMENTS.map((segment) => {
            const items = PAGE_TEMPLATE_META.filter((tpl) => tpl.id !== "blank" && TEMPLATE_SEGMENT[tpl.id] === segment);
            if (!items.length) return null;
            return (
              <section key={segment} className="grid gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{segmentLabel(segment)}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((tpl) => {
                    const active = templateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setTemplateId(tpl.id);
                          setSegment(segment);
                        }}
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
              </section>
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
                  {segmentLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            O que oferece
            <textarea
              className="min-h-24 border px-3 py-2"
              value={services}
              onChange={(event) => setServices(event.target.value)}
              placeholder="Consultoria de interiores, projeto e acompanhamento de obra."
            />
          </label>
          <label className="grid gap-1 text-sm">
            Tom
            <input
              className="border px-3 py-2"
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              placeholder="Direto, calmo, sem jargão"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Objetivo
            <select
              className="border px-3 py-2"
              value={goal}
              onChange={(event) => setGoal(event.target.value as "vender" | "agendar" | "captar")}
            >
              <option value="vender">Vender</option>
              <option value="agendar">Agendar</option>
              <option value="captar">Captar contato</option>
            </select>
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {createdId ? (
            <button
              type="button"
              onClick={() => router.push(`/pages/${createdId}`)}
              className="justify-self-start border border-[var(--studio-ink)] px-3 py-2 text-sm"
            >
              Abrir editor mesmo assim
            </button>
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          disabled={busy !== null || step === 1}
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy !== null || !clientName.trim() || !slug.trim()}
              onClick={() => submit(false)}
              className="border border-[var(--studio-line)] px-3 py-2 text-sm disabled:opacity-50"
            >
              {busy === "model" ? "Criando…" : "Só o modelo"}
            </button>
            <button
              type="button"
              disabled={busy !== null || !clientName.trim() || !slug.trim()}
              onClick={() => submit(true)}
              className="bg-[var(--studio-ink)] px-4 py-2 text-sm text-[var(--studio-bg)] disabled:opacity-50"
            >
              {busy === "ai" ? "A IA está escrevendo…" : "Criar com IA"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
