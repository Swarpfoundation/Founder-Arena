import { describe, expect, it } from "vitest";
import { STARTUP_TEMPLATES } from "@/lib/onboarding/startup-templates";
import {
  buildDeploymentPreview,
  getArchetypePresentation,
  getBuilderSteps,
  getRegionCardPresentation,
  getSectorCardPresentation,
} from "@/lib/game/founder-builder";
import { SECTORS } from "@/lib/validations";

describe("founder builder presentation helpers", () => {
  it("defines the required founder builder step rail", () => {
    expect(getBuilderSteps().map((step) => step.id)).toEqual([
      "archetype",
      "market",
      "brief",
      "pitch",
      "deploy",
    ]);
  });

  it("maps existing templates into archetype cards without changing template data", () => {
    const template = STARTUP_TEMPLATES.find((item) => item.id === "ai-compliance-copilot")!;
    const archetype = getArchetypePresentation(template);

    expect(archetype).toMatchObject({
      id: template.id,
      sector: template.sector,
      region: template.region,
      fundingAsk: template.fundingAsk,
      tone: "cyan",
    });
    expect(archetype.name).toContain("AI Operator");
    expect(template.fundingAsk).toBe(750000);
  });

  it("creates game-native sector and region market cards", () => {
    const fintech = getSectorCardPresentation("Fintech");
    const europe = getRegionCardPresentation("Europe");

    expect(fintech).toMatchObject({
      id: "Fintech",
      label: "Fintech",
      risk: "regulatory pressure",
    });
    expect(europe).toMatchObject({
      id: "Europe",
      label: "Europe",
      risk: "privacy and compliance burden",
    });
  });

  it("builds deployment preview from selected template and form progress", () => {
    const template = STARTUP_TEMPLATES[0];
    const preview = buildDeploymentPreview({
      selectedTemplate: template,
      sector: template.sector,
      region: template.region,
      fundingAsk: template.fundingAsk,
      requiredFieldCount: 10,
      completedFieldCount: 10,
    });

    expect(preview).toMatchObject({
      runSeed: template.name,
      sector: template.sector,
      region: template.region,
      firstObjective: "Complete investor brief",
      phase: "Launch Signal",
      readinessLabel: "Deployment ready",
      fundingAskLabel: "$750,000",
    });
    expect(preview.riskTags).toContain("inference cost and hype risk");
  });

  it("keeps backend sector constants untouched", () => {
    expect(SECTORS).toEqual([
      "SaaS",
      "Fintech",
      "Healthtech",
      "AI / ML",
      "E-commerce",
      "Consumer",
      "Enterprise",
      "Climate",
      "EdTech",
      "Other",
    ]);
  });
});
