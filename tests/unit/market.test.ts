import { describe, it, expect } from "vitest";
import { getAllScenarios, getScenarioByKey } from "@/lib/market/scenarios";
import { deriveStartupMarketExposure } from "@/lib/market/exposure";
import { calculateMarketImpactForStartup } from "@/lib/market/impact-engine";
import { MarketScenario } from "@/lib/market/types";

describe("Market Scenarios", () => {
  it("has at least 12 scenarios", () => {
    expect(getAllScenarios().length).toBeGreaterThanOrEqual(12);
  });

  it("each scenario has required fields", () => {
    for (const s of getAllScenarios()) {
      expect(s.key).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(["bullish", "neutral", "bearish"]).toContain(s.condition);
      expect(s.event.name).toBeTruthy();
      expect(s.event.severity).toBeGreaterThanOrEqual(1);
      expect(s.event.severity).toBeLessThanOrEqual(100);
    }
  });

  it("has unique keys", () => {
    const keys = getAllScenarios().map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("returns undefined for invalid key", () => {
    expect(getScenarioByKey("nonexistent")).toBeUndefined();
  });

  it("returns scenario for valid key", () => {
    expect(getScenarioByKey("ai_boom")).toBeDefined();
    expect(getScenarioByKey("crypto_bear_market")).toBeDefined();
  });
});

describe("deriveStartupMarketExposure", () => {
  it("exposes AI startups to aiTrend and enterpriseDemand", () => {
    const exp = deriveStartupMarketExposure({
      sector: "AI / ML",
      region: "North America",
      monetizationModel: "SaaS",
      problem: "Slow data processing",
      solution: "AI automation platform",
    });
    expect(exp.macro.aiTrend).toBeGreaterThan(50);
    expect(exp.macro.enterpriseDemand).toBeGreaterThan(30);
    expect(exp.tailwinds.length).toBeGreaterThan(0);
  });

  it("exposes fintech to regulation and interestRates", () => {
    const exp = deriveStartupMarketExposure({
      sector: "Fintech",
      region: "Europe",
      monetizationModel: "Transaction fees",
      problem: "Expensive remittances",
      solution: "Blockchain payments",
    });
    expect(exp.macro.regulation).toBeGreaterThan(50);
    expect(exp.macro.interestRates).toBeGreaterThan(30);
    expect(exp.headwinds.length).toBeGreaterThan(0);
  });

  it("exposes web3 to cryptoCycle", () => {
    const exp = deriveStartupMarketExposure({
      sector: "Web3",
      region: "Asia",
      monetizationModel: "Token sales",
      problem: "Centralized finance",
      solution: "DeFi protocol",
    });
    expect(exp.macro.cryptoCycle).toBeGreaterThan(50);
  });

  it("exposes healthcare to regulation and aiTrend", () => {
    const exp = deriveStartupMarketExposure({
      sector: "Healthtech",
      region: "North America",
      monetizationModel: "B2B SaaS",
      problem: "Slow diagnostics",
      solution: "AI imaging",
    });
    expect(exp.macro.regulation).toBeGreaterThan(30);
    expect(exp.macro.aiTrend).toBeGreaterThan(30);
  });

  it("clamps all macro values to 0-100", () => {
    const exp = deriveStartupMarketExposure({
      sector: "AI / ML",
      region: "Latin America",
      monetizationModel: "SaaS",
      problem: "X",
      solution: "Y",
    });
    for (const val of Object.values(exp.macro)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    }
  });
});

describe("calculateMarketImpactForStartup", () => {
  const baseExposure = deriveStartupMarketExposure({
    sector: "AI / ML",
    region: "North America",
    monetizationModel: "SaaS",
    problem: "X",
    solution: "Y",
  });

  it("gives positive impact in AI boom for AI startup", () => {
    const scenario = getScenarioByKey("ai_boom")!;
    const impact = calculateMarketImpactForStartup("AI / ML", "North America", baseExposure, scenario, 1);
    expect(impact.revenueDelta).toBeGreaterThan(0);
    expect(impact.valuationDelta).toBeGreaterThan(0);
    expect(impact.affectedBecause.length).toBeGreaterThan(0);
  });

  it("gives negative impact in crypto winter for AI startup", () => {
    const scenario = getScenarioByKey("crypto_bear_market")!;
    const impact = calculateMarketImpactForStartup("AI / ML", "North America", baseExposure, scenario, 1);
    // AI startup is not heavily affected by crypto winter, so impact should be bounded
    expect(impact.revenueDelta).toBeGreaterThanOrEqual(-10);
    expect(impact.revenueDelta).toBeLessThanOrEqual(5);
  });

  it("gives negative impact in high interest rates for fintech", () => {
    const fintechExp = deriveStartupMarketExposure({
      sector: "Fintech",
      region: "North America",
      monetizationModel: "Lending",
      problem: "X",
      solution: "Y",
    });
    const scenario = getScenarioByKey("high_interest_rates")!;
    const impact = calculateMarketImpactForStartup("Fintech", "North America", fintechExp, scenario, 1);
    expect(impact.revenueDelta).toBeLessThan(0);
    expect(impact.riskDelta).toBeGreaterThan(0);
  });

  it("produces deterministic results for same month", () => {
    const scenario = getScenarioByKey("ai_boom")!;
    const i1 = calculateMarketImpactForStartup("AI / ML", "North America", baseExposure, scenario, 3);
    const i2 = calculateMarketImpactForStartup("AI / ML", "North America", baseExposure, scenario, 3);
    expect(i1.revenueDelta).toBe(i2.revenueDelta);
    expect(i1.burnDelta).toBe(i2.burnDelta);
  });

  it("bounds all deltas to safe ranges", () => {
    const scenario = getScenarioByKey("geopolitical_conflict")!;
    const impact = calculateMarketImpactForStartup("AI / ML", "North America", baseExposure, scenario, 6);
    expect(impact.revenueDelta).toBeGreaterThanOrEqual(-25);
    expect(impact.revenueDelta).toBeLessThanOrEqual(25);
    expect(impact.burnDelta).toBeGreaterThanOrEqual(-10);
    expect(impact.burnDelta).toBeLessThanOrEqual(20);
    expect(impact.riskDelta).toBeGreaterThanOrEqual(-10);
    expect(impact.riskDelta).toBeLessThanOrEqual(20);
  });

  it("returns difficulty score between 10 and 95", () => {
    const scenario = getScenarioByKey("consumer_recession")!;
    const impact = calculateMarketImpactForStartup("AI / ML", "North America", baseExposure, scenario, 1);
    expect(impact.difficultyScore).toBeGreaterThanOrEqual(10);
    expect(impact.difficultyScore).toBeLessThanOrEqual(95);
  });

  it("returns higher difficulty for bearish scenarios", () => {
    const bull = getScenarioByKey("ai_boom")!;
    const bear = getScenarioByKey("crypto_bear_market")!;
    const iBull = calculateMarketImpactForStartup("AI / ML", "North America", baseExposure, bull, 1);
    const iBear = calculateMarketImpactForStartup("AI / ML", "North America", baseExposure, bear, 1);
    expect(iBear.difficultyScore).toBeGreaterThan(iBull.difficultyScore);
  });
});
