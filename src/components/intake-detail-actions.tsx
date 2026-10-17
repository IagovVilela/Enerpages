"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPageFromIntake } from "@/actions/intake";
import { copyTextToClipboard, downloadPublicQrPng } from "@/lib/studio-share";

export function IntakeDetailActions({
  inviteId,
  publicUrl,
  canGenerate,
  pageId,
}: {
  inviteId: string;
  publicUrl: string;
  canGenerate: boolean;
  pageId?: string | null;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="grid gap-3 border border-[var(--studio-line)] bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="border px-3 py-2 text-sm"
          onClick={async () => {
            const ok = await copyTextToClipboard(publicUrl);
            setMessage(ok ? "Link copiado." : "Não foi possível copiar.");
          }}
        >
          Copiar link
        </button>
        <button
          type="button"
          className="border px-3 py-2 text-sm"
          onClick={async () => {
            const ok = await downloadPublicQrPng(publicUrl, `intake-${inviteId.slice(0, 6)}`);
            setMessage(ok ? "QR baixado." : "Falha ao gerar QR.");
          }}
        >
          Baixar QR
        </button>
        <a className="border px-3 py-2 text-sm" href={publicUrl} target="_blank" rel="noreferrer">
          Abrir formulário
        </a>
        {pageId ? (
          <a className="bg-[var(--studio-ink)] px-3 py-2 text-sm text-[var(--studio-bg)]" href={`/pages/${pageId}`}>
            Abrir página
          </a>
        ) : null}
      </div>

      {canGenerate ? (
        <div className="grid gap-2 border-t border-[var(--studio-line)] pt-3">
          <p className="text-sm text-neutral-600">
            Criar página com o modelo escolhido pelo cliente e aplicar tema/contato.
          </p>
          <input
            className="border px-3 py-2"
            placeholder="Subdomínio (opcional — usa o nome se vazio)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="bg-[var(--studio-ink)] px-4 py-2 text-sm text-[var(--studio-bg)] disabled:opacity-50"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                setMessage("");
                const result = await createPageFromIntake(inviteId, slug || undefined);
                setPending(false);
                if (!result.ok) {
                  setMessage(result.error);
                  return;
                }
                router.push(`/pages/${result.id}`);
              }}
            >
              {pending ? "Criando página…" : "Usar modelo e abrir no Puck"}
            </button>
            <a className="border px-3 py-2 text-sm" href={`/briefing?intake=${inviteId}`}>
              Gerar propostas com IA
            </a>
          </div>
        </div>
      ) : null}

      {message ? <p className="text-sm text-neutral-600">{message}</p> : null}
    </div>
  );
}
