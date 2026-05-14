import { Employee } from "@prisma/client";
import { TeamEffect, OfficeSetup } from "./types";

export const OFFICE_SETUPS: OfficeSetup[] = [
  {
    type: "remote",
    label: "Remote First",
    monthlyCost: 0,
    moraleModifier: -0.05,
    productivityModifier: 0.95,
    description: "Zero office cost. Slightly lower morale and productivity. Good hiring flexibility.",
  },
  {
    type: "coworking",
    label: "Coworking Space",
    monthlyCost: 3000,
    moraleModifier: 0.05,
    productivityModifier: 1.05,
    description: "Moderate cost. Boosts morale and productivity with networking opportunities.",
  },
  {
    type: "small_office",
    label: "Small Office",
    monthlyCost: 8000,
    moraleModifier: 0.1,
    productivityModifier: 1.1,
    description: "Higher cost. Stronger productivity and team cohesion.",
  },
  {
    type: "premium_office",
    label: "Premium Office",
    monthlyCost: 20000,
    moraleModifier: 0.15,
    productivityModifier: 1.15,
    description: "Very high cost. Sends strong investor signal but dangerous burn.",
  },
];

export function getOfficeSetup(type: string): OfficeSetup {
  return OFFICE_SETUPS.find((o) => o.type === type) ?? OFFICE_SETUPS[0];
}

export function calculateTeamMonthlyCost(employees: Employee[], officeMonthlyCost: number): number {
  const payroll = employees
    .filter((e) => e.status === "active")
    .reduce((sum, e) => sum + e.salary, 0);
  return payroll + officeMonthlyCost;
}

export function calculateTeamProductivity(employees: Employee[], officeSetup: OfficeSetup): number {
  const active = employees.filter((e) => e.status === "active");
  if (active.length === 0) return 1.0;

  const baseProductivity = active.reduce((sum, e) => sum + Number(e.productivity), 0) / active.length;
  const moraleFactor = calculateTeamMorale(employees, officeSetup) / 100;
  return Math.round((baseProductivity * officeSetup.productivityModifier * (0.8 + moraleFactor * 0.4)) * 100) / 100;
}

export function calculateTeamMorale(employees: Employee[], officeSetup: OfficeSetup): number {
  const active = employees.filter((e) => e.status === "active");
  if (active.length === 0) return 70;

  const baseMorale = active.reduce((sum, e) => sum + e.morale, 0) / active.length;
  const officeBoost = officeSetup.moraleModifier * 100;
  return Math.min(100, Math.max(0, Math.round(baseMorale + officeBoost)));
}

export function calculateEmployeeSimulationModifiers(employees: Employee[]): TeamEffect {
  const active = employees.filter((e) => e.status === "active");

  if (active.length === 0) {
    return {
      monthlyPayroll: 0,
      officeCost: 0,
      productivityModifier: 1.0,
      moraleModifier: 0,
      productDelta: 0,
      revenueDelta: 0,
      riskDelta: 0,
      investorDelta: 0,
      burnDelta: 0,
    };
  }

  const monthlyPayroll = active.reduce((sum, e) => sum + e.salary, 0);

  let productDelta = 0;
  let revenueDelta = 0;
  let riskDelta = 0;
  let investorDelta = 0;

  for (const e of active) {
    const effects = e.effectJson as Record<string, number> | null;
    if (effects) {
      productDelta += effects.productImpact ?? 0;
      revenueDelta += effects.revenueImpact ?? 0;
      riskDelta += effects.riskImpact ?? 0;
      investorDelta += effects.investorImpact ?? 0;
    } else {
      // Default effects based on role
      if (["Full-stack Engineer", "Backend Engineer", "Frontend Engineer", "AI Engineer"].includes(e.role)) {
        productDelta += 3;
      }
      if (["Sales Lead", "Marketing Manager", "Customer Support"].includes(e.role)) {
        revenueDelta += 2;
      }
      if (["Compliance Advisor", "Security Engineer"].includes(e.role)) {
        riskDelta -= 2;
      }
      if (["CTO", "Finance/Ops Manager"].includes(e.role)) {
        investorDelta += 1;
      }
      if (["Product Designer"].includes(e.role)) {
        productDelta += 2;
      }
    }
  }

  return {
    monthlyPayroll,
    officeCost: 0,
    productivityModifier: 1.0,
    moraleModifier: 0,
    productDelta,
    revenueDelta,
    riskDelta,
    investorDelta,
    burnDelta: monthlyPayroll,
  };
}

export function applyTeamEffectsToSimulation(
  employees: Employee[],
  officeSetup: OfficeSetup,
  cash: number,
  runway: number
): TeamEffect {
  const modifiers = calculateEmployeeSimulationModifiers(employees);
  const morale = calculateTeamMorale(employees, officeSetup);
  const productivity = calculateTeamProductivity(employees, officeSetup);

  // Low runway hurts morale and increases risk
  let riskDelta = modifiers.riskDelta;
  let investorDelta = modifiers.investorDelta;
  if (runway <= 3) {
    riskDelta += 3;
    investorDelta -= 2;
  }

  // Low morale hurts productivity and revenue
  let revenueDelta = modifiers.revenueDelta;
  if (morale < 40) {
    revenueDelta = Math.round(revenueDelta * 0.7);
  }

  return {
    monthlyPayroll: modifiers.monthlyPayroll,
    officeCost: officeSetup.monthlyCost,
    productivityModifier: productivity,
    moraleModifier: morale,
    productDelta: Math.round(modifiers.productDelta * productivity),
    revenueDelta,
    riskDelta,
    investorDelta,
    burnDelta: modifiers.monthlyPayroll + officeSetup.monthlyCost,
  };
}

export function calculateHiringCapacity(startup: {
  cash: number;
  monthlyBurn: number;
  employees: Employee[];
}): number {
  const activeCount = startup.employees.filter((e) => e.status === "active").length;
  // Can hire up to 8 people, fewer if cash is tight
  const cashCapacity = Math.floor(startup.cash / Math.max(startup.monthlyBurn, 1));
  if (cashCapacity < 2) return Math.max(0, 8 - activeCount);
  return Math.max(0, 12 - activeCount);
}

export function canAffordHire(
  startup: { cash: number; monthlyBurn: number },
  candidateSalary: number
): { canAfford: boolean; warning?: string } {
  const projectedBurn = startup.monthlyBurn + candidateSalary;
  const projectedRunway = startup.cash / Math.max(projectedBurn, 1);

  if (projectedRunway < 2) {
    return { canAfford: false, warning: "Hiring would reduce runway below 2 months." };
  }
  if (projectedRunway < 4) {
    return { canAfford: true, warning: "Warning: runway will drop below 4 months." };
  }
  return { canAfford: true };
}

export function checkResignationRisk(employees: Employee[], runway: number): Employee | null {
  const active = employees.filter((e) => e.status === "active");
  if (active.length === 0) return null;

  // Low morale + low runway = resignation risk
  const atRisk = active.filter((e) => e.morale < 35 || (runway <= 2 && e.morale < 50));
  if (atRisk.length === 0) return null;

  // Deterministic: pick the one with lowest morale
  return atRisk.reduce((lowest, e) => (e.morale < lowest.morale ? e : lowest));
}
