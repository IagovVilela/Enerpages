"use client";

import { useRef, useState, type FormEvent } from "react";
import { linkIntakeToPage } from "@/actions/intake";
import { createPage } from "@/actions/studio";
import { ProposalPreviewModal } from "@/components/proposal-preview";
import { RequestProgress } from "@/components/request-progress";
import { applyIntakeToDocument, type IntakePayload } from "@/lib/intake/schema";
import { segmentLabel } from "@/lib/segment-labels";
import { normalizeSlug } from "@/lib/slug";
import { SEGMENTS, type Briefing, type PageDocument } from "@/puck/schema";

type Proposal = {
  label: string;
  direction: string;
  source: "ai" | "fallback";
  templateId?: string;
  data: PageDocument;
};

export function BriefingForm({
  initial,
  intakeId,
  intakePayloadJson,
}: {
  initial?: Briefing;
  intakeId?: string;
  intakePayloadJson?: string;
}) {
  const busyRef = useRef(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [warning, setWarning] = useState("");
  const [pending, setPending] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [preview, setPreview] = useState<Proposal | null>(null);
  const intakePayload = (() => {
    if (!intakePayloadJson) return null;
    try {
      return JSON.parse(intakePayloadJson) as IntakePayload;
    } catch {
      return null;
    }
  })();

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
      const data = intakePayload ? applyIntakeToDocument(proposal.data, intakePayload) : proposal.data;
      const result = await createPage({
        clientName: meta.nextName,
        segment: meta.segment,
        slug: meta.nextSlug,
        data,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (intakeId) {
        await linkIntakeToPage(intakeId, result.id);
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
        Caminho feliz: <strong>nome + segmento + serviços + objetivo</strong> → 3 esqueletos do trio.
        Modelo = anatomia; IA (se houver chave) só afina texto.
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
        <select
          className="border bg-white px-3 py-2 disabled:opacity-60"
          name="segment"
          defaultValue={initial?.segment ?? "local"}
          disabled={locked}
        >
          {SEGMENTS.map((item) => (
            <option key={item} value={item}>
              {segmentLabel(item)}
            </option>
          ))}
        </select>
        <select
          className="border bg-white px-3 py-2 disabled:opacity-60"
          name="goal"
          defaultValue={initial?.goal ?? "captar"}
          disabled={locked}
        >
          <option value="vender">Vender</option>
          <option value="agendar">Agendar</option>
          <option value="captar">Captar contato</option>
        </select>
        <textarea
          className="border bg-white px-3 py-2 md:col-span-2 disabled:opacity-60"
          name="services"
          placeholder="Serviços, separados por vírgula"
          defaultValue={initial?.services ?? ""}
          disabled={locked}
        />

        {/* Campos do intake que alteram a receita — precisam ir no POST. */}
        <input type="hidden" name="templateId" value={initial?.templateId ?? ""} />
        <input type="hidden" name="headline" value={initial?.headline ?? ""} />
        <input type="hidden" name="tagline" value={initial?.tagline ?? ""} />
        <input type="hidden" name="backgroundColor" value={initial?.backgroundColor ?? ""} />
        {initial?.personality ? <input type="hidden" name="personality" value={initial.personality} /> : null}

        <details className="md:col-span-2 border border-[var(--studio-line)] bg-white px-3 py-2">
          <summary className="cursor-pointer text-sm text-neutral-700">Mais detalhes (opcional)</summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <textarea
              className="border bg-white px-3 py-2 md:col-span-2 disabled:opacity-60"
              name="audience"
              placeholder="Público"
              defaultValue={initial?.audience ?? ""}
              disabled={locked}
            />
            <textarea
              className="border bg-white px-3 py-2 md:col-span-2 disabled:opacity-60"
              name="tone"
              placeholder="Tom de voz"
              defaultValue={initial?.tone ?? ""}
              disabled={locked}
            />
            <textarea
              className="border bg-white px-3 py-2 md:col-span-2 disabled:opacity-60"
              name="differentials"
              placeholder="Diferenciais"
              defaultValue={initial?.differentials ?? ""}
              disabled={locked}
            />
            <input
              className="border bg-white px-3 py-2 disabled:opacity-60"
              name="colors"
              placeholder="Cor, se houver (#8f3d2b)"
              defaultValue={initial?.colors ?? ""}
              disabled={locked}
            />
            <input
              className="border bg-white px-3 py-2 disabled:opacity-60"
              name="references"
              placeholder="Referências"
              defaultValue={initial?.references ?? ""}
              disabled={locked}
            />
            <input
              className="border bg-white px-3 py-2 disabled:opacity-60"
              name="address"
              placeholder="Endereço (para mapa)"
              defaultValue={initial?.address ?? ""}
              disabled={locked}
            />
            <input
              className="border bg-white px-3 py-2 disabled:opacity-60"
              name="whatsapp"
              placeholder="WhatsApp"
              defaultValue={initial?.whatsapp ?? ""}
              disabled={locked}
            />
          </div>
        </details>

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
        {proposals.map((proposal) => {
          const fonts = proposal.data.root.props.theme.fonts;
          const colors = proposal.data.root.props.theme.colors;
          return (
            <article key={proposal.label} className="grid gap-3 border border-[var(--studio-line)] bg-white p-4">
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em]">
                <span className="border px-2 py-0.5">{proposal.source === "ai" ? "IA" : "Local"}</span>
                {proposal.templateId ? (
                  <span className="border px-2 py-0.5">{proposal.templateId}</span>
                ) : null}
              </div>
              <h2 className="text-2xl">{proposal.label}</h2>
              <p className="text-sm">{proposal.direction}</p>
              <p className="text-sm text-neutral-600">
                {proposal.data.root.props.theme.personality} · {fonts.display}/{fonts.body} ·{" "}
                {proposal.data.content.length} blocos
              </p>
              <div className="flex h-16 items-end gap-1 p-3" style={{ background: colors.background }}>
                <span className="h-3 w-10" style={{ background: colors.primary }} />
                <span className="h-3 w-6" style={{ background: colors.accent }} />
                <span className="h-3 w-6 border" style={{ background: colors.muted, borderColor: colors.border }} />
              </div>
              <button
                className="border px-3 py-2 text-sm disabled:opacity-50"
                type="button"
                disabled={locked}
                onClick={() => setPreview(proposal)}
              >
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
          );
        })}
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
