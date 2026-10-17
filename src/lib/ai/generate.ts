import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ARCHETYPES } from "@/lib/ai/archetypes";
import { enforceCompliance } from "@/lib/ai/compliance";
import { generateDeterministic } from "@/lib/ai/fallback";
import { generateJSON, isQuotaError, providerOrder } from "@/lib/ai/provider";
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

const PERSONALITY_ALIASES: Record<string, (typeof PERSONALITIES)[number]> = {
  premium: "luxury",
  luxo: "luxury",
  sofisticada: "luxury",
  sofisticado: "luxury",
  ousada: "bold",
  ousado: "bold",
  contraste: "bold",
  acolhedora: "warm",
  acolhedor: "warm",
  orgânica: "organic",
  organica: "organic",
  editorial: "editorial",
  minimal: "minimal",
  minimalista: "minimal",
  brutalist: "brutalist",
  brutalista: "brutalist",
  luxury: "luxury",
  bold: "bold",
  warm: "warm",
  organic: "organic",
};

function resolveBlockType(raw: unknown): BlockType | null {
  if (typeof raw !== "string") return null;
  const key = raw.trim().toLowerCase();
  return BLOCK_TYPES.find((type) => type.toLowerCase() === key) ?? null;
}

function resolvePersonality(raw: unknown): (typeof PERSONALITIES)[number] {
  if (typeof raw !== "string") return "editorial";
  const key = raw.trim().toLowerCase();
  if ((PERSONALITIES as readonly string[]).includes(key)) return key as (typeof PERSONALITIES)[number];
  return PERSONALITY_ALIASES[key] ?? "editorial";
}

function resolveVariant(type: BlockType, raw: unknown) {
  const variants = VARIANTS[type] as readonly string[];
  if (typeof raw === "string" && variants.includes(raw)) return raw;
  if (typeof raw === "string") {
    const match = variants.find((item) => item.toLowerCase() === raw.trim().toLowerCase());
    if (match) return match;
  }
  return variants[0];
}

function coerceStructure(raw: unknown) {
  if (!raw || typeof raw !== "object") return raw;
  const input = raw as Record<string, unknown>;
  const blocks = Array.isArray(input.blocks)
    ? input.blocks
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const row = item as Record<string, unknown>;
          const type = resolveBlockType(row.type);
          if (!type) return null;
          return { type, variant: resolveVariant(type, row.variant) };
        })
        .filter((item): item is { type: BlockType; variant: string } => Boolean(item))
    : [];
  const paletteRaw = Number(input.paletteIndex);
  return {
    personality: resolvePersonality(input.personality),
    paletteIndex: Number.isFinite(paletteRaw) ? Math.max(0, Math.min(8, Math.round(paletteRaw))) : 0,
    blocks,
  };
}

const structureInputSchema = z.preprocess(coerceStructure, structureSchema) as z.ZodType<z.infer<typeof structureSchema>>;


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

const SYSTEM =
  "Você escreve landing pages em português do Brasil. Responda apenas JSON. Não invente depoimentos, nomes de clientes nem fotos de pessoas. Para advocacia, psicologia e clínicas, não prometa resultado, cura ou ganho de causa.";

function cacheKey(stage: string, briefing: Briefing, direction: number) {
  return createHash("sha256").update(JSON.stringify({ stage, briefing, direction, v: 2 })).digest("hex");
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

type GenerateState = {
  quotaExhausted: boolean;
  warning?: string;
  started: number;
  budgetMs: number;
};

async function generateOneProposal(briefing: Briefing, direction: number, state: GenerateState): Promise<Proposal> {
  const fallback = generateDeterministic(briefing, direction);
  const label = `Proposta ${direction + 1}`;
  const directionLabel = DIRECTIONS[direction];

  if (state.quotaExhausted || Date.now() - state.started > state.budgetMs) {
    if (!state.warning && Date.now() - state.started > state.budgetMs) {
      state.warning = "A geração por IA passou do tempo limite. As propostas restantes usam o gerador local.";
    }
    return { label, direction: directionLabel, source: "fallback", data: fallback };
  }

  try {
    const structure = await cached(cacheKey("structure", briefing, direction), structureSchema, () =>
      generateJSON(
        [
          `Briefing: ${JSON.stringify(briefing)}.`,
          `Direção criativa obrigatória: ${directionLabel}.`,
          `personality: um de [${PERSONALITIES.join(", ")}].`,
          "paletteIndex: inteiro 0-8.",
          `blocks: 5 a 9 itens; type exatamente um de [${BLOCK_TYPES.join(", ")}] (Cta, não CTA).`,
          "variant: string curta compatível com o tipo (ex.: Hero split|editorial|immersive).",
          "Inclua Navbar e Footer. Varie a ordem. Não invente types.",
        ].join(" "),
        structureInputSchema,
        SYSTEM,
      ),
    );
    let document = applyStructure(fallback, structure.data, briefing);
    const texts = await cached(cacheKey("texts", briefing, direction), textSchema, () =>
      generateJSON(
        `Escreva textos curtos para esta página de ${briefing.clientName} (${briefing.segment}). Público: ${briefing.audience}. Tom: ${briefing.tone}. Diferenciais: ${briefing.differentials}. Serviços: ${briefing.services}. Blocos: ${document.content.map((block) => block.type).join(", ")}. Sem depoimentos inventados. JSON: seoTitle, seoDescription, blocks[] com title/subtitle/eyebrow/body/note/items opcionais.`,
        textSchema,
        SYSTEM,
      ),
    );
    document = applyTexts(document, texts.data);
    const motionPresets = document.content.map((_, index) =>
      index === 0 ? "none" : (["fade", "slide-up", "stagger", "blur-in", "scale"] as const)[(index - 1) % 5],
    );
    document = applyMotion(document, motionPresets);
    document = enforceCompliance(pageDataSchema.parse(document), briefing.segment);
    return { label, direction: directionLabel, source: "ai", data: document };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isQuotaError(error)) {
      state.quotaExhausted = true;
      state.warning =
        "A cota gratuita de IA acabou. As propostas saem do gerador local de arquétipos.";
    } else if (/Nenhuma chave de IA configurada|invalid_api_key/i.test(message)) {
      state.quotaExhausted = true;
      state.warning = "Nenhuma chave de IA configurada. As propostas saem do gerador local de arquétipos.";
    } else if (!state.warning) {
      state.warning = "A IA falhou em pelo menos uma proposta; essas saíram do gerador local.";
    }
    return { label, direction: directionLabel, source: "fallback", data: fallback };
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function generateProposals(briefing: Briefing) {
  const fallbacks: Proposal[] = DIRECTIONS.map((direction, index) => ({
    label: `Proposta ${index + 1}`,
    direction,
    source: "fallback" as const,
    data: generateDeterministic(briefing, index),
  }));

  if (providerOrder().length === 0) {
    return {
      proposals: fallbacks,
      warning: "Nenhuma chave de IA configurada. As propostas saem do gerador local de arquétipos.",
    };
  }

  const state: GenerateState = {
    quotaExhausted: false,
    started: Date.now(),
    // Proxy Railway corta ~60s; respondemos bem antes para evitar 499.
    budgetMs: 22_000,
  };

  // 1 proposta via IA (rápida) + 2 arquétipos locais — evita 6 chamadas e timeout 499.
  try {
    const primary = await withTimeout(generateOneProposal(briefing, 0, state), 20_000);
    const proposals = [primary, fallbacks[1], fallbacks[2]];
    if (state.warning && primary.source === "ai" && /cota gratuita acabou/i.test(state.warning)) {
      state.warning = "Limite da cota gratuita atingido; parte das propostas usou o gerador local.";
    }
    if (primary.source === "fallback" && !state.warning) {
      state.warning = "A IA demorou ou falhou; as propostas usam o gerador local (ainda editáveis).";
    }
    return { proposals, warning: state.warning };
  } catch {
    return {
      proposals: fallbacks,
      warning: "A geração por IA passou do tempo limite. As propostas usam o gerador local.",
    };
  }
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
