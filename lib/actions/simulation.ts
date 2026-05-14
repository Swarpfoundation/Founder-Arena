"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ai } from "@/lib/ai";
import { requireCurrentUser } from "@/lib/auth-helpers";
import {
  getCurrentSimulationMonth,
  simulateMonth,
  checkDeathCondition,
} from "@/lib/simulation/engine";
import { finalizeStartup } from "@/lib/game/finalize-startup";
import { getAvailableDecisions, validateDecisionSelection, getDecisionById } from "@/lib/simulation/decisions";
import { getMarketSnapshotForMonth } from "@/lib/market/snapshot";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkSimulationEntitlement } from "@/lib/billing/entitlements";
import { recordUsage } from "@/lib/billing/usage";
import { calculateMissionProgress, getActiveMission } from "@/lib/missions/mission-progress";
import { applyMissionEffects, boundMissionEffect } from "@/lib/missions/mission-effects";
import { generateNextMoves } from "@/lib/missions/next-moves";
import { generateOperationsAdvisor, OperationsAdvisorResult } from "@/lib/ai/operations-advisor";
import { classifyStartupDeterministic } from "@/lib/missions/startup-classifier";
import { generateMissionRoadmap, persistRoadmapToDb } from "@/lib/missions/mission-generator";
import { evaluateMissionAchievements } from "@/lib/game/achievements";
import { getOrCreateFounderProfile } from "@/lib/game/founder-progression";
import { selectMonthlyEvent, getAvailableChoices } from "@/lib/events/event-selection";
import { validateEventChoice, resolveEventChoice, resolvedEventToJson } from "@/lib/events/event-engine";
import { EventStateContext } from "@/lib/events/types";
import { deriveStartupMarketExposure } from "@/lib/market/exposure";
import { calculateTotalBurn } from "@/lib/economy/cost-engine";
import { generateMissionCoach, MissionCoachResult } from "@/lib/ai/mission-coach";

export async function getSimulationState(startupId: string) {
  const user = await requireCurrentUser();

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: { simulationMonths: { orderBy: { monthNumber: "asc" } }, fundingRounds: true, employees: true, missions: { orderBy: { sequence: "asc" } } },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Startup not found");
  }

  const currentMonth = getCurrentSimulationMonth(startup.simulationMonths);
  const isComplete = currentMonth >= 12;
  const isDead = startup.status === "dead";

  // Get market snapshot for next month
  const snapshotDate = new Date(2024, currentMonth, 1);
  const marketSnapshot = await getMarketSnapshotForMonth(snapshotDate);

  // Get available decisions
  const availableDecisions = getAvailableDecisions(
    startup.cash,
    startup.productProgress,
    startup.sector,
    currentMonth + 1
  );

  // Phase 16: Select deterministic monthly event
  const activeEmployeeCount = startup.employees.filter((e) => e.status === "active").length;
  const allTriggeredEvents = startup.simulationMonths.flatMap((m) => m.eventsTriggered ?? []);
  const eventCtx: EventStateContext = {
    startupId: startup.id,
    monthNumber: currentMonth + 1,
    cash: startup.cash,
    monthlyBurn: startup.monthlyBurn,
    revenue: startup.revenue,
    productProgress: startup.productProgress,
    investorScore: startup.investorScore ?? 50,
    marketScore: startup.marketScore ?? 50,
    riskScore: startup.riskScore ?? 50,
    employeeCount: activeEmployeeCount,
    sector: startup.sector,
    eventsTriggered: allTriggeredEvents,
  };
  const monthlyEvent = selectMonthlyEvent(eventCtx);
  const eventChoices = monthlyEvent ? getAvailableChoices(monthlyEvent, eventCtx) : [];

  // Phase 24B: Backfill missions for existing startups without roadmaps
  if (startup.missions.length === 0 && (startup.status === "funded" || startup.status === "active" || startup.status === "completed" || startup.status === "dead")) {
    const classification = ((startup.aiAnalysis as Record<string, unknown>)?.classification as Record<string, unknown> | undefined)
      ? classifyStartupDeterministic(startup.sector, startup.description ?? "", startup.problem ?? "", startup.solution ?? "", startup.monetizationModel ?? "")
      : classifyStartupDeterministic(startup.sector, startup.description ?? "", startup.problem ?? "", startup.solution ?? "", startup.monetizationModel ?? "");
    const roadmap = generateMissionRoadmap(startup.id, classification, startup.sector, startup.stage);
    try {
      await db.$transaction(persistRoadmapToDb(startup.id, roadmap));
      // Reload missions
      startup.missions = await db.mission.findMany({
        where: { startupId },
        orderBy: { sequence: "asc" },
      });
    } catch {
      // Backfill is best-effort; continue without missions
    }
  }

  // Phase 24: Mission state
  const activeMission = getActiveMission(startup.missions.map((m) => ({
    ...m,
    requiredRoles: (m.requiredRoles as unknown as import("@/lib/missions/types").RequiredRole[]) ?? [],
    optionalRoles: (m.optionalRoles as unknown as import("@/lib/missions/types").RequiredRole[]) ?? [],
    requiredCapabilities: (m.requiredCapabilities as unknown as string[]) ?? [],
    metadata: (m.metadata as Record<string, unknown> | null) ?? {},
  })));
  const pendingMissions = startup.missions.filter((m) => m.status === "pending");

  const nextMoves = generateNextMoves({
    startupId: startup.id,
    startupName: startup.name,
    sector: startup.sector,
    stage: startup.stage,
    cash: startup.cash,
    monthlyBurn: startup.monthlyBurn,
    revenue: startup.revenue,
    runwayMonths: Math.floor(startup.cash / Math.max(startup.monthlyBurn, 1)),
    productProgress: startup.productProgress,
    investorScore: startup.investorScore ?? 50,
    marketScore: startup.marketScore ?? 50,
    riskScore: startup.riskScore ?? 50,
    employees: startup.employees.filter((e) => e.status === "active").map((e) => ({ role: e.role, seniority: e.seniority, skill: e.skill })),
    activeMission: activeMission ?? null,
    pendingMissions: pendingMissions.map((m) => ({
      ...m,
      requiredRoles: (m.requiredRoles as unknown as import("@/lib/missions/types").RequiredRole[]) ?? [],
      optionalRoles: (m.optionalRoles as unknown as import("@/lib/missions/types").RequiredRole[]) ?? [],
      requiredCapabilities: (m.requiredCapabilities as unknown as string[]) ?? [],
      metadata: (m.metadata as Record<string, unknown> | null) ?? {},
    })),
    monthlyDecisions: [],
    marketCondition: marketSnapshot?.condition ?? "neutral",
    classification: ((startup.aiAnalysis as Record<string, unknown>)?.classification as Record<string, unknown>)?.primaryStartupType as string ?? "saas_b2b",
  });

  // Phase 25: Compute true recurring burn for display and advisor
  const activeEmployeeList = startup.employees.filter((e) => e.status === "active");
  const trueBurnEstimate = calculateTotalBurn(
    activeEmployeeList.map((e) => ({ role: e.role, seniority: e.seniority as import("@/lib/economy/types").SeniorityLevel, region: startup.region })),
    startup.workSetup,
    startup.sector,
    startup.stage,
    startup.revenue,
    activeMission?.monthlyCostDelta ?? 0
  );
  const trueMonthlyBurn = trueBurnEstimate.totalMonthlyBurn;

  // Phase 24B: AI Operations Advisor
  const roleGaps = activeMission
    ? ((activeMission.requiredRoles as import("@/lib/missions/types").RequiredRole[]) ?? [])
        .filter((r) => activeEmployeeList.filter((e) => e.role === r.role).length < r.count)
        .map((r) => r.role)
    : [];

  const recentDecisions = startup.simulationMonths.slice(-3).flatMap((m) => (m.decisions as string[]) ?? []);
  const eventHistory = startup.simulationMonths.slice(-6).map((m) => m.eventTitle).filter(Boolean) as string[];

  let advisor: OperationsAdvisorResult | null = null;
  try {
    advisor = await generateOperationsAdvisor({
      startupName: startup.name,
      sector: startup.sector,
      stage: startup.stage,
      classification: ((startup.aiAnalysis as Record<string, unknown>)?.classification as Record<string, unknown>)?.primaryStartupType as string ?? "saas_b2b",
      month: currentMonth,
      cash: startup.cash,
      monthlyBurn: trueMonthlyBurn,
      revenue: startup.revenue,
      runwayMonths: Math.floor(startup.cash / Math.max(trueMonthlyBurn, 1)),
      productProgress: startup.productProgress,
      investorScore: startup.investorScore ?? 50,
      marketScore: startup.marketScore ?? 50,
      riskScore: startup.riskScore ?? 50,
      activeMissionTitle: activeMission?.title,
      activeMissionCategory: activeMission?.category as string | undefined,
      missionProgress: activeMission?.progress ?? 0,
      roleGaps,
      teamSize: activeEmployeeList.length,
      recentDecisions,
      marketCondition: marketSnapshot?.condition ?? "neutral",
      eventHistory,
    });
  } catch {
    advisor = null;
  }

  // Phase 25: Mission-specific AI coaching
  let missionCoach: MissionCoachResult | null = null;
  if (activeMission) {
    try {
      const filledRoles = activeEmployeeList.map((e) => e.role);
      missionCoach = await generateMissionCoach({
        missionTitle: activeMission.title,
        missionCategory: activeMission.category as string,
        missionProgress: activeMission.progress ?? 0,
        requiredRoles: ((activeMission.requiredRoles as unknown as import("@/lib/missions/types").RequiredRole[]) ?? []).map((r) => r.role),
        filledRoles,
        roleGaps,
        recentDecisions,
        teamSize: activeEmployeeList.length,
        cash: startup.cash,
        runwayMonths: Math.floor(startup.cash / Math.max(trueMonthlyBurn, 1)),
        sector: startup.sector,
        stage: startup.stage,
      });
    } catch {
      missionCoach = null;
    }
  }

  return {
    startup,
    currentMonth,
    isComplete,
    isDead,
    marketSnapshot,
    availableDecisions,
    monthlyEvent,
    eventChoices,
    missions: startup.missions,
    activeMission,
    pendingMissions,
    nextMoves,
    advisor,
    missionCoach,
    trueMonthlyBurn,
    costBreakdown: trueBurnEstimate,
  };
}

export async function runMonthlySimulationAction(startupId: string, decisionIds: string[], eventChoiceId?: string) {
  const user = await requireCurrentUser();

  const rateLimitError = await checkRateLimit(user.id, "monthlySimulation");
  if (rateLimitError) {
    throw new Error(rateLimitError);
  }

  const entitlement = await checkSimulationEntitlement(user.id);
  if (!entitlement.allowed) {
    throw new Error(entitlement.reason ?? "Simulation limit reached.");
  }

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: { simulationMonths: { orderBy: { monthNumber: "desc" }, take: 1 }, employees: true },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  if (startup.status !== "funded" && startup.status !== "active") {
    throw new Error("Startup is not in operating phase");
  }

  const currentMonth = getCurrentSimulationMonth(startup.simulationMonths);
  if (currentMonth >= 12) {
    throw new Error("Simulation already complete");
  }

  const nextMonthNumber = currentMonth + 1;

  // Validate decisions
  const validation = validateDecisionSelection(
    decisionIds,
    startup.cash,
    startup.productProgress,
    startup.sector,
    nextMonthNumber
  );
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Phase 16: Validate event choice if an event is active.
  // Load the full triggered-event history from all previous months (not just
  // the latest month — startup was fetched with take:1) so that once-per-run
  // and max-occurrence guards in selectMonthlyEvent work correctly.
  const activeEmployeeCount = startup.employees.filter((e) => e.status === "active").length;
  const allTriggeredEventsRaw = await db.simulationMonth.findMany({
    where: { startupId },
    select: { eventsTriggered: true },
    orderBy: { monthNumber: "asc" },
  });
  const allTriggeredEvents = allTriggeredEventsRaw.flatMap((m) => m.eventsTriggered ?? []);
  const eventCtx: EventStateContext = {
    startupId: startup.id,
    monthNumber: nextMonthNumber,
    cash: startup.cash,
    monthlyBurn: startup.monthlyBurn,
    revenue: startup.revenue,
    productProgress: startup.productProgress,
    investorScore: startup.investorScore ?? 50,
    marketScore: startup.marketScore ?? 50,
    riskScore: startup.riskScore ?? 50,
    employeeCount: activeEmployeeCount,
    sector: startup.sector,
    eventsTriggered: allTriggeredEvents,
    selectedDecisionIds: decisionIds,
  };

  const monthlyEvent = selectMonthlyEvent(eventCtx);
  let resolvedEvent = null;
  let eventEffect = undefined;

  if (monthlyEvent) {
    if (!eventChoiceId) {
      throw new Error(`Event "${monthlyEvent.title}" requires a response`);
    }
    const eventValidation = validateEventChoice(monthlyEvent.id, eventChoiceId, eventCtx);
    if (!eventValidation.valid) {
      throw new Error(eventValidation.error);
    }
    const choice = monthlyEvent.choices.find((c) => c.id === eventChoiceId)!;
    resolvedEvent = resolveEventChoice(monthlyEvent, choice);
    eventEffect = choice.effects;
  }

  // Get market snapshot
  const snapshotDate = new Date(2024, nextMonthNumber - 1, 1);
  const marketSnapshot = await getMarketSnapshotForMonth(snapshotDate);

  // Resolve decisions
  const decisions = decisionIds.map((id) => getDecisionById(id)).filter((d): d is NonNullable<typeof d> => d !== undefined);

  // Phase 24: Fetch missions for progress calculation
  const missions = await db.mission.findMany({
    where: { startupId },
    orderBy: { sequence: "asc" },
  });

  const activeMission = missions.find((m) => m.status === "active") ?? missions.find((m) => m.status === "pending");

  // Phase 25: state.monthlyBurn should be payroll + office only (maintained by team actions)
  // simulateMonth will add operating costs, mission costs, and decision/event deltas
  const state = {
    cash: startup.cash,
    monthlyBurn: startup.monthlyBurn,
    revenue: startup.revenue,
    valuation: startup.valuation,
    productProgress: startup.productProgress,
    investorScore: startup.investorScore ?? 50,
    marketScore: startup.marketScore ?? 50,
    riskScore: startup.riskScore ?? 50,
  };

  // Build startup profile for Phase 6 market intelligence
  const startupProfile = {
    sector: startup.sector,
    region: startup.region,
    monetizationModel: startup.monetizationModel,
    problem: startup.problem,
    solution: startup.solution,
  };

  // Run simulation
  const result = simulateMonth(
    state,
    decisions,
    marketSnapshot,
    startup.sector,
    startup.employees,
    startup.workSetup,
    startupProfile,
    nextMonthNumber,
    eventEffect,
    startup.stage,
    activeMission?.monthlyCostDelta ?? 0
  );

  // Phase 24: Calculate mission progress
  const missionUpdates: { id: string; status: string; progress: number; successScore: number | null; aiSummary: string | null }[] = [];
  let missionStateEffect: import("@/lib/missions/mission-effects").SimulationState | null = null;
  let missionMonthResult: Record<string, unknown> | null = null;

  if (activeMission) {
    const exposure = deriveStartupMarketExposure(startupProfile);
    const { calculateTeamProductivity, calculateTeamMorale, getOfficeSetup } = await import("@/lib/team/effects");
    const officeSetup = getOfficeSetup(startup.workSetup);
    const activeEmployees = startup.employees.filter((e) => e.status === "active");
    const teamProductivity = calculateTeamProductivity(activeEmployees, officeSetup);
    const teamMorale = calculateTeamMorale(activeEmployees, officeSetup);
    const runway = Math.floor(result.cashEnd / Math.max(result.burnRate, 1));

    const progressInput = {
      mission: {
        ...activeMission,
        requiredRoles: (activeMission.requiredRoles as unknown as import("@/lib/missions/types").RequiredRole[]) ?? [],
        optionalRoles: (activeMission.optionalRoles as unknown as import("@/lib/missions/types").RequiredRole[]) ?? [],
        requiredCapabilities: (activeMission.requiredCapabilities as unknown as string[]) ?? [],
        metadata: (activeMission.metadata as Record<string, unknown> | null) ?? {},
      },
      employees: activeEmployees.map((e) => ({ role: e.role, seniority: e.seniority, skill: e.skill, morale: e.morale, productivity: Number(e.productivity) })),
      monthlyDecisions: decisionIds,
      marketTailwind: exposure.tailwinds.length,
      marketHeadwind: exposure.headwinds.length,
      cash: result.cashEnd,
      runwayMonths: runway,
      riskScore: result.riskScoreAfter,
      teamProductivity,
      teamMorale,
    };

    const progressResult = calculateMissionProgress(progressInput);

    const newStatus = progressResult.status;
    let newSuccessScore: number | null = activeMission.successScore;
    let newAiSummary = activeMission.aiSummary;

    if (newStatus === "completed") {
      newSuccessScore = Math.round(progressResult.score);
      newAiSummary = progressResult.explanation;
      const meta = activeMission.metadata as Record<string, unknown> | null;
      const completeEffect = meta?.effectsOnComplete as import("@/lib/missions/types").MissionEffect | undefined;
      if (completeEffect) {
        const bounded = boundMissionEffect(completeEffect);
        missionStateEffect = applyMissionEffects(
          {
            cash: result.cashEnd,
            monthlyBurn: result.burnRate,
            revenue: result.revenue,
            valuation: result.valuation,
            productProgress: result.productProgressAfter,
            investorScore: result.investorScoreAfter,
            marketScore: result.marketScoreAfter,
            riskScore: result.riskScoreAfter,
          },
          bounded
        );
      }
    } else if (newStatus === "failed") {
      newAiSummary = progressResult.explanation;
      const meta = activeMission.metadata as Record<string, unknown> | null;
      const failEffect = meta?.effectsOnFail as import("@/lib/missions/types").MissionEffect | undefined;
      if (failEffect) {
        const bounded = boundMissionEffect(failEffect);
        missionStateEffect = applyMissionEffects(
          {
            cash: result.cashEnd,
            monthlyBurn: result.burnRate,
            revenue: result.revenue,
            valuation: result.valuation,
            productProgress: result.productProgressAfter,
            investorScore: result.investorScoreAfter,
            marketScore: result.marketScoreAfter,
            riskScore: result.riskScoreAfter,
          },
          bounded
        );
      }
    }

    missionMonthResult = {
      activeMissionId: activeMission.id,
      missionTitle: activeMission.title,
      progressBefore: activeMission.progress,
      progressAfter: progressResult.newProgress,
      missionScore: progressResult.score,
      missionOutcome: newStatus,
      roleCoverage: progressResult.roleCoverage.map((r) => ({ role: r.role, required: r.required, filled: r.filled, coverage: r.coverage })),
      recommendedGap: progressResult.roleCoverage.filter((r) => r.coverage < 1).map((r) => r.role),
      missionEffects: missionStateEffect,
    };

    missionUpdates.push({
      id: activeMission.id,
      status: newStatus,
      progress: progressResult.newProgress,
      successScore: newSuccessScore,
      aiSummary: newAiSummary,
    });

    // Activate next pending mission if this one completed or failed
    if (newStatus === "completed" || newStatus === "failed") {
      const nextPending = missions.find((m) => m.status === "pending" && m.id !== activeMission.id);
      if (nextPending) {
        missionUpdates.push({
          id: nextPending.id,
          status: "active",
          progress: 10,
          successScore: null,
          aiSummary: null,
        });
      }
    }
  }

  // Apply mission state effects to result if any
  if (missionStateEffect) {
    result.cashEnd = missionStateEffect.cash;
    result.burnRate = missionStateEffect.monthlyBurn;
    result.revenue = missionStateEffect.revenue;
    result.valuation = missionStateEffect.valuation;
    result.productProgressAfter = missionStateEffect.productProgress;
    result.investorScoreAfter = missionStateEffect.investorScore;
    result.marketScoreAfter = missionStateEffect.marketScore;
    result.riskScoreAfter = missionStateEffect.riskScore;
  }

  // Check death
  const deathCheck = checkDeathCondition(result, nextMonthNumber);

  // Phase 14: AI structured board update
  const boardUpdate = await ai.generateMonthlyBoardUpdate({
    startupName: startup.name,
    month: nextMonthNumber,
    decisions: decisions.map((d) => d!.label),
    cashBefore: result.cashStart,
    cashAfter: result.cashEnd,
    burnRate: result.burnRate,
    revenue: result.revenue,
    productProgress: result.productProgressAfter,
    marketCondition: result.marketCondition,
    eventTitle: resolvedEvent?.title ?? result.eventTitle,
    eventSummary: resolvedEvent?.narrative ?? result.eventSummary,
    sector: startup.sector,
  });

  // Phase 25: Store base recurring burn (payroll + office) back to DB, not the one-month total
  // Operating and mission costs are recalculated fresh each month
  const recurringBurn = result.costBreakdown?.baseBurn ?? state.monthlyBurn;

  // Save simulation month and update startup atomically
  const updateData: Prisma.StartupUpdateInput = {
    cash: result.cashEnd,
    monthlyBurn: recurringBurn,
    revenue: result.revenue,
    valuation: result.valuation,
    productProgress: result.productProgressAfter,
    investorScore: result.investorScoreAfter,
    marketScore: result.marketScoreAfter,
    riskScore: result.riskScoreAfter,
    status: deathCheck.dead ? "dead" : nextMonthNumber >= 12 ? "completed" : "funded",
  };

  const transactionOps: import("@prisma/client").Prisma.PrismaPromise<unknown>[] = [
    db.simulationMonth.create({
      data: {
        startupId,
        monthNumber: nextMonthNumber,
        cashStart: result.cashStart,
        cashEnd: result.cashEnd,
        burnRate: result.burnRate,
        revenue: result.revenue,
        runwayMonths: result.runwayMonths,
        productProgress: result.productProgressAfter,
        productProgressBefore: result.productProgressBefore,
        valuation: result.valuation,
        investorScoreBefore: result.investorScoreBefore,
        investorScoreAfter: result.investorScoreAfter,
        marketScoreBefore: result.marketScoreBefore,
        marketScoreAfter: result.marketScoreAfter,
        riskScoreBefore: result.riskScoreBefore,
        riskScoreAfter: result.riskScoreAfter,
        status: deathCheck.dead ? "dead" : nextMonthNumber >= 12 ? "completed" : "active",
        marketCondition: result.marketCondition,
        eventTitle: resolvedEvent?.title ?? result.eventTitle,
        eventSummary: resolvedEvent?.narrative ?? result.eventSummary,
        eventsTriggered: monthlyEvent ? [monthlyEvent.id] : [],
        decisions: decisionIds as unknown as Prisma.InputJsonValue,
        aiSummary: boardUpdate.conciseSummary,
        userGrowth: result.userGrowth,
        employeeCount: startup.employees.filter((e) => e.status === "active").length,
        marketingSpend: result.marketingSpend,
        productSpend: result.productSpend,
        hiringSpend: result.hiringSpend,
        decisionsLocked: true,
        marketSnapshotId: marketSnapshot?.id ?? null,
        metadata: {
          difficultyScore: result.difficultyScore,
          marketImpactExplanation: result.marketImpactExplanation,
          eventTitle: resolvedEvent?.title ?? result.eventTitle,
          eventSummary: resolvedEvent?.narrative ?? result.eventSummary,
          snapshotId: marketSnapshot?.id ?? null,
          scenarioKey: marketSnapshot?.scenarioKey ?? "seeded",
          signalSourceMode: marketSnapshot?.dataRun?.mode ?? "seeded",
          boardUpdate: boardUpdate as unknown as Prisma.InputJsonValue,
          resolvedEvent: resolvedEvent ? resolvedEventToJson(resolvedEvent) : undefined,
          missionResult: missionMonthResult,
          costBreakdown: result.costBreakdown,
        } as unknown as Prisma.InputJsonValue,
      },
    }),
    db.startup.update({
      where: { id: startupId },
      data: updateData,
    }),
  ];

  // Phase 24: Add mission updates to transaction
  for (const mu of missionUpdates) {
    transactionOps.push(
      db.mission.update({
        where: { id: mu.id },
        data: {
          status: mu.status,
          progress: mu.progress,
          successScore: mu.successScore,
          aiSummary: mu.aiSummary,
        },
      })
    );
  }

  await db.$transaction(transactionOps);

  // Phase 24B: Evaluate mission achievements after mission completion
  if (missionMonthResult && (missionMonthResult.missionOutcome === "completed" || missionMonthResult.missionOutcome === "failed")) {
    try {
      const profile = await getOrCreateFounderProfile(user.id);
      const updatedMissions = await db.mission.findMany({ where: { startupId } });
      const completedMissions = updatedMissions.filter((m) => m.status === "completed");
      const failedMissions = updatedMissions.filter((m) => m.status === "failed");
      // Calculate consecutive completed missions from the end
      let consecutiveCompleted = 0;
      for (let i = updatedMissions.length - 1; i >= 0; i--) {
        if (updatedMissions[i].status === "completed") consecutiveCompleted++;
        else if (updatedMissions[i].status === "failed") break;
        else break;
      }
      const engineerCount = startup.employees.filter((e) => e.status === "active" && (e.role.includes("Engineer") || e.role === "CTO" || e.role === "AI Engineer")).length;
      const totalMissionSpend = completedMissions.reduce((sum, m) => sum + (m.estimatedCost ?? 0), 0);
      await evaluateMissionAchievements(profile.id, {
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
    } catch {
      // Achievement evaluation is best-effort
    }
  }

  // Record usage for every simulation run, including final and death months.
  // Must happen before the early-return below so it is never skipped.
  await recordUsage(user.id, "monthlySimulation", 1);

  // If final, run centralized finalization
  if (deathCheck.dead || nextMonthNumber >= 12) {
    const finalResult = await finalizeStartup(startupId);

    revalidatePath(`/startup/${startupId}/operate`);
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");
    revalidatePath("/graveyard");
    revalidatePath(`/s/${finalResult?.publicSlug}`);

    if (finalResult) {
      return {
        outcome: finalResult.outcome,
        reason: finalResult.reason,
        founderScore: finalResult.founderScore,
        publicSlug: finalResult.publicSlug,
        achievementsUnlocked: finalResult.achievementsUnlocked,
        xpGained: finalResult.xpGained,
      };
    }
  }

  revalidatePath(`/startup/${startupId}/operate`);
  return { success: true };
}
