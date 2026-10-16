import { sampleBlock } from "@/lib/ai/fallback";
import { BLOCK_TYPES, type BlockType } from "@/puck/schema";
import type { Data } from "@puckeditor/core";

export type LibraryTab = "elements" | "sections" | "ready";

export type LibraryItem = {
  id: string;
  label: string;
  hint: string;
  type: BlockType;
  variant?: string;
};

export type SectionPreset = {
  id: string;
  label: string;
  hint: string;
  types: BlockType[];
};

const ALL_BLOCK_META: Record<BlockType, { label: string; hint: string; group: string }> = {
  Text: { label: "Texto", hint: "Títulos e parágrafos", group: "Básicos" },
  Button: { label: "Botão", hint: "CTA / link", group: "Básicos" },
  Badge: { label: "Badge", hint: "Selo ou etiqueta", group: "Básicos" },
  Divider: { label: "Divisor", hint: "Linha separadora", group: "Básicos" },
  Spacer: { label: "Espaço", hint: "Respiro vertical", group: "Básicos" },
  Hero: { label: "Hero", hint: "Faixa de abertura com CTA", group: "Layout" },
  Panel: { label: "Painel", hint: "Card / bloco destacado", group: "Layout" },
  CardGrid: { label: "Grid", hint: "Grade de cartões", group: "Layout" },
  Band: { label: "Faixa / bloco", hint: "Forma sólida de cor", group: "Layout" },
  About: { label: "Sobre", hint: "Texto + imagem", group: "Layout" },
  Picture: { label: "Imagem", hint: "Carregar do celular/PC", group: "Mídia" },
  Clip: { label: "Mídia", hint: "Imagem ou vídeo", group: "Mídia" },
  Video: { label: "Vídeo", hint: "Arquivo ou embed", group: "Mídia" },
  Gallery: { label: "Galeria", hint: "Várias imagens", group: "Mídia" },
  BeforeAfter: { label: "Antes e depois", hint: "Comparador visual", group: "Mídia" },
  Navbar: { label: "Menu", hint: "Logo + links + CTA", group: "Negócio" },
  Services: { label: "Serviços", hint: "Catálogo de ofertas", group: "Negócio" },
  Catalog: { label: "Catálogo", hint: "Produtos com preço", group: "Negócio" },
  Team: { label: "Equipe", hint: "Pessoas do time", group: "Negócio" },
  Contact: { label: "Contato", hint: "Formulário de lead", group: "Negócio" },
  Footer: { label: "Rodapé", hint: "Créditos / redes", group: "Negócio" },
  Map: { label: "Mapa", hint: "Endereço e embed", group: "Negócio" },
  Booking: { label: "Agendamento", hint: "CTA para agendar", group: "Negócio" },
  WhatsApp: { label: "WhatsApp", hint: "Botão flutuante", group: "Negócio" },
  Testimonials: { label: "Depoimentos", hint: "Prova social", group: "Prova" },
  Stats: { label: "Números", hint: "Métricas em destaque", group: "Prova" },
  Pricing: { label: "Planos", hint: "Tabela de preços", group: "Prova" },
  Faq: { label: "FAQ", hint: "Perguntas frequentes", group: "Prova" },
  Process: { label: "Processo", hint: "Passos numerados", group: "Conteúdo" },
  Timeline: { label: "Linha do tempo", hint: "História / etapas", group: "Conteúdo" },
  Cta: { label: "Chamada final", hint: "CTA de conversão", group: "Conteúdo" },
  Marquee: { label: "Letreiro", hint: "Faixa deslizante", group: "Conteúdo" },
};

const GROUP_ORDER = ["Básicos", "Layout", "Mídia", "Negócio", "Prova", "Conteúdo"];

/** Todos os componentes do Puck, agrupados como no Ze */
export const LIBRARY_ITEM_GROUPS: { title: string; items: LibraryItem[] }[] = GROUP_ORDER.map((title) => ({
  title,
  items: BLOCK_TYPES.filter((type) => ALL_BLOCK_META[type].group === title).map((type) => ({
    id: type.toLowerCase(),
    label: ALL_BLOCK_META[type].label,
    hint: ALL_BLOCK_META[type].hint,
    type,
  })),
})).filter((group) => group.items.length > 0);

/** Seções pré-montadas (Ze + coberturas extras) */
export const SECTION_PRESETS: SectionPreset[] = [
  { id: "color-band", label: "Faixa de cor", hint: "Bloco sólido full-width", types: ["Band"] },
  { id: "dayparts", label: "Manhã · Tarde · Noite", hint: "3 cards de período", types: ["CardGrid"] },
  { id: "hero-diffs", label: "Hero + 3 diferenciais", hint: "Abertura + grade", types: ["Hero", "CardGrid"] },
  { id: "cta-band", label: "Faixa de CTA", hint: "Chamada + faixa", types: ["Cta", "Band"] },
  { id: "services-block", label: "Bloco serviços", hint: "Catálogo de serviços", types: ["Services"] },
  { id: "social-proof", label: "Prova social", hint: "Números + depoimentos", types: ["Stats", "Testimonials"] },
  { id: "intro-stack", label: "Intro com CTA", hint: "Sobre + botão", types: ["About", "Button"] },
  { id: "contact-footer", label: "Contato + rodapé", hint: "Fechamento da página", types: ["Contact", "Footer"] },
  { id: "process-faq", label: "Processo + FAQ", hint: "Como funciona e dúvidas", types: ["Process", "Faq"] },
  { id: "gallery-video", label: "Galeria + vídeo", hint: "Mídia em sequência", types: ["Gallery", "Video"] },
  { id: "map-booking", label: "Mapa + agendar", hint: "Local e agenda", types: ["Map", "Booking"] },
  { id: "team-about", label: "Equipe + sobre", hint: "Pessoas e história", types: ["Team", "About"] },
  { id: "catalog-pricing", label: "Catálogo + planos", hint: "Produtos e preços", types: ["Catalog", "Pricing"] },
  { id: "timeline-process", label: "Timeline + processo", hint: "História e passos", types: ["Timeline", "Process"] },
  { id: "marquee-hero", label: "Letreiro + hero", hint: "Abertura com movimento", types: ["Marquee", "Hero"] },
  { id: "before-after-cta", label: "Antes/depois + CTA", hint: "Comparador e conversão", types: ["BeforeAfter", "Cta"] },
];

/** Prontos estilizados — todos os presets do Ze mapeados + variantes Puck */
export const READY_PRESETS: { title: string; items: LibraryItem[] }[] = [
  {
    title: "Tipos de botão",
    items: [
      { id: "btn-solid", label: "Sólido", hint: "Preenchido (marca)", type: "Button", variant: "solid" },
      { id: "btn-outline", label: "Contorno", hint: "Borda clara", type: "Button", variant: "outline" },
      { id: "btn-ghost", label: "Fantasma", hint: "Só texto", type: "Button", variant: "ghost" },
      { id: "btn-soft", label: "Suave", hint: "Fundo brand suave", type: "Button", variant: "soft" },
      { id: "btn-square", label: "Quadrado", hint: "Cantos retos", type: "Button", variant: "square" },
      { id: "btn-inverted", label: "Invertido", hint: "Claro sobre marca", type: "Button", variant: "inverted" },
      { id: "btn-pill", label: "Pílula", hint: "Totalmente arredondado", type: "Button", variant: "pill" },
      { id: "btn-text", label: "Texto", hint: "Sublinhado", type: "Button", variant: "text" },
    ],
  },
  {
    title: "Badges",
    items: [
      { id: "badge-brand", label: "Pílula marca", hint: "Marca", type: "Badge", variant: "brand" },
      { id: "badge-outline", label: "Contorno", hint: "Borda fina", type: "Badge", variant: "outline" },
      { id: "badge-soft", label: "Suave", hint: "Fundo discreto", type: "Badge", variant: "soft" },
      { id: "badge-alert", label: "Alerta", hint: "Destaque quente", type: "Badge", variant: "alert" },
      { id: "badge-pill", label: "Pílula", hint: "Clássica", type: "Badge", variant: "pill" },
      { id: "badge-tag", label: "Tag", hint: "Caixa alta", type: "Badge", variant: "tag" },
      { id: "badge-square", label: "Quadrado", hint: "Cantos retos", type: "Badge", variant: "square" },
    ],
  },
  {
    title: "Cards / painéis",
    items: [
      { id: "panel-card", label: "Card", hint: "Superfície com borda", type: "Panel", variant: "card" },
      { id: "panel-glass", label: "Vidro", hint: "Translúcido", type: "Panel", variant: "glass" },
      { id: "panel-accent", label: "Acento", hint: "Barra brand", type: "Panel", variant: "accent" },
      { id: "panel-flat", label: "Flat", hint: "Sem borda", type: "Panel", variant: "flat" },
      { id: "panel-quote", label: "Citação", hint: "Barra lateral", type: "Panel", variant: "quote" },
      { id: "panel-note", label: "Nota", hint: "Tracejado", type: "Panel", variant: "note" },
      { id: "panel-invert", label: "Invertido", hint: "Alto contraste", type: "Panel", variant: "invert" },
    ],
  },
  {
    title: "Faixas e blocos",
    items: [
      { id: "band-solid", label: "Faixa sólida", hint: "Bloco de cor largo", type: "Band", variant: "solid" },
      { id: "band-rounded", label: "Faixa arredondada", hint: "Brand com cantos", type: "Band", variant: "rounded" },
      { id: "band-surface", label: "Placa superfície", hint: "Fundo suave", type: "Band", variant: "surface" },
      { id: "band-outline", label: "Faixa contorno", hint: "Com borda", type: "Band", variant: "outline" },
      { id: "band-accent", label: "Faixa acento", hint: "Alto contraste", type: "Band", variant: "accent" },
      { id: "band-bleed", label: "Faixa bleed", hint: "Borda a borda", type: "Band", variant: "bleed" },
    ],
  },
  {
    title: "Tipos de texto",
    items: [
      { id: "text-display", label: "Display", hint: "Título grande", type: "Text", variant: "display" },
      { id: "text-title", label: "Título", hint: "Seção", type: "Text", variant: "title" },
      { id: "text-lead", label: "Lead", hint: "Abertura", type: "Text", variant: "lead" },
      { id: "text-body", label: "Corpo", hint: "Parágrafo", type: "Text", variant: "body" },
      { id: "text-caption", label: "Legenda", hint: "Pequeno", type: "Text", variant: "caption" },
      { id: "text-eyebrow", label: "Eyebrow", hint: "Caixa alta", type: "Text", variant: "eyebrow" },
    ],
  },
  {
    title: "Hero prontos",
    items: [
      { id: "hero-cinematic", label: "Cinema", hint: "Escuro + overlay forte", type: "Hero", variant: "cinematic" },
      { id: "hero-light", label: "Claro", hint: "Fundo suave", type: "Hero", variant: "light" },
      { id: "hero-brand", label: "Marca", hint: "Tom de marca", type: "Hero", variant: "brand" },
      { id: "hero-immersive", label: "Imersivo", hint: "Full-bleed", type: "Hero", variant: "immersive" },
      { id: "hero-split", label: "Split", hint: "Texto + mídia", type: "Hero", variant: "split" },
      { id: "hero-editorial", label: "Editorial", hint: "Revista", type: "Hero", variant: "editorial" },
      { id: "hero-asymmetric", label: "Assimétrico", hint: "Layout deslocado", type: "Hero", variant: "asymmetric" },
    ],
  },
  {
    title: "Espaços e divisores",
    items: [
      { id: "spacer-sm", label: "Espaço S", hint: "Pequeno", type: "Spacer", variant: "sm" },
      { id: "spacer-md", label: "Espaço M", hint: "Médio", type: "Spacer", variant: "md" },
      { id: "spacer-lg", label: "Espaço L", hint: "Grande", type: "Spacer", variant: "lg" },
      { id: "spacer-xl", label: "Espaço XL", hint: "Extra", type: "Spacer", variant: "xl" },
      { id: "div-line", label: "Linha", hint: "Fina", type: "Divider", variant: "line" },
      { id: "div-thick", label: "Grossa", hint: "4px", type: "Divider", variant: "thick" },
      { id: "div-dotted", label: "Pontilhada", hint: "Tracejada", type: "Divider", variant: "dotted" },
      { id: "div-fade", label: "Fade", hint: "Gradiente", type: "Divider", variant: "fade" },
    ],
  },
];

function uid(type: string) {
  return `${type.toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function makeFreshBlock(type: BlockType, variant?: string): Data["content"][number] {
  const block = sampleBlock(type);
  return {
    type: block.type,
    props: {
      ...block.props,
      id: uid(type),
      ...(variant ? { variant } : {}),
    },
  } as Data["content"][number];
}

export function makeSectionBlocks(preset: SectionPreset): Data["content"][number][] {
  if (preset.id === "dayparts") {
    const grid = makeFreshBlock("CardGrid", "three");
    return [
      {
        ...grid,
        props: {
          ...grid.props,
          title: "Horários",
          cards: [
            { emoji: "☀️", title: "Manhã", description: "Luz natural e café." },
            { emoji: "🌤", title: "Tarde", description: "Ritmo do dia." },
            { emoji: "🌙", title: "Noite", description: "Agenda premium." },
          ],
        },
      } as Data["content"][number],
    ];
  }
  if (preset.id === "color-band") {
    return [makeFreshBlock("Band", "solid")];
  }
  return preset.types.map((type) => makeFreshBlock(type));
}

export function insertBlocks(
  content: Data["content"],
  blocks: Data["content"][number][],
): Data["content"] {
  const footerIndex = content.findIndex((item) => item.type === "Footer");
  if (footerIndex === -1) return [...content, ...blocks];
  return [...content.slice(0, footerIndex), ...blocks, ...content.slice(footerIndex)];
}

export const TYPOGRAPHY_PRESETS = [
  { id: "editorial", label: "Editorial", hint: "Serif no título", personality: "editorial" as const },
  { id: "minimal", label: "Minimalista", hint: "Limpo e leve", personality: "minimal" as const },
  { id: "bold", label: "Moderno / bold", hint: "Sans forte", personality: "bold" as const },
  { id: "warm", label: "Suave / warm", hint: "Acolhedor", personality: "warm" as const },
  { id: "luxury", label: "Luxo", hint: "Premium", personality: "luxury" as const },
  { id: "brutalist", label: "Técnico / brutal", hint: "Cantos duros", personality: "brutalist" as const },
  { id: "organic", label: "Orgânico", hint: "Natural", personality: "organic" as const },
];
