import { ARCHETYPES, FONT_BY_PERSONALITY, STYLE_BY_PERSONALITY, hashString } from "@/lib/ai/archetypes";
import { enforceCompliance } from "@/lib/ai/compliance";
import {
  VARIANTS,
  defaultAnimation,
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
  return items[Math.abs(seed) % items.length];
}

function goalLabel(goal: Briefing["goal"], segment: string) {
  if (goal === "agendar") return segment === "restaurante" ? "Reservar mesa" : "Agendar conversa";
  if (goal === "vender") return segment === "moda" ? "Ver peças" : "Quero saber mais";
  return "Entrar em contato";
}

function chrome(type: BlockType, seed: number, preset: PropsOf<"Hero">["animation"]["preset"], index: number) {
  return {
    id: uid(type, index),
    anchor: type.toLowerCase(),
    visibility: defaultVisibility(),
    animation: {
      ...defaultAnimation(preset),
      delay: (seed % 4) * 0.05,
    },
    variant: pick(VARIANTS[type], seed),
  };
}

export function generateDeterministic(briefing: Briefing, direction = 0): PageDocument {
  const archetype = ARCHETYPES[briefing.segment] ?? ARCHETYPES.local;
  const seed = hashString(`${briefing.clientName}:${briefing.segment}:${direction}`);
  const personality = archetype.personalities[(seed + direction) % archetype.personalities.length];
  const colors = { ...archetype.palettes[(seed + direction * 2) % archetype.palettes.length] };
  const colorMatch = briefing.colors.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
  if (colorMatch) colors.primary = colorMatch[0];

  const services = listFrom(briefing.services, archetype.services);
  const cta = goalLabel(briefing.goal, briefing.segment);
  const name = briefing.clientName.trim();
  const audience = briefing.audience.trim() || "quem procura um trabalho com assinatura própria";
  const diff = briefing.differentials.trim() || "um jeito de trabalhar reconhecível";
  const ethical = archetype.ethical;
  const intro = ethical
    ? `${name} apresenta o trabalho com clareza, ética e sem promessa de resultado.`
    : `${name} existe para ${audience}, com ${diff}.`;

  const ordered: BlockType[] = [
    "Navbar",
    ...archetype.blocks.filter((type) => type !== "Navbar" && type !== "Footer" && type !== "WhatsApp"),
    "Cta",
    "Footer",
    ...(archetype.blocks.includes("WhatsApp") ? (["WhatsApp"] as const) : []),
  ];
  const unique = ordered.filter((type, index) => ordered.indexOf(type) === index);
  const rotatedBody = unique.filter((type) => !["Navbar", "Footer", "WhatsApp"].includes(type));
  const shift = direction % Math.max(rotatedBody.length, 1);
  const body = [...rotatedBody.slice(shift), ...rotatedBody.slice(0, shift)];
  const sequence: BlockType[] = ["Navbar", ...body, "Footer", ...(unique.includes("WhatsApp") ? (["WhatsApp"] as const) : [])];

  const content = sequence.map((type, index) => {
    const base = chrome(type, seed + index * 5 + direction * 11, archetype.motion, index);
    const variant = pick(VARIANTS[type], seed + index + direction * 3);
    return makeBlock(type, { ...base, variant }, { name, intro, services, cta, audience, diff, ethical, segment: briefing.segment });
  });

  const document: PageDocument = {
    root: {
      props: {
        theme: {
          personality,
          colors,
          fonts: FONT_BY_PERSONALITY[personality],
          ...STYLE_BY_PERSONALITY[personality],
        },
        seo: {
          title: `${name} · ${archetype.label}`,
          description: intro.slice(0, 160),
          ogImage: "",
        },
        favicon: "",
        locale: "pt-BR",
        whatsapp: {
          phone: "",
          message: `Olá, vim pelo site de ${name}.`,
          floating: false,
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
  services: string[];
  cta: string;
  audience: string;
  diff: string;
  ethical: boolean;
  segment: string;
};

function makeBlock(type: BlockType, base: ReturnType<typeof chrome>, copy: Copy): Block {
  const img = emptyImage();
  const link = { label: copy.cta, href: "#contato" };
  switch (type) {
    case "Navbar":
      return { type, props: { ...base, logo: copy.name, links: [{ label: "Sobre", href: "#about" }, { label: "Serviços", href: "#services" }, { label: "Contato", href: "#contato" }], cta: link } };
    case "Hero":
      return { type, props: { ...base, eyebrow: copy.ethical ? "Apresentação profissional" : copy.audience, title: copy.name, subtitle: copy.intro, image: img, primaryCta: link, secondaryCta: { label: "Ver o trabalho", href: "#about" } } };
    case "About":
      return { type, props: { ...base, eyebrow: "Sobre", title: copy.ethical ? `Como ${copy.name} trabalha` : `O jeito ${copy.name}`, body: copy.intro, image: img, points: copy.services.slice(0, 3).map((title) => ({ title, description: copy.diff })) } };
    case "Services":
      return { type, props: { ...base, eyebrow: "Serviços", title: copy.ethical ? "Áreas de atendimento" : "O que está à mesa", items: copy.services.map((title) => ({ title, description: copy.ethical ? "Descrição institucional, sem promessa de resultado." : copy.diff })) } };
    case "Catalog":
      return { type, props: { ...base, eyebrow: "Seleção", title: "Peças e opções", items: copy.services.map((title) => ({ title, description: "Substitua pela descrição real.", price: "Sob consulta", image: img })) } };
    case "Gallery":
      return { type, props: { ...base, title: "Imagens para substituir", images: [0, 1, 2, 3].map((n) => ({ image: img, caption: `Imagem ${n + 1}`, tag: n % 2 ? "Estúdio" : "Detalhe" })) } };
    case "Testimonials":
      return { type, props: { ...base, title: "Depoimentos reais", items: [{ quote: "Substituir depoimento real — não publique texto inventado.", name: "Nome do cliente", role: "Substituir", image: img, placeholder: true }] } };
    case "Stats":
      return { type, props: { ...base, title: "Em números", items: [{ value: "—", label: "Substituir dado real" }, { value: "—", label: "Substituir dado real" }, { value: "—", label: "Substituir dado real" }] } };
    case "Process":
      return { type, props: { ...base, title: "Como acontece", items: ["Conversa", "Direção", "Entrega"].map((title, i) => ({ title, description: copy.services[i] || copy.diff })) } };
    case "Pricing":
      return { type, props: { ...base, title: "Formatos", plans: copy.services.slice(0, 3).map((name, i) => ({ name, price: "Sob consulta", description: copy.diff, features: "Item real\nItem real", cta: link, featured: i === 1 })) } };
    case "Faq":
      return { type, props: { ...base, title: "Perguntas", items: [{ question: "Como começamos?", answer: copy.ethical ? "Por uma conversa inicial, sem promessa de resultado." : "Pelo contato, para entender o que você precisa." }, { question: "Onde acontece?", answer: "No endereço publicado ou no canal combinado." }] } };
    case "Team":
      return { type, props: { ...base, title: "Pessoas", people: [{ title: "Nome da pessoa", role: "Função", description: "Substitua pela biografia real.", image: img }] } };
    case "Timeline":
      return { type, props: { ...base, title: "Percurso", events: [{ year: "Início", title: copy.name, description: copy.intro }, { year: "Agora", title: "Trabalho atual", description: copy.diff }] } };
    case "Map":
      return { type, props: { ...base, title: "Onde estamos", address: "Endereço a substituir", embedUrl: "", note: "Inclua o endereço real antes de publicar." } };
    case "Contact":
      return { type, props: { ...base, anchor: "contato", title: "Contato", subtitle: copy.intro, submitLabel: "Enviar" } };
    case "Cta":
      return { type, props: { ...base, eyebrow: copy.name, title: copy.ethical ? "Vamos conversar com calma" : copy.cta, subtitle: copy.diff, cta: link } };
    case "Footer":
      return { type, props: { ...base, logo: copy.name, note: copy.intro, links: [{ label: "Topo", href: "#topo" }, { label: "Contato", href: "#contato" }], legal: `© ${new Date().getFullYear()} ${copy.name}` } };
    case "Marquee":
      return { type, props: { ...base, items: [...copy.services, copy.name].map((label) => ({ label })) } };
    case "Video":
      return { type, props: { ...base, title: "Vídeo", url: "", caption: "Cole um link do YouTube ou Vimeo, ou deixe em branco." } };
    case "BeforeAfter":
      return { type, props: { ...base, title: "Antes e depois", before: img, after: img, beforeLabel: "Antes", afterLabel: "Depois" } };
    case "Booking":
      return { type, props: { ...base, title: "Agenda", subtitle: "O link abre a ferramenta de agendamento que você já usa.", href: "#contato", label: copy.cta } };
    case "WhatsApp":
      return { type, props: { ...base, label: "WhatsApp", phone: "", message: `Olá, vim pelo site de ${copy.name}.` } };
  }
}
