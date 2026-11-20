import type { TemplateStyle } from "@/lib/ai/template-styles";
import { ARCHETYPES } from "@/lib/ai/archetypes";
import type { BlockType, Briefing } from "@/puck/schema";

const MEDIA_HEAVY = new Set<BlockType>(["Gallery", "Video", "BeforeAfter"]);
const TEXT_FILLERS: BlockType[] = ["About", "Process", "Faq", "Services"];
const ETHICAL_SEGMENTS = new Set(["advocacia", "psicologia", "clinica", "odontologia"]);
const CATALOG_SEGMENTS = new Set(["moda", "restaurante", "imobiliaria", "confeitaria", "hotelaria"]);
const PRICING_SEGMENTS = new Set(["barbearia", "fitness", "estetica", "clinica"]);

function unique(types: BlockType[]): BlockType[] {
  return types.filter((type, index, arr) => arr.indexOf(type) === index);
}

function insertBefore(sequence: BlockType[], before: BlockType, block: BlockType): BlockType[] {
  if (sequence.includes(block)) return sequence;
  const at = sequence.indexOf(before);
  if (at === -1) return [...sequence, block];
  return [...sequence.slice(0, at), block, ...sequence.slice(at)];
}

function insertAfter(sequence: BlockType[], after: BlockType, block: BlockType): BlockType[] {
  if (sequence.includes(block)) return sequence;
  const at = sequence.indexOf(after);
  if (at === -1) return [...sequence, block];
  return [...sequence.slice(0, at + 1), block, ...sequence.slice(at + 1)];
}

/**
 * Ajusta a sequência de blocos do modelo conforme specs do briefing
 * (goal, endereço, WhatsApp, ética, volume de serviços).
 */
export function resolveRecipe(input: {
  briefing: Briefing;
  template: TemplateStyle;
  direction?: number;
  seed?: number;
}): BlockType[] {
  const { briefing, template } = input;
  const dir = ((((input.direction ?? 0) % 3) + 3) % 3);
  const seed = input.seed ?? 0;
  const archetype = ARCHETYPES[briefing.segment] ?? ARCHETYPES.local!;
  const ethical = Boolean(archetype.ethical) || ETHICAL_SEGMENTS.has(briefing.segment);
  const explicit = new Set(template.blocks ?? []);

  const rawRecipe =
    template.blocks?.filter((t) => t !== "Navbar" && t !== "Footer" && t !== "WhatsApp") ??
    archetype.recipes[dir] ??
    archetype.recipes[0]!;

  let body = rawRecipe.map((type, index) => {
    if (!MEDIA_HEAVY.has(type) || explicit.has(type)) return type;
    return TEXT_FILLERS[(seed + index + dir) % TEXT_FILLERS.length]!;
  });

  if (ethical) {
    body = body.filter((type) => type !== "Testimonials");
    if (!briefing.differentials.trim() && !briefing.services.trim()) {
      body = body.filter((type) => type !== "Stats");
    }
  }

  const serviceCount = briefing.services
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean).length;

  if (serviceCount >= 5) {
    if (CATALOG_SEGMENTS.has(briefing.segment) && !body.includes("Catalog")) {
      body = insertAfter(body, "Hero", "Catalog");
      if (!body.includes("Catalog")) body = ["Catalog", ...body];
    } else if (
      PRICING_SEGMENTS.has(briefing.segment) &&
      !body.includes("Pricing") &&
      !body.includes("Catalog")
    ) {
      body = body.includes("Services") ? insertAfter(body, "Services", "Pricing") : [...body, "Pricing"];
    }
  }

  if (briefing.goal === "agendar") {
    if (!body.includes("Booking") && !body.includes("Cta") && !body.includes("Contact")) {
      body = [...body, "Booking"];
    } else if (!body.includes("Booking") && briefing.segment !== "advocacia") {
      body = body.includes("Contact") ? insertBefore(body, "Contact", "Booking") : body;
      if (!body.includes("Booking") && !body.includes("Cta")) body = [...body, "Booking"];
    }
  }

  if (
    briefing.goal === "vender" &&
    !body.includes("Cta") &&
    !body.includes("Catalog") &&
    !body.includes("Pricing")
  ) {
    body = [...body, "Cta"];
  }

  const wantsMap = Boolean(briefing.address?.trim()) || body.includes("Map");
  const withWhatsApp =
    Boolean(briefing.whatsapp?.trim()) ||
    Boolean(template.blocks?.includes("WhatsApp")) ||
    (!template.blocks && archetype.blocks.includes("WhatsApp"));

  const needsFallbackCta =
    !template.blocks &&
    !body.includes("Cta") &&
    !body.includes("Contact") &&
    !body.includes("Booking");

  let sequence: BlockType[] = [
    "Navbar",
    ...body.filter((t) => t !== "Navbar" && t !== "Footer" && t !== "WhatsApp" && t !== "Map"),
    ...(wantsMap ? (["Map"] as const) : []),
    ...(needsFallbackCta ? (["Cta"] as const) : []),
    "Footer",
    ...(withWhatsApp ? (["WhatsApp"] as const) : []),
  ];

  if (briefing.goal === "agendar" && !sequence.includes("Booking") && !sequence.includes("Cta")) {
    sequence = insertBefore(sequence, "Footer", "Booking");
  }

  return unique(sequence);
}

/** Assinatura estrutural para comparar propostas (tipos+variantes+fontes). */
export function pageDiversitySignature(document: {
  content: Array<{ type: string; props: { variant?: string } }>;
  root: { props: { theme: { fonts: { display: string; body: string } } } };
}): string {
  const blocks = document.content.map((block) => `${block.type}:${block.props.variant ?? ""}`).join(">");
  const fonts = `${document.root.props.theme.fonts.display}/${document.root.props.theme.fonts.body}`;
  return `${fonts}|${blocks}`;
}
