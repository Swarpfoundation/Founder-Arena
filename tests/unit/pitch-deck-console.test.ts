import { describe, expect, it } from "vitest";
import {
  EMPTY_PITCH_DATA,
  getDossierReadiness,
  getFundingAskRisk,
  getPitchSectionStatus,
  getReviewLaunchPresentation,
  getSubmissionGateState,
  getPitchValidationPresentation,
  PITCH_SECTION_CONFIGS,
  type PitchData,
} from "@/lib/game/pitch-deck-console";

const problemConfig = PITCH_SECTION_CONFIGS.find((section) => section.id === "problem")!;

function completePitch(overrides: Partial<PitchData> = {}): PitchData {
  return {
    problem: "A specific urgent customer problem with an expensive current workaround.",
    solution: "A focused solution that creates a believable product wedge for the first segment.",
    marketSize: "The SAM is measurable and reachable with a clear buyer budget.",
    product: "The MVP automates the core workflow and has a concrete roadmap.",
    businessModel: "Customers pay a subscription with credible gross margin and expansion potential.",
    goToMarket: "The first channel is targeted outbound to a narrow customer segment.",
    competition: "Alternatives exist, but the wedge is faster implementation and domain focus.",
    team: "The founder has domain experience and will recruit engineering.",
    financialPlan: "The plan maps burn, MRR, customers, and milestones over twelve months.",
    ask: "$500,000 seed round",
    useOfFunds: "40% product, 30% sales, 20% operations, and 10% reserve to reach measurable milestones.",
    ...overrides,
  };
}

describe("pitch deck console presentation helpers", () => {
  it("maps section status across empty, weak, adequate, and strong", () => {
    expect(getPitchSectionStatus("", problemConfig)).toBe("empty");
    expect(getPitchSectionStatus("too short", problemConfig)).toBe("weak");
    expect(getPitchSectionStatus("This has enough detail for validation.", problemConfig)).toBe("adequate");
    expect(getPitchSectionStatus("Specific customer pain. ".repeat(20), problemConfig)).toBe("strong");
  });

  it("scores dossier readiness from required field completion", () => {
    const empty = getDossierReadiness(EMPTY_PITCH_DATA);
    const complete = getDossierReadiness(completePitch());
    expect(empty.label).toBe("Dossier incomplete");
    expect(empty.missingCount).toBeGreaterThan(0);
    expect(complete.requiredComplete).toBe(10);
    expect(complete.score).toBeGreaterThanOrEqual(70);
  });

  it("flags missing or unsupported funding asks", () => {
    expect(getFundingAskRisk(completePitch({ ask: "", useOfFunds: "" }))).toMatchObject({ risk: "missing" });
    expect(getFundingAskRisk(completePitch({ ask: "a lot", useOfFunds: "hire", financialPlan: "thin" }))).toMatchObject({ risk: "unsupported" });
  });

  it("allows free users with weekly submissions remaining", () => {
    const gate = getSubmissionGateState({
      canSubmit: true,
      isFirstReview: false,
      weeklySubmission: {
        planId: "free",
        isPaid: false,
        freeLimit: 3,
        remainingFreeSubmissions: 2,
        submissionCreditsAvailable: 0,
        canSubmit: true,
        willUseCredit: false,
      },
    });
    expect(gate.status).toBe("open");
    expect(gate.weeklyLine).toContain("2/3");
  });

  it("shows credit launch for free users over cap with credits", () => {
    const gate = getSubmissionGateState({
      canSubmit: true,
      weeklySubmission: {
        planId: "free",
        isPaid: false,
        freeLimit: 3,
        remainingFreeSubmissions: 0,
        submissionCreditsAvailable: 1,
        canSubmit: true,
        willUseCredit: true,
      },
    });
    expect(gate.label).toBe("Credit Launch Available");
  });

  it("shows paid plan bypass for Pro/Max", () => {
    const gate = getSubmissionGateState({
      canSubmit: true,
      weeklySubmission: {
        planId: "pro",
        isPaid: true,
        freeLimit: 3,
        remainingFreeSubmissions: 0,
        submissionCreditsAvailable: 0,
        canSubmit: true,
        willUseCredit: false,
      },
    });
    expect(gate.weeklyLine).toContain("PRO plan bypasses");
  });

  it("maps review launch states", () => {
    expect(getReviewLaunchPresentation({ activeJob: { status: "queued" } })).toMatchObject({ status: "queued" });
    expect(getReviewLaunchPresentation({ latestReview: { decision: "reject", overallScore: 52 } })).toMatchObject({ status: "completed" });
    expect(getReviewLaunchPresentation({ hasPitch: true })).toMatchObject({ status: "ready" });
    expect(getReviewLaunchPresentation({ hasPitch: false })).toMatchObject({ status: "not_ready" });
  });

  it("preserves validation errors for display", () => {
    const presentation = getPitchValidationPresentation({ problem: "Problem must be at least 20 characters" });
    expect(presentation.hasErrors).toBe(true);
    expect(presentation.messages).toContain("Problem must be at least 20 characters");
  });
});
