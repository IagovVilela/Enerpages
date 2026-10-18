"use client";

import { useRef, useState } from "react";
import { MaskedPhoneInput } from "@/components/masked-phone-input";
import { isLikelyPageUrl } from "@/lib/map-embed";
import { uploadFile } from "@/puck/media-upload";
import { isVideoSrc, type ImageField } from "@/puck/schema";

const empty: ImageField = { src: "", alt: "", placeholder: true };
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm";

/** Inspector de mídia no estilo Zé: preview, botão primário, URL opcional. */
export function ImageControl({
  value,
  onChange,
  label = "Imagem ou vídeo",
}: {
  value?: ImageField;
  onChange: (value: ImageField) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const current = value?.src ? value : empty;
  const hasFile = Boolean(current.src) && !current.placeholder;

  async function send(file: File | undefined) {
    if (!file) return;
    setPending(true);
    setError("");
    try {
      const result = await uploadFile(file);
      if (!result.url) {
        setError(result.error || "Falha no envio");
        return;
      }
      onChange({ src: result.url, alt: current.alt || file.name, placeholder: false });
    } catch {
      setError("Não foi possível tratar a imagem. Tente outro arquivo.");
    } finally {
      setPending(false);
    }
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
      <p className="text-xs font-medium text-neutral-600">{label}</p>

      {hasFile && isVideoSrc(current.src) ? (
        <video src={current.src} className="max-h-28 w-full rounded-lg border border-[var(--studio-line)] bg-black object-cover" muted playsInline preload="metadata" />
      ) : null}
      {hasFile && !isVideoSrc(current.src) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={current.src} alt="" className="max-h-28 w-full rounded-lg border border-[var(--studio-line)] object-cover" />
      ) : null}
      {!hasFile ? (
        <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-[var(--studio-line)] text-[11px] text-neutral-500">
          Nenhum arquivo
        </div>
      ) : null}

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
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-lg bg-[var(--studio-ink)] px-3 py-2.5 text-sm font-semibold text-[var(--studio-bg)] transition disabled:opacity-50"
      >
        {pending ? "Enviando…" : hasFile ? "Trocar arquivo" : "Carregar do dispositivo"}
      </button>

      {hasFile ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => onChange(empty)}
          className="w-full rounded-lg border border-[var(--studio-line)] px-3 py-1.5 text-[11px] text-neutral-600 hover:bg-white disabled:opacity-50"
        >
          Remover mídia
        </button>
      ) : null}

      <p className="text-[10px] leading-relaxed text-neutral-500">
        JPEG, PNG, WEBP, GIF, MP4 ou WEBM. Imagens grandes são redimensionadas automaticamente.
      </p>

      {error ? <p className="text-[11px] text-red-700">{error}</p> : null}

      <details className="rounded-lg border border-[var(--studio-line)] bg-white/70 px-2 py-1.5">
        <summary className="cursor-pointer text-[11px] text-neutral-500 hover:text-neutral-800">Ou usar link externo</summary>
        <label className="mt-2 grid gap-1 text-xs text-neutral-600">
          URL
          <input
            className="border border-[var(--studio-line)] px-2 py-1.5 text-sm"
            value={hasFile ? current.src : ""}
            placeholder="https://…"
            onChange={(event) => {
              const src = event.target.value.trim();
              if (!src) {
                setError("");
                onChange(empty);
                return;
              }
              if (isLikelyPageUrl(src)) {
                setError("Cole o link direto do arquivo (PNG/JPG) ou carregue do dispositivo — não use o site do Google.");
                return;
              }
              setError("");
              onChange({ src, alt: current.alt || "", placeholder: false });
            }}
          />
        </label>
      </details>

      <label className="grid gap-1 text-xs text-neutral-600">
        Texto alternativo
        <input
          className="border border-[var(--studio-line)] px-2 py-1.5 text-sm"
          value={current.alt || ""}
          onChange={(event) => onChange({ src: current.src, alt: event.target.value, placeholder: current.placeholder })}
        />
      </label>
    </div>
  );
}

/** Campo de telefone/WhatsApp com máscara pt-BR no inspector Puck. */
export function PhoneControl({
  value,
  onChange,
  label = "Telefone",
  mode = "whatsapp",
}: {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  mode?: "whatsapp" | "national";
}) {
  return (
    <label className="grid gap-1.5 text-xs text-neutral-600">
      {label}
      <MaskedPhoneInput
        mode={mode}
        className="border border-[var(--studio-line)] px-2 py-1.5 text-sm"
        value={value || ""}
        onChange={onChange}
        placeholder={mode === "whatsapp" ? "(11) 99999-0000 ou +1555…" : "(11) 99999-0000"}
      />
    </label>
  );
}
