import { describe, expect, it } from "vitest";
import { applyModelSeed } from "@/lib/ai/model-seeds";
import { PAGE_TEMPLATE_IDS } from "@/puck/page-templates-ids";
import type { Block } from "@/puck/schema";

function skeleton(): Block[] {
  return [
    { type: "Hero", props: { title: "BASE", subtitle: "", eyebrow: "" } },
    { type: "Footer", props: { note: "BASE" } },
  ] as Block[];
}

describe("applyModelSeed / seedFromCatalog", () => {
  it("cobre todos os modelos do catálogo com copy de hero", () => {
    for (const id of PAGE_TEMPLATE_IDS) {
      const [hero] = applyModelSeed(skeleton(), id, "Marca Teste");
      expect(hero?.type).toBe("Hero");
      if (hero?.type !== "Hero") continue;
      expect(hero.props.title.trim().length).toBeGreaterThan(0);
      expect(hero.props.title).not.toBe("BASE");
    }
  });

  it("preenche {nome} nos seeds artesanais e de catálogo", () => {
    const [hero] = applyModelSeed(skeleton(), "vitrine", "Casa Norte");
    expect(hero?.type).toBe("Hero");
    if (hero?.type === "Hero") {
      expect(hero.props.title.toLowerCase()).toContain("casa norte");
    }
  });
});
