import { describe, expect, it } from "vitest";
import { normalizePageTag, parsePageTags, segmentLabel } from "@/lib/segment-labels";

describe("segmentLabel", () => {
  it("traduz segmentos conhecidos", () => {
    expect(segmentLabel("moda")).toBe("Moda");
    expect(segmentLabel("advocacia")).toBe("Advocacia");
  });
});

describe("parsePageTags", () => {
  it("normaliza, deduplica e limita", () => {
    expect(parsePageTags([" VIP ", "vip", "CLI-12", ""])).toEqual(["VIP", "CLI-12"]);
    expect(normalizePageTag("  prioridade  ")).toBe("prioridade");
  });
});
