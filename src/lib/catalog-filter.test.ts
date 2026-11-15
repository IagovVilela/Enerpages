import { describe, expect, it } from "vitest";
import { catalogFacetOptions, catalogItemMatches, EMPTY_CATALOG_QUERY, pruneCatalogQuery } from "@/lib/catalog-filter";

const casa = { group: "Comprar", place: "Jardins", kind: "Casa", band: "Acima de 6 mi" };

describe("catalog filter", () => {
  it("mostra tudo quando a busca está vazia", () => {
    expect(catalogItemMatches(casa, EMPTY_CATALOG_QUERY)).toBe(true);
    expect(catalogItemMatches({}, EMPTY_CATALOG_QUERY)).toBe(true);
  });

  it("cruza aba, local e tipo", () => {
    expect(catalogItemMatches(casa, { ...EMPTY_CATALOG_QUERY, group: "Comprar" })).toBe(true);
    expect(catalogItemMatches(casa, { ...EMPTY_CATALOG_QUERY, group: "comprar" })).toBe(true);
    expect(catalogItemMatches(casa, { ...EMPTY_CATALOG_QUERY, group: "Alugar" })).toBe(false);
    expect(catalogItemMatches(casa, { ...EMPTY_CATALOG_QUERY, place: "Jardins", kind: "Casa" })).toBe(true);
    expect(catalogItemMatches(casa, { ...EMPTY_CATALOG_QUERY, place: "Jardins", kind: "Apartamento" })).toBe(false);
  });

  it("esconde item sem a faceta quando ela está selecionada", () => {
    expect(catalogItemMatches({ group: "" }, { ...EMPTY_CATALOG_QUERY, group: "Comprar" })).toBe(false);
  });

  it("encolhe local e tipo conforme a aba", () => {
    const items = [
      casa,
      { group: "Alugar", place: "Pinheiros", kind: "Apartamento", band: "Até 3 mi" },
      { group: "Alugar", place: "Alphaville", kind: "Casa", band: "3 a 6 mi" },
    ];
    const alugar = { ...EMPTY_CATALOG_QUERY, group: "Alugar" };
    expect(catalogFacetOptions(items, alugar).place).toEqual(["Pinheiros", "Alphaville"]);
    expect(catalogFacetOptions(items, alugar).kind).toEqual(["Apartamento", "Casa"]);
    expect(pruneCatalogQuery(items, { ...alugar, place: "Jardins" }, "group").place).toBe("");
    expect(pruneCatalogQuery(items, { ...alugar, place: "Jardins" }, "group").group).toBe("Alugar");
  });
});
