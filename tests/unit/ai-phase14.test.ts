import { describe, it, expect, vi } from "vitest";
import { INVESTOR_PERSONAS, getPersonaById } from "@/lib/ai/personas";
import { generateCommitteeReview } from "@/lib/ai/committee";
import { generateDeterministicMarketNarrative } from "@/lib/ai/market-analyst";
import {
  startupAnalysisSchema,
  vcReviewSchema,
  committeeConsensusSchema,
  marketAnalystNarrativeSchema,
  monthlyBoardUpdateSchema,
  founderCoachingNoteSchema,
} from "@/lib/ai/schemas";
import { MockProvider } from "@/lib/ai/mock-provider";
import { OpenAIProvider } from "@/lib/ai/openai-provider";
import { buildStartupAnalysisPrompt, buildVcReviewPrompt } from "@/lib/ai/prompts";

describe("Phase 14 AI enhancements", () => {
  describe("personas", () => {
    it("has 6 personas", () => {
      expect(INVESTOR_PERSONAS).toHaveLength(6);
    });

    it("each persona has required fields", () => {
      for (const p of INVESTOR_PERSONAS) {
        expect(p.id).toBeTruthy();
        expect(p.name).toBeTruthy();
        expect(p.role).toBeTruthy();
        expect(p.investmentStyle).toBeTruthy();
        expect(p.prefers.length).toBeGreaterThan(0);
        expect(p.dislikes.length).toBeGreaterThan(0);
        expect(p.scoringBias).toBeTypeOf("object");
        expect(p.focusAreas.length).toBeGreaterThan(0);
        expect(p.tone).toBeTruthy();
      }
    });

    it("getPersonaById works", () => {
      expect(getPersonaById("generalist")?.name).toBe("Alex Chen");
      expect(getPersonaById("nonexistent")).toBeUndefined();
    });
  });

  describe("committee", () => {
    it("produces deterministic results for same inputs", () => {
      const input = {
        startupName: "TestCo",
        sector: "fintech",
        baseScores: { problem: 70, solution: 65, market: 80, team: 60, business: 75 },
        decision: "proposal" as const,
      };
      const a = generateCommitteeReview(input);
      const b = generateCommitteeReview(input);
      expect(a.supportLevel).toBe(b.supportLevel);
      expect(a.termsStance).toBe(b.termsStance);
      expect(a.personaReviews.map((p) => p.score)).toEqual(b.personaReviews.map((p) => p.score));
    });

    it("validates against schema", () => {
      const input = {
        startupName: "TestCo",
        sector: "fintech",
        baseScores: { problem: 70, solution: 65, market: 80, team: 60, business: 75 },
        decision: "proposal" as const,
      };
      const result = generateCommitteeReview(input);
      expect(() => committeeConsensusSchema.parse(result)).not.toThrow();
    });

    it("produces different results for different sectors", () => {
      const inputA = {
        startupName: "TestCo",
        sector: "fintech",
        baseScores: { problem: 70, solution: 65, market: 80, team: 60, business: 75 },
        decision: "proposal" as const,
      };
      const inputB = { ...inputA, sector: "health" };
      const a = generateCommitteeReview(inputA);
      const b = generateCommitteeReview(inputB);
      // At least one persona note should differ
      const notesA = a.personaReviews.map((p) => p.note).join(" ");
      const notesB = b.personaReviews.map((p) => p.note).join(" ");
      expect(notesA).not.toBe(notesB);
    });
  });

  describe("market analyst (deterministic)", () => {
    it("returns valid structure for bullish snapshot", () => {
      const result = generateDeterministicMarketNarrative({
        condition: "bullish",
        scenarioKey: "ai_boom",
        description: "AI boom driving valuations",
      });
      expect(() => marketAnalystNarrativeSchema.parse(result)).not.toThrow();
      expect(result.hotSectors.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(65);
    });

    it("returns valid structure for bearish snapshot", () => {
      const result = generateDeterministicMarketNarrative({
        condition: "bearish",
        scenarioKey: "recession_fears",
        description: "Recession fears tighten capital",
      });
      expect(() => marketAnalystNarrativeSchema.parse(result)).not.toThrow();
      expect(result.coldSectors.length).toBeGreaterThan(0);
    });

    it("includes gameplay note", () => {
      const result = generateDeterministicMarketNarrative({
        condition: "neutral",
        scenarioKey: "neutral_market",
        description: "Balanced conditions",
      });
      expect(result.gameplayNote).toContain("simulation");
    });
  });

  describe("mock provider", () => {
    const mock = new MockProvider();

    it("analyzeStartupIdea returns valid schema", async () => {
      const result = await mock.analyzeStartupIdea({
        name: "TestCo",
        description: "A test startup",
        sector: "fintech",
        problem: "Big problem",
        solution: "Great solution",
        monetizationModel: "SaaS",
        fundingAsk: 500000,
      });
      expect(() => startupAnalysisSchema.parse(result)).not.toThrow();
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.strengths.length).toBeGreaterThan(0);
    });

    it("reviewPitch returns valid schema with sector-specific strengths", async () => {
      const result = await mock.reviewPitch({
        startupName: "TestCo",
        sector: "fintech",
        pitchDeck: {
          problem: "Problem",
          solution: "Solution",
          marketSize: "1B",
          product: "Product",
          businessModel: "SaaS",
          goToMarket: "Direct",
          competition: "None",
          team: "Solo founder",
          financialPlan: "Conservative",
          ask: "500K",
          useOfFunds: "Hiring",
        },
      });
      expect(() => vcReviewSchema.parse(result)).not.toThrow();
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.weaknesses.length).toBeGreaterThan(0);
    });

    it("generateCommitteeReview returns valid schema", async () => {
      const result = await mock.generateCommitteeReview({
        startupName: "TestCo",
        sector: "fintech",
        baseScores: { problem: 70, solution: 65, market: 80, team: 60, business: 75 },
        decision: "proposal",
      });
      expect(() => committeeConsensusSchema.parse(result)).not.toThrow();
      expect(result.personaReviews).toHaveLength(6);
    });

    it("generateMonthlyBoardUpdate returns valid schema", async () => {
      const result = await mock.generateMonthlyBoardUpdate({
        startupName: "TestCo",
        month: 3,
        decisions: ["Hire engineer", "Increase marketing"],
        cashBefore: 100000,
        cashAfter: 85000,
        burnRate: 15000,
        revenue: 5000,
        productProgress: 25,
        marketCondition: "bullish",
        sector: "fintech",
      });
      expect(() => monthlyBoardUpdateSchema.parse(result)).not.toThrow();
      expect(result.whatWentWell.length).toBeGreaterThan(0);
      expect(result.conciseSummary).toContain("Month 3");
    });

    it("generateFounderCoaching returns valid schema", async () => {
      const result = await mock.generateFounderCoaching({
        context: "pitch_review",
        startupName: "TestCo",
        sector: "fintech",
        outcomeSummary: "Proposal with score 75",
      });
      expect(() => founderCoachingNoteSchema.parse(result)).not.toThrow();
      expect(result.strongDecision).toBeTruthy();
      expect(result.nextAction).toBeTruthy();
    });

    it("generateMarketAnalystNarrative returns valid schema", async () => {
      const result = await mock.generateMarketAnalystNarrative({
        snapshot: {
          condition: "bullish",
          scenarioKey: "ai_boom",
          description: "AI boom",
        },
      });
      expect(() => marketAnalystNarrativeSchema.parse(result)).not.toThrow();
    });
  });

  describe("prompt builders", () => {
    it("truncates long inputs safely", () => {
      const longText = "a".repeat(1000);
      const { prompt } = buildStartupAnalysisPrompt({
        name: longText,
        description: longText,
        sector: longText,
        problem: longText,
        solution: longText,
        monetizationModel: longText,
        fundingAsk: 500000,
      });
      expect(prompt.length).toBeLessThan(4000);
      expect(prompt).toContain("...");
    });

    it("includes schema expectations in VC review prompt", () => {
      const { prompt } = buildVcReviewPrompt({
        startupName: "TestCo",
        sector: "fintech",
        pitchDeck: {
          problem: "P",
          solution: "S",
          marketSize: "1B",
          product: "P",
          businessModel: "SaaS",
          goToMarket: "Direct",
          competition: "None",
          team: "Solo",
          financialPlan: "Plan",
          ask: "500K",
          useOfFunds: "Hiring",
        },
      });
      expect(prompt).toContain("JSON");
      expect(prompt).toContain("decision");
    });
  });

  describe("OpenAI provider fallback", () => {
    it("falls back to mock on parse failure", async () => {
      const provider = new OpenAIProvider("fake-key");

      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "not valid json" } }],
        }),
      } as Response);

      const result = await provider.analyzeStartupIdea({
        name: "TestCo",
        description: "A test",
        sector: "fintech",
        problem: "Problem",
        solution: "Solution",
        monetizationModel: "SaaS",
        fundingAsk: 500000,
      });

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.summary).toBeTruthy();

      vi.restoreAllMocks();
    });

    it("falls back to mock on API error", async () => {
      const provider = new OpenAIProvider("fake-key");

      vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

      const result = await provider.reviewPitch({
        startupName: "TestCo",
        sector: "fintech",
        pitchDeck: {
          problem: "P",
          solution: "S",
          marketSize: "1B",
          product: "P",
          businessModel: "SaaS",
          goToMarket: "Direct",
          competition: "None",
          team: "Solo",
          financialPlan: "Plan",
          ask: "500K",
          useOfFunds: "Hiring",
        },
      });

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);

      vi.restoreAllMocks();
    });
  });

  describe("schema backward compatibility", () => {
    it("vcReviewSchema accepts committee field", () => {
      const result = vcReviewSchema.parse({
        decision: "proposal",
        overallScore: 75,
        scoreProblem: 70,
        scoreSolution: 65,
        scoreMarket: 80,
        scoreTeam: 60,
        scoreBusiness: 75,
        memo: "Good",
        strengths: ["S1"],
        weaknesses: ["W1"],
        marketTiming: "Good",
        milestones: ["M1"],
        feedback: "Nice",
        committee: { supportLevel: 70 },
      });
      expect(result.committee).toEqual({ supportLevel: 70 });
    });

    it("vcReviewSchema works without committee field", () => {
      const result = vcReviewSchema.parse({
        decision: "proposal",
        overallScore: 75,
        scoreProblem: 70,
        scoreSolution: 65,
        scoreMarket: 80,
        scoreTeam: 60,
        scoreBusiness: 75,
        memo: "Good",
        strengths: ["S1"],
        weaknesses: ["W1"],
        marketTiming: "Good",
        milestones: ["M1"],
        feedback: "Nice",
      });
      expect(result.committee).toBeUndefined();
    });
  });
});
