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
  const wallet = await getWallet(userId);
  if (!wallet || wallet.speedTokens <= 0) {
    return { success: false, remaining: 0 };
  }

  const updated = await db.creditWallet.update({
    where: { userId },
    data: {
      speedTokens: { decrement: 1 },
      tokensUsed: { increment: 1 },
    },
  });

  return { success: true, remaining: updated.speedTokens };
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
