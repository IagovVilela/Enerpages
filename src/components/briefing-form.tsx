"use client";

import { useRef, useState, type FormEvent } from "react";
import { createPage } from "@/actions/studio";
import { ProposalPreviewModal } from "@/components/proposal-preview";
import { RequestProgress } from "@/components/request-progress";
import { normalizeSlug } from "@/lib/slug";
import { SEGMENTS, type PageDocument } from "@/puck/schema";

type Proposal = { label: string; direction: string; source: "ai" | "fallback"; data: PageDocument };

export function BriefingForm() {
  const busyRef = useRef(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [warning, setWarning] = useState("");
  const [pending, setPending] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [clientName, setClientName] = useState("");
  const [slug, setSlug] = useState("");
  const [preview, setPreview] = useState<Proposal | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current || pending || opening) return;

    const formData = new FormData(event.currentTarget);
    const briefing = Object.fromEntries(formData.entries());
    if (!String(briefing.slug || "").trim()) {
      setError("Informe um subdomínio antes de gerar (ex.: pizzaria-bom-peregrino).");
      return;
    }
    if (!String(briefing.clientName || "").trim()) {
      setError("Informe o nome do cliente.");
      return;
    }

    busyRef.current = true;
    setPending(true);
    setError("");
    setWarning("");

    const controller = new AbortController();
    const kill = window.setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(briefing),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as
        | { proposals?: Proposal[]; warning?: string; error?: string }
        | null;
      if (!response.ok || !payload?.proposals) {
        setError(payload?.error || "Não foi possível gerar. Tente de novo em instantes.");
        return;
      }
      setProposals(payload.proposals);
      setWarning(payload.warning || "");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setError("A geração demorou demais e foi interrompida. Tente de novo — o gerador local responde mais rápido.");
      } else {
        setError("Falha de rede ao gerar propostas. Verifique a conexão e tente outra vez.");
      }
    } finally {
      window.clearTimeout(kill);
      busyRef.current = false;
      setPending(false);
    }
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
    if (busyRef.current || pending || opening) return;
    const meta = requireMeta();
    if (!meta) return;
    busyRef.current = true;
    setOpening(true);
    setError("");
    try {
      const result = await createPage({
        clientName: meta.nextName,
        segment: meta.segment,
        slug: meta.nextSlug,
        data: proposal.data,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Hard navigation evita ficar preso no modal se o App Router falhar ao hidratar.
      window.location.assign(`/pages/${result.id}`);
    } catch {
      setError("Não foi possível abrir o editor. Tente de novo.");
    } finally {
      busyRef.current = false;
      setOpening(false);
    }
  }

  const locked = pending || opening;

  return (
    <div className="grid gap-8">
      <p className="text-sm text-neutral-600">
        Gere propostas, <strong>visualize</strong> como ficou e depois <strong>edite no Puck</strong> para ajustar qualquer ponto.
        Sem chave de IA, as propostas locais ainda funcionam.
      </p>
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2" aria-busy={locked}>
        <input
          className="border bg-white px-3 py-2 disabled:opacity-60"
          name="clientName"
          placeholder="Nome"
          required
          disabled={locked}
          value={clientName}
          onChange={(event) => {
            const value = event.target.value;
            setClientName(value);
            if (!slug || slug === normalizeSlug(clientName)) setSlug(normalizeSlug(value));
          }}
        />
        <input
          className="border bg-white px-3 py-2 disabled:opacity-60"
          name="slug"
          placeholder="subdominio (obrigatório)"
          required
          disabled={locked}
          value={slug}
          onChange={(event) => setSlug(normalizeSlug(event.target.value))}
        />
        <select className="border bg-white px-3 py-2 disabled:opacity-60" name="segment" defaultValue="local" disabled={locked}>
          {SEGMENTS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select className="border bg-white px-3 py-2 disabled:opacity-60" name="goal" defaultValue="captar" disabled={locked}>
          <option value="vender">Vender</option>
          <option value="agendar">Agendar</option>
          <option value="captar">Captar contato</option>
        </select>
        <textarea
          className="border bg-white px-3 py-2 md:col-span-2 disabled:opacity-60"
          name="audience"
          placeholder="Público"
          disabled={locked}
        />
        <textarea
          className="border bg-white px-3 py-2 md:col-span-2 disabled:opacity-60"
          name="tone"
          placeholder="Tom de voz"
          disabled={locked}
        />
        <textarea
          className="border bg-white px-3 py-2 md:col-span-2 disabled:opacity-60"
          name="differentials"
          placeholder="Diferenciais"
          disabled={locked}
        />
        <textarea
          className="border bg-white px-3 py-2 md:col-span-2 disabled:opacity-60"
          name="services"
          placeholder="Serviços, separados por vírgula"
          disabled={locked}
        />
        <input
          className="border bg-white px-3 py-2 disabled:opacity-60"
          name="colors"
          placeholder="Cor, se houver (#8f3d2b)"
          disabled={locked}
        />
        <input
          className="border bg-white px-3 py-2 disabled:opacity-60"
          name="references"
          placeholder="Referências"
          disabled={locked}
        />
        <button
          className="bg-[var(--studio-ink)] px-4 py-3 text-sm text-[var(--studio-bg)] disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
          disabled={locked}
          type="submit"
        >
          {pending ? "Gerando propostas…" : "Gerar 3 propostas"}
        </button>
      </form>

      <RequestProgress active={pending} />
      <RequestProgress
        active={opening}
        label="Abrindo no editor…"
        steps={["Criando a página…", "Preparando o studio…", "Quase lá…"]}
      />

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
            <button className="border px-3 py-2 text-sm disabled:opacity-50" type="button" disabled={locked} onClick={() => setPreview(proposal)}>
              Visualizar
            </button>
            <button
              className="bg-[var(--studio-ink)] px-3 py-2 text-sm text-[var(--studio-bg)] disabled:opacity-50"
              type="button"
              disabled={locked}
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
        error={error}
        onClose={() => {
          if (!opening) {
            setPreview(null);
            setError("");
          }
        }}
        onEdit={() => {
          if (preview && !opening) void openInEditor(preview);
        }}
      />
    </div>
  );
}
