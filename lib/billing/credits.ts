/**
 * Founder Arena — Speed Token / Credit Wallet
 *
 * Speed tokens let users bypass review cooldowns or get extra reviews.
 */

import { db } from "@/lib/db";
import { getPlanConfig, type PlanId } from "./plans";

export async function getOrCreateWallet(userId: string) {
  const existing = await db.creditWallet.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  return db.creditWallet.create({
    data: { userId },
  });
}

export async function getWallet(userId: string) {
  return db.creditWallet.findUnique({ where: { userId } });
}

export async function addTokens(userId: string, amount: number, source: "ad" | "purchase" | "grant" | "refund") {
  if (amount <= 0) return null;

  await getOrCreateWallet(userId);

  const data: { speedTokens: { increment: number }; adTokensEarned?: { increment: number } } = {
    speedTokens: { increment: amount },
  };

  if (source === "ad") {
    data.adTokensEarned = { increment: amount };
  }

  return db.creditWallet.update({
    where: { userId },
    data,
  });
}

export async function spendToken(userId: string): Promise<{ success: boolean; remaining: number }> {
  // Atomic conditional decrement: the WHERE clause guards against going below
  // zero without a separate read-then-write. Two concurrent requests with
  // speedTokens=1 will both hit the UPDATE, but only one will match the
  // condition (speedTokens > 0) — the other returns count=0.
  const result = await db.creditWallet.updateMany({
    where: { userId, speedTokens: { gt: 0 } },
    data: {
      speedTokens: { decrement: 1 },
      tokensUsed: { increment: 1 },
    },
  });

  if (result.count === 0) {
    // Either wallet doesn't exist or balance was already zero.
    return { success: false, remaining: 0 };
  }

  const wallet = await db.creditWallet.findUnique({
    where: { userId },
    select: { speedTokens: true },
  });
  return { success: true, remaining: wallet?.speedTokens ?? 0 };
}

export async function grantMonthlyTokens(userId: string, planId: PlanId) {
  const config = getPlanConfig(planId);
  const tokens = config.limits.speedTokensPerMonth;
  if (tokens <= 0) return;

  await getOrCreateWallet(userId);
  await db.creditWallet.update({
    where: { userId },
    data: {
      speedTokens: tokens,
    },
  });
}

export async function resetTokens(userId: string) {
  return db.creditWallet.update({
    where: { userId },
    data: { speedTokens: 0 },
  });
}
