import "server-only";

import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { getAIReviewRuntimeConfig } from "./config";
import {
  claimNextAIReviewJob,
  completeAIReviewJob,
  failAIReviewJob,
  parseAIReviewJobPayload,
} from "./review-queue";
import { generateAndPersistAIReviewForStartup } from "./review-service";

export interface ReviewWorkerOnceResult {
  processed: boolean;
  status: "idle" | "completed" | "retrying" | "failed";
  actionId?: string;
  reviewId?: string;
  error?: string;
}

export async function processNextAIReviewJob(workerId = `review-worker-${randomUUID()}`): Promise<ReviewWorkerOnceResult> {
  const claimed = await claimNextAIReviewJob(workerId);
  if (!claimed) return { processed: false, status: "idle" };

  const payload = parseAIReviewJobPayload(claimed.payload);
  if (!payload) {
    await db.queuedAction.update({
      where: { id: claimed.action.id },
      data: { status: "failed", processedAt: new Date(), error: "Invalid AI review job payload." },
    });
    return { processed: true, status: "failed", actionId: claimed.action.id, error: "Invalid payload" };
  }

  try {
    const review = await generateAndPersistAIReviewForStartup({
      userId: payload.userId,
      startupId: payload.startupId,
      config: {
        ...getAIReviewRuntimeConfig(),
        provider: payload.provider,
        mode: payload.mode,
        maxAttempts: payload.maxAttempts,
      },
    });
    await completeAIReviewJob(claimed.action.id, payload, review.id);
    return { processed: true, status: "completed", actionId: claimed.action.id, reviewId: review.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI review job failed.";
    const retryable = !message.toLowerCase().includes("unauthorized") && !message.toLowerCase().includes("pitch deck");
    await failAIReviewJob(claimed.action.id, payload, message, retryable);
    const next = parseAIReviewJobPayload(
      (await db.queuedAction.findUnique({ where: { id: claimed.action.id }, select: { payload: true } }))?.payload
    );
    return {
      processed: true,
      status: next?.status === "retrying" ? "retrying" : "failed",
      actionId: claimed.action.id,
      error: message,
    };
  }
}
