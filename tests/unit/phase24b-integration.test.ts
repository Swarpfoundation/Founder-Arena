import { describe, it, expect } from "vitest";
import { generateMissionRoadmap } from "@/lib/missions/mission-generator";
import { calculateMissionProgress, getActiveMission, getMissionCompletionRate } from "@/lib/missions/mission-progress";
import { applyMissionEffects, boundMissionEffect } from "@/lib/missions/mission-effects";
import { generateDeterministicAdvisor } from "@/lib/ai/operations-advisor";
import { generateNextMoves } from "@/lib/missions/next-moves";
import { calculateEmployeeCost, estimateHireImpact } from "@/lib/economy/cost-engine";
import { classifyStartupDeterministic } from "@/lib/missions/startup-classifier";
import { calculateSeriesAReadiness, calculateAcquisitionReadiness } from "@/lib/growth/eligibility";
import { MissionInstance, StartupClassification } from "@/lib/missions/types";
import { GrowthStateContext } from "@/lib/growth/types";

describe("Phase 24B Integration", () => {
  function makeMission(overrides: Partial<MissionInstance> = {}): MissionInstance {
    return {
      id: `m-${overrides.id ?? "1"}`,
      startupId: "s1",
      templateId: "t1",
      title: "Build MVP",
      category: "engineering",
      status: "active",
      sequence: 1,
      monthStart: 1,
      monthEnd: 3,
      requiredRoles: [{ role: "CTO", seniority: "senior", count: 1 }],
      optionalRoles: [],
      requiredCapabilities: ["engineering"],
      estimatedCost: 50000,
      monthlyCostDelta: 5000,
      progress: 10,
      successScore: null,
      effects: null,
      aiSummary: null,
      complexity: 5,
      metadata: {
        effectsOnComplete: { productProgressDelta: 15, investorScoreDelta: 3, riskScoreDelta: -2 },
        effectsOnFail: { productProgressDelta: 5, investorScoreDelta: -2, riskScoreDelta: 3 },
      },
      ...overrides,
    };
  }

  // ─── 1. Roadmap Persistence ──────────────────────────────────────
  it("generates a roadmap with type-specific first mission", () => {
    const aiClassification: StartupClassification = classifyStartupDeterministic(
      "AI / ML", "AI support platform", "support overload", "LLM automation", "subscription"
    );
    const roadmap = generateMissionRoadmap("s1", aiClassification, "AI / ML", "idea");
    expect(roadmap.missions.length).toBeGreaterThanOrEqual(3);
    const first = roadmap.missions[0];
    expect(first.status).toBe("active");
    // AI startup should have engineering/AI-related first mission
    expect(["ai_model", "engineering", "product", "research"]).toContain(first.category);
  });

  it("generates fintech roadmap with compliance/payment missions", () => {
    const fintechClassification: StartupClassification = classifyStartupDeterministic(
      "fintech", "cross-border payments", "expensive remittance", "blockchain settlement", "transaction_fee"
    );
    const roadmap = generateMissionRoadmap("s1", fintechClassification, "fintech", "idea");
    expect(roadmap.missions.length).toBeGreaterThanOrEqual(3);
    const categories = roadmap.missions.map((m) => m.category);
    // Fintech should include compliance, security, or product missions
    expect(categories.some((c) => ["compliance", "security", "product", "engineering"].includes(c))).toBe(true);
  });

  // ─── 2. Mission Progression ──────────────────────────────────────
  it("progresses active mission when team is strong", () => {
    const mission = makeMission({ progress: 50 });
    const result = calculateMissionProgress({
      mission,
      employees: [{ role: "CTO", seniority: "senior", skill: "engineering", morale: 90, productivity: 90 }],
      monthlyDecisions: ["hire_engineer", "product_focus"],
      marketTailwind: 2,
      marketHeadwind: 0,
      cash: 200000,
      runwayMonths: 8,
      riskScore: 20,
      teamProductivity: 0.9,
      teamMorale: 85,
    });
    expect(result.newProgress).toBeGreaterThan(50);
    expect(result.progressDelta).toBeGreaterThan(0);
  });

  it("completes mission at 100% and sets status to completed", () => {
    const mission = makeMission({ progress: 95 });
    const result = calculateMissionProgress({
      mission,
      employees: [{ role: "CTO", seniority: "senior", skill: "engineering", morale: 90, productivity: 90 }],
      monthlyDecisions: ["product_focus"],
      marketTailwind: 1,
      marketHeadwind: 0,
      cash: 300000,
      runwayMonths: 12,
      riskScore: 20,
      teamProductivity: 1.0,
      teamMorale: 90,
    });
    expect(result.newProgress).toBe(100);
    expect(result.status).toBe("completed");
  });

  it("fails mission when score is very low", () => {
    const mission = makeMission({ progress: 25 });
    const result = calculateMissionProgress({
      mission,
      employees: [],
      monthlyDecisions: [],
      marketTailwind: 0,
      marketHeadwind: 3,
      cash: 5000,
      runwayMonths: 1,
      riskScore: 90,
      teamProductivity: 0.2,
      teamMorale: 30,
    });
    expect(result.status).toBe("failed");
  });

  // ─── 3. Mission Effects are Bounded ──────────────────────────────
  it("bounds mission completion effects to safe ranges", () => {
    const unbounded = {
      cashDelta: 500000,
      burnDelta: 100000,
      productProgressDelta: 200,
      revenueDelta: 1000000,
      valuationDelta: 50000000,
      investorScoreDelta: 80,
      marketScoreDelta: 80,
      riskScoreDelta: -80,
    };
    const bounded = boundMissionEffect(unbounded);
    expect(bounded.cashDelta).toBeLessThanOrEqual(500000);
    expect(bounded.burnDelta).toBeLessThanOrEqual(100000);
    expect(bounded.productProgressDelta).toBeLessThanOrEqual(100);
    expect(bounded.valuationDelta).toBeLessThanOrEqual(50000000);
  });

  it("applies mission effects without exceeding limits", () => {
    const state = {
      cash: 100000,
      monthlyBurn: 50000,
      revenue: 10000,
      valuation: 2000000,
      productProgress: 50,
      investorScore: 60,
      marketScore: 55,
      riskScore: 40,
    };
    const effect = {
      cashDelta: 20000,
      productProgressDelta: 15,
      investorScoreDelta: 5,
      riskScoreDelta: -3,
    };
    const result = applyMissionEffects(state, effect);
    expect(result.cash).toBe(120000);
    expect(result.productProgress).toBe(65);
    expect(result.investorScore).toBe(65);
    expect(result.riskScore).toBe(37);
  });

  // ─── 4. AI Advisor Deterministic Fallback ────────────────────────
  it("generates deterministic advisor with role gaps", () => {
    const advisor = generateDeterministicAdvisor({
      startupName: "TestCo",
      sector: "saas",
      stage: "seed",
      classification: "saas_b2b",
      month: 3,
      cash: 200000,
      monthlyBurn: 30000,
      revenue: 0,
      runwayMonths: 6,
      productProgress: 25,
      investorScore: 50,
      marketScore: 50,
      riskScore: 40,
      activeMissionTitle: "Build MVP",
      activeMissionCategory: "engineering",
      missionProgress: 30,
      roleGaps: ["CTO", "Full-stack Engineer"],
      teamSize: 1,
      recentDecisions: ["product_focus"],
      marketCondition: "neutral",
      eventHistory: [],
    });
    expect(advisor.topOperationalRisks.length).toBeGreaterThan(0);
    expect(advisor.recommendedHires).toContain("CTO");
    expect(advisor.confidence).toBeGreaterThan(0);
    expect(advisor.currentSituationSummary).toContain("TestCo");
  });

  it("generates deterministic advisor with no role gaps", () => {
    const advisor = generateDeterministicAdvisor({
      startupName: "TestCo",
      sector: "saas",
      stage: "seed",
      classification: "saas_b2b",
      month: 3,
      cash: 500000,
      monthlyBurn: 20000,
      revenue: 15000,
      runwayMonths: 20,
      productProgress: 60,
      investorScore: 70,
      marketScore: 60,
      riskScore: 30,
      missionProgress: 50,
      roleGaps: [],
      teamSize: 4,
      recentDecisions: ["product_focus", "hire_engineer"],
      marketCondition: "bull",
      eventHistory: [],
    });
    expect(advisor.topOperationalRisks.length).toBeGreaterThan(0);
    expect(advisor.missionGapAnalysis).toContain("adequate role coverage");
  });

  // ─── 5. Next Moves Include Mission-Critical Hire ─────────────────
  it("recommends hiring missing mission roles", () => {
    const mission = makeMission({
      requiredRoles: [{ role: "AI Engineer", seniority: "senior", count: 1 }],
    });
    const moves = generateNextMoves({
      startupId: "s1",
      startupName: "TestCo",
      sector: "AI / ML",
      stage: "seed",
      cash: 300000,
      monthlyBurn: 25000,
      revenue: 0,
      runwayMonths: 12,
      productProgress: 20,
      investorScore: 50,
      marketScore: 50,
      riskScore: 40,
      employees: [{ role: "CTO", seniority: "senior", skill: "leadership" }],
      activeMission: mission,
      pendingMissions: [],
      monthlyDecisions: [],
      marketCondition: "neutral",
      classification: "ai_saas",
    });
    const hireMoves = moves.filter((m) => m.type === "hire");
    expect(hireMoves.length).toBeGreaterThan(0);
    expect(hireMoves.some((m) => m.requiredRole === "AI Engineer")).toBe(true);
  });

  // ─── 6. Cost Engine is Source of Truth ───────────────────────────
  it("calculateEmployeeCost produces consistent monthly burn", () => {
    const cost = calculateEmployeeCost("CTO", "senior", "san francisco");
    expect(cost.monthlyBurn).toBe(Math.round(cost.allInAnnual / 12));
    expect(cost.allInAnnual).toBeGreaterThan(200000);
    expect(cost.regionMultiplier).toBeGreaterThan(1.0);
  });

  it("estimateHireImpact warns on low runway", () => {
    const impact = estimateHireImpact(100000, 40000, 0, "CTO", "senior", "san francisco");
    expect(impact.runwayAfter).toBeLessThan(impact.runwayBefore);
    expect(impact.runwayAfter).toBeLessThan(6);
  });

  // ─── 7. VC Review Funding Adequacy ───────────────────────────────
  it("computes funding adequacy correctly", () => {
    const fundingAsk = 500000;
    const totalMissionCost = 250000;
    const adequacy = Math.round((fundingAsk / Math.max(totalMissionCost, 1)) * 100);
    expect(adequacy).toBe(200);

    const lowAdequacy = Math.round((100000 / 250000) * 100);
    expect(lowAdequacy).toBe(40);
  });

  // ─── 8. Growth Readiness Mission Modifier ────────────────────────
  it("boosts Series A readiness with high mission completion", () => {
    const ctx: GrowthStateContext = {
      startupId: "s1",
      cash: 1000000,
      monthlyBurn: 50000,
      revenue: 60000,
      valuation: 6000000,
      productProgress: 85,
      investorScore: 75,
      marketScore: 70,
      riskScore: 30,
      sector: "saas",
      stage: "seed",
      status: "funded",
      monthsSurvived: 8,
      simulationHistory: [],
      teamSize: 6,
      fundingRounds: [{ roundType: "seed", amountRaised: 500000, equitySold: 0.15 }],
      missionCompletionRate: 0.8,
      completedMissions: 4,
      totalMissions: 5,
      activeMissionProgress: 60,
    };
    const result = calculateSeriesAReadiness(ctx);
    expect(result.reasons.some((r) => r.includes("mission execution"))).toBe(true);
  });

  it("reduces Series A readiness with poor mission completion", () => {
    const ctx: GrowthStateContext = {
      startupId: "s1",
      cash: 1000000,
      monthlyBurn: 50000,
      revenue: 60000,
      valuation: 6000000,
      productProgress: 85,
      investorScore: 75,
      marketScore: 70,
      riskScore: 30,
      sector: "saas",
      stage: "seed",
      status: "funded",
      monthsSurvived: 8,
      simulationHistory: [],
      teamSize: 6,
      fundingRounds: [{ roundType: "seed", amountRaised: 500000, equitySold: 0.15 }],
      missionCompletionRate: 0.2,
      completedMissions: 1,
      totalMissions: 5,
      activeMissionProgress: 10,
    };
    const result = calculateSeriesAReadiness(ctx);
    expect(result.blockers.some((b) => b.includes("mission execution"))).toBe(true);
  });

  it("acquisition readiness considers mission completion", () => {
    const ctx: GrowthStateContext = {
      startupId: "s1",
      cash: 2000000,
      monthlyBurn: 80000,
      revenue: 150000,
      valuation: 15000000,
      productProgress: 95,
      investorScore: 80,
      marketScore: 75,
      riskScore: 25,
      sector: "saas",
      stage: "series_a",
      status: "funded",
      monthsSurvived: 12,
      simulationHistory: [],
      teamSize: 12,
      fundingRounds: [
        { roundType: "seed", amountRaised: 500000, equitySold: 0.15 },
        { roundType: "series_a", amountRaised: 3000000, equitySold: 0.2 },
      ],
      missionCompletionRate: 0.9,
      completedMissions: 9,
      totalMissions: 10,
      activeMissionProgress: 80,
    };
    const result = calculateAcquisitionReadiness(ctx);
    expect(result.reasons.some((r) => r.includes("acquirer confidence"))).toBe(true);
  });

  // ─── 9. Active Mission Selection ─────────────────────────────────
  it("getActiveMission returns active over pending", () => {
    const missions = [
      makeMission({ status: "completed", id: "m1", sequence: 1 }),
      makeMission({ status: "active", id: "m2", sequence: 2 }),
      makeMission({ status: "pending", id: "m3", sequence: 3 }),
    ];
    expect(getActiveMission(missions)?.id).toBe("m2");
  });

  it("getActiveMission falls back to first pending", () => {
    const missions = [
      makeMission({ status: "completed", id: "m1", sequence: 1 }),
      makeMission({ status: "pending", id: "m2", sequence: 2 }),
    ];
    expect(getActiveMission(missions)?.id).toBe("m2");
  });

  // ─── 10. Mission Completion Rate ─────────────────────────────────
  it("getMissionCompletionRate calculates correctly", () => {
    const missions = [
      makeMission({ status: "completed" }),
      makeMission({ status: "completed" }),
      makeMission({ status: "failed" }),
      makeMission({ status: "pending" }),
    ];
    expect(getMissionCompletionRate(missions)).toBe(0.5);
  });
});
