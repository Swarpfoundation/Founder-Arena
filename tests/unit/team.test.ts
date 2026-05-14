import { describe, it, expect } from "vitest";
import { generateCandidates } from "@/lib/team/candidates";
import {
  calculateTeamMonthlyCost,
  calculateTeamProductivity,
  calculateTeamMorale,
  calculateEmployeeSimulationModifiers,
  applyTeamEffectsToSimulation,
  canAffordHire,
  calculateHiringCapacity,
  checkResignationRisk,
  getOfficeSetup,
} from "@/lib/team/effects";
import { Candidate } from "@/lib/team/types";
import { Employee } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "emp-1",
    startupId: "s1",
    name: "Alex Chen",
    role: "Full-stack Engineer",
    level: "mid",
    seniority: "mid",
    salary: 15000,
    skill: "engineering",
    morale: 70,
    status: "active",
    hiredMonth: 1,
    firedMonth: null,
    hiredAt: new Date(),
    firedAt: null,
    productivity: new Decimal(1.0),
    effectJson: null,
    notes: null,
    createdAt: new Date(),
    ...overrides,
  } as Employee;
}

describe("generateCandidates", () => {
  it("generates deterministic candidates for same seed", () => {
    const c1 = generateCandidates("startup-a", 1, "SaaS");
    const c2 = generateCandidates("startup-a", 1, "SaaS");
    expect(c1).toHaveLength(5);
    expect(c2).toHaveLength(5);
    expect(c1.map((c) => c.id)).toEqual(c2.map((c) => c.id));
    expect(c1.map((c) => c.name)).toEqual(c2.map((c) => c.name));
  });

  it("generates different candidates for different months", () => {
    const c1 = generateCandidates("startup-a", 1, "SaaS");
    const c2 = generateCandidates("startup-a", 2, "SaaS");
    expect(c1.map((c) => c.id)).not.toEqual(c2.map((c) => c.id));
  });

  it("generates candidates with valid salaries", () => {
    const candidates = generateCandidates("s1", 1, "Fintech");
    for (const c of candidates) {
      expect(c.salary).toBeGreaterThan(0);
      expect(c.salary).toBeLessThan(50000);
      expect(["junior", "mid", "senior", "lead"]).toContain(c.seniority);
    }
  });

  it("applies sector-specific salary modifiers", () => {
    const aiCandidates = generateCandidates("s1", 1, "AI / ML");
    const normalCandidates = generateCandidates("s1", 1, "SaaS");
    const aiEngineer = aiCandidates.find((c) => c.skill === "ai");
    const normalEngineer = normalCandidates.find((c) => c.skill === "ai");
    if (aiEngineer && normalEngineer) {
      expect(aiEngineer.salary).toBeGreaterThanOrEqual(normalEngineer.salary);
    }
  });
});

describe("calculateTeamMonthlyCost", () => {
  it("sums payroll and office cost", () => {
    const employees = [makeEmployee({ salary: 10000 }), makeEmployee({ salary: 15000 })];
    const cost = calculateTeamMonthlyCost(employees, 3000);
    expect(cost).toBe(28000);
  });

  it("ignores fired employees", () => {
    const employees = [
      makeEmployee({ salary: 10000, status: "active" }),
      makeEmployee({ salary: 15000, status: "fired" }),
    ];
    const cost = calculateTeamMonthlyCost(employees, 0);
    expect(cost).toBe(10000);
  });

  it("returns office cost only with no employees", () => {
    expect(calculateTeamMonthlyCost([], 5000)).toBe(5000);
  });
});

describe("calculateTeamProductivity", () => {
  it("returns 1.0 for empty team", () => {
    const setup = getOfficeSetup("remote");
    expect(calculateTeamProductivity([], setup)).toBe(1.0);
  });

  it("increases with office quality", () => {
    const emp = makeEmployee({ productivity: new Decimal(1.2), morale: 80 });
    const remote = calculateTeamProductivity([emp], getOfficeSetup("remote"));
    const premium = calculateTeamProductivity([emp], getOfficeSetup("premium_office"));
    expect(premium).toBeGreaterThan(remote);
  });
});

describe("calculateTeamMorale", () => {
  it("returns 70 for empty team", () => {
    expect(calculateTeamMorale([], getOfficeSetup("remote"))).toBe(70);
  });

  it("is boosted by premium office", () => {
    const emp = makeEmployee({ morale: 60 });
    const remote = calculateTeamMorale([emp], getOfficeSetup("remote"));
    const premium = calculateTeamMorale([emp], getOfficeSetup("premium_office"));
    expect(premium).toBeGreaterThan(remote);
  });
});

describe("calculateEmployeeSimulationModifiers", () => {
  it("returns zeros for empty team", () => {
    const mods = calculateEmployeeSimulationModifiers([]);
    expect(mods.monthlyPayroll).toBe(0);
    expect(mods.productDelta).toBe(0);
    expect(mods.revenueDelta).toBe(0);
  });

  it("aggregates product impact for engineers", () => {
    const emp = makeEmployee({ role: "Full-stack Engineer", effectJson: { productImpact: 5, revenueImpact: 0, riskImpact: 0, investorImpact: 0 } });
    const mods = calculateEmployeeSimulationModifiers([emp]);
    expect(mods.productDelta).toBe(5);
  });

  it("aggregates revenue impact for sales", () => {
    const emp = makeEmployee({ role: "Sales Lead", effectJson: { productImpact: 0, revenueImpact: 8, riskImpact: 0, investorImpact: 0 } });
    const mods = calculateEmployeeSimulationModifiers([emp]);
    expect(mods.revenueDelta).toBe(8);
  });

  it("uses default effects when effectJson is null", () => {
    const eng = makeEmployee({ role: "Full-stack Engineer", effectJson: null });
    const sales = makeEmployee({ role: "Sales Lead", effectJson: null });
    const mods = calculateEmployeeSimulationModifiers([eng, sales]);
    expect(mods.productDelta).toBeGreaterThan(0);
    expect(mods.revenueDelta).toBeGreaterThan(0);
  });
});

describe("applyTeamEffectsToSimulation", () => {
  it("includes payroll and office cost in burnDelta", () => {
    const emp = makeEmployee({ salary: 10000 });
    const setup = getOfficeSetup("coworking");
    const effects = applyTeamEffectsToSimulation([emp], setup, 100000, 10);
    expect(effects.burnDelta).toBe(13000); // 10000 + 3000
    expect(effects.officeCost).toBe(3000);
  });

  it("increases risk when runway is low", () => {
    const emp = makeEmployee();
    const setup = getOfficeSetup("remote");
    const lowRunway = applyTeamEffectsToSimulation([emp], setup, 10000, 2);
    const highRunway = applyTeamEffectsToSimulation([emp], setup, 100000, 12);
    expect(lowRunway.riskDelta).toBeGreaterThan(highRunway.riskDelta);
  });

  it("reduces revenue when morale is low", () => {
    const emp = makeEmployee({ morale: 30, effectJson: { productImpact: 0, revenueImpact: 10, riskImpact: 0, investorImpact: 0 } });
    const setup = getOfficeSetup("remote");
    const effects = applyTeamEffectsToSimulation([emp], setup, 100000, 12);
    expect(effects.revenueDelta).toBeLessThan(10);
  });
});

describe("canAffordHire", () => {
  it("blocks hire that reduces runway below 2 months", () => {
    const result = canAffordHire({ cash: 30000, monthlyBurn: 10000 }, 20000);
    expect(result.canAfford).toBe(false);
    expect(result.warning).toContain("2 months");
  });

  it("warns when runway drops below 4 months", () => {
    const result = canAffordHire({ cash: 50000, monthlyBurn: 10000 }, 5000);
    expect(result.canAfford).toBe(true);
    expect(result.warning).toContain("4 months");
  });

  it("allows hire with healthy runway", () => {
    const result = canAffordHire({ cash: 200000, monthlyBurn: 10000 }, 10000);
    expect(result.canAfford).toBe(true);
    expect(result.warning).toBeUndefined();
  });
});

describe("calculateHiringCapacity", () => {
  it("caps at 12 total employees", () => {
    const employees = Array.from({ length: 10 }, (_, i) => makeEmployee({ id: `e${i}` }));
    const capacity = calculateHiringCapacity({ cash: 1000000, monthlyBurn: 10000, employees });
    expect(capacity).toBe(2);
  });

  it("returns 0 at capacity", () => {
    const employees = Array.from({ length: 12 }, (_, i) => makeEmployee({ id: `e${i}` }));
    const capacity = calculateHiringCapacity({ cash: 1000000, monthlyBurn: 10000, employees });
    expect(capacity).toBe(0);
  });

  it("reduces capacity when cash is very tight", () => {
    const employees = Array.from({ length: 4 }, (_, i) => makeEmployee({ id: `e${i}` }));
    const capacity = calculateHiringCapacity({ cash: 10000, monthlyBurn: 10000, employees });
    expect(capacity).toBeLessThan(8);
  });
});

describe("checkResignationRisk", () => {
  it("returns null for happy team", () => {
    const emp = makeEmployee({ morale: 80 });
    expect(checkResignationRisk([emp], 12)).toBeNull();
  });

  it("flags employee with very low morale", () => {
    const emp = makeEmployee({ morale: 30 });
    const risk = checkResignationRisk([emp], 12);
    expect(risk).not.toBeNull();
    expect(risk!.name).toBe("Alex Chen");
  });

  it("flags employee with low morale and short runway", () => {
    const emp = makeEmployee({ morale: 45 });
    const risk = checkResignationRisk([emp], 2);
    expect(risk).not.toBeNull();
  });
});

describe("getOfficeSetup", () => {
  it("returns remote as default for unknown type", () => {
    const setup = getOfficeSetup("unknown");
    expect(setup.type).toBe("remote");
  });

  it("returns correct setup for each type", () => {
    expect(getOfficeSetup("coworking").monthlyCost).toBe(3000);
    expect(getOfficeSetup("small_office").monthlyCost).toBe(8000);
    expect(getOfficeSetup("premium_office").monthlyCost).toBe(20000);
  });
});
