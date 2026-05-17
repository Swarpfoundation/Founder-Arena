import { ComplianceLevel, InfraUsageProfile, StartupStage, TrafficVolatility } from "./types";

export const INFRA_BALANCE_NOTES = [
  "Infra burn is a static gameplay model, not exact cloud billing.",
  "Monthly financial accounting is preserved even while the run uses Founder Weeks.",
  "Cheap stacks preserve runway early but add outage and scaling risk at higher usage.",
  "Cloud credits reduce effective burn only; gross burn remains visible for bill shock risk.",
];

export const DEFAULT_USAGE_PROFILE: InfraUsageProfile = {
  users: 100,
  monthlyActiveUsers: 50,
  requestsPerUser: 120,
  dataTransferGb: 10,
  dbStorageGb: 2,
  aiRequestsPerUser: 0,
  avgInputTokens: 0,
  avgOutputTokens: 0,
  usesEmbeddings: false,
  usesImageAudio: false,
  complianceLevel: "none",
  trafficVolatility: "stable",
};

export const STAGE_USAGE_MULTIPLIERS: Record<StartupStage, number> = {
  idea: 0.35,
  prototype: 0.55,
  pre_seed: 0.85,
  seed: 1.25,
  growth: 2.5,
  series_a: 5,
  enterprise: 9,
};

export const TRAFFIC_VOLATILITY_RISK: Record<TrafficVolatility, number> = {
  stable: 0,
  spiky: 10,
  viral: 22,
};

export const COMPLIANCE_MONTHLY_COST: Record<ComplianceLevel, number> = {
  none: 0,
  basic: 250,
  regulated: 1800,
  enterprise: 7500,
};

export const COMPLIANCE_SECURITY_RELIEF: Record<ComplianceLevel, number> = {
  none: 0,
  basic: 4,
  regulated: 12,
  enterprise: 22,
};

export const AI_SECTOR_HINTS = [
  "ai",
  "ml",
  "llm",
  "agent",
  "automation",
  "copilot",
  "machine learning",
  "inference",
];

export const REGULATED_SECTOR_HINTS = [
  "fintech",
  "finance",
  "payment",
  "health",
  "healthcare",
  "insurance",
  "banking",
  "security",
  "cyber",
  "enterprise",
];

export const CLOUD_CREDIT_EXPIRY_WARNING_SPRINTS = 2;

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeStage(stage: string): StartupStage {
  const normalized = stage.toLowerCase().replace(/[\s-]+/g, "_");
  if (
    normalized === "idea" ||
    normalized === "prototype" ||
    normalized === "pre_seed" ||
    normalized === "seed" ||
    normalized === "growth" ||
    normalized === "series_a" ||
    normalized === "enterprise"
  ) {
    return normalized;
  }
  if (normalized.includes("series")) return "series_a";
  if (normalized.includes("growth")) return "growth";
  if (normalized.includes("draft")) return "idea";
  if (normalized.includes("funded")) return "seed";
  return "pre_seed";
}

