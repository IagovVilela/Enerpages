"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { bgArtStyle } from "@/puck/bg-art";
import { fontAssets } from "@/puck/fonts";
import { isExternalHref, resolveActionHref } from "@/lib/action-href";
import {
  catalogFacetOptions,
  catalogItemMatches,
  EMPTY_CATALOG_QUERY,
  pruneCatalogQuery,
  type CatalogFacetKey,
  type CatalogFacets,
  type CatalogQuery,
} from "@/lib/catalog-filter";
import { CanvasUpload } from "@/puck/media-upload";
import { HERO_DOCKS, isVideoSrc, type ImageField, type RootProps, type Theme } from "@/puck/schema";
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

type CatalogFilterValue = {
  query: CatalogQuery;
  setFacet: (key: CatalogFacetKey, value: string) => void;
  options: Record<CatalogFacetKey, string[]>;
  shown: number;
  total: number;
  register: (id: string, items: CatalogFacets[]) => void;
};

const EMPTY_OPTIONS: Record<CatalogFacetKey, string[]> = { group: [], place: [], kind: [], band: [] };

const CatalogFilterContext = createContext<CatalogFilterValue>({
  query: EMPTY_CATALOG_QUERY,
  setFacet: () => {},
  options: EMPTY_OPTIONS,
  shown: 0,
  total: 0,
  register: () => {},
});

function sameFacetList(left: CatalogFacets[] | undefined, right: CatalogFacets[]) {
  if (!left || left.length !== right.length) return false;
  return left.every(
    (item, index) =>
      (item.group ?? "") === (right[index]?.group ?? "") &&
      (item.place ?? "") === (right[index]?.place ?? "") &&
      (item.kind ?? "") === (right[index]?.kind ?? "") &&
      (item.band ?? "") === (right[index]?.band ?? ""),
  );
}

function CatalogFilterProvider({ slug, children }: { slug?: string; children: ReactNode }) {
  const [query, setQuery] = useState<CatalogQuery>(EMPTY_CATALOG_QUERY);
  const [sources, setSources] = useState<Record<string, CatalogFacets[]>>({});
  useEffect(() => {
    setQuery(EMPTY_CATALOG_QUERY);
  }, [slug]);
  const register = useCallback((id: string, items: CatalogFacets[]) => {
    setSources((current) => {
      if (items.length === 0) {
        if (!(id in current)) return current;
        const next = { ...current };
        delete next[id];
        return next;
      }
      if (sameFacetList(current[id], items)) return current;
      return { ...current, [id]: items };
    });
  }, []);
  const items = useMemo(() => Object.values(sources).flat(), [sources]);
  const setFacet = useCallback((key: CatalogFacetKey, value: string) => {
    setQuery((current) => {
      if (current[key] === value) return current;
      return pruneCatalogQuery(items, { ...current, [key]: value }, key);
    });
  }, [items]);
  useEffect(() => {
    setQuery((current) => pruneCatalogQuery(items, current));
  }, [items]);
  const value = useMemo<CatalogFilterValue>(
    () => ({
      query,
      setFacet,
      options: catalogFacetOptions(items, query),
      shown: items.filter((item) => catalogItemMatches(item, query)).length,
      total: items.length,
      register,
    }),
    [items, query, register, setFacet],
  );
  return <CatalogFilterContext.Provider value={value}>{children}</CatalogFilterContext.Provider>;
}

export function useCatalogFilter() {
  return useContext(CatalogFilterContext);
}

export function EditorNote({ children }: { children: ReactNode }) {
  const page = usePage();
  if (!page.editing) return null;
  return <p className="mt-3 text-xs">{children}</p>;
}

export function MapEmpty() {
  const page = usePage();
  return (
    <div className="media-placeholder grid min-h-72 place-items-center gap-2 p-6 text-center text-sm">
      {page.editing ? (
        <>
          <p>Digite o endereço real no campo “Endereço” (à direita) para o mapa aparecer aqui.</p>
          <p className="text-xs text-[var(--color-foreground)]/55">Opcional: cole o link “Incorporar mapa” do Google Maps.</p>
        </>
      ) : (
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-foreground)]/45">Mapa</p>
      )}
    </div>
  );
}

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
      <CatalogFilterProvider slug={settings.slug}>
      <div
        className={cn("landing relative min-h-screen", fonts.className)}
        data-personality={settings.theme.personality}
        data-image={settings.theme.image}
        data-button={settings.theme.button}
        data-spacing={settings.theme.spacing}
        style={themeStyle(settings.theme)}
      >
        <ViewBeacon slug={settings.slug} editing={editing} />
        {settings.theme.progress && !editing ? <ReadingProgress /> : null}
        {!editing && (settings.theme.entrance === "curtain" || settings.theme.entrance === "wipe") ? (
          <EntranceCurtain name={brandName(settings.seo.title)} mode={settings.theme.entrance} />
        ) : null}
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
      </CatalogFilterProvider>
    </PageContext.Provider>
  );
}

function brandName(title: string) {
  const head = title.split("·")[0]?.trim();
  return head || "Bem-vindo";
}

function ReadingProgress() {
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setScale(height > 0 ? Math.min(1, window.scrollY / height) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div aria-hidden className="reading-progress" style={{ transform: `scaleX(${scale})` }} />;
}

function EntranceCurtain({ name, mode }: { name: string; mode: "curtain" | "wipe" }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"hold" | "leave" | "gone">(reduce ? "gone" : "hold");
  useEffect(() => {
    if (reduce) {
      setPhase("gone");
      return;
    }
    const leave = window.setTimeout(() => setPhase("leave"), 720);
    const gone = window.setTimeout(() => setPhase("gone"), 1680);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(gone);
    };
  }, [reduce]);
  if (phase === "gone") return null;
  return (
    <div
      aria-hidden
      className={cn(
        mode === "wipe" ? "entrance-wipe" : "entrance-curtain",
        "fixed inset-0 z-[70] grid place-items-center bg-[var(--color-foreground)] px-6 text-center text-[var(--color-background)]",
        phase === "leave" && "is-leaving",
      )}
    >
      <p className="font-display text-[clamp(2rem,6vw,4.5rem)] uppercase tracking-[0.16em]">{name}</p>
    </div>
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

const MEDIA_ASPECT = {
  auto: "",
  square: "aspect-square",
  video: "aspect-video",
  photo: "aspect-[4/5]",
  wide: "aspect-[16/10]",
  logo: "aspect-[4/3]",
} as const;

export type MediaAspect = keyof typeof MEDIA_ASPECT;

export function Media({
  image,
  className,
  blockId,
  path,
  zoom = 1,
  posX = 50,
  posY = 50,
  fit = "cover",
  aspect = "auto",
  emptyLabel = "Foto",
  kenburns = false,
}: {
  image: ImageField;
  className?: string;
  blockId?: string;
  path?: string;
  zoom?: number;
  posX?: number;
  posY?: number;
  fit?: "cover" | "contain";
  aspect?: MediaAspect;
  emptyLabel?: string;
  kenburns?: boolean;
}) {
  const page = usePage();
  const objectFit = fit === "contain" ? "object-contain" : "object-cover";
  const crop = {
    objectPosition: `${posX}% ${posY}%`,
    transform: zoom > 1 && fit === "cover" ? `scale(${zoom})` : undefined,
    transformOrigin: `${posX}% ${posY}%`,
  } as CSSProperties;
  const empty = !image?.src || image.placeholder;
  const aspectClass = MEDIA_ASPECT[aspect];
  const shell = cn(
    "group relative w-full overflow-hidden",
    aspectClass || "min-h-48",
    className,
  );
  const surface = cn(
    "media-frame absolute inset-0 overflow-hidden",
    fit === "contain" ? "bg-[var(--color-muted)]/40" : "bg-[var(--color-muted)]/20",
    kenburns && !page.editing && "hero-kenburns",
  );
  const mediaClass = cn("absolute inset-0 h-full w-full", objectFit);
  const frame = empty ? (
    <div className={cn(surface, "media-placeholder grid place-items-end p-4 md:p-5")}>
      <span className="pointer-events-none text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-foreground)]/45">
        {emptyLabel}
      </span>
    </div>
  ) : isVideoSrc(image.src) ? (
    <div className={surface}>
      <video src={image.src} className={mediaClass} style={crop} controls playsInline />
    </div>
  ) : (
    <div className={surface}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.src} alt={image.alt} className={mediaClass} style={crop} />
    </div>
  );
  return (
    <div className={shell}>
      {frame}
      {page.editing && blockId && path ? <CanvasUpload blockId={blockId} path={path} current={image} /> : null}
    </div>
  );
}

const DOCK_COPY: Record<
  (typeof HERO_DOCKS)[number],
  { tabs: string[]; fields: { key: CatalogFacetKey; label: string }[]; action: string }
> = {
  none: { tabs: [], fields: [], action: "" },
  search: {
    tabs: ["Comprar", "Alugar", "Lançamentos"],
    fields: [
      { key: "place", label: "Local" },
      { key: "kind", label: "Tipo" },
      { key: "band", label: "Faixa" },
    ],
    action: "Buscar",
  },
  reserve: {
    tabs: ["Jantar", "Almoço", "Evento"],
    fields: [
      { key: "kind", label: "Prato" },
      { key: "place", label: "Sala" },
      { key: "band", label: "Faixa" },
    ],
    action: "Reservar",
  },
  booking: {
    tabs: ["Consulta", "Retorno", "Avaliação"],
    fields: [
      { key: "kind", label: "Especialidade" },
      { key: "place", label: "Dia" },
      { key: "band", label: "Período" },
    ],
    action: "Agendar",
  },
  stay: {
    tabs: ["Suíte", "Cabana"],
    fields: [
      { key: "place", label: "Local" },
      { key: "kind", label: "Tipo" },
      { key: "band", label: "Hóspedes" },
    ],
    action: "Ver datas",
  },
};

function sameLabel(left: string, right: string) {
  return left.localeCompare(right, "pt-BR", { sensitivity: "base" }) === 0;
}

/** Barra do hero. As abas e os campos filtram o catálogo da página; o botão desce até a âncora. */
export function HeroDock({ dock = "none", href = "#contato" }: { dock?: (typeof HERO_DOCKS)[number]; href?: string }) {
  const page = usePage();
  const filter = useCatalogFilter();
  const spec = DOCK_COPY[dock] ?? DOCK_COPY.none;
  if (dock === "none" || spec.tabs.length === 0) return null;
  const tabs = filter.total > 0 ? ["Todos", ...spec.tabs] : [...spec.tabs];
  if (filter.total > 0) {
    for (const group of filter.options.group) {
      if (!tabs.some((tab) => sameLabel(tab, group))) tabs.push(group);
    }
  }
  const tabActive = (tab: string) => (tab === "Todos" ? filter.query.group.trim() === "" : sameLabel(filter.query.group, tab));
  return (
    <div className="mt-8 overflow-hidden bg-white/95 text-[#1c1915] shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap gap-px bg-[#1c1915]/10 text-[0.68rem] uppercase tracking-[0.16em]">
        {tabs.map((tab) => {
          const active = tabActive(tab);
          return (
            <button
              key={tab}
              type="button"
              data-dock-tab={tab}
              data-active={active ? "true" : "false"}
              className={cn("px-4 py-3", active ? "bg-[#c6a97e] text-[#1c1915]" : "bg-white text-[#1c1915]/70")}
              onClick={() => {
                if (filter.total === 0) {
                  if (!page.editing && href.startsWith("#")) {
                    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
                    window.history.replaceState(null, "", href);
                  }
                  return;
                }
                filter.setFacet("group", tab === "Todos" || active ? "" : tab);
              }}
            >
              {tab}
            </button>
          );
        })}
        {filter.total > 0 ? (
          <a
            className="ml-auto bg-white px-4 py-3 text-[#1c1915]/70"
            href="#catalog"
            data-dock-count={`${filter.shown}/${filter.total}`}
            onClick={(event) => {
              if (page.editing) event.preventDefault();
            }}
          >
            {filter.shown} de {filter.total}
          </a>
        ) : null}
      </div>
      <div className="grid gap-px bg-[#1c1915]/10 md:grid-cols-[1fr_1fr_1fr_auto]">
        {spec.fields.map((field) => {
          const choices = filter.options[field.key];
          const current = filter.query[field.key];
          return (
            <label key={field.key} className="bg-white px-4 py-3 text-sm">
              <span className="block text-[0.62rem] uppercase tracking-[0.16em] text-[#1c1915]/45">{field.label}</span>
              {choices.length > 0 ? (
                <select
                  aria-label={field.label}
                  data-dock-field={field.key}
                  className="mt-1 w-full appearance-none bg-transparent text-sm text-[#1c1915] outline-none"
                  value={choices.some((choice) => sameLabel(choice, current)) ? current : ""}
                  onChange={(event) => filter.setFacet(field.key, event.target.value)}
                >
                  <option value="">Qualquer</option>
                  {choices.map((choice) => (
                    <option key={choice} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="mt-1 block text-[#1c1915]/80">Qualquer</span>
              )}
            </label>
          );
        })}
        <a
          className="grid place-items-center bg-[#1c1915] px-6 py-3 text-xs uppercase tracking-[0.16em] text-white"
          href={href}
          onClick={(event) => {
            if (page.editing) event.preventDefault();
          }}
        >
          {spec.action}
        </a>
      </div>
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
