"use client";

import { useEffect, useId, type ReactNode } from "react";
import { MotionPreset } from "@/puck/motion";
import { layoutInnerClass, layoutSectionClass, layoutSectionStyle } from "@/puck/layout";
import type { Animation, Layout, PropsOf } from "@/puck/schema";
import { catalogItemMatches, catalogQueryActive } from "@/lib/catalog-filter";
import { Media, useCatalogFilter } from "@/puck/theme";
import { visibilityClass } from "@/puck/visibility";
import { cn } from "@/lib/cn";

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function Section({
  anchor,
  visibility,
  layout,
  children,
}: {
  anchor?: string;
  visibility: { desktop: boolean; tablet: boolean; mobile: boolean };
  layout?: Layout;
  children: ReactNode;
}) {
  return (
    <section
      id={anchor || undefined}
      className={cn("px-5 md:px-10", visibilityClass(visibility), layoutSectionClass(layout))}
      style={layoutSectionStyle(layout)}
    >
      <div className={layoutInnerClass(layout)}>{children}</div>
    </section>
  );
}

function FacetLine({ item }: { item: { place?: string; kind?: string } }) {
  const line = [item.place, item.kind].map((part) => asText(part).trim()).filter(Boolean).join(" · ");
  if (!line) return null;
  return <p className="mt-1 text-xs uppercase tracking-[0.14em] opacity-60">{line}</p>;
}

export function CatalogBoard({
  items,
  variant,
  blockId,
  eyebrow,
  title,
  anchor,
  visibility,
  layout,
  animation,
}: {
  items: PropsOf<"Catalog">["items"];
  variant: PropsOf<"Catalog">["variant"];
  blockId: string;
  eyebrow: string;
  title: string;
  anchor?: string;
  visibility: PropsOf<"Catalog">["visibility"];
  layout?: Layout;
  animation: Animation;
}) {
  const reactId = useId();
  const filter = useCatalogFilter();
  const { register } = filter;
  const signature = items.map((item) => [item.group, item.place, item.kind, item.band].join("|")).join("\n");
  useEffect(() => {
    const sourceId = blockId || reactId;
    register(
      sourceId,
      items.map((item) => ({ group: item.group, place: item.place, kind: item.kind, band: item.band })),
    );
    return () => register(sourceId, []);
    // A assinatura resume as facetas; items entra só na execução em que ela muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, blockId, reactId, signature]);
  const visible = items.map((item, index) => ({ item, index })).filter(({ item }) => catalogItemMatches(item, filter.query));
  const filtering = catalogQueryActive(filter.query);
  const cards = visible.map(({ item, index }) => (
    <article key={`catalog-${index}`} data-catalog-item={asText(item.title)} className="group">
      <Media image={item.image} blockId={blockId} path={`items[${index}].image`} className="min-h-64 transition-transform duration-300 group-hover:-rotate-1" />
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-2xl">{asText(item.title)}</h3>
        <span>{asText(item.price)}</span>
      </div>
      <FacetLine item={item} />
      <p className="mt-1 text-sm">{asText(item.description)}</p>
    </article>
  ));
  const body =
    visible.length === 0 ? (
      <p data-catalog-empty className="text-sm">
        Nenhum item com esses filtros.
      </p>
    ) : (
      {
        shelf: <div className="grid gap-8 md:grid-cols-3">{cards}</div>,
        lookbook: (
          <div className="grid gap-10">
            {visible.map(({ item, index }) => (
              <article
                key={`catalog-${index}`}
                data-catalog-item={asText(item.title)}
                className={cn("grid items-center gap-6 md:grid-cols-2", index % 2 === 1 && "md:[&>*:first-child]:order-2")}
              >
                <Media image={item.image} blockId={blockId} path={`items[${index}].image`} className="min-h-80" />
                <div>
                  <p className="text-xs uppercase tracking-[0.16em]">{asText(item.price)}</p>
                  <h3 className="mt-2 font-display text-5xl">{asText(item.title)}</h3>
                  <FacetLine item={item} />
                  <p className="mt-3 max-w-sm">{asText(item.description)}</p>
                </div>
              </article>
            ))}
          </div>
        ),
        rows: (
          <div className="divide-y divide-[var(--color-border)]">
            {visible.map(({ item, index }) => (
              <article key={`catalog-${index}`} data-catalog-item={asText(item.title)} className="grid items-center gap-4 py-4 md:grid-cols-[8rem_1fr_auto]">
                <Media image={item.image} blockId={blockId} path={`items[${index}].image`} className="min-h-24" />
                <div>
                  <h3 className="font-display text-2xl">{asText(item.title)}</h3>
                  <FacetLine item={item} />
                  <p className="text-sm">{asText(item.description)}</p>
                </div>
                <strong>{asText(item.price)}</strong>
              </article>
            ))}
          </div>
        ),
        mosaic: (
          <div className="columns-1 gap-4 md:columns-3">
            {visible.map(({ item, index }) => (
              <article key={`catalog-${index}`} data-catalog-item={asText(item.title)} className="mb-4 break-inside-avoid">
                <Media image={item.image} blockId={blockId} path={`items[${index}].image`} className="min-h-40" />
                <h3 className="mt-2 font-display text-2xl">{asText(item.title)}</h3>
                <FacetLine item={item} />
              </article>
            ))}
          </div>
        ),
      }[variant]
    );
  return (
    <MotionPreset animation={animation}>
      <Section anchor={anchor} visibility={visibility} layout={layout}>
        <p className="text-xs uppercase tracking-[0.18em]">{eyebrow}</p>
        <h2 className="mb-8 mt-3 font-display text-5xl md:text-7xl">{title}</h2>
        {filtering ? (
          <p className="mb-6 text-xs uppercase tracking-[0.16em]">
            {visible.length} de {items.length}
          </p>
        ) : null}
        {body}
      </Section>
    </MotionPreset>
  );
}
