import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ARCHETYPES, directionLabelFor } from "@/lib/ai/archetypes";
import { isPageTemplateId, resolveProposalTemplate } from "@/lib/ai/template-styles";
import { pageDiversitySignature } from "@/lib/ai/resolve-recipe";
import { buildPageTemplate, PAGE_TEMPLATE_META } from "@/puck/page-templates";
import { enforceCompliance } from "@/lib/ai/compliance";
import { generateDeterministic } from "@/lib/ai/fallback";
import { generateJSON, isQuotaError, providerOrder } from "@/lib/ai/provider";
import {
  PERSONALITIES,
  PRESETS,
  VARIANTS,
  pageDataSchema,
  type Block,
  type Briefing,
  type PageDocument,
} from "@/puck/schema";

const structureSchema = z.object({
  templateId: z.string(),
  personality: z.enum(PERSONALITIES),
  paletteIndex: z.number().int().min(0).max(8),
  entrance: z.enum(["none", "curtain", "wipe"]),
  heroVariant: z.string(),
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

function resolvePersonality(raw: unknown): (typeof PERSONALITIES)[number] {
  if (typeof raw !== "string") return "editorial";
  const key = raw.trim().toLowerCase();
  if ((PERSONALITIES as readonly string[]).includes(key)) return key as (typeof PERSONALITIES)[number];
  return PERSONALITY_ALIASES[key] ?? "editorial";
}

function coerceStructure(raw: unknown) {
  if (!raw || typeof raw !== "object") return raw;
  const input = raw as Record<string, unknown>;
  const paletteRaw = Number(input.paletteIndex);
  const heroRaw = typeof input.heroVariant === "string" ? input.heroVariant.trim() : "";
  const heroVariant = (VARIANTS.Hero as readonly string[]).find((item) => item.toLowerCase() === heroRaw.toLowerCase()) ?? "";
  return {
    templateId: typeof input.templateId === "string" ? input.templateId.trim() : "",
    personality: resolvePersonality(input.personality),
    paletteIndex: Number.isFinite(paletteRaw) ? Math.max(0, Math.min(8, Math.round(paletteRaw))) : 0,
    entrance: input.entrance === "curtain" || input.entrance === "wipe" ? input.entrance : "none",
    heroVariant,
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
  // v8: recipe + seedFromCatalog + headline do briefing vence seed na dir 0
  return createHash("sha256").update(JSON.stringify({ stage, briefing, direction, v: 8 })).digest("hex");
}

function ensureProposalDiversity(proposals: Proposal[], briefing: Briefing): Proposal[] {
  const next = [...proposals];
  const seen = new Set<string>();
  for (let index = 0; index < next.length; index += 1) {
    let signature = pageDiversitySignature(next[index]!.data);
    if (!seen.has(signature)) {
      seen.add(signature);
      continue;
    }
    // Colisão rara (ex.: IA caiu no mesmo esqueleto): regenera direção local distinta.
    for (const alt of [0, 1, 2, 3, 4, 5]) {
      const data = generateDeterministic(briefing, alt);
      signature = pageDiversitySignature(data);
      if (seen.has(signature)) continue;
      next[index] = {
        ...next[index]!,
        source: "fallback",
        templateId: resolveProposalTemplate(briefing, alt),
        direction: proposalDirectionLabel(briefing, alt),
        data,
      };
      seen.add(signature);
      break;
    }
  }
  return next;
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

function applyStructure(
  structure: z.infer<typeof structureSchema>,
  briefing: Briefing,
  direction: number,
) {
  // Anatomia vem do trio do segmento (ou modelo preferido na dir 0) — a IA não troca o esqueleto.
  const templateId = resolveProposalTemplate(briefing, direction);
  const archetype = ARCHETYPES[briefing.segment] ?? ARCHETYPES.local;
  const palette = archetype.palettes[structure.paletteIndex % archetype.palettes.length];
  const next = generateDeterministic(
    { ...briefing, templateId, personality: structure.personality },
    direction,
  );
  next.root.props.theme = {
    ...next.root.props.theme,
    personality: structure.personality,
    entrance: structure.entrance,
    colors: { ...next.root.props.theme.colors, ...palette },
  };
  if (!structure.heroVariant) return next;
  next.content = next.content.map((block) => {
    if (block.type !== "Hero") return block;
    const variants = VARIANTS.Hero as readonly string[];
    const variant = variants.includes(structure.heroVariant) ? structure.heroVariant : block.props.variant;
    return { ...block, props: { ...block.props, variant } } as Block;
  });
  return next;
}

const ITEM_COPY_KEYS = ["title", "description", "quote", "name", "role", "text", "label", "body"] as const;

function overlayCopy(item: Record<string, unknown>, patch: Record<string, string> | undefined) {
  if (!patch) return item;
  const next = { ...item };
  for (const key of ITEM_COPY_KEYS) {
    const value = patch[key];
    if (value) next[key] = value;
  }
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
      props.items = (props.items as Array<Record<string, unknown>>).map((item, itemIndex) =>
        overlayCopy(item, text.items?.[itemIndex]),
      );
    }
    if (text.items && Array.isArray(props.points)) {
      props.points = (props.points as Array<Record<string, unknown>>).map((item, itemIndex) =>
        overlayCopy(item, text.items?.[itemIndex]),
      );
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

export type Proposal = {
  label: string;
  direction: string;
  source: "ai" | "fallback";
  templateId: string;
  data: PageDocument;
};

type GenerateState = {
  quotaExhausted: boolean;
  warning?: string;
  started: number;
  budgetMs: number;
};

function proposalDirectionLabel(briefing: Briefing, direction: number) {
  const templateId = resolveProposalTemplate(briefing, direction);
  const templateLabel = PAGE_TEMPLATE_META.find((item) => item.id === templateId)?.label;
  return directionLabelFor(briefing.segment, direction, templateLabel);
}

async function generateOneProposal(briefing: Briefing, direction: number, state: GenerateState): Promise<Proposal> {
  const fallback = generateDeterministic(briefing, direction);
  const label = `Proposta ${direction + 1}`;
  const directionLabel = proposalDirectionLabel(briefing, direction);
  const templateId = resolveProposalTemplate(briefing, direction);

  if (state.quotaExhausted || Date.now() - state.started > state.budgetMs) {
    if (!state.warning && Date.now() - state.started > state.budgetMs) {
      state.warning = "A geração por IA passou do tempo limite. As propostas restantes usam o gerador local.";
    }
    return { label, direction: directionLabel, source: "fallback", templateId, data: fallback };
  }

  try {
    const lockedTemplate = templateId;
    const structure = await cached(cacheKey("structure", briefing, direction), structureSchema, () =>
      generateJSON(
        [
          `Briefing: ${JSON.stringify(briefing)}.`,
          `Direção criativa obrigatória: ${directionLabel}.`,
          "Responda em JSON, sem inventar blocos nem HTML.",
          `Anatomia fixa: templateId deve ser exatamente "${lockedTemplate}" (já escolhido para esta proposta).`,
          `Vibe: personality um de [${PERSONALITIES.join(", ")}]; paletteIndex inteiro 0-8; entrance "none", "curtain" ou "wipe"; heroVariant um de [${VARIANTS.Hero.join(", ")}] — prefira variantes tipográficas (banner, split, editorial, light, asymmetric) se não houver foto.`,
          "O modelo já define a ordem das seções. Não devolva lista de blocks.",
        ].join(" "),
        structureInputSchema,
        SYSTEM,
      ),
    );
    let document = applyStructure(
      { ...structure.data, templateId: lockedTemplate },
      briefing,
      direction,
    );
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
    return { label, direction: directionLabel, source: "ai", templateId, data: document };
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
    return { label, direction: directionLabel, source: "fallback", templateId, data: fallback };
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

/** Mantém o modelo escolhido e pede só os textos. Se a IA falhar, devolve o modelo intacto. */
export async function generateLockedTemplate(briefing: Briefing): Promise<{
  data: PageDocument;
  source: "ai" | "fallback";
  warning?: string;
}> {
  const templateId = isPageTemplateId(briefing.templateId) ? briefing.templateId : null;
  const base = templateId
    ? buildPageTemplate(templateId, briefing.clientName, briefing.segment)
    : generateDeterministic(briefing, 0);

  if (!templateId) {
    return { data: base, source: "fallback" };
  }
  if (providerOrder().length === 0) {
    return {
      data: base,
      source: "fallback",
      warning: "Nenhuma chave de IA configurada. A página saiu do modelo.",
    };
  }

  try {
    const texts = await cached(cacheKey("template-texts", briefing, 0), textSchema, () =>
      generateJSON(
        [
          `Reescreva os textos da página de ${briefing.clientName} (${briefing.segment}).`,
          `Público: ${briefing.audience || "não informado"}.`,
          `Tom: ${briefing.tone || "o tom do modelo"}.`,
          `Diferenciais: ${briefing.differentials || "não informados"}.`,
          `Serviços: ${briefing.services || "não informados"}.`,
          `Objetivo: ${briefing.goal}.`,
          `Blocos, nesta ordem: ${base.content.map((block) => block.type).join(", ")}.`,
          "Mantenha a quantidade de items de cada bloco.",
          "Se um título tiver *trecho*, preserve um trecho curto entre asteriscos.",
          "Sem depoimentos inventados, sem nomes de clientes e sem promessa de resultado.",
          "JSON: seoTitle, seoDescription, blocks[] com title, subtitle, eyebrow, body, note e items opcionais.",
        ].join(" "),
        textSchema,
        SYSTEM,
      ),
    );
    const document = applyTexts(structuredClone(base), texts.data);
    return {
      data: enforceCompliance(pageDataSchema.parse(document), briefing.segment),
      source: "ai",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const warning = isQuotaError(error)
      ? "A cota de IA acabou. A página saiu do modelo, sem texto novo."
      : /Tempo esgotado|timeout/i.test(message)
        ? "A IA não respondeu a tempo. A página saiu do modelo."
        : "A IA falhou. A página saiu do modelo.";
    return { data: base, source: "fallback", warning };
  }
}

function logGenerationTelemetry(
  briefing: Briefing,
  proposals: Proposal[],
  warning?: string,
) {
  console.info(
    "[generateProposals]",
    JSON.stringify({
      segment: briefing.segment,
      goal: briefing.goal,
      sources: proposals.map((item) => item.source),
      templates: proposals.map((item) => item.templateId),
      warning: warning || null,
    }),
  );
}

export async function generateProposals(briefing: Briefing) {
  const fallbacks: Proposal[] = [0, 1, 2].map((index) => ({
    label: `Proposta ${index + 1}`,
    direction: proposalDirectionLabel(briefing, index),
    source: "fallback" as const,
    templateId: resolveProposalTemplate(briefing, index),
    data: generateDeterministic(briefing, index),
  }));

  if (providerOrder().length === 0) {
    const proposals = ensureProposalDiversity(fallbacks, briefing);
    const warning = "Nenhuma chave de IA configurada. As propostas saem do gerador local de arquétipos.";
    logGenerationTelemetry(briefing, proposals, warning);
    return { proposals, warning };
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
    const proposals = ensureProposalDiversity([primary, fallbacks[1]!, fallbacks[2]!], briefing);
    if (state.warning && primary.source === "ai" && /cota gratuita acabou/i.test(state.warning)) {
      state.warning = "Limite da cota gratuita atingido; parte das propostas usou o gerador local.";
    }
    if (primary.source === "fallback" && !state.warning) {
      state.warning = "A IA demorou ou falhou; as propostas usam o gerador local (ainda editáveis).";
    }
    logGenerationTelemetry(briefing, proposals, state.warning);
    return { proposals, warning: state.warning };
  } catch {
    const proposals = ensureProposalDiversity(fallbacks, briefing);
    const warning = "A geração por IA passou do tempo limite. As propostas usam o gerador local.";
    logGenerationTelemetry(briefing, proposals, warning);
    return { proposals, warning };
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
