/**
 * Founder Arena — Economy / Cost Engine Types
 */

export type SeniorityLevel = "junior" | "mid" | "senior" | "lead";

export interface SalaryBand {
  role: string;
  junior: number; // annual all-in USD
  mid: number;
  senior: number;
  lead: number;
  skill: string;
  productImpact: number;
  revenueImpact: number;
  riskImpact: number;
  investorImpact: number;
}

export interface RegionMultiplier {
  region: string;
  multiplier: number;
  label: string;
}

export interface OfficeCost {
  type: string;
  label: string;
  monthlyCost: number;
  moraleModifier: number;
  productivityModifier: number;
  description: string;
}

export interface OperatingCostCategory {
  id: string;
  label: string;
  monthlyBase: number;
  sectorMultipliers: Record<string, number>;
  stageMultipliers: Record<string, number>;
  scalingFactor: "revenue" | "users" | "team_size" | "fixed";
}

export interface CostBreakdown {
  role: string;
  seniority: SeniorityLevel;
  baseAnnual: number;
  regionMultiplier: number;
  marketPressureMultiplier: number;
  overheadMultiplier: number;
  allInAnnual: number;
  monthlyBurn: number;
}

export interface TotalCostEstimate {
  payrollMonthly: number;
  officeMonthly: number;
  operatingCostsMonthly: number;
  missionCostsMonthly: number;
  totalMonthlyBurn: number;
  runwayMonths: number;
  breakdown: CostBreakdown[];
  operatingBreakdown: { category: string; amount: number }[];
}
