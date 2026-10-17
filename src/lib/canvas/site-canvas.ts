import { z } from "zod";

export const CANVAS_ARTBOARDS = ["desktop", "mobile"] as const;
export type CanvasArtboardId = (typeof CANVAS_ARTBOARDS)[number];

export const CANVAS_ELEMENT_TYPES = [
  "text",
  "image",
  "button",
  "rect",
  "media",
  "navbar",
  "services",
  "team",
  "contact",
  "footer",
  "hero",
  "panel",
  "grid",
  "divider",
  "badge",
  "spacer",
] as const;

export type CanvasElementType = (typeof CANVAS_ELEMENT_TYPES)[number];

export const DESKTOP_ARTBOARD = { width: 1440, height: 2400 } as const;
export const MOBILE_ARTBOARD = { width: 390, height: 3200 } as const;

const themeSchema = z.object({
  primary: z.string().trim().min(3).max(16).optional(),
  secondary: z.string().trim().min(3).max(16).optional(),
  background: z.string().trim().min(3).max(16).optional(),
  surface: z.string().trim().min(3).max(16).optional(),
  text: z.string().trim().min(3).max(16).optional(),
  bgArt: z
    .enum([
      "none",
      "grid",
      "dots",
      "diagonal",
      "horizon",
      "vertical",
      "glow",
      "noise",
      "checker",
      "blueprint",
      "cross",
      "rings",
      "waves",
      "spark",
      "mesh",
    ])
    .optional(),
  bgArtColor: z.string().trim().min(3).max(16).optional(),
  bgArtStrength: z.number().min(5).max(100).optional(),
  fontDisplay: z.string().trim().max(80).optional(),
  fontBody: z.string().trim().max(80).optional(),
  radius: z.enum(["sm", "md", "lg"]).optional(),
  motion: z.enum(["off", "subtle", "full"]).optional(),
});

const frameSchema = z.object({
  x: z.number().min(-2000).max(8000),
  y: z.number().min(-2000).max(12000),
  w: z.number().min(4).max(4000),
  h: z.number().min(1).max(4000),
});

const cardItemSchema = z.object({
  title: z.string().max(80),
  description: z.string().max(240).optional(),
  emoji: z.string().max(8).optional(),
});

const elementPropsSchema = z
  .object({
    text: z.string().max(4000).optional(),
    fontSize: z.number().min(10).max(200).optional(),
    fontWeight: z.union([z.literal(400), z.literal(600), z.literal(700)]).optional(),
    color: z.string().max(32).optional(),
    backgroundColor: z.string().max(32).optional(),
    borderColor: z.string().max(32).optional(),
    borderWidth: z.number().min(0).max(12).optional(),
    borderRadius: z.number().min(0).max(999).optional(),
    align: z.enum(["left", "center", "right"]).optional(),
    href: z.string().max(300).optional(),
    mediaUrl: z.string().max(800).optional(),
    mediaZoom: z.number().min(1).max(3).optional(),
    mediaPosX: z.number().min(0).max(100).optional(),
    mediaPosY: z.number().min(0).max(100).optional(),
    opacity: z.number().min(0).max(1).optional(),
    showPitch: z.boolean().optional(),
    schedule: z
      .array(z.object({ label: z.string().max(40), range: z.string().max(40) }))
      .max(14)
      .optional(),
    title: z.string().max(160).optional(),
    description: z.string().max(500).optional(),
    eyebrow: z.string().max(80).optional(),
    ctaLabel: z.string().max(60).optional(),
    overlay: z.number().min(0).max(1).optional(),
    padding: z.number().min(0).max(80).optional(),
    thickness: z.number().min(1).max(24).optional(),
    variant: z.string().max(40).optional(),
    gridCols: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    cards: z.array(cardItemSchema).max(12).optional(),
  })
  .passthrough();

export const canvasElementSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(CANVAS_ELEMENT_TYPES),
  artboard: z.enum(CANVAS_ARTBOARDS),
  frame: frameSchema,
  zIndex: z.number().int().min(0).max(999).default(1),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
  props: elementPropsSchema.optional(),
});

export const siteCanvasSchema = z.object({
  version: z.literal(2),
  theme: themeSchema.optional(),
  artboards: z.object({
    desktop: z.object({
      width: z.number().int().min(320).max(2400),
      height: z.number().int().min(400).max(12000),
    }),
    mobile: z.object({
      width: z.number().int().min(280).max(900),
      height: z.number().int().min(400).max(12000),
    }),
  }),
  elements: z.array(canvasElementSchema).max(200),
});

export type SiteCanvasConfig = z.infer<typeof siteCanvasSchema>;
export type CanvasElement = z.infer<typeof canvasElementSchema>;
export type CanvasTheme = z.infer<typeof themeSchema>;

function el(partial: Omit<CanvasElement, "zIndex"> & { zIndex?: number }): CanvasElement {
  return { zIndex: 1, ...partial };
}

export function createClassicCanvas(clientName: string): SiteCanvasConfig {
  const name = clientName.trim() || "Sua marca";
  const deskW = DESKTOP_ARTBOARD.width;
  const mobW = MOBILE_ARTBOARD.width;
  const desk: CanvasElement[] = [
    el({
      id: "d-nav",
      type: "navbar",
      artboard: "desktop",
      frame: { x: 0, y: 0, w: deskW, h: 72 },
      zIndex: 10,
      props: { title: name },
    }),
    el({
      id: "d-hero",
      type: "hero",
      artboard: "desktop",
      frame: { x: 0, y: 72, w: deskW, h: 520 },
      zIndex: 1,
      props: {
        eyebrow: name,
        title: "Presença com a sua cara",
        description: "Edite no canvas livre: arraste, redimensione e publique.",
        ctaLabel: "Falar conosco",
        href: "contact",
        backgroundColor: "#14110e",
        overlay: 0.4,
        color: "#fafafa",
      },
    }),
    el({
      id: "d-text",
      type: "text",
      artboard: "desktop",
      frame: { x: 80, y: 640, w: 640, h: 80 },
      zIndex: 2,
      props: { text: name, fontSize: 42, fontWeight: 700, color: "#fafafa" },
    }),
    el({
      id: "d-btn",
      type: "button",
      artboard: "desktop",
      frame: { x: 80, y: 740, w: 200, h: 52 },
      zIndex: 3,
      props: {
        text: "Contato",
        href: "contact",
        backgroundColor: "theme.primary",
        color: "theme.onPrimary",
        borderRadius: 999,
        fontWeight: 700,
      },
    }),
    el({
      id: "d-foot",
      type: "footer",
      artboard: "desktop",
      frame: { x: 0, y: 2200, w: deskW, h: 100 },
      zIndex: 1,
      props: { showPitch: true, title: name },
    }),
  ];

  const scale = mobW / deskW;
  const mobile = desk.map((e, i) =>
    el({
      id: `m-${e.id}`,
      type: e.type,
      artboard: "mobile",
      frame: {
        x: Math.round(e.frame.x * scale),
        y: Math.round(e.frame.y * scale),
        w: Math.max(24, Math.round(e.frame.w * scale)),
        h: Math.max(24, Math.round(e.frame.h * scale)),
      },
      zIndex: i + 1,
      props: e.props,
    }),
  );

  return {
    version: 2,
    theme: {
      primary: "#8f3d2b",
      secondary: "#5c4033",
      background: "#0f1419",
      surface: "#18181b",
      text: "#fafafa",
      bgArt: "none",
      fontDisplay: "Fraunces",
      fontBody: "Outfit",
      radius: "md",
      motion: "subtle",
    },
    artboards: {
      desktop: { ...DESKTOP_ARTBOARD },
      mobile: { ...MOBILE_ARTBOARD },
    },
    elements: [...desk, ...mobile],
  };
}

export function parseSiteCanvasConfig(raw: unknown, clientName: string): SiteCanvasConfig {
  const v2 = siteCanvasSchema.safeParse(raw);
  if (v2.success) return v2.data;

  if (raw && typeof raw === "object" && (raw as { version?: unknown }).version === 2 && Array.isArray((raw as { elements?: unknown }).elements)) {
    const soft = structuredClone(raw) as SiteCanvasConfig;
    for (const item of soft.elements) {
      item.frame.w = Math.max(4, item.frame.w);
      item.frame.h = Math.max(1, item.frame.h);
      if (typeof item.props?.borderRadius === "number") {
        item.props.borderRadius = Math.min(999, Math.max(0, item.props.borderRadius));
      }
    }
    const again = siteCanvasSchema.safeParse(soft);
    if (again.success) return again.data;
  }

  return createClassicCanvas(clientName);
}

export function elementsForArtboard(config: SiteCanvasConfig, artboard: CanvasArtboardId): CanvasElement[] {
  return config.elements
    .filter((e) => e.artboard === artboard && !e.hidden)
    .sort((a, b) => a.zIndex - b.zIndex || a.frame.y - b.frame.y);
}

/** Inclui ocultos — para o painel de camadas. */
export function layerElementsForArtboard(config: SiteCanvasConfig, artboard: CanvasArtboardId): CanvasElement[] {
  return config.elements
    .filter((e) => e.artboard === artboard)
    .sort((a, b) => b.zIndex - a.zIndex || b.frame.y - a.frame.y);
}

export function copyDesktopToMobile(config: SiteCanvasConfig): SiteCanvasConfig {
  const deskW = config.artboards.desktop.width;
  const mobW = config.artboards.mobile.width;
  const scale = mobW / deskW;
  const desktopEls = config.elements.filter((e) => e.artboard === "desktop");
  const others = config.elements.filter((e) => e.artboard !== "mobile");
  const mobileEls = desktopEls.map((e, i) =>
    el({
      id: `m-copy-${e.id}-${i}`,
      type: e.type,
      artboard: "mobile",
      frame: {
        x: Math.round(e.frame.x * scale),
        y: Math.round(e.frame.y * scale),
        w: Math.max(24, Math.round(e.frame.w * scale)),
        h: Math.max(24, Math.round(e.frame.h * scale)),
      },
      zIndex: e.zIndex,
      locked: e.locked,
      props: e.props,
    }),
  );
  const mLast = mobileEls[mobileEls.length - 1];
  const mobH = Math.max(config.artboards.mobile.height, (mLast?.frame.y ?? 0) + (mLast?.frame.h ?? 0) + 64);
  return {
    ...config,
    artboards: { ...config.artboards, mobile: { ...config.artboards.mobile, height: mobH } },
    elements: [...others, ...mobileEls],
  };
}

export function createLibraryElement(
  type: CanvasElementType,
  artboard: CanvasArtboardId,
  boardW: number,
  atY = 80,
): CanvasElement {
  const pad = artboard === "mobile" ? 16 : 48;
  const w = Math.min(boardW - pad * 2, artboard === "mobile" ? 358 : 720);
  const fullW = boardW - pad * 2;
  const id = `${type}-${Date.now().toString(36)}`;
  const base = { id, type, artboard, zIndex: 50 } as const;

  switch (type) {
    case "text":
      return el({
        ...base,
        frame: { x: pad, y: atY, w, h: 64 },
        props: { text: "Novo texto", fontSize: artboard === "mobile" ? 24 : 32, fontWeight: 600, color: "#fafafa" },
      });
    case "button":
      return el({
        ...base,
        frame: { x: pad, y: atY, w: 180, h: 48 },
        props: {
          text: "Botão",
          href: "contact",
          backgroundColor: "#8f3d2b",
          color: "#fafafa",
          borderRadius: 999,
          fontWeight: 700,
        },
      });
    case "image":
    case "media":
      return el({ ...base, frame: { x: pad, y: atY, w, h: 220 }, props: { backgroundColor: "#27272a" } });
    case "rect":
      return el({
        ...base,
        frame: { x: pad, y: atY, w: fullW, h: 180 },
        props: { backgroundColor: "theme.primary", borderColor: "transparent", borderRadius: 20 },
      });
    case "navbar":
      return el({
        ...base,
        frame: { x: 0, y: 0, w: boardW, h: artboard === "mobile" ? 64 : 72 },
        props: {},
      });
    case "services":
      return el({
        ...base,
        frame: { x: pad, y: atY, w: fullW, h: artboard === "mobile" ? 480 : 360 },
        props: { title: "Serviços", gridCols: artboard === "mobile" ? 1 : 3 },
      });
    case "team":
      return el({
        ...base,
        frame: { x: pad, y: atY, w: fullW, h: artboard === "mobile" ? 720 : 420 },
        props: { title: "Equipe", gridCols: artboard === "mobile" ? 1 : 3 },
      });
    case "contact":
      return el({ ...base, frame: { x: pad, y: atY, w: fullW, h: 320 }, props: { title: "Contato" } });
    case "footer":
      return el({ ...base, frame: { x: 0, y: atY, w: boardW, h: 100 }, props: { showPitch: true } });
    case "hero":
      return el({
        ...base,
        frame: { x: 0, y: atY, w: boardW, h: artboard === "mobile" ? 420 : 520 },
        props: {
          eyebrow: "Sua marca",
          title: "Estilo e presença",
          description: "Layout livre no canvas.",
          ctaLabel: "Contato",
          href: "contact",
          backgroundColor: "#14110e",
          overlay: 0.45,
          color: "#fafafa",
        },
      });
    case "panel":
      return el({
        ...base,
        frame: { x: pad, y: atY, w: Math.min(fullW, 480), h: 200 },
        props: {
          title: "Painel",
          description: "Destaque ofertas ou avisos.",
          backgroundColor: "#18181b",
          borderColor: "#3f3f46",
          borderRadius: 20,
          padding: 24,
          color: "#fafafa",
        },
      });
    case "grid":
      return el({
        ...base,
        frame: { x: pad, y: atY, w: fullW, h: artboard === "mobile" ? 520 : 280 },
        props: {
          title: "Destaques",
          gridCols: artboard === "mobile" ? 1 : 3,
          cards: [
            { title: "Item 1", description: "Descrição", emoji: "•" },
            { title: "Item 2", description: "Descrição", emoji: "•" },
            { title: "Item 3", description: "Descrição", emoji: "•" },
          ],
          color: "#fafafa",
        },
      });
    case "divider":
      return el({ ...base, frame: { x: pad, y: atY, w: fullW, h: 24 }, props: { color: "#3f3f46", thickness: 1 } });
    case "badge":
      return el({
        ...base,
        frame: { x: pad, y: atY, w: 160, h: 36 },
        props: {
          text: "Novidade",
          backgroundColor: "#8f3d2b",
          color: "#fafafa",
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 700,
          align: "center",
        },
      });
    case "spacer":
      return el({ ...base, frame: { x: pad, y: atY, w: fullW, h: 64 }, props: { backgroundColor: "transparent" } });
    default: {
      const _e: never = type;
      void _e;
      return el({
        ...base,
        type: "text",
        frame: { x: pad, y: atY, w, h: 48 },
        props: { text: "Elemento", color: "#fafafa" },
      });
    }
  }
}
