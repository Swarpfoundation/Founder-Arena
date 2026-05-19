import { describe, expect, it } from "vitest";
import {
  formatDealAmount,
  formatEquityPercent,
  getClauseRiskCards,
  getFounderControlRisk,
  getNegotiationCtas,
  getTermSheetStatusPresentation,
} from "@/lib/game/term-sheet-scene";

describe("term sheet scene presentation helpers", () => {
  it("maps live, accepted, declined, no-term, and pending states", () => {
    expect(getTermSheetStatusPresentation({ termSheet: { status: "proposed" } })).toMatchObject({
      status: "live",
      label: "OFFER LIVE",
    });
    expect(getTermSheetStatusPresentation({ termSheet: { status: "accepted" } })).toMatchObject({
      status: "accepted",
      label: "CAPITAL SECURED",
    });
    expect(getTermSheetStatusPresentation({ termSheet: { status: "rejected" } })).toMatchObject({
      status: "declined",
      label: "DEAL DECLINED",
    });
    expect(getTermSheetStatusPresentation({ termSheet: null, error: "Review is not investable" })).toMatchObject({
      status: "locked",
      label: "TERMS LOCKED",
    });
    expect(getTermSheetStatusPresentation({ termSheet: null, error: "No VC review found" })).toMatchObject({
      status: "pending",
      label: "INVESTOR VERDICT PENDING",
    });
  });

  it("maps founder control risk from equity, board, and liquidation terms", () => {
    expect(getFounderControlRisk({ equityPercent: 8, boardSeat: false, liquidationPreference: 1 })).toMatchObject({
      risk: "low",
      founderOwnershipAfter: 92,
    });
    expect(getFounderControlRisk({ equityPercent: 18, boardSeat: false, liquidationPreference: 1 })).toMatchObject({
      risk: "normal",
    });
    expect(getFounderControlRisk({ equityPercent: 25, boardSeat: false, liquidationPreference: 1 })).toMatchObject({
      risk: "high",
    });
    expect(getFounderControlRisk({ equityPercent: 24, boardSeat: true, liquidationPreference: 1.5 })).toMatchObject({
      risk: "severe",
      investorInfluence: "Board vote active",
    });
  });

  it("builds clause risk cards for governance and investor clauses", () => {
    const cards = getClauseRiskCards({
      boardSeat: true,
      boardObserver: true,
      proRataRights: true,
      liquidationPreference: 1.5,
      founderSalaryCap: 120000,
      milestoneRequirements: "Reach $50K MRR in 6 months.",
    });

    expect(cards.map((card) => card.id)).toEqual([
      "board-seat",
      "board-observer",
      "pro-rata",
      "liquidation",
      "salary-cap",
      "milestones",
    ]);
    expect(cards.find((card) => card.id === "liquidation")).toMatchObject({ risk: "high" });
  });

  it("returns accepted and no-term CTA sets", () => {
    expect(getNegotiationCtas({ startupId: "startup_1", status: "accepted" }).map((cta) => cta.label)).toContain("Enter Week 1");
    expect(getNegotiationCtas({ startupId: "startup_1", status: "locked" }).map((cta) => cta.label)).toContain("Return To Review");
  });

  it("formats missing or partial deal values safely", () => {
    expect(formatDealAmount(undefined)).toBe("$0");
    expect(formatEquityPercent(null)).toBe("0%");
  });
});
