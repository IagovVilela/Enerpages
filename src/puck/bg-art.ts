import type { CSSProperties } from "react";
import { BG_ARTS, type Theme } from "@/puck/schema";

export const BG_ART_OPTIONS: { id: Theme["bgArt"]; label: string }[] = [
  { id: "none", label: "Só cor" },
  { id: "grid", label: "Quadriculado" },
  { id: "blueprint", label: "Planta" },
  { id: "dots", label: "Pontos" },
  { id: "cross", label: "Cruzes" },
  { id: "diagonal", label: "Diagonais" },
  { id: "mesh", label: "Malha" },
  { id: "horizon", label: "Horizontais" },
  { id: "vertical", label: "Verticais" },
  { id: "rings", label: "Anéis" },
  { id: "waves", label: "Ondas" },
  { id: "spark", label: "Faíscas" },
  { id: "glow", label: "Brilho" },
  { id: "noise", label: "Grão" },
  { id: "checker", label: "Xadrez" },
];

function hexToRgb(hex: string) {
  const normalized = hex.trim().replace("#", "");
  const full = normalized.length === 3 ? normalized.split("").map((char) => char + char).join("") : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

function inkRgba(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);
  const a = Math.min(1, Math.max(0, alpha));
  if (!rgb) return `rgba(161,161,170,${a})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

export function bgArtStyle(theme: Pick<Theme, "bgArt" | "bgArtColor" | "bgArtStrength" | "colors">): CSSProperties {
  const id = BG_ARTS.includes(theme.bgArt) ? theme.bgArt : "none";
  const color = theme.bgArtColor?.startsWith("#") ? theme.bgArtColor : theme.colors.foreground;
  const strength = Math.min(100, Math.max(5, Number(theme.bgArtStrength) || 45));
  const base = strength / 100;
  const ink = inkRgba(color, Math.min(0.98, 0.18 + base * 0.65));
  const inkMid = inkRgba(color, Math.min(0.95, 0.12 + base * 0.5));
  const inkSoft = inkRgba(color, Math.min(0.9, 0.08 + base * 0.38));
  const glowA = inkRgba(color, Math.min(0.95, 0.25 + base * 0.55));
  const glowB = inkRgba(color, Math.min(0.9, 0.15 + base * 0.35));

  switch (id) {
    case "none":
      return {};
    case "grid":
      return {
        backgroundImage: `linear-gradient(to right, ${ink} 1px, transparent 1px), linear-gradient(to bottom, ${ink} 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      };
    case "blueprint":
      return {
        backgroundImage: [
          `linear-gradient(to right, ${ink} 1px, transparent 1px)`,
          `linear-gradient(to bottom, ${ink} 1px, transparent 1px)`,
          `linear-gradient(to right, ${inkMid} 2px, transparent 2px)`,
          `linear-gradient(to bottom, ${inkMid} 2px, transparent 2px)`,
        ].join(", "),
        backgroundSize: "16px 16px, 16px 16px, 64px 64px, 64px 64px",
      };
    case "dots":
      return {
        backgroundImage: `radial-gradient(circle, ${ink} 1.6px, transparent 1.7px)`,
        backgroundSize: "16px 16px",
      };
    case "cross":
      return {
        backgroundImage: `linear-gradient(${ink} 2px, transparent 2px), linear-gradient(90deg, ${ink} 2px, transparent 2px)`,
        backgroundSize: "22px 22px",
        backgroundPosition: "center",
      };
    case "diagonal":
      return { backgroundImage: `repeating-linear-gradient(-45deg, ${ink} 0 2px, transparent 2px 12px)` };
    case "mesh":
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${inkSoft} 0 1.5px, transparent 1.5px 16px), repeating-linear-gradient(-45deg, ${ink} 0 1.5px, transparent 1.5px 16px)`,
      };
    case "horizon":
      return { backgroundImage: `repeating-linear-gradient(0deg, ${ink} 0 2px, transparent 2px 18px)` };
    case "vertical":
      return { backgroundImage: `repeating-linear-gradient(90deg, ${ink} 0 2px, transparent 2px 18px)` };
    case "rings":
      return {
        backgroundImage: `repeating-radial-gradient(circle at 30% 25%, transparent 0 14px, ${ink} 14px 15.5px), repeating-radial-gradient(circle at 75% 70%, transparent 0 18px, ${inkSoft} 18px 19.5px)`,
        backgroundSize: "180px 180px, 240px 240px",
      };
    case "waves": {
      const rgb = hexToRgb(color) ?? { r: 148, g: 163, b: 184 };
      const op = Math.min(0.95, 0.25 + base * 0.6).toFixed(2);
      const svg = encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='40' viewBox='0 0 120 40'><path d='M0 20 Q 30 0 60 20 T 120 20' fill='none' stroke='rgb(${rgb.r},${rgb.g},${rgb.b})' stroke-width='2' opacity='${op}'/><path d='M0 28 Q 30 8 60 28 T 120 28' fill='none' stroke='rgb(${rgb.r},${rgb.g},${rgb.b})' stroke-width='1.2' opacity='${Number(op) * 0.65}'/></svg>`,
      );
      return { backgroundImage: `url("data:image/svg+xml,${svg}")`, backgroundSize: "140px 48px" };
    }
    case "spark":
      return {
        backgroundImage: [
          `radial-gradient(circle, ${ink} 1.4px, transparent 1.5px)`,
          `radial-gradient(circle, ${glowA} 1px, transparent 1.2px)`,
          `radial-gradient(circle at 70% 40%, ${inkMid} 1.2px, transparent 1.3px)`,
        ].join(", "),
        backgroundSize: "28px 28px, 44px 44px, 36px 52px",
        backgroundPosition: "0 0, 10px 14px, 18px 6px",
      };
    case "glow":
      return {
        backgroundImage: [
          `radial-gradient(ellipse 80% 55% at 15% 10%, ${glowA}, transparent 62%)`,
          `radial-gradient(ellipse 70% 50% at 88% 20%, ${glowB}, transparent 58%)`,
          `radial-gradient(ellipse 90% 60% at 50% 100%, ${glowB}, transparent 55%)`,
        ].join(", "),
        backgroundRepeat: "no-repeat",
      };
    case "noise": {
      const rgb = hexToRgb(color) ?? { r: 148, g: 163, b: 184 };
      const op = Math.min(0.85, 0.3 + base * 0.55).toFixed(2);
      const svg = encodeURIComponent(
        `<svg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${rgb.r / 255} 0 0 0 0 ${rgb.g / 255} 0 0 0 0 ${rgb.b / 255} 0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='${op}'/></svg>`,
      );
      return { backgroundImage: `url("data:image/svg+xml,${svg}")`, backgroundSize: "160px 160px" };
    }
    case "checker":
      return {
        backgroundImage: `linear-gradient(45deg, ${inkMid} 25%, transparent 25%), linear-gradient(-45deg, ${inkMid} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${inkMid} 75%), linear-gradient(-45deg, transparent 75%, ${inkMid} 75%)`,
        backgroundSize: "24px 24px",
        backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0",
      };
    default: {
      const _exhaustive: never = id;
      void _exhaustive;
      return {};
    }
  }
}
