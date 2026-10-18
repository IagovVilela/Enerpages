"use client";

import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { bgArtStyle } from "@/puck/bg-art";
import { fontAssets } from "@/puck/fonts";
import { isExternalHref, resolveActionHref } from "@/lib/action-href";
import { CanvasUpload } from "@/puck/media-upload";
import { isVideoSrc, type ImageField, type RootProps, type Theme } from "@/puck/schema";
import { cn } from "@/lib/cn";
import { visibilityClass } from "@/puck/visibility";

export { visibilityClass };

const radius = { none: "0px", sm: "2px", md: "16px", lg: "32px" };
const shadow = {
  none: "none",
  soft: "0 24px 60px color-mix(in oklab, var(--color-foreground) 14%, transparent)",
  hard: "8px 8px 0 var(--color-foreground)",
};
const spacing = { compact: "3.5rem", comfortable: "5.75rem", airy: "8rem" };

export function themeStyle(theme: Theme): CSSProperties {
  const fonts = fontAssets(theme.fonts.display, theme.fonts.body);
  const art = bgArtStyle(theme);
  return {
    "--color-background": theme.colors.background,
    "--color-foreground": theme.colors.foreground,
    "--color-primary": theme.colors.primary,
    "--color-accent": theme.colors.accent,
    "--color-muted": theme.colors.muted,
    "--color-border": theme.colors.border,
    "--radius": radius[theme.radius],
    "--shadow": shadow[theme.shadow],
    "--space-section": spacing[theme.spacing],
    "--font-display": `var(${fonts.displayVar})`,
    "--font-body": `var(${fonts.bodyVar})`,
    color: theme.colors.foreground,
    ...art,
    // Depois da arte de fundo — garante cor sólida legível sob o pattern.
    backgroundColor: theme.colors.background,
  } as CSSProperties;
}

type PageContextValue = {
  theme: Theme;
  settings: RootProps;
  editing: boolean;
};

const PageContext = createContext<PageContextValue | null>(null);

export function usePage() {
  const value = useContext(PageContext);
  if (!value) {
    throw new Error("usePage fora do tema");
  }
  return value;
}

export function ThemeProvider({
  settings,
  editing = false,
  children,
}: {
  settings: RootProps;
  editing?: boolean;
  children: ReactNode;
}) {
  const fonts = fontAssets(settings.theme.fonts.display, settings.theme.fonts.body);
  return (
    <PageContext.Provider value={{ theme: settings.theme, settings, editing }}>
      <div
        className={cn("landing min-h-screen", fonts.className)}
        data-personality={settings.theme.personality}
        data-image={settings.theme.image}
        data-button={settings.theme.button}
        style={themeStyle(settings.theme)}
      >
        <ViewBeacon slug={settings.slug} editing={editing} />
        {settings.theme.cursor === "dot" && !editing ? <DotCursor /> : null}
        {children}
        {settings.whatsapp.floating && settings.whatsapp.phone ? (
          <a
            className="fixed bottom-5 right-5 z-40 rounded-full bg-[var(--color-primary)] px-4 py-3 text-sm text-[var(--color-background)] shadow-[var(--shadow)]"
            href={resolveActionHref("", { phone: settings.whatsapp.phone, message: settings.whatsapp.message })}
            target={editing ? undefined : "_blank"}
            rel={editing ? undefined : "noreferrer"}
            onClick={(event) => {
              if (editing) event.preventDefault();
            }}
          >
            WhatsApp
          </a>
        ) : null}
      </div>
    </PageContext.Provider>
  );
}

function ViewBeacon({ slug, editing }: { slug?: string; editing: boolean }) {
  useEffect(() => {
    if (!slug || editing) return;
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, type: "view" }),
      keepalive: true,
    });
  }, [slug, editing]);
  return null;
}

function DotCursor() {
  const [point, setPoint] = useState({ x: -100, y: -100 });
  useEffect(() => {
    const move = (event: MouseEvent) => setPoint({ x: event.clientX, y: event.clientY });
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <span
      aria-hidden
      className="pointer-events-none fixed z-50 hidden h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-primary)] md:block"
      style={{ left: point.x, top: point.y }}
    />
  );
}

export function Media({
  image,
  className,
  blockId,
  path,
  zoom = 1,
  posX = 50,
  posY = 50,
}: {
  image: ImageField;
  className?: string;
  blockId?: string;
  path?: string;
  zoom?: number;
  posX?: number;
  posY?: number;
}) {
  const page = usePage();
  const crop = {
    objectPosition: `${posX}% ${posY}%`,
    transform: zoom > 1 ? `scale(${zoom})` : undefined,
    transformOrigin: `${posX}% ${posY}%`,
  } as CSSProperties;
  const empty = !image?.src || image.placeholder;
  const frame = empty ? (
    <div className="media-frame media-placeholder grid h-full min-h-48 place-items-end p-4 md:p-5">
      <span className="pointer-events-none text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-foreground)]/45">
        Foto
      </span>
    </div>
  ) : isVideoSrc(image.src) ? (
    <div className="media-frame h-full overflow-hidden">
      <video src={image.src} className="h-full w-full object-cover" style={crop} controls playsInline />
    </div>
  ) : (
    <div className="media-frame h-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.src} alt={image.alt} className="h-full w-full object-cover" style={crop} />
    </div>
  );
  return (
    <div className={cn("group relative", className)}>
      {frame}
      {page.editing && blockId && path ? <CanvasUpload blockId={blockId} path={path} current={image} /> : null}
    </div>
  );
}

export function ThemeLink({
  href,
  children,
  tone = "primary",
}: {
  href: string;
  children: ReactNode;
  tone?: "primary" | "ghost";
}) {
  const page = usePage();
  const button = page.theme.button;
  const resolved = resolveActionHref(href, {
    phone: page.settings.whatsapp.phone,
    message: page.settings.whatsapp.message,
  });
  const external = isExternalHref(resolved);
  const className = cn(
    "inline-flex items-center justify-center gap-2 text-sm transition-transform duration-200 hover:-translate-y-0.5",
    tone === "ghost" || button === "underline"
      ? "border-b border-current px-0 py-1 uppercase tracking-[0.16em]"
      : button === "outline"
        ? "border border-current px-5 py-3 rounded-[var(--radius)]"
        : button === "pill"
          ? "rounded-full bg-[var(--color-primary)] px-6 py-3 text-[var(--color-background)]"
          : "rounded-[var(--radius)] bg-[var(--color-primary)] px-5 py-3 text-[var(--color-background)] shadow-[var(--shadow)]",
  );
  return (
    <a
      className={className}
      href={resolved}
      target={external && !page.editing ? "_blank" : undefined}
      rel={external && !page.editing ? "noreferrer" : undefined}
      onClick={(event) => {
        if (page.editing) {
          // No editor, não navega — só seleciona o bloco no Puck.
          event.preventDefault();
          return;
        }
        if (!page.settings.slug) return;
        void fetch("/api/analytics", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug: page.settings.slug, type: "cta" }),
          keepalive: true,
        });
      }}
    >
      {children}
    </a>
  );
}
