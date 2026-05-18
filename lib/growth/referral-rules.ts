import { createHash } from "crypto";

export const REFERRAL_COOKIE_NAME = "fa_referral_code";
export const REFERRAL_CODE_ACTION_TYPE = "referralCode";
export const REFERRAL_ATTRIBUTION_ACTION_TYPE = "referralAttribution";
export const REFERRAL_REWARD_ACTION_TYPE = "referralReward";
export const REFERRAL_REWARD_VERSION = "referral-reward-v0.1" as const;

export const REFERRAL_SIGNUP_FOUNDER_POINTS = 100;
export const REFERRAL_SIGNUP_SUBMISSION_CREDITS = 1;
export const REFERRAL_FIRST_REVIEW_REFERRER_CREDITS = 1;

export type ReferralAttributionStatus = "registered" | "qualified" | "rewarded" | "rejected";
export type ReferralRewardType = "founder_points" | "submission_credit" | "referral_badge_future";
export type ReferralRewardReason =
  | "referral_signup"
  | "referred_first_review"
  | "beta_bonus"
  | "manual_admin_future"
  | "weekly_cap_bypass";

export interface ReferralRewardLedgerEntry {
  version: typeof REFERRAL_REWARD_VERSION;
  userId: string;
  type: ReferralRewardType;
  amount: number;
  reason: ReferralRewardReason;
  sourceReferralId?: string;
  sourceUserId?: string;
  idempotencyKey: string;
  createdAt: string;
  metadataSafe?: Record<string, string | number | boolean | null>;
}

export interface ReferralCodePayload {
  version: "referral-code-v0.1";
  ownerUserId: string;
  code: string;
  usageCount: number;
  createdAt: string;
  disabledAt?: string;
}

export interface ReferralAttributionPayload {
  version: "referral-attribution-v0.1";
  referralCode: string;
  referrerUserId: string;
  referredUserId: string;
  status: ReferralAttributionStatus;
  registeredAt: string;
  qualifiedAt?: string;
  rewardedAt?: string;
  rejectionReason?: string;
}

export function generateStableReferralCode(userId: string): string {
  const digest = createHash("sha256")
    .update(`founder-arena-referral:${userId}`)
    .digest("base64url")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase();
  return `FA${digest.slice(0, 8)}`;
}

export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
}

export function buildReferralLink(baseUrl: string, code: string): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  return `${cleanBase}/r/${encodeURIComponent(normalizeReferralCode(code))}`;
}

export function canAttributeReferral(input: {
  referrerUserId: string;
  referredUserId: string;
  existingReferrerUserId?: string | null;
  codeDisabled?: boolean;
}): { allowed: true } | { allowed: false; reason: string } {
  if (input.referrerUserId === input.referredUserId) {
    return { allowed: false, reason: "Self-referrals are not eligible for rewards." };
  }
  if (input.codeDisabled) {
    return { allowed: false, reason: "Referral code is disabled." };
  }
  if (input.existingReferrerUserId && input.existingReferrerUserId !== input.referrerUserId) {
    return { allowed: false, reason: "This founder already has a referrer." };
  }
  return { allowed: true };
}

export function buildReferralRewardIdempotencyKey(input: {
  userId: string;
  referredUserId: string;
  reason: ReferralRewardReason;
  type: ReferralRewardType;
}): string {
  return `referral-reward:${input.reason}:${input.type}:${input.userId}:${input.referredUserId}`;
}

export function createReferralRewardLedgerEntry(input: {
  userId: string;
  type: ReferralRewardType;
  amount: number;
  reason: ReferralRewardReason;
  sourceReferralId?: string;
  sourceUserId?: string;
  idempotencyKey: string;
  now?: Date;
  metadataSafe?: Record<string, string | number | boolean | null>;
}): ReferralRewardLedgerEntry {
  return {
    version: REFERRAL_REWARD_VERSION,
    userId: input.userId,
    type: input.type,
    amount: input.amount,
    reason: input.reason,
    sourceReferralId: input.sourceReferralId,
    sourceUserId: input.sourceUserId,
    idempotencyKey: input.idempotencyKey,
    createdAt: (input.now ?? new Date()).toISOString(),
    metadataSafe: input.metadataSafe,
  };
}

export function sumFounderPoints(entries: ReferralRewardLedgerEntry[]): number {
  return entries
    .filter((entry) => entry.type === "founder_points")
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export function sumSubmissionCredits(entries: ReferralRewardLedgerEntry[]): number {
  return Math.max(
    0,
    entries
      .filter((entry) => entry.type === "submission_credit")
      .reduce((sum, entry) => sum + entry.amount, 0)
  );
}

export function isCashLikeRewardType(type: string): boolean {
  return /cash|crypto|token|withdraw|gift|payout|bank|usd|money/i.test(type);
}
