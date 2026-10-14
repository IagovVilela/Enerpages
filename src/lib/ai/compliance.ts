import type { Block, PageDocument } from "@/puck/schema";
import { ARCHETYPES } from "@/lib/ai/archetypes";

const REPLACEMENTS: Record<string, string> = {
  advocacia: "Atendimento jurídico responsável, com linguagem clara e sem promessa de resultado.",
  psicologia: "Acolhimento profissional. Cada processo é singular e não há promessa de resultado.",
  clinica: "Informação de serviço de saúde, sem promessa de cura ou resultado.",
  infoproduto: "Conteúdo educacional. Resultados dependem de dedicação individual.",
};

function scrub(value: string, patterns: RegExp[], fallback: string) {
  return patterns.some((pattern) => pattern.test(value)) ? fallback : value;
}

function walk(value: unknown, patterns: RegExp[], fallback: string): unknown {
  if (typeof value === "string") return scrub(value, patterns, fallback);
  if (Array.isArray(value)) return value.map((item) => walk(item, patterns, fallback));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, walk(item, patterns, fallback)]),
    );
  }
  return value;
}

export function enforceCompliance(document: PageDocument, segment: string): PageDocument {
  const archetype = ARCHETYPES[segment];
  const patterns = archetype?.forbidden ?? [];
  const fallback = REPLACEMENTS[segment] ?? "Texto institucional, sem promessa de resultado.";
  const scrubbed = (patterns.length ? walk(document, patterns, fallback) : document) as PageDocument;

  scrubbed.content = scrubbed.content.map((block) => {
    if (block.type === "Testimonials") {
      return {
        ...block,
        props: {
          ...block.props,
          items: block.props.items.map((item) => ({
            ...item,
            quote: "Substituir depoimento real — não publique texto inventado.",
            name: "Nome do cliente",
            role: "Substituir",
            placeholder: true,
            image: { src: "", alt: "", placeholder: true },
          })),
        },
      };
    }
    if (block.type === "Team") {
      return {
        ...block,
        props: {
          ...block.props,
          people: block.props.people.map((person) => ({
            ...person,
            image: person.image.src.startsWith("/uploads/")
              ? person.image
              : { src: "", alt: "", placeholder: true },
          })),
        },
      };
    }
    return block;
  }) as Block[];

  return scrubbed;
}
