"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  exportCanvasDraftToPuck,
  exportPuckDraftToCanvas,
  publishCanvas,
  saveCanvasDraft,
  saveDraft,
  setEditorMode,
} from "@/actions/studio";
import { SiteCanvasEditor } from "@/components/site-canvas/site-canvas-editor";
import { StudioEditor } from "@/components/studio-editor";
import { createClassicCanvas, type SiteCanvasConfig } from "@/lib/canvas/site-canvas";
import type { PageDocument } from "@/puck/schema";

type Version = { id: string; version: number; label: string | null; source: string; createdAt: string };

export function StudioWorkspace(props: {
  pageId: string;
  clientName: string;
  slug: string;
  segment: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  previewUrl: string;
  publicUrl: string;
  initialPuck: PageDocument;
  initialCanvas: SiteCanvasConfig | null;
  editorMode: "PUCK" | "CANVAS";
  versions: Version[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"PUCK" | "CANVAS">(props.editorMode);
  const [puckKey, setPuckKey] = useState(0);
  const [canvasKey, setCanvasKey] = useState(0);
  const [puckDoc, setPuckDoc] = useState(props.initialPuck);
  const [canvasDoc, setCanvasDoc] = useState<SiteCanvasConfig>(
    props.initialCanvas || createClassicCanvas(props.clientName),
  );
  const [switchOpen, setSwitchOpen] = useState(false);
  const [switchTarget, setSwitchTarget] = useState<"PUCK" | "CANVAS">("CANVAS");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  function requestSwitch(target: "PUCK" | "CANVAS") {
    if (target === mode) return;
    setSwitchTarget(target);
    setSwitchOpen(true);
    setHint("");
  }

  async function openWithoutOverwrite() {
    setBusy(true);
    await setEditorMode(props.pageId, switchTarget);
    setMode(switchTarget);
    setSwitchOpen(false);
    setBusy(false);
    router.refresh();
  }

  async function exportAndOpen() {
    setBusy(true);
    setHint("");
    try {
      if (mode === "PUCK") {
        // Garante que o rascunho Puck atual esteja no banco antes de converter.
        await saveDraft(props.pageId, puckDoc);
      } else {
        await saveCanvasDraft(props.pageId, canvasDoc);
      }

      if (switchTarget === "CANVAS") {
        const result = await exportPuckDraftToCanvas(props.pageId);
        if (!result.ok) {
          setHint(result.error);
          return;
        }
        setCanvasDoc(result.data);
        setCanvasKey((k) => k + 1);
        setMode("CANVAS");
        setHint("Estado do Puck exportado para o Ze (layout aproximado).");
      } else {
        const result = await exportCanvasDraftToPuck(props.pageId);
        if (!result.ok) {
          setHint(result.error);
          return;
        }
        setPuckDoc(result.data);
        setPuckKey((k) => k + 1);
        setMode("PUCK");
        setHint("Estado do Ze exportado para o Puck (layout aproximado).");
      }
      setSwitchOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {hint ? <p className="border-b border-[var(--studio-line)] px-4 py-2 text-sm">{hint}</p> : null}

      {mode === "PUCK" ? (
        <div className="relative">
          <div className="absolute right-3 top-2 z-[80]">
            <button
              type="button"
              className="border border-[var(--studio-line)] bg-[var(--studio-bg)] px-3 py-1.5 text-xs font-medium shadow"
              onClick={() => requestSwitch("CANVAS")}
            >
              Ambiente Ze
            </button>
          </div>
          <StudioEditor
            key={puckKey}
            pageId={props.pageId}
            clientName={props.clientName}
            slug={props.slug}
            segment={props.segment}
            status={props.status}
            previewUrl={props.previewUrl}
            publicUrl={props.publicUrl}
            initial={puckDoc}
            versions={props.versions}
            onLiveChange={setPuckDoc}
          />
        </div>
      ) : (
        <SiteCanvasEditor
          key={canvasKey}
          pageId={props.pageId}
          clientName={props.clientName}
          initial={canvasDoc}
          statusLabel={props.status === "PUBLISHED" ? "No ar (Ze)" : "Rascunho Ze"}
          onSwitchToPuck={() => requestSwitch("PUCK")}
          onLiveChange={setCanvasDoc}
          onSave={async (canvas) => {
            const result = await saveCanvasDraft(props.pageId, canvas);
            if (result.ok) setCanvasDoc(canvas);
            return result;
          }}
          onPublish={async (canvas) => {
            const result = await publishCanvas(props.pageId, canvas);
            if (result.ok) {
              setCanvasDoc(canvas);
              router.refresh();
            }
            return result;
          }}
        />
      )}

      {switchOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/45" aria-label="Fechar" onClick={() => setSwitchOpen(false)} />
          <div className="relative z-[1] w-full max-w-lg border border-[var(--studio-line)] bg-[var(--studio-bg)] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold">
              Trocar para {switchTarget === "CANVAS" ? "ambiente Ze" : "ambiente Puck"}?
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              A conversão de layout não é pixel a pixel (colunas vs posições livres). Escolha se quer levar o
              estado atual ou só abrir o rascunho que já existe no outro ambiente.
            </p>
            <div className="mt-4 grid gap-2 text-sm">
              <button
                type="button"
                className="bg-[var(--studio-ink)] px-3 py-2 text-[var(--studio-bg)] disabled:opacity-50"
                disabled={busy}
                onClick={() => void exportAndOpen()}
              >
                {busy ? "Exportando…" : "Exportar estado atual para o outro"}
              </button>
              <button
                type="button"
                className="border px-3 py-2 disabled:opacity-50"
                disabled={busy}
                onClick={() => void openWithoutOverwrite()}
              >
                Abrir o outro sem sobrescrever
              </button>
              <button type="button" className="px-3 py-2 text-neutral-600" disabled={busy} onClick={() => setSwitchOpen(false)}>
                Cancelar
              </button>
            </div>
            {hint ? <p className="mt-2 text-sm text-[var(--studio-accent)]">{hint}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
