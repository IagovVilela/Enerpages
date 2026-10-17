import {
  createClassicCanvas,
  createLibraryElement,
  DESKTOP_ARTBOARD,
  MOBILE_ARTBOARD,
  type SiteCanvasConfig,
} from "@/lib/canvas/site-canvas";

export const CANVAS_PAGE_TEMPLATE_IDS = [
  "blank",
  "classic",
  "studio",
  "minimal",
  "moderno",
  "editorial",
] as const;

export type CanvasPageTemplateId = (typeof CANVAS_PAGE_TEMPLATE_IDS)[number];

export type PageTemplateMeta = {
  id: CanvasPageTemplateId;
  label: string;
  tagline: string;
  vibe: string;
  swatch: string;
};

export const PAGE_TEMPLATE_META: PageTemplateMeta[] = [
  { id: "blank", label: "Em branco", tagline: "Canvas quase vazio.", vibe: "Começar do zero", swatch: "#3f3f46" },
  { id: "classic", label: "Clássico", tagline: "Hero + texto + CTA + rodapé.", vibe: "Tradicional", swatch: "#9a3412" },
  { id: "studio", label: "Estúdio", tagline: "Mídia grande + coluna de texto.", vibe: "Visual", swatch: "#8f3d2b" },
  { id: "minimal", label: "Minimalista", tagline: "Coluna estreita, muito espaço.", vibe: "Clean", swatch: "#d9d0c3" },
  { id: "moderno", label: "Moderno", tagline: "Split + grade de destaques.", vibe: "Geométrico", swatch: "#1c1915" },
  { id: "editorial", label: "Editorial", tagline: "Headline + painel + citação.", vibe: "Revista", swatch: "#f3efe7" },
];

function el(
  type: Parameters<typeof createLibraryElement>[0],
  artboard: "desktop" | "mobile",
  boardW: number,
  frame: { x: number; y: number; w: number; h: number },
  props: Record<string, unknown>,
  zIndex: number,
  id: string,
) {
  const base = createLibraryElement(type, artboard, boardW, frame.y);
  return { ...base, id, frame, zIndex, props: { ...base.props, ...props } };
}

function blankTemplate(name: string): SiteCanvasConfig {
  const deskW = DESKTOP_ARTBOARD.width;
  const mobW = MOBILE_ARTBOARD.width;
  const desk = [
    el("navbar", "desktop", deskW, { x: 0, y: 0, w: deskW, h: 72 }, { title: name }, 10, "d-nav"),
    el("rect", "desktop", deskW, { x: 80, y: 160, w: deskW - 160, h: 400 }, { backgroundColor: "theme.surface", borderRadius: 16 }, 1, "d-box"),
    el("text", "desktop", deskW, { x: 120, y: 220, w: 480, h: 80 }, { text: "Área livre", fontSize: 36, fontWeight: 600, color: "theme.text" }, 2, "d-hint"),
    el("footer", "desktop", deskW, { x: 0, y: 2200, w: deskW, h: 100 }, { showPitch: true, title: name }, 1, "d-foot"),
  ];
  const scale = mobW / deskW;
  const mobile = desk.map((e, i) => ({
    ...e,
    id: `m-${e.id}`,
    artboard: "mobile" as const,
    frame: {
      x: Math.round(e.frame.x * scale),
      y: Math.round(e.frame.y * scale),
      w: Math.max(24, Math.round(e.frame.w * scale)),
      h: Math.max(24, Math.round(e.frame.h * scale)),
    },
    zIndex: i + 1,
  }));
  return {
    version: 2,
    theme: {
      primary: "#9a3412",
      secondary: "#5c4033",
      background: "#0f1419",
      surface: "#18181b",
      text: "#fafafa",
      bgArt: "none",
      fontDisplay: "Fraunces",
      fontBody: "Outfit",
      radius: "md",
    },
    artboards: { desktop: { ...DESKTOP_ARTBOARD }, mobile: { ...MOBILE_ARTBOARD } },
    elements: [...desk, ...mobile],
  };
}

function studioTemplate(name: string): SiteCanvasConfig {
  const deskW = DESKTOP_ARTBOARD.width;
  const desk = [
    el("navbar", "desktop", deskW, { x: 0, y: 0, w: deskW, h: 72 }, { title: name }, 10, "s-nav"),
    el("media", "desktop", deskW, { x: 0, y: 72, w: 900, h: 640 }, { backgroundColor: "theme.surface" }, 1, "s-media"),
    el(
      "text",
      "desktop",
      deskW,
      { x: 940, y: 140, w: 420, h: 120 },
      { text: name, fontSize: 48, fontWeight: 700, color: "theme.text", variant: "display" },
      2,
      "s-title",
    ),
    el(
      "text",
      "desktop",
      deskW,
      { x: 940, y: 280, w: 400, h: 100 },
      { text: "Presença visual com mídia em destaque e texto ao lado.", fontSize: 18, color: "#a1a1aa" },
      3,
      "s-body",
    ),
    el(
      "button",
      "desktop",
      deskW,
      { x: 940, y: 420, w: 180, h: 48 },
      { text: "Contato", href: "contact", backgroundColor: "theme.primary", color: "theme.onPrimary", borderRadius: 999, fontWeight: 700 },
      4,
      "s-cta",
    ),
    el("footer", "desktop", deskW, { x: 0, y: 2200, w: deskW, h: 100 }, { showPitch: true, title: name }, 1, "s-foot"),
  ];
  const mobW = MOBILE_ARTBOARD.width;
  const scale = mobW / deskW;
  const mobile = desk.map((e, i) => ({
    ...e,
    id: `m-${e.id}`,
    artboard: "mobile" as const,
    frame: {
      x: Math.round(e.frame.x * scale),
      y: Math.round(e.frame.y * scale),
      w: Math.max(24, Math.round(e.frame.w * scale)),
      h: Math.max(24, Math.round(e.frame.h * scale)),
    },
    zIndex: i + 1,
  }));
  return {
    version: 2,
    theme: {
      primary: "#9a3412",
      background: "#0f1419",
      surface: "#18181b",
      text: "#fafafa",
      fontDisplay: "Fraunces",
      fontBody: "Outfit",
      bgArt: "horizon",
    },
    artboards: { desktop: { ...DESKTOP_ARTBOARD }, mobile: { ...MOBILE_ARTBOARD } },
    elements: [...desk, ...mobile],
  };
}

function minimalTemplate(name: string): SiteCanvasConfig {
  const deskW = DESKTOP_ARTBOARD.width;
  const colX = Math.round((deskW - 640) / 2);
  const desk = [
    el("navbar", "desktop", deskW, { x: 0, y: 0, w: deskW, h: 64 }, { title: name }, 10, "n-nav"),
    el(
      "text",
      "desktop",
      deskW,
      { x: colX, y: 200, w: 640, h: 100 },
      { text: name, fontSize: 56, fontWeight: 700, color: "theme.text", align: "center" },
      2,
      "n-title",
    ),
    el(
      "text",
      "desktop",
      deskW,
      { x: colX, y: 320, w: 640, h: 80 },
      { text: "Uma página leve, com foco no essencial.", fontSize: 18, color: "#a1a1aa", align: "center" },
      3,
      "n-body",
    ),
    el(
      "button",
      "desktop",
      deskW,
      { x: colX + 220, y: 430, w: 200, h: 48 },
      {
        text: "Falar conosco",
        href: "contact",
        variant: "outline",
        backgroundColor: "transparent",
        color: "theme.text",
        borderColor: "theme.text",
        borderWidth: 2,
        borderRadius: 999,
        fontWeight: 700,
      },
      4,
      "n-cta",
    ),
    el("footer", "desktop", deskW, { x: 0, y: 2100, w: deskW, h: 80 }, { showPitch: true, title: name }, 1, "n-foot"),
  ];
  const mobW = MOBILE_ARTBOARD.width;
  const scale = mobW / deskW;
  const mobile = desk.map((e, i) => ({
    ...e,
    id: `m-${e.id}`,
    artboard: "mobile" as const,
    frame: {
      x: Math.round(e.frame.x * scale),
      y: Math.round(e.frame.y * scale),
      w: Math.max(24, Math.round(e.frame.w * scale)),
      h: Math.max(24, Math.round(e.frame.h * scale)),
    },
    zIndex: i + 1,
  }));
  return {
    version: 2,
    theme: {
      primary: "#9a3412",
      background: "#0f1419",
      surface: "#18181b",
      text: "#fafafa",
      fontDisplay: "Fraunces",
      fontBody: "Outfit",
      bgArt: "none",
    },
    artboards: { desktop: { ...DESKTOP_ARTBOARD }, mobile: { ...MOBILE_ARTBOARD } },
    elements: [...desk, ...mobile],
  };
}

function modernoTemplate(name: string): SiteCanvasConfig {
  const base = createClassicCanvas(name);
  return {
    ...base,
    theme: { ...base.theme, primary: "#1c1915", bgArt: "grid", background: "#f3efe7", text: "#1c1915", surface: "#ffffff" },
  };
}

function editorialTemplate(name: string): SiteCanvasConfig {
  const deskW = DESKTOP_ARTBOARD.width;
  const desk = [
    el("navbar", "desktop", deskW, { x: 0, y: 0, w: deskW, h: 72 }, { title: name }, 10, "e-nav"),
    el(
      "text",
      "desktop",
      deskW,
      { x: 80, y: 140, w: 900, h: 140 },
      { text: name, fontSize: 72, fontWeight: 700, color: "#1c1915", variant: "display" },
      2,
      "e-head",
    ),
    el("rect", "desktop", deskW, { x: 80, y: 320, w: 8, h: 280 }, { backgroundColor: "#1c1915" }, 1, "e-spine"),
    el(
      "panel",
      "desktop",
      deskW,
      { x: 120, y: 320, w: 520, h: 280 },
      {
        title: "Nota editorial",
        description: "Texto de apoio com tom de revista. Ajuste título e corpo no inspector.",
        backgroundColor: "#fffdf9",
        color: "#1c1915",
        padding: 28,
        borderRadius: 0,
      },
      2,
      "e-panel",
    ),
    el(
      "text",
      "desktop",
      deskW,
      { x: 700, y: 360, w: 600, h: 160 },
      { text: `"Presença com a cara da marca."`, fontSize: 28, fontWeight: 600, color: "#9a3412" },
      3,
      "e-quote",
    ),
    el("footer", "desktop", deskW, { x: 0, y: 2200, w: deskW, h: 100 }, { showPitch: true, title: name }, 1, "e-foot"),
  ];
  const mobW = MOBILE_ARTBOARD.width;
  const scale = mobW / deskW;
  const mobile = desk.map((e, i) => ({
    ...e,
    id: `m-${e.id}`,
    artboard: "mobile" as const,
    frame: {
      x: Math.round(e.frame.x * scale),
      y: Math.round(e.frame.y * scale),
      w: Math.max(24, Math.round(e.frame.w * scale)),
      h: Math.max(24, Math.round(e.frame.h * scale)),
    },
    zIndex: i + 1,
  }));
  return {
    version: 2,
    theme: {
      primary: "#9a3412",
      background: "#f3efe7",
      surface: "#fffdf9",
      text: "#1c1915",
      fontDisplay: "Fraunces",
      fontBody: "Outfit",
      bgArt: "none",
    },
    artboards: { desktop: { ...DESKTOP_ARTBOARD }, mobile: { ...MOBILE_ARTBOARD } },
    elements: [...desk, ...mobile],
  };
}

export function buildCanvasPageTemplate(id: CanvasPageTemplateId, clientName: string): SiteCanvasConfig {
  switch (id) {
    case "blank":
      return blankTemplate(clientName);
    case "classic":
      return createClassicCanvas(clientName);
    case "studio":
      return studioTemplate(clientName);
    case "minimal":
      return minimalTemplate(clientName);
    case "moderno":
      return modernoTemplate(clientName);
    case "editorial":
      return editorialTemplate(clientName);
    default: {
      const _e: never = id;
      void _e;
      return createClassicCanvas(clientName);
    }
  }
}

export function isCanvasPageTemplateId(value: string): value is CanvasPageTemplateId {
  return (CANVAS_PAGE_TEMPLATE_IDS as readonly string[]).includes(value);
}
