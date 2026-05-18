import { calculateTotalBurn } from "@/lib/economy/cost-engine";
import type { SeniorityLevel, TotalCostEstimate } from "@/lib/economy/types";
import {
  calculateRuntimeInfrastructureBurn,
  parseInfrastructureState,
  selectInfrastructureEventForSprint,
  type CloudCreditBalance,
  type InfrastructurePreviewInput,
  type RuntimeInfrastructureBurnResult,
  type LiveInfrastructureEventRecord,
} from "@/lib/infrastructure";
import {
  calculateLeaderboardScore,
  checkDeathCondition,
  classifyFinalOutcome,
  simulateMonth,
  type MonthlyResult,
  type StartupState,
} from "@/lib/simulation/engine";
import type { DecisionOption } from "@/lib/simulation/decisions";

type BalanceIntent =
  | "balanced"
  | "ai_pressure"
  | "cockroach"
  | "enterprise"
  | "rival_pressure"
  | "product_led"
  | "credit_cliff"
  | "weak"
  | "growth"
  | "no_traction";

export interface CrossSystemScenario {
  id: string;
  title: string;
  intent: BalanceIntent;
  input: InfrastructurePreviewInput;
  selectedStackId?: string;
  creditBalances?: CloudCreditBalance[];
  employees: { role: string; seniority: SeniorityLevel; region?: string }[];
  officeType: string;
  initialState: StartupState;
  decisions: DecisionOption[];
  finalState: StartupState;
  finalWeeks: number;
  systemContext: {
    socialHype: number;
    socialTrust: number;
    brandRisk: number;
    rivalPressure: number;
    boardroomOpenEvents: number;
    strategySignals: number;
  };
}

export interface CrossSystemScenarioEvaluation {
  scenario: CrossSystemScenario;
  runtime: RuntimeInfrastructureBurnResult;
  totalWithoutInfra: TotalCostEstimate;
  totalWithInfra: TotalCostEstimate;
  sprintResult: MonthlyResult;
  deathCheck: ReturnType<typeof checkDeathCondition>;
  finalOutcome: ReturnType<typeof classifyFinalOutcome>;
  leaderboardScore: number;
  infraEvent: LiveInfrastructureEventRecord | null;
}

const productDecision: DecisionOption = {
  id: "product_focus",
  label: "Product Focus",
  description: "Invest in product depth.",
  cashCost: 5000,
  burnDelta: 4000,
  productDelta: 14,
  revenueDelta: 4000,
  investorDelta: 1,
  marketDelta: 1,
  riskDelta: -1,
};

const growthDecision: DecisionOption = {
  id: "marketing_spend",
  label: "Growth Push",
  description: "Push acquisition.",
  cashCost: 12000,
  burnDelta: 8000,
  productDelta: 1,
  revenueDelta: 14000,
  investorDelta: 2,
  marketDelta: 3,
  riskDelta: 2,
};

const conservativeDecision: DecisionOption = {
  id: "cost_control",
  label: "Cost Control",
  description: "Tighten spend.",
  cashCost: 1000,
  burnDelta: -3000,
  productDelta: 4,
  revenueDelta: 1500,
  investorDelta: 0,
  marketDelta: 0,
  riskDelta: -3,
};

const badDecision: DecisionOption = {
  id: "spray_and_pray",
  label: "Spray And Pray",
  description: "Spend without product signal.",
  cashCost: 30000,
  burnDelta: 20000,
  productDelta: 1,
  revenueDelta: 0,
  investorDelta: -4,
  marketDelta: -2,
  riskDelta: 8,
};

function state(overrides: Partial<StartupState>): StartupState {
  return {
    cash: 420_000,
    monthlyBurn: 35_000,
    revenue: 8_000,
    valuation: 1_800_000,
    productProgress: 35,
    investorScore: 55,
    marketScore: 50,
    riskScore: 40,
    ...overrides,
  };
}

export const CROSS_SYSTEM_BALANCE_SCENARIOS: CrossSystemScenario[] = [
  {
    id: "balanced_saas_founder",
    title: "Balanced SaaS Founder",
    intent: "balanced",
    selectedStackId: "vercel_serverless",
    input: {
      startup: {
        id: "balanced-saas",
        sector: "SaaS",
        stage: "seed",
        status: "active",
        monetizationModel: "subscription",
        description: "B2B workflow SaaS with steady product-led growth",
        productProgress: 52,
        revenue: 18_000,
        riskScore: 38,
      },
      simulationHistory: [{ monthNumber: 3, userGrowth: 2200 }],
      currentSprint: 5,
    },
    employees: [
      { role: "Founder", seniority: "lead", region: "remote" },
      { role: "Full-Stack Engineer", seniority: "mid", region: "remote" },
    ],
    officeType: "remote",
    initialState: state({ cash: 520_000, revenue: 18_000, productProgress: 52, riskScore: 38 }),
    decisions: [productDecision],
    finalState: state({ cash: 180_000, monthlyBurn: 62_000, revenue: 48_000, valuation: 4_800_000, productProgress: 82, investorScore: 68, riskScore: 34 }),
    finalWeeks: 12,
    systemContext: { socialHype: 48, socialTrust: 62, brandRisk: 18, rivalPressure: 35, boardroomOpenEvents: 0, strategySignals: 12 },
  },
  {
    id: "ai_heavy_hype_founder",
    title: "AI-Heavy Hype Founder",
    intent: "ai_pressure",
    selectedStackId: "ai_heavy_stack",
    input: {
      startup: {
        id: "ai-heavy",
        sector: "AI SaaS",
        stage: "growth",
        status: "active",
        monetizationModel: "usage",
        description: "Agentic LLM support automation with high social hype and token-heavy workflows",
        productProgress: 84,
        revenue: 120_000,
        riskScore: 58,
      },
      simulationHistory: [{ monthNumber: 8, userGrowth: 42_000 }],
      currentSprint: 9,
    },
    employees: [
      { role: "Founder", seniority: "lead", region: "remote" },
      { role: "AI Engineer", seniority: "lead", region: "remote" },
      { role: "Growth Lead", seniority: "senior", region: "remote" },
    ],
    officeType: "remote",
    initialState: state({ cash: 760_000, revenue: 120_000, valuation: 9_000_000, productProgress: 84, riskScore: 58 }),
    decisions: [growthDecision],
    finalState: state({ cash: 280_000, monthlyBurn: 145_000, revenue: 190_000, valuation: 13_000_000, productProgress: 92, investorScore: 76, riskScore: 48 }),
    finalWeeks: 12,
    systemContext: { socialHype: 82, socialTrust: 54, brandRisk: 42, rivalPressure: 65, boardroomOpenEvents: 1, strategySignals: 18 },
  },
  {
    id: "cockroach_founder",
    title: "Cockroach Founder",
    intent: "cockroach",
    selectedStackId: "cheap_static_landing",
    input: {
      startup: {
        id: "cockroach",
        sector: "bootstrapped SaaS",
        stage: "seed",
        status: "active",
        monetizationModel: "subscription",
        description: "Lean workflow tool with low burn and conservative growth",
        productProgress: 48,
        revenue: 14_000,
        riskScore: 26,
      },
      simulationHistory: [{ monthNumber: 5, userGrowth: 900 }],
      currentSprint: 6,
    },
    employees: [{ role: "Founder", seniority: "lead", region: "remote" }],
    officeType: "remote",
    initialState: state({ cash: 300_000, revenue: 14_000, productProgress: 48, riskScore: 26 }),
    decisions: [conservativeDecision],
    finalState: state({ cash: 210_000, monthlyBurn: 28_000, revenue: 32_000, valuation: 2_800_000, productProgress: 70, investorScore: 52, riskScore: 22 }),
    finalWeeks: 12,
    systemContext: { socialHype: 30, socialTrust: 70, brandRisk: 8, rivalPressure: 20, boardroomOpenEvents: 0, strategySignals: 10 },
  },
  {
    id: "enterprise_regulated_founder",
    title: "Enterprise Regulated Founder",
    intent: "enterprise",
    selectedStackId: "enterprise_cloud",
    input: {
      startup: {
        id: "enterprise-regulated-cross",
        sector: "healthcare fintech enterprise",
        stage: "growth",
        status: "active",
        monetizationModel: "enterprise_contracts",
        description: "Regulated hospital finance platform with compliance-heavy enterprise sales",
        productProgress: 82,
        revenue: 150_000,
        riskScore: 42,
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
    initialState: state({ cash: 1_000_000, revenue: 150_000, valuation: 10_000_000, productProgress: 82, investorScore: 70, riskScore: 42 }),
    decisions: [productDecision],
    finalState: state({ cash: 320_000, monthlyBurn: 180_000, revenue: 210_000, valuation: 16_000_000, productProgress: 90, investorScore: 78, riskScore: 36 }),
    finalWeeks: 12,
    systemContext: { socialHype: 46, socialTrust: 78, brandRisk: 16, rivalPressure: 48, boardroomOpenEvents: 1, strategySignals: 16 },
  },
  {
    id: "rival_killer",
    title: "Rival Killer",
    intent: "rival_pressure",
    selectedStackId: "render_full_stack",
    input: {
      startup: {
        id: "rival-killer",
        sector: "developer tools",
        stage: "seed",
        status: "active",
        description: "Developer tool with public rival counter-positioning",
        productProgress: 68,
        revenue: 35_000,
        riskScore: 52,
      },
      simulationHistory: [{ monthNumber: 7, userGrowth: 10_000 }],
      currentSprint: 8,
    },
    employees: [
      { role: "Founder", seniority: "lead", region: "remote" },
      { role: "Backend Engineer", seniority: "mid", region: "remote" },
    ],
    officeType: "remote",
    initialState: state({ cash: 480_000, revenue: 35_000, productProgress: 68, riskScore: 52 }),
    decisions: [growthDecision],
    finalState: state({ cash: 120_000, monthlyBurn: 76_000, revenue: 78_000, valuation: 6_500_000, productProgress: 78, investorScore: 62, riskScore: 55 }),
    finalWeeks: 12,
    systemContext: { socialHype: 75, socialTrust: 48, brandRisk: 44, rivalPressure: 84, boardroomOpenEvents: 1, strategySignals: 20 },
  },
  {
    id: "product_led_builder",
    title: "Product-Led Builder",
    intent: "product_led",
    selectedStackId: "render_full_stack",
    input: {
      startup: {
        id: "product-led",
        sector: "SaaS",
        stage: "seed",
        status: "active",
        description: "Quiet product-led SaaS with low hype and strong UX polish",
        productProgress: 76,
        revenue: 18_000,
        riskScore: 30,
      },
      simulationHistory: [{ monthNumber: 6, userGrowth: 3000 }],
      currentSprint: 7,
    },
    employees: [
      { role: "Founder", seniority: "lead", region: "remote" },
      { role: "Product Designer", seniority: "mid", region: "remote" },
      { role: "Full-Stack Engineer", seniority: "mid", region: "remote" },
    ],
    officeType: "remote",
    initialState: state({ cash: 560_000, revenue: 18_000, productProgress: 76, riskScore: 30 }),
    decisions: [productDecision],
    finalState: state({ cash: 170_000, monthlyBurn: 78_000, revenue: 52_000, valuation: 5_400_000, productProgress: 94, investorScore: 66, riskScore: 28 }),
    finalWeeks: 12,
    systemContext: { socialHype: 35, socialTrust: 76, brandRisk: 10, rivalPressure: 32, boardroomOpenEvents: 0, strategySignals: 14 },
  },
  {
    id: "cloud_credit_masked_ai",
    title: "Cloud Credit Masked AI Startup",
    intent: "credit_cliff",
    selectedStackId: "ai_heavy_stack",
    creditBalances: [
      {
        id: "cross-credit-cliff",
        sourceOfferId: "cross-credit-cliff-offer",
        providerScope: "any",
        originalAmount: 75_000,
        remainingAmount: 10_000,
        acceptedAtSprint: 5,
        expiresAtSprint: 11,
        status: "active",
        totalApplied: 65_000,
        lastAppliedSprint: 9,
        restrictions: ["Infrastructure burn only"],
      },
    ],
    input: {
      startup: {
        id: "credit-masked-ai",
        sector: "AI SaaS",
        stage: "growth",
        status: "active",
        monetizationModel: "usage",
        description: "AI workflow with cloud credits masking high gross token and infra burn",
        productProgress: 86,
        revenue: 95_000,
        riskScore: 55,
      },
      simulationHistory: [{ monthNumber: 9, userGrowth: 60_000 }],
      currentSprint: 10,
    },
    employees: [
      { role: "Founder", seniority: "lead", region: "remote" },
      { role: "AI Engineer", seniority: "senior", region: "remote" },
    ],
    officeType: "remote",
    initialState: state({ cash: 620_000, revenue: 95_000, productProgress: 86, riskScore: 55 }),
    decisions: [conservativeDecision],
    finalState: state({ cash: 90_000, monthlyBurn: 135_000, revenue: 125_000, valuation: 9_500_000, productProgress: 88, investorScore: 68, riskScore: 58 }),
    finalWeeks: 12,
    systemContext: { socialHype: 70, socialTrust: 50, brandRisk: 48, rivalPressure: 58, boardroomOpenEvents: 1, strategySignals: 17 },
  },
  {
    id: "weak_bad_decisions",
    title: "Weak Startup / Bad Decisions",
    intent: "weak",
    selectedStackId: "vercel_serverless",
    input: {
      startup: {
        id: "weak-startup",
        sector: "consumer app",
        stage: "seed",
        status: "active",
        description: "Consumer startup spending without product or revenue signal",
        productProgress: 14,
        revenue: 0,
        riskScore: 78,
      },
      simulationHistory: [{ monthNumber: 6, userGrowth: 100 }],
      currentSprint: 7,
    },
    employees: [
      { role: "Founder", seniority: "lead", region: "remote" },
      { role: "Marketing Manager", seniority: "senior", region: "remote" },
    ],
    officeType: "hybrid",
    initialState: state({ cash: 40_000, revenue: 0, productProgress: 14, investorScore: 18, riskScore: 88 }),
    decisions: [badDecision],
    finalState: state({ cash: -5_000, monthlyBurn: 90_000, revenue: 0, valuation: 200_000, productProgress: 14, investorScore: 8, riskScore: 96 }),
    finalWeeks: 7,
    systemContext: { socialHype: 62, socialTrust: 22, brandRisk: 82, rivalPressure: 70, boardroomOpenEvents: 2, strategySignals: 5 },
  },
  {
    id: "high_traction_growth",
    title: "High-Traction Growth Startup",
    intent: "growth",
    selectedStackId: "aws_gcp_scale",
    input: {
      startup: {
        id: "high-traction-cross",
        sector: "marketplace SaaS",
        stage: "growth",
        status: "active",
        monetizationModel: "take_rate",
        description: "Marketplace workflow platform with high usage and strong revenue",
        productProgress: 92,
        revenue: 240_000,
        riskScore: 40,
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
    initialState: state({ cash: 1_200_000, revenue: 240_000, valuation: 14_000_000, productProgress: 92, riskScore: 40 }),
    decisions: [growthDecision],
    finalState: state({ cash: 650_000, monthlyBurn: 190_000, revenue: 340_000, valuation: 22_000_000, productProgress: 96, investorScore: 84, riskScore: 35 }),
    finalWeeks: 12,
    systemContext: { socialHype: 78, socialTrust: 68, brandRisk: 32, rivalPressure: 62, boardroomOpenEvents: 1, strategySignals: 22 },
  },
  {
    id: "no_traction_startup",
    title: "No-Traction Startup",
    intent: "no_traction",
    selectedStackId: "replit_mvp",
    input: {
      startup: {
        id: "no-traction",
        sector: "consumer app",
        stage: "seed",
        status: "active",
        description: "Low product progress and no revenue by late run",
        productProgress: 12,
        revenue: 0,
        riskScore: 54,
      },
      simulationHistory: [{ monthNumber: 8, userGrowth: 0 }],
      currentSprint: 9,
    },
    employees: [{ role: "Founder", seniority: "lead", region: "remote" }],
    officeType: "remote",
    initialState: state({ cash: 150_000, revenue: 0, productProgress: 12, riskScore: 54 }),
    decisions: [conservativeDecision],
    finalState: state({ cash: 40_000, monthlyBurn: 35_000, revenue: 0, valuation: 400_000, productProgress: 16, investorScore: 30, riskScore: 60 }),
    finalWeeks: 9,
    systemContext: { socialHype: 18, socialTrust: 45, brandRisk: 20, rivalPressure: 15, boardroomOpenEvents: 0, strategySignals: 4 },
  },
];

export function evaluateCrossSystemScenario(scenario: CrossSystemScenario): CrossSystemScenarioEvaluation {
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
    0,
    userCount
  );
  const totalWithInfra = calculateTotalBurn(
    scenario.employees,
    scenario.officeType,
    scenario.input.startup?.sector ?? "saas",
    scenario.input.startup?.stage ?? "seed",
    scenario.input.startup?.revenue ?? 0,
    0,
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
  const baseStructuralBurn =
    totalWithoutInfra.payrollMonthly +
    totalWithoutInfra.officeMonthly +
    totalWithoutInfra.missionCostsMonthly;
  const sprintResult = simulateMonth(
    { ...scenario.initialState, monthlyBurn: baseStructuralBurn },
    scenario.decisions,
    null,
    scenario.input.startup?.sector ?? "saas",
    [],
    scenario.officeType,
    {
      sector: scenario.input.startup?.sector ?? "saas",
      region: "remote",
      monetizationModel: scenario.input.startup?.monetizationModel ?? "subscription",
      problem: scenario.input.startup?.problem ?? "",
      solution: scenario.input.startup?.solution ?? "",
    },
    scenario.input.currentSprint ?? 1,
    undefined,
    scenario.input.startup?.stage ?? "seed",
    0,
    runtime.runtimeMonthlyInfraBurn,
    {
      grossInfrastructureCosts: runtime.grossInfraBurn,
      aiApiCosts: runtime.aiApiBurn,
      complianceCosts: runtime.complianceBurn,
      cloudCreditsApplied: runtime.creditsApplied,
    }
  );
  const deathCheck = checkDeathCondition(sprintResult, scenario.input.currentSprint ?? 1);
  const finalOutcome = classifyFinalOutcome(scenario.finalState, scenario.finalWeeks, []);
  const leaderboardScore = calculateLeaderboardScore(scenario.finalState, scenario.finalWeeks, finalOutcome.outcome);
  const infraEvent = selectInfrastructureEventForSprint({
    state: {
      ...parseInfrastructureState({}),
      creditBalances: scenario.creditBalances ?? [],
    },
    previewInput: scenario.input,
    runtime,
    currentSprint: scenario.input.currentSprint ?? 1,
  }).event;

  return {
    scenario,
    runtime,
    totalWithoutInfra,
    totalWithInfra,
    sprintResult,
    deathCheck,
    finalOutcome,
    leaderboardScore,
    infraEvent,
  };
}
