import { describe, expect, it } from "vitest";
import { generateDeterministic } from "@/lib/ai/fallback";
import { pageDiversitySignature, resolveRecipe } from "@/lib/ai/resolve-recipe";
import { getTemplateStyle } from "@/lib/ai/template-styles";
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
  goal: "captar",
  slug: "casa-norte",
  address: "",
  whatsapp: "",
  templateId: "navalha",
  headline: "",
  tagline: "",
  backgroundColor: "",
};

describe("resolveRecipe", () => {
  it("inclui Map e WhatsApp a partir do briefing", () => {
    const sequence = resolveRecipe({
      briefing: {
        ...base,
        address: "Rua A, 10",
        whatsapp: "11999990000",
      },
      template: getTemplateStyle("navalha"),
    });
    expect(sequence).toContain("Map");
    expect(sequence).toContain("WhatsApp");
    expect(sequence[0]).toBe("Navbar");
    expect(sequence).toContain("Footer");
  });

  it("para goal agendar em clínica, garante Booking", () => {
    const sequence = resolveRecipe({
      briefing: {
        ...base,
        segment: "clinica",
        templateId: "essenza",
        goal: "agendar",
        services: "Consulta",
      },
      template: getTemplateStyle("essenza"),
    });
    expect(sequence.some((type) => type === "Booking" || type === "Cta" || type === "Contact")).toBe(
      true,
    );
  });

  it("em segmento ético remove Testimonials", () => {
    const sequence = resolveRecipe({
      briefing: { ...base, segment: "advocacia", templateId: "ferraz" },
      template: {
        ...getTemplateStyle("ferraz"),
        blocks: ["Navbar", "Hero", "Testimonials", "Contact", "Footer"],
      },
    });
    expect(sequence).not.toContain("Testimonials");
  });

  it("com muitos serviços em moda inclui Catalog", () => {
    const sequence = resolveRecipe({
      briefing: {
        ...base,
        segment: "moda",
        templateId: "maison",
        services: "Peça 1, Peça 2, Peça 3, Peça 4, Peça 5, Peça 6",
      },
      template: {
        ...getTemplateStyle("maison"),
        blocks: ["Navbar", "Hero", "About", "Process", "Footer"],
      },
    });
    expect(sequence).toContain("Catalog");
  });
});

describe("diversidade das propostas", () => {
  it("gera três assinaturas distintas no trio do segmento", () => {
    const briefing: Briefing = { ...base, templateId: "", segment: "restaurante" };
    const docs = [0, 1, 2].map((dir) => generateDeterministic(briefing, dir));
    const signatures = docs.map(pageDiversitySignature);
    expect(new Set(signatures).size).toBe(3);
  });

  it("goal agendar em barbearia ativa dock de booking no hero", () => {
    const doc = generateDeterministic(
      { ...base, goal: "agendar", templateId: "navalha", whatsapp: "11988887777" },
      0,
    );
    const hero = doc.content.find((block) => block.type === "Hero");
    expect(hero?.type).toBe("Hero");
    if (hero?.type === "Hero") {
      expect(hero.props.dock).toBe("booking");
    }
    expect(doc.content.some((block) => block.type === "WhatsApp")).toBe(true);
  });
});
