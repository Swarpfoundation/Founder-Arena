import { describe, it, expect } from "vitest";
import {
  STARTUP_TEMPLATES,
  getTemplateById,
  getFundingAskGuidance,
} from "@/lib/onboarding/startup-templates";
import { generatePitchDraft, PITCH_QUALITY_HINTS } from "@/lib/onboarding/pitch-draft";
import { getNextBestActionForStartup } from "@/lib/onboarding/progress";
import { isDemoSamplesEnabled } from "@/lib/onboarding/demo-samples";

describe("startup templates", () => {
  it("has 12 templates", () => {
    expect(STARTUP_TEMPLATES.length).toBe(12);
  });

  it("each template has required fields", () => {
    for (const t of STARTUP_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.sector).toBeTruthy();
      expect(t.region).toBeTruthy();
      expect(t.description.length).toBeGreaterThan(10);
      expect(t.problem.length).toBeGreaterThan(20);
      expect(t.solution.length).toBeGreaterThan(20);
      expect(t.monetizationModel).toBeTruthy();
      expect(t.unfairAdvantage).toBeTruthy();
      expect(t.fundingAsk).toBeGreaterThanOrEqual(25000);
      expect(t.fundingAsk).toBeLessThanOrEqual(10000000);
      expect(t.riskNote).toBeTruthy();
      expect(t.whyInteresting).toBeTruthy();
    }
  });

  it("getTemplateById returns correct template", () => {
    const t = getTemplateById("ai-compliance-copilot");
    expect(t).toBeDefined();
    expect(t?.name).toBe("ReguLens");
  });

  it("getTemplateById returns undefined for unknown id", () => {
    expect(getTemplateById("nonexistent")).toBeUndefined();
  });

  it("funding ask guidance returns sector-specific text", () => {
    const ai = getFundingAskGuidance("AI / ML");
    expect(ai).toContain("AI/ML");
    const fallback = getFundingAskGuidance("Unknown Sector");
    expect(fallback).toContain("500K");
  });
});

describe("pitch draft generation", () => {
  const input = {
    name: "TestCo",
    sector: "SaaS",
    description: "A test startup that does testing.",
    targetMarket: "QA engineers at mid-market SaaS companies",
    problem: "Testing is slow and expensive.",
    solution: "We automate testing with AI.",
    monetizationModel: "SaaS subscription per seat.",
    unfairAdvantage: "Founder was head of QA at Google.",
    fundingAsk: 750000,
  };

  it("generates all 11 pitch sections", () => {
    const draft = generatePitchDraft(input);
    expect(draft.problem).toContain("Testing is slow");
    expect(draft.solution).toContain("automate testing");
    expect(draft.marketSize).toContain("TAM");
    expect(draft.product).toContain("TestCo");
    expect(draft.businessModel).toContain("SaaS subscription");
    expect(draft.goToMarket).toContain("narrow");
    expect(draft.competition).toContain("Incumbents");
    expect(draft.team).toContain("Google");
    expect(draft.financialPlan).toContain("MRR");
    expect(draft.ask).toContain("$750,000");
    expect(draft.useOfFunds).toContain("40%");
  });

  it("includes market size estimates based on sector", () => {
    const draft = generatePitchDraft(input);
    expect(draft.marketSize).toContain("$200B+"); // SaaS TAM
  });

  it("pitch quality hints cover all fields", () => {
    const keys = Object.keys(PITCH_QUALITY_HINTS);
    expect(keys.length).toBe(11);
    expect(keys).toContain("problem");
    expect(keys).toContain("useOfFunds");
  });
});

describe("next best action logic", () => {
  it("returns create startup when no startup", () => {
    const action = getNextBestActionForStartup(null);
    expect(action?.label).toBe("Create a startup");
    expect(action?.href).toBe("/startup/new");
  });

  it("returns build pitch when startup has no pitch", () => {
    const action = getNextBestActionForStartup({
      id: "s1",
      status: "draft",
      pitchDeck: null,
    });
    expect(action?.label).toBe("Build pitch deck");
    expect(action?.href).toBe("/startup/s1/pitch");
  });

  it("returns submit to VC when pitch exists but no review", () => {
    const action = getNextBestActionForStartup({
      id: "s1",
      status: "pitching",
      pitchDeck: { id: "pd1" },
      vcReviews: [],
    });
    expect(action?.label).toBe("Submit to AI VC");
  });

  it("returns review terms when review exists but no term sheet", () => {
    const action = getNextBestActionForStartup({
      id: "s1",
      status: "pitching",
      pitchDeck: { id: "pd1" },
      vcReviews: [{ id: "vr1" }],
      termSheets: [],
      fundingRounds: [],
    });
    expect(action?.label).toBe("Review term sheet");
  });

  it("returns close round when term sheet exists but no funding", () => {
    const action = getNextBestActionForStartup({
      id: "s1",
      status: "pitching",
      pitchDeck: { id: "pd1" },
      vcReviews: [{ id: "vr1" }],
      termSheets: [{ id: "ts1", status: "proposed" }],
      fundingRounds: [],
    });
    expect(action?.label).toBe("Close your round");
  });

  it("returns run first month when funded but no sim month", () => {
    const action = getNextBestActionForStartup({
      id: "s1",
      status: "funded",
      pitchDeck: { id: "pd1" },
      vcReviews: [{ id: "vr1" }],
      termSheets: [{ id: "ts1", status: "accepted" }],
      fundingRounds: [{ id: "fr1" }],
      simulationMonths: [],
      employees: [],
    });
    expect(action?.label).toBe("Run first sprint");
  });

  it("returns hire employee when sim exists but no employees", () => {
    const action = getNextBestActionForStartup({
      id: "s1",
      status: "active",
      pitchDeck: { id: "pd1" },
      vcReviews: [{ id: "vr1" }],
      termSheets: [{ id: "ts1", status: "accepted" }],
      fundingRounds: [{ id: "fr1" }],
      simulationMonths: [{ id: "sm1" }],
      employees: [],
    });
    expect(action?.label).toBe("Hire your first employee");
  });

  it("returns continue operating when active with team", () => {
    const action = getNextBestActionForStartup({
      id: "s1",
      status: "active",
      pitchDeck: { id: "pd1" },
      vcReviews: [{ id: "vr1" }],
      termSheets: [{ id: "ts1", status: "accepted" }],
      fundingRounds: [{ id: "fr1" }],
      simulationMonths: [{ id: "sm1" }],
      employees: [{ id: "e1", status: "active" }],
    });
    expect(action?.label).toBe("Continue operating");
  });

  it("returns start new startup when completed", () => {
    const action = getNextBestActionForStartup({
      id: "s1",
      status: "completed",
      pitchDeck: { id: "pd1" },
      vcReviews: [{ id: "vr1" }],
      termSheets: [{ id: "ts1", status: "accepted" }],
      fundingRounds: [{ id: "fr1" }],
      simulationMonths: [{ id: "sm1" }],
      employees: [{ id: "e1", status: "active" }],
    });
    expect(action?.label).toBe("Start new startup");
  });
});

describe("demo samples safety", () => {
  it("isDemoSamplesEnabled respects env", () => {
    // In test environment (NODE_ENV=test), this should be true
    expect(isDemoSamplesEnabled()).toBe(true);
  });
});
