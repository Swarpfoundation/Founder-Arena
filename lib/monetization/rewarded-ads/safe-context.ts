import type { RewardedAdProviderId } from "./provider";
import type { AdRewardType, RewardedAdPlacement } from "@/lib/rewards/rewarded-review-acceleration";

export interface RewardedAdSafeContextInput {
  placement: RewardedAdPlacement;
  rewardType: AdRewardType;
  ledgerEntryId: string;
  provider: RewardedAdProviderId;
  routeContext?: string;
  appMode?: "mock" | "future_real_provider";
  startup?: Record<string, unknown>;
  user?: Record<string, unknown>;
}

export interface RewardedAdSafeContext {
  placement: RewardedAdPlacement;
  rewardType: AdRewardType;
  ledgerEntryId: string;
  provider: RewardedAdProviderId;
  routeContext: string;
  appMode: "mock" | "future_real_provider";
}

export const FORBIDDEN_REWARDED_AD_CONTEXT_FIELDS = [
  "pitchText",
  "pitchDeck",
  "financialPlan",
  "fundingAsk",
  "email",
  "name",
  "startupName",
  "cash",
  "valuation",
  "monthlyBurn",
  "runway",
  "revenue",
  "investorScore",
  "marketScore",
  "riskScore",
  "aiPrompt",
  "rawPrompt",
  "internalScore",
] as const;

export function buildRewardedAdSafeContext(input: RewardedAdSafeContextInput): RewardedAdSafeContext {
  void input.startup;
  void input.user;
  return {
    placement: input.placement,
    rewardType: input.rewardType,
    ledgerEntryId: input.ledgerEntryId,
    provider: input.provider,
    routeContext: sanitizeRouteContext(input.routeContext),
    appMode: input.appMode ?? "mock",
  };
}

export function containsForbiddenRewardedAdContextFields(context: Record<string, unknown>): boolean {
  return FORBIDDEN_REWARDED_AD_CONTEXT_FIELDS.some((field) => field in context);
}

function sanitizeRouteContext(routeContext?: string): string {
  if (!routeContext) return "unknown";
  return routeContext.replace(/[^a-zA-Z0-9_:/-]/g, "").slice(0, 80);
}
