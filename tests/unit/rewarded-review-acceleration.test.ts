import { describe, expect, it } from "vitest";
import {
  cancelMockRewardedReview,
  completeMockRewardedReview,
  countDailyRewardedReviewAccelerators,
  getEffectiveReviewReadyAt,
  getReviewAccelerationEligibility,
  getReviewAccelerationState,
  REVIEW_QUEUE_ACCELERATION_LIMITS,
  startMockRewardedReview,
  withReviewAccelerationState,
} from "@/lib/rewards/rewarded-review-acceleration";

const createdAt = new Date("2026-05-17T10:00:00.000Z");
const now = new Date("2026-05-17T10:10:00.000Z");
const cooldownSeconds = 30 * 60;

function baseState() {
  return getReviewAccelerationState({
    reviewId: "review-1",
    startupId: "startup-1",
    reviewCreatedAt: createdAt,
    cooldownSeconds,
  });
}

describe("rewarded review acceleration", () => {
  it("returns eligibility for a pending free review with meaningful wait", () => {
    const result = getReviewAccelerationEligibility({
      reviewId: "review-1",
      startupId: "startup-1",
      reviewCreatedAt: createdAt,
      cooldownSeconds,
      planId: "free",
      dailyRewardsUsed: 0,
      now,
    });

    expect(result.eligible).toBe(true);
    expect(result.rewardPreview?.afterWaitSeconds).toBe(15 * 60);
    expect(result.reviewAcceleratorsUsed).toBe(0);
  });

  it("rejects eligibility when the next review is already ready", () => {
    const result = getReviewAccelerationEligibility({
      reviewId: "review-1",
      reviewCreatedAt: createdAt,
      cooldownSeconds,
      planId: "free",
      dailyRewardsUsed: 0,
      now: new Date("2026-05-17T10:31:00.000Z"),
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("already ready");
  });

  it("rejects Pro and Max plans because cooldown acceleration is unnecessary", () => {
    const pro = getReviewAccelerationEligibility({
      reviewId: "review-1",
      reviewCreatedAt: createdAt,
      cooldownSeconds,
      planId: "pro",
      dailyRewardsUsed: 0,
      now,
    });
    const max = getReviewAccelerationEligibility({
      reviewId: "review-1",
      reviewCreatedAt: createdAt,
      cooldownSeconds,
      planId: "max",
      dailyRewardsUsed: 0,
      now,
    });

    expect(pro.eligible).toBe(false);
    expect(max.eligible).toBe(false);
    expect(pro.reason).toContain("ads are not needed");
  });

  it("enforces the daily rewarded accelerator cap", () => {
    const result = getReviewAccelerationEligibility({
      reviewId: "review-1",
      reviewCreatedAt: createdAt,
      cooldownSeconds,
      planId: "free",
      dailyRewardsUsed: REVIEW_QUEUE_ACCELERATION_LIMITS.dailyRewardLimit,
      now,
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("Daily");
  });

  it("starts a mock ledger entry without granting the reward", () => {
    const started = startMockRewardedReview({
      state: baseState(),
      userId: "user-1",
      startupId: "startup-1",
      ledgerEntryId: "ledger-1",
      now,
    });

    expect(started.ledger).toHaveLength(1);
    expect(started.ledger[0].status).toBe("started");
    expect(started.acceleratorCount).toBe(0);
    expect(started.currentReadyAt).toBe(new Date("2026-05-17T10:30:00.000Z").toISOString());
  });

  it("reserves pending started entries against the per-review cap", () => {
    const startedOnce = startMockRewardedReview({
      state: baseState(),
      userId: "user-1",
      ledgerEntryId: "ledger-1",
      now,
    });
    const startedTwice = startMockRewardedReview({
      state: startedOnce,
      userId: "user-1",
      ledgerEntryId: "ledger-2",
      now,
    });
    const raw = withReviewAccelerationState({}, startedTwice);

    const result = getReviewAccelerationEligibility({
      reviewId: "review-1",
      reviewCreatedAt: createdAt,
      rawResponse: raw,
      cooldownSeconds,
      planId: "free",
      dailyRewardsUsed: 0,
      now,
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("maximum accelerators");
  });

  it("completes a mock reward exactly once", () => {
    const started = startMockRewardedReview({
      state: baseState(),
      userId: "user-1",
      startupId: "startup-1",
      ledgerEntryId: "ledger-1",
      now,
    });

    const completed = completeMockRewardedReview({
      state: started,
      ledgerEntryId: "ledger-1",
      now,
    });
    const repeated = completeMockRewardedReview({
      state: completed.state,
      ledgerEntryId: "ledger-1",
      now: new Date("2026-05-17T10:12:00.000Z"),
    });

    expect(completed.changed).toBe(true);
    expect(completed.state.acceleratorCount).toBe(1);
    expect(completed.state.currentReadyAt).toBe(new Date("2026-05-17T10:25:00.000Z").toISOString());
    expect(repeated.changed).toBe(false);
    expect(repeated.state.acceleratorCount).toBe(1);
    expect(repeated.state.currentReadyAt).toBe(completed.state.currentReadyAt);
  });

  it("second accelerator reduces toward five minutes but never below the minimum ready time", () => {
    const first = completeMockRewardedReview({
      state: startMockRewardedReview({
        state: baseState(),
        userId: "user-1",
        ledgerEntryId: "ledger-1",
        now,
      }),
      ledgerEntryId: "ledger-1",
      now,
    }).state;
    const secondStarted = startMockRewardedReview({
      state: first,
      userId: "user-1",
      ledgerEntryId: "ledger-2",
      now: new Date("2026-05-17T10:11:00.000Z"),
    });
    const second = completeMockRewardedReview({
      state: secondStarted,
      ledgerEntryId: "ledger-2",
      now: new Date("2026-05-17T10:11:00.000Z"),
    });

    expect(second.state.acceleratorCount).toBe(2);
    expect(second.state.currentReadyAt).toBe(new Date("2026-05-17T10:16:00.000Z").toISOString());
    expect(new Date(second.state.currentReadyAt).getTime()).toBeGreaterThanOrEqual(
      new Date(second.state.minReadyAt).getTime()
    );
  });

  it("rejects a third accelerator after the per-review cap", () => {
    const once = completeMockRewardedReview({
      state: startMockRewardedReview({
        state: baseState(),
        userId: "user-1",
        ledgerEntryId: "ledger-1",
        now,
      }),
      ledgerEntryId: "ledger-1",
      now,
    }).state;
    const twice = completeMockRewardedReview({
      state: startMockRewardedReview({
        state: once,
        userId: "user-1",
        ledgerEntryId: "ledger-2",
        now,
      }),
      ledgerEntryId: "ledger-2",
      now,
    }).state;
    const raw = withReviewAccelerationState({}, twice);

    const result = getReviewAccelerationEligibility({
      reviewId: "review-1",
      reviewCreatedAt: createdAt,
      rawResponse: raw,
      cooldownSeconds,
      planId: "free",
      dailyRewardsUsed: 2,
      now: new Date("2026-05-17T10:12:00.000Z"),
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("maximum accelerators");
  });

  it("cancelled mock reward does not accelerate the review", () => {
    const started = startMockRewardedReview({
      state: baseState(),
      userId: "user-1",
      ledgerEntryId: "ledger-1",
      now,
    });
    const cancelled = cancelMockRewardedReview({ state: started, ledgerEntryId: "ledger-1", now });

    expect(cancelled.state.ledger[0].status).toBe("cancelled");
    expect(cancelled.state.acceleratorCount).toBe(0);
    expect(cancelled.state.currentReadyAt).toBe(started.currentReadyAt);
  });

  it("effective cooldown ready time reads from stored acceleration state", () => {
    const completed = completeMockRewardedReview({
      state: startMockRewardedReview({
        state: baseState(),
        userId: "user-1",
        ledgerEntryId: "ledger-1",
        now,
      }),
      ledgerEntryId: "ledger-1",
      now,
    }).state;
    const raw = withReviewAccelerationState({ committee: { supportLevel: 60 } }, completed);

    const readyAt = getEffectiveReviewReadyAt({
      reviewId: "review-1",
      startupId: "startup-1",
      reviewCreatedAt: createdAt,
      rawResponse: raw,
      cooldownSeconds,
    });

    expect(readyAt.toISOString()).toBe(completed.currentReadyAt);
  });

  it("counts only same-day rewarded entries toward the daily cap", () => {
    const rewardedToday = completeMockRewardedReview({
      state: startMockRewardedReview({
        state: baseState(),
        userId: "user-1",
        ledgerEntryId: "ledger-1",
        now,
      }),
      ledgerEntryId: "ledger-1",
      now,
    }).state;
    const rewardedYesterday = {
      ...rewardedToday,
      ledger: rewardedToday.ledger.map((entry) => ({
        ...entry,
        rewardedAt: "2026-05-16T12:00:00.000Z",
      })),
    };

    expect(
      countDailyRewardedReviewAccelerators(
        [
          withReviewAccelerationState({}, rewardedToday),
          withReviewAccelerationState({}, rewardedYesterday),
        ],
        now
      )
    ).toBe(1);
  });
});
