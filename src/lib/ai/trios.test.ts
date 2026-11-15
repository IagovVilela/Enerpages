import { describe, expect, it } from "vitest";
import { getTemplateStyle, SEGMENT_PROPOSAL_TEMPLATES, TEMPLATE_STYLES } from "@/lib/ai/template-styles";
import { PAGE_TEMPLATE_IDS, type PageTemplateId } from "@/puck/page-templates-ids";
import { SEGMENTS } from "@/puck/schema";
import type { TemplateStyle } from "@/lib/ai/template-styles";

const FLAGSHIPS = ["vertice", "ferraz", "essenza", "lenha", "linea", "alisio", "navalha", "pulso", "maison"] as const;

function layoutMode(style: TemplateStyle) {
  const variants = style.blockVariants ?? {};
  if (variants.Services === "index") return "index";
  if (variants.Catalog === "mosaic") return "mosaic";
  if (variants.Gallery === "track") return "track";
  if (variants.About === "sticky") return "sticky";
  if (variants.Catalog === "rows") return "rows";
  return "";
}

describe("trios por segmento", () => {
  it("cobre cada segmento com três fichas diferentes", () => {
    expect(Object.keys(SEGMENT_PROPOSAL_TEMPLATES).sort()).toEqual([...SEGMENTS].sort());
    const used = new Set<string>();
    for (const segment of SEGMENTS) {
      const trio = SEGMENT_PROPOSAL_TEMPLATES[segment];
      expect(trio).toHaveLength(3);
      const styles = trio.map((id) => getTemplateStyle(id));
      expect(new Set(styles.map((style) => (style.blocks ?? []).join(">"))).size).toBe(3);
      expect(new Set(styles.map((style) => style.heroVariant)).size).toBe(3);
      expect(new Set(styles.map((style) => `${style.fonts?.display}/${style.fonts?.body}`)).size).toBe(3);
      expect(new Set(styles.map((style) => `${style.entrance ?? "none"}|${style.motion}`)).size).toBe(3);
      expect(new Set(styles.map(layoutMode)).size).toBe(3);
      for (const mode of styles.map(layoutMode)) expect(mode).not.toBe("");
      for (const id of trio) {
        expect(used.has(id)).toBe(false);
        used.add(id);
      }
    }
  });

  it("não repete a fórmula cortina + Bodoni nos nove modelos", () => {
    const signatures = FLAGSHIPS.map((id) => {
      const style = getTemplateStyle(id);
      return `${style.fonts?.display}|${style.entrance ?? "none"}`;
    });
    expect(new Set(signatures).size).toBe(FLAGSHIPS.length);
    expect(signatures.filter((item) => item.startsWith("Bodoni Moda")).length).toBeLessThan(FLAGSHIPS.length);
  });

  it("tem ficha para todo id de modelo", () => {
    for (const id of PAGE_TEMPLATE_IDS) {
      expect(TEMPLATE_STYLES[id as PageTemplateId]?.personality).toBeTruthy();
    }
  });
});
