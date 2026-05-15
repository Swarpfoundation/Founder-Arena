"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-helpers";
import type {
  RivalStartup,
  RivalMove,
  RivalStateData,
  CounterActionAvailability,
  PerformCounterActionResult,
  RivalCounterEffects,
} from "@/lib/rivals/types";
import { RIVAL_COUNTER_ACTIONS, getCounterActionById } from "@/lib/rivals/rival-counteractions";
import { checkCounterActionAvailability } from "@/lib/rivals/rival-engine";
import { generateCounterActionFeedItem } from "@/lib/rivals/rival-feed";
import { generateRivalComparison } from "@/lib/rivals/rival-comparison";
import type { ArenaFeedItem } from "@/lib/social/types";

// ─── Load rival state for a startup ──────────────────────────────────────────

export async function getRivalState(startupId: string): Promise<{
  rivals: RivalStartup[];
  moveHistory: RivalMove[];
  availableCounterActions: CounterActionAvailability[];
  comparison: Awaited<ReturnType<typeof generateRivalComparison>> | null;
  startupName: string;
  startupStatus: string;
  currentMonth: number;
  sector: string;
}> {
  const user = await requireCurrentUser();

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: {
      socialState: true,
      simulationMonths: { orderBy: { monthNumber: "asc" } },
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Startup not found");
  }

  const ss = startup.socialState;
  const rivals: RivalStartup[] = ss
    ? (ss.rivalProfiles as unknown as RivalStartup[])
    : [];
  const moveHistory: RivalMove[] = ss
    ? (ss.rivalMoveHistory as unknown as RivalMove[])
    : [];

  const currentMonth = startup.simulationMonths.length > 0
    ? Math.max(...startup.simulationMonths.map((m) => m.monthNumber))
    : 0;

  // Build counter-action availability
  const playerTrust = ss?.trust ?? 50;
  const playerRevenue = startup.revenue;
  const playerProductProgress = startup.productProgress;
  const playerCash = startup.cash;

  const availableCounterActions: CounterActionAvailability[] = RIVAL_COUNTER_ACTIONS.map(
    (action) => {
      const check = checkCounterActionAvailability(
        action,
        rivals,
        playerRevenue,
        playerProductProgress,
        playerTrust,
        playerCash
      );
      return { action, ...check };
    }
  );

  // Build final comparison if run is over
  let comparison = null;
  if ((startup.status === "completed" || startup.status === "dead") && rivals.length > 0) {
    comparison = generateRivalComparison(
      rivals,
      startup.valuation,
      startup.revenue,
      startup.finalOutcome ?? startup.status
    );
  }

  return {
    rivals,
    moveHistory,
    availableCounterActions,
    comparison,
    startupName: startup.name,
    startupStatus: startup.status,
    currentMonth,
    sector: startup.sector,
  };
}

// ─── Perform a counter-action against a rival ─────────────────────────────────

export async function performCounterAction(
  startupId: string,
  counterActionId: string
): Promise<PerformCounterActionResult> {
  const user = await requireCurrentUser();

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: {
      socialState: true,
      simulationMonths: { orderBy: { monthNumber: "asc" } },
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Startup not found");
  }

  if (!["funded", "active", "completed"].includes(startup.status)) {
    return {
      success: false,
      message: "Counter-actions require an active startup.",
      updatedRivals: [],
      appliedEffects: {},
    };
  }

  const action = getCounterActionById(counterActionId);
  if (!action) {
    return {
      success: false,
      message: "Unknown counter-action.",
      updatedRivals: [],
      appliedEffects: {},
    };
  }

  const ss = startup.socialState;
  const rivals: RivalStartup[] = ss
    ? (ss.rivalProfiles as unknown as RivalStartup[])
    : [];

  const playerTrust = ss?.trust ?? 50;

  const check = checkCounterActionAvailability(
    action,
    rivals,
    startup.revenue,
    startup.productProgress,
    playerTrust,
    startup.cash
  );

  if (!check.available) {
    return {
      success: false,
      message: check.reason ?? "Action not available.",
      updatedRivals: rivals,
      appliedEffects: {},
    };
  }

  // Apply effects to rivals
  const targetRivalId = check.targetedRivalId;
  const updatedRivals: RivalStartup[] = rivals.map((r) => {
    if (targetRivalId && r.id !== targetRivalId) return r;
    const { rivalryScoreReduction = 0, rivalHypeReduction = 0, rivalTractionReduction = 0 } =
      action.effects;
    return {
      ...r,
      rivalryScore: Math.max(0, r.rivalryScore - rivalryScoreReduction),
      hype: Math.max(0, r.hype - rivalHypeReduction),
      traction: Math.max(0, r.traction - rivalTractionReduction),
    };
  });

  // Update target rival's isDefeated if rivalryScore reaches 0 and traction is very low
  const finalRivals = updatedRivals.map((r) => {
    if (r.rivalryScore === 0 && r.traction < 10 && !r.isDefeated) {
      return { ...r, isDefeated: true, relationshipToPlayer: "defeated" as const };
    }
    return r;
  });

  const targetRival = finalRivals.find((r) => r.id === targetRivalId) ?? finalRivals[0];

  // Determine outcome tone based on action risk
  const outcome: "positive" | "neutral" | "warning" =
    action.riskLevel === "high" && (ss?.trust ?? 50) < 45 ? "warning" : "positive";

  const feedItem = generateCounterActionFeedItem(
    startup.simulationMonths.length + 1,
    action.id,
    targetRival?.name ?? "the rival",
    outcome
  );

  // Build social metric updates
  const {
    socialHypeDelta = 0,
    socialTrustDelta = 0,
    brandRiskDelta = 0,
    socialSentimentDelta = 0,
    productProgressDelta = 0,
  } = action.effects;

  const newHype = Math.min(100, Math.max(0, (ss?.hype ?? 20) + socialHypeDelta));
  const newTrust = Math.min(100, Math.max(0, (ss?.trust ?? 50) + socialTrustDelta));
  const newBrandRisk = Math.min(100, Math.max(0, (ss?.brandRisk ?? 0) + brandRiskDelta));
  const newSentiment = Math.min(100, Math.max(0, (ss?.sentiment ?? 50) + socialSentimentDelta));

  // Build current feed items
  const existingFeedItems: ArenaFeedItem[] = ss
    ? (ss.feedItems as unknown as ArenaFeedItem[])
    : [];
  const updatedFeedItems = [...existingFeedItems, feedItem].slice(-100);

  await db.$transaction([
    db.startup.update({
      where: { id: startupId },
      data: {
        cash: startup.cash - action.cost,
        productProgress: Math.min(100, startup.productProgress + productProgressDelta),
      },
    }),
    db.socialState.upsert({
      where: { startupId },
      create: {
        startupId,
        hype: newHype,
        trust: newTrust,
        brandRisk: newBrandRisk,
        sentiment: newSentiment,
        feedItems: updatedFeedItems as object[],
        rivalProfiles: finalRivals as unknown as object[],
      },
      update: {
        hype: newHype,
        trust: newTrust,
        brandRisk: newBrandRisk,
        sentiment: newSentiment,
        feedItems: updatedFeedItems as object[],
        rivalProfiles: finalRivals as unknown as object[],
      },
    }),
  ]);

  revalidatePath(`/startup/${startupId}/rivals`);
  revalidatePath(`/startup/${startupId}/social`);

  const appliedEffects: RivalCounterEffects = { ...action.effects };

  return {
    success: true,
    message: `${action.title} executed successfully.`,
    updatedRivals: finalRivals,
    newFeedItem: feedItem,
    appliedEffects,
  };
}
