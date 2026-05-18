/**
 * Founder Arena — Operating Cost Categories
 *
 * Sector-specific monthly operating costs beyond payroll and office.
 */

import { OperatingCostCategory } from "./types";

export const OPERATING_COST_CATEGORIES: OperatingCostCategory[] = [
  {
    id: "ai_inference",
    label: "AI Inference / API",
    monthlyBase: 5000,
    sectorMultipliers: { "AI / ML": 3.0, "Healthtech": 1.5, SaaS: 1.2 },
    stageMultipliers: { idea: 0.3, pre_seed: 0.8, seed: 1.5, series_a: 3.0 },
    scalingFactor: "users",
  },
  {
    id: "cloud_infra",
    label: "Cloud Infrastructure",
    monthlyBase: 3000,
    sectorMultipliers: { "AI / ML": 2.0, Gaming: 1.8, SaaS: 1.5, Fintech: 1.3 },
    stageMultipliers: { idea: 0.2, pre_seed: 0.5, seed: 1.0, series_a: 2.5 },
    scalingFactor: "users",
  },
  {
    id: "data_labeling",
    label: "Data Labeling / Evaluation",
    monthlyBase: 2000,
    sectorMultipliers: { "AI / ML": 3.0, Healthtech: 2.0, ComputerVision: 2.5 },
    stageMultipliers: { idea: 0.5, pre_seed: 1.0, seed: 1.5, series_a: 2.0 },
    scalingFactor: "team_size",
  },
  {
    id: "mlops_tooling",
    label: "MLOps / Dev Tooling",
    monthlyBase: 1500,
    sectorMultipliers: { "AI / ML": 2.5, SaaS: 1.5, Fintech: 1.2 },
    stageMultipliers: { idea: 0.3, pre_seed: 0.8, seed: 1.2, series_a: 2.0 },
    scalingFactor: "team_size",
  },
  {
    id: "compliance_legal",
    label: "Compliance / Legal",
    monthlyBase: 4000,
    sectorMultipliers: { Fintech: 3.0, Healthtech: 2.5, "AI / ML": 1.5 },
    stageMultipliers: { idea: 0.2, pre_seed: 0.5, seed: 1.0, series_a: 2.0 },
    scalingFactor: "fixed",
  },
  {
    id: "kyc_kyb",
    label: "KYC / KYB Provider",
    monthlyBase: 2000,
    sectorMultipliers: { Fintech: 3.0, Remittance: 2.5, Web3: 1.5 },
    stageMultipliers: { idea: 0.1, pre_seed: 0.5, seed: 1.0, series_a: 2.0 },
    scalingFactor: "users",
  },
  {
    id: "security_audit",
    label: "Security Audit / Pentest",
    monthlyBase: 3000,
    sectorMultipliers: { Fintech: 2.0, Healthtech: 2.0, Web3: 2.5, Cybersecurity: 3.0 },
    stageMultipliers: { idea: 0.2, pre_seed: 0.5, seed: 1.0, series_a: 2.0 },
    scalingFactor: "fixed",
  },
  {
    id: "smart_contract_audit",
    label: "Smart Contract Audit",
    monthlyBase: 5000,
    sectorMultipliers: { Web3: 3.0, Fintech: 1.2 },
    stageMultipliers: { idea: 0.1, pre_seed: 0.3, seed: 1.0, series_a: 2.0 },
    scalingFactor: "fixed",
  },
  {
    id: "rpc_indexing",
    label: "RPC / Indexing",
    monthlyBase: 1500,
    sectorMultipliers: { Web3: 3.0, Fintech: 1.2 },
    stageMultipliers: { idea: 0.2, pre_seed: 0.5, seed: 1.0, series_a: 2.0 },
    scalingFactor: "users",
  },
  {
    id: "marketing_ads",
    label: "Marketing / Paid Ads",
    monthlyBase: 5000,
    sectorMultipliers: { Consumer: 2.0, Gaming: 2.5, Ecommerce: 2.0, SaaS: 1.5 },
    stageMultipliers: { idea: 0.1, pre_seed: 0.5, seed: 1.5, series_a: 3.0 },
    scalingFactor: "revenue",
  },
  {
    id: "sales_tools",
    label: "Sales Tools / CRM",
    monthlyBase: 1000,
    sectorMultipliers: { Enterprise: 2.0, SaaS: 1.5, Fintech: 1.3 },
    stageMultipliers: { idea: 0.1, pre_seed: 0.3, seed: 1.0, series_a: 2.0 },
    scalingFactor: "team_size",
  },
  {
    id: "analytics",
    label: "Analytics / BI",
    monthlyBase: 800,
    sectorMultipliers: { "AI / ML": 1.5, SaaS: 1.3, Fintech: 1.2 },
    stageMultipliers: { idea: 0.2, pre_seed: 0.5, seed: 1.0, series_a: 2.0 },
    scalingFactor: "users",
  },
  {
    id: "customer_support_tooling",
    label: "Customer Support Tooling",
    monthlyBase: 600,
    sectorMultipliers: { Consumer: 1.5, SaaS: 1.3, Gaming: 1.5 },
    stageMultipliers: { idea: 0.1, pre_seed: 0.3, seed: 1.0, series_a: 2.0 },
    scalingFactor: "users",
  },
];

export function getOperatingCosts(
  sector: string,
  stage: string,
  teamSize: number,
  revenue: number,
  userCount: number = 0,
  options: { excludeInfrastructureLikeCosts?: boolean } = {}
): { category: string; amount: number }[] {
  const results: { category: string; amount: number }[] = [];
  const infrastructureLikeCategories = new Set(["ai_inference", "cloud_infra"]);

  for (const cat of OPERATING_COST_CATEGORIES) {
    if (options.excludeInfrastructureLikeCosts && infrastructureLikeCategories.has(cat.id)) {
      continue;
    }

    const sectorNorm = sector.toLowerCase();
    const stageNorm = stage.toLowerCase().replace("-", "_");

    let sectorMult = 1.0;
    for (const [key, val] of Object.entries(cat.sectorMultipliers)) {
      if (sectorNorm.includes(key.toLowerCase())) {
        sectorMult = Math.max(sectorMult, val);
      }
    }

    let stageMult = 1.0;
    for (const [key, val] of Object.entries(cat.stageMultipliers)) {
      if (stageNorm.includes(key.toLowerCase())) {
        stageMult = Math.max(stageMult, val);
      }
    }

    let scaleMult = 1.0;
    switch (cat.scalingFactor) {
      case "users":
        scaleMult = 1 + Math.log10(Math.max(userCount, 10)) * 0.15;
        break;
      case "team_size":
        scaleMult = 1 + teamSize * 0.08;
        break;
      case "revenue":
        scaleMult = 1 + Math.log10(Math.max(revenue, 1000)) * 0.1;
        break;
      case "fixed":
      default:
        scaleMult = 1;
        break;
    }

    const amount = Math.round(cat.monthlyBase * sectorMult * stageMult * scaleMult);
    if (amount > 0) {
      results.push({ category: cat.label, amount });
    }
  }

  return results;
}

export function getTotalOperatingCosts(
  sector: string,
  stage: string,
  teamSize: number,
  revenue: number,
  userCount?: number,
  options: { excludeInfrastructureLikeCosts?: boolean } = {}
): number {
  const breakdown = getOperatingCosts(sector, stage, teamSize, revenue, userCount, options);
  return breakdown.reduce((sum, b) => sum + b.amount, 0);
}
