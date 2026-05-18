import { calculateTotalBurn } from "@/lib/economy/cost-engine";
import type { SeniorityLevel, TotalCostEstimate } from "@/lib/economy/types";
import {
  calculateRuntimeInfrastructureBurn,
  type CloudCreditBalance,
  type InfrastructurePreviewInput,
  type RuntimeInfrastructureBurnResult,
} from "@/lib/infrastructure";

export interface InfraBalanceScenario {
  id: string;
  title: string;
  input: InfrastructurePreviewInput;
  selectedStackId?: string;
  creditBalances?: CloudCreditBalance[];
  employees: { role: string; seniority: SeniorityLevel; region?: string }[];
  officeType: string;
  missionCostDelta?: number;
  expected: {
    recommendedStacks?: string[];
    maxEffectiveInfraBurn?: number;
    minEffectiveInfraBurn?: number;
    requiresAiBurn?: boolean;
    requiresComplianceBurn?: boolean;
    requiresCreditWarning?: boolean;
  };
}

export interface InfraBalanceEvaluation {
  scenario: InfraBalanceScenario;
  runtime: RuntimeInfrastructureBurnResult;
  totalWithoutInfra: TotalCostEstimate;
  totalWithInfra: TotalCostEstimate;
  netInfraImpact: number;
}

export const INFRA_BALANCE_SCENARIOS: InfraBalanceScenario[] = [
  {
    id: "cheap_prototype",
    title: "Cheap Prototype",
    selectedStackId: "cheap_static_landing",
    input: {
      startup: {
        id: "cheap-prototype",
        sector: "consumer app",
        stage: "idea",
        status: "funded",
        description: "Static landing page testing consumer demand",
        productProgress: 6,
        revenue: 0,
      },
      simulationHistory: [],
      currentSprint: 1,
    },
    employees: [{ role: "Founder", seniority: "lead", region: "remote" }],
    officeType: "remote",
    expected: {
      recommendedStacks: ["replit_mvp", "cheap_static_landing"],
      maxEffectiveInfraBurn: 100,
    },
  },
  {
    id: "standard_saas_mvp",
    title: "Standard SaaS MVP",
    selectedStackId: "vercel_serverless",
    input: {
      startup: {
        id: "standard-saas",
        sector: "SaaS",
        stage: "seed",
        status: "active",
        monetizationModel: "subscription",
        description: "B2B workflow SaaS for sales operations",
        productProgress: 48,
        revenue: 12_000,
      },
      simulationHistory: [{ monthNumber: 1, userGrowth: 1200 }],
      currentSprint: 4,
    },
    employees: [
      { role: "Founder", seniority: "lead", region: "remote" },
      { role: "Full-Stack Engineer", seniority: "mid", region: "remote" },
    ],
    officeType: "remote",
    expected: {
      recommendedStacks: ["vercel_serverless", "render_full_stack", "supabase_neon_db"],
      minEffectiveInfraBurn: 100,
      maxEffectiveInfraBurn: 1500,
    },
  },
  {
    id: "db_heavy_fintech",
    title: "DB-Heavy SaaS / Fintech",
    selectedStackId: "supabase_neon_db",
    input: {
      startup: {
        id: "db-fintech",
        sector: "fintech",
        stage: "seed",
        status: "active",
        monetizationModel: "payments",
        description: "Payment records workflow and analytics database for finance teams",
        productProgress: 62,
        revenue: 28_000,
      },
      simulationHistory: [{ monthNumber: 4, userGrowth: 8500 }],
      currentSprint: 5,
    },
    employees: [
      { role: "Founder", seniority: "lead", region: "remote" },
      { role: "Backend Engineer", seniority: "senior", region: "remote" },
      { role: "Compliance Lead", seniority: "mid", region: "remote" },
    ],
    officeType: "remote",
    expected: {
      recommendedStacks: ["supabase_neon_db", "render_full_stack"],
      requiresComplianceBurn: true,
      minEffectiveInfraBurn: 250,
    },
  },
  {
    id: "ai_saas",
    title: "AI SaaS",
    selectedStackId: "ai_heavy_stack",
    input: {
      startup: {
        id: "ai-saas",
        sector: "AI SaaS",
        stage: "seed",
        status: "active",
        monetizationModel: "subscription",
        description: "LLM copilot for support automation",
        productProgress: 66,
        revenue: 22_000,
      },
      simulationHistory: [{ monthNumber: 5, userGrowth: 9000 }],
      currentSprint: 6,
    },
    employees: [
      { role: "Founder", seniority: "lead", region: "remote" },
      { role: "AI Engineer", seniority: "senior", region: "remote" },
    ],
    officeType: "remote",
    expected: {
      recommendedStacks: ["ai_heavy_stack"],
      requiresAiBurn: true,
      minEffectiveInfraBurn: 500,
    },
  },
  {
    id: "agentic_ai_startup",
    title: "Agentic AI Startup",
    selectedStackId: "ai_heavy_stack",
    input: {
      startup: {
        id: "agentic-ai",
        sector: "AI infrastructure",
        stage: "growth",
        status: "active",
        monetizationModel: "usage",
        description: "Agentic AI workflow automation platform with tool use",
        productProgress: 84,
        revenue: 110_000,
      },
      simulationHistory: [{ monthNumber: 8, userGrowth: 42_000 }],
      currentSprint: 9,
    },
    employees: [
      { role: "Founder", seniority: "lead", region: "remote" },
      { role: "AI Engineer", seniority: "lead", region: "remote" },
      { role: "Backend Engineer", seniority: "senior", region: "remote" },
    ],
    officeType: "remote",
    expected: {
      recommendedStacks: ["ai_heavy_stack"],
      requiresAiBurn: true,
      minEffectiveInfraBurn: 3000,
    },
  },
  {
    id: "enterprise_regulated",
    title: "Enterprise / Regulated Startup",
    selectedStackId: "enterprise_cloud",
    input: {
      startup: {
        id: "enterprise-regulated",
        sector: "healthcare enterprise",
        stage: "growth",
        status: "active",
        monetizationModel: "enterprise_contracts",
        description: "Healthcare compliance platform for enterprise hospital systems",
        productProgress: 82,
        revenue: 150_000,
      },
      simulationHistory: [{ monthNumber: 8, userGrowth: 28_000 }],
      currentSprint: 9,
    },
    employees: [
      { role: "Founder", seniority: "lead", region: "remote" },
      { role: "Security Engineer", seniority: "senior", region: "remote" },
      { role: "Compliance Lead", seniority: "senior", region: "remote" },
      { role: "Backend Engineer", seniority: "senior", region: "remote" },
    ],
    officeType: "hybrid",
    expected: {
      recommendedStacks: ["enterprise_cloud", "aws_gcp_scale"],
      requiresComplianceBurn: true,
      minEffectiveInfraBurn: 2500,
    },
  },
  {
    id: "high_traction_growth",
    title: "High-Traction Growth Startup",
    selectedStackId: "aws_gcp_scale",
    input: {
      startup: {
        id: "high-traction",
        sector: "marketplace SaaS",
        stage: "growth",
        status: "active",
        monetizationModel: "take_rate",
        description: "Marketplace workflow platform with viral usage spikes",
        productProgress: 90,
        revenue: 220_000,
      },
      simulationHistory: [{ monthNumber: 9, userGrowth: 140_000 }],
      currentSprint: 10,
    },
    employees: [
      { role: "Founder", seniority: "lead", region: "remote" },
      { role: "Backend Engineer", seniority: "lead", region: "remote" },
      { role: "Growth Lead", seniority: "senior", region: "remote" },
    ],
    officeType: "hybrid",
    expected: {
      recommendedStacks: ["aws_gcp_scale", "enterprise_cloud"],
      minEffectiveInfraBurn: 1500,
    },
  },
  {
    id: "cloud_credit_masked",
    title: "Cloud Credit Masked Startup",
    selectedStackId: "aws_gcp_scale",
    creditBalances: [
      {
        id: "credit-masked",
        sourceOfferId: "credit-masked-offer",
        providerScope: "any",
        originalAmount: 50_000,
        remainingAmount: 9000,
        acceptedAtSprint: 5,
        expiresAtSprint: 11,
        status: "active",
        totalApplied: 41_000,
        lastAppliedSprint: 9,
        restrictions: ["Infrastructure burn only"],
      },
    ],
    input: {
      startup: {
        id: "credit-masked",
        sector: "SaaS",
        stage: "growth",
        status: "active",
        monetizationModel: "subscription",
        description: "SaaS platform with high traffic and cloud credits",
        productProgress: 86,
        revenue: 90_000,
      },
      simulationHistory: [{ monthNumber: 9, userGrowth: 75_000 }],
      currentSprint: 10,
    },
    employees: [
      { role: "Founder", seniority: "lead", region: "remote" },
      { role: "Backend Engineer", seniority: "senior", region: "remote" },
    ],
    officeType: "remote",
    expected: {
      recommendedStacks: ["aws_gcp_scale", "enterprise_cloud"],
      requiresCreditWarning: true,
    },
  },
];

export function evaluateInfraBalanceScenario(scenario: InfraBalanceScenario): InfraBalanceEvaluation {
  const runtime = calculateRuntimeInfrastructureBurn(scenario.input, {
    selectedStackId: scenario.selectedStackId,
    creditBalances: scenario.creditBalances,
  });
  const userCount = runtime.preview.usageProfile.users;
  const totalWithoutInfra = calculateTotalBurn(
    scenario.employees,
    scenario.officeType,
    scenario.input.startup?.sector ?? "saas",
    scenario.input.startup?.stage ?? "seed",
    scenario.input.startup?.revenue ?? 0,
    scenario.missionCostDelta ?? 0,
    userCount
  );
  const totalWithInfra = calculateTotalBurn(
    scenario.employees,
    scenario.officeType,
    scenario.input.startup?.sector ?? "saas",
    scenario.input.startup?.stage ?? "seed",
    scenario.input.startup?.revenue ?? 0,
    scenario.missionCostDelta ?? 0,
    userCount,
    runtime.runtimeMonthlyInfraBurn,
    {
      sourceStackId: runtime.sourceStackId,
      version: runtime.version,
      warnings: runtime.warnings,
      explanation: runtime.explanation,
      grossInfrastructureCostsMonthly: runtime.grossInfraBurn,
      aiApiCostsMonthly: runtime.aiApiBurn,
      complianceCostsMonthly: runtime.complianceBurn,
      cloudCreditsAppliedMonthly: runtime.creditsApplied,
    }
  );

  return {
    scenario,
    runtime,
    totalWithoutInfra,
    totalWithInfra,
    netInfraImpact: totalWithInfra.totalMonthlyBurn - totalWithoutInfra.totalMonthlyBurn,
  };
}
