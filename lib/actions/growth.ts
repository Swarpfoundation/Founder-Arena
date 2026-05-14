"use server";

import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-helpers";
import {
  GrowthStateContext,
  StrategicOffer,
} from "@/lib/growth/types";
import {
  calculateGrowthEligibility,
} from "@/lib/growth/eligibility";
import {
  generateStrategicOffers,
  generateGrowthRoundOffer,
} from "@/lib/growth/strategic-offers";
import { STRATEGIC_ACTORS } from "@/lib/growth/actor-library";
import {
  resolveOffer,
  persistOfferResolution,
} from "@/lib/growth/offer-resolution";
import { getMarketSnapshotForMonth } from "@/lib/market/snapshot";
import { checkGrowthAccess } from "@/lib/billing/entitlements";

export async function getGrowthState(startupId: string) {
  const user = await requireCurrentUser();

  const growthEntitlement = await checkGrowthAccess(user.id);

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    include: {
      simulationMonths: { orderBy: { monthNumber: "asc" } },
      fundingRounds: true,
      employees: true,
      growthOffers: { orderBy: { createdAt: "desc" } },
      missions: { orderBy: { sequence: "asc" } },
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Startup not found");
  }

  const history = startup.simulationMonths;
  const monthsSurvived = history.length;
  const teamSize = startup.employees.filter((e) => e.status === "active").length;

  // Phase 24B: Mission context for growth readiness
  const totalMissions = startup.missions.length;
  const completedMissions = startup.missions.filter((m) => m.status === "completed").length;
  const missionCompletionRate = totalMissions > 0 ? completedMissions / totalMissions : 0;
  const activeMission = startup.missions.find((m) => m.status === "active");

  const ctx: GrowthStateContext = {
    startupId: startup.id,
    cash: startup.cash,
    monthlyBurn: startup.monthlyBurn,
    revenue: startup.revenue,
    valuation: startup.valuation,
    productProgress: startup.productProgress,
    investorScore: startup.investorScore ?? 50,
    marketScore: startup.marketScore ?? 50,
    riskScore: startup.riskScore ?? 50,
    sector: startup.sector,
    stage: startup.stage,
    status: startup.status,
    monthsSurvived,
    simulationHistory: history.map((m) => ({
      monthNumber: m.monthNumber,
      cashEnd: m.cashEnd,
      revenue: m.revenue,
      burnRate: m.burnRate,
      eventTitle: m.eventTitle ?? undefined,
      eventSeverity: (m.metadata as Record<string, unknown>)?.resolvedEvent
        ? String(((m.metadata as Record<string, unknown>).resolvedEvent as Record<string, unknown>)?.severity ?? "")
        : undefined,
    })),
    teamSize,
    fundingRounds: startup.fundingRounds.map((r) => ({
      roundType: r.roundType,
      amountRaised: r.amountRaised ?? 0,
      equitySold: Number(r.equitySold ?? 0),
    })),
    missionCompletionRate,
    completedMissions,
    totalMissions,
    activeMissionProgress: activeMission?.progress ?? 0,
  };

  const eligibility = calculateGrowthEligibility(ctx);

  // Get market snapshot for offer generation
  const snapshotDate = new Date(2024, monthsSurvived, 1);
  const marketSnapshot = await getMarketSnapshotForMonth(snapshotDate);

  // Generate offers if eligible
  let offers: StrategicOffer[] = [];
  const totalReadiness = Math.max(eligibility.seriesA.score, eligibility.seriesB.score, eligibility.acquisition.score);

  if (totalReadiness >= 35 && (startup.status === "completed" || startup.status === "funded" || startup.status === "active")) {
    const actors = STRATEGIC_ACTORS;
    offers = generateStrategicOffers(ctx, actors, marketSnapshot);
  }

  // Growth round offers
  const roundOffers: StrategicOffer[] = [];
  if (eligibility.seriesA.score >= 35) {
    const round = generateGrowthRoundOffer(ctx, "series_a", marketSnapshot);
    if (round) roundOffers.push(round);
  }
  if (eligibility.seriesB.score >= 35) {
    const round = generateGrowthRoundOffer(ctx, "series_b", marketSnapshot);
    if (round) roundOffers.push(round);
  }
  if (eligibility.seriesA.score < 35 && eligibility.seriesA.score >= 20) {
    const round = generateGrowthRoundOffer(ctx, "seed_extension", marketSnapshot);
    if (round) roundOffers.push(round);
  }

  return {
    startup,
    eligibility,
    offers,
    roundOffers,
    marketSnapshot,
    growthHistory: startup.growthOffers,
    canAccessGrowth:
      growthEntitlement.allowed &&
      (startup.status === "completed" ||
        startup.status === "funded" ||
        startup.status === "active" ||
        startup.status === "dead"),
    isDead: startup.status === "dead",
    isAcquired: startup.stage === "acquired",
  };
}

/**
 * Resolve a strategic growth offer.
 *
 * SECURITY: this action accepts only the deterministic `offerId` produced
 * by the server. The full offer economics (amount, equity, acquisitionPrice,
 * valuation, actor identity) are recomputed server-side by regenerating the
 * deterministic offer set for the current startup state. Any offer payload
 * supplied by the client is rejected.
 *
 * Backwards-compat: if a legacy client posts a full StrategicOffer object,
 * only the `offerId` field is read.
 */
export async function resolveGrowthOfferAction(
  startupId: string,
  offerOrOfferId: string | { offerId: string },
  action: "accept" | "reject" | "counter" | "defer"
) {
  const user = await requireCurrentUser();

  if (action !== "accept" && action !== "reject" && action !== "counter" && action !== "defer") {
    throw new Error("Invalid action");
  }

  const offerId =
    typeof offerOrOfferId === "string" ? offerOrOfferId : offerOrOfferId?.offerId;
  if (typeof offerId !== "string" || offerId.length < 4) {
    throw new Error("Invalid offer id.");
  }

  const startup = await db.startup.findUnique({
    where: { id: startupId },
    select: {
      id: true,
      userId: true,
      cash: true,
      valuation: true,
      revenue: true,
      status: true,
      stage: true,
    },
  });

  if (!startup || startup.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  if (startup.status === "dead") {
    throw new Error("Cannot negotiate growth offers for a dead startup");
  }

  if (startup.stage === "acquired") {
    throw new Error("Startup has already been acquired");
  }

  // Server-side regeneration: rebuild the deterministic offer set for the
  // current startup state and find the offer by its server-issued ID.
  const state = await getGrowthState(startupId);
  const allOffers: StrategicOffer[] = [...state.offers, ...state.roundOffers];
  const offer = allOffers.find((o) => o.offerId === offerId);
  if (!offer) {
    throw new Error("Offer is no longer available.");
  }

  // Idempotency: an offer with the same actorId + offerType + headline that
  // is already accepted or rejected cannot be re-resolved. Without a schema
  // change to add `offerHash` we use the most stable identity columns we
  // already persist via persistOfferResolution.
  const existing = await db.growthOffer.findFirst({
    where: {
      startupId,
      actorId: offer.actorId,
      offerType: offer.offerType,
      headline: offer.headline,
      status: { in: ["accepted", "rejected"] },
    },
    select: { id: true },
  });
  if (existing) {
    throw new Error("Offer has already been resolved.");
  }

  const result = resolveOffer({
    offer,
    action,
    startupId,
    currentCash: startup.cash,
    currentValuation: startup.valuation,
    currentRevenue: startup.revenue,
  });

  await persistOfferResolution(startupId, offer, result, action);

  // Evaluate growth achievements (best-effort).
  try {
    const { getOrCreateFounderProfile } = await import("@/lib/game/founder-progression");
    const { evaluateGrowthAchievements } = await import("@/lib/growth/achievements");
    const profile = await getOrCreateFounderProfile(user.id);
    const fullStartup = await db.startup.findUnique({
      where: { id: startupId },
      include: { growthOffers: true, fundingRounds: true },
    });
    if (fullStartup) {
      await evaluateGrowthAchievements(profile.id, fullStartup);
    }
  } catch {
    // achievements are best-effort
  }

  return result;
}
