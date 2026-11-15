import type { Animation, BlockType, Briefing, Theme } from "@/puck/schema";
import { PAGE_TEMPLATE_IDS, type PageTemplateId } from "@/puck/page-templates-ids";
import { EXTRA_STYLES, SEGMENT_TRIOS, STYLE_PATCHES } from "@/lib/ai/segment-roster";

export type TemplateStyle = {
  personality: Theme["personality"];
  colors: Theme["colors"];
  motion: Animation["preset"];
  blocks?: BlockType[];
  heroVariant?: string;
  direction?: number;
  preferredSegment?: Briefing["segment"];
  fonts?: Theme["fonts"];
  entrance?: Theme["entrance"];
  navbarVariant?: string;
  blockVariants?: Partial<Record<BlockType, string>>;
  heroDock?: "none" | "search" | "reserve" | "booking" | "stay";
  radius?: Theme["radius"];
  shadow?: Theme["shadow"];
  spacing?: Theme["spacing"];
  button?: Theme["button"];
  image?: Theme["image"];
  bgArt?: Theme["bgArt"];
  cursor?: Theme["cursor"];
  progress?: boolean;
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

const CORE_STYLES: Record<string, TemplateStyle> = {
  blank: {
    personality: "minimal",
    colors: paper("#f7f7f5", "#171717", "#171717", "#e5e5e5", "#f0f0ee", "#d4d4d4"),
    motion: "fade",
    blocks: ["Navbar", "Hero", "Footer"],
    heroVariant: "banner",
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
    blocks: ["Navbar", "Hero", "About", "Services", "Process", "Contact", "Footer"],
    heroVariant: "split",
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
    heroVariant: "asymmetric",
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
    heroVariant: "banner",
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
    blocks: ["Navbar", "Hero", "Catalog", "About", "Process", "Cta", "Footer"],
    heroVariant: "banner",
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
    colors: paper("#f6f1ea", "#1c1410", "#8f3d2b", "#c6a15b", "#efe6da", "#e4d8c8"),
    motion: "fade",
    preferredSegment: "moda",
    blocks: ["Navbar", "Hero", "Marquee", "Catalog", "About", "Cta", "Footer", "WhatsApp"],
    heroVariant: "banner",
  },
  vertice: {
    personality: "luxury",
    colors: paper("#fbf9f5", "#14120f", "#c6a97e", "#1b1a17", "#f3eee6", "#e4d8c8"),
    motion: "slide-up",
    preferredSegment: "local",
    fonts: { display: "Bodoni Moda", body: "Jost" },
    entrance: "curtain",
    navbarVariant: "overlay",
    heroVariant: "cinematic",
    heroDock: "search",
    blocks: ["Navbar", "Hero", "Stats", "Catalog", "About", "Services", "Testimonials", "Contact", "Footer"],
    blockVariants: {
      Stats: "band",
      Catalog: "mosaic",
      About: "columns",
      Services: "bento",
      Testimonials: "large",
      Contact: "split",
      Footer: "editorial",
    },
  },
  ferraz: {
    personality: "editorial",
    colors: paper("#f7f4ef", "#1a1814", "#6e1d2a", "#efeae3", "#f3efe8", "#e3dcd2"),
    motion: "slide-up",
    preferredSegment: "advocacia",
    fonts: { display: "Bodoni Moda", body: "Jost" },
    entrance: "curtain",
    navbarVariant: "minimal",
    heroVariant: "light",
    blocks: ["Navbar", "Hero", "Services", "About", "Process", "Team", "Timeline", "Contact", "Footer"],
    blockVariants: {
      Services: "index",
      About: "manifesto",
      Process: "numbered",
      Team: "portraits",
      Timeline: "years",
      Contact: "split",
      Footer: "editorial",
    },
  },
  essenza: {
    personality: "organic",
    colors: paper("#f6f3ee", "#243028", "#7d8b74", "#efe6d6", "#f3efe8", "#e3ddd2"),
    motion: "slide-up",
    preferredSegment: "clinica",
    fonts: { display: "Newsreader", body: "Jost" },
    entrance: "curtain",
    navbarVariant: "bar",
    heroVariant: "light",
    heroDock: "booking",
    blocks: ["Navbar", "Hero", "Stats", "Services", "About", "Team", "Booking", "Faq", "Contact", "Footer"],
    blockVariants: {
      Stats: "row",
      Services: "grid",
      About: "columns",
      Team: "portraits",
      Booking: "split",
      Faq: "accordion",
      Contact: "split",
      Footer: "columns",
    },
  },
  lenha: {
    personality: "luxury",
    colors: paper("#1a100c", "#f6efe6", "#e07a3d", "#2a1812", "#241610", "#3a241c"),
    motion: "slide-up",
    preferredSegment: "restaurante",
    fonts: { display: "Bodoni Moda", body: "Jost" },
    entrance: "curtain",
    navbarVariant: "overlay",
    heroVariant: "cinematic",
    heroDock: "reserve",
    blocks: ["Navbar", "Hero", "Catalog", "Gallery", "Booking", "Map", "Contact", "Footer"],
    blockVariants: {
      Catalog: "rows",
      Gallery: "feature",
      Booking: "banner",
      Map: "split",
      Contact: "split",
      Footer: "editorial",
    },
  },
  linea: {
    personality: "editorial",
    colors: paper("#f4f1eb", "#161616", "#1f1f1f", "#c8c2b4", "#f7f4ee", "#ddd6cc"),
    motion: "slide-up",
    preferredSegment: "portfolio",
    fonts: { display: "Bodoni Moda", body: "Jost" },
    entrance: "curtain",
    navbarVariant: "overlay",
    heroVariant: "cinematic",
    blocks: ["Navbar", "Hero", "About", "Gallery", "BeforeAfter", "Services", "Process", "Contact", "Footer"],
    blockVariants: {
      About: "manifesto",
      Gallery: "feature",
      BeforeAfter: "slider",
      Services: "index",
      Process: "numbered",
      Contact: "split",
      Footer: "editorial",
    },
  },
  alisio: {
    personality: "organic",
    colors: paper("#f6f1e8", "#2c3330", "#8aa39a", "#e7efe8", "#f3eee6", "#ddd4c6"),
    motion: "slide-up",
    preferredSegment: "local",
    fonts: { display: "Bodoni Moda", body: "Jost" },
    entrance: "curtain",
    navbarVariant: "overlay",
    heroVariant: "cinematic",
    heroDock: "stay",
    blocks: ["Navbar", "Hero", "About", "Catalog", "Gallery", "Testimonials", "Map", "Contact", "Footer"],
    blockVariants: {
      About: "columns",
      Catalog: "lookbook",
      Gallery: "filmstrip",
      Testimonials: "large",
      Map: "banner",
      Contact: "split",
      Footer: "editorial",
    },
  },
  navalha: {
    personality: "luxury",
    colors: paper("#12110f", "#f3efe6", "#c6a15b", "#1c1b18", "#1a1916", "#2e2c28"),
    motion: "slide-up",
    preferredSegment: "barbearia",
    fonts: { display: "Bodoni Moda", body: "Jost" },
    entrance: "curtain",
    navbarVariant: "overlay",
    heroVariant: "cinematic",
    blocks: ["Navbar", "Hero", "Services", "About", "Team", "Booking", "Pricing", "Gallery", "Footer"],
    blockVariants: {
      Services: "list",
      About: "overlap",
      Team: "portraits",
      Booking: "card",
      Pricing: "highlight",
      Gallery: "filmstrip",
      Footer: "editorial",
    },
  },
  pulso: {
    personality: "bold",
    colors: paper("#10140f", "#f2f6ef", "#c6f135", "#1a2418", "#161c14", "#2a3324"),
    motion: "slide-up",
    preferredSegment: "local",
    fonts: { display: "Syne", body: "Manrope" },
    entrance: "curtain",
    navbarVariant: "bar",
    heroVariant: "cinematic",
    blocks: ["Navbar", "Hero", "Services", "Process", "Stats", "Team", "Pricing", "Cta", "Footer"],
    blockVariants: {
      Services: "bento",
      Process: "steps",
      Stats: "band",
      Team: "offset",
      Pricing: "trio",
      Cta: "poster",
      Footer: "bar",
    },
  },
  maison: {
    personality: "editorial",
    colors: paper("#fbf6f2", "#3a2a2a", "#c47b8a", "#f3e6df", "#f7f1ec", "#eadfd8"),
    motion: "slide-up",
    preferredSegment: "moda",
    fonts: { display: "Bodoni Moda", body: "Jost" },
    entrance: "curtain",
    navbarVariant: "bar",
    heroVariant: "light",
    blocks: ["Navbar", "Hero", "Catalog", "Process", "About", "Gallery", "Cta", "Footer"],
    blockVariants: {
      Catalog: "shelf",
      Process: "steps",
      About: "overlap",
      Gallery: "masonry",
      Cta: "band",
      Footer: "centered",
    },
  },
};

const MERGED_STYLES: Record<string, TemplateStyle> = { ...CORE_STYLES, ...EXTRA_STYLES };

for (const [id, patch] of Object.entries(STYLE_PATCHES)) {
  const current = MERGED_STYLES[id];
  if (!current || !patch) continue;
  MERGED_STYLES[id] = {
    ...current,
    ...patch,
    blockVariants: { ...current.blockVariants, ...patch.blockVariants },
  };
}

export const TEMPLATE_STYLES = MERGED_STYLES as Record<PageTemplateId, TemplateStyle>;

export const SEGMENT_PROPOSAL_TEMPLATES = SEGMENT_TRIOS;

export function isPageTemplateId(value: string): value is PageTemplateId {
  return (PAGE_TEMPLATE_IDS as readonly string[]).includes(value);
}

export function getTemplateStyle(id: PageTemplateId) {
  return TEMPLATE_STYLES[id];
}

export function resolveProposalTemplate(briefing: Briefing, direction: number): PageTemplateId {
  const dir = ((direction % 3) + 3) % 3;
  const alts = SEGMENT_PROPOSAL_TEMPLATES[briefing.segment] ?? SEGMENT_PROPOSAL_TEMPLATES.local!;
  const preferred =
    briefing.templateId && isPageTemplateId(briefing.templateId) ? briefing.templateId : null;
  if (preferred) {
    if (dir === 0) return preferred;
    const others = alts.filter((item) => item !== preferred);
    return others[(dir - 1) % Math.max(others.length, 1)] ?? alts[dir]!;
  }
  return alts[dir]!;
}
