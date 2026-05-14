import { describe, it, expect } from "vitest";
import {
  calculateSeriesAReadiness,
  calculateSeriesBReadiness,
  calculateAcquisitionReadiness,
  calculateStrategicFit,
  calculateGrowthEligibility,
} from "@/lib/growth/eligibility";
import { STRATEGIC_ACTORS, getActorById, getActorsForSector } from "@/lib/growth/actor-library";
import { generateStrategicOffers } from "@/lib/growth/strategic-offers";
import { resolveOffer } from "@/lib/growth/offer-resolution";
import { GrowthStateContext, StrategicOffer, StrategicActor } from "@/lib/growth/types";

function makeContext(overrides: Partial<GrowthStateContext> = {}): GrowthStateContext {
  return {
    startupId: "test-startup-1",
    cash: 500_000,
    monthlyBurn: 20_000,
    revenue: 50_000,
    valuation: 5_000_000,
    productProgress: 80,
    investorScore: 70,
    marketScore: 60,
    riskScore: 30,
    sector: "AI / ML",
    stage: "completed",
    status: "completed",
    monthsSurvived: 12,
    simulationHistory: [
      { monthNumber: 1, cashEnd: 600_000, revenue: 10_000, burnRate: 25_000 },
      { monthNumber: 2, cashEnd: 585_000, revenue: 15_000, burnRate: 24_000 },
      { monthNumber: 3, cashEnd: 576_000, revenue: 20_000, burnRate: 23_000 },
      { monthNumber: 4, cashEnd: 573_000, revenue: 25_000, burnRate: 22_000 },
      { monthNumber: 5, cashEnd: 576_000, revenue: 30_000, burnRate: 21_000 },
      { monthNumber: 6, cashEnd: 585_000, revenue: 35_000, burnRate: 20_000 },
      { monthNumber: 7, cashEnd: 600_000, revenue: 40_000, burnRate: 20_000 },
      { monthNumber: 8, cashEnd: 620_000, revenue: 42_000, burnRate: 19_000 },
      { monthNumber: 9, cashEnd: 643_000, revenue: 45_000, burnRate: 19_000 },
      { monthNumber: 10, cashEnd: 669_000, revenue: 48_000, burnRate: 18_000 },
      { monthNumber: 11, cashEnd: 699_000, revenue: 49_000, burnRate: 18_000 },
      { monthNumber: 12, cashEnd: 500_000, revenue: 50_000, burnRate: 20_000 },
    ],
    teamSize: 5,
    fundingRounds: [{ roundType: "pre_seed", amountRaised: 500_000, equitySold: 10 }],
    ...overrides,
  };
}

describe("Growth Eligibility", () => {
  it("calculateSeriesAReadiness returns strong for excellent context", () => {
    const ctx = makeContext();
    const result = calculateSeriesAReadiness(ctx);
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.status).toBe("strong");
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.blockers.length).toBe(0);
  });

  it("calculateSeriesAReadiness returns not_ready for weak context", () => {
    const ctx = makeContext({
      revenue: 1_000,
      valuation: 500_000,
      productProgress: 20,
      investorScore: 30,
      teamSize: 1,
      monthlyBurn: 50_000,
    });
    const result = calculateSeriesAReadiness(ctx);
    expect(result.score).toBeLessThan(35);
    expect(result.status).toBe("not_ready");
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it("calculateSeriesAReadiness returns borderline for middling context", () => {
    const ctx = makeContext({
      revenue: 15_000,
      valuation: 2_500_000,
      productProgress: 55,
      investorScore: 55,
      teamSize: 3,
    });
    const result = calculateSeriesAReadiness(ctx);
    expect(result.score).toBeGreaterThanOrEqual(35);
    expect(result.score).toBeLessThan(55);
    expect(result.status).toBe("borderline");
  });

  it("calculateSeriesBReadiness requires much stronger metrics", () => {
    const ctx = makeContext();
    const result = calculateSeriesBReadiness(ctx);
    // Default context is not strong enough for Series B
    expect(result.score).toBeLessThan(75);
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it("calculateSeriesBReadiness returns strong with excellent metrics", () => {
    const ctx = makeContext({
      revenue: 250_000,
      valuation: 25_000_000,
      productProgress: 98,
      investorScore: 85,
      teamSize: 12,
      monthlyBurn: 80_000,
    });
    const result = calculateSeriesBReadiness(ctx);
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.status).toBe("strong");
  });

  it("calculateAcquisitionReadiness evaluates product and team", () => {
    const ctx = makeContext();
    const result = calculateAcquisitionReadiness(ctx);
    expect(result.score).toBeGreaterThanOrEqual(35);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("calculateAcquisitionReadiness penalizes early stage", () => {
    const ctx = makeContext({
      productProgress: 20,
      valuation: 500_000,
      teamSize: 1,
      revenue: 0,
    });
    const result = calculateAcquisitionReadiness(ctx);
    expect(result.score).toBeLessThan(35);
    expect(result.status).toBe("not_ready");
  });

  it("calculateStrategicFit scores high for sector match", () => {
    const ctx = makeContext({ sector: "AI / ML" });
    const result = calculateStrategicFit(ctx, "frontier_ai_lab", ["AI / ML", "SaaS"]);
    expect(result.score).toBeGreaterThanOrEqual(55);
    expect(result.reasons.some((r) => r.includes("Sector"))).toBe(true);
  });

  it("calculateStrategicFit scores lower for sector mismatch", () => {
    const ctx = makeContext({
      sector: "Agriculture",
      revenue: 0,
      productProgress: 20,
      valuation: 500_000,
      investorScore: 30,
      riskScore: 80,
    });
    const result = calculateStrategicFit(ctx, "frontier_ai_lab", ["AI / ML", "SaaS"]);
    expect(result.score).toBeLessThan(35);
    expect(result.blockers.some((b) => b.includes("Sector"))).toBe(true);
  });

  it("calculateGrowthEligibility returns all four readiness results", () => {
    const ctx = makeContext();
    const result = calculateGrowthEligibility(ctx);
    expect(result.seriesA).toBeDefined();
    expect(result.seriesB).toBeDefined();
    expect(result.acquisition).toBeDefined();
    expect(Object.keys(result.strategicFit).length).toBe(STRATEGIC_ACTORS.length);
  });

  it("clamps scores between 0 and 100", () => {
    const ctx = makeContext({
      revenue: 1_000_000,
      valuation: 100_000_000,
      productProgress: 100,
      investorScore: 100,
      teamSize: 20,
    });
    const a = calculateSeriesAReadiness(ctx);
    const b = calculateSeriesBReadiness(ctx);
    expect(a.score).toBeLessThanOrEqual(100);
    expect(b.score).toBeLessThanOrEqual(100);
  });
});

describe("Strategic Actors", () => {
  it("has exactly 15 actors", () => {
    expect(STRATEGIC_ACTORS.length).toBe(15);
  });

  it("every actor has required fields", () => {
    for (const actor of STRATEGIC_ACTORS) {
      expect(actor.id).toBeTruthy();
      expect(actor.displayName).toBeTruthy();
      expect(actor.actorType).toBeTruthy();
      expect(actor.sectorsOfInterest.length).toBeGreaterThan(0);
      expect(actor.investmentRange.min).toBeGreaterThan(0);
      expect(actor.investmentRange.max).toBeGreaterThan(actor.investmentRange.min);
      expect(actor.acquisitionRange.min).toBeGreaterThan(0);
      expect(actor.acquisitionRange.max).toBeGreaterThan(actor.acquisitionRange.min);
      expect(actor.partnershipTypes.length).toBeGreaterThan(0);
      expect(actor.strategicMotivation).toBeTruthy();
      expect(actor.riskNotes).toBeTruthy();
      expect(actor.dealStyle).toMatch(/^(aggressive|standard|cautious)$/);
      expect(actor.disclaimer).toContain("Fictional");
    }
  });

  it("all actor IDs are unique", () => {
    const ids = STRATEGIC_ACTORS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getActorById returns correct actor", () => {
    const actor = getActorById("frontier_ai_lab");
    expect(actor).toBeDefined();
    expect(actor?.displayName).toBe("OmniAI Labs");
  });

  it("getActorById returns undefined for unknown id", () => {
    expect(getActorById("nonexistent")).toBeUndefined();
  });

  it("getActorsForSector filters by sector", () => {
    const aiActors = getActorsForSector("AI / ML");
    expect(aiActors.length).toBeGreaterThan(0);
    expect(aiActors.some((a) => a.id === "frontier_ai_lab")).toBe(true);
  });

  it("no real company names are used", () => {
    const forbidden = ["OpenAI", "Google", "Microsoft", "Amazon", "Apple", "Meta", "NVIDIA", "Tesla"];
    const allText = STRATEGIC_ACTORS.map((a) => JSON.stringify(a)).join(" ");
    for (const name of forbidden) {
      expect(allText).not.toContain(name);
    }
  });
});

describe("Strategic Offer Generation", () => {
  it("generateStrategicOffers returns deterministic results for same inputs", () => {
    const ctx = makeContext();
    const actors = STRATEGIC_ACTORS.slice(0, 5);
    const offers1 = generateStrategicOffers(ctx, actors, null);
    const offers2 = generateStrategicOffers(ctx, actors, null);
    expect(offers1.length).toBe(offers2.length);
    for (let i = 0; i < offers1.length; i++) {
      expect(offers1[i].actorId).toBe(offers2[i].actorId);
      expect(offers1[i].offerType).toBe(offers2[i].offerType);
      expect(offers1[i].amount).toBe(offers2[i].amount);
    }
  });

  it("generateStrategicOffers returns at most 5 offers", () => {
    const ctx = makeContext();
    const offers = generateStrategicOffers(ctx, STRATEGIC_ACTORS, null);
    expect(offers.length).toBeLessThanOrEqual(5);
  });

  it("generateStrategicOffers filters out poor fits", () => {
    const ctx = makeContext({
      sector: "Agriculture",
      revenue: 0,
      productProgress: 10,
      valuation: 200_000,
      investorScore: 20,
      riskScore: 90,
    });
    const offers = generateStrategicOffers(ctx, STRATEGIC_ACTORS, null);
    // Very weak startup should get few or no offers
    expect(offers.length).toBeLessThanOrEqual(2);
  });

  it("offers have valid offer types", () => {
    const ctx = makeContext();
    const offers = generateStrategicOffers(ctx, STRATEGIC_ACTORS, null);
    const validTypes = [
      "strategic_investment",
      "acquisition",
      "partnership",
      "distribution_deal",
      "cloud_credits",
      "api_partnership",
      "platform_integration",
      "acquihire",
    ];
    for (const offer of offers) {
      expect(validTypes).toContain(offer.offerType);
    }
  });

  it("investment amounts are within reasonable bounds", () => {
    const ctx = makeContext();
    const offers = generateStrategicOffers(ctx, STRATEGIC_ACTORS, null);
    for (const offer of offers) {
      if (offer.amount !== null) {
        expect(offer.amount).toBeGreaterThan(0);
        expect(offer.amount).toBeLessThanOrEqual(100_000_000);
      }
    }
  });

  it("equity percentages are between 0 and 50", () => {
    const ctx = makeContext();
    const offers = generateStrategicOffers(ctx, STRATEGIC_ACTORS, null);
    for (const offer of offers) {
      if (offer.equityPercent !== null) {
        expect(offer.equityPercent).toBeGreaterThanOrEqual(0);
        expect(offer.equityPercent).toBeLessThanOrEqual(50);
      }
    }
  });

  it("offers are sorted by fit score descending", () => {
    const ctx = makeContext();
    const offers = generateStrategicOffers(ctx, STRATEGIC_ACTORS, null);
    for (let i = 1; i < offers.length; i++) {
      expect(offers[i - 1].fitScore).toBeGreaterThanOrEqual(offers[i].fitScore);
    }
  });
});

describe("Offer Resolution", () => {
  function makeOffer(overrides: Partial<StrategicOffer> = {}): StrategicOffer {
    return {
      offerId: "offer-1",
      actorId: "frontier_ai_lab",
      actorName: "OmniAI Labs",
      actorType: "frontier_ai_lab",
      offerType: "strategic_investment",
      headline: "Series A Investment",
      amount: 5_000_000,
      equityPercent: 15,
      acquisitionPrice: null,
      valuation: 10_000_000,
      terms: ["Board seat", "Pro-rata rights"],
      benefits: ["Access to compute", "Talent pipeline"],
      risks: ["Product shutdown risk"],
      conditions: ["Revenue milestones"],
      expiresInMonths: 3,
      recommendedAction: "counter",
      fitScore: 70,
      ...overrides,
    };
  }

  it("accepting investment increases cash and creates funding round", () => {
    const offer = makeOffer();
    const result = resolveOffer({
      offer,
      action: "accept",
      startupId: "s1",
      currentCash: 500_000,
      currentValuation: 5_000_000,
      currentRevenue: 50_000,
    });
    expect(result.success).toBe(true);
    expect(result.cashDelta).toBe(5_000_000);
    expect(result.equityDelta).toBe(15);
    expect(result.newStatus).toBe("funded");
    expect(result.fundingRound).toBeDefined();
    expect(result.fundingRound?.investorType).toBe("strategic");
  });

  it("accepting acquisition marks status acquired", () => {
    const offer = makeOffer({ offerType: "acquisition", acquisitionPrice: 20_000_000, amount: null, equityPercent: null });
    const result = resolveOffer({
      offer,
      action: "accept",
      startupId: "s1",
      currentCash: 500_000,
      currentValuation: 5_000_000,
      currentRevenue: 50_000,
    });
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe("acquired");
    expect(result.newStage).toBe("acquired");
    expect(result.acquisitionOutcome).toBeDefined();
    expect(result.acquisitionOutcome?.acquisitionPrice).toBe(20_000_000);
  });

  it("accepting partnership boosts valuation without cash", () => {
    const offer = makeOffer({ offerType: "partnership", amount: null, equityPercent: null });
    const result = resolveOffer({
      offer,
      action: "accept",
      startupId: "s1",
      currentCash: 500_000,
      currentValuation: 5_000_000,
      currentRevenue: 50_000,
    });
    expect(result.success).toBe(true);
    expect(result.cashDelta).toBe(0);
    expect(result.valuationDelta).toBeGreaterThan(0);
    expect(result.newStatus).toBe("funded");
  });

  it("rejecting offer has small negative valuation signal", () => {
    const offer = makeOffer();
    const result = resolveOffer({
      offer,
      action: "reject",
      startupId: "s1",
      currentCash: 500_000,
      currentValuation: 5_000_000,
      currentRevenue: 50_000,
    });
    expect(result.success).toBe(true);
    expect(result.cashDelta).toBe(0);
    expect(result.valuationDelta).toBeLessThan(0);
    expect(result.newStatus).toBe("completed");
  });

  it("counter with high fit score gets accepted", () => {
    const offer = makeOffer({ fitScore: 70 });
    const result = resolveOffer({
      offer,
      action: "counter",
      startupId: "s1",
      currentCash: 500_000,
      currentValuation: 5_000_000,
      currentRevenue: 50_000,
    });
    expect(result.success).toBe(true);
    expect(result.cashDelta).toBeGreaterThan(0);
  });

  it("counter with low fit score gets rejected", () => {
    const offer = makeOffer({ fitScore: 30 });
    const result = resolveOffer({
      offer,
      action: "counter",
      startupId: "s1",
      currentCash: 500_000,
      currentValuation: 5_000_000,
      currentRevenue: 50_000,
    });
    expect(result.success).toBe(true);
    // When counter is rejected, cashDelta should be 0 or negative
    expect(result.cashDelta).toBeLessThanOrEqual(0);
  });

  it("defer returns neutral outcome with extended expiry", () => {
    const offer = makeOffer();
    const result = resolveOffer({
      offer,
      action: "defer",
      startupId: "s1",
      currentCash: 500_000,
      currentValuation: 5_000_000,
      currentRevenue: 50_000,
    });
    expect(result.success).toBe(true);
    expect(result.cashDelta).toBe(0);
    expect(result.valuationDelta).toBe(0);
    expect(result.equityDelta).toBe(0);
  });

  it("acquihire resolves similarly to acquisition", () => {
    const offer = makeOffer({ offerType: "acquihire", acquisitionPrice: 8_000_000, amount: null, equityPercent: null });
    const result = resolveOffer({
      offer,
      action: "accept",
      startupId: "s1",
      currentCash: 500_000,
      currentValuation: 5_000_000,
      currentRevenue: 50_000,
    });
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe("acquired");
    expect(result.acquisitionOutcome).toBeDefined();
  });

  it("cloud credits offer creates strategic round", () => {
    const offer = makeOffer({ offerType: "cloud_credits", amount: 500_000, equityPercent: 5 });
    const result = resolveOffer({
      offer,
      action: "accept",
      startupId: "s1",
      currentCash: 500_000,
      currentValuation: 5_000_000,
      currentRevenue: 50_000,
    });
    expect(result.success).toBe(true);
    expect(result.fundingRound).toBeDefined();
    expect(result.fundingRound?.roundType).toBe("strategic_round");
  });
});
