import { describe, expect, it } from "vitest";
import { contrastRatio, ensureThemeContrast } from "@/lib/theme-contrast";

describe("ensureThemeContrast", () => {
  it("corrige texto claro em fundo claro (bug do intake + tema dark)", () => {
    const fixed = ensureThemeContrast({
      background: "#f6f1ea",
      foreground: "#f5f5f2",
      primary: "#e7ff3d",
      accent: "#f5f5f2",
      muted: "#1c1c1c",
      border: "#2a2a2a",
    });
    expect(contrastRatio(fixed.background, fixed.foreground)).toBeGreaterThanOrEqual(4.5);
    expect(fixed.foreground.toLowerCase()).not.toBe("#f5f5f2");
  });

  it("mantém pares já legíveis", () => {
    const ok = ensureThemeContrast({
      background: "#111111",
      foreground: "#f5f5f2",
      primary: "#e7ff3d",
      accent: "#f5f5f2",
      muted: "#1c1c1c",
      border: "#2a2a2a",
    });
    expect(ok.background).toBe("#111111");
    expect(ok.foreground).toBe("#f5f5f2");
  });
});
