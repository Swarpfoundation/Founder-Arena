import { describe, it, expect } from "vitest";
import {
  generateStrategicOffers,
  generateGrowthRoundOffer,
} from "@/lib/growth/strategic-offers";
import { STRATEGIC_ACTORS } from "@/lib/growth/actor-library";
import { GrowthStateContext, StrategicOffer } from "@/lib/growth/types";

/**
 * Security: a forged StrategicOffer must NOT match any of the
 * deterministically regenerated offers for the same startup state.
 *
 * The hot-fixed `resolveGrowthOfferAction` resolves only by `offerId`
 * after regenerating the offer set server-side. We mirror that lookup
 * here without going through the action layer.
 */

function makeCtx(): GrowthStateContext {
  return {
    startupId: "startup-XYZ",
    cash: 1_000_000,
    monthlyBurn: 60_000,
    revenue: 80_000,
    valuation: 6_000_000,
    productProgress: 80,
    investorScore: 70,
    marketScore: 60,
    riskScore: 30,
    sector: "AI / ML",
    stage: "seed",
    status: "funded",
    monthsSurvived: 9,
    simulationHistory: [],
    teamSize: 6,
    fundingRounds: [{ roundType: "seed", amountRaised: 800_000, equitySold: 15 }],
    missionCompletionRate: 0.7,
    completedMissions: 7,
    totalMissions: 10,
    activeMissionProgress: 60,
  };
}

function regenerateOffers(ctx: GrowthStateContext): StrategicOffer[] {
  const strategic = generateStrategicOffers(ctx, STRATEGIC_ACTORS, { condition: "neutral" });
  const round: StrategicOffer[] = [];
  for (const k of ["seed_extension", "series_a", "series_b"]) {
    const r = generateGrowthRoundOffer(ctx, k, { condition: "neutral" });
    if (r) round.push(r);
  }
  return [...strategic, ...round];
}

describe("growth offer regeneration is deterministic and forge-safe", () => {
  it("regenerates the same offer set on repeated calls", () => {
    const a = regenerateOffers(makeCtx()).map((o) => o.offerId);
    const b = regenerateOffers(makeCtx()).map((o) => o.offerId);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it("a forged $999M acquisition offerId is NOT in the regenerated set", () => {
    const set = new Set(regenerateOffers(makeCtx()).map((o) => o.offerId));
    const forged: StrategicOffer = {
      offerId: "offer-frontier_ai_lab-999999",
      actorId: "frontier_ai_lab",
      actorName: "OmniAI Labs",
      actorType: "frontier_ai_lab",
      offerType: "acquisition",
      headline: "Total payday",
      amount: null,
      equityPercent: null,
      acquisitionPrice: 999_000_000,
      valuation: 999_000_000,
      terms: [],
      benefits: [],
      risks: [],
      conditions: [],
      expiresInMonths: 99,
      recommendedAction: "accept",
      fitScore: 100,
    };
    expect(set.has(forged.offerId)).toBe(false);
  });

  it("a tampered amount on an otherwise-legit offerId does not change server economics", () => {
    const real = regenerateOffers(makeCtx()).find((o) => o.amount !== null);
    expect(real).toBeDefined();
    if (!real) return;

    // Client tries to inflate amount
    const tampered: StrategicOffer = { ...real, amount: 999_999_999 };
    // Server should look up by offerId only:
    const lookedUp = regenerateOffers(makeCtx()).find((o) => o.offerId === tampered.offerId);
    expect(lookedUp).toBeDefined();
    expect(lookedUp!.amount).toBe(real.amount);
    // The tampered amount must NOT survive the regeneration.
    expect(lookedUp!.amount).not.toBe(999_999_999);
  });

  it("offerId is stable for a given (startupId, actorId) regardless of run", () => {
    const a = regenerateOffers(makeCtx());
    const b = regenerateOffers(makeCtx());
    for (const offer of a) {
      const match = b.find((o) => o.offerId === offer.offerId);
      expect(match).toBeDefined();
      expect(match!.actorId).toBe(offer.actorId);
      expect(match!.headline).toBe(offer.headline);
    }
  });
});
