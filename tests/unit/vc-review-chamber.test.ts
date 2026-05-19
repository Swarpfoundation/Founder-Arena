import { describe, expect, it } from "vitest";
import {
  buildInvestorSeatCards,
  getReviewStatusScenePresentation,
  getTermSheetVaultPresentation,
  getVerdictPresentation,
  hasGuardrailAdjustment,
} from "@/lib/game/vc-review-chamber";

describe("VC review chamber presentation helpers", () => {
  it("maps accept, conditional, and reject verdicts to distinct tones", () => {
    expect(getVerdictPresentation("accept")).toMatchObject({ label: "ACCEPTED", tone: "emerald" });
    expect(getVerdictPresentation("proposal")).toMatchObject({ label: "ACCEPTED", tone: "emerald" });
    expect(getVerdictPresentation("conditional")).toMatchObject({ label: "CONDITIONAL", tone: "amber" });
    expect(getVerdictPresentation("revise")).toMatchObject({ label: "CONDITIONAL", tone: "amber" });
    expect(getVerdictPresentation("reject")).toMatchObject({ label: "REJECTED", tone: "rose" });
  });

  it("maps queued/running/retrying/failed states to game-native scene copy", () => {
    expect(getReviewStatusScenePresentation("queued")).toMatchObject({
      label: "QUEUED",
      eyebrow: "Investor Chamber Queue",
      tone: "cyan",
    });
    expect(getReviewStatusScenePresentation("running")).toMatchObject({
      label: "REVIEWING",
      eyebrow: "Partner Table Active",
      tone: "violet",
    });
    expect(getReviewStatusScenePresentation("retrying")).toMatchObject({
      label: "RETRYING",
      tone: "amber",
    });
    expect(getReviewStatusScenePresentation("failed")).toMatchObject({
      label: "FAILED",
      summary: expect.stringContaining("pipeline issue"),
      tone: "rose",
    });
  });

  it("shows guardrail notice when model recommendation differs from final decision", () => {
    expect(hasGuardrailAdjustment("accept", "conditional")).toBe(true);
    expect(hasGuardrailAdjustment("reject", "reject")).toBe(false);
    expect(hasGuardrailAdjustment(undefined, "reject")).toBe(false);
  });

  it("builds deterministic fictional investor role cards from dimensions", () => {
    const seats = buildInvestorSeatCards({
      market: { score: 82, evidence: ["Large urgent market."], concerns: ["Crowded category."], confidence: "high" },
      solution: { score: 63, evidence: ["Clear wedge."], concerns: ["Differentiation still early."], confidence: "medium" },
      team: { score: 44, evidence: ["Technical founder."], concerns: ["No GTM lead."], confidence: "medium" },
      problem: { score: 75, evidence: ["Pain is frequent."], concerns: ["Buyer urgency needs proof."], confidence: "high" },
      business: { score: 50, evidence: ["Pricing named."], concerns: ["Unit economics thin."], confidence: "low" },
    });

    expect(seats.map((seat) => seat.role)).toEqual([
      "Market Partner",
      "Product Partner",
      "Operator Partner",
      "Risk Partner",
      "Deal Partner",
    ]);
    expect(seats.find((seat) => seat.dimension === "market")).toMatchObject({ stance: "bullish" });
    expect(seats.find((seat) => seat.dimension === "team")).toMatchObject({ stance: "bearish" });
  });

  it("locks or unlocks the term sheet vault without changing review logic", () => {
    expect(getTermSheetVaultPresentation({ finalDecision: "accept", hasTermSheet: true })).toMatchObject({
      locked: false,
      label: "TERM SHEET VAULT OPEN",
      ctaLabel: "View Terms",
    });
    expect(getTermSheetVaultPresentation({ finalDecision: "conditional", hasTermSheet: false })).toMatchObject({
      locked: true,
      label: "TERM SHEET LOCKED",
    });
    expect(getTermSheetVaultPresentation({
      finalDecision: "reject",
      hasTermSheet: false,
      noTermSheetReason: "Problem evidence is too weak.",
    })).toMatchObject({
      locked: true,
      label: "NO TERM SHEET GENERATED",
      description: "Problem evidence is too weak.",
    });
  });

  it("does not include raw provider payload or prompt-shaped fields in status presentation", () => {
    const presentation = getReviewStatusScenePresentation("failed");
    expect(JSON.stringify(presentation).toLowerCase()).not.toContain("prompt");
    expect(JSON.stringify(presentation).toLowerCase()).not.toContain("api_key");
    expect(JSON.stringify(presentation).toLowerCase()).not.toContain("payload");
  });
});
