import { SEGMENTS } from "@/puck/schema";

const LABELS: Record<(typeof SEGMENTS)[number], string> = {
  moda: "Moda",
  portfolio: "Portfólio",
  advocacia: "Advocacia",
  psicologia: "Psicologia",
  clinica: "Clínica",
  restaurante: "Restaurante",
  barbearia: "Barbearia",
  infoproduto: "Infoproduto",
  local: "Negócio local",
};

export function segmentLabel(segment: string) {
  if ((SEGMENTS as readonly string[]).includes(segment)) {
    return LABELS[segment as (typeof SEGMENTS)[number]];
  }
  return segment;
}

export function normalizePageTag(raw: string) {
  return raw.trim().replace(/\s+/g, " ").slice(0, 40);
}

export function parsePageTags(raw: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const tag = normalizePageTag(item);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= 12) break;
  }
  return out;
}
