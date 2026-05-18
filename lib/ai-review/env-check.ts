import { getAIReviewRuntimeConfig, areRewardedAdsHiddenForPrivateBeta } from "./config";

export type AIReviewEnvCheckSeverity = "pass" | "warn" | "error";

export interface AIReviewEnvCheckItem {
  key: string;
  severity: AIReviewEnvCheckSeverity;
  message: string;
}

export interface AIReviewEnvCheckReport {
  ok: boolean;
  mode: string;
  provider: string;
  deepseekKeyPresent: boolean;
  adsHidden: boolean;
  items: AIReviewEnvCheckItem[];
}

function add(items: AIReviewEnvCheckItem[], item: AIReviewEnvCheckItem) {
  items.push(item);
}

export function checkAIReviewDeploymentEnv(env: NodeJS.ProcessEnv = process.env): AIReviewEnvCheckReport {
  const config = getAIReviewRuntimeConfig(env);
  const items: AIReviewEnvCheckItem[] = [];

  add(items, {
    key: "AI_REVIEW_ENABLED",
    severity: config.enabled ? "pass" : "warn",
    message: config.enabled
      ? "Private beta AI reviews are enabled."
      : "Private beta AI reviews are disabled; legacy review path will be used.",
  });

  add(items, {
    key: "AI_REVIEW_PROVIDER",
    severity: config.provider === "deepseek" || config.provider === "mock" ? "pass" : "warn",
    message: `Configured provider: ${config.provider}.`,
  });

  add(items, {
    key: "AI_REVIEW_MODE",
    severity: ["direct", "queued_worker", "mock"].includes(config.mode) ? "pass" : "error",
    message: `Configured mode: ${config.mode}.`,
  });

  if (env.NEXT_PUBLIC_DEEPSEEK_API_KEY) {
    add(items, {
      key: "NEXT_PUBLIC_DEEPSEEK_API_KEY",
      severity: "error",
      message: "DeepSeek keys must never use NEXT_PUBLIC_* or enter the client bundle.",
    });
  } else {
    add(items, {
      key: "NEXT_PUBLIC_DEEPSEEK_API_KEY",
      severity: "pass",
      message: "No client-exposed DeepSeek key detected.",
    });
  }

  if (config.provider === "deepseek" && config.enabled && !config.deepseekApiKey) {
    add(items, {
      key: "DEEPSEEK_API_KEY",
      severity: config.fallbackToMock ? "warn" : "error",
      message: config.fallbackToMock
        ? "DeepSeek key is missing; mock fallback will be used."
        : "DeepSeek key is missing and fallback is disabled.",
    });
  } else {
    add(items, {
      key: "DEEPSEEK_API_KEY",
      severity: config.deepseekApiKey ? "pass" : "warn",
      message: config.deepseekApiKey
        ? "Server-side DeepSeek key is present."
        : "Server-side DeepSeek key is not present.",
    });
  }

  add(items, {
    key: "AI_REVIEW_TIMEOUT_MS",
    severity: config.timeoutMs >= 5_000 && config.timeoutMs <= 55_000 ? "pass" : "error",
    message: `Provider timeout: ${config.timeoutMs}ms.`,
  });

  add(items, {
    key: "AI_REVIEW_MAX_ATTEMPTS",
    severity: config.maxAttempts >= 1 && config.maxAttempts <= 10 ? "pass" : "error",
    message: `Max attempts: ${config.maxAttempts}.`,
  });

  if (config.mode === "queued_worker") {
    add(items, {
      key: "DATABASE_URL",
      severity: env.DATABASE_URL ? "pass" : "error",
      message: env.DATABASE_URL
        ? "Database URL is present for queued worker mode."
        : "Queued worker mode requires DATABASE_URL.",
    });
    add(items, {
      key: "AUTH_SECRET",
      severity: env.AUTH_SECRET ? "pass" : "warn",
      message: env.AUTH_SECRET
        ? "Auth secret is present."
        : "Render should use the same AUTH_SECRET as Vercel.",
    });
  }

  const adsHidden = areRewardedAdsHiddenForPrivateBeta(env);
  add(items, {
    key: "ADS_DISABLED / REWARDED_ADS_ENABLED",
    severity: adsHidden ? "pass" : "warn",
    message: adsHidden
      ? "Rewarded ads are hidden/paused for private beta."
      : "Rewarded mock offers may be visible; set ADS_DISABLED=true for focused AI beta.",
  });

  return {
    ok: !items.some((item) => item.severity === "error"),
    mode: config.mode,
    provider: config.provider,
    deepseekKeyPresent: !!config.deepseekApiKey,
    adsHidden,
    items,
  };
}

export function formatAIReviewEnvCheckReport(report: AIReviewEnvCheckReport): string {
  const lines = [
    `AI review env check: ${report.ok ? "OK" : "FAILED"}`,
    `provider=${report.provider} mode=${report.mode} deepseekKeyPresent=${report.deepseekKeyPresent} adsHidden=${report.adsHidden}`,
  ];
  for (const item of report.items) {
    lines.push(`[${item.severity.toUpperCase()}] ${item.key}: ${item.message}`);
  }
  return lines.join("\n");
}
