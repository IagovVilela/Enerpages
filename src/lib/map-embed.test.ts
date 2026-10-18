import { describe, expect, it } from "vitest";
import { isLikelyPageUrl, isUsableMapAddress, mapsEmbedFromAddress, toMapEmbedSrc } from "@/lib/map-embed";

describe("toMapEmbedSrc", () => {
  it("monta embed a partir do endereço", () => {
    const src = toMapEmbedSrc("", "Rua das Flores, 100");
    expect(src).toContain("maps.google.com/maps");
    expect(src).toContain("output=embed");
    expect(src).toContain(encodeURIComponent("Rua das Flores, 100"));
  });

  it("ignora placeholder de endereço", () => {
    expect(toMapEmbedSrc("", "Endereço a substituir")).toBe("");
    expect(isUsableMapAddress("Endereço a substituir")).toBe(false);
  });

  it("rejeita www.google.com nu", () => {
    expect(toMapEmbedSrc("https://www.google.com", "")).toBe("");
    expect(toMapEmbedSrc("https://www.google.com/", "Rua A")).toContain("Rua");
    expect(toMapEmbedSrc("https://www.google.com/", "Rua A")).toContain("output=embed");
  });

  it("converte link de place em embed", () => {
    const src = toMapEmbedSrc("https://www.google.com/maps/place/Atelier+Vento/@-23.5,-46.6,17z", "");
    expect(src).toContain("output=embed");
    expect(src).toMatch(/Atelier|23\.5/);
  });

  it("converte /maps/search/ em embed", () => {
    const src = toMapEmbedSrc("https://www.google.com/maps/search/Rua+das+Flores+100", "");
    expect(src).toContain("output=embed");
    expect(src).toContain("Flores");
  });

  it("mantém embed oficial", () => {
    const embed = "https://www.google.com/maps/embed?pb=0";
    expect(toMapEmbedSrc(embed, "")).toBe(embed);
  });
});

describe("mapsEmbedFromAddress", () => {
  it("retorna vazio sem endereço", () => {
    expect(mapsEmbedFromAddress("  ")).toBe("");
  });
});

describe("isLikelyPageUrl", () => {
  it("detecta homepage do Google", () => {
    expect(isLikelyPageUrl("https://www.google.com")).toBe(true);
    expect(isLikelyPageUrl("https://www.google.com/search?q=logo")).toBe(true);
  });

  it("aceita arquivo de imagem", () => {
    expect(isLikelyPageUrl("https://cdn.example.com/logo.png")).toBe(false);
    expect(isLikelyPageUrl("/uploads/a.jpg")).toBe(false);
  });
});
