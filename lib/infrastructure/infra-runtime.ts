import { applyCloudCredits, calculateInfrastructureBurn } from "./infra-burn-engine";
import { getInfrastructureStack } from "./infra-catalog";
import { buildInfrastructurePreview, InfrastructurePreview, InfrastructurePreviewInput } from "./infra-preview";
import { normalizeStage } from "./infra-balance";
import { InfrastructureBurnEstimate, RuntimeInfrastructureBurnEstimate, StartupStage } from "./types";
import {
  applyCloudCreditBalances,
  CloudCreditBalance,
  getCloudCreditCliffWarnings,
  validateInfrastructureStackSelection,
} from "./infra-state";

export const RUNTIME_INFRA_BURN_GUARDRAILS = {
  minimumActiveMonthlyBurn: 25,
  stageCaps: {
    idea: 50,
    prototype: 150,
    pre_seed: 500,
    seed: 1500,
    growth: 8000,
    series_a: 25000,
    enterprise: 60000,
  } satisfies Record<StartupStage, number>,
  aiStageCaps: {
    idea: 100,
    prototype: 300,
    pre_seed: 1500,
    seed: 4500,
    growth: 18000,
    series_a: 50000,
    enterprise: 90000,
  } satisfies Record<StartupStage, number>,
  billShockWarningThreshold: 65,
};

function roundMoney(value: number): number {
  return Math.max(0, Math.round(value));
}

function getRuntimeCap(preview: InfrastructurePreview, stage: StartupStage): number {
  const baseCap = RUNTIME_INFRA_BURN_GUARDRAILS.stageCaps[stage];
  if (preview.aiUsageTier === "none" || preview.aiUsageTier === "light") return baseCap;
  return Math.max(baseCap, RUNTIME_INFRA_BURN_GUARDRAILS.aiStageCaps[stage]);
}

export interface RuntimeInfrastructureBurnResult extends RuntimeInfrastructureBurnEstimate {
  preview: InfrastructurePreview;
  selectedBurnEstimate: InfrastructureBurnEstimate;
  creditBalances?: CloudCreditBalance[];
  appliedCreditIds?: string[];
}

export interface RuntimeInfrastructureBurnOptions {
  selectedStackId?: string | null;
  creditBalances?: CloudCreditBalance[];
}

export function calculateRuntimeInfrastructureBurn(
  input: InfrastructurePreviewInput,
  options: RuntimeInfrastructureBurnOptions = {}
): RuntimeInfrastructureBurnResult {
  const preview = buildInfrastructurePreview(input);
  const selectedStackValid = options.selectedStackId
    ? validateInfrastructureStackSelection(options.selectedStackId, input).valid
    : false;
  const sourceStackId = selectedStackValid && options.selectedStackId ? options.selectedStackId : preview.recommendedStackId;
  const stack = getInfrastructureStack(sourceStackId);
  if (!stack) {
    throw new Error(`Missing infrastructure stack for runtime estimate: ${sourceStackId}`);
  }

  const status = input.startup?.status ?? "draft";
  const isOperating = status === "funded" || status === "active" || status === "completed" || status === "dead";
  const stage = normalizeStage(input.startup?.stage ?? status);
  const selectedEstimate = calculateInfrastructureBurn({
    stackId: sourceStackId,
    startupStage: input.startup?.stage ?? input.startup?.status ?? stage,
    sector: input.startup?.sector ?? undefined,
    classification: [
      input.startup?.sector,
      input.startup?.monetizationModel,
      input.startup?.description,
      input.startup?.problem,
      input.startup?.solution,
    ].filter(Boolean).join(" ").toLowerCase(),
    usageProfile: preview.usageProfile,
    aiUsageTier: preview.aiUsageTier,
    cloudCredits: [],
    currentSprint: input.currentSprint ?? undefined,
    complianceRequired: preview.usageProfile.complianceLevel !== "none",
    productProgress: input.startup?.productProgress ?? undefined,
    revenue: input.startup?.revenue ?? undefined,
    userGrowth: input.simulationHistory?.[input.simulationHistory.length - 1]?.userGrowth ?? undefined,
  });
  const cap = getRuntimeCap(preview, stage);
  const uncappedGrossInfraBurn = selectedEstimate.grossMonthlyInfraBurn;
  const cappedGrossInfraBurn = isOperating
    ? Math.min(Math.max(uncappedGrossInfraBurn, RUNTIME_INFRA_BURN_GUARDRAILS.minimumActiveMonthlyBurn), cap)
    : Math.min(uncappedGrossInfraBurn, cap);

  const creditApplication = options.creditBalances
    ? applyCloudCreditBalances({
        grossInfraBurn: cappedGrossInfraBurn,
        balances: options.creditBalances,
        provider: stack.provider,
        currentSprint: Math.max(1, Math.round(input.currentSprint ?? 1)),
      })
    : applyCloudCredits(cappedGrossInfraBurn, preview.cloudCreditPreview.credits, stack.provider);
  const runtimeMonthlyInfraBurn = roundMoney(cappedGrossInfraBurn - creditApplication.creditsApplied);
  const componentScale = uncappedGrossInfraBurn > 0 ? cappedGrossInfraBurn / uncappedGrossInfraBurn : 0;
  const aiApiBurn = roundMoney(selectedEstimate.aiMonthlyCost * componentScale);
  const complianceBurn = roundMoney(selectedEstimate.complianceMonthlyCost * componentScale);
  const capApplied = cappedGrossInfraBurn < uncappedGrossInfraBurn ? cap : null;

  const warnings = [
    ...preview.warnings.filter((warning) => {
      const lower = warning.toLowerCase();
      return !lower.includes("preview only") && !lower.includes("preview mode");
    }),
    ...creditApplication.warnings,
    ...(options.creditBalances ? getCloudCreditCliffWarnings(options.creditBalances, cappedGrossInfraBurn, Math.max(1, Math.round(input.currentSprint ?? 1))) : []),
  ];
  if (options.selectedStackId && !selectedStackValid) {
    warnings.push("Selected infrastructure stack is locked or invalid for this startup. Runtime burn fell back to the recommended stack.");
  }
  if (capApplied !== null) {
    warnings.push(`Runtime guardrail capped infrastructure burn at $${cap.toLocaleString()}/mo for ${stage} stage.`);
  }
  if (selectedEstimate.billShockRisk >= RUNTIME_INFRA_BURN_GUARDRAILS.billShockWarningThreshold) {
    warnings.push("Runtime integration is active, but bill shock events remain warnings only in v0.1.");
  }

  return {
    preview: {
      ...preview,
      isAppliedToLiveBurn: false,
    },
    selectedBurnEstimate: selectedEstimate,
    sourceStackId,
    version: selectedEstimate.version,
    runtimeMonthlyInfraBurn,
    grossInfraBurn: roundMoney(cappedGrossInfraBurn),
    uncappedGrossInfraBurn,
    creditsApplied: creditApplication.creditsApplied,
    aiApiBurn,
    complianceBurn,
    capApplied,
    riskModifiersPreview: {
      reliabilityRisk: selectedEstimate.reliabilityRisk,
      scalingRisk: selectedEstimate.scalingRisk,
      securityRisk: selectedEstimate.securityRisk,
      billShockRisk: selectedEstimate.billShockRisk,
      outageRisk: selectedEstimate.outageRisk,
      investorTrustModifier: selectedEstimate.investorTrustModifier,
      riskScoreModifier: selectedEstimate.riskScoreModifier,
    },
    explanation: [
      `${stack.title} is the deterministic runtime source stack.`,
      `Runtime gross infra burn is $${roundMoney(cappedGrossInfraBurn).toLocaleString()}/mo after conservative stage caps.`,
      `Cloud credits apply only to infrastructure burn and reduced this period by $${creditApplication.creditsApplied.toLocaleString()}.`,
      `Effective runtime infra burn added to Monthly Burn is $${runtimeMonthlyInfraBurn.toLocaleString()}/mo.`,
    ],
    warnings: Array.from(new Set(warnings)),
    creditBalances: "updatedBalances" in creditApplication ? creditApplication.updatedBalances : undefined,
    appliedCreditIds: "appliedCreditIds" in creditApplication ? creditApplication.appliedCreditIds : undefined,
  };
}
