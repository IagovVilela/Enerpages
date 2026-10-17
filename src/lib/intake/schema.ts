import { z } from "zod";
import { PAGE_TEMPLATE_IDS } from "@/puck/page-templates";
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
  personality: z.enum(PERSONALITIES).default("editorial"),
  primaryColor: z.string().max(40).default("#8f3d2b"),
  backgroundColor: z.string().max(40).default("#f6f1ea"),
  fontDisplay: z.enum(DISPLAY_FONTS).default("Fraunces"),
  fontBody: z.enum(BODY_FONTS).default("Outfit"),
  bgArt: z.enum(BG_ARTS).default("none"),
  // 4 Textos
  tone: z.string().max(200).default(""),
  differentials: z.string().max(600).default(""),
  references: z.string().max(400).default(""),
  headline: z.string().max(160).default(""),
  tagline: z.string().max(240).default(""),
  // 5 Modelo
  templateId: z.enum(PAGE_TEMPLATE_IDS).default("classic"),
});

export type IntakePayload = z.infer<typeof intakeSchema>;

export function emptyIntake(partial?: Partial<IntakePayload>): IntakePayload {
  // Draft-friendly: do not run min-length validators until submit.
  return {
    clientName: partial?.clientName ?? "",
    segment: partial?.segment ?? "local",
    audience: partial?.audience ?? "",
    goal: partial?.goal ?? "captar",
    services: partial?.services ?? "",
    whatsapp: partial?.whatsapp ?? "",
    phone: partial?.phone ?? "",
    instagram: partial?.instagram ?? "",
    email: partial?.email ?? "",
    address: partial?.address ?? "",
    personality: partial?.personality ?? "editorial",
    primaryColor: partial?.primaryColor ?? "#8f3d2b",
    backgroundColor: partial?.backgroundColor ?? "#f6f1ea",
    fontDisplay: partial?.fontDisplay ?? "Fraunces",
    fontBody: partial?.fontBody ?? "Outfit",
    bgArt: partial?.bgArt ?? "none",
    tone: partial?.tone ?? "",
    differentials: partial?.differentials ?? "",
    references: partial?.references ?? "",
    headline: partial?.headline ?? "",
    tagline: partial?.tagline ?? "",
    templateId: partial?.templateId ?? "classic",
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
    references: [payload.references, payload.headline, payload.tagline].filter(Boolean).join(" · "),
    goal: payload.goal,
    slug,
  });
}

export function applyIntakeToDocument(document: PageDocument, payload: IntakePayload): PageDocument {
  const theme: Theme = {
    ...document.root.props.theme,
    personality: payload.personality,
    colors: {
      ...document.root.props.theme.colors,
      primary: payload.primaryColor || document.root.props.theme.colors.primary,
      background: payload.backgroundColor || document.root.props.theme.colors.background,
      accent: payload.primaryColor || document.root.props.theme.colors.accent,
    },
    fonts: {
      display: payload.fontDisplay,
      body: payload.fontBody,
    },
    bgArt: payload.bgArt,
  };

  const whatsappPhone = payload.whatsapp || payload.phone || document.root.props.whatsapp.phone;

  let content = document.content;
  if (payload.headline || payload.tagline) {
    content = content.map((block) => {
      if (block.type !== "Hero") return block;
      return {
        ...block,
        props: {
          ...block.props,
          title: payload.headline || block.props.title,
          subtitle: payload.tagline || block.props.subtitle,
        },
      };
    });
  }

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
