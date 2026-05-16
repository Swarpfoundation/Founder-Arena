"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-helpers";
import { getCurrentSimulationMonth } from "@/lib/simulation/engine";
import {
  ActionTakenRecord,
  ArenaFeedItem,
  DEFAULT_SOCIAL_METRICS,
  PerformSocialActionResult,
  SocialContext,
  SocialMetrics,
  SocialPost,
  SocialStateData,
  SocialActionAvailability,
} from "@/lib/social/types";
import { SOCIAL_ACTION_CATALOG, getSocialActionById } from "@/lib/social/social-actions";
import {
  applyActionToMetrics,
  checkActionAvailability,
} from "@/lib/social/metrics-engine";
import {
  generateActionFeedItems,
} from "@/lib/social/feed-generator";
import { generatePostContent } from "@/lib/social/post-content";
import type { StrategySignal } from "@/lib/strategy/types";
import { signalsFromSocialAction, appendSignals } from "@/lib/strategy/signal-detector";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dbMetricsToSocialMetrics(row: {
  followers: number; hype: number; trust: number; sentiment: number;
  brandRisk: number; viralMomentum: number; founderReputation: number;
  communityStrength: number;
}): SocialMetrics {
  return {
    followers: row.followers,
    hype: row.hype,
    trust: row.trust,
    sentiment: row.sentiment,
    brandRisk: row.brandRisk,
    viralMomentum: row.viralMomentum,
    founderReputation: row.founderReputation,
    communityStrength: row.communityStrength,
  };
}

// ─── getSocialState ───────────────────────────────────────────────────────────

export async function getSocialState(startupId: string): Promise<{
  state: SocialStateData;
  currentMonth: number;
  availableActions: SocialActionAvailability[];
  startupName: string;
  startupStatus: string;
  productProgress: number;
  revenue: number;
  investorScore: number;
  riskScore: number;
  sector: string;
}> {
  const user = await requireCurrentUser();

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: {
      simulationMonths: { orderBy: { monthNumber: "asc" } },
      socialState: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Startup not found");
  }

  const currentMonth = getCurrentSimulationMonth(startup.simulationMonths);

  // Hydrate or default social state
  const ss = startup.socialState;
  const metrics: SocialMetrics = ss
    ? dbMetricsToSocialMetrics(ss)
    : { ...DEFAULT_SOCIAL_METRICS };

  const feedItems = ss ? (ss.feedItems as unknown as ArenaFeedItem[]) : [];
  const actionsTaken = ss ? (ss.actionsTaken as unknown as ActionTakenRecord[]) : [];
  const lastActionMonth = ss?.lastActionMonth ?? 0;

  const state: SocialStateData = { metrics, feedItems, actionsTaken, lastActionMonth };

  const ctx: SocialContext = {
    startupId,
    startupName: startup.name,
    sector: startup.sector,
    month: currentMonth + 1,
    productProgress: startup.productProgress,
    revenue: startup.revenue,
    investorScore: startup.investorScore ?? 50,
    riskScore: startup.riskScore ?? 50,
    status: startup.status,
    founderName: startup.user.name ?? "Founder",
  };

  const availableActions: SocialActionAvailability[] = SOCIAL_ACTION_CATALOG.map((action) => {
    const check = checkActionAvailability(action, metrics, ctx, lastActionMonth);
    return { action, ...check };
  });

  return {
    state,
    currentMonth,
    availableActions,
    startupName: startup.name,
    startupStatus: startup.status,
    productProgress: startup.productProgress,
    revenue: startup.revenue,
    investorScore: startup.investorScore ?? 50,
    riskScore: startup.riskScore ?? 50,
    sector: startup.sector,
  };
}

// ─── performSocialAction ──────────────────────────────────────────────────────

export async function performSocialAction(
  startupId: string,
  actionId: string
): Promise<PerformSocialActionResult> {
  const user = await requireCurrentUser();

  const action = getSocialActionById(actionId);
  if (!action) throw new Error("Unknown social action");

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: {
      simulationMonths: { orderBy: { monthNumber: "asc" } },
      socialState: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Startup not found");
  }

  // Must be in operating phase
  if (!["funded", "active"].includes(startup.status)) {
    throw new Error("Social actions are only available for active startups.");
  }

  const currentMonth = getCurrentSimulationMonth(startup.simulationMonths);
  const nextMonth = currentMonth + 1;

  // Hydrate existing state
  const ss = startup.socialState;
  const metrics: SocialMetrics = ss
    ? dbMetricsToSocialMetrics(ss)
    : { ...DEFAULT_SOCIAL_METRICS };
  const feedItems: ArenaFeedItem[] = ss ? (ss.feedItems as unknown as ArenaFeedItem[]) : [];
  const actionsTaken: ActionTakenRecord[] = ss
    ? (ss.actionsTaken as unknown as ActionTakenRecord[])
    : [];
  const lastActionMonth = ss?.lastActionMonth ?? 0;

  const ctx: SocialContext = {
    startupId,
    startupName: startup.name,
    sector: startup.sector,
    month: nextMonth,
    productProgress: startup.productProgress,
    revenue: startup.revenue,
    investorScore: startup.investorScore ?? 50,
    riskScore: startup.riskScore ?? 50,
    status: startup.status,
    founderName: startup.user.name ?? "Founder",
  };

  // Validate availability server-side (no trusting client)
  const avail = checkActionAvailability(action, metrics, ctx, lastActionMonth);
  if (!avail.available) {
    throw new Error(avail.reason ?? "Action not available");
  }

  // Deduct cash cost
  if (action.cost > 0) {
    if (startup.cash < action.cost) {
      throw new Error(
        `Insufficient cash. Need $${action.cost.toLocaleString()}, have $${startup.cash.toLocaleString()}.`
      );
    }
  }

  // Apply action to metrics
  const { updatedMetrics, appliedEffects, didBackfire } = applyActionToMetrics(
    metrics,
    action,
    ctx
  );

  // Generate post content
  const { content, tone } = generatePostContent(actionId, ctx);
  const primaryChannel = Array.isArray(action.channel) ? action.channel[0] : action.channel;
  const post: SocialPost = {
    id: `post-${startupId}-m${nextMonth}-${actionId}`,
    month: nextMonth,
    actionId,
    channel: primaryChannel,
    actorType: "founder",
    actorName: startup.user.name ?? "Founder",
    content,
    tone,
    engagement: Math.min(100, 20 + (updatedMetrics.hype + updatedMetrics.viralMomentum) / 3),
    sentiment: updatedMetrics.sentiment * 2 - 100, // convert 0-100 → -100..100
    tags: action.tags,
  };

  // Generate feed items
  const newFeedItems = generateActionFeedItems(
    action,
    post,
    updatedMetrics,
    ctx,
    didBackfire,
    appliedEffects
  );

  // Build updated records
  const record: ActionTakenRecord = {
    month: nextMonth,
    actionId,
    postId: post.id,
    effects: appliedEffects,
    didBackfire,
  };
  const updatedActionsTaken = [...actionsTaken, record];
  const updatedFeedItems = [...feedItems, ...newFeedItems].slice(-100); // cap history

  // Append strategy signal for this social action
  const existingStrategySignals: StrategySignal[] = ss
    ? (ss.strategySignals as unknown as StrategySignal[])
    : [];
  const newSocialSignals = signalsFromSocialAction(actionId, nextMonth);
  const updatedStrategySignals = appendSignals(existingStrategySignals, newSocialSignals);

  // Persist atomically
  await db.$transaction(async (tx) => {
    // Deduct cash cost
    if (action.cost > 0) {
      await tx.startup.update({
        where: { id: startupId },
        data: { cash: { decrement: action.cost } },
      });
    }

    // Upsert SocialState
    await tx.socialState.upsert({
      where: { startupId },
      create: {
        startupId,
        followers: updatedMetrics.followers,
        hype: updatedMetrics.hype,
        trust: updatedMetrics.trust,
        sentiment: updatedMetrics.sentiment,
        brandRisk: updatedMetrics.brandRisk,
        viralMomentum: updatedMetrics.viralMomentum,
        founderReputation: updatedMetrics.founderReputation,
        communityStrength: updatedMetrics.communityStrength,
        feedItems: updatedFeedItems as object[],
        actionsTaken: updatedActionsTaken as object[],
        lastActionMonth: nextMonth,
        strategySignals: updatedStrategySignals as unknown as object[],
      },
      update: {
        followers: updatedMetrics.followers,
        hype: updatedMetrics.hype,
        trust: updatedMetrics.trust,
        sentiment: updatedMetrics.sentiment,
        brandRisk: updatedMetrics.brandRisk,
        viralMomentum: updatedMetrics.viralMomentum,
        founderReputation: updatedMetrics.founderReputation,
        communityStrength: updatedMetrics.communityStrength,
        feedItems: updatedFeedItems as object[],
        actionsTaken: updatedActionsTaken as object[],
        lastActionMonth: nextMonth,
        strategySignals: updatedStrategySignals as unknown as object[],
      },
    });
  });

  revalidatePath(`/startup/${startupId}/social`);
  revalidatePath(`/startup/${startupId}/strategy`);
  revalidatePath(`/startup/${startupId}`);

  return { post, newFeedItems, updatedMetrics, appliedEffects, didBackfire };
}
