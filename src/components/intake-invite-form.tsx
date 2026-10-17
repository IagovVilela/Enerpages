"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createIntakeInvite } from "@/actions/intake";
import { copyTextToClipboard, downloadPublicQrPng } from "@/lib/studio-share";
import { SEGMENTS } from "@/puck/schema";

export function IntakeInviteForm() {
  const router = useRouter();
  const [clientNameHint, setClientNameHint] = useState("");
  const [segmentHint, setSegmentHint] = useState("local");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ id: string; url: string } | null>(null);
  const [toast, setToast] = useState("");

  async function onCreate() {
    setPending(true);
    setError("");
    setToast("");
    try {
      const origin = window.location.origin;
      const result = await createIntakeInvite({
        clientNameHint,
        segmentHint,
        notes,
        origin,
      });
      if (!result.ok) {
        setError("Não foi possível criar o convite.");
        return;
      }
      setCreated({ id: result.id, url: result.url });
      setToast("Link criado.");
      router.refresh();
    } catch {
      setError("Falha ao criar convite.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4 border border-[var(--studio-line)] bg-white p-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Novo link</p>
        <p className="mt-1 text-sm text-neutral-600">
          Gere um link para o cliente preencher preferências. Depois você revisa e monta a página.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="border px-3 py-2"
          placeholder="Nome do cliente (opcional)"
          value={clientNameHint}
          onChange={(e) => setClientNameHint(e.target.value)}
        />
        <select className="border px-3 py-2" value={segmentHint} onChange={(e) => setSegmentHint(e.target.value)}>
          {SEGMENTS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <textarea
          className="border px-3 py-2 md:col-span-2"
          placeholder="Notas internas (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="bg-[var(--studio-ink)] px-4 py-2 text-sm text-[var(--studio-bg)] disabled:opacity-50"
          disabled={pending}
          onClick={() => void onCreate()}
        >
          {pending ? "Criando…" : "Criar link de briefing"}
        </button>
        {created ? (
          <>
            <button
              type="button"
              className="border px-3 py-2 text-sm"
              onClick={async () => {
                const ok = await copyTextToClipboard(created.url);
                setToast(ok ? "Link copiado." : "Não foi possível copiar.");
              }}
            >
              Copiar link
            </button>
            <button
              type="button"
              className="border px-3 py-2 text-sm"
              onClick={async () => {
                const ok = await downloadPublicQrPng(created.url, `intake-${created.id.slice(0, 6)}`);
                setToast(ok ? "QR baixado." : "Falha ao gerar QR.");
              }}
            >
              Baixar QR
            </button>
            <a className="border px-3 py-2 text-sm" href={`/intakes/${created.id}`}>
              Abrir convite
            </a>
          </>
        ) : null}
      </div>
      {created ? <p className="break-all text-xs text-neutral-600">{created.url}</p> : null}
      {error ? <p className="text-sm text-[var(--studio-accent)]">{error}</p> : null}
      {toast ? <p className="text-sm text-neutral-600">{toast}</p> : null}
    </div>
  );
}
