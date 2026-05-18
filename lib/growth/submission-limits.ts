import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { PlanId } from "@/lib/billing/plans";
import { getUserPlan } from "@/lib/billing/entitlements";
import { REFERRAL_REWARD_ACTION_TYPE, createReferralRewardLedgerEntry, sumSubmissionCredits } from "./referral-rules";
import type { ReferralRewardLedgerEntry } from "./referral-rules";

export const WEEKLY_REVIEW_SUBMISSION_LIMIT_FREE = 3;
export const WEEKLY_REVIEW_SUBMISSION_ACTION = "vcReviewWeeklySubmission";
export const WEEKLY_REVIEW_SUBMISSION_LEDGER_ACTION = "weeklyReviewSubmission";

export interface WeeklySubmissionStatus {
  planId: PlanId;
  isPaid: boolean;
  windowStart: Date;
  windowEnd: Date;
  usedCount: number;
  freeLimit: number;
  remainingFreeSubmissions: number;
  submissionCreditsAvailable: number;
  canSubmit: boolean;
  willUseCredit: boolean;
  reason?: string;
}

export function getUtcCalendarWeekWindow(date = new Date()): { start: Date; end: Date } {
  const day = date.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

export function buildWeeklySubmissionIdempotencyKey(input: {
  userId: string;
  startupId: string;
  pitchDeckUpdatedAt?: Date | string | null;
}): string {
  const pitchVersion = input.pitchDeckUpdatedAt
    ? new Date(input.pitchDeckUpdatedAt).toISOString()
    : "no-pitch-version";
  return `weekly-review-submit:${input.userId}:${input.startupId}:${pitchVersion}`;
}

export function calculateWeeklySubmissionStatus(input: {
  planId: PlanId;
  usedCount: number;
  submissionCreditsAvailable: number;
  now?: Date;
}): WeeklySubmissionStatus {
  const { start, end } = getUtcCalendarWeekWindow(input.now);
  const isPaid = input.planId !== "free";
  const remainingFreeSubmissions = isPaid
    ? Number.POSITIVE_INFINITY
    : Math.max(0, WEEKLY_REVIEW_SUBMISSION_LIMIT_FREE - input.usedCount);
  const willUseCredit = !isPaid && remainingFreeSubmissions <= 0 && input.submissionCreditsAvailable > 0;
  const canSubmit = isPaid || remainingFreeSubmissions > 0 || willUseCredit;

  return {
    planId: input.planId,
    isPaid,
    windowStart: start,
    windowEnd: end,
    usedCount: input.usedCount,
    freeLimit: isPaid ? 0 : WEEKLY_REVIEW_SUBMISSION_LIMIT_FREE,
    remainingFreeSubmissions,
    submissionCreditsAvailable: input.submissionCreditsAvailable,
    canSubmit,
    willUseCredit,
    reason: canSubmit
      ? undefined
      : "Free founders can submit 3 VC reviews per week. Upgrade or use a referral credit.",
  };
}

function parseRewardPayload(value: unknown): ReferralRewardLedgerEntry | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.version !== "referral-reward-v0.1") return null;
  if (typeof record.userId !== "string" || typeof record.type !== "string") return null;
  if (typeof record.amount !== "number" || typeof record.idempotencyKey !== "string") return null;
  return record as unknown as ReferralRewardLedgerEntry;
}

export async function getSubmissionCreditBalance(userId: string): Promise<{
  availableCredits: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}> {
  const rows = await db.queuedAction.findMany({
    where: { userId, actionType: REFERRAL_REWARD_ACTION_TYPE, status: "completed" },
    select: { payload: true },
  });
  const entries = rows.map((row) => parseRewardPayload(row.payload)).filter(Boolean) as ReferralRewardLedgerEntry[];
  const lifetimeEarned = entries
    .filter((entry) => entry.type === "submission_credit" && entry.amount > 0)
    .reduce((sum, entry) => sum + entry.amount, 0);
  const lifetimeSpent = Math.abs(
    entries
      .filter((entry) => entry.type === "submission_credit" && entry.amount < 0)
      .reduce((sum, entry) => sum + entry.amount, 0)
  );
  return {
    availableCredits: sumSubmissionCredits(entries),
    lifetimeEarned,
    lifetimeSpent,
  };
}

export async function getWeeklySubmissionUsage(userId: string, now = new Date()): Promise<number> {
  const { start, end } = getUtcCalendarWeekWindow(now);
  const usage = await db.usageLedger.findUnique({
    where: {
      userId_actionType_periodStart_periodEnd: {
        userId,
        actionType: WEEKLY_REVIEW_SUBMISSION_ACTION,
        periodStart: start,
        periodEnd: end,
      },
    },
    select: { count: true },
  });
  return usage?.count ?? 0;
}

export async function getWeeklySubmissionStatus(userId: string, now = new Date()): Promise<WeeklySubmissionStatus> {
  const [planId, usedCount, creditBalance] = await Promise.all([
    getUserPlan(userId),
    getWeeklySubmissionUsage(userId, now),
    getSubmissionCreditBalance(userId),
  ]);
  return calculateWeeklySubmissionStatus({
    planId,
    usedCount,
    submissionCreditsAvailable: creditBalance.availableCredits,
    now,
  });
}

export async function hasWeeklySubmissionLedger(userId: string, idempotencyKey: string): Promise<boolean> {
  const existing = await db.queuedAction.findFirst({
    where: {
      userId,
      actionType: WEEKLY_REVIEW_SUBMISSION_LEDGER_ACTION,
      payload: {
        path: ["idempotencyKey"],
        equals: idempotencyKey,
      } as Prisma.JsonFilter,
    },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function consumeWeeklySubmissionAllowance(input: {
  userId: string;
  startupId: string;
  pitchDeckUpdatedAt?: Date | string | null;
  now?: Date;
}): Promise<{ consumed: boolean; usedCredit: boolean; status: WeeklySubmissionStatus }> {
  const now = input.now ?? new Date();
  const idempotencyKey = buildWeeklySubmissionIdempotencyKey(input);
  const alreadyConsumed = await hasWeeklySubmissionLedger(input.userId, idempotencyKey);
  const status = await getWeeklySubmissionStatus(input.userId, now);

  if (alreadyConsumed) {
    return { consumed: false, usedCredit: false, status };
  }
  if (!status.canSubmit) {
    throw new Error(status.reason ?? "Weekly review submission limit reached.");
  }

  const { start, end } = getUtcCalendarWeekWindow(now);
  await db.$transaction(async (tx) => {
    if (!status.isPaid) {
      await tx.usageLedger.upsert({
        where: {
          userId_actionType_periodStart_periodEnd: {
            userId: input.userId,
            actionType: WEEKLY_REVIEW_SUBMISSION_ACTION,
            periodStart: start,
            periodEnd: end,
          },
        },
        update: { count: { increment: 1 } },
        create: {
          userId: input.userId,
          actionType: WEEKLY_REVIEW_SUBMISSION_ACTION,
          count: 1,
          periodStart: start,
          periodEnd: end,
        },
      });
    }

    if (status.willUseCredit) {
      const creditSpend = createReferralRewardLedgerEntry({
        userId: input.userId,
        type: "submission_credit",
        amount: -1,
        reason: "weekly_cap_bypass",
        idempotencyKey: `submission-credit-spend:${idempotencyKey}`,
        now,
        metadataSafe: { startupId: input.startupId },
      });
      await tx.queuedAction.create({
        data: {
          userId: input.userId,
          startupId: input.startupId,
          actionType: REFERRAL_REWARD_ACTION_TYPE,
          payload: creditSpend as unknown as Prisma.InputJsonValue,
          status: "completed",
          processedAt: now,
        },
      });
    }

    await tx.queuedAction.create({
      data: {
        userId: input.userId,
        startupId: input.startupId,
        actionType: WEEKLY_REVIEW_SUBMISSION_LEDGER_ACTION,
        payload: {
          version: "weekly-review-submission-v0.1",
          userId: input.userId,
          startupId: input.startupId,
          idempotencyKey,
          usedCredit: status.willUseCredit,
          windowStart: start.toISOString(),
          windowEnd: end.toISOString(),
          createdAt: now.toISOString(),
        } as unknown as Prisma.InputJsonValue,
        status: "completed",
        processedAt: now,
      },
    });
  });

  return { consumed: true, usedCredit: status.willUseCredit, status };
}
