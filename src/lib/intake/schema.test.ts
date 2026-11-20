import { describe, expect, it } from "vitest";
import { buildPageTemplate } from "@/puck/page-templates";
import {
  applyIntakeToDocument,
  defaultTemplateForSegment,
  emptyIntake,
  INTAKE_FACTORY_LOOK,
  isFactoryLook,
} from "@/lib/intake/schema";

describe("intake defaults e tema do modelo", () => {
  it("escolhe o primeiro modelo do trio do segmento", () => {
    expect(defaultTemplateForSegment("barbearia")).toBe("navalha");
    expect(defaultTemplateForSegment("clinica")).toBe("essenza");
    expect(defaultTemplateForSegment("local")).not.toBe("classic");
  });

  it("emptyIntake herda visual do modelo do segmento", () => {
    const draft = emptyIntake({ segment: "barbearia", clientName: "Dom Corte" });
    expect(draft.templateId).toBe("navalha");
    expect(draft.fontDisplay).toBe("Bebas Neue");
    expect(isFactoryLook(draft)).toBe(false);
  });

  it("não sobrescreve tipografia do modelo quando o look ainda é o de fábrica", () => {
    const base = buildPageTemplate("navalha", "Dom Corte", "barbearia");
    expect(base.root.props.theme.fonts.display).toBe("Bebas Neue");

    const next = applyIntakeToDocument(base, {
      ...emptyIntake({ segment: "barbearia", clientName: "Dom Corte", templateId: "navalha" }),
      ...INTAKE_FACTORY_LOOK,
      clientName: "Dom Corte",
      segment: "barbearia",
      goal: "agendar",
      templateId: "navalha",
    });

    expect(next.root.props.theme.fonts.display).toBe("Bebas Neue");
    expect(next.root.props.theme.fonts.body).toBe(base.root.props.theme.fonts.body);
  });

  it("aplica visual customizado quando o cliente altera o look", () => {
    const base = buildPageTemplate("navalha", "Dom Corte", "barbearia");
    const next = applyIntakeToDocument(base, {
      ...emptyIntake({ segment: "barbearia", clientName: "Dom Corte", templateId: "navalha" }),
      clientName: "Dom Corte",
      goal: "agendar",
      personality: "minimal",
      fontDisplay: "Newsreader",
      fontBody: "Figtree",
      primaryColor: "#112233",
      backgroundColor: "#fafafa",
      bgArt: "dots",
    });

    expect(next.root.props.theme.fonts.display).toBe("Newsreader");
    expect(next.root.props.theme.colors.primary.toLowerCase()).toBe("#112233");
    expect(next.root.props.theme.bgArt).toBe("dots");
  });
});
