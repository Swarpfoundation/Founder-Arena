"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-helpers";
import {
  parseBoardroomState,
  resolveBoardroomEvent,
  checkResponseRequirements,
} from "@/lib/boardroom/boardroom-engine";
import {
  buildBoardroomResolutionFeedItem,
} from "@/lib/boardroom/boardroom-feed";
import type { BoardroomState } from "@/lib/boardroom/types";
import type { ArenaFeedItem } from "@/lib/social/types";
import type { StrategySignal } from "@/lib/strategy/types";
import { appendSignals } from "@/lib/strategy/signal-detector";

export interface BoardroomPageData {
  startupId: string;
  startupName: string;
  startupStatus: string;
  currentMonth: number;
  boardroomState: BoardroomState;
  investorScore: number;
  riskScore: number;
  cash: number;
  monthlyBurn: number;
  revenue: number;
  productProgress: number;
  brandRisk: number;
}

export async function getBoardroomState(startupId: string): Promise<BoardroomPageData> {
  const user = await requireCurrentUser();

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: {
      simulationMonths: { orderBy: { monthNumber: "desc" }, take: 1 },
      socialState: true,
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Startup not found");
  }

  const currentMonth = startup.simulationMonths[0]?.monthNumber ?? 0;

  const rawBoardroomState = startup.socialState?.boardroomState ?? {};
  const boardroomState = parseBoardroomState(rawBoardroomState);

  return {
    startupId,
    startupName: startup.name,
    startupStatus: startup.status,
    currentMonth,
    boardroomState,
    investorScore: startup.investorScore ?? 50,
    riskScore: startup.riskScore ?? 50,
    cash: startup.cash,
    monthlyBurn: startup.monthlyBurn,
    revenue: startup.revenue,
    productProgress: startup.productProgress,
    brandRisk: startup.socialState?.brandRisk ?? 0,
  };
}

export async function respondToBoardroomEvent(
  startupId: string,
  eventId: string,
  responseId: string
): Promise<{ success: boolean; outcomeNarrative: string }> {
  const user = await requireCurrentUser();

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: {
      simulationMonths: { orderBy: { monthNumber: "desc" }, take: 1 },
      socialState: true,
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  if (!["funded", "active"].includes(startup.status)) {
    throw new Error("Startup must be operating to respond to boardroom events");
  }

  const ss = startup.socialState;
  if (!ss) {
    throw new Error("No social state found for this startup");
  }

  const boardroomState = parseBoardroomState(ss.boardroomState as unknown);

  const event = boardroomState.currentOpenEvent;
  if (!event || event.id !== eventId) {
    throw new Error("Event not found or already resolved");
  }

  if (event.resolved) {
    throw new Error("Event already resolved");
  }

  // Find the response option
  const option = event.responseOptions.find((o) => o.id === responseId);
  if (!option) {
    throw new Error("Unknown response option");
  }

  // Check requirements
  const reqCheck = checkResponseRequirements(option, {
    cash: startup.cash,
    revenue: startup.revenue,
    productProgress: startup.productProgress,
    investorScore: startup.investorScore ?? 50,
    boardConfidence: boardroomState.boardConfidence,
    monthlyBurn: startup.monthlyBurn,
  });
  if (!reqCheck.available) {
    throw new Error(`Cannot select this option: ${reqCheck.reason}`);
  }

  const currentMonth = startup.simulationMonths[0]?.monthNumber ?? event.month;

  // Resolve the event
  const resolution = resolveBoardroomEvent(boardroomState, event, responseId, currentMonth);

  // Build feed item
  const feedItem = buildBoardroomResolutionFeedItem(
    event,
    option.title,
    resolution.outcomeNarrative,
    resolution.appliedEffects,
    currentMonth
  );

  // Update startup metrics from effects
  const effects = resolution.appliedEffects;
  const startupUpdates: Record<string, number> = {};
  if (effects.investorScoreDelta) {
    startupUpdates.investorScore = Math.min(100, Math.max(0, (startup.investorScore ?? 50) + effects.investorScoreDelta));
  }
  if (effects.riskScoreDelta) {
    startupUpdates.riskScore = Math.min(100, Math.max(0, (startup.riskScore ?? 50) + effects.riskScoreDelta));
  }

  // Update social state metrics from effects
  const socialUpdates: Record<string, number> = {};
  if (effects.socialTrustDelta) {
    socialUpdates.trust = Math.min(100, Math.max(0, ss.trust + effects.socialTrustDelta));
  }
  if (effects.socialHypeDelta) {
    socialUpdates.hype = Math.min(100, Math.max(0, ss.hype + effects.socialHypeDelta));
  }
  if (effects.brandRiskDelta) {
    socialUpdates.brandRisk = Math.min(100, Math.max(0, ss.brandRisk + effects.brandRiskDelta));
  }

  // Feed items
  const existingFeedItems: ArenaFeedItem[] = (ss.feedItems as unknown as ArenaFeedItem[]) ?? [];
  const newFeedItem: ArenaFeedItem = {
    id: feedItem.id,
    month: feedItem.month,
    category: feedItem.category as ArenaFeedItem["category"],
    title: feedItem.title,
    body: feedItem.body,
    severity: feedItem.severity as ArenaFeedItem["severity"],
    source: "investor" as ArenaFeedItem["source"],
  };
  const updatedFeedItems = [...existingFeedItems, newFeedItem].slice(-100);

  // Strategy signal if option specifies one
  let updatedStrategySignals = (ss.strategySignals as unknown as StrategySignal[]) ?? [];
  if (effects.strategySignal) {
    const newSignal: StrategySignal = {
      id: `boardroom:${responseId}:m${currentMonth}:${effects.strategySignal}`,
      source: "monthly_decision",
      sourceId: `boardroom:${responseId}:m${currentMonth}:${effects.strategySignal}`,
      month: currentMonth,
      playstyle: effects.strategySignal as StrategySignal["playstyle"],
      weight: 10,
      reason: `Boardroom response: ${option.title}`,
      tags: ["boardroom"],
    };
    updatedStrategySignals = appendSignals(updatedStrategySignals, [newSignal]);
  }

  // Run DB updates atomically
  await db.$transaction([
    db.socialState.update({
      where: { startupId },
      data: {
        ...socialUpdates,
        feedItems: updatedFeedItems as object[],
        boardroomState: resolution.updatedState as unknown as object,
        strategySignals: updatedStrategySignals as unknown as object[],
      },
    }),
    ...(Object.keys(startupUpdates).length > 0
      ? [db.startup.update({ where: { id: startupId }, data: startupUpdates })]
      : []),
  ]);

  revalidatePath(`/startup/${startupId}/boardroom`);
  revalidatePath(`/startup/${startupId}`);
  revalidatePath(`/startup/${startupId}/social`);
  revalidatePath(`/startup/${startupId}/operate`);

  return { success: true, outcomeNarrative: resolution.outcomeNarrative };
}
