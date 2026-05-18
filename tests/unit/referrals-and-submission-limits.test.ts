import { describe, expect, it } from "vitest";
import {
  REFERRAL_SIGNUP_FOUNDER_POINTS,
  REFERRAL_SIGNUP_SUBMISSION_CREDITS,
  buildReferralLink,
  buildReferralRewardIdempotencyKey,
  canAttributeReferral,
  createReferralRewardLedgerEntry,
  generateStableReferralCode,
  isCashLikeRewardType,
  normalizeReferralCode,
  sumFounderPoints,
  sumSubmissionCredits,
} from "@/lib/growth/referral-rules";
import {
  WEEKLY_REVIEW_SUBMISSION_LIMIT_FREE,
  buildWeeklySubmissionIdempotencyKey,
  calculateWeeklySubmissionStatus,
  getUtcCalendarWeekWindow,
} from "@/lib/growth/submission-limits";
import { PLANS } from "@/lib/billing/plans";

describe("referral rewards and weekly submission limits", () => {
  it("generates stable non-email referral codes and safe links", () => {
    const codeA = generateStableReferralCode("user-alpha@example.com");
    const codeB = generateStableReferralCode("user-alpha@example.com");
    const codeC = generateStableReferralCode("user-beta");

    expect(codeA).toBe(codeB);
    expect(codeA).not.toBe(codeC);
    expect(codeA).toMatch(/^FA[A-Z0-9]{8}$/);
    expect(codeA).not.toContain("@");
    expect(buildReferralLink("https://founderarena.test/", codeA)).toBe(`https://founderarena.test/r/${codeA}`);
    expect(normalizeReferralCode(" fa-123 abc ")).toBe("FA123ABC");
  });

  it("rejects self-referral and one-user-multiple-referrer abuse", () => {
    expect(canAttributeReferral({ referrerUserId: "u1", referredUserId: "u1" })).toMatchObject({
      allowed: false,
    });
    expect(
      canAttributeReferral({
        referrerUserId: "u2",
        referredUserId: "u1",
        existingReferrerUserId: "u3",
      })
    ).toMatchObject({ allowed: false });
    expect(canAttributeReferral({ referrerUserId: "u2", referredUserId: "u1" })).toMatchObject({
      allowed: true,
    });
  });

  it("builds idempotent non-cash signup reward ledger entries for both sides", () => {
    const referrerPoints = createReferralRewardLedgerEntry({
      userId: "referrer",
      type: "founder_points",
      amount: REFERRAL_SIGNUP_FOUNDER_POINTS,
      reason: "referral_signup",
      sourceUserId: "referred",
      idempotencyKey: buildReferralRewardIdempotencyKey({
        userId: "referrer",
        referredUserId: "referred",
        reason: "referral_signup",
        type: "founder_points",
      }),
      now: new Date("2026-05-18T00:00:00.000Z"),
    });
    const referredCredit = createReferralRewardLedgerEntry({
      userId: "referred",
      type: "submission_credit",
      amount: REFERRAL_SIGNUP_SUBMISSION_CREDITS,
      reason: "referral_signup",
      sourceUserId: "referrer",
      idempotencyKey: buildReferralRewardIdempotencyKey({
        userId: "referred",
        referredUserId: "referred",
        reason: "referral_signup",
        type: "submission_credit",
      }),
      now: new Date("2026-05-18T00:00:00.000Z"),
    });

    expect(referrerPoints.idempotencyKey).toBe("referral-reward:referral_signup:founder_points:referrer:referred");
    expect(referredCredit.idempotencyKey).toBe("referral-reward:referral_signup:submission_credit:referred:referred");
    expect(sumFounderPoints([referrerPoints, referredCredit])).toBe(100);
    expect(sumSubmissionCredits([referrerPoints, referredCredit])).toBe(1);
  });

  it("keeps founder points and submission credits separate from cash-like reward types", () => {
    expect(isCashLikeRewardType("founder_points")).toBe(false);
    expect(isCashLikeRewardType("submission_credit")).toBe(false);
    expect(isCashLikeRewardType("cash_payout")).toBe(true);
    expect(isCashLikeRewardType("crypto_token")).toBe(true);
    expect(isCashLikeRewardType("gift_card")).toBe(true);
  });

  it("uses a UTC calendar-week review window", () => {
    const { start, end } = getUtcCalendarWeekWindow(new Date("2026-05-20T12:00:00.000Z"));
    expect(start.toISOString()).toBe("2026-05-18T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-05-25T00:00:00.000Z");
  });

  it("allows free users three VC review submissions per week", () => {
    const status = calculateWeeklySubmissionStatus({
      planId: "free",
      usedCount: 2,
      submissionCreditsAvailable: 0,
      now: new Date("2026-05-20T12:00:00.000Z"),
    });

    expect(WEEKLY_REVIEW_SUBMISSION_LIMIT_FREE).toBe(3);
    expect(status.canSubmit).toBe(true);
    expect(status.remainingFreeSubmissions).toBe(1);
    expect(status.willUseCredit).toBe(false);
  });

  it("blocks free users after three weekly submissions without credits", () => {
    const status = calculateWeeklySubmissionStatus({
      planId: "free",
      usedCount: 3,
      submissionCreditsAvailable: 0,
    });

    expect(status.canSubmit).toBe(false);
    expect(status.reason).toContain("3 VC reviews per week");
  });

  it("lets free users spend submission credits after the weekly cap", () => {
    const status = calculateWeeklySubmissionStatus({
      planId: "free",
      usedCount: 3,
      submissionCreditsAvailable: 2,
    });

    expect(status.canSubmit).toBe(true);
    expect(status.remainingFreeSubmissions).toBe(0);
    expect(status.willUseCredit).toBe(true);
  });

  it("paid plans bypass the weekly free cap", () => {
    for (const planId of ["pro", "max"] as const) {
      const status = calculateWeeklySubmissionStatus({
        planId,
        usedCount: 99,
        submissionCreditsAvailable: 0,
      });
      expect(status.canSubmit).toBe(true);
      expect(status.isPaid).toBe(true);
      expect(status.willUseCredit).toBe(false);
    }
  });

  it("builds submission idempotency keys from user, startup, and pitch version", () => {
    expect(
      buildWeeklySubmissionIdempotencyKey({
        userId: "u1",
        startupId: "s1",
        pitchDeckUpdatedAt: "2026-05-18T00:00:00.000Z",
      })
    ).toBe("weekly-review-submit:u1:s1:2026-05-18T00:00:00.000Z");
  });

  it("paid/free plan configs preserve convenience-only review access", () => {
    expect(PLANS.free.limits.maxStartups).toBe(0);
    expect(PLANS.free.features.join(" ")).toContain("3 VC review submissions / week");
    expect(PLANS.pro.limits.maxAiReviewsPerMonth).toBe(0);
    expect(PLANS.max.limits.maxAiReviewsPerMonth).toBe(0);
  });
});
