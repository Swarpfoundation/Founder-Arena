import { describe, it, expect } from "vitest";
import { classifyStartupDeterministic } from "@/lib/missions/startup-classifier";
import { calculateMissionProgress, getActiveMission, getMissionCompletionRate } from "@/lib/missions/mission-progress";
import { generateMissionRoadmap } from "@/lib/missions/mission-generator";
import { getMissionsForStartup, MISSION_LIBRARY } from "@/lib/missions/mission-library";
import { calculateEmployeeCost, estimateHireImpact, calculateTotalBurn, calculateRunwayWithCosts } from "@/lib/economy/cost-engine";
import { MissionInstance, StartupClassification } from "@/lib/missions/types";
import { SeniorityLevel } from "@/lib/economy/types";
import { simulateMonth } from "@/lib/simulation/engine";
import { generateDeterministicMissionCoach } from "@/lib/ai/mission-coach";

describe("Startup Classification", () => {
  it("classifies fintech startups correctly", () => {
    const result = classifyStartupDeterministic(
      "fintech",
      "A payments platform for small businesses",
      "Small businesses struggle with payment processing",
      "A simple API for accepting payments",
      "transaction_fee"
    );
    expect(result.primaryStartupType).toBe("fintech");
    expect(result.regulatoryIntensity).toBeGreaterThanOrEqual(7);
    expect(result.missionArchetype).toBe("Regulated Financial Operator");
  });

  it("classifies AI SaaS correctly", () => {
    const result = classifyStartupDeterministic(
      "ai",
      "AI-powered customer support automation",
      "Support teams are overwhelmed",
      "LLM-based ticket resolution",
      "subscription"
    );
    expect(result.primaryStartupType).toBe("ai_saas");
    expect(result.technicalIntensity).toBeGreaterThanOrEqual(7);
    expect(result.secondaryTypes.length).toBeGreaterThan(0);
  });

  it("classifies SaaS B2B from generic sector", () => {
    const result = classifyStartupDeterministic(
      "saas",
      "Project management tool for remote teams",
      "Remote teams lack coordination",
      "Async-first project management",
      "subscription"
    );
    expect(result.primaryStartupType).toBe("saas_b2b");
  });

  it("returns deterministic intensities within bounds", () => {
    const result = classifyStartupDeterministic(
      "fintech",
      "payments infrastructure",
      "slow cross-border payments",
      "real-time settlement layer",
      "transaction_fee"
    );
    expect(result.complexityLevel).toBeGreaterThanOrEqual(1);
    expect(result.complexityLevel).toBeLessThanOrEqual(10);
    expect(result.capitalIntensity).toBeGreaterThanOrEqual(1);
    expect(result.capitalIntensity).toBeLessThanOrEqual(10);
    expect(result.technicalIntensity).toBeGreaterThanOrEqual(1);
    expect(result.technicalIntensity).toBeLessThanOrEqual(10);
    expect(result.regulatoryIntensity).toBeGreaterThanOrEqual(1);
    expect(result.regulatoryIntensity).toBeLessThanOrEqual(10);
  });
});

describe("Mission Progress Engine", () => {
  function makeMission(overrides: Partial<MissionInstance> = {}): MissionInstance {
    return {
      id: "m1",
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
      metadata: {},
      ...overrides,
    };
  }

  it("calculates progress with full role coverage", () => {
    const result = calculateMissionProgress({
      mission: makeMission(),
      employees: [{ role: "CTO", seniority: "senior", skill: "engineering", morale: 80, productivity: 85 }],
      monthlyDecisions: ["hire_engineer"],
      marketTailwind: 1,
      marketHeadwind: 0,
      cash: 100000,
      runwayMonths: 6,
      riskScore: 30,
      teamProductivity: 0.8,
      teamMorale: 75,
    });

    expect(result.progressDelta).toBeGreaterThan(0);
    expect(result.newProgress).toBeGreaterThan(10);
    expect(result.roleCoverage[0].coverage).toBe(1);
    expect(result.cashReadiness).toBe(1);
  });

  it("calculates progress with missing roles", () => {
    const result = calculateMissionProgress({
      mission: makeMission(),
      employees: [],
      monthlyDecisions: [],
      marketTailwind: 0,
      marketHeadwind: 2,
      cash: 10000,
      runwayMonths: 1,
      riskScore: 80,
      teamProductivity: 0.3,
      teamMorale: 40,
    });

    expect(result.roleCoverage[0].coverage).toBe(0);
    expect(result.progressDelta).toBeLessThanOrEqual(5);
    expect(result.runwayPenalty).toBe(0.3);
  });

  it("completes mission when progress reaches 100", () => {
    const result = calculateMissionProgress({
      mission: makeMission({ progress: 95 }),
      employees: [{ role: "CTO", seniority: "senior", skill: "engineering", morale: 90, productivity: 95 }],
      monthlyDecisions: ["hire_engineer", "product_focus"],
      marketTailwind: 2,
      marketHeadwind: 0,
      cash: 200000,
      runwayMonths: 12,
      riskScore: 20,
      teamProductivity: 1.0,
      teamMorale: 90,
    });

    expect(result.newProgress).toBe(100);
    expect(result.status).toBe("completed");
  });

  it("respects complexity factor — harder missions progress slower", () => {
    const easy = calculateMissionProgress({
      mission: makeMission({ complexity: 2, progress: 0 }),
      employees: [{ role: "CTO", seniority: "senior", skill: "engineering", morale: 80, productivity: 80 }],
      monthlyDecisions: ["product_focus"],
      marketTailwind: 1,
      marketHeadwind: 0,
      cash: 100000,
      runwayMonths: 6,
      riskScore: 30,
      teamProductivity: 0.8,
      teamMorale: 75,
    });

    const hard = calculateMissionProgress({
      mission: makeMission({ complexity: 9, progress: 0 }),
      employees: [{ role: "CTO", seniority: "senior", skill: "engineering", morale: 80, productivity: 80 }],
      monthlyDecisions: ["product_focus"],
      marketTailwind: 1,
      marketHeadwind: 0,
      cash: 100000,
      runwayMonths: 6,
      riskScore: 30,
      teamProductivity: 0.8,
      teamMorale: 75,
    });

    expect(easy.progressDelta).toBeGreaterThan(hard.progressDelta);
  });

  it("getActiveMission returns active mission", () => {
    const missions = [
      makeMission({ status: "completed", id: "m1" }),
      makeMission({ status: "active", id: "m2" }),
      makeMission({ status: "pending", id: "m3" }),
    ];
    expect(getActiveMission(missions)?.id).toBe("m2");
  });

  it("getActiveMission falls back to first pending if no active", () => {
    const missions = [
      makeMission({ status: "completed", id: "m1" }),
      makeMission({ status: "pending", id: "m2" }),
    ];
    expect(getActiveMission(missions)?.id).toBe("m2");
  });

  it("getMissionCompletionRate calculates correctly", () => {
    const missions = [
      makeMission({ status: "completed" }),
      makeMission({ status: "completed" }),
      makeMission({ status: "pending" }),
    ];
    expect(getMissionCompletionRate(missions)).toBeCloseTo(2 / 3, 5);
  });
});

describe("Mission Roadmap Generator", () => {
  const classification: StartupClassification = {
    primaryStartupType: "fintech",
    secondaryTypes: ["remittance"],
    complexityLevel: 7,
    capitalIntensity: 6,
    regulatoryIntensity: 9,
    technicalIntensity: 7,
    salesIntensity: 6,
    hiringIntensity: 6,
    missionArchetype: "Regulated Financial Operator",
    explanation: "test",
  };

  it("generates a roadmap with missions", () => {
    const roadmap = generateMissionRoadmap("s1", classification, "fintech", "idea");
    expect(roadmap.missions.length).toBeGreaterThanOrEqual(3);
    expect(roadmap.missions.length).toBeLessThanOrEqual(10);
  });

  it("assigns unique IDs to missions", () => {
    const roadmap = generateMissionRoadmap("s1", classification, "saas", "idea");
    const ids = roadmap.missions.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("first mission is active, rest are pending", () => {
    const roadmap = generateMissionRoadmap("s1", classification, "saas", "idea");
    expect(roadmap.missions[0].status).toBe("active");
    expect(roadmap.missions[0].progress).toBe(10);
    for (let i = 1; i < roadmap.missions.length; i++) {
      expect(roadmap.missions[i].status).toBe("pending");
      expect(roadmap.missions[i].progress).toBe(0);
    }
  });

  it("includes requiredRoles on each mission", () => {
    const roadmap = generateMissionRoadmap("s1", classification, "fintech", "idea");
    for (const m of roadmap.missions) {
      const roles = m.requiredRoles as { role: string; count: number }[];
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
    }
  });
});

describe("Cost Engine", () => {
  it("calculates employee cost with region multiplier", () => {
    const sf = calculateEmployeeCost("CTO", "senior", "san francisco");
    const remote = calculateEmployeeCost("CTO", "senior", "remote");

    expect(sf.allInAnnual).toBeGreaterThan(remote.allInAnnual);
    expect(sf.monthlyBurn).toBe(Math.round(sf.allInAnnual / 12));
    expect(sf.overheadMultiplier).toBe(1.25);
  });

  it("calculates contractor cost with lower overhead", () => {
    const employee = calculateEmployeeCost("Full-stack Engineer", "mid", "new_york", false);
    const contractor = calculateEmployeeCost("Full-stack Engineer", "mid", "new_york", true);

    expect(contractor.overheadMultiplier).toBe(1.05);
    expect(contractor.allInAnnual).toBeLessThan(employee.allInAnnual);
  });

  it("returns fallback for unknown roles", () => {
    const cost = calculateEmployeeCost("Unicorn Trainer", "mid", "remote");
    expect(cost.baseAnnual).toBe(80000);
    expect(cost.allInAnnual).toBeGreaterThan(0);
  });

  it("scales salary by seniority", () => {
    const junior = calculateEmployeeCost("Backend Engineer", "junior", "remote");
    const mid = calculateEmployeeCost("Backend Engineer", "mid", "remote");
    const senior = calculateEmployeeCost("Backend Engineer", "senior", "remote");

    expect(junior.allInAnnual).toBeLessThan(mid.allInAnnual);
    expect(mid.allInAnnual).toBeLessThan(senior.allInAnnual);
  });

  it("estimates hire impact correctly", () => {
    const impact = estimateHireImpact(500000, 50000, 0, "CTO", "senior", "san_francisco");
    expect(impact.newMonthlyBurn).toBeGreaterThan(50000);
    expect(impact.runwayAfter).toBeLessThan(impact.runwayBefore);
    expect(impact.allInAnnual).toBeGreaterThan(0);
  });

  it("returns 999 runway when revenue covers burn", () => {
    const impact = estimateHireImpact(500000, 20000, 50000, "CTO", "senior", "remote");
    expect(impact.runwayBefore).toBe(999);
    expect(impact.runwayAfter).toBe(999);
  });

  it("calculates total burn with all cost categories", () => {
    const estimate = calculateTotalBurn(
      [
        { role: "CTO", seniority: "senior" as SeniorityLevel },
        { role: "Full-stack Engineer", seniority: "mid" as SeniorityLevel },
      ],
      "coworking",
      "saas",
      "seed",
      0
    );

    expect(estimate.payrollMonthly).toBeGreaterThan(0);
    expect(estimate.officeMonthly).toBeGreaterThan(0);
    expect(estimate.operatingCostsMonthly).toBeGreaterThanOrEqual(0);
    expect(estimate.totalMonthlyBurn).toBe(
      estimate.payrollMonthly + estimate.officeMonthly + estimate.operatingCostsMonthly
    );
  });

  it("adds infrastructure burn exactly once in total burn", () => {
    const estimate = calculateTotalBurn(
      [{ role: "CTO", seniority: "senior" as SeniorityLevel }],
      "remote",
      "AI / ML",
      "seed",
      0,
      0,
      5000,
      1200,
      {
        sourceStackId: "ai_heavy_stack",
        version: "test",
        warnings: [],
        explanation: [],
        grossInfrastructureCostsMonthly: 1800,
        aiApiCostsMonthly: 700,
        complianceCostsMonthly: 0,
        cloudCreditsAppliedMonthly: 600,
      }
    );

    expect(estimate.infrastructureCostsMonthly).toBe(1200);
    expect(estimate.aiApiCostsMonthly).toBe(700);
    expect(estimate.cloudCreditsAppliedMonthly).toBe(600);
    expect(estimate.operatingBreakdown.map((item) => item.category)).not.toContain("AI Inference / API");
    expect(estimate.operatingBreakdown.map((item) => item.category)).not.toContain("Cloud Infrastructure");
    expect(estimate.totalMonthlyBurn).toBe(
      estimate.payrollMonthly +
        estimate.officeMonthly +
        estimate.operatingCostsMonthly +
        estimate.missionCostsMonthly +
        estimate.infrastructureCostsMonthly
    );
  });

  it("calculates runway with real cash", () => {
    const result = calculateRunwayWithCosts(
      300000,
      [{ role: "CTO", seniority: "senior" as SeniorityLevel }],
      "remote",
      "saas",
      "seed",
      0
    );

    expect(result.runwayMonths).toBeGreaterThan(0);
    expect(result.runwayMonths).toBeLessThan(999);
    expect(result.estimate.totalMonthlyBurn).toBeGreaterThan(0);
  });
});


describe("Phase 25: Cost Engine Source-of-Truth", () => {
  it("simulateMonth does not double-count team burn", () => {
    const state = {
      cash: 500000,
      monthlyBurn: 30000, // payroll + office already included
      revenue: 5000,
      valuation: 2000000,
      productProgress: 30,
      investorScore: 50,
      marketScore: 50,
      riskScore: 30,
    };

    const decisions = [
      { id: "product_focus", label: "Product Focus", cashCost: 5000, burnDelta: 5000, productDelta: 18, revenueDelta: 0, investorDelta: 2, marketDelta: 0, riskDelta: -1, description: "" },
    ];

    const employees = [
      { id: "1", role: "CTO", seniority: "senior", salary: 25000, status: "active", morale: 70, productivity: 1, effectJson: {}, hiredMonth: 1, skill: "leadership", notes: "" },
    ] as unknown as import("@prisma/client").Employee[];

    // Compare: same monthlyBurn, with vs without employees
    // If double-counting existed, the difference would be ~25k (salary)
    // Without double-counting, diff is only operating cost scaling from 0→1 employees (a few hundred)
    const resultNoEmployees = simulateMonth(state, decisions, null, "SaaS", [], "remote", undefined, 1, undefined, "seed", 0);
    const resultWithEmployee = simulateMonth(state, decisions, null, "SaaS", employees, "remote", undefined, 1, undefined, "seed", 0);

    const diff = resultWithEmployee.burnRate - resultNoEmployees.burnRate;
    expect(diff).toBeLessThan(5000); // Should be ~500-1000, not 25000
    expect(resultWithEmployee.costBreakdown).toBeDefined();
    expect(resultWithEmployee.costBreakdown!.baseBurn).toBe(30000);
    expect(resultWithEmployee.costBreakdown!.operatingCosts).toBeGreaterThan(0);
  });

  it("simulateMonth includes operating costs", () => {
    const state = {
      cash: 500000,
      monthlyBurn: 20000,
      revenue: 10000,
      valuation: 2000000,
      productProgress: 40,
      investorScore: 50,
      marketScore: 50,
      riskScore: 30,
    };

    const result = simulateMonth(state, [], null, "Fintech", [], "remote", undefined, 1, undefined, "seed", 0);

    expect(result.costBreakdown).toBeDefined();
    expect(result.costBreakdown!.operatingCosts).toBeGreaterThan(0);
    expect(result.burnRate).toBeGreaterThan(state.monthlyBurn);
  });

  it("simulateMonth includes mission costs", () => {
    const state = {
      cash: 500000,
      monthlyBurn: 20000,
      revenue: 10000,
      valuation: 2000000,
      productProgress: 40,
      investorScore: 50,
      marketScore: 50,
      riskScore: 30,
    };

    const result = simulateMonth(state, [], null, "SaaS", [], "remote", undefined, 1, undefined, "seed", 5000);

    expect(result.costBreakdown).toBeDefined();
    expect(result.costBreakdown!.missionCosts).toBe(5000);
    expect(result.burnRate).toBeGreaterThan(state.monthlyBurn + result.costBreakdown!.operatingCosts);
  });

  it("simulateMonth includes infrastructure burn once and updates runway through burnRate", () => {
    const state = {
      cash: 120000,
      monthlyBurn: 20000,
      revenue: 0,
      valuation: 2000000,
      productProgress: 40,
      investorScore: 50,
      marketScore: 50,
      riskScore: 30,
    };

    const withInfra = simulateMonth(
      state,
      [],
      null,
      "AI / ML",
      [],
      "remote",
      undefined,
      1,
      undefined,
      "seed",
      0,
      1500,
      {
        grossInfrastructureCosts: 2000,
        aiApiCosts: 900,
        complianceCosts: 0,
        cloudCreditsApplied: 500,
      }
    );

    expect(withInfra.costBreakdown!.infrastructureCosts).toBe(1500);
    expect(withInfra.costBreakdown!.aiApiCosts).toBe(900);
    expect(withInfra.costBreakdown!.total).toBe(withInfra.burnRate);
    expect(withInfra.burnRate).toBe(
      withInfra.costBreakdown!.baseBurn +
        withInfra.costBreakdown!.operatingCosts +
        withInfra.costBreakdown!.missionCosts +
        withInfra.costBreakdown!.infrastructureCosts!
    );
    expect(withInfra.runwayMonths).toBe(Math.floor(withInfra.cashEnd / withInfra.burnRate));
  });

  it("stores baseBurn in costBreakdown correctly", () => {
    const state = {
      cash: 500000,
      monthlyBurn: 25000,
      revenue: 0,
      valuation: 2000000,
      productProgress: 20,
      investorScore: 50,
      marketScore: 50,
      riskScore: 30,
    };

    const result = simulateMonth(state, [], null, "SaaS", [], "remote", undefined, 1, undefined, "idea", 0);

    expect(result.costBreakdown!.baseBurn).toBe(25000);
    expect(result.costBreakdown!.total).toBe(result.burnRate);
  });
});

describe("Phase 25: Mission Library Coverage", () => {
  it("has at least 60 mission templates", () => {
    expect(MISSION_LIBRARY.length).toBeGreaterThanOrEqual(60);
  });

  it("covers all startup types with at least 2 missions via roadmap generation", () => {
    const typeSectorMap: Record<string, string> = {
      ai_saas: "AI / ML",
      ai_infrastructure: "AI / ML",
      fintech: "Fintech",
      remittance: "Fintech",
      web3_protocol: "Web3",
      web3_wallet: "Web3",
      saas_b2b: "SaaS",
      consumer_app: "Consumer",
      marketplace: "E-commerce",
      gaming: "Gaming",
      healthcare_ai: "Healthtech",
      logistics: "Logistics",
      energy: "Energy",
      hardware: "Hardware",
      cybersecurity: "Cybersecurity",
      developer_tools: "Developer Tools",
      enterprise_software: "Enterprise",
    };

    for (const [type, sector] of Object.entries(typeSectorMap)) {
      const classification: StartupClassification = {
        primaryStartupType: type as import("@/lib/missions/types").StartupTypeId,
        secondaryTypes: [],
        complexityLevel: 5,
        capitalIntensity: 5,
        regulatoryIntensity: 5,
        technicalIntensity: 5,
        salesIntensity: 5,
        hiringIntensity: 5,
        missionArchetype: "Test",
        explanation: "Test",
      };
      const roadmap = generateMissionRoadmap("test-id", classification, sector, "seed");
      expect(roadmap.missions.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("covers previously zero-coverage sectors via roadmap generation", () => {
    const classification = (type: string): StartupClassification => ({
      primaryStartupType: type as import("@/lib/missions/types").StartupTypeId,
      secondaryTypes: [],
      complexityLevel: 5,
      capitalIntensity: 5,
      regulatoryIntensity: 5,
      technicalIntensity: 5,
      salesIntensity: 5,
      hiringIntensity: 5,
      missionArchetype: "Test",
      explanation: "Test",
    });

    const logistics = generateMissionRoadmap("test", classification("logistics"), "Logistics", "seed");
    const energy = generateMissionRoadmap("test", classification("energy"), "Energy", "seed");
    const hardware = generateMissionRoadmap("test", classification("hardware"), "Hardware", "seed");
    const devtools = generateMissionRoadmap("test", classification("developer_tools"), "Developer Tools", "seed");

    expect(logistics.missions.length).toBeGreaterThanOrEqual(4);
    expect(energy.missions.length).toBeGreaterThanOrEqual(4);
    expect(hardware.missions.length).toBeGreaterThanOrEqual(4);
    expect(devtools.missions.length).toBeGreaterThanOrEqual(4);
  });

  it("has no duplicate mission IDs", () => {
    const ids = MISSION_LIBRARY.map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe("Phase 25: Mission Coach", () => {
  it("generates deterministic coaching with role gaps", () => {
    const coach = generateDeterministicMissionCoach({
      missionTitle: "Test Mission",
      missionCategory: "product",
      missionProgress: 20,
      requiredRoles: ["CTO", "Backend Engineer"],
      filledRoles: ["CTO"],
      roleGaps: ["Backend Engineer"],
      recentDecisions: [],
      teamSize: 1,
      cash: 300000,
      runwayMonths: 6,
      sector: "SaaS",
      stage: "seed",
    });

    expect(coach.tips.length).toBeGreaterThan(0);
    expect(coach.priorityTip).toContain("Backend Engineer");
    expect(coach.tips.some((t) => t.includes("foundational"))).toBe(true);
  });

  it("includes category-specific tips", () => {
    const securityCoach = generateDeterministicMissionCoach({
      missionTitle: "Security Audit",
      missionCategory: "security",
      missionProgress: 50,
      requiredRoles: [],
      filledRoles: [],
      roleGaps: [],
      recentDecisions: [],
      teamSize: 3,
      cash: 400000,
      runwayMonths: 8,
      sector: "SaaS",
      stage: "seed",
    });

    expect(securityCoach.tips.some((t) => t.includes("vulnerabilities"))).toBe(true);
  });

  it("warns about short runway", () => {
    const coach = generateDeterministicMissionCoach({
      missionTitle: "Test",
      missionCategory: "engineering",
      missionProgress: 50,
      requiredRoles: [],
      filledRoles: [],
      roleGaps: [],
      recentDecisions: [],
      teamSize: 2,
      cash: 100000,
      runwayMonths: 2,
      sector: "SaaS",
      stage: "seed",
    });

    expect(coach.tips.some((t) => t.includes("runway"))).toBe(true);
  });
});
