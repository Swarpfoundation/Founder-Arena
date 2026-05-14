/**
 * Founder Arena — Subscription Plans
 *
 * Fairness rule (enforced by review):
 * Paid plans MUST NOT improve valuation, cash, risk score, investor score,
 * market score, leaderboard score, final outcome, or unlock score-affecting
 * gameplay mechanics that free users cannot earn.
 *
 * Paid plans may only unlock:
 * - convenience/speed (no cooldowns, more AI reviews per month)
 * - additional startups beyond the free quota
 * - deeper analysis copy (committee enrichment, advisor depth)
 * - speed tokens for cooldown bypass
 *
 * `growthPhaseAccess` is retained as a flag for UI/copy purposes only.
 * It does NOT gate access to growth-phase mechanics — every plan can
 * earn Series A/B funding, acquisitions, and growth achievements when
 * their startup qualifies.
 */

export type PlanId = "free" | "pro" | "max";

export interface PlanConfig {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  limits: PlanLimits;
}

export interface PlanLimits {
  maxStartups: number; // 0 = unlimited
  maxAiReviewsPerMonth: number; // 0 = unlimited
  maxSimulationsPerMonth: number; // 0 = unlimited
  growthPhaseAccess: boolean;
  speedTokensPerMonth: number;
  reviewCooldownSeconds: number; // 0 = no cooldown
  hasInstantAiAnalysis: boolean;
  hasPriorityQueue: boolean;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Start your journey. Build up to 3 startups.",
    features: [
      "3 startups",
      "3 AI pitch reviews / month",
      "2-hour review cooldown",
      "Full simulation, growth, and exit mechanics",
    ],
    limits: {
      maxStartups: 3,
      maxAiReviewsPerMonth: 3,
      maxSimulationsPerMonth: 0,
      growthPhaseAccess: true,
      speedTokensPerMonth: 0,
      reviewCooldownSeconds: 2 * 60 * 60,
      hasInstantAiAnalysis: true,
      hasPriorityQueue: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPrice: 9,
    yearlyPrice: 90,
    description: "Build faster. Unlimited startups + growth access.",
    features: [
      "Unlimited startups",
      "20 AI pitch reviews / month",
      "No review cooldown",
      "Growth phase unlocked",
      "5 speed tokens / month",
      "Priority queue",
    ],
    limits: {
      maxStartups: 0,
      maxAiReviewsPerMonth: 20,
      maxSimulationsPerMonth: 0,
      growthPhaseAccess: true,
      speedTokensPerMonth: 5,
      reviewCooldownSeconds: 0,
      hasInstantAiAnalysis: true,
      hasPriorityQueue: true,
    },
  },
  max: {
    id: "max",
    name: "Max",
    monthlyPrice: 19,
    yearlyPrice: 190,
    description: "Everything. No limits, max tokens.",
    features: [
      "Unlimited startups",
      "Unlimited AI pitch reviews",
      "No review cooldown",
      "Growth phase unlocked",
      "20 speed tokens / month",
      "Priority queue",
      "Early access to new features",
    ],
    limits: {
      maxStartups: 0,
      maxAiReviewsPerMonth: 0,
      maxSimulationsPerMonth: 0,
      growthPhaseAccess: true,
      speedTokensPerMonth: 20,
      reviewCooldownSeconds: 0,
      hasInstantAiAnalysis: true,
      hasPriorityQueue: true,
    },
  },
};

export const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  max_monthly: process.env.STRIPE_PRICE_MAX_MONTHLY,
  max_yearly: process.env.STRIPE_PRICE_MAX_YEARLY,
};

export function getPlanConfig(planId: PlanId): PlanConfig {
  return PLANS[planId] ?? PLANS.free;
}

export function planHasFeature(planId: PlanId, feature: keyof PlanLimits): boolean {
  const plan = getPlanConfig(planId);
  const value = plan.limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0 || value === 0;
  return false;
}
