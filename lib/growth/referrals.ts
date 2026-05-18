import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  REFERRAL_ATTRIBUTION_ACTION_TYPE,
  REFERRAL_CODE_ACTION_TYPE,
  REFERRAL_REWARD_ACTION_TYPE,
  REFERRAL_SIGNUP_FOUNDER_POINTS,
  REFERRAL_SIGNUP_SUBMISSION_CREDITS,
  ReferralAttributionPayload,
  ReferralCodePayload,
  ReferralRewardLedgerEntry,
  buildReferralLink,
  buildReferralRewardIdempotencyKey,
  canAttributeReferral,
  createReferralRewardLedgerEntry,
  generateStableReferralCode,
  normalizeReferralCode,
  sumFounderPoints,
  sumSubmissionCredits,
} from "./referral-rules";

function parseReferralCodePayload(value: unknown): ReferralCodePayload | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.version !== "referral-code-v0.1") return null;
  if (typeof record.ownerUserId !== "string" || typeof record.code !== "string") return null;
  return record as unknown as ReferralCodePayload;
}

function parseAttributionPayload(value: unknown): ReferralAttributionPayload | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.version !== "referral-attribution-v0.1") return null;
  if (typeof record.referrerUserId !== "string" || typeof record.referredUserId !== "string") return null;
  return record as unknown as ReferralAttributionPayload;
}

function parseRewardPayload(value: unknown): ReferralRewardLedgerEntry | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.version !== "referral-reward-v0.1") return null;
  if (typeof record.userId !== "string" || typeof record.type !== "string") return null;
  if (typeof record.amount !== "number" || typeof record.idempotencyKey !== "string") return null;
  return record as unknown as ReferralRewardLedgerEntry;
}

export async function getOrCreateReferralCode(userId: string): Promise<ReferralCodePayload> {
  const existing = await db.queuedAction.findFirst({
    where: { userId, actionType: REFERRAL_CODE_ACTION_TYPE, status: "active" },
    orderBy: { queuedAt: "asc" },
  });
  const existingPayload = existing ? parseReferralCodePayload(existing.payload) : null;
  if (existingPayload) return existingPayload;

  const payload: ReferralCodePayload = {
    version: "referral-code-v0.1",
    ownerUserId: userId,
    code: generateStableReferralCode(userId),
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };
  await db.queuedAction.create({
    data: {
      userId,
      actionType: REFERRAL_CODE_ACTION_TYPE,
      payload: payload as unknown as Prisma.InputJsonValue,
      status: "active",
    },
  });
  return payload;
}

export async function findReferralCode(code: string): Promise<ReferralCodePayload | null> {
  const normalized = normalizeReferralCode(code);
  const rows = await db.queuedAction.findMany({
    where: { actionType: REFERRAL_CODE_ACTION_TYPE, status: "active" },
    take: 500,
  });
  for (const row of rows) {
    const payload = parseReferralCodePayload(row.payload);
    if (payload?.code === normalized && !payload.disabledAt) return payload;
  }
  return null;
}

export async function getReferralAttributionForUser(userId: string): Promise<ReferralAttributionPayload | null> {
  const row = await db.queuedAction.findFirst({
    where: { userId, actionType: REFERRAL_ATTRIBUTION_ACTION_TYPE },
    orderBy: { queuedAt: "asc" },
  });
  return row ? parseAttributionPayload(row.payload) : null;
}

async function createRewardIfMissing(input: {
  userId: string;
  type: "founder_points" | "submission_credit";
  amount: number;
  reason: "referral_signup" | "referred_first_review";
  referredUserId: string;
  sourceReferralId?: string;
  sourceUserId?: string;
  now: Date;
}) {
  const idempotencyKey = buildReferralRewardIdempotencyKey({
    userId: input.userId,
    referredUserId: input.referredUserId,
    reason: input.reason,
    type: input.type,
  });
  const existing = await db.queuedAction.findFirst({
    where: {
      userId: input.userId,
      actionType: REFERRAL_REWARD_ACTION_TYPE,
      payload: {
        path: ["idempotencyKey"],
        equals: idempotencyKey,
      } as Prisma.JsonFilter,
    },
    select: { id: true },
  });
  if (existing) return null;

  const payload = createReferralRewardLedgerEntry({
    userId: input.userId,
    type: input.type,
    amount: input.amount,
    reason: input.reason,
    sourceReferralId: input.sourceReferralId,
    sourceUserId: input.sourceUserId,
    idempotencyKey,
    now: input.now,
  });
  return db.queuedAction.create({
    data: {
      userId: input.userId,
      actionType: REFERRAL_REWARD_ACTION_TYPE,
      payload: payload as unknown as Prisma.InputJsonValue,
      status: "completed",
      processedAt: input.now,
    },
  });
}

export async function attributeReferralByCode(input: {
  referredUserId: string;
  code: string;
  now?: Date;
}): Promise<{ applied: boolean; reason?: string; attribution?: ReferralAttributionPayload }> {
  const now = input.now ?? new Date();
  const referralCode = await findReferralCode(input.code);
  if (!referralCode) return { applied: false, reason: "Referral code not found." };

  const existing = await getReferralAttributionForUser(input.referredUserId);
  const allowed = canAttributeReferral({
    referrerUserId: referralCode.ownerUserId,
    referredUserId: input.referredUserId,
    existingReferrerUserId: existing?.referrerUserId,
    codeDisabled: Boolean(referralCode.disabledAt),
  });
  if (!allowed.allowed) return { applied: false, reason: allowed.reason, attribution: existing ?? undefined };
  if (existing) return { applied: false, reason: "Referral already attributed.", attribution: existing };

  const attribution: ReferralAttributionPayload = {
    version: "referral-attribution-v0.1",
    referralCode: referralCode.code,
    referrerUserId: referralCode.ownerUserId,
    referredUserId: input.referredUserId,
    status: "rewarded",
    registeredAt: now.toISOString(),
    rewardedAt: now.toISOString(),
  };

  const created = await db.queuedAction.create({
    data: {
      userId: input.referredUserId,
      actionType: REFERRAL_ATTRIBUTION_ACTION_TYPE,
      payload: attribution as unknown as Prisma.InputJsonValue,
      status: "completed",
      processedAt: now,
    },
  });

  await Promise.all([
    createRewardIfMissing({
      userId: referralCode.ownerUserId,
      type: "founder_points",
      amount: REFERRAL_SIGNUP_FOUNDER_POINTS,
      reason: "referral_signup",
      referredUserId: input.referredUserId,
      sourceReferralId: created.id,
      sourceUserId: input.referredUserId,
      now,
    }),
    createRewardIfMissing({
      userId: referralCode.ownerUserId,
      type: "submission_credit",
      amount: REFERRAL_SIGNUP_SUBMISSION_CREDITS,
      reason: "referral_signup",
      referredUserId: input.referredUserId,
      sourceReferralId: created.id,
      sourceUserId: input.referredUserId,
      now,
    }),
    createRewardIfMissing({
      userId: input.referredUserId,
      type: "founder_points",
      amount: REFERRAL_SIGNUP_FOUNDER_POINTS,
      reason: "referral_signup",
      referredUserId: input.referredUserId,
      sourceReferralId: created.id,
      sourceUserId: referralCode.ownerUserId,
      now,
    }),
    createRewardIfMissing({
      userId: input.referredUserId,
      type: "submission_credit",
      amount: REFERRAL_SIGNUP_SUBMISSION_CREDITS,
      reason: "referral_signup",
      referredUserId: input.referredUserId,
      sourceReferralId: created.id,
      sourceUserId: referralCode.ownerUserId,
      now,
    }),
  ]);

  return { applied: true, attribution };
}

export async function getReferralRewardEntries(userId: string): Promise<ReferralRewardLedgerEntry[]> {
  const rows = await db.queuedAction.findMany({
    where: { userId, actionType: REFERRAL_REWARD_ACTION_TYPE, status: "completed" },
    orderBy: { queuedAt: "desc" },
    take: 100,
  });
  return rows.map((row) => parseRewardPayload(row.payload)).filter(Boolean) as ReferralRewardLedgerEntry[];
}

export async function getReferralDashboard(userId: string, baseUrl: string) {
  const [codePayload, rewards, signups] = await Promise.all([
    getOrCreateReferralCode(userId),
    getReferralRewardEntries(userId),
    db.queuedAction.count({
      where: {
        actionType: REFERRAL_ATTRIBUTION_ACTION_TYPE,
        payload: {
          path: ["referrerUserId"],
          equals: userId,
        } as Prisma.JsonFilter,
      },
    }),
  ]);

  const submissionCreditsAvailable = sumSubmissionCredits(rewards);
  return {
    code: codePayload.code,
    link: buildReferralLink(baseUrl, codePayload.code),
    signups,
    qualifiedReferrals: signups,
    founderPoints: sumFounderPoints(rewards),
    submissionCreditsAvailable,
    rewardLedger: rewards,
  };
}
