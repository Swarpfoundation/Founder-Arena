"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  BETA_FEEDBACK_ACTION_TYPE,
  createBetaFeedbackPayload,
  sanitizeFeedbackMessage,
} from "@/lib/admin/private-beta-dashboard";
import { requireCurrentUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export interface SubmitBetaFeedbackInput {
  startupId?: string;
  reviewId?: string;
  type: string;
  category?: string;
  rating?: number;
  message: string;
  route?: string;
  decision?: string;
  score?: number;
  provider?: string;
}

const MAX_FEEDBACK_PER_HOUR = 5;

function normalizeRating(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.max(1, Math.min(5, Math.round(value)));
}

async function assertFeedbackContextOwnership(input: SubmitBetaFeedbackInput, userId: string) {
  if (input.reviewId) {
    const review = await db.vcReview.findUnique({
      where: { id: input.reviewId },
      include: { startup: { select: { id: true, userId: true } } },
    });
    if (!review || review.startup.userId !== userId) {
      throw new Error("Review not found.");
    }
    if (input.startupId && input.startupId !== review.startup.id) {
      throw new Error("Review does not match startup.");
    }
    return review.startup.id;
  }

  if (input.startupId) {
    const startup = await db.startup.findUnique({
      where: { id: input.startupId },
      select: { id: true, userId: true },
    });
    if (!startup || startup.userId !== userId) {
      throw new Error("Startup not found.");
    }
    return startup.id;
  }

  return undefined;
}

export async function submitBetaFeedbackAction(input: SubmitBetaFeedbackInput) {
  const user = await requireCurrentUser();
  const message = sanitizeFeedbackMessage(input.message);
  if (message.length < 8) {
    return { success: false, error: "Please add a little more detail before sending feedback." };
  }

  const recentFeedbackCount = await db.queuedAction.count({
    where: {
      userId: user.id,
      actionType: BETA_FEEDBACK_ACTION_TYPE,
      queuedAt: { gte: new Date(Date.now() - 60 * 60_000) },
    },
  });
  if (recentFeedbackCount >= MAX_FEEDBACK_PER_HOUR) {
    return { success: false, error: "Feedback limit reached for this hour. Try again later." };
  }

  const startupId = await assertFeedbackContextOwnership(input, user.id);
  const payload = createBetaFeedbackPayload({
    userId: user.id,
    startupId,
    reviewId: input.reviewId,
    type: input.type,
    category: input.category,
    rating: normalizeRating(input.rating),
    message,
    safeContext: {
      route: input.route,
      startupId,
      reviewId: input.reviewId,
      decision: input.decision,
      score: input.score,
      provider: input.provider,
    },
  });

  await db.queuedAction.create({
    data: {
      userId: user.id,
      startupId,
      actionType: BETA_FEEDBACK_ACTION_TYPE,
      status: "open",
      payload: payload as unknown as Prisma.InputJsonValue,
    },
  });

  if (startupId) {
    revalidatePath(`/startup/${startupId}/review`);
  }
  revalidatePath("/admin/private-beta");
  return { success: true };
}
