import type { ReactNode } from "react";
import { MotionPreset } from "@/puck/motion";
import { layoutInnerClass, layoutSectionClass } from "@/puck/layout";
import type { Animation, Layout, PropsOf, Visibility } from "@/puck/schema";
import { Media } from "@/puck/theme";
import { visibilityClass } from "@/puck/visibility";
import { cn } from "@/lib/cn";

function readId(props: object) {
  const id = (props as { id?: unknown }).id;
  return typeof id === "string" ? id : "";
}

function Frame({
  anchor,
  visibility,
  animation,
  layout,
  className,
  children,
}: {
  anchor?: string;
  visibility: Visibility;
  animation: Animation;
  layout?: Layout;
  className?: string;
  children: ReactNode;
}) {
  // Primitives keep their own py-* defaults; only override when the user picks a non-default padding.
  const paddingOverride = layout?.paddingY && layout.paddingY !== "md" ? layoutSectionClass(layout) : null;
  return (
    <MotionPreset animation={animation}>
      <div id={anchor || undefined} className={cn("px-5 md:px-10", visibilityClass(visibility), paddingOverride, className)}>
        <div className={layoutInnerClass(layout)}>{children}</div>
      </div>
    </MotionPreset>
  );
}

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export function Text(props: PropsOf<"Text">) {
  const className = {
    display: "font-display text-[clamp(2.8rem,7vw,6rem)] leading-[0.9]",
    title: "font-display text-[clamp(1.8rem,4vw,3rem)] leading-tight",
    lead: "max-w-3xl text-2xl leading-snug md:text-4xl",
    body: "max-w-2xl text-lg leading-8",
    caption: "text-xs uppercase tracking-[0.18em]",
    eyebrow: "text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-primary)]",
  }[props.variant];
  return (
    <Frame anchor={props.anchor} visibility={props.visibility} animation={props.animation} layout={props.layout} className="py-4">
      <p className={cn(className, alignClass[props.align])} style={{ fontSize: props.variant === "display" || props.variant === "title" ? undefined : props.fontSize }}>
        {props.text}
      </p>
    </Frame>
  );
}

export function Button(props: PropsOf<"Button">) {
  const className = {
    solid: "rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-background)]",
    outline: "rounded-[var(--radius)] border-2 border-current",
    pill: "rounded-full bg-[var(--color-foreground)] text-[var(--color-background)]",
    text: "border-b border-current uppercase tracking-[0.16em]",
    ghost: "rounded-[var(--radius)] text-[var(--color-primary)]",
    soft: "rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/15 text-[var(--color-primary)]",
    square: "rounded-lg bg-[var(--color-primary)] text-[var(--color-background)]",
    inverted: "rounded-full bg-[var(--color-background)] text-[var(--color-foreground)] ring-1 ring-[var(--color-border)]",
  }[props.variant];
  return (
    <Frame anchor={props.anchor} visibility={props.visibility} animation={props.animation} layout={props.layout} className={cn("py-4", alignClass[props.align])}>
      <a className={cn("inline-flex px-5 py-3 text-sm font-semibold", props.variant === "text" ? "px-0 py-1" : null, className)} href={props.href || "#"}>
        {props.label}
      </a>
    </Frame>
  );
}

export function Badge(props: PropsOf<"Badge">) {
  const className = {
    pill: "rounded-full bg-[var(--color-primary)] px-3 py-1 text-[var(--color-background)]",
    square: "bg-[var(--color-foreground)] px-2 py-1 text-[var(--color-background)]",
    outline: "rounded-full border border-current px-3 py-1",
    tag: "bg-[var(--color-muted)] px-2 py-1 uppercase tracking-[0.14em]",
    soft: "rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1",
    alert: "rounded-md bg-amber-700 px-2 py-1 font-bold text-amber-50",
    brand: "rounded-full bg-[var(--color-primary)] px-3 py-1 font-bold text-[var(--color-background)]",
  }[props.variant];
  return (
    <Frame anchor={props.anchor} visibility={props.visibility} animation={props.animation} layout={props.layout} className={cn("py-3", alignClass[props.align])}>
      <span className={cn("inline-flex text-xs", className)}>{props.text}</span>
    </Frame>
  );
}

export function Divider(props: PropsOf<"Divider">) {
  const className = {
    line: "border-t border-[var(--color-border)]",
    thick: "border-t-4 border-[var(--color-foreground)]",
    dotted: "border-t border-dotted border-[var(--color-foreground)]",
    fade: "h-px bg-gradient-to-r from-transparent via-[var(--color-foreground)] to-transparent",
  }[props.variant];
  return (
    <Frame anchor={props.anchor} visibility={props.visibility} animation={props.animation} layout={props.layout} className="py-4">
      <div className={className} />
    </Frame>
  );
}

export function Spacer(props: PropsOf<"Spacer">) {
  const className = {
    sm: "h-6",
    md: "h-16",
    lg: "h-28",
    xl: "h-44",
  }[props.variant];
  return (
    <Frame anchor={props.anchor} visibility={props.visibility} animation={props.animation} layout={props.layout} className="!px-0 py-0">
      <div className={className} />
    </Frame>
  );
}

export function Panel(props: PropsOf<"Panel">) {
  const className = {
    card: "rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)] p-8",
    quote: "border-l-4 border-[var(--color-primary)] pl-6",
    note: "border border-dashed border-[var(--color-border)] p-6 text-sm",
    invert: "bg-[var(--color-foreground)] p-8 text-[var(--color-background)]",
    glass: "rounded-3xl border border-[var(--color-border)] bg-[var(--color-muted)]/60 p-8 backdrop-blur",
    accent: "rounded-2xl border-l-[3px] border-[var(--color-primary)] bg-[var(--color-muted)] p-8",
    flat: "rounded-2xl bg-[var(--color-muted)] p-6",
  }[props.variant];
  return (
    <Frame anchor={props.anchor} visibility={props.visibility} animation={props.animation} layout={props.layout} className="py-6">
      <article className={cn("max-w-3xl", className)}>
        <h2 className="font-display text-4xl leading-none">{props.title}</h2>
        <p className="mt-3 leading-7">{props.body}</p>
      </article>
    </Frame>
  );
}

export function CardGrid(props: PropsOf<"CardGrid">) {
  const className = {
    two: "grid gap-4 md:grid-cols-2",
    three: "grid gap-4 md:grid-cols-3",
    four: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
    list: "divide-y divide-[var(--color-border)]",
  }[props.variant];
  return (
    <Frame anchor={props.anchor} visibility={props.visibility} animation={props.animation} layout={props.layout} className="py-8">
      {props.title ? <h2 className="mb-6 font-display text-4xl">{props.title}</h2> : null}
      <div className={className}>
        {props.cards.map((card, index) => (
          <article key={`card-${index}`} className={cn("bg-[var(--color-muted)] p-5", props.variant === "list" && "bg-transparent py-4")}>
            {card.emoji ? <p className="text-2xl">{card.emoji}</p> : null}
            <h3 className="font-display text-2xl">{card.title}</h3>
            <p className="mt-2 text-sm leading-6">{card.description}</p>
          </article>
        ))}
      </div>
    </Frame>
  );
}

export function Band(props: PropsOf<"Band">) {
  const className = {
    solid: "bg-[var(--color-primary)] px-6 py-8 text-[var(--color-background)]",
    outline: "border border-[var(--color-foreground)] px-6 py-8",
    accent: "bg-[var(--color-foreground)] px-6 py-10 text-[var(--color-background)]",
    bleed: "bg-[var(--color-muted)] px-6 py-12",
    rounded: "rounded-3xl bg-[var(--color-primary)] px-6 py-8 text-[var(--color-background)]",
    surface: "rounded-2xl bg-[var(--color-muted)] px-6 py-10",
  }[props.variant];
  return (
    <Frame anchor={props.anchor} visibility={props.visibility} animation={props.animation} layout={props.layout} className={props.variant === "bleed" ? "!px-0 py-0" : "py-4"}>
      <div className={cn("flex flex-wrap items-center justify-between gap-4", className)}>
        <p className="font-display text-3xl md:text-5xl">{props.text}</p>
        {props.label ? <a className="text-sm uppercase tracking-[0.14em]" href={props.href || "#"}>{props.label}</a> : null}
      </div>
    </Frame>
  );
}

export function Picture(props: PropsOf<"Picture">) {
  const className = {
    frame: "max-w-3xl",
    bleed: "w-full",
    portrait: "max-w-sm",
    wide: "max-w-5xl",
  }[props.variant];
  return (
    <Frame anchor={props.anchor} visibility={props.visibility} animation={props.animation} layout={props.layout} className="py-6">
      <figure className={className}>
        <div className="overflow-hidden">
          <Media image={props.image} blockId={readId(props)} path="image" zoom={props.zoom} posX={props.posX} posY={props.posY} className="min-h-64" />
        </div>
        {props.caption ? <figcaption className="mt-2 text-xs uppercase tracking-[0.14em]">{props.caption}</figcaption> : null}
      </figure>
    </Frame>
  );
}

export function Clip(props: PropsOf<"Clip">) {
  const file = props.file ?? { src: "", alt: "", placeholder: true };
  const className = {
    film: "aspect-video max-w-4xl",
    square: "aspect-square max-w-xl",
    wide: "aspect-[21/9] max-w-6xl",
    caption: "aspect-video max-w-3xl",
  }[props.variant];
  const framed = <Media image={file} blockId={readId(props)} path="file" zoom={props.zoom} posX={props.posX} posY={props.posY} className="min-h-48" />;
  return (
    <Frame anchor={props.anchor} visibility={props.visibility} animation={props.animation} layout={props.layout} className="py-6">
      <figure className={className}>
        <div className="h-full overflow-hidden">{framed}</div>
        {props.caption ? <figcaption className="mt-2 text-sm">{props.caption}</figcaption> : null}
      </figure>
    </Frame>
  );
}
