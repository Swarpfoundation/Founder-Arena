"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  ADMIN_AUDIT_ACTION_TYPE,
  cancelReviewJobPayload,
  createAdminAuditPayload,
  evaluatePrivateBetaAdminAccess,
  reclaimStaleReviewJobPayload,
  retryFailedReviewJobPayload,
  sanitizeFeedbackMessage,
} from "@/lib/admin/private-beta-dashboard";
import { AI_REVIEW_ACTION_TYPE, parseAIReviewJobPayload } from "@/lib/ai-review/review-queue";
import { getCurrentUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

const ADMIN_DASHBOARD_PATH = "/admin/private-beta";

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requirePrivateBetaAdmin() {
  const user = await getCurrentUser();
  const access = evaluatePrivateBetaAdminAccess(user);
  if (!access.allowed) {
    throw new Error(access.reason);
  }
  return { user, access };
}

async function writeAdminAuditEntry(input: {
  adminUserId: string;
  actionType: string;
  targetType: "ai_review_job" | "beta_feedback" | "referral" | "system";
  targetId: string;
  previousStatus?: string;
  nextStatus?: string;
  reason?: string;
  safeMetadata?: Record<string, unknown>;
}) {
  const payload = createAdminAuditPayload(input);
  await db.queuedAction.create({
    data: {
      userId: input.adminUserId,
      actionType: ADMIN_AUDIT_ACTION_TYPE,
      status: "completed",
      payload: payload as unknown as Prisma.InputJsonValue,
      processedAt: new Date(),
    },
  });
}

async function getReviewJobForAdmin(jobId: string) {
  const action = await db.queuedAction.findFirst({
    where: { id: jobId, actionType: AI_REVIEW_ACTION_TYPE },
  });
  if (!action) throw new Error("Review job not found.");
  const payload = parseAIReviewJobPayload(action.payload);
  if (!payload) throw new Error("Review job payload is invalid.");
  return { action, payload };
}

export async function retryFailedReviewJobAction(formData: FormData) {
  const { access } = await requirePrivateBetaAdmin();
  const jobId = getFormString(formData, "jobId");
  const reason = sanitizeFeedbackMessage(getFormString(formData, "reason"), 240);
  if (!jobId) throw new Error("Missing review job id.");

  const { payload } = await getReviewJobForAdmin(jobId);
  const previousStatus = payload.status;
  const transition = retryFailedReviewJobPayload(payload);
  if (!transition.allowed) {
    throw new Error(`Review job cannot be retried from ${previousStatus}.`);
  }

  if (transition.changed) {
    await db.queuedAction.update({
      where: { id: jobId },
      data: {
        status: "queued",
        payload: transition.payload as unknown as Prisma.InputJsonValue,
        processedAt: null,
        error: null,
      },
    });
    await writeAdminAuditEntry({
      adminUserId: access.adminUserId,
      actionType: "retry_failed_ai_review_job",
      targetType: "ai_review_job",
      targetId: jobId,
      previousStatus,
      nextStatus: transition.nextStatus,
      reason,
      safeMetadata: { attempts: payload.attempts, maxAttempts: transition.payload.maxAttempts },
    });
  }

  revalidatePath(ADMIN_DASHBOARD_PATH);
}

export async function reclaimStaleReviewJobAction(formData: FormData) {
  const { access } = await requirePrivateBetaAdmin();
  const jobId = getFormString(formData, "jobId");
  const reason = sanitizeFeedbackMessage(getFormString(formData, "reason"), 240);
  if (!jobId) throw new Error("Missing review job id.");

  const { payload } = await getReviewJobForAdmin(jobId);
  const previousStatus = payload.status;
  const transition = reclaimStaleReviewJobPayload(payload);
  if (!transition.allowed) {
    throw new Error(transition.reason === "running_job_not_stale" ? "Review job is still inside the active worker lock window." : "Review job cannot be reclaimed from its current state.");
  }

  if (transition.changed) {
    await db.queuedAction.update({
      where: { id: jobId },
      data: {
        status: transition.nextStatus,
        payload: transition.payload as unknown as Prisma.InputJsonValue,
        processedAt: transition.nextStatus === "failed" ? new Date() : null,
        error: transition.payload.lastError ?? null,
      },
    });
    await writeAdminAuditEntry({
      adminUserId: access.adminUserId,
      actionType: "reclaim_stale_ai_review_job",
      targetType: "ai_review_job",
      targetId: jobId,
      previousStatus,
      nextStatus: transition.nextStatus,
      reason,
      safeMetadata: { attempts: payload.attempts, maxAttempts: payload.maxAttempts },
    });
  }

  revalidatePath(ADMIN_DASHBOARD_PATH);
}

export async function cancelReviewJobAction(formData: FormData) {
  const { access } = await requirePrivateBetaAdmin();
  const jobId = getFormString(formData, "jobId");
  const reason = sanitizeFeedbackMessage(getFormString(formData, "reason"), 240);
  if (!jobId) throw new Error("Missing review job id.");

  const { payload } = await getReviewJobForAdmin(jobId);
  const previousStatus = payload.status;
  const transition = cancelReviewJobPayload(payload);
  if (!transition.allowed) {
    throw new Error("Completed review jobs cannot be cancelled.");
  }

  if (transition.changed) {
    await db.queuedAction.update({
      where: { id: jobId },
      data: {
        status: "cancelled",
        payload: transition.payload as unknown as Prisma.InputJsonValue,
        processedAt: new Date(),
        error: transition.payload.lastError ?? "Cancelled by admin.",
      },
    });
    await writeAdminAuditEntry({
      adminUserId: access.adminUserId,
      actionType: "cancel_ai_review_job",
      targetType: "ai_review_job",
      targetId: jobId,
      previousStatus,
      nextStatus: transition.nextStatus,
      reason,
      safeMetadata: { attempts: payload.attempts, maxAttempts: payload.maxAttempts },
    });
  }

  revalidatePath(ADMIN_DASHBOARD_PATH);
}
