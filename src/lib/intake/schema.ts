import { z } from "zod";
import { mapsEmbedFromAddress } from "@/lib/map-embed";
import { ensureThemeContrast } from "@/lib/theme-contrast";
import { SEGMENT_TRIOS } from "@/lib/ai/segment-roster";
import { getTemplateStyle, isPageTemplateId } from "@/lib/ai/template-styles";
import { PAGE_TEMPLATE_IDS, type PageTemplateId } from "@/puck/page-templates-ids";
import {
  BG_ARTS,
  BODY_FONTS,
  DISPLAY_FONTS,
  PERSONALITIES,
  SEGMENTS,
  briefingSchema,
  type Briefing,
  type PageDocument,
  type Theme,
} from "@/puck/schema";

/** Defaults antigos do formulário — se o payload ainda for isso, não sobrescrevem o tema do modelo. */
export const INTAKE_FACTORY_LOOK = {
  personality: "editorial" as const,
  primaryColor: "#8f3d2b",
  backgroundColor: "#f6f1ea",
  fontDisplay: "Fraunces" as const,
  fontBody: "Outfit" as const,
  bgArt: "none" as const,
};

type IntakeLook = {
  personality: (typeof PERSONALITIES)[number];
  primaryColor: string;
  backgroundColor: string;
  fontDisplay: (typeof DISPLAY_FONTS)[number];
  fontBody: (typeof BODY_FONTS)[number];
  bgArt: (typeof BG_ARTS)[number];
};

export function defaultTemplateForSegment(segment: Briefing["segment"]): PageTemplateId {
  const trio = SEGMENT_TRIOS[segment] ?? SEGMENT_TRIOS.local;
  return trio[0]!;
}

export function intakeVisualFromTemplate(templateId: PageTemplateId): IntakeLook {
  const style = getTemplateStyle(templateId);
  const display = style.fonts?.display;
  const body = style.fonts?.body;
  const bgArt = style.bgArt;
  return {
    personality: style.personality,
    primaryColor: style.colors.primary,
    backgroundColor: style.colors.background,
    fontDisplay:
      display && (DISPLAY_FONTS as readonly string[]).includes(display)
        ? (display as (typeof DISPLAY_FONTS)[number])
        : INTAKE_FACTORY_LOOK.fontDisplay,
    fontBody:
      body && (BODY_FONTS as readonly string[]).includes(body)
        ? (body as (typeof BODY_FONTS)[number])
        : INTAKE_FACTORY_LOOK.fontBody,
    bgArt:
      bgArt && (BG_ARTS as readonly string[]).includes(bgArt)
        ? (bgArt as (typeof BG_ARTS)[number])
        : "none",
  };
}

export function isFactoryLook(payload: IntakeLook) {
  return (
    payload.personality === INTAKE_FACTORY_LOOK.personality &&
    payload.primaryColor.toLowerCase() === INTAKE_FACTORY_LOOK.primaryColor &&
    payload.backgroundColor.toLowerCase() === INTAKE_FACTORY_LOOK.backgroundColor &&
    payload.fontDisplay === INTAKE_FACTORY_LOOK.fontDisplay &&
    payload.fontBody === INTAKE_FACTORY_LOOK.fontBody &&
    payload.bgArt === INTAKE_FACTORY_LOOK.bgArt
  );
}

export const intakeSchema = z.object({
  // 1 Negócio
  clientName: z.string().min(2).max(80),
  segment: z.enum(SEGMENTS),
  audience: z.string().max(400).default(""),
  goal: z.enum(["vender", "agendar", "captar"]),
  services: z.string().max(800).default(""),
  // 2 Contato
  whatsapp: z.string().max(40).default(""),
  phone: z.string().max(40).default(""),
  instagram: z.string().max(120).default(""),
  email: z.string().max(120).default(""),
  address: z.string().max(300).default(""),
  // 3 Visual
  personality: z.enum(PERSONALITIES).default(INTAKE_FACTORY_LOOK.personality),
  primaryColor: z.string().max(40).default(INTAKE_FACTORY_LOOK.primaryColor),
  backgroundColor: z.string().max(40).default(INTAKE_FACTORY_LOOK.backgroundColor),
  fontDisplay: z.enum(DISPLAY_FONTS).default(INTAKE_FACTORY_LOOK.fontDisplay),
  fontBody: z.enum(BODY_FONTS).default(INTAKE_FACTORY_LOOK.fontBody),
  bgArt: z.enum(BG_ARTS).default(INTAKE_FACTORY_LOOK.bgArt),
  // 4 Textos
  tone: z.string().max(200).default(""),
  differentials: z.string().max(600).default(""),
  references: z.string().max(400).default(""),
  headline: z.string().max(160).default(""),
  tagline: z.string().max(240).default(""),
  // 5 Modelo — fallback legado; emptyIntake / create usam o trio do segmento
  templateId: z.enum(PAGE_TEMPLATE_IDS).default("classic"),
});

export type IntakePayload = z.infer<typeof intakeSchema>;

export function parseIntakePayload(raw: unknown): IntakePayload | null {
  const parsed = intakeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function emptyIntake(partial?: Partial<IntakePayload>): IntakePayload {
  const segment = partial?.segment ?? "local";
  const templateId =
    partial?.templateId && isPageTemplateId(partial.templateId)
      ? partial.templateId
      : defaultTemplateForSegment(segment);
  const visual = intakeVisualFromTemplate(templateId);

  // Draft-friendly: do not run min-length validators until submit.
  return {
    clientName: partial?.clientName ?? "",
    segment,
    audience: partial?.audience ?? "",
    goal: partial?.goal ?? "captar",
    services: partial?.services ?? "",
    whatsapp: partial?.whatsapp ?? "",
    phone: partial?.phone ?? "",
    instagram: partial?.instagram ?? "",
    email: partial?.email ?? "",
    address: partial?.address ?? "",
    personality: partial?.personality ?? visual.personality,
    primaryColor: partial?.primaryColor ?? visual.primaryColor,
    backgroundColor: partial?.backgroundColor ?? visual.backgroundColor,
    fontDisplay: partial?.fontDisplay ?? visual.fontDisplay,
    fontBody: partial?.fontBody ?? visual.fontBody,
    bgArt: partial?.bgArt ?? visual.bgArt,
    tone: partial?.tone ?? "",
    differentials: partial?.differentials ?? "",
    references: partial?.references ?? "",
    headline: partial?.headline ?? "",
    tagline: partial?.tagline ?? "",
    templateId,
  };
}

export function intakeToBriefing(payload: IntakePayload, slug = ""): Briefing {
  return briefingSchema.parse({
    clientName: payload.clientName,
    segment: payload.segment,
    audience: payload.audience,
    tone: payload.tone || payload.personality,
    differentials: payload.differentials,
    services: payload.services,
    colors: payload.primaryColor,
    references: payload.references,
    goal: payload.goal,
    slug,
    address: payload.address,
    whatsapp: payload.whatsapp || payload.phone,
    personality: payload.personality,
    templateId: payload.templateId,
    headline: payload.headline,
    tagline: payload.tagline,
    backgroundColor: payload.backgroundColor,
  });
}

export function applyIntakeToDocument(document: PageDocument, payload: IntakePayload): PageDocument {
  // Look "de fábrica" legado = manter tipografia/cores/atmosfera do modelo já montado.
  const preserveTemplateTheme = isFactoryLook(payload);
  const baseColors = { ...document.root.props.theme.colors };

  if (!preserveTemplateTheme) {
    if (payload.primaryColor?.startsWith("#")) {
      baseColors.primary = payload.primaryColor;
      baseColors.accent = payload.primaryColor;
    }
    if (payload.backgroundColor?.startsWith("#")) {
      baseColors.background = payload.backgroundColor;
    }
  }

  const theme: Theme = preserveTemplateTheme
    ? {
        ...document.root.props.theme,
        colors: ensureThemeContrast(document.root.props.theme.colors),
      }
    : {
        ...document.root.props.theme,
        personality: payload.personality,
        colors: ensureThemeContrast(baseColors),
        fonts: {
          display: payload.fontDisplay,
          body: payload.fontBody,
        },
        bgArt: payload.bgArt,
      };

  const whatsappPhone = payload.whatsapp || payload.phone || document.root.props.whatsapp.phone;
  const address = payload.address.trim();

  const content = document.content.map((block) => {
    if (block.type === "Hero" && (payload.headline || payload.tagline)) {
      return {
        ...block,
        props: {
          ...block.props,
          title: payload.headline || block.props.title,
          subtitle: payload.tagline || block.props.subtitle,
        },
      };
    }
    if (block.type === "Map" && address) {
      return {
        ...block,
        props: {
          ...block.props,
          address,
          embedUrl:
            block.props.embedUrl?.includes("output=embed") || block.props.embedUrl?.includes("/maps/embed")
              ? block.props.embedUrl
              : mapsEmbedFromAddress(address),
          note: block.props.note?.includes("substituir") ? "Venha nos visitar." : block.props.note,
        },
      };
    }
    return block;
  });

  return {
    ...document,
    root: {
      ...document.root,
      props: {
        ...document.root.props,
        theme,
        whatsapp: {
          ...document.root.props.whatsapp,
          phone: whatsappPhone,
          floating: Boolean(whatsappPhone),
          message:
            document.root.props.whatsapp.message ||
            `Olá! Vim pelo site de ${payload.clientName}.`,
        },
        seo: {
          ...document.root.props.seo,
          title: payload.headline
            ? `${payload.clientName} · ${payload.headline}`
            : document.root.props.seo.title,
          description: payload.tagline || document.root.props.seo.description,
        },
      },
    },
    content,
  };
}
