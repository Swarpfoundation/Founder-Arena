import { describe, expect, it } from "vitest";
import {
  AI_USAGE_TIERS,
  INFRASTRUCTURE_EVENT_CATALOG,
  INFRASTRUCTURE_STACKS,
  applyCloudCredits,
  calculateInfrastructureBurn,
  decrementCloudCreditsOverTime,
  getCloudCreditWarning,
  getInfrastructureStack,
} from "@/lib/infrastructure";
import { AIUsageTier, CloudCreditGrant } from "@/lib/infrastructure/types";

const requiredStackIds = [
  "replit_mvp",
  "vercel_serverless",
  "render_full_stack",
  "supabase_neon_db",
  "aws_gcp_scale",
  "enterprise_cloud",
  "ai_heavy_stack",
];

function makeUsage(overrides = {}) {
  return {
    users: 5000,
    monthlyActiveUsers: 2500,
    requestsPerUser: 160,
    dataTransferGb: 80,
    dbStorageGb: 12,
    aiRequestsPerUser: 0,
    avgInputTokens: 0,
    avgOutputTokens: 0,
    usesEmbeddings: false,
    usesImageAudio: false,
    complianceLevel: "none" as const,
    trafficVolatility: "stable" as const,
    ...overrides,
  };
}

describe("Infrastructure stack catalog", () => {
  it("contains the required static archetypes", () => {
    for (const id of requiredStackIds) {
      expect(getInfrastructureStack(id), id).toBeDefined();
    }
  });

  it("gives every stack valid cost ranges and 0-100 ratings", () => {
    for (const stack of INFRASTRUCTURE_STACKS) {
      expect(stack.version).toBeTruthy();
      expect(stack.baseMonthlyCostRange.min).toBeGreaterThanOrEqual(0);
      expect(stack.baseMonthlyCostRange.max).toBeGreaterThan(stack.baseMonthlyCostRange.min);
      expect(stack.defaultMonthlyCost).toBeGreaterThanOrEqual(stack.baseMonthlyCostRange.min);
      expect(stack.defaultMonthlyCost).toBeLessThanOrEqual(stack.baseMonthlyCostRange.max);

      for (const rating of [
        stack.reliability,
        stack.scalability,
        stack.security,
        stack.devSpeed,
        stack.complexity,
        stack.investorTrust,
        stack.outageRisk,
        stack.lockInRisk,
        stack.aiReadiness,
        stack.complianceReadiness,
      ]) {
        expect(rating).toBeGreaterThanOrEqual(0);
        expect(rating).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("AI usage tiers", () => {
  it("increase modeled AI cost and bill shock risk monotonically", () => {
    const ordered: AIUsageTier[] = ["none", "light", "moderate", "heavy", "agentic", "multimodal"];
    const tierById = new Map(AI_USAGE_TIERS.map((tier) => [tier.id, tier]));

    for (let i = 1; i < ordered.length; i++) {
      const previous = tierById.get(ordered[i - 1]);
      const current = tierById.get(ordered[i]);
      expect(current?.baseMonthlyCost).toBeGreaterThanOrEqual(previous?.baseMonthlyCost ?? 0);
      expect(current?.billShockRisk).toBeGreaterThanOrEqual(previous?.billShockRisk ?? 0);
    }
  });
});

describe("Infrastructure burn engine", () => {
  it("is deterministic for identical inputs", () => {
    const input = {
      stackId: "vercel_serverless",
      startupStage: "seed",
      sector: "saas",
      usageProfile: makeUsage(),
      aiUsageTier: "light" as const,
    };

    expect(calculateInfrastructureBurn(input)).toEqual(calculateInfrastructureBurn(input));
  });

  it("keeps cheap stacks cheaper but riskier at high usage", () => {
    const highUsage = makeUsage({
      monthlyActiveUsers: 80_000,
      requestsPerUser: 500,
      dataTransferGb: 900,
      dbStorageGb: 80,
      trafficVolatility: "viral" as const,
    });

    const cheap = calculateInfrastructureBurn({
      stackId: "replit_mvp",
      startupStage: "growth",
      sector: "consumer",
      usageProfile: highUsage,
      aiUsageTier: "none",
    });

    const scale = calculateInfrastructureBurn({
      stackId: "aws_gcp_scale",
      startupStage: "growth",
      sector: "consumer",
      usageProfile: highUsage,
      aiUsageTier: "none",
    });

    expect(cheap.grossMonthlyInfraBurn).toBeLessThan(scale.grossMonthlyInfraBurn);
    expect(cheap.outageRisk).toBeGreaterThan(scale.outageRisk);
    expect(cheap.scalingRisk).toBeGreaterThanOrEqual(scale.scalingRisk);
  });

  it("makes enterprise cloud more expensive but safer for regulated usage", () => {
    const regulatedUsage = makeUsage({
      monthlyActiveUsers: 40_000,
      dataTransferGb: 500,
      dbStorageGb: 120,
      complianceLevel: "enterprise" as const,
    });

    const startupStack = calculateInfrastructureBurn({
      stackId: "render_full_stack",
      startupStage: "series_a",
      sector: "healthcare",
      usageProfile: regulatedUsage,
      complianceRequired: true,
    });

    const enterprise = calculateInfrastructureBurn({
      stackId: "enterprise_cloud",
      startupStage: "series_a",
      sector: "healthcare",
      usageProfile: regulatedUsage,
      complianceRequired: true,
    });

    expect(enterprise.grossMonthlyInfraBurn).toBeGreaterThan(startupStack.grossMonthlyInfraBurn);
    expect(enterprise.securityRisk).toBeLessThan(startupStack.securityRisk);
    expect(enterprise.investorTrustModifier).toBeGreaterThan(startupStack.investorTrustModifier);
  });

  it("creates bill shock warnings for AI-heavy agentic usage", () => {
    const estimate = calculateInfrastructureBurn({
      stackId: "ai_heavy_stack",
      startupStage: "growth",
      sector: "ai",
      usageProfile: makeUsage({
        monthlyActiveUsers: 25_000,
        aiRequestsPerUser: 12,
        avgInputTokens: 6000,
        avgOutputTokens: 1800,
        usesEmbeddings: true,
      }),
      aiUsageTier: "agentic",
    });

    expect(estimate.aiMonthlyCost).toBeGreaterThan(estimate.fixedMonthlyCost);
    expect(estimate.billShockRisk).toBeGreaterThanOrEqual(65);
    expect(estimate.warnings.join(" ")).toMatch(/Bill shock|Agentic/i);
  });

  it("adds compliance cost and trust for required compliance", () => {
    const base = calculateInfrastructureBurn({
      stackId: "aws_gcp_scale",
      startupStage: "seed",
      sector: "saas",
      usageProfile: makeUsage({ complianceLevel: "none" as const }),
      aiUsageTier: "none",
    });

    const regulated = calculateInfrastructureBurn({
      stackId: "aws_gcp_scale",
      startupStage: "seed",
      sector: "fintech",
      usageProfile: makeUsage({ complianceLevel: "none" as const }),
      complianceRequired: true,
      aiUsageTier: "none",
    });

    expect(regulated.complianceMonthlyCost).toBeGreaterThan(base.complianceMonthlyCost);
    expect(regulated.investorTrustModifier).toBeGreaterThan(base.investorTrustModifier);
  });
});

describe("Cloud credits", () => {
  const credits: CloudCreditGrant[] = [
    {
      id: "credit-aws-1",
      providerScope: ["aws", "google_cloud"],
      amount: 5000,
      remainingAmount: 5000,
      expiresInSprints: 2,
      restrictions: ["Scale stack only"],
    },
  ];

  it("reduce effective burn but not gross burn", () => {
    const estimate = calculateInfrastructureBurn({
      stackId: "aws_gcp_scale",
      startupStage: "seed",
      sector: "saas",
      usageProfile: makeUsage(),
      aiUsageTier: "none",
      cloudCredits: credits,
    });

    expect(estimate.grossMonthlyInfraBurn).toBeGreaterThan(estimate.effectiveMonthlyInfraBurn);
    expect(estimate.cloudCreditsApplied).toBeGreaterThan(0);
  });

  it("cannot make effective burn negative", () => {
    const application = applyCloudCredits(100, [
      {
        id: "large-credit",
        providerScope: "any",
        amount: 10_000,
        remainingAmount: 10_000,
        expiresInSprints: 4,
        restrictions: [],
      },
    ]);

    expect(application.creditsApplied).toBe(100);
    expect(100 - application.creditsApplied).toBe(0);
  });

  it("decrements expiry and warns near expiration", () => {
    const decremented = decrementCloudCreditsOverTime(credits, 1);
    expect(decremented[0].expiresInSprints).toBe(1);
    expect(getCloudCreditWarning(decremented)).toContain("expires in 1 sprint");
  });
});

describe("Infrastructure event catalog", () => {
  it("contains required future event designs", () => {
    const ids = INFRASTRUCTURE_EVENT_CATALOG.map((event) => event.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "prototype_outgrown",
        "serverless_bill_spike",
        "database_connection_limit",
        "bandwidth_egress_surprise",
        "logs_observability_spike",
        "cloud_credits_expiring",
        "llm_token_bill_shock",
        "gpu_inference_overload",
        "compliance_infrastructure_upgrade",
        "enterprise_reliability_audit",
      ])
    );
  });

  it("keeps events as deterministic design data", () => {
    for (const event of INFRASTRUCTURE_EVENT_CATALOG) {
      expect(event.triggerConditions.length).toBeGreaterThan(0);
      expect(event.futurePlayerChoices.length).toBeGreaterThan(0);
      expect(event.warningCopy).toBeTruthy();
    }
  });
});
