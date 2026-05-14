/**
 * Founder Arena — Usage Tracking
 *
 * Records and queries usage against plan limits.
 */

import { db } from "@/lib/db";

export type UsageActionType =
  | "startupCreate"
  | "vcReview"
  | "monthlySimulation"
  | "aiAnalysis"
  | "growthAccess"
  | "speedTokenSpend";

export function getPeriodBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

export async function recordUsage(
  userId: string,
  actionType: UsageActionType,
  count = 1
) {
  const { start, end } = getPeriodBounds();

  const existing = await db.usageLedger.findFirst({
    where: {
      userId,
      actionType,
      periodStart: start,
      periodEnd: end,
    },
  });

  if (existing) {
    await db.usageLedger.update({
      where: { id: existing.id },
      data: { count: { increment: count } },
    });
  } else {
    await db.usageLedger.create({
      data: {
        userId,
        actionType,
        count,
        periodStart: start,
        periodEnd: end,
      },
    });
  }
}

export async function getUsageForPeriod(
  userId: string,
  actionType: UsageActionType,
  date = new Date()
): Promise<number> {
  const { start, end } = getPeriodBounds(date);

  const result = await db.usageLedger.aggregate({
    where: {
      userId,
      actionType,
      periodStart: start,
      periodEnd: end,
    },
    _sum: { count: true },
  });

  return result._sum.count ?? 0;
}

export async function getAllUsageForPeriod(userId: string, date = new Date()) {
  const { start, end } = getPeriodBounds(date);

  const records = await db.usageLedger.findMany({
    where: {
      userId,
      periodStart: start,
      periodEnd: end,
    },
    select: { actionType: true, count: true },
  });

  const map: Record<string, number> = {};
  for (const r of records) {
    map[r.actionType] = (map[r.actionType] ?? 0) + r.count;
  }
  return map;
}
