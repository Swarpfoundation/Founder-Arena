import type { AIReviewMode, AIReviewProviderId, AIReviewRuntimeConfig } from "./types";

function intFromEnv(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function resolveProvider(value: string | undefined): AIReviewProviderId {
  switch (value) {
    case "deepseek":
    case "openai_future":
    case "anthropic_future":
    case "gemini_future":
      return value;
    case "mock":
    default:
      return "mock";
  }
}

function resolveMode(value: string | undefined): AIReviewMode {
  switch (value) {
    case "queued_worker":
    case "direct":
    case "mock":
      return value;
    default:
      return "direct";
  }
}

export function getAIReviewRuntimeConfig(env: NodeJS.ProcessEnv = process.env): AIReviewRuntimeConfig {
  return {
    enabled: env.AI_REVIEW_ENABLED === "true",
    provider: resolveProvider(env.AI_REVIEW_PROVIDER),
    mode: resolveMode(env.AI_REVIEW_MODE),
    fallbackToMock: env.AI_REVIEW_FALLBACK_TO_MOCK !== "false",
    maxDailyPerUser: intFromEnv(env.AI_REVIEW_MAX_DAILY_PER_USER, 20, 1, 200),
    maxAttempts: intFromEnv(env.AI_REVIEW_MAX_ATTEMPTS, 3, 1, 10),
    timeoutMs: intFromEnv(env.AI_REVIEW_TIMEOUT_MS, 25_000, 5_000, 55_000),
    temperature: Math.min(0.8, Math.max(0, Number.parseFloat(env.AI_REVIEW_TEMPERATURE ?? "0.2") || 0.2)),
    deepseekApiKey: env.DEEPSEEK_API_KEY,
    deepseekModel: env.DEEPSEEK_MODEL ?? "deepseek-chat",
    deepseekBaseUrl: (env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(/\/$/, ""),
  };
}

export function isPrivateBetaAIReviewEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return getAIReviewRuntimeConfig(env).enabled;
}

export function areRewardedAdsHiddenForPrivateBeta(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ADS_DISABLED === "true" || env.REWARDED_ADS_ENABLED === "false";
}
