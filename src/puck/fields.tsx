"use client";

import { useState } from "react";
import { uploadFile } from "@/puck/media-upload";
import { isVideoSrc, type ImageField } from "@/puck/schema";

const empty: ImageField = { src: "", alt: "", placeholder: true };

export function ImageControl({
  value,
  onChange,
  label = "Imagem ou vídeo",
}: {
  value?: ImageField;
  onChange: (value: ImageField) => void;
  label?: string;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const current = value?.src ? value : empty;
  const hasFile = Boolean(current.src) && !current.placeholder;

  async function send(file: File | undefined) {
    if (!file) return;
    setPending(true);
    setError("");
    const result = await uploadFile(file);
    setPending(false);
    if (!result.url) {
      setError(result.error || "Falha no envio");
      return;
    }
    onChange({ src: result.url, alt: current.alt || file.name, placeholder: false });
  }

  return (
    <div
      className="grid gap-2"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        void send(event.dataTransfer.files[0]);
      }}
    >
      <p className="text-xs font-medium">{label}</p>
      {hasFile && isVideoSrc(current.src) ? (
        <video src={current.src} className="h-28 w-full bg-black object-cover" controls muted />
      ) : null}
      {hasFile && !isVideoSrc(current.src) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current.src} alt="" className="h-28 w-full object-cover" />
      ) : null}
      <label className="grid gap-1 border border-neutral-400 bg-white px-3 py-2 text-sm">
        <span className="font-medium">{pending ? "Enviando…" : "Enviar imagem ou vídeo"}</span>
        <input
          className="block w-full text-sm"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
          disabled={pending}
          onChange={(event) => {
            void send(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
      <p className="text-[11px] leading-4 text-neutral-500">JPG, PNG, WEBP, GIF, MP4 ou WEBM. Arraste o arquivo aqui.</p>
      <input
        className="border px-2 py-1 text-sm"
        placeholder="Texto alternativo"
        value={current.alt || ""}
        onChange={(event) => onChange({ src: current.src, alt: event.target.value, placeholder: current.placeholder })}
      />
      {hasFile ? (
        <button type="button" className="text-left text-xs underline" onClick={() => onChange(empty)}>
          Remover arquivo
        </button>
      ) : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
