import type { PlanId } from "@/lib/billing/plans";

export type RewardedAdProvider =
  | "mock"
  | "google_admob_future"
  | "google_h5_future"
  | "unity_future"
  | "applovin_future"
  | "custom_future";

export type RewardedAdPlacement =
  | "review_queue_acceleration"
  | "extra_vc_note_future"
  | "rival_intel_future"
  | "documentary_style_future";

export type AdRewardType = "review_queue_accelerator";

export type AdRewardStatus =
  | "offered"
  | "started"
  | "completed"
  | "rewarded"
  | "failed"
  | "expired"
  | "cancelled";

export interface AdRewardLedgerEntry {
  id: string;
  userId?: string;
  startupId?: string;
  reviewId: string;
  placement: RewardedAdPlacement;
  rewardType: AdRewardType;
  provider: RewardedAdProvider;
  status: AdRewardStatus;
  rewardValue: string;
  beforeReadyAt?: string;
  afterReadyAt?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  rewardedAt?: string;
  idempotencyKey: string;
  mockMode: true;
}

export interface ReviewAccelerationState {
  version: "rewarded-review-acceleration-v0.1";
  reviewId: string;
  startupId?: string;
  baseReadyAt: string;
  currentReadyAt: string;
  minReadyAt: string;
  acceleratorCount: number;
  maxAccelerators: number;
  ledger: AdRewardLedgerEntry[];
  lastRewardedAt?: string;
}

export interface RewardPreview {
  beforeReadyAt: string;
  afterReadyAt: string;
  beforeWaitSeconds: number;
  afterWaitSeconds: number;
  reductionSeconds: number;
}

export interface RewardEligibility {
  eligible: boolean;
  reason: string;
  currentWaitSeconds: number;
  rewardPreview: RewardPreview | null;
  dailyRewardsUsed: number;
  dailyRewardLimit: number;
  reviewAcceleratorsUsed: number;
  reviewAcceleratorLimit: number;
}

export interface RewardedReviewContext {
  reviewId: string;
  startupId?: string;
  reviewCreatedAt: Date | string;
  rawResponse?: unknown;
  cooldownSeconds: number;
  planId: PlanId;
  dailyRewardsUsed: number;
  now?: Date | string;
}

export const REWARDED_REVIEW_STATE_KEY = "rewardedReviewAcceleration";
export const REWARDED_REVIEW_VERSION = "rewarded-review-acceleration-v0.1" as const;

export const REVIEW_QUEUE_ACCELERATION_LIMITS = {
  dailyRewardLimit: 6,
  maxAcceleratorsPerReview: 2,
  firstAcceleratorTargetSeconds: 15 * 60,
  secondAcceleratorTargetSeconds: 5 * 60,
  minimumReadyDelaySeconds: 5 * 60,
  mockCountdownSeconds: 5,
};

const DEFAULT_PROVIDER: RewardedAdProvider = "mock";
const DEFAULT_PLACEMENT: RewardedAdPlacement = "review_queue_acceleration";
const DEFAULT_REWARD_TYPE: AdRewardType = "review_queue_accelerator";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function toIso(value: Date | string): string {
  return toDate(value).toISOString();
}

function addSeconds(value: Date | string, seconds: number): Date {
  return new Date(toDate(value).getTime() + seconds * 1000);
}

function secondsUntil(target: Date | string, now: Date | string): number {
  return Math.max(0, Math.ceil((toDate(target).getTime() - toDate(now).getTime()) / 1000));
}

function getTargetSeconds(acceleratorCount: number): number {
  return acceleratorCount <= 0
    ? REVIEW_QUEUE_ACCELERATION_LIMITS.firstAcceleratorTargetSeconds
    : REVIEW_QUEUE_ACCELERATION_LIMITS.secondAcceleratorTargetSeconds;
}

function normalizeLedger(value: unknown): AdRewardLedgerEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is AdRewardLedgerEntry => {
    if (!isRecord(entry)) return false;
    return (
      typeof entry.id === "string" &&
      typeof entry.reviewId === "string" &&
      entry.provider === "mock" &&
      entry.placement === DEFAULT_PLACEMENT &&
      entry.rewardType === DEFAULT_REWARD_TYPE &&
      typeof entry.status === "string"
    );
  });
}

export function getReviewAccelerationState(input: {
  reviewId: string;
  startupId?: string;
  reviewCreatedAt: Date | string;
  rawResponse?: unknown;
  cooldownSeconds: number;
}): ReviewAccelerationState {
  const baseReadyAt = addSeconds(input.reviewCreatedAt, input.cooldownSeconds);
  const minReadyAt = addSeconds(
    input.reviewCreatedAt,
    REVIEW_QUEUE_ACCELERATION_LIMITS.minimumReadyDelaySeconds
  );
  const raw = isRecord(input.rawResponse) ? input.rawResponse : {};
  const existing = raw[REWARDED_REVIEW_STATE_KEY];

  if (isRecord(existing) && existing.version === REWARDED_REVIEW_VERSION) {
    const ledger = normalizeLedger(existing.ledger);
    const rewardedCount = ledger.filter((entry) => entry.status === "rewarded").length;
    return {
      version: REWARDED_REVIEW_VERSION,
      reviewId: typeof existing.reviewId === "string" ? existing.reviewId : input.reviewId,
      startupId: typeof existing.startupId === "string" ? existing.startupId : input.startupId,
      baseReadyAt: typeof existing.baseReadyAt === "string" ? existing.baseReadyAt : baseReadyAt.toISOString(),
      currentReadyAt:
        typeof existing.currentReadyAt === "string" ? existing.currentReadyAt : baseReadyAt.toISOString(),
      minReadyAt: typeof existing.minReadyAt === "string" ? existing.minReadyAt : minReadyAt.toISOString(),
      acceleratorCount:
        typeof existing.acceleratorCount === "number" ? existing.acceleratorCount : rewardedCount,
      maxAccelerators:
        typeof existing.maxAccelerators === "number"
          ? existing.maxAccelerators
          : REVIEW_QUEUE_ACCELERATION_LIMITS.maxAcceleratorsPerReview,
      ledger,
      lastRewardedAt: typeof existing.lastRewardedAt === "string" ? existing.lastRewardedAt : undefined,
    };
  }

  return {
    version: REWARDED_REVIEW_VERSION,
    reviewId: input.reviewId,
    startupId: input.startupId,
    baseReadyAt: baseReadyAt.toISOString(),
    currentReadyAt: baseReadyAt.toISOString(),
    minReadyAt: minReadyAt.toISOString(),
    acceleratorCount: 0,
    maxAccelerators: REVIEW_QUEUE_ACCELERATION_LIMITS.maxAcceleratorsPerReview,
    ledger: [],
  };
}

export function withReviewAccelerationState(rawResponse: unknown, state: ReviewAccelerationState) {
  const raw = isRecord(rawResponse) ? { ...rawResponse } : {};
  raw[REWARDED_REVIEW_STATE_KEY] = state;
  return raw;
}

export function getEffectiveReviewReadyAt(input: {
  reviewId: string;
  startupId?: string;
  reviewCreatedAt: Date | string;
  rawResponse?: unknown;
  cooldownSeconds: number;
}): Date {
  const state = getReviewAccelerationState(input);
  return toDate(state.currentReadyAt);
}

export function getReviewAccelerationEligibility(input: RewardedReviewContext): RewardEligibility {
  const now = input.now ?? new Date();
  const state = getReviewAccelerationState(input);
  const currentWaitSeconds = secondsUntil(state.currentReadyAt, now);
  const reviewAcceleratorsUsed = state.acceleratorCount;
  const reviewAcceleratorLimit = state.maxAccelerators;
  const reservedAccelerators = state.ledger.filter((entry) =>
    entry.status === "started" || entry.status === "completed" || entry.status === "rewarded"
  ).length;

  const base = {
    currentWaitSeconds,
    rewardPreview: null,
    dailyRewardsUsed: input.dailyRewardsUsed,
    dailyRewardLimit: REVIEW_QUEUE_ACCELERATION_LIMITS.dailyRewardLimit,
    reviewAcceleratorsUsed,
    reviewAcceleratorLimit,
  };

  if (input.planId !== "free") {
    return {
      ...base,
      eligible: false,
      reason: "Pro and Max plans already remove review cooldowns, so ads are not needed.",
    };
  }

  if (input.cooldownSeconds <= 0) {
    return { ...base, eligible: false, reason: "This review path has no active wait." };
  }

  if (currentWaitSeconds <= 0) {
    return { ...base, eligible: false, reason: "The next review is already ready." };
  }

  if (reviewAcceleratorsUsed >= reviewAcceleratorLimit || reservedAccelerators >= reviewAcceleratorLimit) {
    return { ...base, eligible: false, reason: "This review already used the maximum accelerators." };
  }

  if (input.dailyRewardsUsed >= REVIEW_QUEUE_ACCELERATION_LIMITS.dailyRewardLimit) {
    return { ...base, eligible: false, reason: "Daily rewarded accelerator limit reached." };
  }

  const targetSeconds = getTargetSeconds(reviewAcceleratorsUsed);
  if (currentWaitSeconds <= targetSeconds) {
    return {
      ...base,
      eligible: false,
      reason: "The remaining wait is already below this accelerator tier.",
    };
  }

  const preview = previewRewardApplication(state, now);
  return {
    ...base,
    eligible: preview.reductionSeconds > 0,
    reason: preview.reductionSeconds > 0
      ? "Eligible for an optional mock rewarded sponsor video."
      : "This accelerator would not reduce the current wait.",
    rewardPreview: preview,
  };
}

export function previewRewardApplication(
  state: ReviewAccelerationState,
  now: Date | string = new Date()
): RewardPreview {
  const targetSeconds = getTargetSeconds(state.acceleratorCount);
  const targetReadyAtMs = Math.max(
    addSeconds(now, targetSeconds).getTime(),
    toDate(state.minReadyAt).getTime()
  );
  const beforeReadyAtMs = toDate(state.currentReadyAt).getTime();
  const afterReadyAt = new Date(Math.min(beforeReadyAtMs, targetReadyAtMs));
  const beforeWaitSeconds = secondsUntil(state.currentReadyAt, now);
  const afterWaitSeconds = secondsUntil(afterReadyAt, now);

  return {
    beforeReadyAt: state.currentReadyAt,
    afterReadyAt: afterReadyAt.toISOString(),
    beforeWaitSeconds,
    afterWaitSeconds,
    reductionSeconds: Math.max(0, beforeWaitSeconds - afterWaitSeconds),
  };
}

export function startMockRewardedReview(input: {
  state: ReviewAccelerationState;
  userId: string;
  startupId?: string;
  now?: Date | string;
  ledgerEntryId: string;
}): ReviewAccelerationState {
  const nowIso = toIso(input.now ?? new Date());
  const entry: AdRewardLedgerEntry = {
    id: input.ledgerEntryId,
    userId: input.userId,
    startupId: input.startupId ?? input.state.startupId,
    reviewId: input.state.reviewId,
    placement: DEFAULT_PLACEMENT,
    rewardType: DEFAULT_REWARD_TYPE,
    provider: DEFAULT_PROVIDER,
    status: "started",
    rewardValue: "review_queue_accelerator",
    beforeReadyAt: input.state.currentReadyAt,
    createdAt: nowIso,
    startedAt: nowIso,
    idempotencyKey: `${input.state.reviewId}:${DEFAULT_PLACEMENT}:${input.ledgerEntryId}`,
    mockMode: true,
  };

  return {
    ...input.state,
    ledger: [...input.state.ledger, entry],
  };
}

export function completeMockRewardedReview(input: {
  state: ReviewAccelerationState;
  ledgerEntryId: string;
  now?: Date | string;
}): { state: ReviewAccelerationState; changed: boolean; preview: RewardPreview } {
  const existing = input.state.ledger.find((entry) => entry.id === input.ledgerEntryId);
  if (!existing) {
    throw new Error("Reward ledger entry not found.");
  }

  const currentPreview = previewRewardApplication(input.state, input.now);

  if (existing.status === "rewarded") {
    return { state: input.state, changed: false, preview: currentPreview };
  }

  if (existing.status !== "started" && existing.status !== "completed") {
    throw new Error("Reward ledger entry is not completable.");
  }

  if (input.state.acceleratorCount >= input.state.maxAccelerators) {
    throw new Error("This review already used the maximum accelerators.");
  }

  const nowIso = toIso(input.now ?? new Date());
  const nextState: ReviewAccelerationState = {
    ...input.state,
    currentReadyAt: currentPreview.afterReadyAt,
    acceleratorCount: Math.min(input.state.maxAccelerators, input.state.acceleratorCount + 1),
    lastRewardedAt: nowIso,
    ledger: input.state.ledger.map((entry) =>
      entry.id === input.ledgerEntryId
        ? {
            ...entry,
            status: "rewarded",
            completedAt: entry.completedAt ?? nowIso,
            rewardedAt: entry.rewardedAt ?? nowIso,
            beforeReadyAt: entry.beforeReadyAt ?? currentPreview.beforeReadyAt,
            afterReadyAt: currentPreview.afterReadyAt,
          }
        : entry
    ),
  };

  return { state: nextState, changed: true, preview: currentPreview };
}

export function cancelMockRewardedReview(input: {
  state: ReviewAccelerationState;
  ledgerEntryId: string;
  now?: Date | string;
}): { state: ReviewAccelerationState; changed: boolean } {
  const existing = input.state.ledger.find((entry) => entry.id === input.ledgerEntryId);
  if (!existing) {
    throw new Error("Reward ledger entry not found.");
  }
  if (existing.status === "rewarded" || existing.status === "cancelled") {
    return { state: input.state, changed: false };
  }
  const nowIso = toIso(input.now ?? new Date());
  return {
    changed: true,
    state: {
      ...input.state,
      ledger: input.state.ledger.map((entry) =>
        entry.id === input.ledgerEntryId ? { ...entry, status: "cancelled", completedAt: nowIso } : entry
      ),
    },
  };
}

export function countDailyRewardedReviewAccelerators(
  rawResponses: unknown[],
  now: Date | string = new Date()
): number {
  const day = toDate(now);
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return rawResponses.reduce<number>((count, raw) => {
    const state = isRecord(raw) ? raw[REWARDED_REVIEW_STATE_KEY] : null;
    const ledger = isRecord(state) ? normalizeLedger(state.ledger) : [];
    return count + ledger.filter((entry) => {
      if (entry.status !== "rewarded" || !entry.rewardedAt) return false;
      const rewardedAt = new Date(entry.rewardedAt);
      return rewardedAt >= start && rewardedAt < end;
    }).length;
  }, 0);
}
