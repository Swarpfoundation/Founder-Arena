"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-helpers";
import { getUserPlan } from "@/lib/billing/entitlements";
import { getPlanConfig } from "@/lib/billing/plans";
import {
  adConsentStateFromSettings,
  canUseMockRewardedAds,
  evaluateConsentForRewardedAds,
  getDefaultAdConsentState,
} from "@/lib/monetization/consent";
import { getAdPrivacyStateForUser } from "@/lib/monetization/consent/ad-privacy-store";
import {
  buildRewardedAdSafeContext,
  getRewardedAdProvider,
  type RewardedAdProviderStatus,
} from "@/lib/monetization/rewarded-ads";
import { areRewardedAdsHiddenForPrivateBeta } from "@/lib/ai-review/config";
import {
  cancelMockRewardedReview,
  completeMockRewardedReview,
  countDailyRewardedReviewAccelerators,
  getReviewAccelerationEligibility,
  getReviewAccelerationState,
  REVIEW_QUEUE_ACCELERATION_LIMITS,
  startMockRewardedReview,
  withReviewAccelerationState,
  type RewardEligibility,
} from "@/lib/rewards/rewarded-review-acceleration";

export interface RewardedReviewAccelerationOffer {
  reviewId: string | null;
  reviewStartupId: string | null;
  planId: string;
  mockMode: true;
  activeProvider: "mock";
  providerStatus: RewardedAdProviderStatus;
  mockRewardOffersDisabled: boolean;
  mockCountdownSeconds: number;
  eligibility: RewardEligibility;
}

async function getOwnedStartup(userId: string, startupId: string) {
  const startup = await db.startup.findUnique({
    where: { id: startupId },
    select: { id: true, userId: true },
  });

  if (!startup || startup.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return startup;
}

async function getLatestUserReview(userId: string) {
  return db.vcReview.findFirst({
    where: { startup: { userId } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      startupId: true,
      createdAt: true,
      rawResponse: true,
    },
  });
}

async function getDailyRewardsUsed(userId: string) {
  const reviews = await db.vcReview.findMany({
    where: { startup: { userId } },
    select: { rawResponse: true },
  });
  return countDailyRewardedReviewAccelerators(reviews.map((review) => review.rawResponse));
}

function emptyEligibility(planId: string, reason: string): RewardEligibility {
  return {
    eligible: false,
    reason,
    currentWaitSeconds: 0,
    rewardPreview: null,
    dailyRewardsUsed: 0,
    dailyRewardLimit: REVIEW_QUEUE_ACCELERATION_LIMITS.dailyRewardLimit,
    reviewAcceleratorsUsed: 0,
    reviewAcceleratorLimit: REVIEW_QUEUE_ACCELERATION_LIMITS.maxAcceleratorsPerReview,
  };
}

export async function getRewardedReviewAccelerationOfferAction(
  startupId: string
): Promise<RewardedReviewAccelerationOffer> {
  const user = await requireCurrentUser();
  await getOwnedStartup(user.id, startupId);

  const planId = await getUserPlan(user.id);
  const config = getPlanConfig(planId);
  const latestReview = await getLatestUserReview(user.id);
  const privateBetaAdsHidden = areRewardedAdsHiddenForPrivateBeta();

  if (!latestReview) {
    return {
      reviewId: null,
      reviewStartupId: null,
      planId,
      mockMode: true,
      activeProvider: "mock",
      providerStatus: "available",
      mockRewardOffersDisabled: privateBetaAdsHidden,
      mockCountdownSeconds: REVIEW_QUEUE_ACCELERATION_LIMITS.mockCountdownSeconds,
      eligibility: emptyEligibility(
        planId,
        privateBetaAdsHidden
          ? "Rewarded review acceleration is disabled for this private beta."
          : "Submit a VC review first before accelerator rewards are available."
      ),
    };
  }

  const dailyRewardsUsed = await getDailyRewardsUsed(user.id);
  const adPrivacyState = await getAdPrivacyStateForUser(user.id);
  const eligibility = getReviewAccelerationEligibility({
    reviewId: latestReview.id,
    startupId: latestReview.startupId,
    reviewCreatedAt: latestReview.createdAt,
    rawResponse: latestReview.rawResponse,
    cooldownSeconds: config.limits.reviewCooldownSeconds,
    planId,
    dailyRewardsUsed,
  });
  if (privateBetaAdsHidden) {
    eligibility.eligible = false;
    eligibility.reason = "Rewarded review acceleration is disabled for this private beta.";
    eligibility.rewardPreview = null;
  }
  if (!canUseMockRewardedAds(adConsentStateFromSettings(adPrivacyState.settings), adPrivacyState.settings)) {
    eligibility.eligible = false;
    eligibility.reason = "Mock rewarded review offers are disabled in Ad Privacy settings.";
    eligibility.rewardPreview = null;
  }

  return {
    reviewId: latestReview.id,
    reviewStartupId: latestReview.startupId,
    planId,
    mockMode: true,
    activeProvider: "mock",
    providerStatus: getRewardedAdProvider("mock").getStatus({
      consentDecision: evaluateConsentForRewardedAds(adConsentStateFromSettings(adPrivacyState.settings)),
      runtime: "server",
      mockMode: true,
    }),
    mockRewardOffersDisabled: privateBetaAdsHidden || adPrivacyState.settings.mockRewardOffersDisabled,
    mockCountdownSeconds: REVIEW_QUEUE_ACCELERATION_LIMITS.mockCountdownSeconds,
    eligibility,
  };
}

export async function startMockRewardedReviewAdAction(startupId: string) {
  const user = await requireCurrentUser();
  await getOwnedStartup(user.id, startupId);
  if (areRewardedAdsHiddenForPrivateBeta()) {
    throw new Error("Rewarded review acceleration is disabled for this private beta.");
  }

  const planId = await getUserPlan(user.id);
  const config = getPlanConfig(planId);
  const latestReview = await getLatestUserReview(user.id);

  if (!latestReview) {
    throw new Error("No VC review cooldown is available to accelerate.");
  }

  const dailyRewardsUsed = await getDailyRewardsUsed(user.id);
  const adPrivacyState = await getAdPrivacyStateForUser(user.id);
  if (!canUseMockRewardedAds(adConsentStateFromSettings(adPrivacyState.settings), adPrivacyState.settings)) {
    throw new Error("Mock rewarded review offers are disabled in Ad Privacy settings.");
  }
  const eligibility = getReviewAccelerationEligibility({
    reviewId: latestReview.id,
    startupId: latestReview.startupId,
    reviewCreatedAt: latestReview.createdAt,
    rawResponse: latestReview.rawResponse,
    cooldownSeconds: config.limits.reviewCooldownSeconds,
    planId,
    dailyRewardsUsed,
  });

  if (!eligibility.eligible) {
    throw new Error(eligibility.reason);
  }

  const state = getReviewAccelerationState({
    reviewId: latestReview.id,
    startupId: latestReview.startupId,
    reviewCreatedAt: latestReview.createdAt,
    rawResponse: latestReview.rawResponse,
    cooldownSeconds: config.limits.reviewCooldownSeconds,
  });

  const nextState = startMockRewardedReview({
    state,
    userId: user.id,
    startupId: latestReview.startupId,
    ledgerEntryId: randomUUID(),
  });
  const ledgerEntryId = nextState.ledger[nextState.ledger.length - 1]?.id;
  if (!ledgerEntryId) {
    throw new Error("Mock reward session could not be created.");
  }
  const consentDecision = evaluateConsentForRewardedAds(getDefaultAdConsentState({ userId: user.id }));
  const providerResult = getRewardedAdProvider("mock").start({
    placement: "review_queue_acceleration",
    rewardType: "review_queue_accelerator",
    ledgerEntryId,
    startupId: latestReview.startupId,
    reviewId: latestReview.id,
    consentDecision,
    mockMode: true,
  });
  if (providerResult.status === "failed") {
    throw new Error(providerResult.errorCode ?? "Mock rewarded provider failed to start.");
  }
  buildRewardedAdSafeContext({
    placement: "review_queue_acceleration",
    rewardType: "review_queue_accelerator",
    ledgerEntryId,
    provider: "mock",
    routeContext: "/startup/[id]/pitch",
    appMode: "mock",
  });

  await db.vcReview.update({
    where: { id: latestReview.id },
    data: {
      rawResponse: withReviewAccelerationState(latestReview.rawResponse, nextState) as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/startup/${startupId}/pitch`);
  revalidatePath(`/startup/${latestReview.startupId}/pitch`);

  return {
    reviewId: latestReview.id,
    ledgerEntryId,
    mockCountdownSeconds: REVIEW_QUEUE_ACCELERATION_LIMITS.mockCountdownSeconds,
  };
}

export async function completeMockRewardedReviewAdAction(reviewId: string, ledgerEntryId: string, startupId: string) {
  const user = await requireCurrentUser();
  await getOwnedStartup(user.id, startupId);

  const planId = await getUserPlan(user.id);
  const config = getPlanConfig(planId);
  const review = await db.vcReview.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      startupId: true,
      createdAt: true,
      rawResponse: true,
      startup: { select: { userId: true } },
    },
  });

  if (!review || review.startup.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  const state = getReviewAccelerationState({
    reviewId: review.id,
    startupId: review.startupId,
    reviewCreatedAt: review.createdAt,
    rawResponse: review.rawResponse,
    cooldownSeconds: config.limits.reviewCooldownSeconds,
  });
  const ledgerEntry = state.ledger.find((entry) => entry.id === ledgerEntryId);
  if (!ledgerEntry) {
    throw new Error("Reward ledger entry not found.");
  }
  if (ledgerEntry.status !== "rewarded") {
    const dailyRewardsUsed = await getDailyRewardsUsed(user.id);
    if (dailyRewardsUsed >= REVIEW_QUEUE_ACCELERATION_LIMITS.dailyRewardLimit) {
      throw new Error("Daily rewarded accelerator limit reached.");
    }
  }
  const consentDecision = evaluateConsentForRewardedAds(getDefaultAdConsentState({ userId: user.id }));
  const providerResult = getRewardedAdProvider("mock").complete({
    placement: "review_queue_acceleration",
    rewardType: "review_queue_accelerator",
    ledgerEntryId,
    startupId: review.startupId,
    reviewId: review.id,
    consentDecision,
    mockMode: true,
  });
  if (providerResult.status !== "completed") {
    throw new Error("Mock rewarded provider did not complete.");
  }
  const result = completeMockRewardedReview({ state, ledgerEntryId });

  if (result.changed) {
    await db.vcReview.update({
      where: { id: review.id },
      data: {
        rawResponse: withReviewAccelerationState(review.rawResponse, result.state) as unknown as Prisma.InputJsonValue,
      },
    });
  }

  revalidatePath(`/startup/${startupId}/pitch`);
  revalidatePath(`/startup/${review.startupId}/pitch`);

  return {
    success: true,
    changed: result.changed,
    beforeReadyAt: result.preview.beforeReadyAt,
    afterReadyAt: result.preview.afterReadyAt,
    reductionSeconds: result.preview.reductionSeconds,
  };
}

export async function cancelMockRewardedReviewAdAction(reviewId: string, ledgerEntryId: string, startupId: string) {
  const user = await requireCurrentUser();
  await getOwnedStartup(user.id, startupId);

  const planId = await getUserPlan(user.id);
  const config = getPlanConfig(planId);
  const review = await db.vcReview.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      startupId: true,
      createdAt: true,
      rawResponse: true,
      startup: { select: { userId: true } },
    },
  });

  if (!review || review.startup.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  const state = getReviewAccelerationState({
    reviewId: review.id,
    startupId: review.startupId,
    reviewCreatedAt: review.createdAt,
    rawResponse: review.rawResponse,
    cooldownSeconds: config.limits.reviewCooldownSeconds,
  });
  const consentDecision = evaluateConsentForRewardedAds(getDefaultAdConsentState({ userId: user.id }));
  getRewardedAdProvider("mock").cancel({
    placement: "review_queue_acceleration",
    rewardType: "review_queue_accelerator",
    ledgerEntryId,
    startupId: review.startupId,
    reviewId: review.id,
    consentDecision,
    mockMode: true,
  });
  const result = cancelMockRewardedReview({ state, ledgerEntryId });

  if (result.changed) {
    await db.vcReview.update({
      where: { id: review.id },
      data: {
        rawResponse: withReviewAccelerationState(review.rawResponse, result.state) as unknown as Prisma.InputJsonValue,
      },
    });
  }

  revalidatePath(`/startup/${startupId}/pitch`);
  revalidatePath(`/startup/${review.startupId}/pitch`);

  return { success: true, changed: result.changed };
}
