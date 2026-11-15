import { describe, expect, it } from "vitest";
import { generateLockedTemplate } from "@/lib/ai/generate";
import type { Briefing } from "@/puck/schema";

const briefing: Briefing = {
  clientName: "Casa Norte",
  segment: "local",
  audience: "",
  tone: "",
  differentials: "",
  services: "Projeto de interiores",
  colors: "",
  references: "",
  goal: "captar",
  slug: "casa-norte",
  address: "",
  whatsapp: "",
  templateId: "",
  headline: "",
  tagline: "",
  backgroundColor: "",
};

describe("generateLockedTemplate", () => {
  it("devolve o gerador local quando nenhum modelo foi escolhido", async () => {
    const result = await generateLockedTemplate(briefing);
    expect(result.source).toBe("fallback");
    expect(result.data.content.length).toBeGreaterThan(0);
    expect(result.data.root.props.seo.title.length).toBeGreaterThan(0);
  });
});
