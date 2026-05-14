/**
 * Founder Arena — Pitch Review Access Control
 *
 * Manages cooldowns, quotas, and speed-token bypass for AI pitch reviews.
 * First review is always instant (fairness rule).
 */

import { db } from "@/lib/db";
import { getPlanConfig } from "./plans";
import { getUserPlan, checkAiReviewEntitlement } from "./entitlements";
import { getWallet, spendToken } from "./credits";

export interface ReviewAccessResult {
  canSubmit: boolean;
  reason?: string;
  isFirstReview: boolean;
  cooldownRemainingSeconds: number;
  monthlyQuotaRemaining: number;
  monthlyQuotaLimit: number;
  speedTokensAvailable: number;
  canBypassWithToken: boolean;
}

export async function getReviewAccess(userId: string, _startupId?: string): Promise<ReviewAccessResult> {
  const planId = await getUserPlan(userId);
  const config = getPlanConfig(planId);

  // Check if this is the user's first review ever
  const totalReviews = await db.vcReview.count({
    where: { startup: { userId } },
  });
  const isFirstReview = totalReviews === 0;

  // Check monthly quota
  const entitlement = await checkAiReviewEntitlement(userId);
  const monthlyQuotaRemaining = entitlement.remaining ?? 0;
  const monthlyQuotaLimit = entitlement.limit ?? 0;

  // Check cooldown (skip for first review or if no cooldown configured)
  let cooldownRemainingSeconds = 0;
  if (!isFirstReview && config.limits.reviewCooldownSeconds > 0) {
    cooldownRemainingSeconds = await getCooldownRemaining(userId, config.limits.reviewCooldownSeconds);
  }

  // Check speed tokens
  const wallet = await getWallet(userId);
  const speedTokensAvailable = wallet?.speedTokens ?? 0;
  const canBypassWithToken = speedTokensAvailable > 0 && (!entitlement.allowed || cooldownRemainingSeconds > 0);

  // Determine if submit is allowed
  let canSubmit = true;
  let reason: string | undefined;

  if (isFirstReview) {
    canSubmit = true;
  } else if (entitlement.allowed && cooldownRemainingSeconds === 0) {
    canSubmit = true;
  } else if (canBypassWithToken) {
    canSubmit = true;
  } else if (!entitlement.allowed) {
    canSubmit = false;
    reason = entitlement.reason;
  } else if (cooldownRemainingSeconds > 0) {
    canSubmit = false;
    reason = `Review cooldown active. Wait ${Math.ceil(cooldownRemainingSeconds / 60)} minutes or use a speed token.`;
  }

  return {
    canSubmit,
    reason,
    isFirstReview,
    cooldownRemainingSeconds,
    monthlyQuotaRemaining,
    monthlyQuotaLimit,
    speedTokensAvailable,
    canBypassWithToken,
  };
}

export async function getCooldownRemaining(userId: string, cooldownSeconds: number): Promise<number> {
  const latestReview = await db.vcReview.findFirst({
    where: { startup: { userId } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (!latestReview) return 0;

  const elapsed = (Date.now() - latestReview.createdAt.getTime()) / 1000;
  return Math.max(0, cooldownSeconds - elapsed);
}

export async function enqueueReview(
  userId: string,
  startupId: string,
  payload: Record<string, unknown>
) {
  return db.queuedAction.create({
    data: {
      userId,
      startupId,
      actionType: "vcReview",
      payload: payload as unknown as import("@prisma/client").Prisma.InputJsonValue,
      status: "queued",
    },
  });
}

export async function getQueuedReviews(userId: string) {
  return db.queuedAction.findMany({
    where: { userId, actionType: "vcReview", status: { in: ["queued", "processing"] } },
    orderBy: { queuedAt: "asc" },
  });
}

export async function getPendingQueuedReviewForStartup(userId: string, startupId: string) {
  return db.queuedAction.findFirst({
    where: {
      userId,
      startupId,
      actionType: "vcReview",
      status: { in: ["queued", "processing"] },
    },
  });
}

export async function processQueuedReview(queuedActionId: string) {
  const action = await db.queuedAction.findUnique({
    where: { id: queuedActionId },
  });
  if (!action || action.status !== "queued") return null;

  await db.queuedAction.update({
    where: { id: queuedActionId },
    data: { status: "processing" },
  });

  return action;
}

export async function markQueuedReviewComplete(
  queuedActionId: string,
  result?: Record<string, unknown>
) {
  return db.queuedAction.update({
    where: { id: queuedActionId },
    data: {
      status: "completed",
      processedAt: new Date(),
      result: result as unknown as import("@prisma/client").Prisma.InputJsonValue,
    },
  });
}

export async function markQueuedReviewFailed(queuedActionId: string, error: string) {
  return db.queuedAction.update({
    where: { id: queuedActionId },
    data: {
      status: "failed",
      processedAt: new Date(),
      error,
    },
  });
}

export async function spendTokenAndBypass(userId: string): Promise<{ success: boolean; remaining: number; error?: string }> {
  const result = await spendToken(userId);
  if (!result.success) {
    return { success: false, remaining: 0, error: "No speed tokens available." };
  }
  return { success: true, remaining: result.remaining };
}
