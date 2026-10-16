import { ARCHETYPES, FONT_BY_PERSONALITY, STYLE_BY_PERSONALITY } from "@/lib/ai/archetypes";
import { enforceCompliance } from "@/lib/ai/compliance";
import { generateDeterministic } from "@/lib/ai/fallback";
import {
  pageDataSchema,
  type Animation,
  type Block,
  type Briefing,
  type BlockType,
  type PageDocument,
  type Theme,
} from "@/puck/schema";

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

export type PageTemplateMeta = {
  id: PageTemplateId;
  label: string;
  tagline: string;
  vibe: string;
  swatch: string;
  layoutHint: string;
};

export const PAGE_TEMPLATE_META: PageTemplateMeta[] = [
  {
    id: "blank",
    label: "Em branco",
    tagline: "Navbar, hero e rodapé — canvas quase vazio para montar do zero.",
    vibe: "Começar do zero",
    swatch: "#3f3f46",
    layoutHint: "Navbar · Hero · Footer",
  },
  {
    id: "classic",
    label: "Clássico",
    tagline: "Layout tradicional com serviços, sobre e contato.",
    vibe: "Negócio local",
    swatch: "#d4a574",
    layoutHint: "Hero · Serviços · Sobre · Contato",
  },
  {
    id: "studio",
    label: "Estúdio",
    tagline: "Visual forte: galeria, vídeo e processo.",
    vibe: "Visual / foto",
    swatch: "#c084fc",
    layoutHint: "Hero · Galeria · Vídeo · Processo",
  },
  {
    id: "minimal",
    label: "Minimalista",
    tagline: "Poucos blocos, muito espaço, tipografia limpa.",
    vibe: "Leve / clean",
    swatch: "#e4e4e7",
    layoutHint: "Hero · Sobre · CTA · Contato",
  },
  {
    id: "moderno",
    label: "Moderno",
    tagline: "Geometria, stats e seções em grade.",
    vibe: "Geométrico",
    swatch: "#22d3ee",
    layoutHint: "Hero · Stats · Serviços · CTA",
  },
  {
    id: "editorial",
    label: "Editorial",
    tagline: "Tom de revista: manifesto, timeline e citação.",
    vibe: "Revista",
    swatch: "#f5f0e8",
    layoutHint: "Hero · Sobre · Timeline · Depoimentos",
  },
  {
    id: "impacto",
    label: "Impacto",
    tagline: "Hero imersivo, marquee e blocos numerados.",
    vibe: "Ousado",
    swatch: "#fb923c",
    layoutHint: "Hero · Marquee · Processo · CTA",
  },
  {
    id: "noir",
    label: "Noir",
    tagline: "Premium escuro com sidebar visual e luxo.",
    vibe: "Premium night",
    swatch: "#d4af37",
    layoutHint: "Hero · Sobre · Serviços · Contato",
  },
  {
    id: "neon",
    label: "Neon",
    tagline: "Noturno tech: tipografia bold e lista densa.",
    vibe: "Noturno / tech",
    swatch: "#a3e635",
    layoutHint: "Hero · Serviços · FAQ · CTA",
  },
  {
    id: "brutalista",
    label: "Brutalista",
    tagline: "Bordas duras, tipografia pesada, zero suavidade.",
    vibe: "Raw",
    swatch: "#fafafa",
    layoutHint: "Hero · Stats · Serviços · Contato",
  },
  {
    id: "ocean",
    label: "Ocean",
    tagline: "Frescor orgânico com mapa e agendamento.",
    vibe: "Calmo / natural",
    swatch: "#67e8f9",
    layoutHint: "Hero · Serviços · Mapa · Booking",
  },
  {
    id: "boutique",
    label: "Boutique",
    tagline: "Luxo leve: catálogo, galeria e CTA discreto.",
    vibe: "Premium warm",
    swatch: "#e8d5b7",
    layoutHint: "Hero · Catálogo · Galeria · CTA",
  },
  {
    id: "bauhaus",
    label: "Bauhaus",
    tagline: "Blocos geométricos, contraste alto e ritmo curto.",
    vibe: "Forma / função",
    swatch: "#ef4444",
    layoutHint: "Hero · Serviços · Stats · Contato",
  },
  {
    id: "rua",
    label: "Rua",
    tagline: "Local e direto: serviços, mapa e WhatsApp.",
    vibe: "Bairro",
    swatch: "#f59e0b",
    layoutHint: "Hero · Serviços · Mapa · WhatsApp",
  },
  {
    id: "vitrine",
    label: "Vitrine",
    tagline: "Lookbook de moda: catálogo, marquee e galeria.",
    vibe: "Moda / vitrine",
    swatch: "#e7ff3d",
    layoutHint: "Hero · Marquee · Catálogo · Galeria",
  },
];

type TemplateStyle = {
  personality: Theme["personality"];
  colors: Theme["colors"];
  motion: Animation["preset"];
  blocks?: BlockType[];
  heroVariant?: string;
  direction?: number;
  preferredSegment?: Briefing["segment"];
};

const TEMPLATE_STYLES: Record<PageTemplateId, TemplateStyle> = {
  blank: {
    personality: "minimal",
    colors: paper("#f7f7f5", "#171717", "#171717", "#e5e5e5", "#f0f0ee", "#d4d4d4"),
    motion: "fade",
    blocks: ["Navbar", "Hero", "Footer"],
    heroVariant: "split",
  },
  classic: {
    personality: "warm",
    colors: paper("#f6f1ea", "#1c1410", "#8f3d2b", "#c6a15b", "#efe6da", "#e4d8c8"),
    motion: "fade",
    preferredSegment: "barbearia",
    direction: 0,
  },
  studio: {
    personality: "editorial",
    colors: paper("#0e0e0e", "#f5f5f5", "#d6ff3f", "#1a1a1a", "#161616", "#2a2a2a"),
    motion: "mask-reveal",
    preferredSegment: "portfolio",
    direction: 1,
    blocks: ["Navbar", "Hero", "About", "Gallery", "Video", "Process", "Contact", "Footer"],
  },
  minimal: {
    personality: "minimal",
    colors: paper("#fafafa", "#111111", "#111111", "#f0f0f0", "#f5f5f5", "#e5e5e5"),
    motion: "fade",
    blocks: ["Navbar", "Hero", "About", "Cta", "Contact", "Footer"],
    heroVariant: "editorial",
  },
  moderno: {
    personality: "bold",
    colors: paper("#f4f4f1", "#111111", "#0891b2", "#ecece8", "#f7f7f4", "#deded8"),
    motion: "slide-up",
    blocks: ["Navbar", "Hero", "Stats", "Services", "Cta", "Contact", "Footer"],
    heroVariant: "asymmetric",
  },
  editorial: {
    personality: "editorial",
    colors: paper("#f5f0e8", "#1c1915", "#1c1915", "#efe8dc", "#f3eee6", "#e2d8c8"),
    motion: "mask-reveal",
    preferredSegment: "portfolio",
    blocks: ["Navbar", "Hero", "About", "Timeline", "Testimonials", "Contact", "Footer"],
    heroVariant: "editorial",
  },
  impacto: {
    personality: "bold",
    colors: paper("#111111", "#f5f5f2", "#fb923c", "#1c1c1c", "#161616", "#2a2a2a"),
    motion: "scale",
    blocks: ["Navbar", "Hero", "Marquee", "Process", "Stats", "Cta", "Footer"],
    heroVariant: "immersive",
  },
  noir: {
    personality: "luxury",
    colors: paper("#0b0b0c", "#f5f0e6", "#d4af37", "#151515", "#121212", "#2a2a2a"),
    motion: "fade",
    blocks: ["Navbar", "Hero", "About", "Services", "Faq", "Contact", "Footer"],
    heroVariant: "split",
  },
  neon: {
    personality: "bold",
    colors: paper("#09090b", "#ecfccb", "#a3e635", "#14532d", "#0c0c0e", "#27272a"),
    motion: "slide-left",
    blocks: ["Navbar", "Hero", "Services", "Faq", "Cta", "Footer", "WhatsApp"],
    heroVariant: "immersive",
  },
  brutalista: {
    personality: "brutalist",
    colors: paper("#fafafa", "#000000", "#000000", "#ffffff", "#f4f4f5", "#000000"),
    motion: "none",
    blocks: ["Navbar", "Hero", "Stats", "Services", "Contact", "Footer"],
    heroVariant: "asymmetric",
  },
  ocean: {
    personality: "organic",
    colors: paper("#f0fdfa", "#134e4a", "#0f766e", "#ccfbf1", "#ecfeff", "#99f6e4"),
    motion: "slide-up",
    preferredSegment: "clinica",
    blocks: ["Navbar", "Hero", "Services", "About", "Map", "Booking", "Contact", "Footer", "WhatsApp"],
  },
  boutique: {
    personality: "luxury",
    colors: paper("#fbf7f2", "#2a2118", "#6b2d3c", "#d7c4a3", "#f3ece3", "#e6d9c8"),
    motion: "fade",
    preferredSegment: "moda",
    blocks: ["Navbar", "Hero", "Catalog", "Gallery", "About", "Cta", "Footer"],
  },
  bauhaus: {
    personality: "bold",
    colors: paper("#f8fafc", "#0f172a", "#ef4444", "#fef08a", "#f1f5f9", "#cbd5e1"),
    motion: "stagger",
    blocks: ["Navbar", "Hero", "Services", "Stats", "Contact", "Footer"],
    heroVariant: "asymmetric",
  },
  rua: {
    personality: "warm",
    colors: paper("#fffaf3", "#2b2118", "#d97706", "#fff1dc", "#f8f1e6", "#eadcc8"),
    motion: "slide-up",
    preferredSegment: "local",
    blocks: ["Navbar", "Hero", "Services", "About", "Map", "Contact", "Footer", "WhatsApp"],
  },
  vitrine: {
    personality: "editorial",
    colors: paper("#111111", "#f5f5f2", "#e7ff3d", "#f5f5f2", "#1c1c1c", "#2a2a2a"),
    motion: "mask-reveal",
    preferredSegment: "moda",
    blocks: ["Navbar", "Hero", "Marquee", "Catalog", "Gallery", "Cta", "Footer", "WhatsApp"],
    heroVariant: "immersive",
  },
};

function paper(
  background: string,
  foreground: string,
  primary: string,
  accent: string,
  muted: string,
  border: string,
): Theme["colors"] {
  return { background, foreground, primary, accent, muted, border };
}

function briefingFor(clientName: string, segment: Briefing["segment"]): Briefing {
  return {
    clientName,
    segment,
    audience: "",
    tone: "",
    differentials: "",
    services: "",
    colors: "",
    references: "",
    goal: "captar",
    slug: "",
  };
}

export function buildPageTemplate(
  templateId: PageTemplateId,
  clientName: string,
  segment: Briefing["segment"],
): PageDocument {
  const style = TEMPLATE_STYLES[templateId];
  const effectiveSegment = style.preferredSegment && segment === "local" ? style.preferredSegment : segment;
  const base = generateDeterministic(briefingFor(clientName, effectiveSegment), style.direction ?? 0);
  const archetype = ARCHETYPES[effectiveSegment] ?? ARCHETYPES.local;

  let content: Block[] = [...base.content];
  if (style.blocks?.length) {
    const byType = new Map(base.content.map((block) => [block.type, block]));
    const full = generateDeterministic(briefingFor(clientName, effectiveSegment), (style.direction ?? 0) + 2);
    for (const block of full.content) {
      if (!byType.has(block.type)) byType.set(block.type, block);
    }
    content = style.blocks
      .map((type) => byType.get(type))
      .filter((block): block is Block => Boolean(block));
  }

  content = content.map((block, index) => {
    const nextProps = {
      ...block.props,
      animation: {
        ...block.props.animation,
        preset: style.motion,
        delay: (index % 4) * 0.05,
      },
      ...(block.type === "Hero" && style.heroVariant ? { variant: style.heroVariant } : {}),
    };
    return { type: block.type, props: nextProps } as Block;
  });

  const document = {
    ...base,
    root: {
      props: {
        ...base.root.props,
        theme: {
          personality: style.personality,
          colors: style.colors,
          fonts: FONT_BY_PERSONALITY[style.personality],
          ...STYLE_BY_PERSONALITY[style.personality],
          bgArt: base.root.props.theme.bgArt ?? "none",
          bgArtColor: base.root.props.theme.bgArtColor ?? "",
          bgArtStrength: base.root.props.theme.bgArtStrength ?? 45,
        },
        seo: {
          title: `${clientName.trim()} · ${PAGE_TEMPLATE_META.find((item) => item.id === templateId)?.label ?? archetype.label}`,
          description: base.root.props.seo.description,
          ogImage: "",
        },
        archetype: effectiveSegment,
      },
    },
    content,
  };

  return enforceCompliance(pageDataSchema.parse(document), effectiveSegment);
}

export function isPageTemplateId(value: string): value is PageTemplateId {
  return (PAGE_TEMPLATE_IDS as readonly string[]).includes(value);
}
