import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAIReviewRuntimeConfig } from "./config";
import type {
  AIReviewJobPayload,
  AIReviewJobStatus,
  AIReviewJobSummary,
  AIReviewProviderId,
  AIReviewRuntimeConfig,
} from "./types";

export const AI_REVIEW_ACTION_TYPE = "aiReview";
export const AI_REVIEW_JOB_VERSION = "ai-review-job-v0.1" as const;
const ACTIVE_STATUSES = ["queued", "running", "retrying"] as const;
const DEFAULT_STALE_RUNNING_MS = 10 * 60_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function buildAIReviewIdempotencyKey(input: {
  startupId: string;
  userId: string;
  pitchDeckUpdatedAt?: Date | string | null;
}): string {
  const pitchVersion = input.pitchDeckUpdatedAt
    ? new Date(input.pitchDeckUpdatedAt).toISOString()
    : "no-pitch-version";
  return `ai-review:${input.userId}:${input.startupId}:${pitchVersion}`;
}

export function createAIReviewJobPayload(input: {
  startupId: string;
  userId: string;
  idempotencyKey: string;
  config?: AIReviewRuntimeConfig;
  now?: Date;
}): AIReviewJobPayload {
  const config = input.config ?? getAIReviewRuntimeConfig();
  const now = input.now ?? new Date();
  return {
    version: AI_REVIEW_JOB_VERSION,
    startupId: input.startupId,
    userId: input.userId,
    provider: config.provider,
    mode: config.mode,
    status: "queued",
    attempts: 0,
    maxAttempts: config.maxAttempts,
    idempotencyKey: input.idempotencyKey,
    queuedAt: now.toISOString(),
  };
}

export function parseAIReviewJobPayload(value: unknown): AIReviewJobPayload | null {
  if (!isRecord(value)) return null;
  if (value.version !== AI_REVIEW_JOB_VERSION) return null;
  if (typeof value.startupId !== "string" || typeof value.userId !== "string") return null;
  if (typeof value.idempotencyKey !== "string") return null;
  const status = typeof value.status === "string" ? value.status : "queued";
  if (!["queued", "running", "completed", "failed", "retrying", "cancelled"].includes(status)) return null;
  return {
    version: AI_REVIEW_JOB_VERSION,
    startupId: value.startupId,
    userId: value.userId,
    provider: (typeof value.provider === "string" ? value.provider : "mock") as AIReviewProviderId,
    mode: value.mode === "queued_worker" || value.mode === "direct" || value.mode === "mock" ? value.mode : "queued_worker",
    status: status as AIReviewJobStatus,
    attempts: typeof value.attempts === "number" ? value.attempts : 0,
    maxAttempts: typeof value.maxAttempts === "number" ? value.maxAttempts : 3,
    idempotencyKey: value.idempotencyKey,
    queuedAt: typeof value.queuedAt === "string" ? value.queuedAt : new Date().toISOString(),
    nextRunAt: typeof value.nextRunAt === "string" ? value.nextRunAt : undefined,
    lockedAt: typeof value.lockedAt === "string" ? value.lockedAt : undefined,
    lockedBy: typeof value.lockedBy === "string" ? value.lockedBy : undefined,
    reviewId: typeof value.reviewId === "string" ? value.reviewId : undefined,
    lastError: typeof value.lastError === "string" ? value.lastError : undefined,
    lastErrorCode: typeof value.lastErrorCode === "string" ? (value.lastErrorCode as AIReviewJobPayload["lastErrorCode"]) : undefined,
  };
}

export function summarizeAIReviewJob(action: {
  id: string;
  startupId: string | null;
  status: string;
  queuedAt: Date;
  processedAt: Date | null;
  payload: unknown;
  error: string | null;
}): AIReviewJobSummary | null {
  const payload = parseAIReviewJobPayload(action.payload);
  if (!payload) return null;
  return {
    id: action.id,
    startupId: action.startupId,
    status: payload.status,
    provider: payload.provider,
    mode: payload.mode,
    attempts: payload.attempts,
    maxAttempts: payload.maxAttempts,
    queuedAt: action.queuedAt,
    processedAt: action.processedAt,
    lastError: payload.lastError ?? action.error ?? undefined,
    reviewId: payload.reviewId,
  };
}

export function getRetryDelayMs(attempts: number): number {
  return Math.min(15 * 60_000, Math.max(30_000, 30_000 * 2 ** Math.max(0, attempts - 1)));
}

export function markJobPayloadRunning(payload: AIReviewJobPayload, lockedBy: string, now = new Date()): AIReviewJobPayload {
  return {
    ...payload,
    status: "running",
    attempts: payload.attempts + 1,
    lockedAt: now.toISOString(),
    lockedBy,
  };
}

export function markJobPayloadFailed(
  payload: AIReviewJobPayload,
  error: string,
  retryable: boolean,
  now = new Date()
): AIReviewJobPayload {
  const shouldRetry = retryable && payload.attempts < payload.maxAttempts;
  return {
    ...payload,
    status: shouldRetry ? "retrying" : "failed",
    lastError: error.slice(0, 500),
    nextRunAt: shouldRetry ? new Date(now.getTime() + getRetryDelayMs(payload.attempts)).toISOString() : undefined,
    lockedAt: undefined,
    lockedBy: undefined,
  };
}

export function markJobPayloadCompleted(payload: AIReviewJobPayload, reviewId: string): AIReviewJobPayload {
  return {
    ...payload,
    status: "completed",
    reviewId,
    lockedAt: undefined,
    lockedBy: undefined,
    nextRunAt: undefined,
    lastError: undefined,
  };
}

export function isAIReviewJobStaleRunning(payload: AIReviewJobPayload, now = new Date(), staleMs = DEFAULT_STALE_RUNNING_MS): boolean {
  if (payload.status !== "running" || !payload.lockedAt) return false;
  return now.getTime() - new Date(payload.lockedAt).getTime() > staleMs;
}

export function reclaimStaleRunningPayload(payload: AIReviewJobPayload, now = new Date()): AIReviewJobPayload {
  return {
    ...payload,
    status: payload.attempts >= payload.maxAttempts ? "failed" : "retrying",
    lastError: "Worker lock expired before completion.",
    nextRunAt: payload.attempts >= payload.maxAttempts ? undefined : now.toISOString(),
    lockedAt: undefined,
    lockedBy: undefined,
  };
}

export async function getActiveAIReviewJobForStartup(userId: string, startupId: string): Promise<AIReviewJobSummary | null> {
  const action = await db.queuedAction.findFirst({
    where: {
      userId,
      startupId,
      actionType: AI_REVIEW_ACTION_TYPE,
      status: { in: [...ACTIVE_STATUSES] },
    },
    orderBy: { queuedAt: "desc" },
  });
  return action ? summarizeAIReviewJob(action) : null;
}

export async function getLatestAIReviewJobForStartup(startupId: string): Promise<AIReviewJobSummary | null> {
  const action = await db.queuedAction.findFirst({
    where: {
      startupId,
      actionType: AI_REVIEW_ACTION_TYPE,
    },
    orderBy: { queuedAt: "desc" },
  });
  return action ? summarizeAIReviewJob(action) : null;
}

export async function enqueueAIReviewJob(input: {
  userId: string;
  startupId: string;
  pitchDeckUpdatedAt?: Date | string | null;
  config?: AIReviewRuntimeConfig;
}) {
  const existing = await getActiveAIReviewJobForStartup(input.userId, input.startupId);
  if (existing) return existing;

  const idempotencyKey = buildAIReviewIdempotencyKey(input);
  const duplicate = await db.queuedAction.findFirst({
    where: {
      userId: input.userId,
      startupId: input.startupId,
      actionType: AI_REVIEW_ACTION_TYPE,
      payload: {
        path: ["idempotencyKey"],
        equals: idempotencyKey,
      } as Prisma.JsonFilter,
    },
    orderBy: { queuedAt: "desc" },
  });
  if (duplicate) {
    const summary = summarizeAIReviewJob(duplicate);
    if (summary) return summary;
  }

  const payload = createAIReviewJobPayload({
    startupId: input.startupId,
    userId: input.userId,
    idempotencyKey,
    config: input.config,
  });
  const action = await db.queuedAction.create({
    data: {
      userId: input.userId,
      startupId: input.startupId,
      actionType: AI_REVIEW_ACTION_TYPE,
      payload: payload as unknown as Prisma.InputJsonValue,
      status: "queued",
    },
  });
  const summary = summarizeAIReviewJob(action);
  if (!summary) throw new Error("AI review job could not be summarized.");
  return summary;
}

export async function claimNextAIReviewJob(workerId: string) {
  await reclaimStaleAIReviewJobs();

  const candidates = await db.queuedAction.findMany({
    where: {
      actionType: AI_REVIEW_ACTION_TYPE,
      status: { in: ["queued", "retrying"] },
    },
    orderBy: { queuedAt: "asc" },
    take: 10,
  });

  const now = new Date();
  for (const candidate of candidates) {
    const payload = parseAIReviewJobPayload(candidate.payload);
    if (!payload) continue;
    if (payload.nextRunAt && new Date(payload.nextRunAt).getTime() > now.getTime()) continue;

    const running = markJobPayloadRunning(payload, workerId, now);
    const updated = await db.queuedAction.updateMany({
      where: {
        id: candidate.id,
        status: candidate.status,
      },
      data: {
        status: "running",
        payload: running as unknown as Prisma.InputJsonValue,
      },
    });
    if (updated.count === 1) {
      return { action: candidate, payload: running };
    }
  }

  return null;
}

export async function reclaimStaleAIReviewJobs(now = new Date(), staleMs = DEFAULT_STALE_RUNNING_MS) {
  const running = await db.queuedAction.findMany({
    where: {
      actionType: AI_REVIEW_ACTION_TYPE,
      status: "running",
    },
    take: 25,
    orderBy: { queuedAt: "asc" },
  });

  let reclaimed = 0;
  for (const action of running) {
    const payload = parseAIReviewJobPayload(action.payload);
    if (!payload || !isAIReviewJobStaleRunning(payload, now, staleMs)) continue;
    const next = reclaimStaleRunningPayload(payload, now);
    await db.queuedAction.update({
      where: { id: action.id },
      data: {
        status: next.status,
        payload: next as unknown as Prisma.InputJsonValue,
        error: next.lastError,
        processedAt: next.status === "failed" ? now : null,
      },
    });
    reclaimed += 1;
  }
  return reclaimed;
}

export async function completeAIReviewJob(actionId: string, payload: AIReviewJobPayload, reviewId: string) {
  const completed = markJobPayloadCompleted(payload, reviewId);
  await db.queuedAction.update({
    where: { id: actionId },
    data: {
      status: "completed",
      processedAt: new Date(),
      payload: completed as unknown as Prisma.InputJsonValue,
      result: { reviewId } as Prisma.InputJsonValue,
      error: null,
    },
  });
}

export async function failAIReviewJob(actionId: string, payload: AIReviewJobPayload, error: string, retryable: boolean) {
  const failed = markJobPayloadFailed(payload, error, retryable);
  await db.queuedAction.update({
    where: { id: actionId },
    data: {
      status: failed.status,
      processedAt: failed.status === "failed" ? new Date() : null,
      payload: failed as unknown as Prisma.InputJsonValue,
      error: failed.lastError,
    },
  });
}
