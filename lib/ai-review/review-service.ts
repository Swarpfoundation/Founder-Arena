import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ai } from "@/lib/ai";
import { getOrCreateFounderProfile } from "@/lib/game/founder-progression";
import { evaluateAchievementsForPitch } from "@/lib/game/achievements";
import { deriveStartupMarketExposure } from "@/lib/market/exposure";
import { getCurrentMarketSnapshot } from "@/lib/market/snapshot-service";
import { generateReviewWithConfiguredProvider } from "./provider";
import { buildAIReviewSafeInput } from "./safe-input";
import type { AIReviewResult, AIReviewRuntimeConfig } from "./types";

export async function loadStartupForAIReview(userId: string, startupId: string) {
  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: { pitchDeck: true, missions: { orderBy: { sequence: "asc" } } },
  });

  if (!startup || startup.userId !== userId) {
    throw new Error("Unauthorized");
  }
  if (!startup.pitchDeck) {
    throw new Error("Pitch deck not found");
  }

  return startup;
}

export async function persistAIReviewResult(input: {
  userId: string;
  startup: Awaited<ReturnType<typeof loadStartupForAIReview>>;
  review: AIReviewResult;
}) {
  const { startup, review } = input;
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

  const totalMissionCost = startup.missions.reduce((sum, mission) => sum + (mission.estimatedCost ?? 0), 0);
  const fundingAdequacy = startup.fundingAsk > 0
    ? Math.round((startup.fundingAsk / Math.max(totalMissionCost, 1)) * 100)
    : 0;
  const completedMissions = startup.missions.filter((mission) => mission.status === "completed").length;
  const missionRealismScore = startup.missions.length > 0
    ? Math.round((completedMissions / startup.missions.length) * 100)
    : 0;
  const roadmapConcern = fundingAdequacy < 50
    ? "Funding ask appears insufficient for the full mission roadmap."
    : fundingAdequacy < 80
      ? "Funding is tight against the mission roadmap."
      : "Funding appears adequate for the planned roadmap.";
  const requiredRoles = new Set(
    startup.missions.flatMap((mission) =>
      ((mission.requiredRoles as unknown as { role: string }[]) ?? []).map((role) => role.role)
    )
  );
  const recommendedFirstHire = requiredRoles.size > 0 ? Array.from(requiredRoles)[0] : "CTO";

  const enrichedReview = {
    ...review,
    committee,
    coaching,
    marketTiming:
      `${review.marketTiming}\n\nMarket Context: ${scenario.replace(/_/g, " ")}. ` +
      `Tailwinds: ${exposure.tailwinds.slice(0, 2).join("; ")}. ` +
      `Headwinds: ${exposure.headwinds.slice(0, 2).join("; ")}.`,
    investorClimateImpact:
      scenario.includes("bull") || scenario.includes("boom") || scenario.includes("expansion")
        ? "Favorable"
        : scenario.includes("bear") || scenario.includes("crisis") || scenario.includes("recession")
          ? "Unfavorable"
          : "Neutral",
    riskAdjustedRecommendation:
      review.overallScore > 70
        ? "Strong investable opportunity"
        : review.overallScore > 50
          ? "Conditional interest with risk mitigation"
          : "High risk - recommend passing",
    missionRealismScore,
    fundingAdequacy,
    roadmapConcern,
    recommendedFirstHire,
    missionCount: startup.missions.length,
    totalMissionCost,
    privateBetaAIReview: {
      provider: review.providerMetadata.provider,
      mode: review.providerMetadata.mode,
      model: review.providerMetadata.model,
      usedFallback: review.providerMetadata.usedFallback ?? false,
      durationMs: review.providerMetadata.durationMs,
      usage: review.providerMetadata.usage,
    },
  };

  const created = await db.vcReview.create({
    data: {
      startupId: startup.id,
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

  const profile = await getOrCreateFounderProfile(input.userId);
  await evaluateAchievementsForPitch(profile.id);

  return created;
}

export async function generateAndPersistAIReviewForStartup(input: {
  userId: string;
  startupId: string;
  config?: AIReviewRuntimeConfig;
}) {
  const startup = await loadStartupForAIReview(input.userId, input.startupId);
  const safeInput = buildAIReviewSafeInput(startup);
  const review = await generateReviewWithConfiguredProvider(safeInput, input.config);
  return persistAIReviewResult({ userId: input.userId, startup, review });
}
