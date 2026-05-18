import type { VcReviewResult } from "@/lib/ai/schemas";

export type AIReviewProviderId =
  | "mock"
  | "deepseek"
  | "openai_future"
  | "anthropic_future"
  | "gemini_future";

export type AIReviewJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "retrying"
  | "cancelled";

export type AIReviewMode = "mock" | "direct" | "queued_worker";

export type AIReviewErrorCode =
  | "missing_config"
  | "provider_disabled"
  | "provider_rate_limited"
  | "provider_timeout"
  | "provider_bad_response"
  | "provider_json_invalid"
  | "provider_retryable"
  | "provider_failed";

export interface AIReviewPitchDeckInput {
  problem: string;
  solution: string;
  marketSize: string;
  product: string;
  businessModel: string;
  goToMarket: string;
  competition: string;
  team?: string | null;
  financialPlan: string;
  ask: string;
  useOfFunds: string;
}

export interface AIReviewInput {
  startupId: string;
  startupName: string;
  sector: string;
  region: string;
  stage: string;
  classification?: string;
  fundingAsk: number;
  monetizationModel: string;
  pitchDeck: AIReviewPitchDeckInput;
}

export interface AIReviewProviderConfigResult {
  ok: boolean;
  code?: AIReviewErrorCode;
  message?: string;
}

export interface AIReviewProviderMetadata {
  provider: AIReviewProviderId;
  model?: string;
  mode?: AIReviewMode;
  durationMs?: number;
  usedFallback?: boolean;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export type VCReviewFinalDecision = "accept" | "conditional" | "reject";
export type VCReviewQualityFlag =
  | "downgraded_accept"
  | "missing_required_explanation"
  | "vague_market"
  | "unsupported_funding_ask"
  | "prompt_injection_detected"
  | "low_confidence"
  | "schema_repaired"
  | "provider_output_invalid"
  | "term_sheet_removed";

export type VCReviewDimensionKey = "problem" | "solution" | "market" | "team" | "business";

export interface VCReviewDimensionAssessment {
  score: number;
  evidence: string[];
  concerns: string[];
  confidence: "low" | "medium" | "high";
}

export interface VCReviewQualityAssessment {
  modelRecommendation: VCReviewFinalDecision;
  finalDecision: VCReviewFinalDecision;
  decisionConfidence: number;
  decisionSummary: string;
  ruleReasons: string[];
  dimensions: Record<VCReviewDimensionKey, VCReviewDimensionAssessment>;
  rejectionReasons: string[];
  conditionalRequirements: string[];
  minimumEvidenceNeeded: string[];
  whatWouldChangeDecision: string[];
  acceptanceRationale: string[];
  majorRisksStillPresent: string[];
  milestoneConditions: string[];
  redFlags: string[];
  missingInformation: string[];
  noTermSheetReason?: string;
  termSheetRecommendation?: string;
  qualityFlags: VCReviewQualityFlag[];
}

export interface AIReviewResult extends VcReviewResult {
  providerMetadata: AIReviewProviderMetadata;
  reviewQuality: VCReviewQualityAssessment;
}

export interface AIReviewProvider {
  id: AIReviewProviderId;
  validateConfig(): AIReviewProviderConfigResult;
  generateReview(input: AIReviewInput): Promise<AIReviewResult>;
}

export interface AIReviewRuntimeConfig {
  enabled: boolean;
  provider: AIReviewProviderId;
  mode: AIReviewMode;
  fallbackToMock: boolean;
  maxDailyPerUser: number;
  maxAttempts: number;
  timeoutMs: number;
  temperature: number;
  deepseekApiKey?: string;
  deepseekModel: string;
  deepseekBaseUrl: string;
}

export interface AIReviewJobPayload {
  version: "ai-review-job-v0.1";
  startupId: string;
  userId: string;
  provider: AIReviewProviderId;
  mode: AIReviewMode;
  status: AIReviewJobStatus;
  attempts: number;
  maxAttempts: number;
  idempotencyKey: string;
  queuedAt: string;
  nextRunAt?: string;
  lockedAt?: string;
  lockedBy?: string;
  reviewId?: string;
  lastError?: string;
  lastErrorCode?: AIReviewErrorCode;
}

export interface AIReviewJobSummary {
  id: string;
  startupId: string | null;
  status: AIReviewJobStatus;
  provider: AIReviewProviderId;
  mode: AIReviewMode;
  attempts: number;
  maxAttempts: number;
  queuedAt: Date;
  processedAt: Date | null;
  lastError?: string;
  reviewId?: string;
}

export interface AIReviewStatusPresentation {
  label: string;
  tone: "cyan" | "violet" | "amber" | "emerald" | "rose";
  description: string;
  cta: string;
}
