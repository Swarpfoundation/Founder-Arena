import { describe, it, expect } from "vitest";
import { generateTermSheet } from "@/lib/terms/generate-term-sheet";
import { evaluateCounterOffer } from "@/lib/terms/negotiation";

describe("generateTermSheet", () => {
  it("generates reasonable terms for a high-scoring startup", () => {
    const ts = generateTermSheet({
      startupId: "s1",
      vcReviewId: "r1",
      vcDecision: "proposal",
      overallScore: 85,
      riskScore: 30,
      marketScore: 80,
      investorScore: 80,
      proposedAmount: 1000000,
      proposedEquity: 15,
      fundingAsk: 1000000,
      sector: "SaaS",
    });

    expect(ts.proposedAmount).toBe(1000000);
    expect(ts.proposedEquity).toBe(15);
    expect(ts.preMoneyValuation).toBeGreaterThan(0);
    expect(ts.postMoneyValuation).toBeGreaterThan(ts.preMoneyValuation);
    expect(ts.liquidationPreference).toBe(1.0);
    expect(ts.proRataRights).toBe(true);
    expect(ts.founderSalaryCap).toBeGreaterThan(0);
  });

  it("applies higher liquidation preference for risky startups", () => {
    const ts = generateTermSheet({
      startupId: "s1",
      vcReviewId: "r1",
      vcDecision: "proposal",
      overallScore: 60,
      riskScore: 80,
      marketScore: 50,
      investorScore: 50,
      proposedAmount: null,
      proposedEquity: null,
      fundingAsk: 500000,
      sector: "Healthtech",
    });

    expect(ts.liquidationPreference).toBeGreaterThanOrEqual(1.5);
    expect(ts.proposedEquity).toBeGreaterThan(10);
  });

  it("includes milestones for deep-tech sectors", () => {
    const ts = generateTermSheet({
      startupId: "s1",
      vcReviewId: "r1",
      vcDecision: "proposal",
      overallScore: 70,
      riskScore: 50,
      marketScore: 60,
      investorScore: 60,
      proposedAmount: null,
      proposedEquity: null,
      fundingAsk: 750000,
      sector: "AI / ML",
    });

    expect(ts.milestoneRequirements).toBeDefined();
    expect(ts.milestoneRequirements).toContain("MVP");
  });

  it("calculates post-money = pre-money + amount", () => {
    const ts = generateTermSheet({
      startupId: "s1",
      vcReviewId: "r1",
      vcDecision: "proposal",
      overallScore: 70,
      riskScore: 50,
      marketScore: 60,
      investorScore: 60,
      proposedAmount: 500000,
      proposedEquity: 20,
      fundingAsk: 500000,
      sector: "Fintech",
    });

    expect(ts.postMoneyValuation).toBe(ts.preMoneyValuation + ts.proposedAmount);
  });
});

describe("evaluateCounterOffer", () => {
  const baseTerms = {
    startupId: "s1",
    vcReviewId: "r1",
    proposedAmount: 1000000,
    proposedEquity: 20,
    preMoneyValuation: 4000000,
    postMoneyValuation: 5000000,
    boardSeat: true,
    boardObserver: false,
    liquidationPreference: 1.0,
    proRataRights: true,
  };

  it("accepts favorable counter", () => {
    const result = evaluateCounterOffer({
      counter: {
        requestedInvestmentAmount: 900000,
        offeredEquityPercent: 22,
        founderSalaryCap: 120000,
        boardSeatAccepted: true,
        boardObserverAccepted: false,
        notes: "",
      },
      currentTerms: baseTerms,
      overallScore: 70,
      riskScore: 50,
    });

    expect(result.outcome).toBe("accept_counter");
  });

  it("rejects aggressive counter for low-score startup", () => {
    const result = evaluateCounterOffer({
      counter: {
        requestedInvestmentAmount: 2000000,
        offeredEquityPercent: 5,
        founderSalaryCap: 200000,
        boardSeatAccepted: false,
        boardObserverAccepted: false,
        notes: "",
      },
      currentTerms: baseTerms,
      overallScore: 55,
      riskScore: 70,
    });

    expect(result.outcome).toBe("reject_counter");
  });

  it("revises terms for borderline counter", () => {
    const result = evaluateCounterOffer({
      counter: {
        requestedInvestmentAmount: 1300000,
        offeredEquityPercent: 16,
        founderSalaryCap: 120000,
        boardSeatAccepted: true,
        boardObserverAccepted: true,
        notes: "",
      },
      currentTerms: baseTerms,
      overallScore: 70,
      riskScore: 50,
    });

    expect(result.outcome).toBe("revise_terms");
    expect(result.revisedTerms).toBeDefined();
    expect(result.revisedTerms!.proposedAmount).toBe(1150000);
    expect(result.revisedTerms!.proposedEquity).toBe(18);
  });

  it("meets in the middle for revised terms math", () => {
    const result = evaluateCounterOffer({
      counter: {
        requestedInvestmentAmount: 800000,
        offeredEquityPercent: 16,
        founderSalaryCap: 100000,
        boardSeatAccepted: true,
        boardObserverAccepted: true,
        notes: "",
      },
      currentTerms: baseTerms,
      overallScore: 75,
      riskScore: 40,
    });

    expect(result.outcome).toBe("revise_terms");
    const revised = result.revisedTerms!;
    expect(revised.proposedAmount).toBe(900000); // (1M + 800k) / 2
    expect(revised.proposedEquity).toBe(18); // (20 + 16) / 2
    expect(revised.postMoneyValuation).toBe(Math.round(900000 / 0.18));
  });
});
