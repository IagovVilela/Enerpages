import {
  BODY_FONTS,
  DISPLAY_FONTS,
  PERSONALITIES,
  type Animation,
  type Theme,
} from "@/puck/schema";

type Personality = (typeof PERSONALITIES)[number];

export type Palette = Theme["colors"];

export type Archetype = {
  label: string;
  schemaType: string;
  ethical: boolean;
  personalities: Personality[];
  palettes: Palette[];
  motion: Animation["preset"];
  blocks: Array<
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
    | "WhatsApp"
  >;
  services: string[];
  forbidden: RegExp[];
};

const paper = (background: string, foreground: string, primary: string, accent: string, muted: string, border: string): Palette => ({
  background,
  foreground,
  primary,
  accent,
  muted,
  border,
});

export const ARCHETYPES: Record<string, Archetype> = {
  moda: {
    label: "Moda",
    schemaType: "ClothingStore",
    ethical: false,
    personalities: ["editorial", "bold", "luxury"],
    palettes: [
      paper("#f6f1ea", "#1c1410", "#8f3d2b", "#c6a15b", "#efe6da", "#e4d8c8"),
      paper("#111111", "#f5f5f2", "#e7ff3d", "#f5f5f2", "#1c1c1c", "#2a2a2a"),
      paper("#fbf7f2", "#2a2118", "#6b2d3c", "#d7c4a3", "#f3ece3", "#e6d9c8"),
    ],
    motion: "mask-reveal",
    blocks: ["Navbar", "Hero", "Marquee", "Catalog", "Gallery", "About", "Cta", "Footer", "WhatsApp"],
    services: ["Alfaiataria", "Peças sazonais", "Ajustes"],
    forbidden: [],
  },
  portfolio: {
    label: "Portfólio",
    schemaType: "Person",
    ethical: false,
    personalities: ["editorial", "bold", "minimal"],
    palettes: [
      paper("#f4f4f1", "#111111", "#ff4d00", "#ecece8", "#f7f7f4", "#deded8"),
      paper("#0e0e0e", "#f5f5f5", "#d6ff3f", "#1a1a1a", "#161616", "#2a2a2a"),
      paper("#f7f3ec", "#1c1915", "#355c7d", "#efe8dc", "#f3eee6", "#e2d8c8"),
    ],
    motion: "slide-up",
    blocks: ["Navbar", "Hero", "About", "Gallery", "Video", "Testimonials", "Process", "Timeline", "Contact", "Footer"],
    services: ["Direção de arte", "Identidade", "Editorial"],
    forbidden: [],
  },
  advocacia: {
    label: "Advocacia",
    schemaType: "LegalService",
    ethical: true,
    personalities: ["editorial", "minimal", "luxury"],
    palettes: [
      paper("#f4f1ec", "#1c2430", "#1e3a4c", "#9a7b4f", "#e7e1d8", "#d9d1c5"),
      paper("#f7f6f3", "#111111", "#3f4a3c", "#c4b7a6", "#eeece7", "#ddd8d0"),
      paper("#efece6", "#2b241c", "#5c3a2e", "#d8c3a5", "#f3efe8", "#e0d6c8"),
    ],
    motion: "fade",
    blocks: ["Navbar", "Hero", "About", "Services", "Process", "Faq", "Contact", "Footer"],
    services: ["Consultoria jurídica", "Contratos", "Atendimento inicial"],
    forbidden: [/garantid[oa]s?/i, /resultado assegurado/i, /o melhor advogado/i, /ganho( de)? causa/i, /100\s*%/i],
  },
  psicologia: {
    label: "Psicologia",
    schemaType: "ProfessionalService",
    ethical: true,
    personalities: ["warm", "organic", "minimal"],
    palettes: [
      paper("#f3efe8", "#2c3330", "#6d8f78", "#e7d7c9", "#f7f3ee", "#e4ddd2"),
      paper("#f7f3ee", "#243028", "#8aa38b", "#efe4d6", "#fbf7f2", "#e6ddd2"),
      paper("#fbf6f1", "#3d2c2c", "#c47b6a", "#f0e2d8", "#f8f1eb", "#eadfd4"),
    ],
    motion: "fade",
    blocks: ["Navbar", "Hero", "About", "Services", "Process", "Faq", "Booking", "Contact", "Footer"],
    services: ["Psicoterapia individual", "Acolhimento", "Orientação"],
    forbidden: [/cura/i, /garantid[oa]/i, /resultado rápido/i, /100\s*%/i, /transformação garantida/i],
  },
  clinica: {
    label: "Clínica",
    schemaType: "MedicalClinic",
    ethical: true,
    personalities: ["minimal", "warm", "organic"],
    palettes: [
      paper("#f4f7f6", "#16302b", "#1f6f62", "#d7ebe4", "#eef4f2", "#d5e4df"),
      paper("#f6f5f2", "#1b2430", "#3d6b8a", "#e4eef3", "#f3f2ef", "#d9e2ea"),
      paper("#fbfaf7", "#243024", "#7d9a78", "#e7efe4", "#f4f6f3", "#dde5dc"),
    ],
    motion: "slide-up",
    blocks: ["Navbar", "Hero", "Services", "About", "Team", "Faq", "Map", "Booking", "Footer", "WhatsApp"],
    services: ["Avaliação", "Acompanhamento", "Orientação"],
    forbidden: [/cura garantida/i, /sem risco/i, /100\s*%/i, /resultado garantido/i],
  },
  restaurante: {
    label: "Restaurante",
    schemaType: "Restaurant",
    ethical: false,
    personalities: ["warm", "editorial", "bold"],
    palettes: [
      paper("#1a120c", "#f6efe4", "#e07a3d", "#2a2118", "#241910", "#3a2c22"),
      paper("#f8f1e7", "#2a120c", "#9c2f2f", "#f0d8c4", "#f3e6d6", "#e4d0b8"),
      paper("#f3ead7", "#1f1a14", "#c4552a", "#efe2cc", "#f7f0e2", "#e5d5bc"),
    ],
    motion: "mask-reveal",
    blocks: ["Navbar", "Hero", "Marquee", "About", "Catalog", "Gallery", "Map", "Booking", "Footer", "WhatsApp"],
    services: ["Almoço", "Jantar", "Reservas"],
    forbidden: [],
  },
  barbearia: {
    label: "Barbearia",
    schemaType: "HairSalon",
    ethical: false,
    personalities: ["brutalist", "bold", "luxury"],
    palettes: [
      paper("#121212", "#f2efe9", "#c6a15b", "#1c1c1c", "#1a1a1a", "#2c2c2c"),
      paper("#f2efe9", "#141414", "#8c1c13", "#e6e0d6", "#f7f4ee", "#ddd6c8"),
      paper("#0e1a17", "#f4f1ea", "#d2b48c", "#1a2e28", "#13241f", "#243832"),
    ],
    motion: "slide-left",
    blocks: ["Navbar", "Hero", "Services", "Gallery", "BeforeAfter", "Pricing", "Map", "Booking", "Footer", "WhatsApp"],
    services: ["Corte", "Barba", "Acabamento"],
    forbidden: [],
  },
  infoproduto: {
    label: "Infoproduto",
    schemaType: "Product",
    ethical: false,
    personalities: ["bold", "editorial", "brutalist"],
    palettes: [
      paper("#f7f4ef", "#1a1a1a", "#ff5a1f", "#fff1e8", "#f3efe8", "#e6ddd2"),
      paper("#14120b", "#f6f1e4", "#e6ff4d", "#222017", "#1c1912", "#2e2a20"),
      paper("#f4efe6", "#1e2430", "#e23d3d", "#ffe8dc", "#f7f1e8", "#eadfd2"),
    ],
    motion: "scale",
    blocks: ["Navbar", "Hero", "Marquee", "About", "Services", "Process", "Pricing", "Faq", "Cta", "Footer"],
    services: ["Aula inaugural", "Material de apoio", "Comunidade"],
    forbidden: [/enriquec[ae]/i, /renda garantida/i, /100\s*%/i, /fique rico/i],
  },
  local: {
    label: "Negócio local",
    schemaType: "LocalBusiness",
    ethical: false,
    personalities: ["warm", "organic", "minimal"],
    palettes: [
      paper("#f6f3ee", "#1e2420", "#2f6f4e", "#e7f0ea", "#f3f1ec", "#ddd8ce"),
      paper("#fffaf3", "#2b2118", "#d97706", "#fff1dc", "#f8f1e6", "#eadcc8"),
      paper("#f3f5f4", "#1c2428", "#0f766e", "#e5f3f1", "#eef2f1", "#d5e0de"),
    ],
    motion: "slide-up",
    blocks: ["Navbar", "Hero", "Services", "About", "Stats", "Map", "Contact", "Footer", "WhatsApp"],
    services: ["Atendimento", "Orçamento", "Visita"],
    forbidden: [],
  },
};

export const FONT_BY_PERSONALITY: Record<Personality, { display: (typeof DISPLAY_FONTS)[number]; body: (typeof BODY_FONTS)[number] }> = {
  editorial: { display: "Fraunces", body: "Outfit" },
  minimal: { display: "Newsreader", body: "Figtree" },
  bold: { display: "Syne", body: "Manrope" },
  warm: { display: "Fraunces", body: "Literata" },
  luxury: { display: "Cormorant Garamond", body: "Manrope" },
  brutalist: { display: "Bebas Neue", body: "Manrope" },
  organic: { display: "Instrument Serif", body: "Figtree" },
};

export const STYLE_BY_PERSONALITY: Record<Personality, Pick<Theme, "radius" | "shadow" | "button" | "image" | "spacing" | "cursor">> = {
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
