import type { Theme } from "@/puck/schema";

function parseHex(hex: string) {
  const normalized = hex.trim().replace("#", "");
  const full =
    normalized.length === 3 ? normalized.split("").map((char) => `${char}${char}`).join("") : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

function channel(value: number) {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string) {
  const rgb = parseHex(hex);
  if (!rgb) return 0.5;
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function contrastRatio(a: string, b: string) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

function mix(hex: string, toward: "#000000" | "#ffffff", amount: number) {
  const rgb = parseHex(hex);
  const target = toward === "#000000" ? 0 : 255;
  if (!rgb) return toward;
  const t = Math.min(1, Math.max(0, amount));
  const to = (value: number) => Math.round(value + (target - value) * t);
  return `#${[to(rgb.r), to(rgb.g), to(rgb.b)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** Garante texto legível: nunca deixa foreground claro em fundo claro (nem o inverso). */
export function ensureThemeContrast(colors: Theme["colors"]): Theme["colors"] {
  const background = colors.background?.startsWith("#") ? colors.background : "#f6f1ea";
  let foreground = colors.foreground?.startsWith("#") ? colors.foreground : "#1c1915";
  let primary = colors.primary?.startsWith("#") ? colors.primary : foreground;
  let muted = colors.muted?.startsWith("#") ? colors.muted : background;
  let border = colors.border?.startsWith("#") ? colors.border : foreground;
  let accent = colors.accent?.startsWith("#") ? colors.accent : primary;

  if (contrastRatio(background, foreground) < 4.5) {
    foreground = relativeLuminance(background) > 0.55 ? "#14110f" : "#f7f4ef";
  }
  if (contrastRatio(background, primary) < 2.6) {
    primary = relativeLuminance(background) > 0.55 ? mix(primary, "#000000", 0.45) : mix(primary, "#ffffff", 0.35);
  }
  if (contrastRatio(background, muted) < 1.15) {
    muted = relativeLuminance(background) > 0.55 ? mix(background, "#000000", 0.06) : mix(background, "#ffffff", 0.08);
  }
  if (contrastRatio(background, border) < 1.4) {
    border = relativeLuminance(background) > 0.55 ? mix(background, "#000000", 0.18) : mix(background, "#ffffff", 0.2);
  }
  if (contrastRatio(background, accent) < 2.2) {
    accent = primary;
  }

  return { background, foreground, primary, accent, muted, border };
}
