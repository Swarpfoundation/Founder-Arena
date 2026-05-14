import { describe, it, expect } from "vitest";
import {
  getCurrentSimulationMonth,
  calculateRunway,
  simulateMonth,
  checkDeathCondition,
  classifyFinalOutcome,
  calculateLeaderboardScore,
  applyMarketImpact,
} from "@/lib/simulation/engine";
import { validateDecisionSelection } from "@/lib/simulation/decisions";
import { MarketSnapshot } from "@prisma/client";

describe("getCurrentSimulationMonth", () => {
  it("returns 0 for empty history", () => {
    expect(getCurrentSimulationMonth([])).toBe(0);
  });

  it("returns max month number from history", () => {
    const history = [
      { monthNumber: 1 },
      { monthNumber: 3 },
      { monthNumber: 2 },
    ] as unknown as Parameters<typeof getCurrentSimulationMonth>[0];
    expect(getCurrentSimulationMonth(history)).toBe(3);
  });
});

describe("calculateRunway", () => {
  it("calculates runway correctly", () => {
    expect(calculateRunway(100000, 20000)).toBe(5);
  });

  it("returns 999 for zero or negative burn", () => {
    expect(calculateRunway(100000, 0)).toBe(999);
    expect(calculateRunway(100000, -5000)).toBe(999);
  });
});

describe("simulateMonth", () => {
  const baseState = {
    cash: 500000,
    monthlyBurn: 25000,
    revenue: 10000,
    valuation: 2000000,
    productProgress: 30,
    investorScore: 60,
    marketScore: 55,
    riskScore: 40,
  };

  it("reduces cash by burn and increases product progress", () => {
    const decisions = [
      { id: "product_focus", label: "Product Focus", cashCost: 5000, burnDelta: 5000, productDelta: 18, revenueDelta: 0, investorDelta: 2, marketDelta: 0, riskDelta: -1, description: "" },
    ];

    const result = simulateMonth(baseState, decisions, null, "SaaS");

    expect(result.productProgressAfter).toBe(48);
    expect(result.cashEnd).toBeLessThan(baseState.cash);
    expect(result.burnRate).toBeGreaterThan(0);
  });

  it("applies bullish market multiplier", () => {
    const snapshot = {
      id: "ms1",
      condition: "bullish",
      description: "Bull market",
      sectorTrends: { saas: 1.1 },
      createdAt: new Date(),
      month: new Date(),
    } as unknown as MarketSnapshot;

    const decisions = [
      { id: "marketing_spend", label: "Marketing", cashCost: 18000, burnDelta: 18000, productDelta: 0, revenueDelta: 12000, investorDelta: 3, marketDelta: 4, riskDelta: 2, description: "" },
    ];

    const result = simulateMonth(baseState, decisions, snapshot, "SaaS", [], "remote", undefined, 1);
    expect(result.revenue).toBeGreaterThan(baseState.revenue + 12000);
  });

  it("applies bearish market multiplier", () => {
    const snapshot = {
      id: "ms1",
      condition: "bearish",
      description: "Bear market",
      sectorTrends: { saas: 0.9 },
      createdAt: new Date(),
      month: new Date(),
    } as unknown as MarketSnapshot;

    const result = simulateMonth(baseState, [], snapshot, "SaaS", [], "remote", undefined, 1);
    expect(result.revenue).toBeLessThanOrEqual(baseState.revenue);
  });

  it("caps product progress at 100", () => {
    const state = { ...baseState, productProgress: 90 };
    const decisions = [
      { id: "product_focus", label: "Product Focus", cashCost: 5000, burnDelta: 5000, productDelta: 18, revenueDelta: 0, investorDelta: 2, marketDelta: 0, riskDelta: -1, description: "" },
    ];

    const result = simulateMonth(state, decisions, null, "SaaS");
    expect(result.productProgressAfter).toBe(100);
  });
});

describe("checkDeathCondition", () => {
  it("detects cash death", () => {
    const result = simulateMonth(
      { cash: 1000, monthlyBurn: 50000, revenue: 0, valuation: 1000000, productProgress: 50, investorScore: 50, marketScore: 50, riskScore: 30 },
      [{ id: "marketing_spend", label: "Marketing", cashCost: 50000, burnDelta: 50000, productDelta: 0, revenueDelta: 0, investorDelta: 0, marketDelta: 0, riskDelta: 0, description: "" }],
      null,
      "SaaS"
    );

    const check = checkDeathCondition(result, 3);
    expect(check.dead).toBe(true);
    expect(check.reason).toContain("cash");
  });

  it("detects runway exhaustion", () => {
    const check = checkDeathCondition(
      { cashEnd: 1000, burnRate: 50000, revenue: 0, runwayMonths: 0, productProgressAfter: 50, investorScoreAfter: 50, riskScoreAfter: 30 } as unknown as ReturnType<typeof simulateMonth>,
      6
    );
    expect(check.dead).toBe(true);
    expect(check.reason).toContain("Runway");
  });

  it("detects catastrophic risk", () => {
    const check = checkDeathCondition(
      { cashEnd: 50000, burnRate: 10000, revenue: 5000, runwayMonths: 5, productProgressAfter: 50, investorScoreAfter: 50, riskScoreAfter: 96 } as unknown as ReturnType<typeof simulateMonth>,
      6
    );
    expect(check.dead).toBe(true);
    expect(check.reason).toContain("risk");
  });

  it("survives healthy state", () => {
    const check = checkDeathCondition(
      { cashEnd: 500000, burnRate: 20000, revenue: 15000, runwayMonths: 25, productProgressAfter: 60, investorScoreAfter: 60, riskScoreAfter: 30 } as unknown as ReturnType<typeof simulateMonth>,
      6
    );
    expect(check.dead).toBe(false);
  });
});

describe("classifyFinalOutcome", () => {
  it("classifies BREAKOUT for strong metrics", () => {
    const state = {
      cash: 200000,
      monthlyBurn: 30000,
      revenue: 150000,
      valuation: 10000000,
      productProgress: 90,
      investorScore: 85,
      marketScore: 80,
      riskScore: 20,
    };
    const outcome = classifyFinalOutcome(state, 12, []);
    expect(outcome.outcome).toBe("BREAKOUT");
  });

  it("classifies DEAD for failed startup", () => {
    const state = {
      cash: -1000,
      monthlyBurn: 20000,
      revenue: 0,
      valuation: 100000,
      productProgress: 10,
      investorScore: 10,
      marketScore: 20,
      riskScore: 80,
    };
    const outcome = classifyFinalOutcome(state, 5, []);
    expect(outcome.outcome).toBe("DEAD");
  });

  it("classifies ZOMBIE for weak survival", () => {
    const state = {
      cash: 5000,
      monthlyBurn: 10000,
      revenue: 2000,
      valuation: 500000,
      productProgress: 30,
      investorScore: 40,
      marketScore: 40,
      riskScore: 60,
    };
    const outcome = classifyFinalOutcome(state, 12, []);
    expect(["ZOMBIE", "SMALL_PROFITABLE"]).toContain(outcome.outcome);
  });
});

describe("calculateLeaderboardScore", () => {
  it("scores breakout higher than zombie", () => {
    const state = {
      cash: 100000,
      monthlyBurn: 20000,
      revenue: 100000,
      valuation: 5000000,
      productProgress: 80,
      investorScore: 80,
      marketScore: 70,
      riskScore: 20,
    };
    const breakout = calculateLeaderboardScore(state, 12, "BREAKOUT");
    const zombie = calculateLeaderboardScore(state, 12, "ZOMBIE");
    expect(breakout).toBeGreaterThan(zombie);
  });
});

describe("validateDecisionSelection", () => {
  it("rejects empty selection", () => {
    const result = validateDecisionSelection([], 500000, 30, "SaaS", 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least one");
  });

  it("rejects more than 3 decisions", () => {
    const result = validateDecisionSelection(["hire_engineer", "hire_sales", "hire_compliance", "product_focus"], 500000, 30, "SaaS", 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at most 3");
  });

  it("accepts valid selection", () => {
    const result = validateDecisionSelection(["product_focus", "customer_interviews"], 500000, 30, "SaaS", 1);
    expect(result.valid).toBe(true);
  });

  it("rejects unaffordable combined decisions", () => {
    const result = validateDecisionSelection(["hire_engineer", "hire_sales"], 25000, 30, "SaaS", 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("exceeds");
  });

  it("rejects duplicate decision IDs", () => {
    const result = validateDecisionSelection(
      ["product_focus", "product_focus"],
      500000,
      30,
      "SaaS",
      1
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Duplicate");
  });

  it("rejects three copies of the same decision", () => {
    const result = validateDecisionSelection(
      ["cut_costs", "cut_costs", "cut_costs"],
      500000,
      30,
      "SaaS",
      1
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Duplicate");
  });
});

describe("applyMarketImpact", () => {
  it("returns neutral defaults for null snapshot", () => {
    const impact = applyMarketImpact({ cash: 100000, monthlyBurn: 10000, revenue: 5000, valuation: 1000000, productProgress: 50, investorScore: 50, marketScore: 50, riskScore: 30 }, null, "SaaS");
    expect(impact.revenueMultiplier).toBe(1);
    expect(impact.valuationMultiplier).toBe(1);
  });

  it("applies bullish multipliers", () => {
    const snapshot = { id: "ms", condition: "bullish", description: "Bull", sectorTrends: null, createdAt: new Date(), month: new Date() } as MarketSnapshot;
    const impact = applyMarketImpact({ cash: 100000, monthlyBurn: 10000, revenue: 5000, valuation: 1000000, productProgress: 50, investorScore: 50, marketScore: 50, riskScore: 30 }, snapshot, "SaaS");
    expect(impact.revenueMultiplier).toBeGreaterThan(1);
    expect(impact.investorDelta).toBeGreaterThan(0);
  });
});
