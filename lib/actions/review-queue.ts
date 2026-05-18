"use server";

import { db } from "@/lib/db";
import { ai } from "@/lib/ai";
import { requireCurrentUser } from "@/lib/auth-helpers";
import { getReviewAccess, spendTokenAndBypass } from "@/lib/billing/review-access";
import { checkAiReviewEntitlement } from "@/lib/billing/entitlements";
import { recordUsage } from "@/lib/billing/usage";

import { deriveStartupMarketExposure } from "@/lib/market/exposure";
import { getCurrentMarketSnapshot } from "@/lib/market/snapshot-service";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { consumeWeeklySubmissionAllowance } from "@/lib/growth/submission-limits";

/**
 * Check if the user can submit a pitch review right now.
 * Returns access info including cooldown, quota, and token status.
 */
export async function checkReviewAccessAction(startupId: string) {
  const user = await requireCurrentUser();
  const access = await getReviewAccess(user.id, startupId);
  return {
    ...access,
    weeklySubmission: {
      ...access.weeklySubmission,
      windowStart: access.weeklySubmission.windowStart.toISOString(),
      windowEnd: access.weeklySubmission.windowEnd.toISOString(),
    },
  };
}

/**
 * Submit a pitch review with entitlement checks.
 * If blocked by cooldown/quota, throws an error with details.
 * Supports speed-token bypass.
 */
export async function submitPitchForReviewWithBillingAction(
  startupId: string,
  options?: { useSpeedToken?: boolean }
) {
  const user = await requireCurrentUser();
  const access = await getReviewAccess(user.id, startupId);

  // If not allowed and no token bypass requested, throw
  if (!access.canSubmit && !options?.useSpeedToken) {
    throw new Error(access.reason ?? "Review not available.");
  }

  // If using speed token, verify and spend it
  if (options?.useSpeedToken) {
    if (!access.canBypassWithToken) {
      throw new Error("No speed tokens available to bypass.");
    }
    const tokenResult = await spendTokenAndBypass(user.id);
    if (!tokenResult.success) {
      throw new Error(tokenResult.error ?? "Failed to use speed token.");
    }
  } else {
    // Normal path: ensure quota allows
    const entitlement = await checkAiReviewEntitlement(user.id);
    if (!entitlement.allowed && !access.isFirstReview) {
      throw new Error(entitlement.reason ?? "Monthly review quota exceeded.");
    }
  }

  // Fetch startup + pitch deck
  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: { pitchDeck: true },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Unauthorized");
  }
  if (!startup.pitchDeck) {
    throw new Error("Pitch deck not found");
  }

  // Run AI review pipeline
  const review = await ai.reviewPitch({
    startupName: startup.name,
    sector: startup.sector,
    pitchDeck: {
      problem: startup.pitchDeck.problem,
      solution: startup.pitchDeck.solution,
      marketSize: startup.pitchDeck.marketSize,
      product: startup.pitchDeck.product,
      businessModel: startup.pitchDeck.businessModel,
      goToMarket: startup.pitchDeck.goToMarket,
      competition: startup.pitchDeck.competition,
      team: startup.pitchDeck.team,
      financialPlan: startup.pitchDeck.financialPlan,
      ask: startup.pitchDeck.ask,
      useOfFunds: startup.pitchDeck.useOfFunds,
    },
  });

  const exposure = deriveStartupMarketExposure(startup);
  const currentSnapshot = await getCurrentMarketSnapshot();
  const scenario = currentSnapshot?.scenarioKey ?? "neutral_market";

  const committee = await ai.generateCommitteeReview({
    startupName: startup.name,
    sector: startup.sector,
    baseScores: {
      problem: review.scoreProblem,
      solution: review.scoreSolution,
      market: review.scoreMarket,
      team: review.scoreTeam ?? 50,
      business: review.scoreBusiness,
    },
    decision: review.decision,
  });

  const coaching = await ai.generateFounderCoaching({
    context: "pitch_review",
    startupName: startup.name,
    sector: startup.sector,
    outcomeSummary: `${review.decision} with score ${review.overallScore}/100`,
  });

  const enrichedReview = {
    ...review,
    committee,
    coaching,
    marketTiming: `${review.marketTiming}\n\nMarket Context: ${scenario.replace(/_/g, " ")}. ` +
      `Tailwinds: ${exposure.tailwinds.slice(0, 2).join("; ")}. ` +
      `Headwinds: ${exposure.headwinds.slice(0, 2).join("; ")}.`,
    investorClimateImpact: scenario.includes("bull") || scenario.includes("boom") || scenario.includes("expansion")
      ? "Favorable"
      : scenario.includes("bear") || scenario.includes("crisis") || scenario.includes("recession")
      ? "Unfavorable"
      : "Neutral",
    riskAdjustedRecommendation: review.overallScore && review.overallScore > 70
      ? "Strong investable opportunity"
      : review.overallScore && review.overallScore > 50
      ? "Conditional interest with risk mitigation"
      : "High risk - recommend passing",
  };

  await db.vcReview.create({
    data: {
      startupId,
      decision: review.decision,
      memo: review.memo,
      scoreProblem: review.scoreProblem,
      scoreSolution: review.scoreSolution,
      scoreMarket: review.scoreMarket,
      scoreTeam: review.scoreTeam,
      scoreBusiness: review.scoreBusiness,
      overallScore: review.overallScore,
      feedback: review.feedback,
      proposedAmount: review.proposedAmount,
      proposedEquity: review.proposedEquity ? String(review.proposedEquity) : null,
      strengths: review.strengths.join("\n"),
      weaknesses: review.weaknesses.join("\n"),
      marketTiming: enrichedReview.marketTiming,
      milestones: review.milestones.join("\n"),
      rawResponse: enrichedReview as unknown as Prisma.InputJsonValue,
    },
  });

  await consumeWeeklySubmissionAllowance({
    userId: user.id,
    startupId,
    pitchDeckUpdatedAt: startup.pitchDeck.updatedAt,
  });
  await recordUsage(user.id, "vcReview", 1);

  revalidatePath(`/startup/${startupId}/review`);
  return { success: true, usedSpeedToken: options?.useSpeedToken ?? false };
}
