export const CATALOG_FACETS = ["group", "place", "kind", "band"] as const;

export type CatalogFacetKey = (typeof CATALOG_FACETS)[number];

export type CatalogFacets = Partial<Record<CatalogFacetKey, string>>;

export type CatalogQuery = Record<CatalogFacetKey, string>;

export const EMPTY_CATALOG_QUERY: CatalogQuery = {
  group: "",
  place: "",
  kind: "",
  band: "",
};

function sameFacet(left: string, right: string) {
  return left.localeCompare(right, "pt-BR", { sensitivity: "base" }) === 0;
}

/** Item entra na seleção quando cada faceta preenchida na busca bate com o item. */
export function catalogItemMatches(item: CatalogFacets, query: CatalogQuery) {
  return CATALOG_FACETS.every((key) => {
    const selected = query[key].trim();
    if (!selected) return true;
    const value = (item[key] ?? "").trim();
    if (!value) return false;
    return sameFacet(value, selected);
  });
}

export function catalogQueryActive(query: CatalogQuery) {
  return CATALOG_FACETS.some((key) => query[key].trim().length > 0);
}

/** Cada lista ignora a própria escolha e só mostra valores que ainda existem com o resto da busca. */
export function catalogFacetOptions(
  items: CatalogFacets[],
  query: CatalogQuery = EMPTY_CATALOG_QUERY,
): Record<CatalogFacetKey, string[]> {
  const options: Record<CatalogFacetKey, string[]> = { group: [], place: [], kind: [], band: [] };
  for (const key of CATALOG_FACETS) {
    const narrowed = { ...query, [key]: "" };
    for (const item of items) {
      if (!catalogItemMatches(item, narrowed)) continue;
      const value = (item[key] ?? "").trim();
      if (!value) continue;
      const list = options[key];
      if (!list.some((current) => sameFacet(current, value))) list.push(value);
    }
  }
  return options;
}

function sameQuery(left: CatalogQuery, right: CatalogQuery) {
  return CATALOG_FACETS.every((key) => left[key] === right[key]);
}

/** Tira da busca a faceta que deixou de existir. A faceta recém-escolhida permanece. */
export function pruneCatalogQuery(items: CatalogFacets[], query: CatalogQuery, locked?: CatalogFacetKey) {
  const next = { ...query };
  for (const key of [...CATALOG_FACETS].reverse()) {
    if (key === locked) continue;
    const selected = next[key].trim();
    if (!selected) continue;
    const choices = catalogFacetOptions(items, next)[key];
    if (!choices.some((choice) => sameFacet(choice, selected))) next[key] = "";
  }
  return sameQuery(next, query) ? query : next;
}
