import "server-only";

import { db } from "@/lib/db";
import {
  AI_REVIEW_ACTION_TYPE,
  isAIReviewJobStaleRunning,
  parseAIReviewJobPayload,
  reclaimStaleRunningPayload,
} from "@/lib/ai-review/review-queue";
import { getAIReviewRuntimeConfig } from "@/lib/ai-review/config";
import type { AIReviewJobPayload } from "@/lib/ai-review/types";
import {
  REFERRAL_ATTRIBUTION_ACTION_TYPE,
  REFERRAL_CODE_ACTION_TYPE,
  REFERRAL_REWARD_ACTION_TYPE,
} from "@/lib/growth/referral-rules";
import {
  WEEKLY_REVIEW_SUBMISSION_ACTION,
  WEEKLY_REVIEW_SUBMISSION_LEDGER_ACTION,
  getUtcCalendarWeekWindow,
} from "@/lib/growth/submission-limits";

export type AdminAccessResult =
  | { allowed: true; configured: true; adminUserId: string }
  | { allowed: false; configured: boolean; reason: string };

export const ADMIN_AUDIT_ACTION_TYPE = "adminBetaAudit";
export const ADMIN_AUDIT_VERSION = "admin-audit-v0.1" as const;
export const BETA_FEEDBACK_ACTION_TYPE = "betaFeedback";
export const BETA_FEEDBACK_VERSION = "beta-feedback-v0.1" as const;

export const BETA_FEEDBACK_TYPES = [
  "ai_review_quality",
  "bug_report",
  "gameplay_balance",
  "confusing_ui",
  "referral_issue",
  "other",
] as const;

export const BETA_FEEDBACK_STATUSES = ["open", "reviewed", "resolved", "ignored"] as const;

export type BetaFeedbackType = (typeof BETA_FEEDBACK_TYPES)[number];
export type BetaFeedbackStatus = (typeof BETA_FEEDBACK_STATUSES)[number];

type SafeJson = Record<string, unknown>;

export interface SafeReviewJobRow {
  id: string;
  startupId: string | null;
  status: string;
  queuedAt: Date;
  processedAt: Date | null;
  payload: unknown;
  error: string | null;
}

export interface SafeReferralRow {
  id: string;
  userId: string;
  actionType: string;
  status: string;
  queuedAt: Date;
  processedAt: Date | null;
  payload: unknown;
}

export interface SafeUsageRow {
  userId: string;
  actionType: string;
  count: number;
  periodStart: Date;
  periodEnd: Date;
  user?: { plan: string | null } | null;
}

export interface SafeAdminAuditRow {
  id: string;
  userId: string;
  actionType: string;
  status: string;
  queuedAt: Date;
  processedAt: Date | null;
  payload: unknown;
}

export interface SafeFeedbackRow {
  id: string;
  userId: string;
  startupId: string | null;
  actionType: string;
  status: string;
  queuedAt: Date;
  processedAt: Date | null;
  payload: unknown;
}

export function maskAdminIdentifier(value: string | null | undefined): string {
  if (!value) return "unknown";
  if (value.includes("@")) {
    const [name, domain] = value.split("@");
    return `${name.slice(0, 2)}***@${domain}`;
  }
  if (value.length <= 8) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function parseList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function evaluatePrivateBetaAdminAccess(
  user: { id: string; email?: string | null } | null,
  env: Partial<NodeJS.ProcessEnv> = process.env
): AdminAccessResult {
  const adminEmails = parseList(env.ADMIN_EMAILS);
  const adminUserIds = parseList(env.ADMIN_USER_IDS);
  const configured = adminEmails.length > 0 || adminUserIds.length > 0;
  if (!configured) {
    return { allowed: false, configured: false, reason: "Admin access is not configured." };
  }
  if (!user) {
    return { allowed: false, configured: true, reason: "Sign in with an admin account." };
  }
  const emailAllowed = user.email ? adminEmails.includes(user.email.toLowerCase()) : false;
  const idAllowed = adminUserIds.includes(user.id.toLowerCase());
  if (!emailAllowed && !idAllowed) {
    return { allowed: false, configured: true, reason: "This account is not allowed to view private beta operations." };
  }
  return { allowed: true, configured: true, adminUserId: user.id };
}

export function sanitizeAdminError(error: string | null | undefined): string | undefined {
  if (!error) return undefined;
  const lower = error.toLowerCase();
  if (lower.includes("rate") || lower.includes("429")) return "rate_limited";
  if (lower.includes("timeout") || lower.includes("timed out")) return "timeout";
  if (lower.includes("json") || lower.includes("schema") || lower.includes("parse")) return "invalid_provider_json";
  if (lower.includes("config") || lower.includes("key")) return "provider_config";
  if (lower.includes("network") || lower.includes("fetch")) return "network_error";
  return "provider_error";
}

function asRecord(value: unknown): SafeJson | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as SafeJson) : null;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function safeIso(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function isBetaFeedbackType(value: unknown): value is BetaFeedbackType {
  return typeof value === "string" && BETA_FEEDBACK_TYPES.includes(value as BetaFeedbackType);
}

function isBetaFeedbackStatus(value: unknown): value is BetaFeedbackStatus {
  return typeof value === "string" && BETA_FEEDBACK_STATUSES.includes(value as BetaFeedbackStatus);
}

export function sanitizeFeedbackMessage(message: string, maxLength = 2000): string {
  return message
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

const FORBIDDEN_ADMIN_METADATA_KEYS = [
  "api",
  "auth",
  "email",
  "key",
  "payload",
  "pitch",
  "prompt",
  "secret",
  "session",
  "token",
];

export function sanitizeAdminMetadata(metadata: Record<string, unknown> | undefined): SafeJson {
  const safe: SafeJson = {};
  if (!metadata) return safe;
  for (const [key, value] of Object.entries(metadata)) {
    const lower = key.toLowerCase();
    if (FORBIDDEN_ADMIN_METADATA_KEYS.some((forbidden) => lower.includes(forbidden))) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      safe[key] = value;
    }
  }
  return safe;
}

export function createAdminAuditPayload(input: {
  adminUserId: string;
  actionType: string;
  targetType: "ai_review_job" | "beta_feedback" | "referral" | "system";
  targetId: string;
  previousStatus?: string;
  nextStatus?: string;
  reason?: string;
  safeMetadata?: Record<string, unknown>;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  return {
    version: ADMIN_AUDIT_VERSION,
    adminUserId: input.adminUserId,
    actionType: input.actionType,
    targetType: input.targetType,
    targetId: input.targetId,
    previousStatus: input.previousStatus,
    nextStatus: input.nextStatus,
    reason: input.reason ? sanitizeFeedbackMessage(input.reason, 240) : undefined,
    safeMetadata: sanitizeAdminMetadata(input.safeMetadata),
    createdAt: now.toISOString(),
  };
}

export function buildBetaFeedbackSafeContext(input: {
  route?: string;
  startupId?: string;
  reviewId?: string;
  decision?: string;
  score?: number;
  provider?: string;
}) {
  return {
    route: input.route?.slice(0, 180),
    startupId: input.startupId,
    reviewId: input.reviewId,
    decision: input.decision?.slice(0, 40),
    score: typeof input.score === "number" && Number.isFinite(input.score) ? input.score : undefined,
    provider: input.provider?.slice(0, 40),
  };
}

export function createBetaFeedbackPayload(input: {
  userId: string;
  startupId?: string;
  reviewId?: string;
  type: string;
  category?: string;
  rating?: number;
  message: string;
  status?: BetaFeedbackStatus;
  safeContext?: {
    route?: string;
    startupId?: string;
    reviewId?: string;
    decision?: string;
    score?: number;
    provider?: string;
  };
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const rating =
    typeof input.rating === "number" && Number.isFinite(input.rating)
      ? Math.max(1, Math.min(5, Math.round(input.rating)))
      : undefined;
  return {
    version: BETA_FEEDBACK_VERSION,
    userId: input.userId,
    startupId: input.startupId,
    reviewId: input.reviewId,
    type: isBetaFeedbackType(input.type) ? input.type : "other",
    category: input.category ? sanitizeFeedbackMessage(input.category, 80) : "other",
    rating,
    message: sanitizeFeedbackMessage(input.message),
    status: input.status ?? "open",
    safeContext: buildBetaFeedbackSafeContext({
      ...input.safeContext,
      startupId: input.safeContext?.startupId ?? input.startupId,
      reviewId: input.safeContext?.reviewId ?? input.reviewId,
    }),
    createdAt: now.toISOString(),
  };
}

export function retryFailedReviewJobPayload(payload: AIReviewJobPayload) {
  if (payload.status === "queued") {
    return { allowed: true, changed: false, reason: "already_queued", payload, nextStatus: "queued" as const };
  }
  if (payload.status !== "failed" && payload.status !== "retrying") {
    return { allowed: false, changed: false, reason: `cannot_retry_${payload.status}`, payload, nextStatus: payload.status };
  }
  const next: AIReviewJobPayload = {
    ...payload,
    status: "queued",
    maxAttempts: Math.max(payload.maxAttempts, payload.attempts + 1),
    nextRunAt: undefined,
    lockedAt: undefined,
    lockedBy: undefined,
    lastError: undefined,
    lastErrorCode: undefined,
  };
  return { allowed: true, changed: true, reason: "queued_for_retry", payload: next, nextStatus: next.status };
}

export function reclaimStaleReviewJobPayload(payload: AIReviewJobPayload, now = new Date()) {
  if (payload.status === "retrying" && payload.lastError === "Worker lock expired before completion.") {
    return { allowed: true, changed: false, reason: "already_reclaimed", payload, nextStatus: payload.status };
  }
  if (payload.status === "failed" && payload.lastError === "Worker lock expired before completion.") {
    return { allowed: true, changed: false, reason: "already_reclaimed", payload, nextStatus: payload.status };
  }
  if (payload.status !== "running") {
    return { allowed: false, changed: false, reason: `cannot_reclaim_${payload.status}`, payload, nextStatus: payload.status };
  }
  if (!isAIReviewJobStaleRunning(payload, now)) {
    return { allowed: false, changed: false, reason: "running_job_not_stale", payload, nextStatus: payload.status };
  }
  const next = reclaimStaleRunningPayload(payload, now);
  return { allowed: true, changed: true, reason: "stale_lock_reclaimed", payload: next, nextStatus: next.status };
}

export function cancelReviewJobPayload(payload: AIReviewJobPayload) {
  if (payload.status === "cancelled") {
    return { allowed: true, changed: false, reason: "already_cancelled", payload, nextStatus: "cancelled" as const };
  }
  if (payload.status === "completed") {
    return { allowed: false, changed: false, reason: "cannot_cancel_completed", payload, nextStatus: payload.status };
  }
  const next: AIReviewJobPayload = {
    ...payload,
    status: "cancelled",
    lockedAt: undefined,
    lockedBy: undefined,
    nextRunAt: undefined,
    lastError: "Cancelled by admin.",
    lastErrorCode: undefined,
  };
  return { allowed: true, changed: true, reason: "cancelled_by_admin", payload: next, nextStatus: next.status };
}

export function summarizeReviewQueueRows(rows: SafeReviewJobRow[], now = new Date()) {
  const counts = {
    queued: 0,
    running: 0,
    retrying: 0,
    failed: 0,
    completed: 0,
    cancelled: 0,
  };
  const since24h = new Date(now.getTime() - 24 * 60 * 60_000);
  let completedLast24h = 0;
  let oldestQueuedAgeMinutes = 0;
  let staleRunningCount = 0;

  const recentJobs = rows.map((row) => {
    const payload = parseAIReviewJobPayload(row.payload);
    const status = payload?.status ?? row.status;
    const isStaleRunning = payload ? isAIReviewJobStaleRunning(payload, now) : false;
    if (status in counts) counts[status as keyof typeof counts] += 1;
    if (status === "completed" && row.processedAt && row.processedAt >= since24h) completedLast24h += 1;
    if (status === "queued") {
      const age = Math.max(0, Math.round((now.getTime() - row.queuedAt.getTime()) / 60_000));
      oldestQueuedAgeMinutes = Math.max(oldestQueuedAgeMinutes, age);
    }
    if (isStaleRunning) staleRunningCount += 1;

    return {
      actionId: row.id,
      id: maskAdminIdentifier(row.id),
      startupId: maskAdminIdentifier(row.startupId),
      status,
      provider: payload?.provider ?? "unknown",
      mode: payload?.mode ?? "unknown",
      attempts: payload?.attempts ?? 0,
      maxAttempts: payload?.maxAttempts ?? 0,
      queuedAt: row.queuedAt.toISOString(),
      lockedAt: payload?.lockedAt,
      processedAt: row.processedAt?.toISOString() ?? null,
      lastErrorCategory: sanitizeAdminError(payload?.lastError ?? row.error),
      fallbackUsed: false,
      isStaleRunning,
    };
  });

  return {
    counts,
    completedLast24h,
    oldestQueuedAgeMinutes,
    staleRunningCount,
    recentJobs,
  };
}

export function summarizeAdminAuditRows(rows: SafeAdminAuditRow[]) {
  return {
    recentActions: rows.slice(0, 20).map((row) => {
      const payload = asRecord(row.payload);
      return {
        id: maskAdminIdentifier(row.id),
        adminUserId: maskAdminIdentifier(getString(payload?.adminUserId) ?? row.userId),
        actionType: getString(payload?.actionType) ?? row.actionType,
        targetType: getString(payload?.targetType) ?? "unknown",
        targetId: maskAdminIdentifier(getString(payload?.targetId)),
        previousStatus: getString(payload?.previousStatus),
        nextStatus: getString(payload?.nextStatus),
        reason: getString(payload?.reason),
        createdAt: safeIso(payload?.createdAt) ?? row.queuedAt.toISOString(),
      };
    }),
  };
}

export function summarizeBetaFeedbackRows(rows: SafeFeedbackRow[]) {
  const statuses: Record<BetaFeedbackStatus, number> = {
    open: 0,
    reviewed: 0,
    resolved: 0,
    ignored: 0,
  };
  const types: Partial<Record<BetaFeedbackType, number>> = {};
  for (const row of rows) {
    const payload = asRecord(row.payload);
    const status = isBetaFeedbackStatus(payload?.status) ? payload.status : isBetaFeedbackStatus(row.status) ? row.status : "open";
    const type = isBetaFeedbackType(payload?.type) ? payload.type : "other";
    statuses[status] += 1;
    types[type] = (types[type] ?? 0) + 1;
  }

  const recentFeedback = rows.slice(0, 25).map((row) => {
    const payload = asRecord(row.payload);
    const status = isBetaFeedbackStatus(payload?.status) ? payload.status : isBetaFeedbackStatus(row.status) ? row.status : "open";
    const type = isBetaFeedbackType(payload?.type) ? payload.type : "other";
    const safeContext = asRecord(payload?.safeContext);
    const message = sanitizeFeedbackMessage(getString(payload?.message) ?? "", 240);
    return {
      id: maskAdminIdentifier(row.id),
      userId: maskAdminIdentifier(getString(payload?.userId) ?? row.userId),
      startupId: maskAdminIdentifier(getString(payload?.startupId) ?? row.startupId),
      reviewId: maskAdminIdentifier(getString(payload?.reviewId)),
      type,
      category: getString(payload?.category) ?? "other",
      rating: getNumber(payload?.rating) || undefined,
      status,
      messagePreview: message.slice(0, 180),
      decision: getString(safeContext?.decision),
      score: getNumber(safeContext?.score) || undefined,
      provider: getString(safeContext?.provider),
      route: getString(safeContext?.route),
      createdAt: safeIso(payload?.createdAt) ?? row.queuedAt.toISOString(),
    };
  });

  return {
    openCount: statuses.open,
    statusCounts: statuses,
    typeCounts: types,
    recentFeedback,
  };
}

export function summarizeReferralRows(rows: SafeReferralRow[]) {
  const codes = rows.filter((row) => row.actionType === REFERRAL_CODE_ACTION_TYPE);
  const attributions = rows.filter((row) => row.actionType === REFERRAL_ATTRIBUTION_ACTION_TYPE);
  const rewards = rows.filter((row) => row.actionType === REFERRAL_REWARD_ACTION_TYPE);
  const attributionStatuses: Record<string, number> = {};
  const referrerCounts = new Map<string, number>();
  let founderPointsGranted = 0;
  let submissionCreditsGranted = 0;
  let submissionCreditsSpent = 0;
  const idempotencyCounts = new Map<string, number>();

  for (const row of attributions) {
    const payload = asRecord(row.payload);
    const status = getString(payload?.status) ?? row.status;
    attributionStatuses[status] = (attributionStatuses[status] ?? 0) + 1;
    const referrerUserId = getString(payload?.referrerUserId);
    if (referrerUserId) referrerCounts.set(referrerUserId, (referrerCounts.get(referrerUserId) ?? 0) + 1);
  }

  for (const row of rewards) {
    const payload = asRecord(row.payload);
    const type = getString(payload?.type);
    const amount = getNumber(payload?.amount);
    const idempotencyKey = getString(payload?.idempotencyKey);
    if (idempotencyKey) idempotencyCounts.set(idempotencyKey, (idempotencyCounts.get(idempotencyKey) ?? 0) + 1);
    if (type === "founder_points" && amount > 0) founderPointsGranted += amount;
    if (type === "submission_credit" && amount > 0) submissionCreditsGranted += amount;
    if (type === "submission_credit" && amount < 0) submissionCreditsSpent += Math.abs(amount);
  }

  return {
    totalReferralCodes: codes.length,
    totalAttributions: attributions.length,
    successfulReferrals: attributionStatuses.rewarded ?? 0,
    rejectedReferrals: attributionStatuses.rejected ?? 0,
    pendingAttributions: (attributionStatuses.pending_signup ?? 0) + (attributionStatuses.registered ?? 0),
    founderPointsGranted,
    submissionCreditsGranted,
    submissionCreditsSpent,
    duplicateRewardKeys: Array.from(idempotencyCounts.values()).filter((count) => count > 1).length,
    topReferrers: Array.from(referrerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, count]) => ({ userId: maskAdminIdentifier(userId), count })),
  };
}

export function getReferralAbuseSignals(rows: SafeReferralRow[], now = new Date()) {
  const since24h = new Date(now.getTime() - 24 * 60 * 60_000);
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60_000);
  const byCode24h = new Map<string, number>();
  const rejectedByUser = new Map<string, number>();
  const creditsEarned7d = new Map<string, number>();
  const creditsSpent7d = new Map<string, number>();
  const idempotencyCounts = new Map<string, number>();

  for (const row of rows) {
    const payload = asRecord(row.payload);
    if (row.actionType === REFERRAL_ATTRIBUTION_ACTION_TYPE) {
      const code = getString(payload?.referralCode);
      const status = getString(payload?.status);
      if (code && row.queuedAt >= since24h) byCode24h.set(code, (byCode24h.get(code) ?? 0) + 1);
      if (status === "rejected") rejectedByUser.set(row.userId, (rejectedByUser.get(row.userId) ?? 0) + 1);
    }
    if (row.actionType === REFERRAL_REWARD_ACTION_TYPE) {
      const key = getString(payload?.idempotencyKey);
      const type = getString(payload?.type);
      const amount = getNumber(payload?.amount);
      if (key) idempotencyCounts.set(key, (idempotencyCounts.get(key) ?? 0) + 1);
      if (type === "submission_credit" && row.queuedAt >= since7d && amount > 0) {
        creditsEarned7d.set(row.userId, (creditsEarned7d.get(row.userId) ?? 0) + amount);
      }
      if (type === "submission_credit" && row.queuedAt >= since7d && amount < 0) {
        creditsSpent7d.set(row.userId, (creditsSpent7d.get(row.userId) ?? 0) + Math.abs(amount));
      }
    }
  }

  const signals: Array<{ severity: "info" | "warning"; label: string; detail: string }> = [];
  for (const [code, count] of byCode24h.entries()) {
    if (count >= 5) signals.push({ severity: "warning", label: "Referral spike", detail: `${maskAdminIdentifier(code)} produced ${count} attributions in 24h.` });
  }
  for (const [userId, count] of rejectedByUser.entries()) {
    if (count >= 2) signals.push({ severity: "warning", label: "Rejected attribution attempts", detail: `${maskAdminIdentifier(userId)} has ${count} rejected attributions.` });
  }
  for (const [userId, count] of creditsEarned7d.entries()) {
    if (count >= 5) signals.push({ severity: "warning", label: "Fast credit earning", detail: `${maskAdminIdentifier(userId)} earned ${count} submission credits in 7d.` });
  }
  for (const [userId, count] of creditsSpent7d.entries()) {
    if (count >= 3) signals.push({ severity: "info", label: "Heavy credit spend", detail: `${maskAdminIdentifier(userId)} spent ${count} submission credits in 7d.` });
  }
  for (const [key, count] of idempotencyCounts.entries()) {
    if (count > 1) signals.push({ severity: "warning", label: "Duplicate reward key", detail: `${maskAdminIdentifier(key)} appears ${count} times.` });
  }
  return signals;
}

export function summarizeWeeklySubmissionRows(rows: SafeUsageRow[], now = new Date()) {
  const { start, end } = getUtcCalendarWeekWindow(now);
  const currentRows = rows.filter(
    (row) =>
      row.actionType === WEEKLY_REVIEW_SUBMISSION_ACTION &&
      row.periodStart.getTime() === start.getTime() &&
      row.periodEnd.getTime() === end.getTime()
  );
  const freeRows = currentRows.filter((row) => (row.user?.plan ?? "free") === "free");
  const paidRows = currentRows.filter((row) => (row.user?.plan ?? "free") !== "free");
  return {
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
    reviewsSubmittedThisWeek: currentRows.reduce((sum, row) => sum + row.count, 0),
    freeUsersNearCap: freeRows.filter((row) => row.count >= 2 && row.count < 3).length,
    freeUsersAtOrOverCap: freeRows.filter((row) => row.count >= 3).length,
    proMaxBypassCount: paidRows.reduce((sum, row) => sum + row.count, 0),
    topUsersBySubmissions: currentRows
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((row) => ({
        userId: maskAdminIdentifier(row.userId),
        plan: row.user?.plan ?? "free",
        count: row.count,
      })),
  };
}

export function getPrivateBetaEnvReadiness(env: NodeJS.ProcessEnv = process.env) {
  const config = getAIReviewRuntimeConfig(env);
  return {
    aiReviewEnabled: config.enabled,
    aiReviewProvider: config.provider,
    aiReviewMode: config.mode,
    deepseekKeyPresent: Boolean(env.DEEPSEEK_API_KEY),
    nextPublicDeepseekKeyPresent: Boolean(env.NEXT_PUBLIC_DEEPSEEK_API_KEY),
    adsDisabled: env.ADS_DISABLED === "true",
    rewardedAdsEnabled: env.REWARDED_ADS_ENABLED === "true",
    maxAttempts: config.maxAttempts,
    timeoutMs: config.timeoutMs,
  };
}

export async function getPrivateBetaAdminSnapshot() {
  const { getCurrentUser } = await import("@/lib/auth-helpers");
  const user = await getCurrentUser();
  const access = evaluatePrivateBetaAdminAccess(user);
  if (!access.allowed) return { access };

  const [reviewRows, referralRows, weeklyRows, auditRows, feedbackRows] = await Promise.all([
    db.queuedAction.findMany({
      where: { actionType: AI_REVIEW_ACTION_TYPE },
      orderBy: { queuedAt: "desc" },
      take: 100,
      select: { id: true, startupId: true, status: true, queuedAt: true, processedAt: true, payload: true, error: true },
    }),
    db.queuedAction.findMany({
      where: {
        actionType: { in: [REFERRAL_CODE_ACTION_TYPE, REFERRAL_ATTRIBUTION_ACTION_TYPE, REFERRAL_REWARD_ACTION_TYPE] },
      },
      orderBy: { queuedAt: "desc" },
      take: 500,
      select: { id: true, userId: true, actionType: true, status: true, queuedAt: true, processedAt: true, payload: true },
    }),
    db.usageLedger.findMany({
      where: { actionType: WEEKLY_REVIEW_SUBMISSION_ACTION },
      orderBy: { periodStart: "desc" },
      take: 200,
      select: { userId: true, actionType: true, count: true, periodStart: true, periodEnd: true, user: { select: { plan: true } } },
    }),
    db.queuedAction.findMany({
      where: { actionType: ADMIN_AUDIT_ACTION_TYPE },
      orderBy: { queuedAt: "desc" },
      take: 50,
      select: { id: true, userId: true, actionType: true, status: true, queuedAt: true, processedAt: true, payload: true },
    }),
    db.queuedAction.findMany({
      where: { actionType: BETA_FEEDBACK_ACTION_TYPE },
      orderBy: { queuedAt: "desc" },
      take: 100,
      select: { id: true, userId: true, startupId: true, actionType: true, status: true, queuedAt: true, processedAt: true, payload: true },
    }),
  ]);

  const rewardSpendRows = referralRows.filter((row) => {
    const payload = asRecord(row.payload);
    return row.actionType === REFERRAL_REWARD_ACTION_TYPE && getString(payload?.type) === "submission_credit" && getNumber(payload?.amount) < 0;
  });

  return {
    access,
    reviewQueue: summarizeReviewQueueRows(reviewRows),
    referralSummary: summarizeReferralRows(referralRows),
    abuseSignals: getReferralAbuseSignals(referralRows),
    weeklySubmissions: {
      ...summarizeWeeklySubmissionRows(weeklyRows),
      creditsSpentThisWeek: rewardSpendRows.length,
    },
    envReadiness: getPrivateBetaEnvReadiness(),
    adminAudit: summarizeAdminAuditRows(auditRows),
    feedbackInbox: summarizeBetaFeedbackRows(feedbackRows),
    docs: {
      reviewQueue: "/docs/ai-review/private-beta-deployment-hardening.md",
      referrals: "/docs/growth/referral-system-weekly-submission-limits.md",
      adminActions: "/docs/admin/private-beta-admin-actions-feedback.md",
    },
  };
}

export type PrivateBetaAdminSnapshot = Awaited<ReturnType<typeof getPrivateBetaAdminSnapshot>>;

export function isWeeklySubmissionLedgerAction(actionType: string): boolean {
  return actionType === WEEKLY_REVIEW_SUBMISSION_LEDGER_ACTION;
}
