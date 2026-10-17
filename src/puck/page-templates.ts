import { ARCHETYPES, FONT_BY_PERSONALITY, STYLE_BY_PERSONALITY } from "@/lib/ai/archetypes";
import { enforceCompliance } from "@/lib/ai/compliance";
import { generateDeterministic } from "@/lib/ai/fallback";
import { TEMPLATE_STYLES } from "@/lib/ai/template-styles";
import { PAGE_TEMPLATE_IDS, type PageTemplateId } from "@/puck/page-templates-ids";
import { pageDataSchema, type Block, type Briefing, type PageDocument } from "@/puck/schema";

export { PAGE_TEMPLATE_IDS, type PageTemplateId };

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
    address: "",
    whatsapp: "",
    templateId: "",
    headline: "",
    tagline: "",
    backgroundColor: "",
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
