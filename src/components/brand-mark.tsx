import Image from "next/image";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Só o monograma (ícone) */
  markOnly?: boolean;
  /** Versão clara do ícone de app (tile creme) — útil em fundos escuros */
  inverted?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { mark: 28, logoH: 28, logoW: 150 },
  md: { mark: 36, logoH: 36, logoW: 190 },
  lg: { mark: 48, logoH: 48, logoW: 260 },
} as const;

export function BrandMark({ className, markOnly = false, inverted = false, size = "md" }: Props) {
  const s = sizes[size];

  if (markOnly) {
    // Tile de app (creme/escuro) quando inverted; monograma transparente no padrão.
    const src = inverted ? "/brand/icon-dark.png" : "/brand/mark.png";
    return (
      <Image
        src={src}
        alt="Enerpages"
        width={s.mark}
        height={s.mark}
        className={cn("shrink-0 object-contain", className)}
        priority
      />
    );
  }

  return (
    <Image
      src="/brand/logo.png"
      alt="Enerpages."
      width={s.logoW}
      height={s.logoH}
      className={cn("h-auto w-auto shrink-0 object-contain object-left", className)}
      style={{ height: s.logoH, width: "auto" }}
      priority
    />
  );
}

/** Monograma transparente (sem tile), para favicons / overlays. */
export function BrandGlyph({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/brand/mark.png"
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}
