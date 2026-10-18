"use client";

import { registerOverlayPortal, setDeep } from "@puckeditor/core";
import { useEffect, useRef, useState } from "react";
import { prepareImageFile } from "@/lib/image-prepare";
import type { ImageField } from "@/puck/schema";
import { useStudioPuck } from "@/puck/use-studio-puck";
import { cn } from "@/lib/cn";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm";

export async function uploadFile(file: File) {
  const prepared = file.type.startsWith("image/") ? await prepareImageFile(file) : file;
  const body = new FormData();
  body.set("file", prepared);
  const response = await fetch("/api/upload", { method: "POST", body });
  const payload = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !payload.url) return { error: payload.error || "Falha no envio" };
  return { url: payload.url };
}

/** Overlay no canvas no estilo Zé: zona clicável, sem input nativo visível. */
export function CanvasUpload({
  blockId,
  path,
  current,
}: {
  blockId: string;
  path: string;
  current: ImageField;
}) {
  const dispatch = useStudioPuck((state) => state.dispatch);
  const getItemById = useStudioPuck((state) => state.getItemById);
  const getSelectorForId = useStudioPuck((state) => state.getSelectorForId);
  const portalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const hasFile = Boolean(current.src) && !current.placeholder;

  useEffect(() => registerOverlayPortal(portalRef.current, { disableDrag: true }), []);

  async function send(file: File | undefined) {
    if (!file) return;
    setPending(true);
    setError("");
    const result = await uploadFile(file);
    if (!result.url) {
      setPending(false);
      setError(result.error || "Falha no envio");
      return;
    }
    const item = getItemById(blockId);
    const selector = getSelectorForId(blockId);
    if (!item || !selector) {
      setPending(false);
      setError("Não foi possível gravar neste bloco.");
      return;
    }
    const next: ImageField = { src: result.url, alt: current.alt || file.name, placeholder: false };
    dispatch({
      type: "replace",
      destinationIndex: selector.index,
      destinationZone: selector.zone || "root:default-zone",
      data: { type: item.type, props: setDeep(item.props, path, next) },
      recordHistory: true,
    });
    setPending(false);
  }

  return (
    <div
      ref={portalRef}
      className={cn(
        "absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 p-3 transition",
        hasFile ? "bg-transparent hover:bg-black/40" : "bg-transparent",
      )}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void send(event.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        disabled={pending}
        onChange={(event) => {
          void send(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={pending}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          inputRef.current?.click();
        }}
        className={cn(
          "rounded-md px-2.5 py-1.5 text-[11px] font-medium transition disabled:opacity-50",
          hasFile
            ? "bg-white text-neutral-900 opacity-0 shadow hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
            : "border border-[var(--color-border)] bg-[var(--color-background)]/90 text-[var(--color-foreground)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
        )}
      >
        {pending ? "Enviando…" : hasFile ? "Trocar" : "Enviar foto"}
      </button>
      {error ? <span className="rounded bg-white px-2 py-1 text-[10px] text-red-700">{error}</span> : null}
    </div>
  );
}
