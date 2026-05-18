import { describe, expect, it } from "vitest";
import {
  ADMIN_AUDIT_ACTION_TYPE,
  BETA_FEEDBACK_ACTION_TYPE,
  cancelReviewJobPayload,
  createAdminAuditPayload,
  createBetaFeedbackPayload,
  evaluatePrivateBetaAdminAccess,
  getPrivateBetaEnvReadiness,
  getReferralAbuseSignals,
  maskAdminIdentifier,
  reclaimStaleReviewJobPayload,
  retryFailedReviewJobPayload,
  sanitizeAdminError,
  sanitizeFeedbackMessage,
  summarizeAdminAuditRows,
  summarizeBetaFeedbackRows,
  summarizeReferralRows,
  summarizeReviewQueueRows,
  summarizeWeeklySubmissionRows,
} from "@/lib/admin/private-beta-dashboard";
import { createAIReviewJobPayload, markJobPayloadCompleted, markJobPayloadRunning } from "@/lib/ai-review";
import {
  REFERRAL_ATTRIBUTION_ACTION_TYPE,
  REFERRAL_CODE_ACTION_TYPE,
  REFERRAL_REWARD_ACTION_TYPE,
  createReferralRewardLedgerEntry,
} from "@/lib/growth/referral-rules";
import { WEEKLY_REVIEW_SUBMISSION_ACTION, getUtcCalendarWeekWindow } from "@/lib/growth/submission-limits";

describe("private beta admin dashboard helpers", () => {
  it("denies dashboard access when admin env is not configured", () => {
    const access = evaluatePrivateBetaAdminAccess(
      { id: "user-1", email: "founder@example.com" },
      { ADMIN_EMAILS: "", ADMIN_USER_IDS: "" }
    );
    expect(access.allowed).toBe(false);
    expect(access.configured).toBe(false);
  });

  it("allows configured admin emails and rejects normal users", () => {
    expect(
      evaluatePrivateBetaAdminAccess(
        { id: "user-1", email: "founder@example.com" },
        { ADMIN_EMAILS: "founder@example.com", ADMIN_USER_IDS: "" }
      )
    ).toMatchObject({ allowed: true });
    expect(
      evaluatePrivateBetaAdminAccess(
        { id: "user-2", email: "tester@example.com" },
        { ADMIN_EMAILS: "founder@example.com", ADMIN_USER_IDS: "" }
      )
    ).toMatchObject({ allowed: false, configured: true });
  });

  it("masks ids and email addresses for admin tables", () => {
    expect(maskAdminIdentifier("founder@example.com")).toBe("fo***@example.com");
    expect(maskAdminIdentifier("ckabcdefghijklmnop")).toBe("ckabcd...mnop");
  });

  it("sanitizes provider errors into categories", () => {
    expect(sanitizeAdminError("DEEPSEEK_API_KEY is missing")).toBe("provider_config");
    expect(sanitizeAdminError("provider timeout after 25s")).toBe("timeout");
    expect(sanitizeAdminError("JSON parse failed")).toBe("invalid_provider_json");
  });

  it("summarizes review queue statuses and stale running jobs without prompts", () => {
    const now = new Date("2026-05-18T12:00:00.000Z");
    const runningPayload = markJobPayloadRunning(
      createAIReviewJobPayload({
        startupId: "startup-secret-pitch",
        userId: "user-1",
        idempotencyKey: "idem-1",
        now: new Date("2026-05-18T10:00:00.000Z"),
      }),
      "worker-1",
      new Date("2026-05-18T10:01:00.000Z")
    );
    const queuedPayload = createAIReviewJobPayload({
      startupId: "startup-2",
      userId: "user-2",
      idempotencyKey: "idem-2",
      now: new Date("2026-05-18T11:30:00.000Z"),
    });

    const summary = summarizeReviewQueueRows(
      [
        {
          id: "job-running-secret",
          startupId: "startup-secret-pitch",
          status: "running",
          queuedAt: new Date("2026-05-18T10:00:00.000Z"),
          processedAt: null,
          payload: runningPayload,
          error: "raw prompt text should not be shown",
        },
        {
          id: "job-queued",
          startupId: "startup-2",
          status: "queued",
          queuedAt: new Date("2026-05-18T11:30:00.000Z"),
          processedAt: null,
          payload: queuedPayload,
          error: null,
        },
        {
          id: "job-complete",
          startupId: "startup-3",
          status: "completed",
          queuedAt: new Date("2026-05-18T09:00:00.000Z"),
          processedAt: new Date("2026-05-18T11:00:00.000Z"),
          payload: { ...queuedPayload, status: "completed" },
          error: null,
        },
      ],
      now
    );

    expect(summary.counts.running).toBe(1);
    expect(summary.counts.queued).toBe(1);
    expect(summary.completedLast24h).toBe(1);
    expect(summary.staleRunningCount).toBe(1);
    expect(JSON.stringify(summary)).not.toContain("raw prompt text");
    expect(JSON.stringify(summary)).not.toContain("startup-secret-pitch");
  });

  it("summarizes referral counts and non-cash reward totals", () => {
    const now = new Date("2026-05-18T00:00:00.000Z");
    const rows = [
      {
        id: "code-1",
        userId: "referrer-1",
        actionType: REFERRAL_CODE_ACTION_TYPE,
        status: "active",
        queuedAt: now,
        processedAt: null,
        payload: { version: "referral-code-v0.1", ownerUserId: "referrer-1", code: "FA123", usageCount: 0, createdAt: now.toISOString() },
      },
      {
        id: "attr-1",
        userId: "referred-1",
        actionType: REFERRAL_ATTRIBUTION_ACTION_TYPE,
        status: "completed",
        queuedAt: now,
        processedAt: now,
        payload: { version: "referral-attribution-v0.1", referrerUserId: "referrer-1", referredUserId: "referred-1", referralCode: "FA123", status: "rewarded" },
      },
      {
        id: "reward-1",
        userId: "referrer-1",
        actionType: REFERRAL_REWARD_ACTION_TYPE,
        status: "completed",
        queuedAt: now,
        processedAt: now,
        payload: createReferralRewardLedgerEntry({
          userId: "referrer-1",
          type: "founder_points",
          amount: 100,
          reason: "referral_signup",
          idempotencyKey: "reward-1",
          now,
        }),
      },
      {
        id: "reward-2",
        userId: "referrer-1",
        actionType: REFERRAL_REWARD_ACTION_TYPE,
        status: "completed",
        queuedAt: now,
        processedAt: now,
        payload: createReferralRewardLedgerEntry({
          userId: "referrer-1",
          type: "submission_credit",
          amount: 1,
          reason: "referral_signup",
          idempotencyKey: "reward-2",
          now,
        }),
      },
    ];

    const summary = summarizeReferralRows(rows);
    expect(summary.totalReferralCodes).toBe(1);
    expect(summary.successfulReferrals).toBe(1);
    expect(summary.founderPointsGranted).toBe(100);
    expect(summary.submissionCreditsGranted).toBe(1);
  });

  it("detects warning-only referral abuse signals", () => {
    const now = new Date("2026-05-18T12:00:00.000Z");
    const rows = Array.from({ length: 5 }, (_, index) => ({
      id: `attr-${index}`,
      userId: `user-${index}`,
      actionType: REFERRAL_ATTRIBUTION_ACTION_TYPE,
      status: "completed",
      queuedAt: new Date("2026-05-18T11:00:00.000Z"),
      processedAt: now,
      payload: { version: "referral-attribution-v0.1", referrerUserId: "referrer-1", referredUserId: `user-${index}`, referralCode: "FAHOT", status: "rewarded" },
    }));

    const signals = getReferralAbuseSignals(rows, now);
    expect(signals.some((signal) => signal.label === "Referral spike")).toBe(true);
    expect(signals.every((signal) => signal.severity === "warning" || signal.severity === "info")).toBe(true);
  });

  it("summarizes weekly submission usage by plan", () => {
    const now = new Date("2026-05-20T12:00:00.000Z");
    const { start, end } = getUtcCalendarWeekWindow(now);
    const summary = summarizeWeeklySubmissionRows(
      [
        { userId: "free-near", actionType: WEEKLY_REVIEW_SUBMISSION_ACTION, count: 2, periodStart: start, periodEnd: end, user: { plan: "free" } },
        { userId: "free-cap", actionType: WEEKLY_REVIEW_SUBMISSION_ACTION, count: 3, periodStart: start, periodEnd: end, user: { plan: "free" } },
        { userId: "pro-user", actionType: WEEKLY_REVIEW_SUBMISSION_ACTION, count: 8, periodStart: start, periodEnd: end, user: { plan: "pro" } },
      ],
      now
    );
    expect(summary.reviewsSubmittedThisWeek).toBe(13);
    expect(summary.freeUsersNearCap).toBe(1);
    expect(summary.freeUsersAtOrOverCap).toBe(1);
    expect(summary.proMaxBypassCount).toBe(8);
  });

  it("shows env readiness with booleans only and no secret values", () => {
    const readiness = getPrivateBetaEnvReadiness({
      AI_REVIEW_ENABLED: "true",
      AI_REVIEW_PROVIDER: "deepseek",
      AI_REVIEW_MODE: "queued_worker",
      DEEPSEEK_API_KEY: "secret-key-value",
      ADS_DISABLED: "true",
      REWARDED_ADS_ENABLED: "false",
    } as unknown as NodeJS.ProcessEnv);

    expect(readiness.deepseekKeyPresent).toBe(true);
    expect(JSON.stringify(readiness)).not.toContain("secret-key-value");
    expect(readiness.aiReviewProvider).toBe("deepseek");
  });

  it("prevents non-admin access before queue mutations are reachable", () => {
    const access = evaluatePrivateBetaAdminAccess(
      { id: "user-2", email: "tester@example.com" },
      { ADMIN_EMAILS: "founder@example.com", ADMIN_USER_IDS: "" }
    );
    expect(access.allowed).toBe(false);
  });

  it("builds a retry transition for failed jobs without duplicating the job", () => {
    const payload = {
      ...createAIReviewJobPayload({
        startupId: "startup-1",
        userId: "user-1",
        idempotencyKey: "retry-1",
      }),
      status: "failed" as const,
      attempts: 3,
      maxAttempts: 3,
      lastError: "provider timeout",
    };

    const transition = retryFailedReviewJobPayload(payload);
    expect(transition.allowed).toBe(true);
    expect(transition.changed).toBe(true);
    expect(transition.payload.status).toBe("queued");
    expect(transition.payload.maxAttempts).toBe(4);
    expect(transition.payload.lastError).toBeUndefined();
  });

  it("does not retry completed review jobs", () => {
    const payload = markJobPayloadCompleted(
      createAIReviewJobPayload({
        startupId: "startup-1",
        userId: "user-1",
        idempotencyKey: "complete-1",
      }),
      "review-1"
    );

    const transition = retryFailedReviewJobPayload(payload);
    expect(transition.allowed).toBe(false);
    expect(transition.reason).toBe("cannot_retry_completed");
  });

  it("reclaims stale running jobs and rejects non-stale running jobs", () => {
    const staleNow = new Date("2026-05-18T12:00:00.000Z");
    const running = markJobPayloadRunning(
      createAIReviewJobPayload({
        startupId: "startup-1",
        userId: "user-1",
        idempotencyKey: "stale-1",
      }),
      "worker-1",
      new Date("2026-05-18T11:40:00.000Z")
    );
    const fresh = markJobPayloadRunning(
      createAIReviewJobPayload({
        startupId: "startup-2",
        userId: "user-1",
        idempotencyKey: "fresh-1",
      }),
      "worker-1",
      new Date("2026-05-18T11:59:00.000Z")
    );

    const staleTransition = reclaimStaleReviewJobPayload(running, staleNow);
    const freshTransition = reclaimStaleReviewJobPayload(fresh, staleNow);
    expect(staleTransition.allowed).toBe(true);
    expect(staleTransition.payload.status).toBe("retrying");
    expect(staleTransition.payload.lockedAt).toBeUndefined();
    expect(freshTransition.allowed).toBe(false);
    expect(freshTransition.reason).toBe("running_job_not_stale");
  });

  it("cancels active jobs but not completed jobs", () => {
    const queued = createAIReviewJobPayload({
      startupId: "startup-1",
      userId: "user-1",
      idempotencyKey: "cancel-1",
    });
    const completed = markJobPayloadCompleted(queued, "review-1");

    const cancelQueued = cancelReviewJobPayload(queued);
    const cancelCompleted = cancelReviewJobPayload(completed);
    expect(cancelQueued.allowed).toBe(true);
    expect(cancelQueued.payload.status).toBe("cancelled");
    expect(cancelCompleted.allowed).toBe(false);
    expect(cancelCompleted.reason).toBe("cannot_cancel_completed");
  });

  it("creates admin audit payloads with allowlisted metadata only", () => {
    const payload = createAdminAuditPayload({
      adminUserId: "admin-1",
      actionType: "retry_failed_ai_review_job",
      targetType: "ai_review_job",
      targetId: "job-secret",
      previousStatus: "failed",
      nextStatus: "queued",
      reason: "<b>retry after timeout</b>",
      safeMetadata: {
        attempts: 3,
        promptText: "raw prompt must not be stored",
        apiKey: "secret-key",
      },
      now: new Date("2026-05-18T12:00:00.000Z"),
    });

    expect(payload.reason).toBe("retry after timeout");
    expect(payload.safeMetadata).toEqual({ attempts: 3 });
    expect(JSON.stringify(payload)).not.toContain("raw prompt");
    expect(JSON.stringify(payload)).not.toContain("secret-key");
  });

  it("summarizes admin audit entries without exposing target internals", () => {
    const payload = createAdminAuditPayload({
      adminUserId: "admin-long-identifier",
      actionType: "cancel_ai_review_job",
      targetType: "ai_review_job",
      targetId: "job-abcdef123456",
      previousStatus: "running",
      nextStatus: "cancelled",
      now: new Date("2026-05-18T12:00:00.000Z"),
    });
    const summary = summarizeAdminAuditRows([
      {
        id: "audit-1",
        userId: "admin-long-identifier",
        actionType: ADMIN_AUDIT_ACTION_TYPE,
        status: "completed",
        queuedAt: new Date("2026-05-18T12:00:00.000Z"),
        processedAt: new Date("2026-05-18T12:00:01.000Z"),
        payload,
      },
    ]);

    expect(summary.recentActions[0].actionType).toBe("cancel_ai_review_job");
    expect(summary.recentActions[0].targetId).not.toBe("job-abcdef123456");
  });

  it("creates safe beta feedback payloads and sanitizes messages", () => {
    const message = sanitizeFeedbackMessage("<script>alert(1)</script> The review was too generous.");
    const payload = createBetaFeedbackPayload({
      userId: "user-1",
      startupId: "startup-1",
      reviewId: "review-1",
      type: "ai_review_quality",
      category: "review_too_generous",
      rating: 5,
      message,
      safeContext: {
        route: "/startup/startup-1/review",
        decision: "accept",
        score: 88,
        provider: "deepseek",
      },
      now: new Date("2026-05-18T12:00:00.000Z"),
    });

    expect(payload.message).not.toContain("<script>");
    expect(payload.type).toBe("ai_review_quality");
    expect(payload.safeContext).toMatchObject({ decision: "accept", score: 88, provider: "deepseek" });
    expect(JSON.stringify(payload)).not.toContain("prompt");
  });

  it("summarizes feedback inbox counts without mutating review decisions", () => {
    const payload = createBetaFeedbackPayload({
      userId: "user-secret",
      startupId: "startup-secret",
      reviewId: "review-secret",
      type: "ai_review_quality",
      category: "explanation_unclear",
      rating: 2,
      message: "The rejection explanation was unclear and did not match my GTM section.",
      safeContext: { decision: "reject", score: 42, provider: "deepseek" },
      now: new Date("2026-05-18T12:00:00.000Z"),
    });
    const summary = summarizeBetaFeedbackRows([
      {
        id: "feedback-1",
        userId: "user-secret",
        startupId: "startup-secret",
        actionType: BETA_FEEDBACK_ACTION_TYPE,
        status: "open",
        queuedAt: new Date("2026-05-18T12:00:00.000Z"),
        processedAt: null,
        payload,
      },
    ]);

    expect(summary.openCount).toBe(1);
    expect(summary.recentFeedback[0].decision).toBe("reject");
    expect(summary.recentFeedback[0]).not.toHaveProperty("newDecision");
    expect(JSON.stringify(summary)).not.toContain("startup-secret");
    expect(JSON.stringify(summary)).not.toContain("review-secret");
  });
});
