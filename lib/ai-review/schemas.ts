import { z } from "zod";
import { vcReviewSchema } from "@/lib/ai/schemas";

const textArraySchema = z.array(z.string().min(1)).min(1).max(8);
const decisionTextArraySchema = z.array(z.string().min(1)).max(8).optional();
const dimensionDetailSchema = z.object({
  evidence: z.array(z.string().min(1)).min(1).max(5),
  concerns: z.array(z.string().min(1)).min(1).max(5),
  confidence: z.enum(["low", "medium", "high"]).optional(),
});

export const aiReviewRawOutputSchema = z.object({
  problemScore: z.number().optional(),
  solutionScore: z.number().optional(),
  marketScore: z.number().optional(),
  teamScore: z.number().optional(),
  businessScore: z.number().optional(),
  scoreProblem: z.number().optional(),
  scoreSolution: z.number().optional(),
  scoreMarket: z.number().optional(),
  scoreTeam: z.number().optional(),
  scoreBusiness: z.number().optional(),
  overallScore: z.number(),
  decision: z.enum(["accept", "reject", "conditional", "revise", "proposal"]).optional(),
  modelRecommendation: z.enum(["accept", "reject", "conditional"]).optional(),
  finalDecision: z.enum(["accept", "reject", "conditional"]).optional(),
  decisionConfidence: z.number().optional(),
  decisionSummary: z.string().optional(),
  ruleReasons: decisionTextArraySchema,
  dimensionEvidence: z
    .object({
      problem: dimensionDetailSchema.optional(),
      solution: dimensionDetailSchema.optional(),
      market: dimensionDetailSchema.optional(),
      team: dimensionDetailSchema.optional(),
      business: dimensionDetailSchema.optional(),
    })
    .optional(),
  rejectionReasons: decisionTextArraySchema,
  conditionalRequirements: decisionTextArraySchema,
  minimumEvidenceNeeded: decisionTextArraySchema,
  whatWouldChangeDecision: decisionTextArraySchema,
  acceptanceRationale: decisionTextArraySchema,
  majorRisksStillPresent: decisionTextArraySchema,
  milestoneConditions: decisionTextArraySchema,
  redFlags: decisionTextArraySchema,
  missingInformation: decisionTextArraySchema,
  noTermSheetReason: z.string().optional(),
  termSheetRecommendation: z.string().optional(),
  proposedAmount: z.number().optional().nullable(),
  equityPercent: z.number().optional().nullable(),
  proposedEquity: z.number().optional().nullable(),
  preMoneyValuation: z.number().optional().nullable(),
  postMoneyValuation: z.number().optional().nullable(),
  memo: z.string().min(1),
  feedback: z.string().min(1).optional(),
  strengths: textArraySchema,
  weaknesses: textArraySchema,
  marketTiming: z.string().min(1),
  milestoneRecommendations: textArraySchema.optional(),
  milestones: textArraySchema.optional(),
  founderCoachingNotes: z.string().optional(),
  riskNotes: z.array(z.string()).optional(),
  termSheetDraft: z.string().optional(),
});

export const normalizedAIReviewSchema = vcReviewSchema.extend({
  providerMetadata: z.object({
    provider: z.string(),
    model: z.string().optional(),
    mode: z.string().optional(),
    durationMs: z.number().optional(),
    usedFallback: z.boolean().optional(),
    usage: z
      .object({
        promptTokens: z.number().optional(),
        completionTokens: z.number().optional(),
        totalTokens: z.number().optional(),
      })
      .optional(),
  }),
});

export type AIReviewRawOutput = z.infer<typeof aiReviewRawOutputSchema>;
export type NormalizedAIReview = z.infer<typeof normalizedAIReviewSchema>;
