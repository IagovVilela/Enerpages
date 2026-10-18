import { describe, expect, it } from "vitest";
import { generateDeterministic } from "@/lib/ai/fallback";
import { directionLabelFor } from "@/lib/ai/archetypes";
import type { Briefing } from "@/puck/schema";

const base: Briefing = {
  clientName: "Casa Norte",
  segment: "barbearia",
  audience: "",
  tone: "",
  differentials: "",
  services: "",
  colors: "",
  references: "",
  goal: "agendar",
  slug: "casa-norte",
  address: "",
  whatsapp: "",
  templateId: "",
  headline: "",
  tagline: "",
  backgroundColor: "",
};

describe("generateDeterministic", () => {
  it("gera 3 propostas com layouts, temas e copy distintos", () => {
    const a = generateDeterministic(base, 0);
    const b = generateDeterministic(base, 1);
    const c = generateDeterministic(base, 2);

    const typesA = a.content.map((block) => block.type).join(",");
    const typesB = b.content.map((block) => block.type).join(",");
    const typesC = c.content.map((block) => block.type).join(",");

    expect(new Set([typesA, typesB, typesC]).size).toBeGreaterThanOrEqual(2);
    expect(a.root.props.theme.colors.background).not.toEqual(b.root.props.theme.colors.background);
    expect(a.root.props.theme.personality).toBeTruthy();
    expect(directionLabelFor("barbearia", 0)).not.toEqual(directionLabelFor("barbearia", 1));

    const heroA = a.content.find((block) => block.type === "Hero");
    const heroB = b.content.find((block) => block.type === "Hero");
    expect(heroA?.type === "Hero" && heroB?.type === "Hero").toBe(true);
    if (heroA?.type === "Hero" && heroB?.type === "Hero") {
      expect(heroA.props.title).not.toEqual(heroB.props.title);
      expect(heroA.props.variant).not.toEqual(heroB.props.variant);
    }

    expect(c.content.some((block) => block.type === "Testimonials")).toBe(false);
    const testimonials = [a, b, c].flatMap((doc) =>
      doc.content.filter((block) => block.type === "Testimonials"),
    );
    for (const block of testimonials) {
      if (block.type !== "Testimonials") continue;
      expect(block.props.items[0]?.placeholder).toBe(true);
    }
  });

  it("respeita modelo, headline e endereço do briefing", () => {
    const doc = generateDeterministic(
      {
        ...base,
        segment: "moda",
        templateId: "vitrine",
        headline: "Cápsula sob medida",
        tagline: "Venha conhecer a nossa loja",
        address: "Rua das Flores, 100",
        whatsapp: "11999990000",
        colors: "#e7ff3d",
        backgroundColor: "#111111",
      },
      0,
    );
    const hero = doc.content.find((block) => block.type === "Hero");
    const map = doc.content.find((block) => block.type === "Map");
    expect(hero?.type === "Hero" && hero.props.title).toBe("Cápsula sob medida");
    expect(hero?.type === "Hero" && hero.props.variant).toBe("split");
    expect(doc.root.props.theme.colors.background.toLowerCase()).toBe("#111111");
    expect(doc.root.props.whatsapp.phone).toBe("11999990000");
    expect(map?.type === "Map" && map.props.address).toBe("Rua das Flores, 100");
    expect(doc.content.some((block) => block.type === "Catalog")).toBe(true);
    expect(doc.content.some((block) => block.type === "Gallery")).toBe(false);
  });

  it("respeita segmentos éticos sem claims proibidos no hero", () => {
    const doc = generateDeterministic({ ...base, segment: "advocacia", clientName: "Silva Advogados" }, 0);
    const hero = doc.content.find((block) => block.type === "Hero");
    expect(hero?.type).toBe("Hero");
    if (hero?.type === "Hero") {
      expect(hero.props.subtitle.toLowerCase()).not.toMatch(/garantid|100\s*%|ganho/);
    }
  });
});
