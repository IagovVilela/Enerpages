"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPage } from "@/actions/studio";
import { SEGMENTS, type PageDocument } from "@/puck/schema";

type Proposal = { label: string; direction: string; source: "ai" | "fallback"; data: PageDocument };

export function BriefingForm() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [warning, setWarning] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    const briefing = Object.fromEntries(formData.entries());
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

  return (
    <div className="grid gap-8">
      <form action={onSubmit} className="grid gap-3 md:grid-cols-2">
        <input className="border bg-white px-3 py-2" name="clientName" placeholder="Nome" required />
        <input className="border bg-white px-3 py-2" name="slug" placeholder="subdominio" required />
        <select className="border bg-white px-3 py-2" name="segment" defaultValue="local">
          {SEGMENTS.map((item) => <option key={item}>{item}</option>)}
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
            <p className="text-sm">{proposal.data.root.props.theme.personality} · {proposal.data.content.length} blocos</p>
            <div className="flex h-16" style={{ background: proposal.data.root.props.theme.colors.background }}>
              <span className="m-3 h-3 w-10" style={{ background: proposal.data.root.props.theme.colors.primary }} />
            </div>
            <button
              className="border px-3 py-2 text-sm"
              type="button"
              onClick={async () => {
                const form = document.querySelector("form");
                const data = new FormData(form || undefined);
                const result = await createPage({
                  clientName: String(data.get("clientName") || "Cliente"),
                  segment: String(data.get("segment") || "local"),
                  slug: String(data.get("slug") || ""),
                  data: proposal.data,
                });
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                router.push(`/pages/${result.id}`);
              }}
            >
              Usar esta proposta
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
