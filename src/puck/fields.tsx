"use client";

import { useState } from "react";
import type { ImageField } from "@/puck/schema";

export function ImageControl({ value, onChange }: { value: ImageField; onChange: (value: ImageField) => void }) {
  const [error, setError] = useState("");
  return (
    <div className="grid gap-2">
      {value?.src && !value.placeholder ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value.src} alt="" className="h-24 w-full object-cover" />
      ) : (
        <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Substituir imagem</p>
      )}
      <input
        className="text-sm"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const body = new FormData();
          body.set("file", file);
          const response = await fetch("/api/upload", { method: "POST", body });
          const payload = (await response.json()) as { url?: string; error?: string };
          if (!response.ok || !payload.url) {
            setError(payload.error || "Falha no envio");
            return;
          }
          setError("");
          onChange({ src: payload.url, alt: value?.alt || "", placeholder: false });
        }}
      />
      <input
        className="border px-2 py-1 text-sm"
        placeholder="Texto alternativo"
        value={value?.alt || ""}
        onChange={(event) => onChange({ src: value?.src || "", alt: event.target.value, placeholder: value?.placeholder ?? !value?.src })}
      />
      <button type="button" className="text-left text-xs underline" onClick={() => onChange({ src: "", alt: "", placeholder: true })}>
        Marcar como placeholder
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
