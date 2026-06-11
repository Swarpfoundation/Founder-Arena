import { getAIReviewRuntimeConfig } from "@/lib/ai-review/config";

/**
 * Runtime configuration for the deck review market. Reuses the existing
 * private-beta AI review env (DEEPSEEK_API_KEY / DEEPSEEK_MODEL /
 * DEEPSEEK_BASE_URL / AI_REVIEW_*) and layers deck-specific knobs on top.
 * All model selection is environment-driven — nothing is hardcoded in
 * client code.
 */

export interface DeckReviewRuntimeConfig {
  enabled: boolean;
  provider: "deepseek" | "mock";
  apiKey?: string;
  /** DECK_REVIEW_MODEL > VC_REVIEW_MODEL > DEEPSEEK_MODEL > provider default. */
  model: string;
  baseUrl: string;
  timeoutMs: number;
  temperature: number;
  /** Retries per firm review on retryable provider errors. */
  maxAttemptsPerFirm: number;
  /** Hard cost guard: max firm reviews a single job may run. */
  maxFirmsPerJob: number;
  /** Hard cost guard: max deck review jobs per user per UTC day. */
  maxJobsPerUserPerDay: number;
}

function intFromEnv(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function getDeckReviewRuntimeConfig(env: NodeJS.ProcessEnv = process.env): DeckReviewRuntimeConfig {
  const base = getAIReviewRuntimeConfig(env);
  const requestedProvider = (env.DECK_REVIEW_PROVIDER ?? env.VC_REVIEW_PROVIDER ?? base.provider).trim();
  const provider = requestedProvider === "deepseek" ? "deepseek" : "mock";

  return {
    enabled: env.DECK_REVIEW_ENABLED === "true" || base.enabled,
    provider,
    apiKey: base.deepseekApiKey,
    model: env.DECK_REVIEW_MODEL?.trim() || env.VC_REVIEW_MODEL?.trim() || base.deepseekModel,
    baseUrl: base.deepseekBaseUrl,
    timeoutMs: intFromEnv(env.DECK_REVIEW_TIMEOUT_MS, base.timeoutMs, 5_000, 120_000),
    temperature: base.temperature,
    maxAttemptsPerFirm: intFromEnv(env.DECK_REVIEW_MAX_ATTEMPTS_PER_FIRM, 2, 1, 4),
    maxFirmsPerJob: intFromEnv(env.DECK_REVIEW_MAX_FIRMS_PER_JOB, 5, 1, 8),
    maxJobsPerUserPerDay: intFromEnv(env.DECK_REVIEW_MAX_JOBS_PER_USER_PER_DAY, 10, 1, 100),
  };
}
