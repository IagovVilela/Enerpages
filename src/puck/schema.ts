import { z } from "zod";

export const SEGMENTS = [
  "moda",
  "portfolio",
  "advocacia",
  "psicologia",
  "clinica",
  "restaurante",
  "barbearia",
  "infoproduto",
  "local",
] as const;

export const PERSONALITIES = [
  "editorial",
  "minimal",
  "bold",
  "warm",
  "luxury",
  "brutalist",
  "organic",
] as const;

export const DISPLAY_FONTS = [
  "Fraunces",
  "Newsreader",
  "Instrument Serif",
  "Bebas Neue",
  "Syne",
  "Cormorant Garamond",
] as const;

export const BODY_FONTS = ["Outfit", "Figtree", "Manrope", "Literata"] as const;

export const PRESETS = [
  "none",
  "fade",
  "slide-up",
  "slide-left",
  "mask-reveal",
  "split-words",
  "split-chars",
  "stagger",
  "blur-in",
  "scale",
] as const;

export const VARIANTS = {
  Navbar: ["bar", "centered", "split", "minimal"],
  Hero: ["banner", "split", "editorial", "immersive", "asymmetric", "cinematic", "light", "brand"],
  About: ["columns", "overlap", "manifesto", "sidebar"],
  Services: ["grid", "list", "bento", "index"],
  Catalog: ["shelf", "lookbook", "rows", "mosaic"],
  Gallery: ["masonry", "filmstrip", "grid", "feature"],
  Testimonials: ["quotes", "large", "cards", "single"],
  Stats: ["row", "split", "band", "stacked"],
  Process: ["steps", "timeline", "numbered", "horizontal"],
  Pricing: ["trio", "highlight", "table", "stacked"],
  Faq: ["accordion", "two-column", "plain", "bordered"],
  Team: ["portraits", "list", "offset", "compact"],
  Timeline: ["vertical", "alternating", "years", "compact"],
  Map: ["split", "stacked", "card", "banner"],
  Contact: ["split", "stacked", "panel", "minimal"],
  Cta: ["band", "split", "poster", "inline"],
  Footer: ["columns", "centered", "bar", "editorial"],
  Marquee: ["tape", "outline", "slow", "stacked"],
  Video: ["frame", "bleed", "cinema", "text"],
  BeforeAfter: ["slider", "side", "stacked", "caption"],
  Booking: ["card", "banner", "split", "minimal"],
  WhatsApp: ["floating", "pill", "corner", "bar"],
  Text: ["display", "title", "lead", "body", "caption", "eyebrow"],
  Button: ["solid", "outline", "pill", "text", "ghost", "soft", "square", "inverted"],
  Badge: ["pill", "square", "outline", "tag", "soft", "alert", "brand"],
  Divider: ["line", "thick", "dotted", "fade"],
  Spacer: ["sm", "md", "lg", "xl"],
  Panel: ["card", "quote", "note", "invert", "glass", "accent", "flat"],
  CardGrid: ["two", "three", "four", "list"],
  Band: ["solid", "outline", "accent", "bleed", "rounded", "surface"],
  Picture: ["frame", "bleed", "portrait", "wide"],
  Clip: ["film", "square", "wide", "caption"],
} as const;

export const BG_ARTS = [
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
] as const;

export const BLOCK_TYPES = Object.keys(VARIANTS) as Array<keyof typeof VARIANTS>;

export const animationSchema = z.object({
  preset: z.enum(PRESETS),
  duration: z.coerce.number().min(0).max(2),
  delay: z.coerce.number().min(0).max(2),
  easing: z.enum(["easeOut", "easeInOut", "spring", "linear"]),
  trigger: z.enum(["view", "load", "hover", "scroll"]),
});

export const visibilitySchema = z.object({
  desktop: z.boolean(),
  tablet: z.boolean(),
  mobile: z.boolean(),
});

export const imageSchema = z.object({
  src: z.string(),
  alt: z.string(),
  placeholder: z.boolean(),
});

export function isVideoSrc(src: string) {
  return /\.(mp4|webm)(\?|$)/i.test(src);
}

export const linkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

export const themeSchema = z.object({
  personality: z.enum(PERSONALITIES),
  colors: z.object({
    background: z.string(),
    foreground: z.string(),
    primary: z.string(),
    accent: z.string(),
    muted: z.string(),
    border: z.string(),
  }),
  fonts: z.object({
    display: z.enum(DISPLAY_FONTS),
    body: z.enum(BODY_FONTS),
  }),
  radius: z.enum(["none", "sm", "md", "lg"]),
  shadow: z.enum(["none", "soft", "hard"]),
  button: z.enum(["solid", "outline", "pill", "underline"]),
  image: z.enum(["sharp", "rounded", "framed", "bleed"]),
  spacing: z.enum(["compact", "comfortable", "airy"]),
  cursor: z.enum(["default", "dot"]),
  bgArt: z.enum(BG_ARTS).default("none"),
  bgArtColor: z.string().default(""),
  bgArtStrength: z.coerce.number().min(5).max(100).default(45),
});

export const LAYOUT_PADDING = ["none", "sm", "md", "lg", "xl"] as const;
export const LAYOUT_WIDTH = ["sm", "md", "lg", "full"] as const;

export const layoutSchema = z.object({
  paddingY: z.enum(LAYOUT_PADDING).default("md"),
  maxWidth: z.enum(LAYOUT_WIDTH).default("lg"),
});

const chrome = {
  id: z.string().optional(),
  anchor: z.string().optional(),
  visibility: visibilitySchema,
  animation: animationSchema,
  locked: z.boolean().optional().default(false),
  layout: layoutSchema.optional().default({ paddingY: "md", maxWidth: "lg" }),
};

const feature = z.object({
  title: z.string(),
  description: z.string(),
});

function block<T extends string, P extends z.ZodRawShape>(type: T, variant: readonly [string, ...string[]], props: P) {
  return z.object({
    type: z.literal(type),
    props: z.object({
      ...chrome,
      variant: z.enum(variant),
      ...props,
    }),
  });
}

export const blockSchema = z.discriminatedUnion("type", [
  block("Navbar", VARIANTS.Navbar, {
    logo: z.string(),
    links: z.array(linkSchema),
    cta: linkSchema,
  }),
  block("Hero", VARIANTS.Hero, {
    eyebrow: z.string(),
    title: z.string(),
    subtitle: z.string(),
    image: imageSchema,
    /** logo = marca/banner com contain; photo = foto de fundo com cover. */
    imageMode: z.enum(["logo", "photo"]).default("logo"),
    primaryCta: linkSchema,
    secondaryCta: linkSchema,
  }),
  block("About", VARIANTS.About, {
    eyebrow: z.string(),
    title: z.string(),
    body: z.string(),
    image: imageSchema,
    points: z.array(feature),
  }),
  block("Services", VARIANTS.Services, {
    eyebrow: z.string(),
    title: z.string(),
    items: z.array(feature),
  }),
  block("Catalog", VARIANTS.Catalog, {
    eyebrow: z.string(),
    title: z.string(),
    items: z.array(feature.extend({ price: z.string(), image: imageSchema })),
  }),
  block("Gallery", VARIANTS.Gallery, {
    title: z.string(),
    images: z.array(z.object({ image: imageSchema, caption: z.string(), tag: z.string() })),
  }),
  block("Testimonials", VARIANTS.Testimonials, {
    title: z.string(),
    items: z.array(
      z.object({
        quote: z.string(),
        name: z.string(),
        role: z.string(),
        image: imageSchema,
        placeholder: z.boolean(),
      }),
    ),
  }),
  block("Stats", VARIANTS.Stats, {
    title: z.string(),
    items: z.array(z.object({ value: z.string(), label: z.string() })),
  }),
  block("Process", VARIANTS.Process, {
    title: z.string(),
    items: z.array(feature),
  }),
  block("Pricing", VARIANTS.Pricing, {
    title: z.string(),
    plans: z.array(
      z.object({
        name: z.string(),
        price: z.string(),
        description: z.string(),
        features: z.string(),
        cta: linkSchema,
        featured: z.boolean(),
      }),
    ),
  }),
  block("Faq", VARIANTS.Faq, {
    title: z.string(),
    items: z.array(z.object({ question: z.string(), answer: z.string() })),
  }),
  block("Team", VARIANTS.Team, {
    title: z.string(),
    people: z.array(feature.extend({ role: z.string(), image: imageSchema })),
  }),
  block("Timeline", VARIANTS.Timeline, {
    title: z.string(),
    events: z.array(z.object({ year: z.string(), title: z.string(), description: z.string() })),
  }),
  block("Map", VARIANTS.Map, {
    title: z.string(),
    address: z.string(),
    embedUrl: z.string(),
    note: z.string(),
  }),
  block("Contact", VARIANTS.Contact, {
    title: z.string(),
    subtitle: z.string(),
    submitLabel: z.string(),
  }),
  block("Cta", VARIANTS.Cta, {
    eyebrow: z.string(),
    title: z.string(),
    subtitle: z.string(),
    cta: linkSchema,
  }),
  block("Footer", VARIANTS.Footer, {
    logo: z.string(),
    note: z.string(),
    links: z.array(linkSchema),
    legal: z.string(),
  }),
  block("Marquee", VARIANTS.Marquee, {
    items: z.array(z.object({ label: z.string() })),
  }),
  block("Video", VARIANTS.Video, {
    title: z.string(),
    url: z.string(),
    caption: z.string(),
    file: imageSchema.default({ src: "", alt: "", placeholder: true }),
  }),
  block("BeforeAfter", VARIANTS.BeforeAfter, {
    title: z.string(),
    before: imageSchema,
    after: imageSchema,
    beforeLabel: z.string(),
    afterLabel: z.string(),
  }),
  block("Booking", VARIANTS.Booking, {
    title: z.string(),
    subtitle: z.string(),
    href: z.string(),
    label: z.string(),
  }),
  block("WhatsApp", VARIANTS.WhatsApp, {
    label: z.string(),
    phone: z.string(),
    message: z.string(),
  }),
  block("Text", VARIANTS.Text, {
    text: z.string(),
    align: z.enum(["left", "center", "right"]),
    fontSize: z.coerce.number().min(12).max(120),
  }),
  block("Button", VARIANTS.Button, {
    label: z.string(),
    href: z.string(),
    align: z.enum(["left", "center", "right"]),
  }),
  block("Badge", VARIANTS.Badge, {
    text: z.string(),
    align: z.enum(["left", "center", "right"]),
  }),
  block("Divider", VARIANTS.Divider, {}),
  block("Spacer", VARIANTS.Spacer, {}),
  block("Panel", VARIANTS.Panel, {
    title: z.string(),
    body: z.string(),
  }),
  block("CardGrid", VARIANTS.CardGrid, {
    title: z.string(),
    cards: z.array(z.object({ title: z.string(), description: z.string(), emoji: z.string() })),
  }),
  block("Band", VARIANTS.Band, {
    text: z.string(),
    href: z.string(),
    label: z.string(),
  }),
  block("Picture", VARIANTS.Picture, {
    image: imageSchema,
    zoom: z.coerce.number().min(1).max(3),
    posX: z.coerce.number().min(0).max(100),
    posY: z.coerce.number().min(0).max(100),
    caption: z.string(),
  }),
  block("Clip", VARIANTS.Clip, {
    file: imageSchema,
    zoom: z.coerce.number().min(1).max(3),
    posX: z.coerce.number().min(0).max(100),
    posY: z.coerce.number().min(0).max(100),
    caption: z.string(),
  }),
]);

export const rootPropsSchema = z.object({
  theme: themeSchema,
  seo: z.object({
    title: z.string(),
    description: z.string(),
    ogImage: z.string(),
  }),
  favicon: z.string(),
  locale: z.string(),
  whatsapp: z.object({
    phone: z.string(),
    message: z.string(),
    floating: z.boolean(),
  }),
  analytics: z.object({
    ga4: z.string(),
    metaPixel: z.string(),
  }),
  archetype: z.string(),
  slug: z.string().optional(),
  pageId: z.string().optional(),
});

export const pageDataSchema = z.object({
  root: z.object({
    props: rootPropsSchema,
  }),
  content: z.array(blockSchema),
  zones: z.record(z.array(blockSchema)).optional(),
});

export const briefingSchema = z.object({
  clientName: z.string().min(2).max(80),
  segment: z.enum(SEGMENTS),
  audience: z.string().max(400).default(""),
  tone: z.string().max(200).default(""),
  differentials: z.string().max(600).default(""),
  services: z.string().max(800).default(""),
  colors: z.string().max(40).default(""),
  references: z.string().max(400).default(""),
  goal: z.enum(["vender", "agendar", "captar"]),
  slug: z.string().max(63).default(""),
  /** Campos extras do intake — diversificam propostas e preenchem Map/WhatsApp. */
  address: z.string().max(300).default(""),
  whatsapp: z.string().max(40).default(""),
  personality: z.enum(PERSONALITIES).optional(),
  templateId: z.string().max(40).default(""),
  headline: z.string().max(160).default(""),
  tagline: z.string().max(240).default(""),
  backgroundColor: z.string().max(40).default(""),
});

export type Animation = z.infer<typeof animationSchema>;
export type Visibility = z.infer<typeof visibilitySchema>;
export type Layout = z.infer<typeof layoutSchema>;
export type ImageField = z.infer<typeof imageSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type PageDocument = z.infer<typeof pageDataSchema>;
export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];
export type Briefing = z.infer<typeof briefingSchema>;
export type RootProps = z.infer<typeof rootPropsSchema>;

export type PropsOf<T extends BlockType> = Extract<Block, { type: T }>["props"];

export function emptyImage(): ImageField {
  return { src: "", alt: "", placeholder: true };
}

/** Garante props.id únicos no content (Puck quebra com keys duplicadas tipo Panel-1). */
export function ensureUniqueBlockIds(document: PageDocument): PageDocument {
  const seen = new Set<string>();
  const content = document.content.map((block, index) => {
    const current = typeof block.props.id === "string" ? block.props.id : "";
    let id = current || `${block.type}-${index + 1}`;
    if (seen.has(id)) {
      id = `${block.type}-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 7)}`;
    }
    seen.add(id);
    if (id === current) return block;
    return { ...block, props: { ...block.props, id } } as Block;
  });
  return { ...document, content };
}

export function defaultAnimation(preset: Animation["preset"] = "fade"): Animation {
  return { preset, duration: 0.6, delay: 0, easing: "easeOut", trigger: "view" };
}

export function defaultVisibility(): Visibility {
  return { desktop: true, tablet: true, mobile: true };
}

export function defaultLayout(): Layout {
  return { paddingY: "md", maxWidth: "lg" };
}
