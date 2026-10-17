import type { CSSProperties } from "react";
import { canvasBgArtStyle } from "@/lib/canvas/bg-art";
import type { CanvasElement, CanvasTheme, SiteCanvasConfig } from "@/lib/canvas/site-canvas";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

function mix(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function shade(hex: string, towardWhite: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const t = Math.min(1, Math.max(0, towardWhite));
  return `#${[mix(rgb.r, 255, t), mix(rgb.g, 255, t), mix(rgb.b, 255, t)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function darken(hex: string, towardBlack: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const t = Math.min(1, Math.max(0, towardBlack));
  return `#${[mix(rgb.r, 0, t), mix(rgb.g, 0, t), mix(rgb.b, 0, t)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function mixHex(a: string, b: string, amount: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  if (!A || !B) return a;
  const t = Math.min(1, Math.max(0, amount));
  return `#${[mix(B.r, A.r, t), mix(B.g, A.g, t), mix(B.b, A.b, t)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

export function normalizeHex(value: string | undefined | null): string | null {
  if (!value) return null;
  const v = value.trim();
  if (v.startsWith("var(") || v.startsWith("theme.")) return null;
  const rgb = hexToRgb(v);
  if (!rgb) return null;
  return `#${[rgb.r, rgb.g, rgb.b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

export function contrastOn(hex: string): string {
  return luminance(hex) > 0.55 ? "#09090b" : "#fafafa";
}

export function resolveCanvasColor(value: string | undefined, fallback: string): string {
  const v = value?.trim();
  if (!v) return fallback;
  switch (v) {
    case "theme.primary":
    case "primary":
      return "var(--color-brand-500)";
    case "theme.secondary":
    case "secondary":
      return "var(--site-secondary)";
    case "theme.background":
    case "background":
      return "var(--site-bg)";
    case "theme.surface":
    case "surface":
      return "var(--site-surface)";
    case "theme.text":
    case "text":
      return "var(--site-text)";
    case "theme.onPrimary":
    case "onPrimary":
      return "var(--site-on-primary)";
    default:
      return v;
  }
}

export function canvasThemeStyle(theme: CanvasTheme | undefined | null, fallbackPrimary?: string | null): CSSProperties {
  const t = theme ?? {};
  const primary = t.primary?.trim() || fallbackPrimary?.trim() || "#8f3d2b";
  const secondary = t.secondary?.trim() || darken(primary, 0.25);
  const background = t.background?.trim() || "#0f1419";
  const surface = t.surface?.trim() || "#18181b";
  const text = t.text?.trim() || "#fafafa";
  const radius = t.radius === "sm" ? "0.5rem" : t.radius === "lg" ? "1.25rem" : "0.75rem";
  const fontDisplayRaw = t.fontDisplay?.trim();
  const fontBody = t.fontBody?.trim() || "Outfit, system-ui, sans-serif";
  const overrideDisplay = fontDisplayRaw && fontDisplayRaw !== "inherit" ? fontDisplayRaw : null;

  return {
    ["--brand" as string]: primary,
    ["--color-brand-500" as string]: primary,
    ["--color-brand-600" as string]: darken(primary, 0.15),
    ["--color-brand-50" as string]: shade(primary, 0.85),
    ["--color-brand-surface-10" as string]: mixHex(primary, background, 0.14),
    ["--site-secondary" as string]: secondary,
    ["--site-bg" as string]: background,
    ["--site-surface" as string]: surface,
    ["--site-text" as string]: text,
    ["--site-on-primary" as string]: contrastOn(primary),
    ["--site-radius" as string]: radius,
    ...(overrideDisplay ? { ["--font-display" as string]: overrideDisplay } : {}),
    ["--font-body" as string]: fontBody,
    backgroundColor: background,
    color: text,
    fontFamily: fontBody,
    ...canvasBgArtStyle(t.bgArt, { color: t.bgArtColor, strength: t.bgArtStrength, primary }),
  } as CSSProperties;
}

export function applyThemeChangeToCanvas(
  canvas: SiteCanvasConfig,
  nextTheme: NonNullable<CanvasTheme>,
): SiteCanvasConfig {
  return { ...canvas, theme: nextTheme };
}

export function remapThemeHexInElements(
  elements: CanvasElement[],
  prev: CanvasTheme | undefined | null,
  next: CanvasTheme | undefined | null,
): CanvasElement[] {
  const p = prev ?? {};
  const n = next ?? {};
  const map = new Map<string, string>();
  for (const [from, to] of [
    [p.primary, n.primary],
    [p.secondary, n.secondary],
    [p.background, n.background],
    [p.surface, n.surface],
    [p.text, n.text],
  ] as const) {
    const a = normalizeHex(from);
    const b = normalizeHex(to);
    if (a && b && a !== b) map.set(a.toLowerCase(), b);
  }
  if (!map.size) return elements;
  return elements.map((el) => {
    const props = { ...(el.props ?? {}) };
    let changed = false;
    for (const key of ["color", "backgroundColor", "borderColor"] as const) {
      const cur = normalizeHex(props[key] as string | undefined);
      if (!cur) continue;
      const replacement = map.get(cur.toLowerCase());
      if (replacement) {
        (props as Record<string, unknown>)[key] = replacement;
        changed = true;
      }
    }
    return changed ? { ...el, props } : el;
  });
}
