import type { Animation, BlockType, Briefing, Theme } from "@/puck/schema";
import { PAGE_TEMPLATE_IDS, type PageTemplateId } from "@/puck/page-templates-ids";

export type TemplateStyle = {
  personality: Theme["personality"];
  colors: Theme["colors"];
  motion: Animation["preset"];
  blocks?: BlockType[];
  heroVariant?: string;
  direction?: number;
  preferredSegment?: Briefing["segment"];
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

export const TEMPLATE_STYLES: Record<PageTemplateId, TemplateStyle> = {
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
};

/**
 * Modelos tipográficos / estáveis (sem depender de galeria vazia).
 * Neon/impacto dark só entram como contraste controlado.
 */
export const SEGMENT_PROPOSAL_TEMPLATES: Record<string, [PageTemplateId, PageTemplateId, PageTemplateId]> = {
  moda: ["vitrine", "boutique", "editorial"],
  portfolio: ["studio", "editorial", "minimal"],
  advocacia: ["classic", "noir", "minimal"],
  psicologia: ["ocean", "minimal", "editorial"],
  clinica: ["ocean", "classic", "rua"],
  restaurante: ["boutique", "rua", "classic"],
  barbearia: ["rua", "brutalista", "moderno"],
  infoproduto: ["moderno", "impacto", "minimal"],
  local: ["rua", "classic", "ocean"],
};

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
