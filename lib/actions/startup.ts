"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ai } from "@/lib/ai";
import { requireCurrentUser } from "@/lib/auth-helpers";
import { createStartupSchema, pitchDeckSchema } from "@/lib/validations";
import { getOrCreateFounderProfile } from "@/lib/game/founder-progression";
import { evaluateAchievementsForPitch } from "@/lib/game/achievements";
import { deriveStartupMarketExposure } from "@/lib/market/exposure";
import { getCurrentMarketSnapshot } from "@/lib/market/snapshot-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkStartupCreateEntitlement } from "@/lib/billing/entitlements";
import { getReviewAccess, spendTokenAndBypass } from "@/lib/billing/review-access";
import { recordUsage } from "@/lib/billing/usage";
import {
  AI_REVIEW_ACTION_TYPE,
  enqueueAIReviewJob,
  generateAndPersistAIReviewForStartup,
  getAIReviewRuntimeConfig,
  getActiveAIReviewJobForStartup,
  isPrivateBetaAIReviewEnabled,
} from "@/lib/ai-review";
import { classifyStartup } from "@/lib/missions/startup-classifier";
import { generateMissionRoadmap, persistRoadmapToDb } from "@/lib/missions/mission-generator";
import { consumeWeeklySubmissionAllowance } from "@/lib/growth/submission-limits";
import { z } from "zod";

export async function createStartupAction(data: z.infer<typeof createStartupSchema>) {
  const user = await requireCurrentUser();

  const rateLimitError = await checkRateLimit(user.id, "startupCreate");
  if (rateLimitError) {
    throw new Error(rateLimitError);
  }

  const entitlement = await checkStartupCreateEntitlement(user.id);
  if (!entitlement.allowed) {
    throw new Error(entitlement.reason ?? "Startup creation limit reached.");
  }

  const aiRateLimitError = await checkRateLimit(user.id, "aiAnalysis");
  if (aiRateLimitError) {
    throw new Error(aiRateLimitError);
  }

  const validated = createStartupSchema.parse(data);

  const analysis = await ai.analyzeStartupIdea({
    name: validated.name,
    description: validated.description,
    sector: validated.sector,
    problem: validated.problem,
    solution: validated.solution,
    monetizationModel: validated.monetizationModel,
    fundingAsk: validated.fundingAsk,
  });

  // Phase 6: Compute market exposure
  const exposure = deriveStartupMarketExposure({
    sector: validated.sector,
    region: validated.region,
    monetizationModel: validated.monetizationModel,
    problem: validated.problem,
    solution: validated.solution,
  });
  const currentSnapshot = await getCurrentMarketSnapshot();

  // Phase 24: Classify startup type
  const classification = await classifyStartup({
    sector: validated.sector,
    description: validated.description,
    problem: validated.problem,
    solution: validated.solution,
    monetizationModel: validated.monetizationModel,
    region: validated.region,
    fundingAsk: validated.fundingAsk,
  });

  // Phase 24: Generate mission roadmap
  const roadmap = generateMissionRoadmap(
    "temp", // will be replaced with real ID after creation
    classification,
    validated.sector,
    "idea"
  );

  const enrichedAnalysis = {
    ...analysis,
    marketExposure: exposure,
    currentMarketScenario: currentSnapshot?.scenarioKey ?? "neutral_market",
    currentMarketTailwinds: exposure.tailwinds,
    currentMarketHeadwinds: exposure.headwinds,
    sectorTimingScore: analysis.marketScore ?? 50,
    regionRiskNotes: exposure.explanation,
    classification,
    missionRoadmap: roadmap,
  };

  const startup = await db.startup.create({
    data: {
      userId: user.id,
      name: validated.name,
      tagline: validated.description,
      description: validated.description,
      sector: validated.sector,
      region: validated.region,
      stage: "idea",
      targetMarket: validated.targetMarket,
      monetizationModel: validated.monetizationModel,
      status: "draft",
      problem: validated.problem,
      solution: validated.solution,
      unfairAdvantage: validated.unfairAdvantage,
      fundingAsk: validated.fundingAsk,
      cash: 0,
      monthlyBurn: 0,
      revenue: 0,
      valuation: analysis.initialValuationEstimate,
      productProgress: 0,
      investorScore: analysis.investorScore,
      marketScore: analysis.marketScore,
      riskScore: analysis.riskScore,
      aiAnalysis: enrichedAnalysis as unknown as Prisma.InputJsonValue,
    },
  });

  // Phase 24: Persist mission roadmap with real startupId
  const finalRoadmap = generateMissionRoadmap(
    startup.id,
    classification,
    validated.sector,
    "idea"
  );
  await db.$transaction(persistRoadmapToDb(startup.id, finalRoadmap));

  revalidatePath("/dashboard");
  redirect(`/startup/${startup.id}`);
}

export async function getUserStartups() {
  const user = await requireCurrentUser();
  return db.startup.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { simulationMonths: { select: { monthNumber: true } }, employees: true },
  });
}

export async function getStartupById(id: string) {
  const user = await requireCurrentUser();
  const startup = await db.startup.findUnique({
    where: { id },
    include: {
      pitchDeck: true,
      vcReviews: { orderBy: { createdAt: "desc" } },
      termSheets: { orderBy: { createdAt: "desc" } },
      fundingRounds: { orderBy: { createdAt: "desc" } },
      simulationMonths: { orderBy: { monthNumber: "asc" } },
      employees: true,
      missions: { orderBy: { sequence: "asc" } },
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Startup not found");
  }

  return startup;
}

export async function savePitchDeckAction(startupId: string, data: z.infer<typeof pitchDeckSchema>) {
  const user = await requireCurrentUser();
  const validated = pitchDeckSchema.parse(data);

  const startup = await db.startup.findUnique({ where: { id: startupId } });
  if (!startup || startup.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  await db.$transaction([
    db.pitchDeck.upsert({
      where: { startupId },
      create: {
        startupId,
        ...validated,
      },
      update: {
        ...validated,
      },
    }),
    db.startup.update({
      where: { id: startupId },
      data: { status: "pitching" },
    }),
  ]);

  revalidatePath(`/startup/${startupId}/pitch`);
  return { success: true };
}

export async function submitPitchForReviewAction(
  startupId: string,
  options?: { useSpeedToken?: boolean }
) {
  const user = await requireCurrentUser();

  const rateLimitError = await checkRateLimit(user.id, "vcReview");
  if (rateLimitError) {
    throw new Error(rateLimitError);
  }

  // Billing entitlement check
  const access = await getReviewAccess(user.id, startupId);
  if (!access.canSubmit && !options?.useSpeedToken) {
    throw new Error(access.reason ?? "Review not available.");
  }

  if (options?.useSpeedToken) {
    if (!access.canBypassWithToken) {
      throw new Error("No speed tokens available to bypass.");
    }
    const tokenResult = await spendTokenAndBypass(user.id);
    if (!tokenResult.success) {
      throw new Error(tokenResult.error ?? "Failed to use speed token.");
    }
  }

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: { pitchDeck: true, missions: { orderBy: { sequence: "asc" } } },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  if (!startup.pitchDeck) {
    throw new Error("Pitch deck not found");
  }

  const aiReviewConfig = getAIReviewRuntimeConfig();
  if (isPrivateBetaAIReviewEnabled()) {
    const activeJob = await getActiveAIReviewJobForStartup(user.id, startupId);
    if (activeJob) {
      throw new Error("A private beta AI review is already queued or running for this startup.");
    }

    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const [completedToday, queuedToday] = await Promise.all([
      db.vcReview.count({
        where: {
          startup: { userId: user.id },
          createdAt: { gte: dayStart },
        },
      }),
      db.queuedAction.count({
        where: {
          userId: user.id,
          actionType: AI_REVIEW_ACTION_TYPE,
          queuedAt: { gte: dayStart },
          status: { in: ["queued", "running", "retrying", "completed"] },
        },
      }),
    ]);
    if (completedToday + queuedToday >= aiReviewConfig.maxDailyPerUser) {
      throw new Error("Private beta AI review daily limit reached. Try again tomorrow.");
    }

    if (aiReviewConfig.mode === "queued_worker") {
      await enqueueAIReviewJob({
        userId: user.id,
        startupId,
        pitchDeckUpdatedAt: startup.pitchDeck.updatedAt,
        config: aiReviewConfig,
      });
      await consumeWeeklySubmissionAllowance({
        userId: user.id,
        startupId,
        pitchDeckUpdatedAt: startup.pitchDeck.updatedAt,
      });
      await recordUsage(user.id, "vcReview", 1);
      revalidatePath(`/startup/${startupId}/review`);
      redirect(`/startup/${startupId}/review`);
    }

    await generateAndPersistAIReviewForStartup({
      userId: user.id,
      startupId,
      config: aiReviewConfig,
    });
    await consumeWeeklySubmissionAllowance({
      userId: user.id,
      startupId,
      pitchDeckUpdatedAt: startup.pitchDeck.updatedAt,
    });
    await recordUsage(user.id, "vcReview", 1);
    revalidatePath(`/startup/${startupId}/review`);
    redirect(`/startup/${startupId}/review`);
  }

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

  // Phase 6: Enrich review with market timing
  const exposure = deriveStartupMarketExposure(startup);
  const currentSnapshot = await getCurrentMarketSnapshot();
  const scenario = currentSnapshot?.scenarioKey ?? "neutral_market";

  // Phase 14: Generate committee review
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

  // Phase 14: Generate founder coaching
  const coaching = await ai.generateFounderCoaching({
    context: "pitch_review",
    startupName: startup.name,
    sector: startup.sector,
    outcomeSummary: `${review.decision} with score ${review.overallScore}/100`,
  });

  // Phase 24B: Mission roadmap credibility & funding adequacy
  const totalMissionCost = startup.missions.reduce((sum, m) => sum + (m.estimatedCost ?? 0), 0);
  const fundingAdequacy = startup.fundingAsk > 0 ? Math.round((startup.fundingAsk / Math.max(totalMissionCost, 1)) * 100) : 0;
  const completedMissions = startup.missions.filter((m) => m.status === "completed").length;
  const missionRealismScore = startup.missions.length > 0 ? Math.round((completedMissions / startup.missions.length) * 100) : 0;
  const roadmapConcern = fundingAdequacy < 50
    ? "Funding ask appears insufficient for the full mission roadmap."
    : fundingAdequacy < 80
    ? "Funding is tight against the mission roadmap."
    : "Funding appears adequate for the planned roadmap.";
  const requiredRoles = new Set(startup.missions.flatMap((m) => ((m.requiredRoles as unknown as { role: string }[]) ?? []).map((r) => r.role)));
  const recommendedFirstHire = requiredRoles.size > 0 ? Array.from(requiredRoles)[0] : "CTO";

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
    missionRealismScore,
    fundingAdequacy,
    roadmapConcern,
    recommendedFirstHire,
    missionCount: startup.missions.length,
    totalMissionCost,
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

  // Grant first pitch achievement
  const profile = await getOrCreateFounderProfile(user.id);
  await evaluateAchievementsForPitch(profile.id);

  await consumeWeeklySubmissionAllowance({
    userId: user.id,
    startupId,
    pitchDeckUpdatedAt: startup.pitchDeck.updatedAt,
  });
  await recordUsage(user.id, "vcReview", 1);

  revalidatePath(`/startup/${startupId}/review`);
  redirect(`/startup/${startupId}/review`);
}

export async function getLatestVcReview(startupId: string) {
  const user = await requireCurrentUser();
  const startup = await db.startup.findUnique({ where: { id: startupId } });
  if (!startup || startup.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  return db.vcReview.findFirst({
    where: { startupId },
    orderBy: { createdAt: "desc" },
  });
}
