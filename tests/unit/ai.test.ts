import { describe, it, expect } from "vitest";
import { MockProvider } from "@/lib/ai/mock-provider";

describe("MockProvider", () => {
  const provider = new MockProvider();

  it("analyzeStartupIdea returns deterministic scores", async () => {
    const result = await provider.analyzeStartupIdea({
      name: "TestCo",
      description: "A test company",
      sector: "SaaS",
      problem: "Big problem here",
      solution: "Great solution here",
      monetizationModel: "SaaS",
      fundingAsk: 500000,
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(50);
    expect(result.overallScore).toBeLessThanOrEqual(85);
    expect(result.investorScore).toBeGreaterThanOrEqual(45);
    expect(result.investorScore).toBeLessThanOrEqual(80);
    expect(result.initialValuationEstimate).toBeGreaterThan(0);
    expect(result.summary).toContain("TestCo");
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.risks)).toBe(true);
  });

  it("analyzeStartupIdea returns consistent results for same input", async () => {
    const input = {
      name: "ConsistentCo",
      description: "Desc",
      sector: "Fintech",
      problem: "Problem statement here",
      solution: "Solution statement here",
      monetizationModel: "Transaction fees",
      fundingAsk: 1000000,
    };

    const r1 = await provider.analyzeStartupIdea(input);
    const r2 = await provider.analyzeStartupIdea(input);

    expect(r1.overallScore).toBe(r2.overallScore);
    expect(r1.investorScore).toBe(r2.investorScore);
    expect(r1.initialValuationEstimate).toBe(r2.initialValuationEstimate);
  });

  it("reviewPitch returns structured review", async () => {
    const result = await provider.reviewPitch({
      startupName: "PitchCo",
      sector: "AI",
      pitchDeck: {
        problem: "AI models are too expensive for small teams to train and deploy.",
        solution: "A distributed training platform that pools GPU resources.",
        marketSize: "$100B TAM",
        product: "Cloud platform",
        businessModel: "Usage-based pricing",
        goToMarket: "Developer community and partnerships",
        competition: "AWS, Google Cloud",
        team: "3 PhDs, 2 engineers",
        financialPlan: "Profitable by year 2",
        ask: "$1M seed",
        useOfFunds: "60% R&D, 20% sales, 20% ops",
      },
    });

    expect(["accept", "reject", "revise", "proposal"]).toContain(result.decision);
    expect(result.overallScore).toBeGreaterThanOrEqual(55);
    expect(result.overallScore).toBeLessThanOrEqual(88);
    expect(result.memo.length).toBeGreaterThan(0);
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.weaknesses)).toBe(true);
    expect(Array.isArray(result.milestones)).toBe(true);
  });
});
