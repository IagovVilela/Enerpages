import { describe, expect, it } from "vitest";
import { isValidSlug, normalizeSlug, slugError } from "@/lib/slug";
import { publicOrigin, resolveHost, usesPathTenantUrls } from "@/lib/tenant";
import { generateDeterministic } from "@/lib/ai/fallback";
import { buildPageTemplate, PAGE_TEMPLATE_IDS } from "@/puck/page-templates";
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
    expect(resolveHost("enerpages-production.up.railway.app", "localhost").kind).toBe("studio");
  });

  it("usa path público em hosts Railway/Vercel (sem SSL em subdomínio aninhado)", () => {
    expect(usesPathTenantUrls("enerpages-production.up.railway.app")).toBe(true);
    expect(usesPathTenantUrls("app.vercel.app")).toBe(true);
    expect(usesPathTenantUrls("enerpages.com.br")).toBe(false);

    const prev = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = "enerpages-production.up.railway.app";
    expect(publicOrigin("almeida-rocha-advogados")).toBe(
      "https://enerpages-production.up.railway.app/site/slug/almeida-rocha-advogados",
    );
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = "localhost:3000";
    expect(publicOrigin("atelier-luna")).toBe("http://atelier-luna.localhost:3000");
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = prev;
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

describe("modelos de página", () => {
  it("monta documentos válidos para todos os templates", () => {
    for (const id of PAGE_TEMPLATE_IDS) {
      const doc = buildPageTemplate(id, "Cliente Teste", "local");
      expect(pageDataSchema.safeParse(doc).success).toBe(true);
      expect(doc.content.length).toBeGreaterThan(0);
    }
    const blank = buildPageTemplate("blank", "Cliente Teste", "local");
    expect(blank.content.map((block) => block.type)).toEqual(["Navbar", "Hero", "Footer"]);
  });
});

describe("biblioteca de seções", () => {
  it("cobre todos os blocos e gera seções/prontos", async () => {
    const {
      insertBlocks,
      makeFreshBlock,
      makeSectionBlocks,
      SECTION_PRESETS,
      LIBRARY_ITEM_GROUPS,
      READY_PRESETS,
    } = await import("@/puck/section-presets");
    const { BLOCK_TYPES } = await import("@/puck/schema");
    const libraryTypes = new Set(LIBRARY_ITEM_GROUPS.flatMap((group) => group.items.map((item) => item.type)));
    for (const type of BLOCK_TYPES) {
      expect(libraryTypes.has(type)).toBe(true);
    }
    expect(READY_PRESETS.flatMap((group) => group.items).length).toBeGreaterThan(30);
    expect(SECTION_PRESETS.length).toBeGreaterThanOrEqual(8);
    const hero = makeFreshBlock("Hero", "cinematic");
    expect(hero.type).toBe("Hero");
    const section = makeSectionBlocks(SECTION_PRESETS.find((item) => item.id === "hero-diffs")!);
    expect(section.length).toBe(2);
    const withFooter = [
      { type: "Navbar", props: { id: "nav-1" } },
      { type: "Footer", props: { id: "foot-1" } },
    ] as never;
    const next = insertBlocks(withFooter, section);
    expect(next.at(-1)?.type).toBe("Footer");
  });
});

describe("senha", () => {
  it("confere o hash argon2", async () => {
    const hash = await hashPassword("senha-local-forte");
    expect(await verifyPassword("senha-local-forte", hash)).toBe(true);
    expect(await verifyPassword("outra-senha", hash)).toBe(false);
  });
});
