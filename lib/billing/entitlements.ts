/**
 * Founder Arena — Entitlements Engine
 *
 * Checks what a user is allowed to do based on their plan + usage.
 */

import { db } from "@/lib/db";
import { getPlanConfig, type PlanId } from "./plans";
import { getPeriodBounds } from "./usage";

export interface EntitlementCheck {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  limit?: number;
}

export async function getUserPlan(userId: string): Promise<PlanId> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  return (user?.plan as PlanId) ?? "free";
}

export async function getUserEntitlements(userId: string) {
  const planId = await getUserPlan(userId);
  const config = getPlanConfig(planId);

  const [startupCount, reviewCount, simCount] = await Promise.all([
    db.startup.count({ where: { userId } }),
    countAiReviewsThisMonth(userId),
    countSimulationsThisMonth(userId),
  ]);

  const maxStartups = config.limits.maxStartups;
  const maxReviews = config.limits.maxAiReviewsPerMonth;
  const maxSims = config.limits.maxSimulationsPerMonth;

  return {
    planId,
    planName: config.name,
    limits: config.limits,
    usage: {
      startups: startupCount,
      reviews: reviewCount,
      simulations: simCount,
    },
    remaining: {
      startups: maxStartups === 0 ? Infinity : Math.max(0, maxStartups - startupCount),
      reviews: maxReviews === 0 ? Infinity : Math.max(0, maxReviews - reviewCount),
      simulations: maxSims === 0 ? Infinity : Math.max(0, maxSims - simCount),
    },
  };
}

export async function checkStartupCreateEntitlement(userId: string): Promise<EntitlementCheck> {
  const planId = await getUserPlan(userId);
  const config = getPlanConfig(planId);
  const maxStartups = config.limits.maxStartups;

  if (maxStartups === 0) {
    return { allowed: true, remaining: Infinity, limit: 0 };
  }

  const count = await db.startup.count({ where: { userId } });
  const remaining = maxStartups - count;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `Free plan limit: ${maxStartups} startups. Upgrade to Pro for unlimited startups.`,
      remaining: 0,
      limit: maxStartups,
    };
  }

  return { allowed: true, remaining, limit: maxStartups };
}

export async function checkAiReviewEntitlement(userId: string): Promise<EntitlementCheck> {
  const planId = await getUserPlan(userId);
  const config = getPlanConfig(planId);
  const maxReviews = config.limits.maxAiReviewsPerMonth;

  if (maxReviews === 0) {
    return { allowed: true, remaining: Infinity, limit: 0 };
  }

  const count = await countAiReviewsThisMonth(userId);
  const remaining = maxReviews - count;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `Plan limit: ${maxReviews} AI reviews per month. Upgrade for more reviews or use a speed token.`,
      remaining: 0,
      limit: maxReviews,
    };
  }

  return { allowed: true, remaining, limit: maxReviews };
}

export async function checkSimulationEntitlement(userId: string): Promise<EntitlementCheck> {
  const planId = await getUserPlan(userId);
  const config = getPlanConfig(planId);
  const maxSims = config.limits.maxSimulationsPerMonth;

  if (maxSims === 0) {
    return { allowed: true, remaining: Infinity, limit: 0 };
  }

  const count = await countSimulationsThisMonth(userId);
  const remaining = maxSims - count;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `Plan limit: ${maxSims} simulations per month. Upgrade for unlimited simulations.`,
      remaining: 0,
      limit: maxSims,
    };
  }

  return { allowed: true, remaining, limit: maxSims };
}

export async function checkGrowthAccess(userId: string): Promise<EntitlementCheck> {
  // Fairness rule: growth phase mechanics (Series A/B, acquisitions) affect
  // leaderboard score and final outcome, so they MUST be available to every
  // plan. Paid plans only differ in convenience/speed/quota — never in
  // score-affecting mechanics access.
  void userId;
  return { allowed: true };
}

async function countAiReviewsThisMonth(userId: string): Promise<number> {
  const { start } = getPeriodBounds();
  return db.vcReview.count({
    where: {
      startup: { userId },
      createdAt: { gte: start },
    },
  });
}

async function countSimulationsThisMonth(userId: string): Promise<number> {
  const { start } = getPeriodBounds();
  return db.simulationMonth.count({
    where: {
      startup: { userId },
      createdAt: { gte: start },
    },
  });
}
