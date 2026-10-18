import { ARCHETYPES, FONT_BY_PERSONALITY, STYLE_BY_PERSONALITY, hashString } from "@/lib/ai/archetypes";
import { enforceCompliance } from "@/lib/ai/compliance";
import {
  fillName,
  getSegmentCopy,
  pickFrom,
  pickMany,
  resolveDifferentials,
  resolveReferences,
} from "@/lib/ai/segment-copy";
import { getTemplateStyle, resolveProposalTemplate } from "@/lib/ai/template-styles";
import { ensureThemeContrast } from "@/lib/theme-contrast";
import {
  BG_ARTS,
  PERSONALITIES,
  VARIANTS,
  defaultAnimation,
  defaultLayout,
  defaultVisibility,
  emptyImage,
  pageDataSchema,
  type Block,
  type BlockType,
  type Briefing,
  type PageDocument,
  type PropsOf,
} from "@/puck/schema";

function uid(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

function listFrom(value: string, fallback: string[]) {
  const parts = value
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length ? parts.slice(0, 6) : fallback;
}

function pick<T>(items: readonly T[], seed: number) {
  return items[Math.abs(seed) % items.length]!;
}

function goalLabel(goal: Briefing["goal"], segment: string, ctaTitles: string[], seed: number) {
  if (goal === "agendar") {
    return segment === "restaurante" ? "Reservar mesa" : pick(ctaTitles, seed) || "Agendar conversa";
  }
  if (goal === "vender") {
    return segment === "moda" ? "Ver peças" : pick(ctaTitles, seed + 1) || "Quero saber mais";
  }
  return pick(ctaTitles, seed + 2) || "Entrar em contato";
}

function chrome(
  type: BlockType,
  seed: number,
  preset: PropsOf<"Hero">["animation"]["preset"],
  index: number,
) {
  return {
    id: uid(type, index),
    anchor: type.toLowerCase(),
    visibility: defaultVisibility(),
    animation: {
      ...defaultAnimation(preset),
      delay: (seed % 4) * 0.05,
      trigger: type === "Hero" ? ("load" as const) : ("view" as const),
      preset: type === "Hero" ? ("none" as const) : preset,
    },
    locked: false,
    layout: defaultLayout(),
    variant: pick(VARIANTS[type], seed),
  };
}

export function generateDeterministic(briefing: Briefing, direction = 0): PageDocument {
  const archetype = ARCHETYPES[briefing.segment] ?? ARCHETYPES.local;
  const bank = getSegmentCopy(briefing.segment);
  const seed = hashString(
    `${briefing.clientName}:${briefing.segment}:${briefing.goal}:${direction}:${briefing.tone}:${briefing.templateId}:${briefing.headline}`,
  );
  const dir = ((direction % 3) + 3) % 3;
  const templateId = resolveProposalTemplate(briefing, dir);
  const template = getTemplateStyle(templateId);

  const personalityFromBriefing =
    briefing.personality && (PERSONALITIES as readonly string[]).includes(briefing.personality)
      ? briefing.personality
      : null;
  const personality =
    (dir === 0 && personalityFromBriefing) ||
    template.personality ||
    archetype.personalities[(seed + dir) % archetype.personalities.length]!;

  let colors = { ...template.colors };
  const primaryMatch = briefing.colors?.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
  if (primaryMatch) {
    colors.primary = primaryMatch[0];
    colors.accent = primaryMatch[0];
  }
  const bgMatch = briefing.backgroundColor?.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
  if (bgMatch && dir === 0) {
    colors.background = bgMatch[0];
  }
  colors = ensureThemeContrast(colors);

  const motion = template.motion || archetype.motions[dir] || archetype.motions[0]!;
  const bgArt = (
    briefing.references?.toLowerCase().includes("limpo")
      ? "none"
      : archetype.bgArts[dir] ?? pick(BG_ARTS, seed)
  ) as (typeof BG_ARTS)[number];

  const services = listFrom(briefing.services, archetype.services);
  const diffs = resolveDifferentials(briefing.differentials, briefing.segment, seed);
  const refs = resolveReferences(briefing.references, briefing.segment, seed + 9);
  const name = briefing.clientName.trim() || "Sua marca";
  const audience =
    briefing.audience.trim() ||
    (archetype.ethical
      ? "pessoas que buscam informação clara e atendimento responsável"
      : "quem procura um trabalho com assinatura própria");
  const diff = diffs[0] || briefing.differentials.trim() || "um jeito de trabalhar reconhecível";
  const ethical = archetype.ethical;
  const cta = goalLabel(briefing.goal, briefing.segment, bank.ctaTitles, seed);

  const headline =
    (dir === 0 && briefing.headline?.trim()) ||
    fillName(bank.headlines[dir % bank.headlines.length]!, name);
  const tagline =
    (dir === 0 && briefing.tagline?.trim()) || bank.taglines[dir % bank.taglines.length]!;
  const aboutBody = fillName(bank.aboutBodies[dir % bank.aboutBodies.length]!, name);
  const eyebrow = bank.eyebrows[dir % bank.eyebrows.length]!;
  const intro = ethical
    ? aboutBody
    : briefing.tone?.trim()
      ? `${name} — tom ${briefing.tone.trim()}. ${tagline}`
      : aboutBody;

  /** Blocos que ficam feios sem foto — substituímos por conteúdo tipográfico. */
  const mediaHeavy = new Set<BlockType>(["Gallery", "Video", "BeforeAfter"]);
  const textFillers: BlockType[] = ["About", "Process", "Faq", "Services"];
  const rawRecipe =
    template.blocks?.filter((t) => t !== "Navbar" && t !== "Footer" && t !== "WhatsApp") ??
    archetype.recipes[dir] ??
    archetype.recipes[0]!;
  const recipeBody = rawRecipe.map((type, index) => {
    if (!mediaHeavy.has(type)) return type;
    return textFillers[(seed + index + dir) % textFillers.length]!;
  });
  const withWhatsApp =
    Boolean(briefing.whatsapp?.trim()) ||
    Boolean(template.blocks?.includes("WhatsApp")) ||
    archetype.blocks.includes("WhatsApp");
  const wantsMap = Boolean(briefing.address?.trim()) || recipeBody.includes("Map");
  const sequence: BlockType[] = [
    "Navbar",
    ...recipeBody.filter((t) => t !== "Navbar" && t !== "Footer" && t !== "WhatsApp"),
    ...(wantsMap ? (["Map"] as const) : []),
    ...(recipeBody.includes("Cta") || recipeBody.includes("Contact") || recipeBody.includes("Booking")
      ? []
      : (["Cta"] as const)),
    "Footer",
    ...(withWhatsApp ? (["WhatsApp"] as const) : []),
  ].filter((type, index, arr) => arr.indexOf(type) === index) as BlockType[];

  const copy: Copy = {
    name,
    intro,
    headline,
    tagline,
    aboutBody,
    eyebrow,
    services,
    serviceBlurbs: pickMany(bank.serviceBlurbs, seed, Math.max(services.length, 3)),
    diffs,
    refs,
    cta,
    audience,
    diff,
    ethical,
    segment: briefing.segment,
    process: pickFrom(bank.processRecipes, seed + dir),
    faqs: pickFrom(bank.faqRecipes, seed + dir * 2),
    galleryTags: bank.galleryTags,
    catalogNotes: bank.catalogNotes,
    marqueeExtras: bank.marqueeExtras,
    ctaTitle: pickFrom(bank.ctaTitles, seed + dir + 1),
    address: briefing.address?.trim() || "",
  };

  /** Sem fotos reais: prioriza heróis tipográficos (nada de immersive/cinematic vazios). */
  const safeHeroVariants = ["split", "editorial", "light", "asymmetric", "brand"] as const;
  const content = sequence.map((type, index) => {
    const base = chrome(type, seed + index * 5 + dir * 11, motion, index);
    let variant = pick(VARIANTS[type], seed + index + dir * 3);
    if (type === "Hero") {
      const preferred = template.heroVariant;
      variant =
        preferred && (safeHeroVariants as readonly string[]).includes(preferred)
          ? (preferred as (typeof safeHeroVariants)[number])
          : safeHeroVariants[dir % safeHeroVariants.length]!;
    }
    if (type === "Catalog") variant = pick(["rows", "shelf", "lookbook"] as const, seed + dir);
    if (type === "Services") variant = pick(["list", "grid", "index"] as const, seed + dir + 1);
    return makeBlock(type, { ...base, variant }, copy);
  });

  const document: PageDocument = {
    root: {
      props: {
        theme: {
          personality,
          colors,
          fonts: FONT_BY_PERSONALITY[personality],
          ...STYLE_BY_PERSONALITY[personality],
          bgArt: bgArt === "noise" || bgArt === "checker" ? (dir === 0 ? "none" : "horizon") : bgArt,
          bgArtColor: colors.foreground,
          bgArtStrength: 18 + (dir % 3) * 8,
        },
        seo: {
          title: `${name} · ${archetype.label}`,
          description: (tagline || intro).slice(0, 160),
          ogImage: "",
        },
        favicon: "",
        locale: "pt-BR",
        whatsapp: {
          phone: briefing.whatsapp?.trim() || "",
          message: `Olá, vim pelo site de ${name}.`,
          floating: withWhatsApp,
        },
        analytics: { ga4: "", metaPixel: "" },
        archetype: briefing.segment,
      },
    },
    content,
    zones: {},
  };

  return enforceCompliance(pageDataSchema.parse(document), briefing.segment);
}

type Copy = {
  name: string;
  intro: string;
  headline: string;
  tagline: string;
  aboutBody: string;
  eyebrow: string;
  services: string[];
  serviceBlurbs: string[];
  diffs: string[];
  refs: string[];
  cta: string;
  audience: string;
  diff: string;
  ethical: boolean;
  segment: string;
  process: Array<{ title: string; description: string }>;
  faqs: Array<{ question: string; answer: string }>;
  galleryTags: string[];
  catalogNotes: string[];
  marqueeExtras: string[];
  ctaTitle: string;
  address: string;
};

function makeBlock(type: BlockType, base: ReturnType<typeof chrome>, copy: Copy): Block {
  const img = emptyImage();
  const link = { label: copy.cta, href: "#contato" };
  switch (type) {
    case "Navbar":
      return {
        type,
        props: {
          ...base,
          logo: copy.name,
          links: [
            { label: "Sobre", href: "#about" },
            { label: "Serviços", href: "#services" },
            { label: "Contato", href: "#contato" },
          ],
          cta: link,
        },
      };
    case "Hero":
      return {
        type,
        props: {
          ...base,
          eyebrow: copy.ethical ? "Apresentação profissional" : copy.eyebrow || copy.audience,
          title: copy.headline,
          subtitle: copy.tagline || copy.intro,
          image: img,
          primaryCta: link,
          secondaryCta: { label: copy.ethical ? "Conhecer o trabalho" : "Ver mais", href: "#about" },
        },
      };
    case "About":
      return {
        type,
        props: {
          ...base,
          eyebrow: "Sobre",
          title: copy.ethical ? `Como ${copy.name} trabalha` : `O jeito ${copy.name}`,
          body: copy.aboutBody,
          image: img,
          points: copy.diffs.slice(0, 3).map((title, i) => ({
            title: title.slice(0, 48),
            description: copy.serviceBlurbs[i] || copy.tagline,
          })),
        },
      };
    case "Services":
      return {
        type,
        props: {
          ...base,
          eyebrow: "Serviços",
          title: copy.ethical ? "Áreas de atendimento" : "O que oferecemos",
          items: copy.services.map((title, i) => ({
            title,
            description: copy.ethical
              ? "Descrição institucional, sem promessa de resultado."
              : copy.serviceBlurbs[i % copy.serviceBlurbs.length] || copy.diff,
          })),
        },
      };
    case "Catalog":
      return {
        type,
        props: {
          ...base,
          eyebrow: "Seleção",
          title: copy.segment === "restaurante" ? "Carta e opções" : "Peças e opções",
          items: copy.services.map((title, i) => ({
            title,
            description: copy.diffs[i % copy.diffs.length] || "Substitua pela descrição real.",
            price: copy.catalogNotes[i % copy.catalogNotes.length] || "Sob consulta",
            image: img,
          })),
        },
      };
    case "Gallery":
      return {
        type,
        props: {
          ...base,
          variant: "grid",
          title: "Referências",
          images: [0, 1, 2].map((n) => ({
            image: img,
            caption: copy.galleryTags[n % copy.galleryTags.length] || "Detalhe",
            tag: copy.galleryTags[n % copy.galleryTags.length] || "Detalhe",
          })),
        },
      };
    case "Testimonials":
      return {
        type,
        props: {
          ...base,
          title: "Depoimentos reais",
          items: [
            {
              quote: "Substituir depoimento real — não publique texto inventado.",
              name: "Nome do cliente",
              role: "Substituir",
              image: img,
              placeholder: true,
            },
          ],
        },
      };
    case "Stats":
      return {
        type,
        props: {
          ...base,
          title: "Em números",
          items: [
            { value: "—", label: "Dado real a publicar" },
            { value: "—", label: "Anos / projetos (real)" },
            { value: "—", label: "Métrica que você comprova" },
          ],
        },
      };
    case "Process":
      return {
        type,
        props: {
          ...base,
          title: "Como acontece",
          items: copy.process.map((step) => ({
            title: step.title,
            description: step.description,
          })),
        },
      };
    case "Pricing":
      return {
        type,
        props: {
          ...base,
          title: "Formatos",
          plans: copy.services.slice(0, 3).map((name, i) => ({
            name,
            price: copy.catalogNotes[i] || "Sob consulta",
            description: copy.diffs[i] || copy.diff,
            features: copy.diffs.slice(0, 3).join("\n") || "Item real\nItem real",
            cta: link,
            featured: i === 1,
          })),
        },
      };
    case "Faq":
      return {
        type,
        props: {
          ...base,
          title: "Perguntas",
          items: copy.faqs,
        },
      };
    case "Team":
      return {
        type,
        props: {
          ...base,
          title: "Pessoas",
          people: [
            {
              title: "Nome da pessoa",
              role: "Função",
              description: "Substitua pela biografia real.",
              image: img,
            },
          ],
        },
      };
    case "Timeline":
      return {
        type,
        props: {
          ...base,
          title: "Percurso",
          events: [
            { year: "Início", title: copy.name, description: copy.aboutBody },
            { year: "Foco", title: copy.eyebrow, description: copy.diff },
            { year: "Agora", title: "Trabalho atual", description: copy.tagline },
          ],
        },
      };
    case "Map":
      return {
        type,
        props: {
          ...base,
          title: "Onde estamos",
          address: copy.address || "Endereço a substituir",
          embedUrl: "",
          note: copy.address
            ? "Venha nos visitar ou fale conosco antes."
            : "Inclua o endereço real antes de publicar.",
        },
      };
    case "Contact":
      return {
        type,
        props: {
          ...base,
          anchor: "contato",
          title: "Contato",
          subtitle: copy.tagline || copy.intro,
          submitLabel: "Enviar",
        },
      };
    case "Cta":
      return {
        type,
        props: {
          ...base,
          eyebrow: copy.name,
          title: copy.ethical ? "Vamos conversar com calma" : copy.ctaTitle || copy.cta,
          subtitle: copy.diffs.slice(0, 2).join(" · ") || copy.diff,
          cta: link,
        },
      };
    case "Footer":
      return {
        type,
        props: {
          ...base,
          logo: copy.name,
          note: copy.refs[0] ? `Clima visual: ${copy.refs[0]}` : copy.tagline,
          links: [
            { label: "Topo", href: "#topo" },
            { label: "Contato", href: "#contato" },
          ],
          legal: `© ${new Date().getFullYear()} ${copy.name}`,
        },
      };
    case "Marquee":
      return {
        type,
        props: {
          ...base,
          items: [...copy.services, ...copy.marqueeExtras, copy.name]
            .slice(0, 8)
            .map((label) => ({ label })),
        },
      };
    case "Video":
      return {
        type,
        props: {
          ...base,
          title: "Vídeo",
          url: "",
          caption: "Envie um MP4 ou WEBM, ou cole um link do YouTube ou Vimeo.",
          file: img,
        },
      };
    case "BeforeAfter":
      return {
        type,
        props: {
          ...base,
          title: "Antes e depois",
          before: img,
          after: img,
          beforeLabel: "Antes",
          afterLabel: "Depois",
        },
      };
    case "Booking":
      return {
        type,
        props: {
          ...base,
          title: "Agenda",
          subtitle: "O link abre a ferramenta de agendamento que você já usa.",
          href: "#contato",
          label: copy.cta,
        },
      };
    case "WhatsApp":
      return {
        type,
        props: {
          ...base,
          label: "WhatsApp",
          phone: "",
          message: `Olá, vim pelo site de ${copy.name}.`,
        },
      };
    case "Text":
      return { type, props: { ...base, text: copy.intro, align: "left", fontSize: 18 } };
    case "Button":
      return { type, props: { ...base, label: copy.cta, href: "#contato", align: "left" } };
    case "Badge":
      return {
        type,
        props: { ...base, text: copy.ethical ? "Institucional" : copy.eyebrow || "Novidade", align: "left" },
      };
    case "Divider":
      return { type, props: { ...base } };
    case "Spacer":
      return { type, props: { ...base } };
    case "Panel":
      return { type, props: { ...base, title: copy.name, body: copy.diff } };
    case "CardGrid":
      return {
        type,
        props: {
          ...base,
          title: "Em destaque",
          cards: copy.diffs.slice(0, 3).map((title) => ({
            title: title.slice(0, 40),
            description: copy.tagline,
            emoji: "",
          })),
        },
      };
    case "Band":
      return { type, props: { ...base, text: copy.ctaTitle || copy.cta, href: "#contato", label: copy.cta } };
    case "Picture":
      return { type, props: { ...base, image: img, zoom: 1, posX: 50, posY: 50, caption: "Substituir imagem" } };
    case "Clip":
      return {
        type,
        props: { ...base, file: img, zoom: 1, posX: 50, posY: 50, caption: "Envie uma imagem ou um vídeo." },
      };
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

function freshBlockId(type: BlockType) {
  return `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function sampleBlock(type: BlockType): Block {
  return makeBlock(type, { ...chrome(type, 1, "fade", 0), id: freshBlockId(type) }, {
    name: "Seu nome",
    intro: "Texto para substituir.",
    headline: "Seu nome",
    tagline: "Texto de apoio.",
    aboutBody: "Texto para substituir.",
    eyebrow: "Sobre",
    services: ["Item um", "Item dois", "Item três"],
    serviceBlurbs: ["Descrição curta.", "Descrição curta.", "Descrição curta."],
    diffs: ["Diferencial um", "Diferencial dois", "Diferencial três"],
    refs: ["Referência visual"],
    cta: "Saiba mais",
    audience: "",
    diff: "Descrição curta.",
    ethical: false,
    segment: "local",
    process: [
      { title: "Passo 1", description: "Descrição." },
      { title: "Passo 2", description: "Descrição." },
      { title: "Passo 3", description: "Descrição." },
    ],
    faqs: [
      { question: "Como começamos?", answer: "Pelo contato." },
      { question: "Onde acontece?", answer: "No endereço publicado." },
    ],
    galleryTags: ["Detalhe"],
    catalogNotes: ["Sob consulta"],
    marqueeExtras: ["marca"],
    ctaTitle: "Saiba mais",
    address: "",
  });
}
