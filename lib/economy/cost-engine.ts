/**
 * Founder Arena — Cost Engine
 *
 * Calculates realistic all-in employee costs, total burn, and runway.
 */

import { CostBreakdown, TotalCostEstimate, SeniorityLevel } from "./types";
import { getSalaryBand } from "./salary-bands";
import { getRegionMultiplier } from "./region-multipliers";
import { getOfficeCost } from "./office-costs";
import { getOperatingCosts } from "./operating-costs";

const DEFAULT_OVERHEAD = 1.25;
const CONTRACTOR_OVERHEAD = 1.05;
const MARKET_PRESSURE_NEUTRAL = 1.0;

export function calculateEmployeeCost(
  role: string,
  seniority: SeniorityLevel,
  region: string,
  isContractor = false
): CostBreakdown {
  const band = getSalaryBand(role);
  if (!band) {
    return {
      role,
      seniority,
      baseAnnual: 80000,
      regionMultiplier: getRegionMultiplier(region),
      marketPressureMultiplier: MARKET_PRESSURE_NEUTRAL,
      overheadMultiplier: DEFAULT_OVERHEAD,
      allInAnnual: Math.round(80000 * getRegionMultiplier(region) * DEFAULT_OVERHEAD),
      monthlyBurn: Math.round((80000 * getRegionMultiplier(region) * DEFAULT_OVERHEAD) / 12),
    };
  }

  const baseAnnual = band[seniority] ?? band.mid;
  const regionMult = getRegionMultiplier(region);
  const overhead = isContractor ? CONTRACTOR_OVERHEAD : DEFAULT_OVERHEAD;
  const allInAnnual = Math.round(baseAnnual * regionMult * overhead);
  const monthlyBurn = Math.round(allInAnnual / 12);

  return {
    role,
    seniority,
    baseAnnual,
    regionMultiplier: regionMult,
    marketPressureMultiplier: MARKET_PRESSURE_NEUTRAL,
    overheadMultiplier: overhead,
    allInAnnual,
    monthlyBurn,
  };
}

export function calculateTotalBurn(
  employees: { role: string; seniority: SeniorityLevel; region?: string }[],
  officeType: string,
  sector: string,
  stage: string,
  revenue: number,
  missionCostDelta = 0,
  userCount?: number
): TotalCostEstimate {
  const region = employees[0]?.region ?? "remote";

  const breakdown: CostBreakdown[] = employees.map((e) =>
    calculateEmployeeCost(e.role, e.seniority, region)
  );

  const payrollMonthly = breakdown.reduce((sum, b) => sum + b.monthlyBurn, 0);
  const office = getOfficeCost(officeType);
  const officeMonthly = office.monthlyCost;

  const operatingBreakdown = getOperatingCosts(
    sector,
    stage,
    employees.length,
    revenue,
    userCount
  );
  const operatingCostsMonthly = operatingBreakdown.reduce((sum, b) => sum + b.amount, 0);

  const totalMonthlyBurn = payrollMonthly + officeMonthly + operatingCostsMonthly + missionCostDelta;

  // Calculate runway based on cash vs total burn — this is just a structural estimate.
  // Actual runway requires cash input from caller.
  return {
    payrollMonthly,
    officeMonthly,
    operatingCostsMonthly,
    missionCostsMonthly: missionCostDelta,
    totalMonthlyBurn,
    runwayMonths: 0, // caller should override with real cash / burn
    breakdown,
    operatingBreakdown,
  };
}

export function calculateRunwayWithCosts(
  cash: number,
  employees: { role: string; seniority: SeniorityLevel; region?: string }[],
  officeType: string,
  sector: string,
  stage: string,
  revenue: number,
  missionCostDelta = 0,
  userCount?: number
): { runwayMonths: number; estimate: TotalCostEstimate } {
  const estimate = calculateTotalBurn(
    employees,
    officeType,
    sector,
    stage,
    revenue,
    missionCostDelta,
    userCount
  );

  const netBurn = estimate.totalMonthlyBurn - revenue;
  const runwayMonths = netBurn > 0 ? Math.floor(cash / netBurn) : 999;

  return {
    runwayMonths,
    estimate: { ...estimate, runwayMonths },
  };
}

export function estimateHireImpact(
  cash: number,
  currentBurn: number,
  revenue: number,
  role: string,
  seniority: SeniorityLevel,
  region: string
): {
  newMonthlyBurn: number;
  runwayBefore: number;
  runwayAfter: number;
  allInAnnual: number;
  monthlyBurn: number;
} {
  const cost = calculateEmployeeCost(role, seniority, region);
  const newMonthlyBurn = currentBurn + cost.monthlyBurn;
  const runwayBefore = revenue >= currentBurn ? 999 : Math.floor(cash / Math.max(currentBurn - revenue, 1));
  const runwayAfter = revenue >= newMonthlyBurn ? 999 : Math.floor(cash / Math.max(newMonthlyBurn - revenue, 1));

  return {
    newMonthlyBurn,
    runwayBefore,
    runwayAfter,
    allInAnnual: cost.allInAnnual,
    monthlyBurn: cost.monthlyBurn,
  };
}
