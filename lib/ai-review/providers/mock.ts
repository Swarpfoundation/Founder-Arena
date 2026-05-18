import { MockProvider } from "@/lib/ai/mock-provider";
import type { AIReviewInput, AIReviewProvider, AIReviewProviderConfigResult, AIReviewResult } from "../types";
import { normalizeAIReviewOutput } from "../review-normalizer";

export class MockAIReviewProvider implements AIReviewProvider {
  id = "mock" as const;
  private provider = new MockProvider();

  validateConfig(): AIReviewProviderConfigResult {
    return { ok: true };
  }

  async generateReview(input: AIReviewInput): Promise<AIReviewResult> {
    const review = await this.provider.reviewPitch({
      startupName: input.startupName,
      sector: input.sector,
      pitchDeck: input.pitchDeck,
    });

    const rawReview = {
      problemScore: review.scoreProblem,
      solutionScore: review.scoreSolution,
      marketScore: review.scoreMarket,
      teamScore: review.scoreTeam ?? 50,
      businessScore: review.scoreBusiness,
      overallScore: review.overallScore,
      modelRecommendation:
        review.decision === "proposal" || review.decision === "accept"
          ? "accept"
          : review.decision === "reject"
            ? "reject"
            : "conditional",
      memo: review.memo,
      feedback: review.feedback,
      strengths: review.strengths,
      weaknesses: review.weaknesses,
      marketTiming: review.marketTiming,
      milestoneRecommendations: review.milestones,
      dimensionEvidence: {
        problem: {
          evidence: [review.strengths[0] ?? "The pitch identifies a meaningful problem."],
          concerns: [review.weaknesses[0] ?? "More customer proof is needed."],
          confidence: "medium",
        },
        solution: {
          evidence: [review.strengths[1] ?? "The solution is understandable."],
          concerns: [review.weaknesses[1] ?? "Differentiation needs validation."],
          confidence: "medium",
        },
        market: {
          evidence: [review.marketTiming],
          concerns: ["Market access and competition need continued validation."],
          confidence: "medium",
        },
        team: {
          evidence: [input.pitchDeck.team ?? "Team context was provided."],
          concerns: ["Critical hiring gaps should be clarified before scaling."],
          confidence: "medium",
        },
        business: {
          evidence: [input.pitchDeck.businessModel],
          concerns: ["Unit economics and funding discipline need milestone proof."],
          confidence: "medium",
        },
      },
      rejectionReasons: review.decision === "reject" ? review.weaknesses : undefined,
      conditionalRequirements: review.decision === "revise" ? review.weaknesses : undefined,
      minimumEvidenceNeeded: ["Customer proof", "Specific GTM milestones"],
      whatWouldChangeDecision: ["Stronger customer validation", "Clearer path to traction"],
      acceptanceRationale: review.decision === "proposal" ? review.strengths : undefined,
      majorRisksStillPresent: review.weaknesses,
      milestoneConditions: review.milestones,
      noTermSheetReason: review.decision === "reject" ? "The mock committee does not see enough evidence for a term sheet." : undefined,
      proposedAmount: review.proposedAmount,
      proposedEquity: review.proposedEquity,
    };

    return normalizeAIReviewOutput(
      rawReview,
      {
        provider: "mock",
        mode: "mock",
        usedFallback: false,
      },
      input
    );
  }
}
