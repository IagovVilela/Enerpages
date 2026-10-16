"use client";

import { registerOverlayPortal, setDeep } from "@puckeditor/core";
import { useEffect, useRef, useState } from "react";
import type { ImageField } from "@/puck/schema";
import { useStudioPuck } from "@/puck/use-studio-puck";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm";

export async function uploadFile(file: File) {
  const body = new FormData();
  body.set("file", file);
  const response = await fetch("/api/upload", { method: "POST", body });
  const payload = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !payload.url) return { error: payload.error || "Falha no envio" };
  return { url: payload.url };
}

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
  const portalRef = useRef<HTMLLabelElement>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

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
    <label ref={portalRef} className="absolute left-3 right-3 top-3 z-30 grid gap-1 bg-white p-2 text-sm text-black shadow">
      <span className="font-medium">{pending ? "Enviando…" : "Enviar imagem ou vídeo"}</span>
      <input
        className="block w-full text-xs"
        type="file"
        accept={ACCEPT}
        disabled={pending}
        onChange={(event) => {
          void send(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </label>
  );
}
