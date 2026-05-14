import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Integration test for resolveGrowthOfferAction.
 *
 * Verifies the Phase 26A fix: only `offerId` is read; offer set is
 * regenerated server-side; forged offers are rejected.
 */

const TEST_USER = { id: "user-1", email: "u@test", name: "U" };

const TEST_STARTUP = {
  id: "startup-XYZ",
  userId: "user-1",
  cash: 1_000_000,
  valuation: 6_000_000,
  revenue: 80_000,
  monthlyBurn: 60_000,
  productProgress: 80,
  investorScore: 70,
  marketScore: 60,
  riskScore: 30,
  sector: "AI / ML",
  region: "united states",
  stage: "seed",
  status: "funded",
  workSetup: "small_office",
  description: "AI compliance copilot",
  problem: "Manual compliance work",
  solution: "AI copilot",
  monetizationModel: "SaaS subscription",
};

const persistedOffers: Array<Record<string, unknown>> = [];
const startupUpdates: Array<Record<string, unknown>> = [];

vi.mock("@/lib/auth-helpers", () => ({
  requireCurrentUser: vi.fn(async () => TEST_USER),
}));

vi.mock("@/lib/billing/entitlements", () => ({
  checkGrowthAccess: vi.fn(async () => ({ allowed: true })),
}));

vi.mock("@/lib/market/snapshot", () => ({
  getMarketSnapshotForMonth: vi.fn(async () => ({ condition: "neutral" })),
}));

vi.mock("@/lib/db", () => {
  return {
    db: {
      startup: {
        findUnique: vi.fn(async ({ include }: { include?: unknown }) => {
          // getGrowthState's findUnique includes employees/missions/etc.
          if (include) {
            return {
              ...TEST_STARTUP,
              simulationMonths: [
                { monthNumber: 1, cashEnd: 800_000, revenue: 30_000, burnRate: 60_000 },
                { monthNumber: 2, cashEnd: 750_000, revenue: 40_000, burnRate: 60_000 },
              ],
              fundingRounds: [
                { roundType: "seed", amountRaised: 800_000, equitySold: 15 },
              ],
              employees: [],
              growthOffers: persistedOffers,
              missions: [],
            };
          }
          // resolveGrowthOfferAction's slim select
          return TEST_STARTUP;
        }),
        update: vi.fn(async ({ data }) => {
          startupUpdates.push(data);
          return data;
        }),
      },
      growthOffer: {
        findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
          // Idempotency check: match against persistedOffers
          return (
            persistedOffers.find(
              (o) =>
                o.actorId === where.actorId &&
                o.offerType === where.offerType &&
                o.headline === where.headline &&
                ["accepted", "rejected"].includes(o.status as string)
            ) ?? null
          );
        }),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          persistedOffers.push(data);
          return data;
        }),
      },
      fundingRound: {
        create: vi.fn(async () => ({})),
      },
      $transaction: vi.fn(async (ops: unknown) => {
        if (typeof ops === "function") return (ops as (tx: unknown) => Promise<unknown>)({});
        return Array.isArray(ops) ? Promise.all(ops as Array<Promise<unknown>>) : ops;
      }),
    },
  };
});

import { resolveGrowthOfferAction } from "@/lib/actions/growth";
import {
  generateStrategicOffers,
  generateGrowthRoundOffer,
} from "@/lib/growth/strategic-offers";
import { STRATEGIC_ACTORS } from "@/lib/growth/actor-library";

function knownOfferIds() {
  const ctx = {
    startupId: TEST_STARTUP.id,
    cash: TEST_STARTUP.cash,
    monthlyBurn: TEST_STARTUP.monthlyBurn,
    revenue: TEST_STARTUP.revenue,
    valuation: TEST_STARTUP.valuation,
    productProgress: TEST_STARTUP.productProgress,
    investorScore: TEST_STARTUP.investorScore,
    marketScore: TEST_STARTUP.marketScore,
    riskScore: TEST_STARTUP.riskScore,
    sector: TEST_STARTUP.sector,
    stage: TEST_STARTUP.stage,
    status: TEST_STARTUP.status,
    monthsSurvived: 2,
    simulationHistory: [],
    teamSize: 0,
    fundingRounds: [],
  };
  const offers = generateStrategicOffers(ctx, STRATEGIC_ACTORS, { condition: "neutral" });
  const round: typeof offers = [];
  for (const k of ["series_a", "series_b"]) {
    const r = generateGrowthRoundOffer(ctx, k, { condition: "neutral" });
    if (r) round.push(r);
  }
  return [...offers, ...round].map((o) => o.offerId);
}

describe("resolveGrowthOfferAction (Phase 26A regression)", () => {
  beforeEach(() => {
    persistedOffers.length = 0;
    startupUpdates.length = 0;
  });

  it("rejects a forged $999M acquisition offerId", async () => {
    await expect(
      resolveGrowthOfferAction(TEST_STARTUP.id, "offer-frontier_ai_lab-9999999", "accept")
    ).rejects.toThrow(/no longer available/);
    expect(persistedOffers).toHaveLength(0);
  });

  it("rejects an obviously short / malformed offerId", async () => {
    await expect(
      resolveGrowthOfferAction(TEST_STARTUP.id, "x", "accept")
    ).rejects.toThrow(/Invalid offer id/);
  });

  it("rejects a fabricated offer object with inflated price", async () => {
    await expect(
      resolveGrowthOfferAction(
        TEST_STARTUP.id,
        // @ts-expect-error legacy-shape with forged economics
        { offerId: "offer-totally_fake-123", acquisitionPrice: 999_000_000 },
        "accept"
      )
    ).rejects.toThrow(/no longer available/);
    expect(persistedOffers).toHaveLength(0);
  });

  it("accepts a valid server-generated offer", async () => {
    const ids = knownOfferIds();
    expect(ids.length).toBeGreaterThan(0);
    const result = await resolveGrowthOfferAction(TEST_STARTUP.id, ids[0], "reject");
    expect(result.success).toBe(true);
    expect(persistedOffers).toHaveLength(1);
  });

  it("rejects a duplicate accept of the same offer (idempotency)", async () => {
    const ids = knownOfferIds();
    await resolveGrowthOfferAction(TEST_STARTUP.id, ids[0], "reject");
    await expect(
      resolveGrowthOfferAction(TEST_STARTUP.id, ids[0], "reject")
    ).rejects.toThrow(/already been resolved/);
  });

  it("rejects unknown action verb", async () => {
    await expect(
      // @ts-expect-error invalid action verb
      resolveGrowthOfferAction(TEST_STARTUP.id, "offer-anything-1", "destroy")
    ).rejects.toThrow(/Invalid action/);
  });
});
