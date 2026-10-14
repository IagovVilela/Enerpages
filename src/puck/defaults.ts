import { generateDeterministic } from "@/lib/ai/fallback";
import { SEGMENTS, type BlockType, type PropsOf } from "@/puck/schema";

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
  return map;
}

export function blankDocument(clientName: string, segment: (typeof SEGMENTS)[number] = "local") {
  return generateDeterministic({ ...blank, clientName, segment }, 0);
}
