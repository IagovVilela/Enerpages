import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ARCHETYPES } from "@/lib/ai/archetypes";
import { enforceCompliance } from "@/lib/ai/compliance";
import { generateDeterministic } from "@/lib/ai/fallback";
import { generateJSON, isQuotaError } from "@/lib/ai/provider";
import {
  BLOCK_TYPES,
  PERSONALITIES,
  PRESETS,
  VARIANTS,
  pageDataSchema,
  type Block,
  type BlockType,
  type Briefing,
  type PageDocument,
} from "@/puck/schema";

const structureSchema = z.object({
  personality: z.enum(PERSONALITIES),
  paletteIndex: z.number().int().min(0).max(8),
  blocks: z.array(z.object({ type: z.enum(BLOCK_TYPES as [BlockType, ...BlockType[]]), variant: z.string() })).min(4).max(14),
});

const textSchema = z.object({
  seoTitle: z.string(),
  seoDescription: z.string(),
  blocks: z.array(
    z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      eyebrow: z.string().optional(),
      body: z.string().optional(),
      note: z.string().optional(),
      items: z.array(z.record(z.string())).optional(),
    }),
  ),
});

const motionSchema = z.object({
  presets: z.array(z.enum(PRESETS)),
});

const SYSTEM =
  "Você escreve landing pages em português do Brasil. Responda apenas JSON. Não invente depoimentos, nomes de clientes nem fotos de pessoas. Para advocacia, psicologia e clínicas, não prometa resultado, cura ou ganho de causa.";

function cacheKey(stage: string, briefing: Briefing, direction: number) {
  return createHash("sha256").update(JSON.stringify({ stage, briefing, direction, v: 1 })).digest("hex");
}

async function cached<T>(key: string, schema: z.ZodType<T>, load: () => Promise<{ data: T; provider: string }>) {
  const hit = await prisma.aiCache.findUnique({ where: { cacheKey: key } });
  if (hit && hit.expiresAt > new Date()) {
    const parsed = schema.safeParse(hit.result);
    if (parsed.success) return { data: parsed.data, provider: hit.provider, cached: true };
  }
  const fresh = await load();
  await prisma.aiCache.upsert({
    where: { cacheKey: key },
    create: {
      cacheKey: key,
      provider: fresh.provider,
      result: fresh.data as object,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
    update: {
      provider: fresh.provider,
      result: fresh.data as object,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });
  return { ...fresh, cached: false };
}

function applyStructure(base: PageDocument, structure: z.infer<typeof structureSchema>, briefing: Briefing) {
  const archetype = ARCHETYPES[briefing.segment] ?? ARCHETYPES.local;
  const palette = archetype.palettes[structure.paletteIndex % archetype.palettes.length];
  const next = generateDeterministic(
    { ...briefing, tone: structure.personality },
    structure.paletteIndex,
  );
  next.root.props.theme = {
    ...next.root.props.theme,
    personality: structure.personality,
    colors: { ...next.root.props.theme.colors, ...palette },
  };
  const byType = new Map(base.content.map((block) => [block.type, block]));
  const content: Block[] = [];
  for (const item of structure.blocks) {
    const source = byType.get(item.type) ?? next.content.find((block) => block.type === item.type);
    if (!source || source.type !== item.type) continue;
    const variants = VARIANTS[item.type] as readonly string[];
    const variant = variants.includes(item.variant) ? item.variant : source.props.variant;
    content.push({ ...source, props: { ...source.props, variant } } as Block);
  }
  if (content.length >= 4) next.content = content;
  return next;
}

function applyTexts(document: PageDocument, texts: z.infer<typeof textSchema>) {
  document.root.props.seo.title = texts.seoTitle || document.root.props.seo.title;
  document.root.props.seo.description = texts.seoDescription || document.root.props.seo.description;
  document.content = document.content.map((block, index) => {
    const text = texts.blocks[index];
    if (!text) return block;
    const props = { ...block.props } as Record<string, unknown>;
    for (const key of ["title", "subtitle", "eyebrow", "body", "note"] as const) {
      if (text[key] && key in props) props[key] = text[key];
    }
    if (text.items && Array.isArray(props.items)) {
      props.items = (props.items as Array<Record<string, unknown>>).map((item, itemIndex) => ({
        ...item,
        ...(text.items?.[itemIndex] ?? {}),
      }));
    }
    if (text.items && Array.isArray(props.points)) {
      props.points = (props.points as Array<Record<string, unknown>>).map((item, itemIndex) => ({
        ...item,
        ...(text.items?.[itemIndex] ?? {}),
      }));
    }
    return { ...block, props } as Block;
  });
  return document;
}

function applyMotion(document: PageDocument, presets: Array<(typeof PRESETS)[number]>) {
  document.content = document.content.map((block, index) => ({
    ...block,
    props: {
      ...block.props,
      animation: {
        ...block.props.animation,
        preset: presets[index] ?? block.props.animation.preset,
        trigger: block.type === "Hero" ? "load" : block.props.animation.trigger,
      },
    },
  })) as Block[];
  if (document.content[0]?.type === "Hero") {
    document.content[0] = {
      ...document.content[0],
      props: { ...document.content[0].props, animation: { ...document.content[0].props.animation, preset: "none" } },
    };
  }
  return document;
}

const DIRECTIONS = ["editorial e assimétrica", "ousada e contrastada", "acolhedora e orgânica"] as const;

export type Proposal = {
  label: string;
  direction: string;
  source: "ai" | "fallback";
  data: PageDocument;
};

export async function generateProposals(briefing: Briefing) {
  const proposals: Proposal[] = [];
  let warning: string | undefined;
  const started = Date.now();

  for (let direction = 0; direction < 3; direction += 1) {
    const fallback = generateDeterministic(briefing, direction);
    if (warning || Date.now() - started > 45000) {
      proposals.push({ label: `Proposta ${direction + 1}`, direction: DIRECTIONS[direction], source: "fallback", data: fallback });
      continue;
    }
    try {
      const base = fallback;
      const structure = await cached(cacheKey("structure", briefing, direction), structureSchema, () =>
        generateJSON(
          `Briefing: ${JSON.stringify(briefing)}. Direção criativa obrigatória: ${DIRECTIONS[direction]}. Escolha personalidade, índice de paleta e ordem de blocos dentre: ${BLOCK_TYPES.join(", ")}. Varie a estrutura. Não repita sempre hero, serviços e depoimentos.`,
          structureSchema,
          SYSTEM,
        ),
      );
      let document = applyStructure(base, structure.data, briefing);
      const texts = await cached(cacheKey("texts", briefing, direction), textSchema, () =>
        generateJSON(
          `Escreva textos curtos para esta página de ${briefing.clientName} (${briefing.segment}). Público: ${briefing.audience}. Tom: ${briefing.tone}. Diferenciais: ${briefing.differentials}. Serviços: ${briefing.services}. Blocos: ${document.content.map((block) => block.type).join(", ")}. Sem depoimentos inventados.`,
          textSchema,
          SYSTEM,
        ),
      );
      document = applyTexts(document, texts.data);
      const motion = await cached(cacheKey("motion", briefing, direction), motionSchema, () =>
        generateJSON(
          `Sugira ${document.content.length} presets de animação, um por bloco, usando apenas: ${PRESETS.join(", ")}. Personalidade: ${document.root.props.theme.personality}. O primeiro bloco (hero) deve ser none.`,
          motionSchema,
          SYSTEM,
        ),
      );
      document = applyMotion(document, motion.data.presets);
      document = enforceCompliance(pageDataSchema.parse(document), briefing.segment);
      proposals.push({ label: `Proposta ${direction + 1}`, direction: DIRECTIONS[direction], source: "ai", data: document });
    } catch (error) {
      if (isQuotaError(error) || (error instanceof Error && /ausente|API key|401/.test(error.message))) {
        warning = "A cota gratuita de IA acabou ou a chave não está configurada. As propostas seguintes saem do gerador local de arquétipos.";
      } else {
        warning = "A IA não devolveu um JSON válido. Esta proposta foi montada pelo gerador local.";
      }
      proposals.push({ label: `Proposta ${direction + 1}`, direction: DIRECTIONS[direction], source: "fallback", data: fallback });
    }
  }

  return { proposals, warning };
}

export async function rewriteBlock(briefing: Briefing, block: Block, mode: "text" | "style" | "section") {
  const fallback = generateDeterministic(briefing, mode === "style" ? 1 : 2);
  const replacement = fallback.content.find((item) => item.type === block.type) ?? block;
  if (mode === "style") {
    const variants = VARIANTS[block.type] as readonly string[];
    const current = variants.indexOf(block.props.variant);
    const variant = variants[(current + 1) % variants.length];
    return { ...block, props: { ...block.props, variant } } as Block;
  }
  try {
    const texts = await generateJSON(
      `Reescreva apenas o bloco ${block.type} de ${briefing.clientName}. Modo: ${mode}. Conteúdo atual: ${JSON.stringify(block.props)}. Sem depoimento ou foto inventados.`,
      textSchema,
      SYSTEM,
    );
    const document = applyTexts({ ...fallback, content: [block] }, texts.data);
    const next = enforceCompliance(pageDataSchema.parse({ ...document, content: document.content }), briefing.segment);
    return mode === "section" ? { ...replacement, props: { ...next.content[0].props, id: block.props.id } } as Block : (next.content[0] as Block);
  } catch {
    return mode === "text" ? replacement : ({ ...replacement, props: { ...replacement.props, id: block.props.id } } as Block);
  }
}
