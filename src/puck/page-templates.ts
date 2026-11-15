import { enforceCompliance } from "@/lib/ai/compliance";
import { generateDeterministic } from "@/lib/ai/fallback";
import { EXTRA_META } from "@/lib/ai/segment-roster";
import { TEMPLATE_STYLES } from "@/lib/ai/template-styles";
import { PAGE_TEMPLATE_IDS, type PageTemplateId } from "@/puck/page-templates-ids";
import { pageDataSchema, type Briefing, type PageDocument } from "@/puck/schema";

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
    id: "vertice",
    label: "Vértice",
    tagline: "Imobiliária: hero em foto, busca visual e seleção de imóveis.",
    vibe: "Alto padrão",
    swatch: "#c6a97e",
    layoutHint: "Hero · Números · Catálogo · Bairros",
  },
  {
    id: "ferraz",
    label: "Ferraz",
    tagline: "Advocacia sóbria: índice, manifesto, equipe e artigos.",
    vibe: "Editorial jurídico",
    swatch: "#6e1d2a",
    layoutHint: "Hero · Atuação · Processo · Equipe",
  },
  {
    id: "essenza",
    label: "Essenza",
    tagline: "Clínica clara, com equipe, dúvidas e barra de agendamento.",
    vibe: "Saúde",
    swatch: "#7d8b74",
    layoutHint: "Hero · Serviços · Equipe · Agenda",
  },
  {
    id: "lenha",
    label: "Lenha",
    tagline: "Restaurante escuro: carta, sala, reserva e mapa.",
    vibe: "Brasa",
    swatch: "#e07a3d",
    layoutHint: "Hero · Carta · Reserva · Mapa",
  },
  {
    id: "linea",
    label: "Linea",
    tagline: "Arquitetura: obras, comparador de projeto e método.",
    vibe: "Estúdio",
    swatch: "#c8c2b4",
    layoutHint: "Hero · Obras · Antes/depois · Processo",
  },
  {
    id: "alisio",
    label: "Casa Alísio",
    tagline: "Pousada: suítes, fotos e barra de estadia.",
    vibe: "Refúgio",
    swatch: "#8aa39a",
    layoutHint: "Hero · Suítes · Galeria · Mapa",
  },
  {
    id: "navalha",
    label: "Dom Navalha",
    tagline: "Barbearia: serviços, barbeiros, agenda e clube.",
    vibe: "Ritual",
    swatch: "#c6a15b",
    layoutHint: "Hero · Serviços · Agenda · Clube",
  },
  {
    id: "pulso",
    label: "Pulso",
    tagline: "Academia: modalidades, grade da semana e planos.",
    vibe: "Treino",
    swatch: "#c6f135",
    layoutHint: "Hero · Modalidades · Semana · Planos",
  },
  {
    id: "maison",
    label: "Maison Lis",
    tagline: "Confeitaria: vitrine, encomenda em passos e cozinha.",
    vibe: "Forno",
    swatch: "#c47b8a",
    layoutHint: "Hero · Vitrine · Encomenda · Cozinha",
  },
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
  ...EXTRA_META,
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
  const base = generateDeterministic(
    { ...briefingFor(clientName, effectiveSegment), templateId },
    0,
  );
  const label = PAGE_TEMPLATE_META.find((item) => item.id === templateId)?.label ?? style.personality;
  base.root.props.seo.title = `${clientName.trim()} · ${label}`;
  base.root.props.archetype = effectiveSegment;
  return enforceCompliance(pageDataSchema.parse(base), effectiveSegment);
}

export function isPageTemplateId(value: string): value is PageTemplateId {
  return (PAGE_TEMPLATE_IDS as readonly string[]).includes(value);
}
