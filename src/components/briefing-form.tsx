"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPage } from "@/actions/studio";
import { ProposalPreviewModal } from "@/components/proposal-preview";
import { normalizeSlug } from "@/lib/slug";
import { SEGMENTS, type PageDocument } from "@/puck/schema";

type Proposal = { label: string; direction: string; source: "ai" | "fallback"; data: PageDocument };

export function BriefingForm() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [warning, setWarning] = useState("");
  const [pending, setPending] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [clientName, setClientName] = useState("");
  const [slug, setSlug] = useState("");
  const [preview, setPreview] = useState<Proposal | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    const briefing = Object.fromEntries(formData.entries());
    if (!String(briefing.slug || "").trim()) {
      setPending(false);
      setError("Informe um subdomínio antes de gerar (ex.: pizzaria-bom-peregrino).");
      return;
    }
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(briefing),
    });
    const payload = (await response.json()) as { proposals?: Proposal[]; warning?: string; error?: string };
    setPending(false);
    if (!response.ok || !payload.proposals) {
      setError(payload.error || "Não foi possível gerar.");
      return;
    }
    setProposals(payload.proposals);
    setWarning(payload.warning || "");
  }

  function requireMeta() {
    const form = document.querySelector("form");
    const data = new FormData(form || undefined);
    const nextSlug = slug || String(data.get("slug") || "");
    const nextName = clientName || String(data.get("clientName") || "Cliente");
    const segment = String(data.get("segment") || "local");
    if (!nextSlug.trim()) {
      setError("Informe um subdomínio no formulário acima.");
      return null;
    }
    if (!nextName.trim()) {
      setError("Informe o nome do cliente.");
      return null;
    }
    return { nextSlug, nextName, segment };
  }

  async function openInEditor(proposal: Proposal) {
    const meta = requireMeta();
    if (!meta) return;
    setOpening(true);
    setError("");
    const result = await createPage({
      clientName: meta.nextName,
      segment: meta.segment,
      slug: meta.nextSlug,
      data: proposal.data,
    });
    if (!result.ok) {
      setOpening(false);
      setError(result.error);
      return;
    }
    router.push(`/pages/${result.id}`);
  }

  return (
    <div className="grid gap-8">
      <p className="text-sm text-neutral-600">
        Gere propostas, <strong>visualize</strong> como ficou e depois <strong>edite no Puck</strong> para ajustar qualquer ponto.
        Sem chave de IA, as propostas locais ainda funcionam.
      </p>
      <form action={onSubmit} className="grid gap-3 md:grid-cols-2">
        <input
          className="border bg-white px-3 py-2"
          name="clientName"
          placeholder="Nome"
          required
          value={clientName}
          onChange={(event) => {
            const value = event.target.value;
            setClientName(value);
            if (!slug || slug === normalizeSlug(clientName)) setSlug(normalizeSlug(value));
          }}
        />
        <input
          className="border bg-white px-3 py-2"
          name="slug"
          placeholder="subdominio (obrigatório)"
          required
          value={slug}
          onChange={(event) => setSlug(normalizeSlug(event.target.value))}
        />
        <select className="border bg-white px-3 py-2" name="segment" defaultValue="local">
          {SEGMENTS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select className="border bg-white px-3 py-2" name="goal" defaultValue="captar">
          <option value="vender">Vender</option>
          <option value="agendar">Agendar</option>
          <option value="captar">Captar contato</option>
        </select>
        <textarea className="border bg-white px-3 py-2 md:col-span-2" name="audience" placeholder="Público" />
        <textarea className="border bg-white px-3 py-2 md:col-span-2" name="tone" placeholder="Tom de voz" />
        <textarea className="border bg-white px-3 py-2 md:col-span-2" name="differentials" placeholder="Diferenciais" />
        <textarea className="border bg-white px-3 py-2 md:col-span-2" name="services" placeholder="Serviços, separados por vírgula" />
        <input className="border bg-white px-3 py-2" name="colors" placeholder="Cor, se houver (#8f3d2b)" />
        <input className="border bg-white px-3 py-2" name="references" placeholder="Referências" />
        <button className="bg-[var(--studio-ink)] px-4 py-3 text-sm text-[var(--studio-bg)] md:col-span-2" disabled={pending} type="submit">
          {pending ? "Gerando propostas…" : "Gerar 3 propostas"}
        </button>
      </form>
      {error ? <p className="text-sm text-[var(--studio-accent)]">{error}</p> : null}
      {warning ? <p className="text-sm">{warning}</p> : null}
      <div className="grid gap-4 md:grid-cols-3">
        {proposals.map((proposal) => (
          <article key={proposal.label} className="grid gap-3 border border-[var(--studio-line)] bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em]">{proposal.source === "ai" ? "IA" : "Arquétipo"}</p>
            <h2 className="text-2xl">{proposal.label}</h2>
            <p className="text-sm">{proposal.direction}</p>
            <p className="text-sm">
              {proposal.data.root.props.theme.personality} · {proposal.data.content.length} blocos
            </p>
            <div className="flex h-16" style={{ background: proposal.data.root.props.theme.colors.background }}>
              <span className="m-3 h-3 w-10" style={{ background: proposal.data.root.props.theme.colors.primary }} />
            </div>
            <button className="border px-3 py-2 text-sm" type="button" onClick={() => setPreview(proposal)}>
              Visualizar
            </button>
            <button
              className="bg-[var(--studio-ink)] px-3 py-2 text-sm text-[var(--studio-bg)] disabled:opacity-50"
              type="button"
              disabled={opening}
              onClick={() => openInEditor(proposal)}
            >
              {opening ? "Abrindo…" : "Usar e editar no Puck"}
            </button>
          </article>
        ))}
      </div>

      <ProposalPreviewModal
        open={Boolean(preview)}
        proposal={preview}
        busy={opening}
        onClose={() => setPreview(null)}
        onEdit={() => {
          if (preview) void openInEditor(preview);
        }}
      />
    </div>
  );
}
