"use client";

import { useEffect, useState } from "react";
import { whatsappHref } from "@/lib/action-href";
import { isCanvasVideoUrl } from "@/lib/canvas/media";
import {
  elementsForArtboard,
  type CanvasArtboardId,
  type CanvasElement,
  type SiteCanvasConfig,
} from "@/lib/canvas/site-canvas";
import { canvasThemeStyle, resolveCanvasColor } from "@/lib/canvas/theme-style";
import { cn } from "@/lib/cn";

function CanvasMediaFill({
  url,
  zoom = 1,
  posX = 50,
  posY = 50,
}: {
  url: string;
  zoom?: number;
  posX?: number;
  posY?: number;
}) {
  const z = Math.min(3, Math.max(1, zoom));
  const x = Math.min(100, Math.max(0, posX));
  const y = Math.min(100, Math.max(0, posY));
  const mediaStyle = {
    objectFit: "cover" as const,
    objectPosition: `${x}% ${y}%`,
    transform: z > 1 ? `scale(${z})` : undefined,
    transformOrigin: `${x}% ${y}%`,
  };
  if (isCanvasVideoUrl(url)) {
    return (
      <video src={url} className="h-full w-full" style={mediaStyle} autoPlay muted loop playsInline preload="metadata" />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full" style={mediaStyle} />;
}

type Ctx = {
  clientName: string;
  homeHref: string;
  contactHref: string;
  editorChrome?: boolean;
  interactive?: boolean;
};

function resolveHref(href: string | undefined, contactHref: string, homeHref: string) {
  const h = href?.trim();
  if (!h || h === "#" || h === "book" || h === "contact" || h === "whatsapp") return contactHref || "#contato";
  if (h === "home") return homeHref;
  return h;
}

export function canvasContactHref(theme: SiteCanvasConfig["theme"] | undefined) {
  const phone = theme?.whatsappPhone?.trim();
  if (!phone) return "#contato";
  return whatsappHref(phone, theme?.whatsappMessage || "") || "#contato";
}

function frameStyle(el: CanvasElement, board: { width: number; height: number }): React.CSSProperties {
  return {
    position: "absolute",
    left: `${(el.frame.x / board.width) * 100}%`,
    top: `${(el.frame.y / board.height) * 100}%`,
    width: `${(el.frame.w / board.width) * 100}%`,
    height: `${(el.frame.h / board.height) * 100}%`,
    zIndex: el.zIndex,
    opacity: el.props?.opacity ?? 1,
  };
}

export function CanvasElementView({
  element,
  board,
  ctx,
  className,
  layout = "absolute",
}: {
  element: CanvasElement;
  board: { width: number; height: number };
  ctx: Ctx;
  className?: string;
  layout?: "absolute" | "fill";
}) {
  const p = element.props ?? {};
  const style: React.CSSProperties =
    layout === "fill"
      ? { position: "relative", width: "100%", height: "100%", opacity: p.opacity ?? 1 }
      : frameStyle(element, board);

  switch (element.type) {
    case "text":
      return (
        <div
          className={cn("overflow-hidden whitespace-pre-wrap", className)}
          style={{
            ...style,
            color: resolveCanvasColor(p.color, "var(--site-text)"),
            fontSize: p.fontSize ? `${p.fontSize}px` : undefined,
            fontWeight: p.fontWeight,
            textAlign: p.align || "left",
            lineHeight: 1.25,
          }}
        >
          {p.text || ""}
        </div>
      );
    case "button": {
      const href = resolveHref(p.href, ctx.contactHref, ctx.homeHref);
      const Tag = ctx.interactive === false ? "div" : "a";
      return (
        <div className={cn(className)} style={style}>
          <Tag
            {...(Tag === "a" ? { href } : {})}
            className="flex h-full w-full items-center justify-center px-4 text-center font-semibold"
            style={{
              backgroundColor: resolveCanvasColor(p.backgroundColor, "var(--color-brand-500)"),
              color: resolveCanvasColor(p.color, "var(--site-on-primary)"),
              borderRadius: p.borderRadius ?? 999,
              fontSize: p.fontSize ?? 16,
              fontWeight: p.fontWeight ?? 700,
            }}
          >
            {p.text || "Botão"}
          </Tag>
        </div>
      );
    }
    case "rect":
      return (
        <div
          className={cn(className)}
          style={{
            ...style,
            backgroundColor: resolveCanvasColor(p.backgroundColor, "var(--site-surface)"),
            borderRadius: p.borderRadius ?? 12,
            border: p.borderColor
              ? `1px solid ${resolveCanvasColor(p.borderColor, "var(--site-secondary)")}`
              : undefined,
          }}
        />
      );
    case "image":
    case "media":
      return (
        <div
          className={cn("overflow-hidden", className)}
          style={{
            ...style,
            backgroundColor: resolveCanvasColor(p.backgroundColor, "var(--site-surface)"),
            borderRadius: p.borderRadius ?? 12,
          }}
        >
          {p.mediaUrl ? (
            <CanvasMediaFill url={p.mediaUrl} zoom={p.mediaZoom} posX={p.mediaPosX} posY={p.mediaPosY} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs opacity-50">Mídia</div>
          )}
        </div>
      );
    case "navbar":
      return (
        <div
          className={cn("flex items-center justify-between border-b border-white/10 px-4", className)}
          style={{ ...style, backgroundColor: "color-mix(in srgb, var(--site-bg) 80%, transparent)" }}
        >
          <span className="font-semibold">{p.title || ctx.clientName}</span>
          <span className="text-sm opacity-70">Menu</span>
        </div>
      );
    case "hero":
      return (
        <div
          className={cn("relative overflow-hidden", className)}
          style={{
            ...style,
            backgroundColor: resolveCanvasColor(p.backgroundColor, "var(--site-surface)"),
            color: resolveCanvasColor(p.color, "var(--site-text)"),
          }}
        >
          {p.mediaUrl ? (
            <div className="absolute inset-0">
              <CanvasMediaFill url={p.mediaUrl} zoom={p.mediaZoom} posX={p.mediaPosX} posY={p.mediaPosY} />
              <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${p.overlay ?? 0.4})` }} />
            </div>
          ) : null}
          <div className="relative z-[1] flex h-full flex-col justify-end gap-2 p-6 sm:p-10">
            {p.eyebrow ? <p className="text-xs uppercase tracking-[0.18em] opacity-80">{p.eyebrow}</p> : null}
            <h2 className="text-3xl font-semibold sm:text-5xl" style={{ fontFamily: "var(--font-display, inherit)" }}>
              {p.title || ctx.clientName}
            </h2>
            {p.description ? <p className="max-w-xl text-sm opacity-80 sm:text-base">{p.description}</p> : null}
            {p.ctaLabel ? (
              <a
                href={resolveHref(p.href, ctx.contactHref, ctx.homeHref)}
                className="mt-2 inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold"
                style={{ background: "var(--color-brand-500)", color: "var(--site-on-primary)" }}
                onClick={ctx.interactive === false ? (ev) => ev.preventDefault() : undefined}
              >
                {p.ctaLabel}
              </a>
            ) : null}
          </div>
        </div>
      );
    case "panel":
      return (
        <div
          className={cn("overflow-hidden", className)}
          style={{
            ...style,
            backgroundColor: resolveCanvasColor(p.backgroundColor, "var(--site-surface)"),
            color: resolveCanvasColor(p.color, "var(--site-text)"),
            borderRadius: p.borderRadius ?? 16,
            padding: p.padding ?? 20,
            border: p.borderColor
              ? `1px solid ${resolveCanvasColor(p.borderColor, "var(--site-secondary)")}`
              : undefined,
          }}
        >
          {p.title ? <h3 className="text-lg font-semibold">{p.title}</h3> : null}
          {p.description ? <p className="mt-2 text-sm opacity-80">{p.description}</p> : null}
        </div>
      );
    case "grid": {
      const cols = p.gridCols || 3;
      return (
        <div className={cn("overflow-auto p-3", className)} style={{ ...style, color: resolveCanvasColor(p.color, "var(--site-text)") }}>
          {p.title ? <p className="mb-3 font-semibold">{p.title}</p> : null}
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {(p.cards || []).map((card, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                {card.emoji ? <span className="mr-1">{card.emoji}</span> : null}
                <strong>{card.title}</strong>
                {card.description ? <p className="mt-1 opacity-70">{card.description}</p> : null}
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "divider":
      return (
        <div className={cn("flex items-center", className)} style={style}>
          <div
            className="w-full"
            style={{
              height: p.thickness ?? 1,
              background: resolveCanvasColor(p.color, "var(--site-secondary)"),
            }}
          />
        </div>
      );
    case "badge":
      return (
        <div
          className={cn("flex items-center justify-center text-xs font-bold uppercase tracking-wide", className)}
          style={{
            ...style,
            backgroundColor: resolveCanvasColor(p.backgroundColor, "var(--color-brand-500)"),
            color: resolveCanvasColor(p.color, "var(--site-on-primary)"),
            borderRadius: p.borderRadius ?? 999,
            fontSize: p.fontSize,
          }}
        >
          {p.text || "Selo"}
        </div>
      );
    case "spacer":
      return (
        <div
          className={cn(className)}
          style={{
            ...style,
            background:
              ctx.editorChrome
                ? "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.06) 6px, rgba(255,255,255,0.06) 12px)"
                : "transparent",
          }}
        />
      );
    case "services":
    case "team":
    case "contact":
      return (
        <div
          className={cn("overflow-hidden p-4", className)}
          style={{
            ...style,
            backgroundColor: resolveCanvasColor(p.backgroundColor, "var(--site-surface)"),
            color: resolveCanvasColor(p.color, "var(--site-text)"),
            borderRadius: 16,
          }}
        >
          <h3 className="text-lg font-semibold">{p.title || element.type}</h3>
          <p className="mt-2 text-sm opacity-70">{p.description || "Conteúdo dinâmico (placeholder)."}</p>
        </div>
      );
    case "footer":
      return (
        <div
          className={cn("flex items-center justify-between px-4 text-sm", className)}
          style={{ ...style, backgroundColor: "var(--site-surface)", color: "var(--site-text)" }}
        >
          <span>{p.title || ctx.clientName}</span>
          {p.showPitch !== false ? (
            <span className="opacity-60">
              Feito com Enerpages
              <span style={{ color: "var(--studio-accent, #9a3412)" }}>.</span>
            </span>
          ) : null}
        </div>
      );
    default: {
      const _exhaustive: never = element.type;
      void _exhaustive;
      return null;
    }
  }
}

export function TenantCanvasRenderer({
  canvas,
  clientName,
  forceArtboard,
  editorChrome,
  interactive = true,
  className,
}: {
  canvas: SiteCanvasConfig;
  clientName: string;
  forceArtboard?: CanvasArtboardId;
  editorChrome?: boolean;
  interactive?: boolean;
  className?: string;
}) {
  const [artboard, setArtboard] = useState<CanvasArtboardId>(forceArtboard || "desktop");

  useEffect(() => {
    if (forceArtboard) {
      setArtboard(forceArtboard);
      return;
    }
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setArtboard(mq.matches ? "mobile" : "desktop");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [forceArtboard]);

  const board = canvas.artboards[artboard];
  const els = elementsForArtboard(canvas, artboard);
  const ctx: Ctx = {
    clientName,
    homeHref: "/",
    contactHref: canvasContactHref(canvas.theme),
    editorChrome,
    interactive,
  };

  return (
    <div className={cn("relative w-full overflow-hidden", className)} style={canvasThemeStyle(canvas.theme)}>
      <div className="relative mx-auto w-full" style={{ aspectRatio: `${board.width} / ${board.height}`, maxWidth: board.width }}>
        {els.map((el) => (
          <CanvasElementView key={el.id} element={el} board={board} ctx={ctx} />
        ))}
      </div>
    </div>
  );
}
