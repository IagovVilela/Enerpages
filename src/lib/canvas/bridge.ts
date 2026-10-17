import { sampleBlock } from "@/lib/ai/fallback";
import {
  createClassicCanvas,
  DESKTOP_ARTBOARD,
  MOBILE_ARTBOARD,
  type CanvasElement,
  type SiteCanvasConfig,
} from "@/lib/canvas/site-canvas";
import { blankDocument } from "@/puck/defaults";
import { pageDataSchema, SEGMENTS, type Block, type PageDocument, type Theme } from "@/puck/schema";

function el(partial: Omit<CanvasElement, "zIndex"> & { zIndex?: number }): CanvasElement {
  return { zIndex: 1, ...partial };
}

function stack(
  artboard: "desktop" | "mobile",
  boardW: number,
  items: Array<{ type: CanvasElement["type"]; h: number; props?: CanvasElement["props"] }>,
  startY = 24,
  gap = 24,
): CanvasElement[] {
  let y = startY;
  const pad = artboard === "mobile" ? 16 : 48;
  return items.map((item, i) => {
    const node = el({
      id: `${artboard}-b-${i}-${item.type}`,
      type: item.type,
      artboard,
      frame: { x: pad, y, w: Math.max(120, boardW - pad * 2), h: item.h },
      zIndex: i + 1,
      props: item.props,
    });
    y += item.h + gap;
    return node;
  });
}

function themeFromPuck(theme: Theme): SiteCanvasConfig["theme"] {
  return {
    primary: theme.colors.primary,
    secondary: theme.colors.accent,
    background: theme.colors.background,
    surface: theme.colors.muted,
    text: theme.colors.foreground,
    bgArt: theme.bgArt,
    fontDisplay: theme.fonts.display,
    fontBody: theme.fonts.body,
    radius: "md",
    motion: "subtle",
  };
}

function imageSrc(value: unknown): string {
  if (typeof value === "object" && value && "src" in value) {
    return String((value as { src?: string }).src || "");
  }
  if (typeof value === "string") return value;
  return "";
}

function puckBlockToItems(
  block: Block,
  clientName: string,
): Array<{ type: CanvasElement["type"]; h: number; props?: CanvasElement["props"] }> {
  const p = block.props as Record<string, unknown>;
  switch (block.type) {
    case "Hero":
      return [
        {
          type: "hero",
          h: 480,
          props: {
            eyebrow: String(p.eyebrow || clientName),
            title: String(p.title || clientName),
            description: String(p.subtitle || ""),
            ctaLabel: String((p.primaryCta as { label?: string } | undefined)?.label || "Contato"),
            href: "contact",
            color: "#fafafa",
            backgroundColor: "#14110e",
            overlay: 0.4,
            mediaUrl: imageSrc(p.image) || undefined,
          },
        },
      ];
    case "Text":
      return [
        {
          type: "text",
          h: 72,
          props: { text: String(p.text || ""), fontSize: 28, fontWeight: 600, color: "theme.text" },
        },
      ];
    case "Button":
      return [
        {
          type: "button",
          h: 48,
          props: {
            text: String(p.label || "Botão"),
            href: String(p.href || "contact"),
            backgroundColor: "theme.primary",
            color: "theme.onPrimary",
            borderRadius: 999,
            fontWeight: 700,
          },
        },
      ];
    case "Picture":
      return [
        {
          type: "image",
          h: 280,
          props: { mediaUrl: imageSrc(p.image) || undefined, backgroundColor: "theme.surface" },
        },
      ];
    case "Navbar":
      return [{ type: "navbar", h: 72, props: { title: clientName } }];
    case "Footer":
      return [{ type: "footer", h: 100, props: { showPitch: true, title: clientName } }];
    case "Cta":
      return [
        {
          type: "button",
          h: 56,
          props: {
            text: String(p.title || "Contato"),
            href: "contact",
            backgroundColor: "theme.primary",
            color: "theme.onPrimary",
            borderRadius: 999,
            fontWeight: 700,
          },
        },
      ];
    case "Divider":
      return [{ type: "divider", h: 24, props: { color: "theme.secondary", thickness: 1 } }];
    case "Spacer":
      return [{ type: "spacer", h: 48, props: {} }];
    case "Badge":
      return [
        {
          type: "badge",
          h: 36,
          props: {
            text: String(p.text || "Selo"),
            backgroundColor: "theme.primary",
            color: "theme.onPrimary",
            borderRadius: 999,
            fontWeight: 700,
          },
        },
      ];
    default:
      return [
        {
          type: "panel",
          h: 180,
          props: {
            title: String(p.title || block.type),
            description: String(p.body || p.subtitle || p.description || ""),
            backgroundColor: "theme.surface",
            color: "theme.text",
            padding: 24,
            borderRadius: 16,
          },
        },
      ];
  }
}

export function puckToCanvas(document: PageDocument, clientName: string): SiteCanvasConfig {
  const deskW = DESKTOP_ARTBOARD.width;
  const items = document.content.flatMap((block) => puckBlockToItems(block, clientName));
  if (items.length === 0) return createClassicCanvas(clientName);

  const desk = stack("desktop", deskW, items);
  const last = desk[desk.length - 1];
  const deskH = Math.max(DESKTOP_ARTBOARD.height, (last?.frame.y ?? 0) + (last?.frame.h ?? 0) + 80);
  const scale = MOBILE_ARTBOARD.width / deskW;
  const mob = desk.map((e, i) =>
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
  const mLast = mob[mob.length - 1];
  const mobH = Math.max(MOBILE_ARTBOARD.height, (mLast?.frame.y ?? 0) + (mLast?.frame.h ?? 0) + 64);

  return {
    version: 2,
    theme: themeFromPuck(document.root.props.theme),
    artboards: {
      desktop: { width: deskW, height: deskH },
      mobile: { width: MOBILE_ARTBOARD.width, height: mobH },
    },
    elements: [...desk, ...mob],
  };
}

function canvasElToBlock(e: CanvasElement): Block {
  const p = e.props ?? {};
  switch (e.type) {
    case "hero": {
      const base = sampleBlock("Hero");
      if (base.type !== "Hero") return base;
      return {
        ...base,
        props: {
          ...base.props,
          eyebrow: p.eyebrow || "",
          title: p.title || "",
          subtitle: p.description || "",
          primaryCta: { ...base.props.primaryCta, label: p.ctaLabel || "Contato" },
          image: { src: p.mediaUrl || "", alt: p.title || "", placeholder: !p.mediaUrl },
        },
      };
    }
    case "text": {
      const base = sampleBlock("Text");
      if (base.type !== "Text") return base;
      return { ...base, props: { ...base.props, text: p.text || "" } };
    }
    case "button": {
      const base = sampleBlock("Button");
      if (base.type !== "Button") return base;
      return { ...base, props: { ...base.props, label: p.text || "Botão", href: p.href || "#contato" } };
    }
    case "image":
    case "media": {
      const base = sampleBlock("Picture");
      if (base.type !== "Picture") return base;
      return {
        ...base,
        props: {
          ...base.props,
          image: { src: p.mediaUrl || "", alt: "", placeholder: !p.mediaUrl },
        },
      };
    }
    case "navbar":
      return sampleBlock("Navbar");
    case "footer": {
      const base = sampleBlock("Footer");
      if (base.type !== "Footer") return base;
      return { ...base, props: { ...base.props, note: p.title || base.props.note } };
    }
    case "divider":
      return sampleBlock("Divider");
    case "spacer":
      return sampleBlock("Spacer");
    case "badge": {
      const base = sampleBlock("Badge");
      if (base.type !== "Badge") return base;
      return { ...base, props: { ...base.props, text: p.text || "Selo" } };
    }
    case "panel":
    case "services":
    case "team":
    case "contact":
    case "rect":
    case "grid":
    default: {
      const base = sampleBlock("Panel");
      if (base.type !== "Panel") return base;
      return {
        ...base,
        props: {
          ...base.props,
          title: p.title || e.type,
          body: p.description || p.text || "",
        },
      };
    }
  }
}

export function canvasToPuck(canvas: SiteCanvasConfig, clientName: string, segment = "local"): PageDocument {
  const seg = SEGMENTS.find((item) => item === segment) ?? "local";
  const base = blankDocument(clientName, seg);
  const desk = canvas.elements
    .filter((e) => e.artboard === "desktop" && !e.hidden)
    .sort((a, b) => a.frame.y - b.frame.y || a.zIndex - b.zIndex);
  const content = desk.map(canvasElToBlock);
  const theme = canvas.theme;
  const next: PageDocument = {
    ...base,
    root: {
      ...base.root,
      props: {
        ...base.root.props,
        theme: {
          ...base.root.props.theme,
          colors: {
            ...base.root.props.theme.colors,
            primary: theme?.primary || base.root.props.theme.colors.primary,
            accent: theme?.secondary || base.root.props.theme.colors.accent,
            background: theme?.background || base.root.props.theme.colors.background,
            muted: theme?.surface || base.root.props.theme.colors.muted,
            foreground: theme?.text || base.root.props.theme.colors.foreground,
          },
          fonts: {
            display: (theme?.fontDisplay as Theme["fonts"]["display"]) || base.root.props.theme.fonts.display,
            body: (theme?.fontBody as Theme["fonts"]["body"]) || base.root.props.theme.fonts.body,
          },
          bgArt: (theme?.bgArt as Theme["bgArt"]) || base.root.props.theme.bgArt,
        },
        seo: { ...base.root.props.seo, title: clientName },
      },
    },
    content: content.length ? content : base.content,
  };
  const parsed = pageDataSchema.safeParse(next);
  return parsed.success ? parsed.data : base;
}
