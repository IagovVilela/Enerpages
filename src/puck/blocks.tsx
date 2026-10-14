import type { ReactNode } from "react";
import { BeforeAfterBoard, ContactForm, FaqList, GalleryBoard, WhatsAppAnchor } from "@/puck/interactive";
import { Counter, MotionPreset, SplitText } from "@/puck/motion";
import type { Animation, PropsOf } from "@/puck/schema";
import { Media, ThemeLink } from "@/puck/theme";
import { visibilityClass } from "@/puck/visibility";
import { cn } from "@/lib/cn";

function Section({
  anchor,
  visibility,
  className,
  children,
}: {
  anchor?: string;
  visibility: { desktop: boolean; tablet: boolean; mobile: boolean };
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={anchor || undefined} className={cn("px-5 md:px-10", visibilityClass(visibility), className)} style={{ paddingBlock: "var(--space-section)" }}>
      {children}
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
      {props.links.map((link) => (
        <a key={link.href + link.label} href={link.href}>{link.label}</a>
      ))}
    </nav>
  );
  const body = {
    bar: <div className="flex items-center justify-between gap-6"><strong className="font-display text-2xl">{props.logo}</strong>{links}{props.cta.label ? <ThemeLink href={props.cta.href}>{props.cta.label}</ThemeLink> : null}</div>,
    centered: <div className="grid justify-items-center gap-4 text-center"><strong className="font-display text-4xl">{props.logo}</strong>{links}</div>,
    split: <div className="grid items-end gap-6 md:grid-cols-[1fr_auto_1fr]"><strong className="font-display text-3xl">{props.logo}</strong>{links}<div className="md:justify-self-end">{props.cta.label ? <ThemeLink href={props.cta.href}>{props.cta.label}</ThemeLink> : null}</div></div>,
    minimal: <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-4"><span className="text-xs uppercase tracking-[0.22em]">{props.logo}</span>{props.cta.label ? <a href={props.cta.href}>{props.cta.label}</a> : null}</div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} className="!py-6">{body}</Section></Shell>;
}

export function Hero(props: PropsOf<"Hero">) {
  const title = <h1 className="font-display text-[clamp(3.2rem,9vw,8.4rem)] leading-[0.86] tracking-[-0.04em]"><Heading text={props.title} animation={props.animation} /></h1>;
  const copy = (
    <div className="max-w-xl space-y-5">
      <p className="eyebrow text-xs uppercase tracking-[0.2em] text-[var(--color-primary)]">{props.eyebrow}</p>
      {title}
      <p className="max-w-md text-lg leading-relaxed">{props.subtitle}</p>
      <div className="flex flex-wrap gap-4">
        {props.primaryCta.label ? <ThemeLink href={props.primaryCta.href}>{props.primaryCta.label}</ThemeLink> : null}
        {props.secondaryCta.label ? <ThemeLink href={props.secondaryCta.href} tone="ghost">{props.secondaryCta.label}</ThemeLink> : null}
      </div>
    </div>
  );
  const body = {
    split: <div className="grid items-end gap-10 lg:grid-cols-12"><div className="lg:col-span-7">{copy}</div><Media image={props.image} className="min-h-[28rem] lg:col-span-5" /></div>,
    editorial: <div className="relative"><div className="max-w-[14ch]">{title}</div><div className="mt-8 grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end"><p className="max-w-sm text-lg">{props.subtitle}</p><Media image={props.image} className="min-h-80 md:-mt-24" /></div></div>,
    immersive: <div className="relative grid min-h-[88svh] items-end"><Media image={props.image} className="absolute inset-0 min-h-full" /><div className="relative max-w-3xl bg-[var(--color-background)]/88 p-6 md:p-10">{copy}</div></div>,
    asymmetric: <div className="grid gap-8 md:grid-cols-[auto_1fr]"><p className="text-xs uppercase tracking-[0.28em] md:[writing-mode:vertical-rl]">{props.eyebrow}</p><div className="md:ml-[8vw]">{copy}<div className="mt-8 md:w-2/3 md:justify-self-end"><Media image={props.image} className="min-h-72" /></div></div></div>,
  }[props.variant];
  return <Shell animation={{ ...props.animation, preset: "none" }} preserveLcp><Section anchor={props.anchor || "topo"} visibility={props.visibility}>{body}</Section></Shell>;
}

export function About(props: PropsOf<"About">) {
  const points = props.points.map((point) => <div key={point.title}><h3 className="font-display text-2xl">{point.title}</h3><p className="mt-2 text-sm leading-6">{point.description}</p></div>);
  const body = {
    columns: <div className="grid gap-10 lg:grid-cols-2"><div><p className="eyebrow text-xs uppercase tracking-[0.18em]">{props.eyebrow}</p><h2 className="mt-3 font-display text-5xl leading-none md:text-7xl"><Heading text={props.title} animation={props.animation} /></h2><p className="mt-6 max-w-prose text-lg leading-8">{props.body}</p></div><div className="grid gap-6">{points}</div></div>,
    overlap: <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]"><Media image={props.image} className="min-h-96" /><div className="md:-ml-16 md:mt-16 bg-[var(--color-muted)] p-8"><h2 className="font-display text-5xl leading-none">{props.title}</h2><p className="mt-4 leading-7">{props.body}</p></div></div>,
    manifesto: <div className="max-w-5xl"><p className="text-xs uppercase tracking-[0.2em]">{props.eyebrow}</p><h2 className="mt-4 font-display text-[clamp(2.8rem,6vw,6rem)] leading-[0.9]">{props.title}</h2><p className="mt-8 max-w-2xl text-xl leading-9">{props.body}</p></div>,
    sidebar: <div className="grid gap-10 border-y border-[var(--color-border)] py-10 md:grid-cols-[12rem_1fr]"><p className="text-xs uppercase tracking-[0.16em]">{props.eyebrow}</p><div><h2 className="font-display text-5xl">{props.title}</h2><p className="mt-4 max-w-prose leading-7">{props.body}</p><div className="mt-8 grid gap-4 md:grid-cols-3">{points}</div></div></div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor || "about"} visibility={props.visibility}>{body}</Section></Shell>;
}

export function Services(props: PropsOf<"Services">) {
  const items = props.items.map((item, index) => (
    <article key={item.title} className="border-t border-[var(--color-border)] py-6">
      <div className="flex items-baseline justify-between gap-4"><h3 className="font-display text-3xl">{item.title}</h3><span className="text-xs tabular-nums">0{index + 1}</span></div>
      <p className="mt-3 max-w-md text-sm leading-6">{item.description}</p>
    </article>
  ));
  const body = {
    grid: <div className="grid gap-px bg-[var(--color-border)] md:grid-cols-3">{props.items.map((item) => <article key={item.title} className="bg-[var(--color-background)] p-6"><h3 className="font-display text-3xl">{item.title}</h3><p className="mt-3 text-sm leading-6">{item.description}</p></article>)}</div>,
    list: <div>{items}</div>,
    bento: <div className="grid gap-4 md:grid-cols-6">{props.items.map((item, index) => <article key={item.title} className={cn("bg-[var(--color-muted)] p-6", index === 0 ? "md:col-span-4 md:row-span-2" : "md:col-span-2")}><h3 className="font-display text-3xl">{item.title}</h3><p className="mt-3 text-sm">{item.description}</p></article>)}</div>,
    index: <ol className="divide-y divide-[var(--color-border)]">{props.items.map((item, index) => <li key={item.title} className="grid gap-3 py-5 md:grid-cols-[4rem_1fr_1.2fr]"><span className="font-display text-3xl">{index + 1}</span><h3 className="text-xl">{item.title}</h3><p>{item.description}</p></li>)}</ol>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor || "services"} visibility={props.visibility}><p className="text-xs uppercase tracking-[0.18em]">{props.eyebrow}</p><h2 className="mb-8 mt-3 max-w-3xl font-display text-5xl leading-none md:text-7xl">{props.title}</h2>{body}</Section></Shell>;
}

export function Catalog(props: PropsOf<"Catalog">) {
  const cards = props.items.map((item) => (
    <article key={item.title} className="group">
      <Media image={item.image} className="min-h-64 transition-transform duration-300 group-hover:-rotate-1" />
      <div className="mt-3 flex items-baseline justify-between gap-3"><h3 className="font-display text-2xl">{item.title}</h3><span>{item.price}</span></div>
      <p className="mt-1 text-sm">{item.description}</p>
    </article>
  ));
  const body = {
    shelf: <div className="grid gap-8 md:grid-cols-3">{cards}</div>,
    lookbook: <div className="grid gap-10">{props.items.map((item, index) => <article key={item.title} className={cn("grid items-center gap-6 md:grid-cols-2", index % 2 === 1 && "md:[&>*:first-child]:order-2")}><Media image={item.image} className="min-h-80" /><div><p className="text-xs uppercase tracking-[0.16em]">{item.price}</p><h3 className="mt-2 font-display text-5xl">{item.title}</h3><p className="mt-3 max-w-sm">{item.description}</p></div></article>)}</div>,
    rows: <div className="divide-y divide-[var(--color-border)]">{props.items.map((item) => <article key={item.title} className="grid items-center gap-4 py-4 md:grid-cols-[8rem_1fr_auto]"><Media image={item.image} className="min-h-24" /><div><h3 className="font-display text-2xl">{item.title}</h3><p className="text-sm">{item.description}</p></div><strong>{item.price}</strong></article>)}</div>,
    mosaic: <div className="columns-1 gap-4 md:columns-3">{props.items.map((item) => <article key={item.title} className="mb-4 break-inside-avoid"><Media image={item.image} className="min-h-40" /><h3 className="mt-2 font-display text-2xl">{item.title}</h3></article>)}</div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility}><p className="text-xs uppercase tracking-[0.18em]">{props.eyebrow}</p><h2 className="mb-8 mt-3 font-display text-5xl md:text-7xl">{props.title}</h2>{body}</Section></Shell>;
}

export function Gallery(props: PropsOf<"Gallery">) {
  return (
    <Shell animation={props.animation}>
      <Section anchor={props.anchor} visibility={props.visibility}>
        <h2 className="mb-4 font-display text-5xl">{props.title}</h2>
        <GalleryBoard variant={props.variant} images={props.images} />
      </Section>
    </Shell>
  );
}

export function Testimonials(props: PropsOf<"Testimonials">) {
  const card = (item: PropsOf<"Testimonials">["items"][number]) => (
    <blockquote key={item.name} className="border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] p-6">
      <p className="text-lg leading-8">“{item.quote}”</p>
      <footer className="mt-4 text-xs uppercase tracking-[0.16em]">{item.name} · {item.role}</footer>
      <p className="mt-3 text-xs">Placeholder: substitua por um depoimento real.</p>
    </blockquote>
  );
  const body = {
    quotes: <div className="grid gap-4 md:grid-cols-2">{props.items.map(card)}</div>,
    large: <div className="max-w-4xl">{props.items[0] ? <blockquote className="font-display text-4xl leading-tight md:text-6xl">“{props.items[0].quote}”</blockquote> : null}</div>,
    cards: <div className="grid gap-4 md:grid-cols-3">{props.items.map(card)}</div>,
    single: <div className="max-w-2xl">{props.items[0] ? card(props.items[0]) : null}</div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility}><h2 className="mb-6 font-display text-4xl">{props.title}</h2>{body}</Section></Shell>;
}

export function Stats(props: PropsOf<"Stats">) {
  const cells = props.items.map((item) => <div key={item.label}><p className="font-display text-5xl md:text-7xl"><Counter value={item.value} /></p><p className="mt-2 text-sm uppercase tracking-[0.14em]">{item.label}</p></div>);
  const body = {
    row: <div className="grid gap-8 md:grid-cols-3">{cells}</div>,
    split: <div className="grid items-end gap-8 md:grid-cols-[1fr_1.4fr]"><h2 className="font-display text-5xl">{props.title}</h2><div className="grid gap-6">{cells}</div></div>,
    band: <div className="bg-[var(--color-foreground)] px-6 py-10 text-[var(--color-background)]"><div className="grid gap-6 md:grid-cols-3">{cells}</div></div>,
    stacked: <div className="space-y-6">{cells}</div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility}>{props.variant === "split" ? null : <h2 className="mb-8 font-display text-4xl">{props.title}</h2>}{body}</Section></Shell>;
}

export function Process(props: PropsOf<"Process">) {
  const body = {
    steps: <div className="grid gap-6 md:grid-cols-3">{props.items.map((item, index) => <article key={item.title}><span className="font-display text-5xl text-[var(--color-primary)]">0{index + 1}</span><h3 className="mt-3 text-2xl">{item.title}</h3><p className="mt-2 text-sm leading-6">{item.description}</p></article>)}</div>,
    timeline: <div className="space-y-6 border-l border-[var(--color-border)] pl-6">{props.items.map((item) => <article key={item.title}><h3 className="text-2xl">{item.title}</h3><p className="text-sm">{item.description}</p></article>)}</div>,
    numbered: <ol className="space-y-2">{props.items.map((item, index) => <li key={item.title} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-[var(--color-border)] py-4"><span>0{index + 1}</span><div><h3>{item.title}</h3><p className="text-sm">{item.description}</p></div></li>)}</ol>,
    horizontal: <div className="flex gap-4 overflow-x-auto">{props.items.map((item) => <article key={item.title} className="min-w-64 bg-[var(--color-muted)] p-5"><h3 className="font-display text-3xl">{item.title}</h3><p className="mt-2 text-sm">{item.description}</p></article>)}</div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility}><h2 className="mb-8 font-display text-5xl">{props.title}</h2>{body}</Section></Shell>;
}

export function Pricing(props: PropsOf<"Pricing">) {
  const plans = props.plans.map((plan) => (
    <article key={plan.name} className={cn("flex flex-col gap-4 p-6", plan.featured ? "bg-[var(--color-foreground)] text-[var(--color-background)]" : "border border-[var(--color-border)]")}>
      <h3 className="font-display text-3xl">{plan.name}</h3>
      <p className="text-3xl">{plan.price}</p>
      <p className="text-sm">{plan.description}</p>
      <ul className="space-y-1 text-sm">{plan.features.split("\n").filter(Boolean).map((feature) => <li key={feature}>{feature}</li>)}</ul>
      {plan.cta.label ? <ThemeLink href={plan.cta.href}>{plan.cta.label}</ThemeLink> : null}
    </article>
  ));
  const body = {
    trio: <div className="grid gap-4 md:grid-cols-3">{plans}</div>,
    highlight: <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">{plans}</div>,
    table: <div className="divide-y divide-[var(--color-border)]">{props.plans.map((plan) => <div key={plan.name} className="grid gap-3 py-4 md:grid-cols-4"><strong>{plan.name}</strong><span>{plan.price}</span><span>{plan.description}</span>{plan.cta.label ? <ThemeLink href={plan.cta.href}>{plan.cta.label}</ThemeLink> : null}</div>)}</div>,
    stacked: <div className="mx-auto grid max-w-xl gap-4">{plans}</div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility}><h2 className="mb-8 font-display text-5xl">{props.title}</h2>{body}</Section></Shell>;
}

export function Faq(props: PropsOf<"Faq">) {
  return (
    <Shell animation={props.animation}>
      <Section anchor={props.anchor} visibility={props.visibility}>
        <h2 className="mb-6 font-display text-5xl">{props.title}</h2>
        <FaqList variant={props.variant} items={props.items} />
      </Section>
    </Shell>
  );
}

export function Team(props: PropsOf<"Team">) {
  const people = props.people.map((person) => (
    <article key={person.title}><Media image={person.image} className="min-h-64" /><h3 className="mt-3 font-display text-3xl">{person.title}</h3><p className="text-xs uppercase tracking-[0.14em]">{person.role}</p><p className="mt-2 text-sm">{person.description}</p></article>
  ));
  const body = {
    portraits: <div className="grid gap-6 md:grid-cols-3">{people}</div>,
    list: <div className="divide-y divide-[var(--color-border)]">{props.people.map((person) => <article key={person.title} className="grid items-center gap-4 py-4 md:grid-cols-[8rem_1fr]"><Media image={person.image} className="min-h-24" /><div><h3 className="text-2xl">{person.title}</h3><p className="text-sm">{person.role}</p></div></article>)}</div>,
    offset: <div className="grid gap-6 md:grid-cols-2">{props.people.map((person, index) => <article key={person.title} className={index % 2 ? "md:mt-16" : ""}><Media image={person.image} className="min-h-72" /><h3 className="mt-3 font-display text-4xl">{person.title}</h3></article>)}</div>,
    compact: <ul className="flex flex-wrap gap-x-8 gap-y-3">{props.people.map((person) => <li key={person.title}><strong>{person.title}</strong> <span className="text-sm">{person.role}</span></li>)}</ul>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility}><h2 className="mb-8 font-display text-5xl">{props.title}</h2>{body}</Section></Shell>;
}

export function Timeline(props: PropsOf<"Timeline">) {
  const body = {
    vertical: <div className="space-y-8 border-l border-[var(--color-border)] pl-6">{props.events.map((event) => <article key={event.year + event.title}><p className="text-xs uppercase tracking-[0.16em]">{event.year}</p><h3 className="font-display text-3xl">{event.title}</h3><p className="text-sm">{event.description}</p></article>)}</div>,
    alternating: <div className="space-y-8">{props.events.map((event, index) => <article key={event.title} className={cn("max-w-md", index % 2 === 1 && "md:ml-auto md:text-right")}><p>{event.year}</p><h3 className="font-display text-4xl">{event.title}</h3><p>{event.description}</p></article>)}</div>,
    years: <div className="flex gap-6 overflow-x-auto">{props.events.map((event) => <article key={event.title} className="min-w-56"><p className="font-display text-5xl">{event.year}</p><h3 className="mt-2">{event.title}</h3><p className="text-sm">{event.description}</p></article>)}</div>,
    compact: <ul>{props.events.map((event) => <li key={event.title} className="grid grid-cols-[6rem_1fr] gap-4 border-b border-[var(--color-border)] py-3"><span>{event.year}</span><span>{event.title}</span></li>)}</ul>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility}><h2 className="mb-8 font-display text-5xl">{props.title}</h2>{body}</Section></Shell>;
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
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility}>{body}</Section></Shell>;
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
  return <Shell animation={props.animation}><Section anchor="contato" visibility={props.visibility}>{body}</Section></Shell>;
}

export function Cta(props: PropsOf<"Cta">) {
  const action = props.cta.label ? <ThemeLink href={props.cta.href}>{props.cta.label}</ThemeLink> : null;
  const body = {
    band: <div className="flex flex-wrap items-end justify-between gap-6 bg-[var(--color-primary)] px-6 py-10 text-[var(--color-background)]"><div><p className="text-xs uppercase tracking-[0.16em]">{props.eyebrow}</p><h2 className="font-display text-5xl">{props.title}</h2></div>{action}</div>,
    split: <div className="grid items-center gap-6 md:grid-cols-2"><h2 className="font-display text-6xl leading-none">{props.title}</h2><div><p>{props.subtitle}</p><div className="mt-4">{action}</div></div></div>,
    poster: <div className="py-8"><p className="text-xs uppercase tracking-[0.2em]">{props.eyebrow}</p><h2 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[0.85]">{props.title}</h2><div className="mt-6">{action}</div></div>,
    inline: <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[var(--color-border)] py-6"><p className="text-xl">{props.title}</p>{action}</div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility}>{body}</Section></Shell>;
}

export function Footer(props: PropsOf<"Footer">) {
  const links = <nav className="flex flex-wrap gap-4 text-sm">{props.links.map((link) => <a key={link.label} href={link.href}>{link.label}</a>)}</nav>;
  const body = {
    columns: <div className="grid gap-8 md:grid-cols-3"><strong className="font-display text-3xl">{props.logo}</strong><p className="max-w-sm text-sm leading-6">{props.note}</p>{links}</div>,
    centered: <div className="grid justify-items-center gap-4 text-center"><strong className="font-display text-4xl">{props.logo}</strong><p className="max-w-md text-sm">{props.note}</p>{links}</div>,
    bar: <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6"><span>{props.logo}</span>{links}</div>,
    editorial: <div><p className="font-display text-[clamp(3rem,10vw,8rem)] leading-none">{props.logo}</p><p className="mt-4 max-w-xl">{props.note}</p></div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility}><div className="space-y-8">{body}<p className="text-xs uppercase tracking-[0.14em]">{props.legal}</p></div></Section></Shell>;
}

export function Marquee(props: PropsOf<"Marquee">) {
  const labels = [...props.items, ...props.items];
  const track = <div className={cn("marquee-track gap-8 py-4", props.variant === "slow" && "[animation-duration:48s]")}>{labels.map((item, index) => <span key={`${item.label}-${index}`} className="px-4 font-display text-4xl md:text-6xl">{item.label}</span>)}</div>;
  const body = {
    tape: <div className="overflow-hidden bg-[var(--color-primary)] text-[var(--color-background)]">{track}</div>,
    outline: <div className="overflow-hidden border-y border-[var(--color-foreground)]">{track}</div>,
    slow: <div className="overflow-hidden">{track}</div>,
    stacked: <ul className="space-y-2">{props.items.map((item) => <li key={item.label} className="font-display text-5xl">{item.label}</li>)}</ul>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility} className="!px-0">{body}</Section></Shell>;
}

export function Video(props: PropsOf<"Video">) {
  const embed = toEmbed(props.url);
  const frame = embed ? <iframe title={props.title} src={embed} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <div className="media-placeholder grid aspect-video place-items-center text-sm">Cole um link de vídeo</div>;
  const body = {
    frame: <div className="mx-auto max-w-4xl">{frame}<p className="mt-3 text-sm">{props.caption}</p></div>,
    bleed: <div>{frame}</div>,
    cinema: <div className="bg-black p-4 text-white md:p-10">{frame}<p className="mt-3 text-sm">{props.caption}</p></div>,
    text: <div className="grid items-center gap-8 md:grid-cols-[0.7fr_1.3fr]"><h2 className="font-display text-5xl">{props.title}</h2><div>{frame}</div></div>,
  }[props.variant];
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility}>{props.variant === "text" ? null : <h2 className="mb-6 font-display text-5xl">{props.title}</h2>}{body}</Section></Shell>;
}

export function BeforeAfter(props: PropsOf<"BeforeAfter">) {
  return (
    <Shell animation={props.animation}>
      <Section anchor={props.anchor} visibility={props.visibility}>
        <h2 className="mb-6 font-display text-5xl">{props.title}</h2>
        <BeforeAfterBoard variant={props.variant} before={props.before} after={props.after} beforeLabel={props.beforeLabel} afterLabel={props.afterLabel} />
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
  return <Shell animation={props.animation}><Section anchor={props.anchor} visibility={props.visibility}>{body}</Section></Shell>;
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
