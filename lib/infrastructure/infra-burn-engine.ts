import {
  AIUsageTier,
  CloudCreditApplication,
  CloudCreditGrant,
  ComplianceLevel,
  InfraUsageProfile,
  InfrastructureBurnEstimate,
  InfrastructureBurnInput,
  InfrastructureProvider,
} from "./types";
import {
  AI_SECTOR_HINTS,
  CLOUD_CREDIT_EXPIRY_WARNING_SPRINTS,
  COMPLIANCE_MONTHLY_COST,
  COMPLIANCE_SECURITY_RELIEF,
  DEFAULT_USAGE_PROFILE,
  REGULATED_SECTOR_HINTS,
  STAGE_USAGE_MULTIPLIERS,
  TRAFFIC_VOLATILITY_RISK,
  clampScore,
  normalizeStage,
} from "./infra-balance";
import { getAIUsageTierDefinition, getInfrastructureStack } from "./infra-catalog";

function clampNonNegative(value: number): number {
  return Math.max(0, Math.round(value));
}

function containsAny(value: string | undefined, terms: string[]): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

export function mergeUsageProfile(profile: Partial<InfraUsageProfile> = {}): InfraUsageProfile {
  return {
    ...DEFAULT_USAGE_PROFILE,
    ...profile,
    users: clampNonNegative(profile.users ?? DEFAULT_USAGE_PROFILE.users),
    monthlyActiveUsers: clampNonNegative(profile.monthlyActiveUsers ?? DEFAULT_USAGE_PROFILE.monthlyActiveUsers),
    requestsPerUser: clampNonNegative(profile.requestsPerUser ?? DEFAULT_USAGE_PROFILE.requestsPerUser),
    dataTransferGb: clampNonNegative(profile.dataTransferGb ?? DEFAULT_USAGE_PROFILE.dataTransferGb),
    dbStorageGb: clampNonNegative(profile.dbStorageGb ?? DEFAULT_USAGE_PROFILE.dbStorageGb),
    aiRequestsPerUser: clampNonNegative(profile.aiRequestsPerUser ?? DEFAULT_USAGE_PROFILE.aiRequestsPerUser),
    avgInputTokens: clampNonNegative(profile.avgInputTokens ?? DEFAULT_USAGE_PROFILE.avgInputTokens),
    avgOutputTokens: clampNonNegative(profile.avgOutputTokens ?? DEFAULT_USAGE_PROFILE.avgOutputTokens),
  };
}

export function inferAIUsageTier(input: {
  explicitTier?: AIUsageTier;
  sector?: string;
  classification?: string;
  stackId?: string;
  usageProfile: InfraUsageProfile;
}): AIUsageTier {
  if (input.explicitTier) return input.explicitTier;
  if (input.stackId === "ai_heavy_stack") return "heavy";
  const text = `${input.sector ?? ""} ${input.classification ?? ""}`;
  if (containsAny(text, AI_SECTOR_HINTS)) {
    return input.usageProfile.aiRequestsPerUser > 8 ? "heavy" : "moderate";
  }
  return input.usageProfile.aiRequestsPerUser > 0 ? "light" : "none";
}

export function inferComplianceLevel(input: {
  explicitLevel?: ComplianceLevel;
  complianceRequired?: boolean;
  sector?: string;
  classification?: string;
}): ComplianceLevel {
  if (input.explicitLevel && input.explicitLevel !== "none") return input.explicitLevel;
  if (input.complianceRequired) return "regulated";
  const text = `${input.sector ?? ""} ${input.classification ?? ""}`;
  if (containsAny(text, REGULATED_SECTOR_HINTS)) return "regulated";
  return input.explicitLevel ?? "none";
}

function calculateVariableMonthlyCost(profile: InfraUsageProfile, stageMultiplier: number): number {
  const requestMillions = (profile.monthlyActiveUsers * profile.requestsPerUser) / 1_000_000;
  const compute = requestMillions * 18;
  const bandwidth = Math.max(0, profile.dataTransferGb - 25) * 0.18;
  const database = Math.max(0, profile.dbStorageGb - 5) * 7.5;
  const storage = Math.max(0, profile.dbStorageGb - 25) * 0.08;
  const logs = requestMillions * 9 + Math.max(0, profile.dataTransferGb - 100) * 0.04;

  return clampNonNegative((compute + bandwidth + database + storage + logs) * stageMultiplier);
}

function calculateAIMonthlyCost(profile: InfraUsageProfile, tier: AIUsageTier): number {
  const definition = getAIUsageTierDefinition(tier);
  if (!definition || tier === "none") return 0;

  const monthlyCalls = profile.monthlyActiveUsers * profile.aiRequestsPerUser;
  const tokenMillions = (monthlyCalls * (profile.avgInputTokens + profile.avgOutputTokens * 4)) / 1_000_000;
  const embeddingCost = profile.usesEmbeddings ? Math.max(20, profile.monthlyActiveUsers * 0.015) : 0;
  const multimodalCost = profile.usesImageAudio ? Math.max(150, monthlyCalls * 0.04) : 0;

  return clampNonNegative(definition.baseMonthlyCost + tokenMillions * 42 * definition.costMultiplier + embeddingCost + multimodalCost);
}

function providerAllowsCredit(provider: InfrastructureProvider, credit: CloudCreditGrant): boolean {
  return credit.providerScope === "any" || credit.providerScope.includes(provider);
}

export function applyCloudCredits(
  grossMonthlyInfraBurn: number,
  credits: CloudCreditGrant[] = [],
  provider?: InfrastructureProvider
): CloudCreditApplication {
  let remainingBurn = Math.max(0, grossMonthlyInfraBurn);
  let creditsApplied = 0;
  const warnings: string[] = [];

  const updatedCredits = credits.map((credit) => {
    const canApply = credit.expiresInSprints > 0 && credit.remainingAmount > 0 && (!provider || providerAllowsCredit(provider, credit));
    if (!canApply || remainingBurn <= 0) {
      if (credit.expiresInSprints <= CLOUD_CREDIT_EXPIRY_WARNING_SPRINTS && credit.remainingAmount > 0) {
        warnings.push(`${credit.id} expires soon with $${Math.round(credit.remainingAmount).toLocaleString()} remaining.`);
      }
      return { ...credit };
    }

    const applied = Math.min(credit.remainingAmount, remainingBurn);
    creditsApplied += applied;
    remainingBurn -= applied;

    if (credit.expiresInSprints <= CLOUD_CREDIT_EXPIRY_WARNING_SPRINTS) {
      warnings.push(`${credit.id} expires soon; gross burn may rebound after credits expire.`);
    }

    return {
      ...credit,
      remainingAmount: clampNonNegative(credit.remainingAmount - applied),
    };
  });

  return {
    creditsApplied: clampNonNegative(creditsApplied),
    updatedCredits,
    warnings,
  };
}

export function decrementCloudCreditsOverTime(
  credits: CloudCreditGrant[] = [],
  sprintAdvance = 1
): CloudCreditGrant[] {
  const decrement = clampNonNegative(sprintAdvance);
  return credits.map((credit) => ({
    ...credit,
    expiresInSprints: Math.max(0, credit.expiresInSprints - decrement),
  }));
}

export function getCloudCreditWarning(credits: CloudCreditGrant[] = []): string | null {
  const expiring = credits.find((credit) => credit.remainingAmount > 0 && credit.expiresInSprints <= CLOUD_CREDIT_EXPIRY_WARNING_SPRINTS);
  if (!expiring) return null;
  if (expiring.expiresInSprints <= 0) return `${expiring.id} has expired; infrastructure burn may snap back this sprint.`;
  return `${expiring.id} expires in ${expiring.expiresInSprints} sprint${expiring.expiresInSprints === 1 ? "" : "s"}.`;
}

export function calculateInfrastructureBurn(input: InfrastructureBurnInput): InfrastructureBurnEstimate {
  const stack = getInfrastructureStack(input.stackId);
  if (!stack) {
    throw new Error(`Unknown infrastructure stack: ${input.stackId}`);
  }

  const stage = normalizeStage(input.startupStage);
  const usageProfile = mergeUsageProfile(input.usageProfile);
  const complianceLevel = inferComplianceLevel({
    explicitLevel: usageProfile.complianceLevel,
    complianceRequired: input.complianceRequired,
    sector: input.sector,
    classification: input.classification,
  });
  const usageWithCompliance = { ...usageProfile, complianceLevel };
  const aiUsageTier = inferAIUsageTier({
    explicitTier: input.aiUsageTier,
    sector: input.sector,
    classification: input.classification,
    stackId: input.stackId,
    usageProfile: usageWithCompliance,
  });
  const aiDefinition = getAIUsageTierDefinition(aiUsageTier);
  const stageMultiplier = STAGE_USAGE_MULTIPLIERS[stage];

  const fixedMonthlyCost = stack.defaultMonthlyCost;
  const variableMonthlyCost = calculateVariableMonthlyCost(usageWithCompliance, stageMultiplier);
  const aiMonthlyCost = calculateAIMonthlyCost(usageWithCompliance, aiUsageTier);
  const complianceMonthlyCost = COMPLIANCE_MONTHLY_COST[complianceLevel];
  const grossMonthlyInfraBurn = fixedMonthlyCost + variableMonthlyCost + aiMonthlyCost + complianceMonthlyCost;

  const creditApplication = applyCloudCredits(grossMonthlyInfraBurn, input.cloudCredits, stack.provider);
  const effectiveMonthlyInfraBurn = Math.max(0, grossMonthlyInfraBurn - creditApplication.creditsApplied);

  const loadPressure = clampScore(
    usageWithCompliance.monthlyActiveUsers / 250 +
      usageWithCompliance.dataTransferGb / 12 +
      usageWithCompliance.dbStorageGb / 3 +
      TRAFFIC_VOLATILITY_RISK[usageWithCompliance.trafficVolatility]
  );
  const scaleGap = Math.max(0, loadPressure - stack.scalability);
  const complianceGap = Math.max(0, COMPLIANCE_SECURITY_RELIEF[complianceLevel] - stack.complianceReadiness / 5);
  const aiGap = aiUsageTier === "none" ? 0 : Math.max(0, (aiDefinition?.billShockRisk ?? 0) - stack.aiReadiness / 2);

  const scalingRisk = clampScore(35 + scaleGap + stack.complexity / 8 - stack.scalability / 4);
  const reliabilityRisk = clampScore(30 + stack.outageRisk / 2 + TRAFFIC_VOLATILITY_RISK[usageWithCompliance.trafficVolatility] - stack.reliability / 5);
  const securityRisk = clampScore(35 + complianceGap + (complianceLevel === "enterprise" ? 12 : 0) - stack.security / 4);
  const billShockRisk = clampScore((aiDefinition?.billShockRisk ?? 0) + loadPressure / 3 + (creditApplication.creditsApplied > 0 ? 8 : 0) + aiGap / 2);
  const outageRisk = clampScore(stack.outageRisk + scaleGap / 2 + TRAFFIC_VOLATILITY_RISK[usageWithCompliance.trafficVolatility] / 2 - stack.reliability / 8);
  const investorTrustModifier = Math.round(
    (stack.investorTrust - 50) / 10 +
      (aiDefinition?.investorTrustModifier ?? 0) +
      (complianceLevel === "enterprise" ? 4 : complianceLevel === "regulated" ? 2 : 0)
  );
  const riskScoreModifier = Math.round(
    (aiDefinition?.riskScoreModifier ?? 0) +
      scaleGap / 12 +
      billShockRisk / 25 -
      (stack.reliability + stack.security) / 80
  );

  const explanation = [
    `${stack.title} uses a static ${stack.version} gameplay cost model, not live provider billing.`,
    `Fixed monthly infra cost starts at $${fixedMonthlyCost.toLocaleString()}.`,
    `Usage adds $${variableMonthlyCost.toLocaleString()} from traffic, storage, database, and logs pressure.`,
    aiMonthlyCost > 0
      ? `${aiDefinition?.title ?? "AI usage"} adds $${aiMonthlyCost.toLocaleString()} in modeled AI/API burn.`
      : "No AI/API burn is modeled for this estimate.",
    complianceMonthlyCost > 0
      ? `${complianceLevel} compliance posture adds $${complianceMonthlyCost.toLocaleString()} monthly.`
      : "No compliance overhead is modeled.",
  ];

  const warnings = [
    ...creditApplication.warnings,
    ...(aiDefinition?.warnings ?? []),
  ];

  if (scaleGap > 15) warnings.push(`${stack.title} is under scale pressure for this usage profile.`);
  if (billShockRisk >= 65) warnings.push("Bill shock risk is high; model limits, caching, credits, or pricing power before wiring this into burn.");
  if (creditApplication.creditsApplied > 0 && grossMonthlyInfraBurn >= 5000) {
    warnings.push("Cloud credits mask gross burn; runway can drop sharply when credits expire.");
  }
  if (complianceLevel !== "none" && stack.complianceReadiness < 50) {
    warnings.push(`${stack.title} is weak for ${complianceLevel} compliance requirements.`);
  }

  return {
    stackId: stack.id,
    version: stack.version,
    fixedMonthlyCost,
    variableMonthlyCost,
    aiMonthlyCost,
    complianceMonthlyCost,
    grossMonthlyInfraBurn: clampNonNegative(grossMonthlyInfraBurn),
    cloudCreditsApplied: creditApplication.creditsApplied,
    effectiveMonthlyInfraBurn: clampNonNegative(effectiveMonthlyInfraBurn),
    reliabilityRisk,
    scalingRisk,
    securityRisk,
    billShockRisk,
    outageRisk,
    investorTrustModifier,
    riskScoreModifier,
    explanation,
    warnings,
  };
}

