import { z } from "zod";

// ─── Startup Analysis ─────────────────────────────────────────────
export const startupAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  investorScore: z.number().min(0).max(100),
  marketScore: z.number().min(0).max(100),
  riskScore: z.number().min(0).max(100),
  timingScore: z.number().min(0).max(100),
  summary: z.string(),
  marketTiming: z.string(),
  risks: z.array(z.string()),
  strengths: z.array(z.string()),
  initialValuationEstimate: z.number().min(0),
});

export type StartupAnalysis = z.infer<typeof startupAnalysisSchema>;

// ─── VC Review ────────────────────────────────────────────────────
export const vcReviewSchema = z.object({
  decision: z.enum(["accept", "reject", "revise", "proposal"]),
  overallScore: z.number().min(0).max(100),
  scoreProblem: z.number().min(0).max(100),
  scoreSolution: z.number().min(0).max(100),
  scoreMarket: z.number().min(0).max(100),
  scoreTeam: z.number().min(0).max(100).optional(),
  scoreBusiness: z.number().min(0).max(100),
  memo: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  marketTiming: z.string(),
  milestones: z.array(z.string()),
  proposedAmount: z.number().min(0).optional(),
  proposedEquity: z.number().min(0).max(100).optional(),
  feedback: z.string(),
  committee: z.any().optional(), // populated separately after base review
});

export type VcReviewResult = z.infer<typeof vcReviewSchema>;

// ─── Investor Persona Review ──────────────────────────────────────
export const investorPersonaReviewSchema = z.object({
  personaId: z.string(),
  personaName: z.string(),
  score: z.number().min(0).max(100),
  note: z.string(),
  stance: z.enum(["strong_support", "support", "neutral", "concerned", "oppose"]),
  focusArea: z.string(),
});

export type InvestorPersonaReview = z.infer<typeof investorPersonaReviewSchema>;

// ─── Committee Consensus ──────────────────────────────────────────
export const committeeConsensusSchema = z.object({
  supportLevel: z.number().min(0).max(100),
  mainObjections: z.array(z.string()),
  whatWouldChangeTheirMind: z.array(z.string()),
  termsStance: z.enum(["aggressive", "standard", "cautious", "pass"]),
  strongestSupportQuote: z.string(),
  strongestObjectionQuote: z.string(),
  personaReviews: z.array(investorPersonaReviewSchema),
});

export type CommitteeConsensus = z.infer<typeof committeeConsensusSchema>;

// ─── Market Analyst Narrative ─────────────────────────────────────
export const marketAnalystNarrativeSchema = z.object({
  executiveBrief: z.string(),
  hotSectors: z.array(z.string()),
  coldSectors: z.array(z.string()),
  investorClimate: z.string(),
  riskWatchlist: z.array(z.string()),
  opportunityMap: z.array(z.string()),
  confidence: z.number().min(0).max(100),
  limitations: z.array(z.string()),
  gameplayNote: z.string(),
});

export type MarketAnalystNarrative = z.infer<typeof marketAnalystNarrativeSchema>;

// ─── Monthly Board Update ─────────────────────────────────────────
export const monthlyBoardUpdateSchema = z.object({
  boardUpdateTitle: z.string(),
  whatWentWell: z.array(z.string()),
  whatWentWrong: z.array(z.string()),
  investorReaction: z.string(),
  founderLesson: z.string(),
  nextMonthRecommendations: z.array(z.string()),
  riskAlerts: z.array(z.string()),
  conciseSummary: z.string(),
});

export type MonthlyBoardUpdate = z.infer<typeof monthlyBoardUpdateSchema>;

// ─── Founder Coaching Note ────────────────────────────────────────
export const founderCoachingNoteSchema = z.object({
  strongDecision: z.string(),
  weakDecision: z.string(),
  nextAction: z.string(),
  startupLesson: z.string(),
});

export type FounderCoachingNote = z.infer<typeof founderCoachingNoteSchema>;
