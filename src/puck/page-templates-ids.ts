export const PAGE_TEMPLATE_IDS = [
  "blank",
  "classic",
  "studio",
  "minimal",
  "moderno",
  "editorial",
  "impacto",
  "noir",
  "neon",
  "brutalista",
  "ocean",
  "boutique",
  "bauhaus",
  "rua",
  "vitrine",
] as const;

export type PageTemplateId = (typeof PAGE_TEMPLATE_IDS)[number];
