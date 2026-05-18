"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-helpers";
import {
  appendInfrastructureFeedItems,
  buildInfrastructureEventResolutionFeedItem,
  buildInfrastructurePreviewInputForStartup,
  calculateRuntimeInfrastructureBurn,
  getOpenInfrastructureEvent,
  mergeInfrastructureStateIntoAiAnalysis,
  parseInfrastructureState,
  resolveInfrastructureEvent,
  selectInfrastructureStackInState,
  signalFromInfrastructureEventResolution,
  syncCloudCreditBalancesFromOffers,
} from "@/lib/infrastructure";
import { DEFAULT_SOCIAL_METRICS } from "@/lib/social/types";
import type { ArenaFeedItem } from "@/lib/social/types";
import type { StrategySignal } from "@/lib/strategy/types";
import { appendSignals } from "@/lib/strategy/signal-detector";

function currentSprintForStartup(simulationMonths: { monthNumber: number }[], status: string): number {
  if (status === "completed" || status === "dead") {
    return Math.max(1, Math.min(12, simulationMonths.length || 12));
  }
  return Math.max(1, Math.min(12, simulationMonths.length + 1));
}

export async function selectInfrastructureStackAction(formData: FormData) {
  const user = await requireCurrentUser();
  const startupId = String(formData.get("startupId") ?? "");
  const stackId = String(formData.get("stackId") ?? "");

  if (!startupId || !stackId) {
    throw new Error("Missing infrastructure stack selection.");
  }

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: {
      simulationMonths: { orderBy: { monthNumber: "asc" } },
      growthOffers: {
        where: { offerType: "cloud_credits", status: "accepted" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Startup not found");
  }
  if (startup.status === "completed" || startup.status === "dead") {
    throw new Error("Infrastructure stack selection is locked after Demo Day.");
  }

  const currentSprint = currentSprintForStartup(startup.simulationMonths, startup.status);
  const previewInput = buildInfrastructurePreviewInputForStartup({
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
    currentSprint,
  });

  const baseState = syncCloudCreditBalancesFromOffers(
    parseInfrastructureState(startup.aiAnalysis),
    previewInput.cloudCreditOffers ?? [],
    currentSprint,
    startup.id
  );
  const selected = selectInfrastructureStackInState({
    state: baseState,
    stackId,
    previewInput,
    currentSprint,
  });

  // Recompute once server-side so selection cannot submit client-cost values.
  calculateRuntimeInfrastructureBurn(previewInput, {
    selectedStackId: selected.state.selectedStackId,
    creditBalances: selected.state.creditBalances,
  });

  await db.startup.update({
    where: { id: startup.id },
    data: {
      aiAnalysis: mergeInfrastructureStateIntoAiAnalysis(startup.aiAnalysis, selected.state) as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/startup/${startup.id}`);
  revalidatePath(`/startup/${startup.id}/operate`);
  revalidatePath(`/startup/${startup.id}/infrastructure`);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function resolveInfrastructureEventAction(formData: FormData) {
  const user = await requireCurrentUser();
  const startupId = String(formData.get("startupId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const responseId = String(formData.get("responseId") ?? "");

  if (!startupId || !eventId || !responseId) {
    throw new Error("Missing infrastructure event response.");
  }

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    select: {
      id: true,
      userId: true,
      status: true,
      cash: true,
      productProgress: true,
      investorScore: true,
      riskScore: true,
      aiAnalysis: true,
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Startup not found");
  }
  if (startup.status === "completed" || startup.status === "dead") {
    throw new Error("Infrastructure events are locked after Demo Day.");
  }

  const state = parseInfrastructureState(startup.aiAnalysis);
  const openEvent = getOpenInfrastructureEvent(state);
  if (!openEvent || openEvent.id !== eventId) {
    const resolvedEvent = state.infraEventHistory.find((event) => event.id === eventId && event.resolved);
    if (resolvedEvent?.selectedResponseId === responseId) {
      revalidatePath(`/startup/${startup.id}/infrastructure`);
      return;
    }
    throw new Error("Infrastructure event is no longer open.");
  }

  const resolution = resolveInfrastructureEvent({ state, eventId, responseId });
  if (!resolution.event.resolved || !resolution.event.selectedResponseId) {
    revalidatePath(`/startup/${startup.id}/infrastructure`);
    return;
  }

  const effect = resolution.effect;
  const socialState = await db.socialState.findUnique({ where: { startupId: startup.id } });
  const existingFeedItems = socialState ? (socialState.feedItems as unknown as ArenaFeedItem[]) : [];
  const existingStrategySignals = socialState ? (socialState.strategySignals as unknown as StrategySignal[]) : [];
  const resolutionFeedItem = buildInfrastructureEventResolutionFeedItem(resolution.event);
  const updatedFeedItems = appendInfrastructureFeedItems(existingFeedItems, [resolutionFeedItem]);
  const strategySignal = signalFromInfrastructureEventResolution(resolution.event);
  const updatedStrategySignals = appendSignals(existingStrategySignals, strategySignal ? [strategySignal] : []);

  await db.$transaction([
    db.startup.update({
      where: { id: startup.id },
      data: {
        cash: Math.max(0, startup.cash + (effect.cashDelta ?? 0)),
        productProgress: clampScore(startup.productProgress + (effect.productDelta ?? 0)),
        investorScore: clampScore((startup.investorScore ?? 50) + (effect.investorDelta ?? 0)),
        riskScore: clampScore((startup.riskScore ?? 50) + (effect.riskDelta ?? 0)),
        aiAnalysis: mergeInfrastructureStateIntoAiAnalysis(startup.aiAnalysis, resolution.state) as unknown as Prisma.InputJsonValue,
      },
    }),
    db.socialState.upsert({
      where: { startupId: startup.id },
      create: {
        startupId: startup.id,
        ...DEFAULT_SOCIAL_METRICS,
        feedItems: updatedFeedItems as unknown as Prisma.InputJsonValue,
        actionsTaken: [],
        lastActionMonth: 0,
        rivalProfiles: [],
        rivalMoveHistory: [],
        strategySignals: updatedStrategySignals as unknown as Prisma.InputJsonValue,
        boardroomState: {},
      },
      update: {
        feedItems: updatedFeedItems as unknown as Prisma.InputJsonValue,
        strategySignals: updatedStrategySignals as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  revalidatePath(`/startup/${startup.id}`);
  revalidatePath(`/startup/${startup.id}/operate`);
  revalidatePath(`/startup/${startup.id}/infrastructure`);
  revalidatePath(`/startup/${startup.id}/social`);
  revalidatePath(`/startup/${startup.id}/strategy`);
}
