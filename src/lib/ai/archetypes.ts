import {
  BG_ARTS,
  BODY_FONTS,
  DISPLAY_FONTS,
  PERSONALITIES,
  type Animation,
  type Theme,
} from "@/puck/schema";

type Personality = (typeof PERSONALITIES)[number];
type BgArt = (typeof BG_ARTS)[number];
type Motion = Animation["preset"];

export type Palette = Theme["colors"];

export type ArchetypeBlock =
  | "Navbar"
  | "Hero"
  | "About"
  | "Services"
  | "Catalog"
  | "Gallery"
  | "Testimonials"
  | "Stats"
  | "Process"
  | "Pricing"
  | "Faq"
  | "Team"
  | "Timeline"
  | "Map"
  | "Contact"
  | "Cta"
  | "Footer"
  | "Marquee"
  | "Video"
  | "BeforeAfter"
  | "Booking"
  | "WhatsApp";

export type Archetype = {
  label: string;
  schemaType: string;
  ethical: boolean;
  personalities: Personality[];
  palettes: Palette[];
  /** Presets de motion usados nas 3 direções. */
  motions: Motion[];
  /** Arte de fundo por direção. */
  bgArts: BgArt[];
  /** Rótulos das propostas locais (diversidade explícita). */
  directions: [string, string, string];
  /** 3 receitas de blocos distintas (sem Navbar/Footer/WhatsApp — o gerador acrescenta). */
  recipes: [ArchetypeBlock[], ArchetypeBlock[], ArchetypeBlock[]];
  /** Blocos legados / união das receitas (compat). */
  blocks: ArchetypeBlock[];
  services: string[];
  forbidden: RegExp[];
};

const paper = (
  background: string,
  foreground: string,
  primary: string,
  accent: string,
  muted: string,
  border: string,
): Palette => ({
  background,
  foreground,
  primary,
  accent,
  muted,
  border,
});

function withChrome(body: ArchetypeBlock[], whatsapp = false): ArchetypeBlock[] {
  return [
    "Navbar",
    ...body,
    "Footer",
    ...(whatsapp ? (["WhatsApp"] as const) : []),
  ];
}

export const ARCHETYPES: Record<string, Archetype> = {
  moda: {
    label: "Moda",
    schemaType: "ClothingStore",
    ethical: false,
    personalities: ["editorial", "bold", "luxury", "minimal"],
    directions: [
      "editorial assimétrica · lookbook",
      "contraste ousado · vitrine dark",
      "quiet luxury · cápsula clara",
    ],
    motions: ["mask-reveal", "slide-left", "fade"],
    bgArts: ["noise", "diagonal", "horizon"],
    palettes: [
      paper("#f6f1ea", "#1c1410", "#8f3d2b", "#c6a15b", "#efe6da", "#e4d8c8"),
      paper("#111111", "#f5f5f2", "#e7ff3d", "#f5f5f2", "#1c1c1c", "#2a2a2a"),
      paper("#fbf7f2", "#2a2118", "#6b2d3c", "#d7c4a3", "#f3ece3", "#e6d9c8"),
      paper("#0c0c0c", "#fafafa", "#f2f2f2", "#a3a3a3", "#171717", "#2e2e2e"),
      paper("#f3eee6", "#1a1512", "#1c3a2e", "#c8b89a", "#ebe4d8", "#d9d0c0"),
      paper("#1a1020", "#f7f0ff", "#d4a5ff", "#2a1835", "#22142c", "#3a2448"),
    ],
    recipes: [
      ["Hero", "Marquee", "Catalog", "Gallery", "About", "Cta"],
      ["Hero", "Gallery", "BeforeAfter", "Services", "Pricing", "Contact"],
      ["Hero", "About", "Catalog", "Process", "Faq", "Cta"],
    ],
    blocks: withChrome(["Hero", "Marquee", "Catalog", "Gallery", "About", "Cta"], true),
    services: ["Alfaiataria", "Peças sazonais", "Ajustes", "Consultoria de estilo", "Cápsula sob medida"],
    forbidden: [],
  },
  portfolio: {
    label: "Portfólio",
    schemaType: "Person",
    ethical: false,
    personalities: ["editorial", "bold", "minimal", "brutalist"],
    directions: [
      "editorial tipográfica · cases",
      "ousada e contrastada · grid quebrado",
      "minimal clara · processo",
    ],
    motions: ["slide-up", "scale", "blur-in"],
    bgArts: ["grid", "dots", "none"],
    palettes: [
      paper("#f4f4f1", "#111111", "#ff4d00", "#ecece8", "#f7f7f4", "#deded8"),
      paper("#0e0e0e", "#f5f5f5", "#d6ff3f", "#1a1a1a", "#161616", "#2a2a2a"),
      paper("#f7f3ec", "#1c1915", "#355c7d", "#efe8dc", "#f3eee6", "#e2d8c8"),
      paper("#fafafa", "#0a0a0a", "#111111", "#e5e5e5", "#f5f5f5", "#d4d4d4"),
      paper("#14120f", "#f5efe6", "#f0c27b", "#1f1c18", "#1a1714", "#2c2822"),
    ],
    recipes: [
      ["Hero", "About", "Gallery", "Video", "Testimonials", "Process", "Contact"],
      ["Hero", "Marquee", "Gallery", "Services", "Timeline", "Cta"],
      ["Hero", "About", "Process", "Stats", "Faq", "Contact"],
    ],
    blocks: withChrome(["Hero", "About", "Gallery", "Video", "Testimonials", "Process", "Contact"]),
    services: ["Direção de arte", "Identidade", "Editorial", "Sistemas digitais", "Campanhas"],
    forbidden: [],
  },
  advocacia: {
    label: "Advocacia",
    schemaType: "LegalService",
    ethical: true,
    personalities: ["editorial", "minimal", "luxury"],
    directions: [
      "institucional clássica · áreas",
      "minimal sóbria · processo",
      "editorial acolhedora · FAQ ético",
    ],
    motions: ["fade", "slide-up", "blur-in"],
    bgArts: ["none", "horizon", "grid"],
    palettes: [
      paper("#f4f1ec", "#1c2430", "#1e3a4c", "#9a7b4f", "#e7e1d8", "#d9d1c5"),
      paper("#f7f6f3", "#111111", "#3f4a3c", "#c4b7a6", "#eeece7", "#ddd8d0"),
      paper("#efece6", "#2b241c", "#5c3a2e", "#d8c3a5", "#f3efe8", "#e0d6c8"),
      paper("#f8f7f4", "#1a1f2e", "#243b55", "#b8a078", "#efeee9", "#ddd8ce"),
      paper("#f5f2eb", "#1c1915", "#2c3e30", "#a89070", "#efebe3", "#ddd4c6"),
    ],
    recipes: [
      ["Hero", "About", "Services", "Process", "Faq", "Contact"],
      ["Hero", "Services", "About", "Team", "Faq", "Cta"],
      ["Hero", "About", "Process", "Map", "Contact", "Cta"],
    ],
    blocks: withChrome(["Hero", "About", "Services", "Process", "Faq", "Contact"]),
    services: ["Consultoria jurídica", "Contratos", "Atendimento inicial", "Orientação preventiva", "Análise documental"],
    forbidden: [/garantid[oa]s?/i, /resultado assegurado/i, /o melhor advogado/i, /ganho( de)? causa/i, /100\s*%/i],
  },
  psicologia: {
    label: "Psicologia",
    schemaType: "ProfessionalService",
    ethical: true,
    personalities: ["warm", "organic", "minimal"],
    directions: [
      "acolhedora · terra e tipografia suave",
      "orgânica · processo e agenda",
      "minimal clara · FAQ ético",
    ],
    motions: ["fade", "slide-up", "blur-in"],
    bgArts: ["waves", "none", "dots"],
    palettes: [
      paper("#f3efe8", "#2c3330", "#6d8f78", "#e7d7c9", "#f7f3ee", "#e4ddd2"),
      paper("#f7f3ee", "#243028", "#8aa38b", "#efe4d6", "#fbf7f2", "#e6ddd2"),
      paper("#fbf6f1", "#3d2c2c", "#c47b6a", "#f0e2d8", "#f8f1eb", "#eadfd4"),
      paper("#f4f1ea", "#2a2e2c", "#5b7c6e", "#e8ddd0", "#f7f4ef", "#ddd6cc"),
      paper("#f9f5f0", "#2f2926", "#9a6b5c", "#efe4da", "#f7f1eb", "#e6d8ce"),
    ],
    recipes: [
      ["Hero", "About", "Services", "Process", "Faq", "Booking", "Contact"],
      ["Hero", "About", "Process", "Services", "Booking", "Cta"],
      ["Hero", "Services", "Faq", "About", "Map", "Contact"],
    ],
    blocks: withChrome(["Hero", "About", "Services", "Process", "Faq", "Booking", "Contact"]),
    services: ["Psicoterapia individual", "Acolhimento", "Orientação", "Primeira conversa", "Encaminhamento responsável"],
    forbidden: [/cura/i, /garantid[oa]/i, /resultado rápido/i, /100\s*%/i, /transformação garantida/i],
  },
  clinica: {
    label: "Clínica",
    schemaType: "MedicalClinic",
    ethical: true,
    personalities: ["minimal", "warm", "organic"],
    directions: [
      "clínica clean · serviços e mapa",
      "acolhedora · equipe e agenda",
      "institucional · FAQ e contato",
    ],
    motions: ["slide-up", "fade", "stagger"],
    bgArts: ["dots", "none", "cross"],
    palettes: [
      paper("#f4f7f6", "#16302b", "#1f6f62", "#d7ebe4", "#eef4f2", "#d5e4df"),
      paper("#f6f5f2", "#1b2430", "#3d6b8a", "#e4eef3", "#f3f2ef", "#d9e2ea"),
      paper("#fbfaf7", "#243024", "#7d9a78", "#e7efe4", "#f4f6f3", "#dde5dc"),
      paper("#f5f8fa", "#1a2832", "#2a6f8f", "#ddeef5", "#eef3f6", "#d2e0e8"),
      paper("#faf8f4", "#1e2a24", "#4a7c6a", "#e4efe8", "#f3f6f4", "#d8e4de"),
    ],
    recipes: [
      ["Hero", "Services", "About", "Team", "Faq", "Map", "Booking"],
      ["Hero", "About", "Services", "Process", "Booking", "Contact"],
      ["Hero", "Services", "Stats", "Faq", "Map", "Cta"],
    ],
    blocks: withChrome(["Hero", "Services", "About", "Team", "Faq", "Map", "Booking"], true),
    services: ["Avaliação", "Acompanhamento", "Orientação", "Retorno", "Agendamento"],
    forbidden: [/cura garantida/i, /sem risco/i, /100\s*%/i, /resultado garantido/i],
  },
  restaurante: {
    label: "Restaurante",
    schemaType: "Restaurant",
    ethical: false,
    personalities: ["warm", "editorial", "bold", "luxury"],
    directions: [
      "noite escura · carta e reserva",
      "editorial clara · sala e galeria",
      "ousada · marquee e mapa",
    ],
    motions: ["mask-reveal", "slide-up", "scale"],
    bgArts: ["noise", "horizon", "mesh"],
    palettes: [
      paper("#1a120c", "#f6efe4", "#e07a3d", "#2a2118", "#241910", "#3a2c22"),
      paper("#f8f1e7", "#2a120c", "#9c2f2f", "#f0d8c4", "#f3e6d6", "#e4d0b8"),
      paper("#f3ead7", "#1f1a14", "#c4552a", "#efe2cc", "#f7f0e2", "#e5d5bc"),
      paper("#0f1410", "#e8f0e8", "#c8e06a", "#1a2218", "#141a14", "#2a3228"),
      paper("#faf6f0", "#1c1410", "#8b4513", "#f0e4d4", "#f5efe6", "#e0d4c4"),
    ],
    recipes: [
      ["Hero", "Marquee", "About", "Catalog", "Gallery", "Map", "Booking"],
      ["Hero", "About", "Catalog", "Process", "Faq", "Booking"],
      ["Hero", "Gallery", "Services", "Map", "Cta", "Contact"],
    ],
    blocks: withChrome(["Hero", "Marquee", "About", "Catalog", "Gallery", "Map", "Booking"], true),
    services: ["Almoço", "Jantar", "Reservas", "Eventos sob consulta", "Carta de temporada"],
    forbidden: [],
  },
  barbearia: {
    label: "Barbearia",
    schemaType: "HairSalon",
    ethical: false,
    personalities: ["brutalist", "bold", "luxury", "editorial"],
    directions: [
      "dark industrial · serviços e agenda",
      "clássica clara · before/after",
      "luxo sóbrio · pricing e mapa",
    ],
    motions: ["slide-left", "scale", "stagger"],
    bgArts: ["noise", "diagonal", "grid"],
    palettes: [
      paper("#121212", "#f2efe9", "#c6a15b", "#1c1c1c", "#1a1a1a", "#2c2c2c"),
      paper("#f2efe9", "#141414", "#8c1c13", "#e6e0d6", "#f7f4ee", "#ddd6c8"),
      paper("#0e1a17", "#f4f1ea", "#d2b48c", "#1a2e28", "#13241f", "#243832"),
      paper("#0a0a0a", "#fafafa", "#ffffff", "#737373", "#171717", "#404040"),
      paper("#1a1210", "#f5ebe4", "#e85d04", "#2a1c18", "#221814", "#3a2a24"),
    ],
    recipes: [
      ["Hero", "Services", "Gallery", "BeforeAfter", "Pricing", "Map", "Booking"],
      ["Hero", "Marquee", "Services", "Gallery", "Faq", "Booking"],
      ["Hero", "About", "Pricing", "Process", "Map", "Cta"],
    ],
    blocks: withChrome(["Hero", "Services", "Gallery", "BeforeAfter", "Pricing", "Map", "Booking"], true),
    services: ["Corte", "Barba", "Acabamento", "Corte + barba", "Pigmentação sob consulta"],
    forbidden: [],
  },
  infoproduto: {
    label: "Infoproduto",
    schemaType: "Product",
    ethical: false,
    personalities: ["bold", "editorial", "brutalist", "minimal"],
    directions: [
      "conversão clara · método e planos",
      "editorial · currículo em passos",
      "contraste alto · FAQ honesto",
    ],
    motions: ["scale", "slide-up", "mask-reveal"],
    bgArts: ["grid", "spark", "checker"],
    palettes: [
      paper("#f7f4ef", "#1a1a1a", "#ff5a1f", "#fff1e8", "#f3efe8", "#e6ddd2"),
      paper("#14120b", "#f6f1e4", "#e6ff4d", "#222017", "#1c1912", "#2e2a20"),
      paper("#f4efe6", "#1e2430", "#e23d3d", "#ffe8dc", "#f7f1e8", "#eadfd2"),
      paper("#0b1020", "#e8eefc", "#6ea8ff", "#141a2e", "#10162a", "#243048"),
      paper("#fafafa", "#111111", "#111111", "#e5e5e5", "#f5f5f5", "#d4d4d4"),
    ],
    recipes: [
      ["Hero", "Marquee", "About", "Services", "Process", "Pricing", "Faq", "Cta"],
      ["Hero", "About", "Process", "Stats", "Pricing", "Cta"],
      ["Hero", "Services", "Faq", "About", "Contact", "Cta"],
    ],
    blocks: withChrome(["Hero", "Marquee", "About", "Services", "Process", "Pricing", "Faq", "Cta"]),
    services: ["Aula inaugural", "Material de apoio", "Comunidade", "Módulos práticos", "Suporte do plano"],
    forbidden: [/enriquec[ae]/i, /renda garantida/i, /100\s*%/i, /fique rico/i],
  },
  local: {
    label: "Negócio local",
    schemaType: "LocalBusiness",
    ethical: false,
    personalities: ["warm", "organic", "minimal", "bold"],
    directions: [
      "próxima e clara · serviços + WhatsApp",
      "orgânica · processo e mapa",
      "direta · stats e contato",
    ],
    motions: ["slide-up", "fade", "stagger"],
    bgArts: ["dots", "waves", "none"],
    palettes: [
      paper("#f6f3ee", "#1e2420", "#2f6f4e", "#e7f0ea", "#f3f1ec", "#ddd8ce"),
      paper("#fffaf3", "#2b2118", "#d97706", "#fff1dc", "#f8f1e6", "#eadcc8"),
      paper("#f3f5f4", "#1c2428", "#0f766e", "#e5f3f1", "#eef2f1", "#d5e0de"),
      paper("#f7f5f2", "#1a1a1a", "#1a1a1a", "#e8e4dc", "#f0ece6", "#d8d2c8"),
      paper("#102018", "#e8f5ec", "#3dd68c", "#183028", "#14241c", "#244038"),
    ],
    recipes: [
      ["Hero", "Services", "About", "Stats", "Map", "Contact"],
      ["Hero", "About", "Process", "Services", "Faq", "Cta"],
      ["Hero", "Services", "Gallery", "Map", "Booking", "Contact"],
    ],
    blocks: withChrome(["Hero", "Services", "About", "Stats", "Map", "Contact"], true),
    services: ["Atendimento", "Orçamento", "Visita", "Execução", "Pós-serviço"],
    forbidden: [],
  },
};

export const FONT_BY_PERSONALITY: Record<
  Personality,
  { display: (typeof DISPLAY_FONTS)[number]; body: (typeof BODY_FONTS)[number] }
> = {
  editorial: { display: "Fraunces", body: "Outfit" },
  minimal: { display: "Newsreader", body: "Figtree" },
  bold: { display: "Syne", body: "Manrope" },
  warm: { display: "Fraunces", body: "Literata" },
  luxury: { display: "Cormorant Garamond", body: "Manrope" },
  brutalist: { display: "Bebas Neue", body: "Manrope" },
  organic: { display: "Instrument Serif", body: "Figtree" },
};

export const STYLE_BY_PERSONALITY: Record<
  Personality,
  Pick<Theme, "radius" | "shadow" | "button" | "image" | "spacing" | "cursor">
> = {
  editorial: { radius: "sm", shadow: "none", button: "underline", image: "bleed", spacing: "airy", cursor: "default" },
  minimal: { radius: "md", shadow: "none", button: "solid", image: "sharp", spacing: "comfortable", cursor: "default" },
  bold: { radius: "none", shadow: "hard", button: "solid", image: "bleed", spacing: "compact", cursor: "dot" },
  warm: { radius: "lg", shadow: "soft", button: "pill", image: "rounded", spacing: "comfortable", cursor: "default" },
  luxury: { radius: "sm", shadow: "soft", button: "outline", image: "framed", spacing: "airy", cursor: "default" },
  brutalist: { radius: "none", shadow: "hard", button: "solid", image: "sharp", spacing: "compact", cursor: "dot" },
  organic: { radius: "lg", shadow: "soft", button: "pill", image: "rounded", spacing: "airy", cursor: "default" },
};

export function hashString(value: string) {
  let h = 0;
  for (const char of value) h = Math.imul(31, h) + char.charCodeAt(0);
  return Math.abs(h);
}

export function directionLabelFor(segment: string, direction: number) {
  const archetype = ARCHETYPES[segment] ?? ARCHETYPES.local;
  return archetype.directions[direction % 3];
}
