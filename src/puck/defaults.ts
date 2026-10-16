import { generateDeterministic, sampleBlock } from "@/lib/ai/fallback";
import { buildPageTemplate } from "@/puck/page-templates";
import { BLOCK_TYPES, SEGMENTS, type BlockType, type PropsOf } from "@/puck/schema";

const blank = {
  clientName: "Nova página",
  audience: "",
  tone: "",
  differentials: "",
  services: "",
  colors: "",
  references: "",
  goal: "captar" as const,
  slug: "",
};

export function defaultPropsMap() {
  const map = new Map<BlockType, PropsOf<BlockType>>();
  for (const segment of SEGMENTS) {
    const document = generateDeterministic({ ...blank, segment }, 0);
    for (const block of document.content) {
      if (!map.has(block.type)) map.set(block.type, block.props);
    }
  }
  for (const type of BLOCK_TYPES) {
    if (!map.has(type)) map.set(type, sampleBlock(type).props);
  }
  return map;
}

export function blankDocument(clientName: string, segment: (typeof SEGMENTS)[number] = "local") {
  return buildPageTemplate("blank", clientName, segment);
}
