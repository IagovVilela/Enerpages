import { describe, expect, it } from "vitest";
import { isValidSlug, normalizeSlug, slugError } from "@/lib/slug";
import { resolveHost } from "@/lib/tenant";
import { generateDeterministic } from "@/lib/ai/fallback";
import { enforceCompliance } from "@/lib/ai/compliance";
import { pageDataSchema, type PageDocument } from "@/puck/schema";
import { hashPassword, verifyPassword } from "@/lib/password";

const briefing = {
  clientName: "Atelier Luna",
  segment: "moda" as const,
  audience: "quem veste peça única",
  tone: "editorial",
  differentials: "corte próximo do corpo",
  services: "Alfaiataria, Vestidos, Ajustes",
  colors: "#8f3d2b",
  references: "",
  goal: "vender" as const,
  slug: "atelier-luna",
};

describe("slug", () => {
  it("normaliza e recusa reservados", () => {
    expect(normalizeSlug("Atelier Luna!")).toBe("atelier-luna");
    expect(slugError("admin")).toBeTruthy();
    expect(isValidSlug("marina-coelho")).toBe(true);
  });
});

describe("tenant", () => {
  it("separa estúdio, subdomínio e domínio próprio", () => {
    expect(resolveHost("localhost:3000", "localhost").kind).toBe("studio");
    expect(resolveHost("atelier-luna.localhost:3000", "localhost")).toEqual({ kind: "tenant", slug: "atelier-luna" });
    expect(resolveHost("www.localhost", "localhost").kind).toBe("studio");
    expect(resolveHost("cliente.com.br", "localhost")).toEqual({ kind: "custom", host: "cliente.com.br" });
  });
});

describe("documento", () => {
  it("gera páginas válidas e diferentes entre segmentos", () => {
    const fashion = generateDeterministic(briefing, 0);
    const law = generateDeterministic(
      { ...briefing, clientName: "Marina Coelho", segment: "advocacia", goal: "captar", colors: "" },
      0,
    );
    expect(pageDataSchema.safeParse(fashion).success).toBe(true);
    expect(pageDataSchema.safeParse(law).success).toBe(true);
    expect(fashion.root.props.theme.colors.primary).not.toBe(law.root.props.theme.colors.primary);
    expect(fashion.content.map((block) => block.type).join()).not.toBe(law.content.map((block) => block.type).join());
  });

  it("não publica depoimento inventado nem promessa jurídica", () => {
    const portfolio = generateDeterministic({ ...briefing, clientName: "Helena Vilela", segment: "portfolio" }, 0);
    expect(JSON.stringify(portfolio)).toContain("Substituir depoimento real");
    const law = generateDeterministic({ ...briefing, clientName: "Marina Coelho", segment: "advocacia", services: "Contratos", goal: "captar" }, 1);
    expect(JSON.stringify(law).toLowerCase()).not.toContain("resultado garantido");
    const poisoned = structuredClone(law) as PageDocument;
    const hero = poisoned.content.find((block) => block.type === "Hero");
    if (hero?.type === "Hero") hero.props.subtitle = "Resultado garantido em toda causa.";
    const clean = enforceCompliance(poisoned, "advocacia");
    const cleanHero = clean.content.find((block) => block.type === "Hero");
    expect(cleanHero?.type === "Hero" ? cleanHero.props.subtitle : "").not.toMatch(/garantid/i);
  });
});

describe("senha", () => {
  it("confere o hash argon2", async () => {
    const hash = await hashPassword("senha-local-forte");
    expect(await verifyPassword("senha-local-forte", hash)).toBe(true);
    expect(await verifyPassword("outra-senha", hash)).toBe(false);
  });
});
