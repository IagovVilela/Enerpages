import type { ReactNode } from "react";
import { BeforeAfterBoard, ContactForm, FaqList, GalleryBoard, WhatsAppAnchor } from "@/puck/interactive";
import { Counter, MotionPreset, SplitText } from "@/puck/motion";
import { layoutInnerClass, layoutSectionClass, layoutSectionStyle } from "@/puck/layout";
import type { Animation, Layout, PropsOf } from "@/puck/schema";
import { Media, ThemeLink } from "@/puck/theme";
import { visibilityClass } from "@/puck/visibility";
import { cn } from "@/lib/cn";

function readId(props: object) {
  const id = (props as { id?: unknown }).id;
  return typeof id === "string" ? id : "";
}

/** Coerce AI/fallback values that sometimes arrive as nested objects. */
function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(" ");
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["text", "title", "label", "value", "name", "description", "body", "quote"]) {
      if (key in record) return asText(record[key]);
    }
  }
  return "";
}

function Section({
  anchor,
  visibility,
  layout,
  className,
  children,
}: {
  anchor?: string;
  visibility: { desktop: boolean; tablet: boolean; mobile: boolean };
  layout?: Layout;
  className?: string;
  children: ReactNode;
}) {
  const hasExplicitPy = Boolean(className && /\b!?py-/.test(className));
  return (
    <section
      id={anchor || undefined}
      className={cn("px-5 md:px-10", visibilityClass(visibility), hasExplicitPy ? null : layoutSectionClass(layout), className)}
      style={hasExplicitPy ? undefined : layoutSectionStyle(layout)}
    >
      <div className={layoutInnerClass(layout)}>{children}</div>
    </section>
  );
}

function Heading({ text, animation, className }: { text: string; animation: Animation; className?: string }) {
  if (animation.preset === "split-words" || animation.preset === "split-chars") {
    return <SplitText text={text} mode={animation.preset === "split-words" ? "words" : "chars"} className={className} />;
  }
  return <span className={className}>{text}</span>;
}

function Shell({ animation, preserveLcp, className, children }: { animation: Animation; preserveLcp?: boolean; className?: string; children: ReactNode }) {
  return (
    <MotionPreset animation={animation} preserveLcp={preserveLcp} className={className}>
      {children}
    </MotionPreset>
  );
}

export function Navbar(props: PropsOf<"Navbar">) {
  const links = (
    <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm uppercase tracking-[0.14em]">
      {props.links.map((link, index) => (
        <a key={`nav-${index}`} href={link.href}>{asText(link.label)}</a>
      ))}
    </nav>
  );
  const body = {
    bar: <div className="flex items-center justify-between gap-6"><strong className="font-display text-2xl">{props.logo}</strong>{links}{props.cta.label ? <ThemeLink href={props.cta.href}>{props.cta.label}</ThemeLink> : null}</div>,
    centered: <div className="grid justify-items-center gap-4 text-center"><strong className="font-display text-4xl">{props.logo}</strong>{links}</div>,
    split: <div className="grid items-end gap-6 md:grid-cols-[1fr_auto_1fr]"><strong className="font-display text-3xl">{props.logo}</strong>{links}<div className="md:justify-self-end">{props.cta.label ? <ThemeLink href={props.cta.href}>{props.cta.label}</ThemeLink> : null}</div></div>,
    minimal: <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-4"><span className="text-xs uppercase tracking-[0.22em]">{props.logo}</span>{props.cta.label ? <a href={props.cta.href}>{props.cta.label}</a> : null}</div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} layout={props.layout} className="!py-6">{body}</Section></Shell>;
}

export function Hero(props: PropsOf<"Hero">) {
  const id = readId(props);
  /** cqw (não vw): mesma escala no canvas do Puck e no site publicado. */
  const title = (
    <h1 className="font-display text-[clamp(2.5rem,7.2cqw,5.75rem)] leading-[0.92] tracking-[-0.03em] text-balance">
      <Heading text={props.title} animation={props.animation} />
    </h1>
  );
  const ctas = (
    <div className="flex flex-wrap gap-4">
      {props.primaryCta.label ? <ThemeLink href={props.primaryCta.href}>{props.primaryCta.label}</ThemeLink> : null}
      {props.secondaryCta.label ? <ThemeLink href={props.secondaryCta.href} tone="ghost">{props.secondaryCta.label}</ThemeLink> : null}
    </div>
  );
  const copy = (
    <div className="max-w-xl space-y-5">
      <p className="eyebrow text-xs uppercase tracking-[0.2em] text-[var(--color-primary)]">{props.eyebrow}</p>
      {title}
      <p className="max-w-md text-lg leading-relaxed">{props.subtitle}</p>
      {ctas}
    </div>
  );
  const immersive = <div className="relative grid min-h-[88svh] items-end"><Media image={props.image} blockId={id} path="image" className="absolute inset-0 min-h-full" /><div className="relative max-w-3xl bg-[var(--color-background)]/88 p-6 md:p-10">{copy}</div></div>;
  const body = {
    split: <div className="grid items-end gap-10 lg:grid-cols-12"><div className="lg:col-span-7">{copy}</div><Media image={props.image} blockId={id} path="image" className="min-h-[28rem] lg:col-span-5" /></div>,
    editorial: (
      <div className="grid min-h-[min(88svh,52rem)] items-end gap-10 md:grid-cols-12">
        <div className="space-y-5 md:col-span-7">
          <p className="eyebrow text-xs uppercase tracking-[0.2em] text-[var(--color-primary)]">{props.eyebrow}</p>
          {title}
          <p className="max-w-md text-lg leading-relaxed">{props.subtitle}</p>
          {ctas}
        </div>
        <Media image={props.image} blockId={id} path="image" className="min-h-72 md:col-span-5 md:min-h-[28rem]" />
      </div>
    ),
    immersive,
    asymmetric: <div className="grid gap-8 md:grid-cols-[auto_1fr]"><p className="text-xs uppercase tracking-[0.28em] md:[writing-mode:vertical-rl]">{props.eyebrow}</p><div className="md:ml-[min(8cqw,4rem)]">{copy}<div className="mt-8 md:w-2/3 md:justify-self-end"><Media image={props.image} blockId={id} path="image" className="min-h-72" /></div></div></div>,
    cinematic: <div className="relative grid min-h-[88svh] items-end bg-[#0f1419] text-[#fafafa]"><Media image={props.image} blockId={id} path="image" className="absolute inset-0 min-h-full opacity-70" /><div className="relative max-w-3xl bg-black/55 p-6 md:p-10">{copy}</div></div>,
    light: (
      <div className="relative grid min-h-[min(88svh,48rem)] items-end gap-8 bg-[#f5f0e8] text-[#1c1917] md:grid-cols-12 md:gap-10">
        <div className="relative max-w-3xl p-6 md:col-span-7 md:p-10">{copy}</div>
        <Media image={props.image} blockId={id} path="image" className="min-h-72 md:col-span-5 md:min-h-[28rem]" />
      </div>
    ),
    brand: <div className="relative grid min-h-[80svh] items-end bg-[var(--color-primary)] text-[var(--color-background)]"><Media image={props.image} blockId={id} path="image" className="absolute inset-0 min-h-full opacity-40" /><div className="relative max-w-3xl p-6 md:p-10">{copy}</div></div>,
  }[props.variant];
  return <Shell animation={{ ...props.animation, preset: "none" }} preserveLcp><Section anchor={props.anchor || "topo"} visibility={props.visibility} layout={props.layout}>{body}</Section></Shell>;
}

export function About(props: PropsOf<"About">) {
  const id = readId(props);
  const points = props.points.map((point, index) => (
    <div key={`point-${index}`}>
      <h3 className="font-display text-2xl">{asText(point.title)}</h3>
      <p className="mt-2 text-sm leading-6">{asText(point.description)}</p>
    </div>
  ));
  const body = {
    columns: (
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <p className="eyebrow text-xs uppercase tracking-[0.18em]">{props.eyebrow}</p>
          <h2 className="mt-3 font-display text-5xl leading-none md:text-7xl">
            <Heading text={props.title} animation={props.animation} />
          </h2>
          <p className="mt-6 max-w-prose text-lg leading-8">{props.body}</p>
          {points.length ? <div className="mt-8 grid gap-6">{points}</div> : null}
        </div>
        <Media image={props.image} blockId={id} path="image" className="min-h-96" />
      </div>
    ),
    overlap: (
      <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
        <Media image={props.image} blockId={id} path="image" className="min-h-96" />
        <div className="bg-[var(--color-muted)] p-8 md:-ml-16 md:mt-16">
          <h2 className="font-display text-5xl leading-none">{props.title}</h2>
          <p className="mt-4 leading-7">{props.body}</p>
        </div>
      </div>
    ),
    manifesto: (
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div className="max-w-5xl">
          <p className="text-xs uppercase tracking-[0.2em]">{props.eyebrow}</p>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,6.5cqw,5.25rem)] leading-[0.9] text-balance">{props.title}</h2>
          <p className="mt-8 max-w-2xl text-xl leading-9">{props.body}</p>
        </div>
        <Media image={props.image} blockId={id} path="image" className="min-h-80" />
      </div>
    ),
    sidebar: (
      <div className="grid gap-10 border-y border-[var(--color-border)] py-10 md:grid-cols-[12rem_1fr_minmax(14rem,22rem)] md:items-start">
        <p className="text-xs uppercase tracking-[0.16em]">{props.eyebrow}</p>
        <div>
          <h2 className="font-display text-5xl">{props.title}</h2>
          <p className="mt-4 max-w-prose leading-7">{props.body}</p>
          {points.length ? <div className="mt-8 grid gap-4 md:grid-cols-3">{points}</div> : null}
        </div>
        <Media image={props.image} blockId={id} path="image" className="min-h-72" />
      </div>
    ),
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor || "about"} visibility={props.visibility} layout={props.layout}>{body}</Section></Shell>;
}

export function Services(props: PropsOf<"Services">) {
  const items = props.items.map((item, index) => (
    <article key={`service-${index}`} className="border-t border-[var(--color-border)] py-6">
      <div className="flex items-baseline justify-between gap-4"><h3 className="font-display text-3xl">{asText(item.title)}</h3><span className="text-xs tabular-nums">0{index + 1}</span></div>
      <p className="mt-3 max-w-md text-sm leading-6">{asText(item.description)}</p>
    </article>
  ));
  const body = {
    grid: (
      <div className="grid gap-px bg-[var(--color-border)] md:grid-cols-3">
        {props.items.map((item, index) => (
          <article key={`service-${index}`} className="bg-[var(--color-background)] p-6">
            <h3 className="font-display text-3xl">{asText(item.title)}</h3>
            <p className="mt-3 text-sm leading-6">{asText(item.description)}</p>
          </article>
        ))}
      </div>
    ),
    list: <div>{items}</div>,
    bento: (
      <div className="grid gap-4 md:grid-cols-6">
        {props.items.map((item, index) => (
          <article key={`service-${index}`} className={cn("bg-[var(--color-muted)] p-6", index === 0 ? "md:col-span-4 md:row-span-2" : "md:col-span-2")}>
            <h3 className="font-display text-3xl">{asText(item.title)}</h3>
            <p className="mt-3 text-sm">{asText(item.description)}</p>
          </article>
        ))}
      </div>
    ),
    index: (
      <ol className="divide-y divide-[var(--color-border)]">
        {props.items.map((item, index) => (
          <li key={`service-${index}`} className="grid gap-3 py-5 md:grid-cols-[4rem_1fr_1.2fr]">
            <span className="font-display text-3xl">{index + 1}</span>
            <h3 className="text-xl">{asText(item.title)}</h3>
            <p>{asText(item.description)}</p>
          </li>
        ))}
      </ol>
    ),
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor || "services"} visibility={props.visibility} layout={props.layout}><p className="text-xs uppercase tracking-[0.18em]">{props.eyebrow}</p><h2 className="mb-8 mt-3 max-w-3xl font-display text-5xl leading-none md:text-7xl">{props.title}</h2>{body}</Section></Shell>;
}

export function Catalog(props: PropsOf<"Catalog">) {
  const id = readId(props);
  const cards = props.items.map((item, index) => (
    <article key={`catalog-${index}`} className="group">
      <Media image={item.image} blockId={id} path={`items[${index}].image`} className="min-h-64 transition-transform duration-300 group-hover:-rotate-1" />
      <div className="mt-3 flex items-baseline justify-between gap-3"><h3 className="font-display text-2xl">{asText(item.title)}</h3><span>{asText(item.price)}</span></div>
      <p className="mt-1 text-sm">{asText(item.description)}</p>
    </article>
  ));
  const body = {
    shelf: <div className="grid gap-8 md:grid-cols-3">{cards}</div>,
    lookbook: (
      <div className="grid gap-10">
        {props.items.map((item, index) => (
          <article key={`catalog-${index}`} className={cn("grid items-center gap-6 md:grid-cols-2", index % 2 === 1 && "md:[&>*:first-child]:order-2")}>
            <Media image={item.image} blockId={id} path={`items[${index}].image`} className="min-h-80" />
            <div>
              <p className="text-xs uppercase tracking-[0.16em]">{asText(item.price)}</p>
              <h3 className="mt-2 font-display text-5xl">{asText(item.title)}</h3>
              <p className="mt-3 max-w-sm">{asText(item.description)}</p>
            </div>
          </article>
        ))}
      </div>
    ),
    rows: (
      <div className="divide-y divide-[var(--color-border)]">
        {props.items.map((item, index) => (
          <article key={`catalog-${index}`} className="grid items-center gap-4 py-4 md:grid-cols-[8rem_1fr_auto]">
            <Media image={item.image} blockId={id} path={`items[${index}].image`} className="min-h-24" />
            <div>
              <h3 className="font-display text-2xl">{asText(item.title)}</h3>
              <p className="text-sm">{asText(item.description)}</p>
            </div>
            <strong>{asText(item.price)}</strong>
          </article>
        ))}
      </div>
    ),
    mosaic: (
      <div className="columns-1 gap-4 md:columns-3">
        {props.items.map((item, index) => (
          <article key={`catalog-${index}`} className="mb-4 break-inside-avoid">
            <Media image={item.image} blockId={id} path={`items[${index}].image`} className="min-h-40" />
            <h3 className="mt-2 font-display text-2xl">{asText(item.title)}</h3>
          </article>
        ))}
      </div>
    ),
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} layout={props.layout}><p className="text-xs uppercase tracking-[0.18em]">{props.eyebrow}</p><h2 className="mb-8 mt-3 font-display text-5xl md:text-7xl">{props.title}</h2>{body}</Section></Shell>;
}

export function Gallery(props: PropsOf<"Gallery">) {
  return (
    <Shell animation={props.animation}>
      <Section anchor={props.anchor} visibility={props.visibility} layout={props.layout}>
        <h2 className="mb-4 font-display text-5xl">{props.title}</h2>
        <GalleryBoard variant={props.variant} images={props.images} blockId={readId(props)} />
      </Section>
    </Shell>
  );
}

export function Testimonials(props: PropsOf<"Testimonials">) {
  const id = readId(props);
  const card = (item: PropsOf<"Testimonials">["items"][number], index: number) => (
    <blockquote key={`testimonial-${index}`} className="border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] p-6">
      <Media image={item.image} blockId={id} path={`items[${index}].image`} className="mb-4 min-h-32" />
      <p className="text-lg leading-8">“{asText(item.quote)}”</p>
      <footer className="mt-4 text-xs uppercase tracking-[0.16em]">{asText(item.name)} · {asText(item.role)}</footer>
      <p className="mt-3 text-xs">Placeholder: substitua por um depoimento real.</p>
    </blockquote>
  );
  const body = {
    quotes: <div className="grid gap-4 md:grid-cols-2">{props.items.map(card)}</div>,
    large: <div className="max-w-4xl">{props.items[0] ? <><Media image={props.items[0].image} blockId={id} path="items[0].image" className="mb-6 min-h-40" /><blockquote className="font-display text-4xl leading-tight md:text-6xl">“{props.items[0].quote}”</blockquote></> : null}</div>,
    cards: <div className="grid gap-4 md:grid-cols-3">{props.items.map(card)}</div>,
    single: <div className="max-w-2xl">{props.items[0] ? card(props.items[0], 0) : null}</div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} layout={props.layout}><h2 className="mb-6 font-display text-4xl">{props.title}</h2>{body}</Section></Shell>;
}

export function Stats(props: PropsOf<"Stats">) {
  const cells = props.items.map((item, index) => (
    <div key={`stat-${index}`}>
      <p className="font-display text-5xl md:text-7xl"><Counter value={asText(item.value)} /></p>
      <p className="mt-2 text-sm uppercase tracking-[0.14em]">{asText(item.label)}</p>
    </div>
  ));
  const body = {
    row: <div className="grid gap-8 md:grid-cols-3">{cells}</div>,
    split: <div className="grid items-end gap-8 md:grid-cols-[1fr_1.4fr]"><h2 className="font-display text-5xl">{props.title}</h2><div className="grid gap-6">{cells}</div></div>,
    band: <div className="bg-[var(--color-foreground)] px-6 py-10 text-[var(--color-background)]"><div className="grid gap-6 md:grid-cols-3">{cells}</div></div>,
    stacked: <div className="space-y-6">{cells}</div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} layout={props.layout}>{props.variant === "split" ? null : <h2 className="mb-8 font-display text-4xl">{props.title}</h2>}{body}</Section></Shell>;
}

export function Process(props: PropsOf<"Process">) {
  const body = {
    steps: (
      <div className="grid gap-6 md:grid-cols-3">
        {props.items.map((item, index) => (
          <article key={`process-${index}`}>
            <span className="font-display text-5xl text-[var(--color-primary)]">0{index + 1}</span>
            <h3 className="mt-3 text-2xl">{asText(item.title)}</h3>
            <p className="mt-2 text-sm leading-6">{asText(item.description)}</p>
          </article>
        ))}
      </div>
    ),
    timeline: (
      <div className="space-y-6 border-l border-[var(--color-border)] pl-6">
        {props.items.map((item, index) => (
          <article key={`process-${index}`}>
            <h3 className="text-2xl">{asText(item.title)}</h3>
            <p className="text-sm">{asText(item.description)}</p>
          </article>
        ))}
      </div>
    ),
    numbered: (
      <ol className="space-y-2">
        {props.items.map((item, index) => (
          <li key={`process-${index}`} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-[var(--color-border)] py-4">
            <span>0{index + 1}</span>
            <div>
              <h3>{asText(item.title)}</h3>
              <p className="text-sm">{asText(item.description)}</p>
            </div>
          </li>
        ))}
      </ol>
    ),
    horizontal: (
      <div className="flex gap-4 overflow-x-auto">
        {props.items.map((item, index) => (
          <article key={`process-${index}`} className="min-w-64 bg-[var(--color-muted)] p-5">
            <h3 className="font-display text-3xl">{asText(item.title)}</h3>
            <p className="mt-2 text-sm">{asText(item.description)}</p>
          </article>
        ))}
      </div>
    ),
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} layout={props.layout}><h2 className="mb-8 font-display text-5xl">{props.title}</h2>{body}</Section></Shell>;
}

export function Pricing(props: PropsOf<"Pricing">) {
  const plans = props.plans.map((plan, index) => (
    <article key={`plan-${index}`} className={cn("flex flex-col gap-4 p-6", plan.featured ? "bg-[var(--color-foreground)] text-[var(--color-background)]" : "border border-[var(--color-border)]")}>
      <h3 className="font-display text-3xl">{asText(plan.name)}</h3>
      <p className="text-3xl">{asText(plan.price)}</p>
      <p className="text-sm">{asText(plan.description)}</p>
      <ul className="space-y-1 text-sm">
        {asText(plan.features)
          .split("\n")
          .filter(Boolean)
          .map((feature, featureIndex) => (
            <li key={`plan-${index}-f-${featureIndex}`}>{feature}</li>
          ))}
      </ul>
      {plan.cta.label ? <ThemeLink href={plan.cta.href}>{asText(plan.cta.label)}</ThemeLink> : null}
    </article>
  ));
  const body = {
    trio: <div className="grid gap-4 md:grid-cols-3">{plans}</div>,
    highlight: <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">{plans}</div>,
    table: (
      <div className="divide-y divide-[var(--color-border)]">
        {props.plans.map((plan, index) => (
          <div key={`plan-${index}`} className="grid gap-3 py-4 md:grid-cols-4">
            <strong>{asText(plan.name)}</strong>
            <span>{asText(plan.price)}</span>
            <span>{asText(plan.description)}</span>
            {plan.cta.label ? <ThemeLink href={plan.cta.href}>{asText(plan.cta.label)}</ThemeLink> : null}
          </div>
        ))}
      </div>
    ),
    stacked: <div className="mx-auto grid max-w-xl gap-4">{plans}</div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} layout={props.layout}><h2 className="mb-8 font-display text-5xl">{props.title}</h2>{body}</Section></Shell>;
}

export function Faq(props: PropsOf<"Faq">) {
  return (
    <Shell animation={props.animation}>
      <Section anchor={props.anchor} visibility={props.visibility} layout={props.layout}>
        <h2 className="mb-6 font-display text-5xl">{props.title}</h2>
        <FaqList variant={props.variant} items={props.items} />
      </Section>
    </Shell>
  );
}

export function Team(props: PropsOf<"Team">) {
  const id = readId(props);
  const people = props.people.map((person, index) => (
    <article key={`person-${index}`}>
      <Media image={person.image} blockId={id} path={`people[${index}].image`} className="min-h-64" />
      <h3 className="mt-3 font-display text-3xl">{asText(person.title)}</h3>
      <p className="text-xs uppercase tracking-[0.14em]">{asText(person.role)}</p>
      <p className="mt-2 text-sm">{asText(person.description)}</p>
    </article>
  ));
  const body = {
    portraits: <div className="grid gap-6 md:grid-cols-3">{people}</div>,
    list: (
      <div className="divide-y divide-[var(--color-border)]">
        {props.people.map((person, index) => (
          <article key={`person-${index}`} className="grid items-center gap-4 py-4 md:grid-cols-[8rem_1fr]">
            <Media image={person.image} blockId={id} path={`people[${index}].image`} className="min-h-24" />
            <div>
              <h3 className="text-2xl">{asText(person.title)}</h3>
              <p className="text-sm">{asText(person.role)}</p>
            </div>
          </article>
        ))}
      </div>
    ),
    offset: (
      <div className="grid gap-6 md:grid-cols-2">
        {props.people.map((person, index) => (
          <article key={`person-${index}`} className={index % 2 ? "md:mt-16" : ""}>
            <Media image={person.image} blockId={id} path={`people[${index}].image`} className="min-h-72" />
            <h3 className="mt-3 font-display text-4xl">{asText(person.title)}</h3>
          </article>
        ))}
      </div>
    ),
    compact: (
      <ul className="flex flex-wrap gap-x-8 gap-y-3">
        {props.people.map((person, index) => (
          <li key={`person-${index}`}>
            <strong>{asText(person.title)}</strong> <span className="text-sm">{asText(person.role)}</span>
          </li>
        ))}
      </ul>
    ),
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} layout={props.layout}><h2 className="mb-8 font-display text-5xl">{props.title}</h2>{body}</Section></Shell>;
}

export function Timeline(props: PropsOf<"Timeline">) {
  const body = {
    vertical: (
      <div className="space-y-8 border-l border-[var(--color-border)] pl-6">
        {props.events.map((event, index) => (
          <article key={`event-${index}`}>
            <p className="text-xs uppercase tracking-[0.16em]">{asText(event.year)}</p>
            <h3 className="font-display text-3xl">{asText(event.title)}</h3>
            <p className="text-sm">{asText(event.description)}</p>
          </article>
        ))}
      </div>
    ),
    alternating: (
      <div className="space-y-8">
        {props.events.map((event, index) => (
          <article key={`event-${index}`} className={cn("max-w-md", index % 2 === 1 && "md:ml-auto md:text-right")}>
            <p>{asText(event.year)}</p>
            <h3 className="font-display text-4xl">{asText(event.title)}</h3>
            <p>{asText(event.description)}</p>
          </article>
        ))}
      </div>
    ),
    years: (
      <div className="flex gap-6 overflow-x-auto">
        {props.events.map((event, index) => (
          <article key={`event-${index}`} className="min-w-56">
            <p className="font-display text-5xl">{asText(event.year)}</p>
            <h3 className="mt-2">{asText(event.title)}</h3>
            <p className="text-sm">{asText(event.description)}</p>
          </article>
        ))}
      </div>
    ),
    compact: (
      <ul>
        {props.events.map((event, index) => (
          <li key={`event-${index}`} className="grid grid-cols-[6rem_1fr] gap-4 border-b border-[var(--color-border)] py-3">
            <span>{asText(event.year)}</span>
            <span>{asText(event.title)}</span>
          </li>
        ))}
      </ul>
    ),
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} layout={props.layout}><h2 className="mb-8 font-display text-5xl">{props.title}</h2>{body}</Section></Shell>;
}

export function MapBlock(props: PropsOf<"Map">) {
  const map = props.embedUrl ? <iframe title={props.title} src={props.embedUrl} className="min-h-72 w-full border-0" loading="lazy" /> : <div className="media-placeholder grid min-h-72 place-items-center text-sm">Mapa após informar o endereço</div>;
  const copy = <div><h2 className="font-display text-5xl">{props.title}</h2><p className="mt-4 text-lg">{props.address}</p><p className="mt-2 text-sm">{props.note}</p></div>;
  const body = {
    split: <div className="grid gap-8 md:grid-cols-2">{copy}{map}</div>,
    stacked: <div className="space-y-6">{copy}{map}</div>,
    card: <div className="mx-auto max-w-xl bg-[var(--color-muted)] p-6">{copy}</div>,
    banner: <div className="bg-[var(--color-foreground)] p-8 text-[var(--color-background)]">{copy}</div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} layout={props.layout}>{body}</Section></Shell>;
}

export function Contact(props: PropsOf<"Contact">) {
  const form = <ContactForm submitLabel={props.submitLabel} />;
  const copy = <div><h2 className="font-display text-5xl">{props.title}</h2><p className="mt-4 max-w-md leading-7">{props.subtitle}</p></div>;
  const body = {
    split: <div className="grid gap-10 md:grid-cols-2">{copy}{form}</div>,
    stacked: <div className="mx-auto grid max-w-xl gap-6">{copy}{form}</div>,
    panel: <div className="grid gap-8 bg-[var(--color-muted)] p-6 md:grid-cols-[0.8fr_1.2fr] md:p-10">{copy}{form}</div>,
    minimal: <div className="grid gap-6 border-t border-[var(--color-foreground)] pt-8 md:grid-cols-[1fr_1fr]">{copy}{form}</div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor="contato" visibility={props.visibility} layout={props.layout}>{body}</Section></Shell>;
}

export function Cta(props: PropsOf<"Cta">) {
  const action = props.cta.label ? <ThemeLink href={props.cta.href}>{props.cta.label}</ThemeLink> : null;
  const body = {
    band: <div className="flex flex-wrap items-end justify-between gap-6 bg-[var(--color-primary)] px-6 py-10 text-[var(--color-background)]"><div><p className="text-xs uppercase tracking-[0.16em]">{props.eyebrow}</p><h2 className="font-display text-5xl">{props.title}</h2></div>{action}</div>,
    split: <div className="grid items-center gap-6 md:grid-cols-2"><h2 className="font-display text-6xl leading-none">{props.title}</h2><div><p>{props.subtitle}</p><div className="mt-4">{action}</div></div></div>,
    poster: <div className="py-8"><p className="text-xs uppercase tracking-[0.2em]">{props.eyebrow}</p><h2 className="font-display text-[clamp(2.5rem,7cqw,5.5rem)] leading-[0.9] text-balance">{props.title}</h2><div className="mt-6">{action}</div></div>,
    inline: <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[var(--color-border)] py-6"><p className="text-xl">{props.title}</p>{action}</div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} layout={props.layout}>{body}</Section></Shell>;
}

export function Footer(props: PropsOf<"Footer">) {
  const links = (
    <nav className="flex flex-wrap gap-4 text-sm">
      {props.links.map((link, index) => (
        <a key={`footer-link-${index}`} href={link.href}>{asText(link.label)}</a>
      ))}
    </nav>
  );
  const body = {
    columns: <div className="grid gap-8 md:grid-cols-3"><strong className="font-display text-3xl">{props.logo}</strong><p className="max-w-sm text-sm leading-6">{props.note}</p>{links}</div>,
    centered: <div className="grid justify-items-center gap-4 text-center"><strong className="font-display text-4xl">{props.logo}</strong><p className="max-w-md text-sm">{props.note}</p>{links}</div>,
    bar: <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6"><span>{props.logo}</span>{links}</div>,
    editorial: <div><p className="font-display text-[clamp(2.5rem,8cqw,5.5rem)] leading-none text-balance">{props.logo}</p><p className="mt-4 max-w-xl">{props.note}</p></div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} layout={props.layout}><div className="space-y-8">{body}<p className="text-xs uppercase tracking-[0.14em]">{props.legal}</p></div></Section></Shell>;
}

export function Marquee(props: PropsOf<"Marquee">) {
  const labels = [...props.items, ...props.items];
  const track = (
    <div className={cn("marquee-track gap-8 py-4", props.variant === "slow" && "[animation-duration:48s]")}>
      {labels.map((item, index) => (
        <span key={`marquee-${index}`} className="px-4 font-display text-4xl md:text-6xl">{asText(item.label)}</span>
      ))}
    </div>
  );
  const body = {
    tape: <div className="overflow-hidden bg-[var(--color-primary)] text-[var(--color-background)]">{track}</div>,
    outline: <div className="overflow-hidden border-y border-[var(--color-foreground)]">{track}</div>,
    slow: <div className="overflow-hidden">{track}</div>,
    stacked: (
      <ul className="space-y-2">
        {props.items.map((item, index) => (
          <li key={`marquee-${index}`} className="font-display text-5xl">{asText(item.label)}</li>
        ))}
      </ul>
    ),
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} layout={props.layout} className="!px-0">{body}</Section></Shell>;
}

export function Video(props: PropsOf<"Video">) {
  const id = readId(props);
  const file = props.file ?? { src: "", alt: "", placeholder: true };
  const uploaded = file.src && !file.placeholder ? file.src : "";
  const embed = uploaded ? "" : toEmbed(props.url);
  const frame = uploaded ? (
    <Media image={file} blockId={id} path="file" className="aspect-video" />
  ) : embed ? (
    <div className="relative">
      <iframe title={props.title} src={embed} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      <Media image={file} blockId={id} path="file" className="mt-3 min-h-24" />
    </div>
  ) : (
    <Media image={file} blockId={id} path="file" className="aspect-video" />
  );
  const body = {
    frame: <div className="mx-auto max-w-4xl">{frame}<p className="mt-3 text-sm">{props.caption}</p></div>,
    bleed: <div>{frame}</div>,
    cinema: <div className="bg-black p-4 text-white md:p-10">{frame}<p className="mt-3 text-sm">{props.caption}</p></div>,
    text: <div className="grid items-center gap-8 md:grid-cols-[0.7fr_1.3fr]"><h2 className="font-display text-5xl">{props.title}</h2><div>{frame}</div></div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} layout={props.layout}>{props.variant === "text" ? null : <h2 className="mb-6 font-display text-5xl">{props.title}</h2>}{body}</Section></Shell>;
}

export function BeforeAfter(props: PropsOf<"BeforeAfter">) {
  return (
    <Shell animation={props.animation}>
      <Section anchor={props.anchor} visibility={props.visibility} layout={props.layout}>
        <h2 className="mb-6 font-display text-5xl">{props.title}</h2>
        <BeforeAfterBoard variant={props.variant} before={props.before} after={props.after} beforeLabel={props.beforeLabel} afterLabel={props.afterLabel} blockId={readId(props)} />
      </Section>
    </Shell>
  );
}

export function Booking(props: PropsOf<"Booking">) {
  const action = <ThemeLink href={props.href}>{props.label}</ThemeLink>;
  const body = {
    card: <div className="max-w-xl bg-[var(--color-muted)] p-8"><h2 className="font-display text-5xl">{props.title}</h2><p className="my-4">{props.subtitle}</p>{action}</div>,
    banner: <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--color-foreground)] px-6 py-8 text-[var(--color-background)]"><h2 className="font-display text-4xl">{props.title}</h2>{action}</div>,
    split: <div className="grid items-center gap-6 md:grid-cols-2"><div><h2 className="font-display text-6xl leading-none">{props.title}</h2><p className="mt-4">{props.subtitle}</p></div>{action}</div>,
    minimal: <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6"><span>{props.title}</span>{action}</div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} layout={props.layout}>{body}</Section></Shell>;
}

export function WhatsApp(props: PropsOf<"WhatsApp">) {
  const className = {
    floating: "fixed bottom-5 left-5 z-30",
    pill: "inline-flex",
    corner: "fixed bottom-5 right-5 z-30",
    bar: "flex w-full justify-center",
  }[props.variant];
  return (
    <Shell animation={props.animation} className={className}>
      <WhatsAppAnchor label={props.label} phone={props.phone} message={props.message} />
    </Shell>
  );
}

function toEmbed(url: string) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (parsed.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video/${parsed.pathname.split("/").filter(Boolean).pop()}`;
  } catch {
    return "";
  }
  return "";
}
