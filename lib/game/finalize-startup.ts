import { db } from "@/lib/db";
import { SimulationMonth, Prisma } from "@prisma/client";
import { generatePublicSlug } from "./public-slug";
import { createOrUpdateLeaderboardEntry } from "./leaderboard";
import { evaluateAchievementsOnFinalization, evaluateMissionAchievements } from "./achievements";
import { getOrCreateFounderProfile, updateFounderStatsAfterFinalization, addXP } from "./founder-progression";
import { classifyFinalOutcome, calculateLeaderboardScore } from "@/lib/simulation/engine";
import { calculateTotalBurn } from "@/lib/economy/cost-engine";
import { ai } from "@/lib/ai";
import type { SeniorityLevel } from "@/lib/economy/types";
import {
  buildInfrastructurePreviewInputForStartup,
  calculateRuntimeInfrastructureBurn,
  parseInfrastructureState,
  syncCloudCreditBalancesFromOffers,
} from "@/lib/infrastructure";

export interface FinalizationResult {
  outcome: string;
  reason: string;
  founderScore: number;
  leaderboardScore: number;
  publicSlug: string;
  achievementsUnlocked: string[];
  xpGained: number;
  // Career update summary (Phase 10)
  careerUpdate?: {
    newBadges: string[];
    rankAdvanced: boolean;
    titleChanged: boolean;
    newTitle: string;
    newRank: string;
    reputationScore: number;
    reputationDelta: number;
  };
}

export async function finalizeStartup(startupId: string): Promise<FinalizationResult | null> {
  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: {
      simulationMonths: { orderBy: { monthNumber: "asc" } },
      employees: true,
      fundingRounds: true,
      leaderboardEntries: true,
      missions: { orderBy: { sequence: "asc" } },
      growthOffers: {
        where: { offerType: "cloud_credits", status: "accepted" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!startup) return null;
  if (startup.status !== "dead" && startup.status !== "completed") return null;

  const history = startup.simulationMonths;
  const monthsSurvived = history.length;
  if (monthsSurvived === 0) return null;

  // Idempotency: if already fully finalized with same outcome, return cached result
  if (startup.finalOutcome && startup.publicSlug && startup.finalScore) {
    const profile = await getOrCreateFounderProfile(startup.userId);
    const achievements = await db.founderAchievement.findMany({
      where: { founderProfileId: profile.id },
      select: { key: true },
    });
    return {
      outcome: startup.finalOutcome,
      reason: startup.finalSummary ?? "",
      founderScore: startup.finalScore,
      leaderboardScore: startup.leaderboardEntries[0]?.score ?? 0,
      publicSlug: startup.publicSlug,
      achievementsUnlocked: achievements.map((a) => a.key),
      xpGained: 0,
    };
  }

  const finalMonth = history[history.length - 1];

  // Compute true monthly burn from the cost engine (payroll + office +
  // sector operating costs + runtime infrastructure burn) so capital efficiency in the final outcome
  // reflects the burn the user actually fought, not the stored baseBurn.
  const activeEmployeesForBurn = startup.employees
    .filter((e) => e.status === "active")
    .map((e) => ({
      role: e.role,
      seniority: e.seniority as SeniorityLevel,
      region: startup.region,
    }));
  const infraPreviewInput = buildInfrastructurePreviewInputForStartup({
    startup: {
      id: startup.id,
      sector: startup.sector,
      stage: startup.stage,
      status: startup.status,
      monetizationModel: startup.monetizationModel,
      description: startup.description,
      problem: startup.problem,
      solution: startup.solution,
      productProgress: startup.productProgress,
      revenue: startup.revenue,
      riskScore: startup.riskScore,
      simulationMonths: startup.simulationMonths,
    },
    cloudCreditOffers: startup.growthOffers.map((offer) => ({
      id: offer.id,
      amount: offer.amount,
      status: offer.status,
      sourceOfferId: offer.id,
    })),
    currentSprint: Math.max(1, Math.min(12, history.length || 12)),
  });
  const infrastructureState = syncCloudCreditBalancesFromOffers(
    parseInfrastructureState(startup.aiAnalysis),
    infraPreviewInput.cloudCreditOffers ?? [],
    Math.max(1, Math.min(12, history.length || 12)),
    startup.id
  );
  const runtimeInfraBurn = calculateRuntimeInfrastructureBurn(infraPreviewInput, {
    selectedStackId: infrastructureState.selectedStackId,
    creditBalances: infrastructureState.creditBalances,
  });
  const trueBurnEstimate = calculateTotalBurn(
    activeEmployeesForBurn,
    startup.workSetup,
    startup.sector,
    startup.stage,
    startup.revenue,
    0,
    undefined,
    runtimeInfraBurn.runtimeMonthlyInfraBurn,
    {
      sourceStackId: runtimeInfraBurn.sourceStackId,
      version: runtimeInfraBurn.version,
      warnings: runtimeInfraBurn.warnings,
      explanation: runtimeInfraBurn.explanation,
      grossInfrastructureCostsMonthly: runtimeInfraBurn.grossInfraBurn,
      aiApiCostsMonthly: runtimeInfraBurn.aiApiBurn,
      complianceCostsMonthly: runtimeInfraBurn.complianceBurn,
      cloudCreditsAppliedMonthly: runtimeInfraBurn.creditsApplied,
    }
  );
  const trueMonthlyBurn = trueBurnEstimate.totalMonthlyBurn;

  const state = {
    cash: startup.cash,
    monthlyBurn: trueMonthlyBurn,
    revenue: startup.revenue,
    valuation: startup.valuation,
    productProgress: startup.productProgress,
    investorScore: startup.investorScore ?? 50,
    marketScore: startup.marketScore ?? 50,
    riskScore: startup.riskScore ?? 50,
  };

  const outcome = classifyFinalOutcome(state, monthsSurvived, history);
  const baseScore = calculateLeaderboardScore(state, monthsSurvived, outcome.outcome);

  // Difficulty bonus from Phase 6 market intelligence
  const avgDifficulty =
    history.reduce((sum, m) => {
      const meta = m.metadata as Record<string, number> | null;
      return sum + (meta?.difficultyScore ?? 50);
    }, 0) / Math.max(history.length, 1);
  const difficultyBonus = Math.round((avgDifficulty - 50) * 0.5); // +/- up to ~22 points

  // Phase 16: Event crisis bonus
  const { calculateEventCrisisBonus } = await import("@/lib/events/event-effects");
  const eventResolvedList = history
    .map((m) => {
      const meta = m.metadata as Record<string, unknown> | null;
      const resolved = meta?.resolvedEvent as Record<string, unknown> | undefined;
      if (!resolved) return null;
      return {
        severity: String(resolved.severity ?? "minor"),
        choiceEffects: (resolved.effects ?? {}) as Record<string, number>,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  const crisisBonus = calculateEventCrisisBonus(eventResolvedList);

  const leaderboardScore = Math.max(0, baseScore + difficultyBonus + crisisBonus);

  // Generate or reuse public slug
  let publicSlug = startup.publicSlug;
  if (!publicSlug) {
    publicSlug = await generatePublicSlug(startupId, startup.name);
  }

  const deathReason = startup.status === "dead" ? inferDeathReason(history, finalMonth) : null;

  // Update startup with final fields
  await db.startup.update({
    where: { id: startupId },
    data: {
      publicSlug,
      finalOutcome: outcome.outcome,
      finalSummary: outcome.reason,
      finalScore: outcome.founderScore,
      completedAt: new Date(),
      deathReason: deathReason ?? undefined,
    },
  });

  // Extract market scenario from latest snapshot
  const latestSnapshotId = history[history.length - 1]?.marketSnapshotId;
  let marketScenario = "neutral";
  if (latestSnapshotId) {
    const snapshot = await db.marketSnapshot.findUnique({ where: { id: latestSnapshotId } });
    marketScenario = snapshot?.scenarioKey ?? "neutral";
  }

  // Founder profile
  const profile = await getOrCreateFounderProfile(startup.userId);
  await updateFounderStatsAfterFinalization(startup.userId, startup);

  // XP for completing/finishing
  const baseXp = startup.status === "completed" ? 100 : 50;
  const outcomeBonus =
    outcome.outcome === "BREAKOUT" ? 300 :
    outcome.outcome === "SERIES_A_READY" ? 200 :
    outcome.outcome === "ACQUISITION_TARGET" ? 150 :
    outcome.outcome === "SEED_READY" ? 100 :
    outcome.outcome === "SMALL_PROFITABLE" ? 80 :
    25;
  const xpGained = baseXp + outcomeBonus;
  await addXP(startup.userId, xpGained);

  // Achievements
  const achievementsUnlocked = await evaluateAchievementsOnFinalization(profile.id, startup);

  // Funding achievement if applicable
  if (startup.fundingRounds.length > 0) {
    const { evaluateAchievementsForFunding } = await import("./achievements");
    const fundingAchievements = await evaluateAchievementsForFunding(profile.id);
    achievementsUnlocked.push(...fundingAchievements);
  }

  // Phase 24B: Mission achievements at finalization
  try {
    const completedMissions = startup.missions.filter((m) => m.status === "completed");
    const failedMissions = startup.missions.filter((m) => m.status === "failed");
    let consecutiveCompleted = 0;
    for (let i = startup.missions.length - 1; i >= 0; i--) {
      if (startup.missions[i].status === "completed") consecutiveCompleted++;
      else if (startup.missions[i].status === "failed") break;
      else break;
    }
    const engineerCount = startup.employees.filter((e) => e.status === "active" && (e.role.includes("Engineer") || e.role === "CTO" || e.role === "AI Engineer")).length;
    const totalMissionSpend = completedMissions.reduce((sum, m) => sum + (m.estimatedCost ?? 0), 0);
    const missionAchievements = await evaluateMissionAchievements(profile.id, {
      completedMissions: completedMissions.length,
      failedMissions: failedMissions.length,
      consecutiveCompleted,
      engineerCount,
      completedEngineeringMission: completedMissions.some((m) => m.category === "engineering"),
      completedComplianceMission: completedMissions.some((m) => m.category === "compliance"),
      complianceScore: completedMissions.find((m) => m.category === "compliance")?.successScore ?? 0,
      totalMissionSpend,
      completedInferenceCostMission: completedMissions.some((m) => m.title.toLowerCase().includes("inference cost")),
      completedAuditMission: completedMissions.some((m) => m.category === "security" || m.title.toLowerCase().includes("audit")),
      completedCustomerDevMission: completedMissions.some((m) => m.title.toLowerCase().includes("customer") || m.title.toLowerCase().includes("customer development")),
      completedBetaLaunchMission: completedMissions.some((m) => m.title.toLowerCase().includes("beta") || m.title.toLowerCase().includes("launch")),
    });
    achievementsUnlocked.push(...missionAchievements);
  } catch {
    // Mission achievements are best-effort
  }

  // Phase 9C: Strategy archetype summary on finalization
  let finalDominantPlaystyle: string | null = null;
  let finalSecondaryPlaystyle: string | null = null;
  try {
    const { computeStrategyState } = await import("@/lib/strategy/strategy-engine");
    const { generateArchetypeSummary } = await import("@/lib/strategy/strategy-summary");
    const ss = await db.socialState.findUnique({ where: { startupId } });
    if (ss) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signals = (ss.strategySignals as unknown as any[]) ?? [];
      const strategyState = computeStrategyState(signals, {
        productProgress: startup.productProgress,
        revenue: startup.revenue,
        brandRisk: ss.brandRisk,
        socialTrust: ss.trust,
        socialHype: ss.hype,
        investorScore: startup.investorScore ?? 50,
        monthlyBurn: state.monthlyBurn,
        currentMonth: monthsSurvived,
        rivalryMaxScore: 0,
      });
      const archSummary = generateArchetypeSummary(signals, strategyState, {
        productProgress: startup.productProgress,
        revenue: startup.revenue,
        outcome: outcome.outcome,
      });
      finalDominantPlaystyle = archSummary.dominantPlaystyle ?? null;
      finalSecondaryPlaystyle = archSummary.secondaryPlaystyle ?? null;
      await db.startup.update({
        where: { id: startupId },
        data: {
          aiAnalysis: {
            ...(startup.aiAnalysis as Record<string, unknown> ?? {}),
            strategyArchetype: archSummary,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    }
  } catch {
    // strategy summary is best-effort
  }

  // Phase 10: Founder Career Record update
  let careerUpdate: FinalizationResult["careerUpdate"] | undefined;
  try {
    const { updateFounderCareer } = await import("@/lib/game/career-record");
    const ss = await db.socialState.findUnique({ where: { startupId } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rivals = ss ? (ss.rivalProfiles as unknown as any[]) ?? [] : [];
    const rivalsFaced = rivals.length;
    const rivalsDefeated = rivals.filter((r: { isDefeated?: boolean }) => r.isDefeated === true).length;
    const mostDangerousRivalName: string | null =
      rivals.length > 0
        ? rivals.reduce(
            (top: { rivalryScore: number; name: string } | null, r: { rivalryScore: number; name: string }) =>
              !top || r.rivalryScore > top.rivalryScore ? r : top,
            null
          )?.name ?? null
        : null;

    const careerResult = await updateFounderCareer(startup.userId, {
      startupId,
      startupName: startup.name,
      sector: startup.sector,
      outcome: outcome.outcome,
      score: outcome.founderScore,
      valuation: startup.valuation,
      revenue: startup.revenue,
      monthsSurvived,
      isDead: startup.status === "dead",
      isCompleted: startup.status === "completed",
      dominantPlaystyle: finalDominantPlaystyle,
      secondaryPlaystyle: finalSecondaryPlaystyle,
      rivalsFaced,
      rivalsDefeated,
      rivalLosses: 0,
      mostDangerousRivalName,
      rivalSummary: rivals.length > 0 ? `Faced ${rivalsFaced} rival${rivalsFaced > 1 ? "s" : ""}, defeated ${rivalsDefeated}` : null,
      completedAt: new Date(),
    });
    careerUpdate = {
      newBadges: careerResult.newBadges.map((b) => b.title),
      rankAdvanced: careerResult.rankAdvanced,
      titleChanged: careerResult.titleChanged,
      newTitle: careerResult.founderTitle,
      newRank: careerResult.founderRank,
      reputationScore: careerResult.reputationScore,
      reputationDelta: careerResult.reputationScore - careerResult.previousReputationScore,
    };
  } catch {
    // career update is best-effort
  }

  // ─── Enriched leaderboard metadata (Phase 13) ────────────────────────────
  // Boardroom summary
  let boardroomEventsResolved = 0;
  let boardroomSummary: string | null = null;
  let socialTrust = 50;
  try {
    const { parseBoardroomState } = await import("@/lib/boardroom/boardroom-engine");
    const ssForBoardroom = await db.socialState.findUnique({ where: { startupId } });
    if (ssForBoardroom) {
      socialTrust = ssForBoardroom.trust;
      const bState = parseBoardroomState(ssForBoardroom.boardroomState as unknown);
      boardroomEventsResolved = bState.eventHistory.filter((e) => e.resolved).length;
      boardroomSummary = boardroomEventsResolved > 0
        ? `Resolved ${boardroomEventsResolved} boardroom event${boardroomEventsResolved > 1 ? "s" : ""}. Board confidence: ${bState.boardConfidence}.`
        : null;
    }
  } catch {
    // boardroom data is best-effort
  }

  // Rivals summary
  let rivalsSummary: string | null = null;
  let rivalsDefeatedCount = 0;
  try {
    const ssForRivals = await db.socialState.findUnique({ where: { startupId } });
    if (ssForRivals) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rivals = (ssForRivals.rivalProfiles as unknown as any[]) ?? [];
      const rivalsTotal = rivals.length;
      rivalsDefeatedCount = rivals.filter((r: { isDefeated?: boolean }) => r.isDefeated === true).length;
      rivalsSummary = rivalsTotal > 0
        ? `Faced ${rivalsTotal} rival${rivalsTotal > 1 ? "s" : ""}. Defeated ${rivalsDefeatedCount}.`
        : null;
    }
  } catch {
    // rivals data is best-effort
  }

  // Documentary tagline
  let documentaryTagline: string | null = null;
  try {
    const aiData = startup.aiAnalysis as Record<string, unknown> | null;
    const doc = aiData?.documentary as Record<string, unknown> | undefined;
    documentaryTagline = (doc?.tagline as string) ?? null;
  } catch {
    // best-effort
  }

  const leaderboardMetadata = {
    marketDifficulty: Math.round(avgDifficulty),
    marketScenario,
    difficultyBonus,
    crisisBonus,
    eventsResolved: eventResolvedList.length,
    dominantPlaystyle: finalDominantPlaystyle,
    secondaryPlaystyle: finalSecondaryPlaystyle,
    founderTitle: careerUpdate?.newTitle ?? null,
    founderRank: careerUpdate?.newRank ?? null,
    documentaryTagline,
    rivalsSummary,
    boardroomSummary,
    boardroomEventsResolved,
    socialTrust,
    rivalsDefeated: rivalsDefeatedCount,
  };

  // Overall leaderboard entry (idempotent upsert)
  await createOrUpdateLeaderboardEntry(
    startupId, startup.userId, leaderboardScore,
    startup.valuation, startup.revenue, monthsSurvived, outcome.outcome,
    "overall", "beta-season-1", leaderboardMetadata as Record<string, unknown>
  );

  // Sector-specific
  await createOrUpdateLeaderboardEntry(
    startupId, startup.userId, leaderboardScore,
    startup.valuation, startup.revenue, monthsSurvived, outcome.outcome,
    startup.sector.toLowerCase().replace(/[^a-z0-9]+/g, "-"), "beta-season-1",
    leaderboardMetadata as Record<string, unknown>
  );

  // Revenue category (score = revenue)
  await createOrUpdateLeaderboardEntry(
    startupId, startup.userId, startup.revenue,
    startup.valuation, startup.revenue, monthsSurvived, outcome.outcome,
    "revenue", "beta-season-1", leaderboardMetadata as Record<string, unknown>
  );

  // Valuation category (score = valuation)
  await createOrUpdateLeaderboardEntry(
    startupId, startup.userId, startup.valuation,
    startup.valuation, startup.revenue, monthsSurvived, outcome.outcome,
    "valuation", "beta-season-1", leaderboardMetadata as Record<string, unknown>
  );

  // Survival category (score = survivalMonths * 1000)
  await createOrUpdateLeaderboardEntry(
    startupId, startup.userId, monthsSurvived * 1000,
    startup.valuation, startup.revenue, monthsSurvived, outcome.outcome,
    "survival", "beta-season-1", leaderboardMetadata as Record<string, unknown>
  );

  // Playstyle category
  if (finalDominantPlaystyle) {
    const playstyleSlug = finalDominantPlaystyle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await createOrUpdateLeaderboardEntry(
      startupId, startup.userId, leaderboardScore,
      startup.valuation, startup.revenue, monthsSurvived, outcome.outcome,
      playstyleSlug, "beta-season-1", leaderboardMetadata as Record<string, unknown>
    );
  }

  // Phase 14: Founder coaching on final outcome
  try {
    const coaching = await ai.generateFounderCoaching({
      context: "final_outcome",
      startupName: startup.name,
      sector: startup.sector,
      outcomeSummary: `${outcome.outcome}: ${outcome.reason}`,
    });
    await db.startup.update({
      where: { id: startupId },
      data: {
        aiAnalysis: {
          ...(startup.aiAnalysis as Record<string, unknown> ?? {}),
          finalCoaching: coaching,
        } as unknown as Prisma.InputJsonValue,
      },
    });
  } catch {
    // Coaching is non-critical
  }

  return {
    outcome: outcome.outcome,
    reason: outcome.reason,
    founderScore: outcome.founderScore,
    leaderboardScore,
    publicSlug,
    achievementsUnlocked,
    xpGained,
    careerUpdate,
  };
}

function inferDeathReason(history: SimulationMonth[], finalMonth: SimulationMonth): string {
  if (finalMonth.cashEnd <= 0) return "Ran out of cash";
  if (finalMonth.runwayMonths <= 0) return "Runway exhausted";
  if ((finalMonth.riskScoreAfter ?? 0) >= 95) return "Catastrophic risk exposure";
  if ((finalMonth.investorScoreAfter ?? 0) <= 10) return "Investors lost confidence";
  if (history.length >= 9 && (finalMonth.productProgress ?? 0) < 20) return "Product failed to gain traction";
  return "Market forces proved too strong";
}
