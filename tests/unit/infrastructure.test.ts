import { describe, expect, it } from "vitest";
import {
  AI_USAGE_TIERS,
  INFRASTRUCTURE_EVENT_CATALOG,
  INFRASTRUCTURE_STACKS,
  applyCloudCredits,
  appendInfrastructureFeedItems,
  buildInfrastructureEventPresentation,
  buildInfrastructureEventResolutionFeedItem,
  buildInfrastructureEventTriggerFeedItem,
  buildInfrastructurePreview,
  calculateRuntimeInfrastructureBurn,
  calculateInfrastructureBurn,
  decrementCloudCreditsOverTime,
  applyCloudCreditBalances,
  getCloudCreditCliffWarnings,
  getCloudCreditWarning,
  getInfrastructureStackOptions,
  getInfrastructureStack,
  groupInfrastructureEventsByWeek,
  mergeInfrastructureStateIntoAiAnalysis,
  parseInfrastructureState,
  resolveInfrastructureEvent,
  selectInfrastructureEventForSprint,
  selectInfrastructureStackInState,
  signalFromInfrastructureEventResolution,
  syncCloudCreditBalancesFromOffers,
  validateInfrastructureStackSelection,
} from "@/lib/infrastructure";
import { AIUsageTier, CloudCreditGrant } from "@/lib/infrastructure/types";
import { INFRA_BALANCE_SCENARIOS, evaluateInfraBalanceScenario } from "../fixtures/infra-balance-scenarios";

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

describe("Infrastructure preview builder", () => {
  it("is deterministic and marks estimates as preview-only", () => {
    const input = {
      startup: {
        sector: "saas",
        stage: "seed",
        status: "active",
        monetizationModel: "subscription",
        productProgress: 44,
        revenue: 12_000,
      },
      simulationHistory: [{ monthNumber: 1, userGrowth: 900 }],
      currentSprint: 2,
    };

    const first = buildInfrastructurePreview(input);
    const second = buildInfrastructurePreview(input);

    expect(first).toEqual(second);
    expect(first.isAppliedToLiveBurn).toBe(false);
  });

  it("recommends AI-heavy infrastructure for AI startups", () => {
    const preview = buildInfrastructurePreview({
      startup: {
        sector: "AI SaaS",
        stage: "seed",
        status: "active",
        description: "LLM support automation copilot",
        productProgress: 72,
      },
      simulationHistory: [{ userGrowth: 10_000 }],
    });

    expect(preview.recommendedStackId).toBe("ai_heavy_stack");
    expect(["heavy", "agentic", "multimodal"]).toContain(preview.aiUsageTier);
    expect(preview.burnEstimate.aiMonthlyCost).toBeGreaterThan(0);
  });

  it("recommends prototype-friendly stacks for missing or early data", () => {
    const preview = buildInfrastructurePreview({
      startup: {
        sector: "consumer",
        stage: "idea",
        status: "draft",
        productProgress: 0,
      },
      simulationHistory: [],
    });

    expect(["replit_mvp", "cheap_static_landing", "vercel_serverless"]).toContain(preview.recommendedStackId);
    expect(preview.usageProfile.monthlyActiveUsers).toBeGreaterThan(0);
  });

  it("recommends compliance-ready stacks for late regulated startups", () => {
    const preview = buildInfrastructurePreview({
      startup: {
        sector: "fintech",
        stage: "growth",
        status: "active",
        monetizationModel: "payments",
        description: "Enterprise payment workflow for banks",
        productProgress: 86,
        revenue: 120_000,
      },
      simulationHistory: [{ userGrowth: 80_000 }],
    });

    expect(["enterprise_cloud", "aws_gcp_scale"]).toContain(preview.recommendedStackId);
    expect(preview.burnEstimate.complianceMonthlyCost).toBeGreaterThan(0);
  });

  it("applies cloud credits to preview effective burn only", () => {
    const preview = buildInfrastructurePreview({
      startup: {
        sector: "saas",
        stage: "growth",
        status: "active",
        productProgress: 70,
        revenue: 80_000,
      },
      simulationHistory: [{ userGrowth: 50_000 }],
      cloudCreditOffers: [{ id: "cloud-offer-1", amount: 10_000, status: "accepted", expiresInSprints: 2 }],
    });

    expect(preview.cloudCreditPreview.totalAvailable).toBe(10_000);
    expect(preview.burnEstimate.cloudCreditsApplied).toBeGreaterThan(0);
    expect(preview.burnEstimate.grossMonthlyInfraBurn).toBeGreaterThan(preview.burnEstimate.effectiveMonthlyInfraBurn);
  });

  it("returns future event risks relevant to the preview", () => {
    const preview = buildInfrastructurePreview({
      startup: {
        sector: "ai",
        stage: "growth",
        status: "active",
        description: "Agentic AI workflow platform",
        productProgress: 82,
      },
      simulationHistory: [{ userGrowth: 30_000 }],
    });

    const eventIds = preview.futureEventsPreview.map((event) => event.id);
    expect(eventIds.length).toBeGreaterThanOrEqual(3);
    expect(eventIds).toContain("llm_token_bill_shock");
  });

  it("does not mutate preview input", () => {
    const input = {
      startup: { sector: "saas", stage: "seed", status: "active", productProgress: 50 },
      simulationHistory: [{ userGrowth: 1000 }],
      cloudCreditOffers: [{ id: "credit", amount: 5000, status: "proposed" }],
    };
    const before = JSON.stringify(input);

    buildInfrastructurePreview(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});

describe("Runtime infrastructure burn", () => {
  it("is deterministic and uses the recommended stack when no selected stack exists", () => {
    const input = {
      startup: {
        sector: "saas",
        stage: "seed",
        status: "active",
        productProgress: 50,
        revenue: 20_000,
      },
      simulationHistory: [{ userGrowth: 2000 }],
    };

    const first = calculateRuntimeInfrastructureBurn(input);
    const second = calculateRuntimeInfrastructureBurn(input);

    expect(first).toEqual(second);
    expect(first.sourceStackId).toBe(first.preview.recommendedStackId);
    expect(first.runtimeMonthlyInfraBurn).toBeGreaterThan(0);
  });

  it("caps early-stage burn conservatively", () => {
    const result = calculateRuntimeInfrastructureBurn({
      startup: {
        sector: "ai",
        stage: "pre_seed",
        status: "funded",
        description: "Agentic LLM workflow automation platform",
        productProgress: 85,
      },
      simulationHistory: [{ userGrowth: 200_000 }],
    });

    expect(result.uncappedGrossInfraBurn).toBeGreaterThan(result.grossInfraBurn);
    expect(result.capApplied).not.toBeNull();
    expect(result.grossInfraBurn).toBeLessThanOrEqual(1500);
  });

  it("makes AI-heavy runtime burn higher than non-AI runtime burn", () => {
    const base = {
      stage: "seed",
      status: "active",
      productProgress: 70,
    };
    const nonAi = calculateRuntimeInfrastructureBurn({
      startup: { ...base, sector: "saas", description: "B2B workflow CRM" },
      simulationHistory: [{ userGrowth: 8000 }],
    });
    const ai = calculateRuntimeInfrastructureBurn({
      startup: { ...base, sector: "ai", description: "AI agent support automation" },
      simulationHistory: [{ userGrowth: 8000 }],
    });

    expect(ai.aiApiBurn).toBeGreaterThan(nonAi.aiApiBurn);
    expect(ai.runtimeMonthlyInfraBurn).toBeGreaterThan(nonAi.runtimeMonthlyInfraBurn);
  });

  it("adds compliance burn for regulated runtime profiles", () => {
    const result = calculateRuntimeInfrastructureBurn({
      startup: {
        sector: "fintech",
        stage: "growth",
        status: "active",
        description: "Payments infrastructure for enterprise finance teams",
        productProgress: 80,
        revenue: 100_000,
      },
      simulationHistory: [{ userGrowth: 20_000 }],
    });

    expect(result.complianceBurn).toBeGreaterThan(0);
    expect(result.riskModifiersPreview.investorTrustModifier).toBeGreaterThan(0);
  });

  it("cloud credits reduce runtime burn but not gross burn", () => {
    const result = calculateRuntimeInfrastructureBurn({
      startup: {
        sector: "saas",
        stage: "growth",
        status: "active",
        productProgress: 80,
        revenue: 120_000,
      },
      simulationHistory: [{ userGrowth: 50_000 }],
      cloudCreditOffers: [{ id: "accepted-credit", amount: 10_000, status: "accepted", expiresInSprints: 3 }],
    });

    expect(result.creditsApplied).toBeGreaterThan(0);
    expect(result.runtimeMonthlyInfraBurn).toBe(result.grossInfraBurn - result.creditsApplied);
    expect(result.runtimeMonthlyInfraBurn).toBeGreaterThanOrEqual(0);
  });
});

describe("Persistent infrastructure stack selection", () => {
  const seedInput = {
    startup: {
      id: "startup-1",
      sector: "saas",
      stage: "seed",
      status: "active",
      description: "B2B workflow platform for revenue teams",
      productProgress: 55,
      revenue: 25_000,
    },
    simulationHistory: [{ monthNumber: 1, userGrowth: 5000 }],
    currentSprint: 4,
  };

  it("persists selected stack state in aiAnalysis without losing existing fields", () => {
    const initial = parseInfrastructureState({ classification: { primaryStartupType: "saas_b2b" } });
    const selected = selectInfrastructureStackInState({
      state: initial,
      stackId: "render_full_stack",
      previewInput: seedInput,
      currentSprint: 4,
    }).state;
    const merged = mergeInfrastructureStateIntoAiAnalysis({ classification: { primaryStartupType: "saas_b2b" } }, selected);

    expect((merged.classification as { primaryStartupType: string }).primaryStartupType).toBe("saas_b2b");
    expect(parseInfrastructureState(merged).selectedStackId).toBe("render_full_stack");
  });

  it("rejects unknown or locked stack selections server-side through pure validation", () => {
    expect(validateInfrastructureStackSelection("not_real", seedInput).valid).toBe(false);

    const earlyInput = {
      startup: { sector: "consumer", stage: "idea", status: "draft", productProgress: 0 },
      simulationHistory: [],
      currentSprint: 1,
    };
    const enterprise = validateInfrastructureStackSelection("enterprise_cloud", earlyInput);

    expect(enterprise.valid).toBe(false);
    expect(enterprise.reason).toMatch(/requires|regulated|enterprise/i);
  });

  it("uses selected stack for runtime burn when selection is valid", () => {
    const recommended = calculateRuntimeInfrastructureBurn(seedInput);
    const selected = calculateRuntimeInfrastructureBurn(seedInput, { selectedStackId: "render_full_stack" });

    expect(selected.sourceStackId).toBe("render_full_stack");
    expect(selected.runtimeMonthlyInfraBurn).not.toBe(recommended.runtimeMonthlyInfraBurn);
  });

  it("models cheaper stack as lower burn but higher risk than enterprise stack", () => {
    const scaleInput = {
      startup: {
        sector: "fintech",
        stage: "growth",
        status: "active",
        description: "Enterprise payment data platform",
        productProgress: 88,
        revenue: 160_000,
      },
      simulationHistory: [{ userGrowth: 90_000 }],
      currentSprint: 8,
    };
    const cheap = calculateRuntimeInfrastructureBurn(scaleInput, { selectedStackId: "cheap_static_landing" });
    const enterprise = calculateRuntimeInfrastructureBurn(scaleInput, { selectedStackId: "enterprise_cloud" });

    expect(cheap.runtimeMonthlyInfraBurn).toBeLessThan(enterprise.runtimeMonthlyInfraBurn);
    expect(cheap.riskModifiersPreview.outageRisk).toBeGreaterThan(enterprise.riskModifiersPreview.outageRisk);
    expect(enterprise.riskModifiersPreview.investorTrustModifier).toBeGreaterThan(cheap.riskModifiersPreview.investorTrustModifier);
  });

  it("prevents switching selected stack more than once in a sprint", () => {
    const first = selectInfrastructureStackInState({
      state: parseInfrastructureState({}),
      stackId: "vercel_serverless",
      previewInput: seedInput,
      currentSprint: 4,
    }).state;

    expect(() =>
      selectInfrastructureStackInState({
        state: first,
        stackId: "render_full_stack",
        previewInput: seedInput,
        currentSprint: 4,
      })
    ).toThrow(/once per sprint/);
  });

  it("returns stack options with available and locked states", () => {
    const options = getInfrastructureStackOptions({
      startup: { sector: "consumer", stage: "idea", status: "draft", productProgress: 0 },
      simulationHistory: [],
      currentSprint: 1,
    });

    expect(options.find((option) => option.stackId === "replit_mvp")?.allowed).toBe(true);
    expect(options.find((option) => option.stackId === "enterprise_cloud")?.allowed).toBe(false);
  });
});

describe("Persistent cloud credit lifecycle", () => {
  it("syncs accepted cloud credit offers idempotently", () => {
    const state = parseInfrastructureState({});
    const synced = syncCloudCreditBalancesFromOffers(
      state,
      [{ id: "offer-1", amount: 5000, status: "accepted", sourceOfferId: "offer-1" }],
      3,
      "startup-1"
    );
    const syncedAgain = syncCloudCreditBalancesFromOffers(
      synced,
      [{ id: "offer-1", amount: 5000, status: "accepted", sourceOfferId: "offer-1" }],
      3,
      "startup-1"
    );

    expect(synced.creditBalances).toHaveLength(1);
    expect(syncedAgain.creditBalances).toHaveLength(1);
    expect(synced.creditBalances[0].expiresAtSprint).toBeGreaterThanOrEqual(3);
  });

  it("applies credits only to infra burn and never below zero", () => {
    const synced = syncCloudCreditBalancesFromOffers(
      parseInfrastructureState({}),
      [{ id: "offer-1", amount: 10_000, status: "accepted" }],
      2
    );
    const applied = applyCloudCreditBalances({
      grossInfraBurn: 750,
      balances: synced.creditBalances,
      provider: "aws",
      currentSprint: 2,
    });

    expect(applied.creditsApplied).toBe(750);
    expect(applied.updatedBalances[0].remainingAmount).toBe(9250);
  });

  it("does not double-deplete credits for the same sprint", () => {
    const synced = syncCloudCreditBalancesFromOffers(
      parseInfrastructureState({}),
      [{ id: "offer-1", amount: 5000, status: "accepted" }],
      5
    );
    const first = applyCloudCreditBalances({
      grossInfraBurn: 1000,
      balances: synced.creditBalances,
      provider: "vercel",
      currentSprint: 5,
    });
    const retry = applyCloudCreditBalances({
      grossInfraBurn: 1000,
      balances: first.updatedBalances,
      provider: "vercel",
      currentSprint: 5,
    });

    expect(first.creditsApplied).toBe(1000);
    expect(retry.creditsApplied).toBe(0);
    expect(retry.updatedBalances[0].remainingAmount).toBe(4000);
  });

  it("expires and depletes credits at expected lifecycle points", () => {
    const synced = syncCloudCreditBalancesFromOffers(
      parseInfrastructureState({}),
      [{ id: "offer-1", amount: 500, status: "accepted", expiresInSprints: 1 }],
      4
    );
    const depleted = applyCloudCreditBalances({
      grossInfraBurn: 1000,
      balances: synced.creditBalances,
      provider: "render",
      currentSprint: 4,
    });
    const expired = applyCloudCreditBalances({
      grossInfraBurn: 1000,
      balances: synced.creditBalances,
      provider: "render",
      currentSprint: 6,
    });

    expect(depleted.updatedBalances[0].status).toBe("depleted");
    expect(expired.updatedBalances[0].status).toBe("expired");
    expect(expired.creditsApplied).toBe(0);
  });

  it("adds credit cliff warnings when credits are low or near expiry", () => {
    const warnings = getCloudCreditCliffWarnings(
      [
        {
          id: "credit-low",
          providerScope: "any",
          originalAmount: 10_000,
          remainingAmount: 1500,
          acceptedAtSprint: 1,
          expiresAtSprint: 6,
          status: "active",
          totalApplied: 8500,
          restrictions: [],
        },
      ],
      4000,
      5
    );

    expect(warnings.join(" ")).toMatch(/below 20%|expires/i);
  });
});

describe("Infrastructure balance scenario sweep", () => {
  it("covers the required eight startup profiles", () => {
    expect(INFRA_BALANCE_SCENARIOS.map((scenario) => scenario.id)).toEqual(
      expect.arrayContaining([
        "cheap_prototype",
        "standard_saas_mvp",
        "db_heavy_fintech",
        "ai_saas",
        "agentic_ai_startup",
        "enterprise_regulated",
        "high_traction_growth",
        "cloud_credit_masked",
      ])
    );
  });

  it.each(INFRA_BALANCE_SCENARIOS)("$title stays inside balance sanity bounds", (scenario) => {
    const evaluation = evaluateInfraBalanceScenario(scenario);
    const { runtime, totalWithInfra, totalWithoutInfra } = evaluation;

    expect(runtime.runtimeMonthlyInfraBurn).toBeGreaterThanOrEqual(0);
    expect(runtime.grossInfraBurn).toBeGreaterThanOrEqual(runtime.runtimeMonthlyInfraBurn);
    expect(totalWithInfra.totalMonthlyBurn).toBeGreaterThan(0);
    expect(totalWithInfra.totalMonthlyBurn).toBeLessThanOrEqual(
      totalWithoutInfra.totalMonthlyBurn + runtime.runtimeMonthlyInfraBurn
    );
    expect(totalWithInfra.infrastructureCostsMonthly).toBe(runtime.runtimeMonthlyInfraBurn);
    expect(totalWithInfra.grossInfrastructureCostsMonthly).toBe(runtime.grossInfraBurn);

    if (scenario.selectedStackId) {
      expect(runtime.sourceStackId).toBe(scenario.selectedStackId);
    }
    if (scenario.expected.recommendedStacks) {
      expect(scenario.expected.recommendedStacks).toContain(runtime.preview.recommendedStackId);
    }
    if (scenario.expected.maxEffectiveInfraBurn !== undefined) {
      expect(runtime.runtimeMonthlyInfraBurn).toBeLessThanOrEqual(scenario.expected.maxEffectiveInfraBurn);
    }
    if (scenario.expected.minEffectiveInfraBurn !== undefined) {
      expect(runtime.runtimeMonthlyInfraBurn).toBeGreaterThanOrEqual(scenario.expected.minEffectiveInfraBurn);
    }
    if (scenario.expected.requiresAiBurn) {
      expect(runtime.aiApiBurn).toBeGreaterThan(0);
    }
    if (scenario.expected.requiresComplianceBurn) {
      expect(runtime.complianceBurn).toBeGreaterThan(0);
    }
    if (scenario.expected.requiresCreditWarning) {
      expect(runtime.creditsApplied).toBeGreaterThan(0);
      expect(runtime.warnings.join(" ")).toMatch(/credit|cliff|expires/i);
    }
  });

  it("keeps early prototype infrastructure conservative relative to total burn", () => {
    const prototype = evaluateInfraBalanceScenario(
      INFRA_BALANCE_SCENARIOS.find((scenario) => scenario.id === "cheap_prototype")!
    );

    expect(prototype.runtime.runtimeMonthlyInfraBurn).toBeLessThanOrEqual(50);
    expect(prototype.runtime.runtimeMonthlyInfraBurn / prototype.totalWithInfra.totalMonthlyBurn).toBeLessThan(0.08);
  });

  it("makes AI-heavy profiles more expensive than comparable non-AI profiles", () => {
    const standard = evaluateInfraBalanceScenario(
      INFRA_BALANCE_SCENARIOS.find((scenario) => scenario.id === "standard_saas_mvp")!
    );
    const aiSaas = evaluateInfraBalanceScenario(
      INFRA_BALANCE_SCENARIOS.find((scenario) => scenario.id === "ai_saas")!
    );
    const agentic = evaluateInfraBalanceScenario(
      INFRA_BALANCE_SCENARIOS.find((scenario) => scenario.id === "agentic_ai_startup")!
    );

    expect(aiSaas.runtime.aiApiBurn).toBeGreaterThan(standard.runtime.aiApiBurn);
    expect(aiSaas.runtime.runtimeMonthlyInfraBurn).toBeGreaterThan(standard.runtime.runtimeMonthlyInfraBurn);
    expect(agentic.runtime.aiApiBurn).toBeGreaterThan(aiSaas.runtime.aiApiBurn);
    expect(agentic.runtime.warnings.join(" ")).toMatch(/bill shock|agentic|AI/i);
  });

  it("makes enterprise/regulatory posture cost more while improving trust and security risk", () => {
    const scenario = INFRA_BALANCE_SCENARIOS.find((candidate) => candidate.id === "enterprise_regulated")!;
    const startupStack = calculateRuntimeInfrastructureBurn(scenario.input, { selectedStackId: "render_full_stack" });
    const enterprise = calculateRuntimeInfrastructureBurn(scenario.input, { selectedStackId: "enterprise_cloud" });

    expect(enterprise.runtimeMonthlyInfraBurn).toBeGreaterThan(startupStack.runtimeMonthlyInfraBurn);
    expect(enterprise.riskModifiersPreview.securityRisk).toBeLessThan(startupStack.riskModifiersPreview.securityRisk);
    expect(enterprise.riskModifiersPreview.investorTrustModifier).toBeGreaterThan(startupStack.riskModifiersPreview.investorTrustModifier);
  });

  it("prevents legacy cloud and AI operating categories from double-counting with runtime infra", () => {
    const aiScenario = evaluateInfraBalanceScenario(
      INFRA_BALANCE_SCENARIOS.find((scenario) => scenario.id === "ai_saas")!
    );
    const categoriesWithInfra = aiScenario.totalWithInfra.operatingBreakdown.map((item) => item.category);
    const categoriesWithoutInfra = aiScenario.totalWithoutInfra.operatingBreakdown.map((item) => item.category);

    expect(categoriesWithoutInfra).toEqual(expect.arrayContaining(["AI Inference / API", "Cloud Infrastructure"]));
    expect(categoriesWithInfra).not.toContain("AI Inference / API");
    expect(categoriesWithInfra).not.toContain("Cloud Infrastructure");
    expect(aiScenario.netInfraImpact).toBeLessThanOrEqual(aiScenario.runtime.runtimeMonthlyInfraBurn);
  });

  it("stress-tests cloud credits across multiple sprints without double depletion", () => {
    const scenario = INFRA_BALANCE_SCENARIOS.find((candidate) => candidate.id === "cloud_credit_masked")!;
    const first = calculateRuntimeInfrastructureBurn(scenario.input, {
      selectedStackId: scenario.selectedStackId,
      creditBalances: scenario.creditBalances,
    });
    const retry = calculateRuntimeInfrastructureBurn(scenario.input, {
      selectedStackId: scenario.selectedStackId,
      creditBalances: first.creditBalances,
    });
    const nextSprint = calculateRuntimeInfrastructureBurn(
      { ...scenario.input, currentSprint: (scenario.input.currentSprint ?? 10) + 1 },
      {
        selectedStackId: scenario.selectedStackId,
        creditBalances: first.creditBalances,
      }
    );

    expect(first.creditsApplied).toBeGreaterThan(0);
    expect(retry.creditsApplied).toBe(0);
    expect(nextSprint.creditsApplied).toBeGreaterThanOrEqual(0);
    expect(first.runtimeMonthlyInfraBurn).toBe(first.grossInfraBurn - first.creditsApplied);
    expect(first.warnings.join(" ")).toMatch(/credit|cliff|expires/i);
  });
});

describe("Live infrastructure events", () => {
  function triggerEvent(input: {
    startup: NonNullable<Parameters<typeof calculateRuntimeInfrastructureBurn>[0]["startup"]>;
    simulationHistory?: Parameters<typeof calculateRuntimeInfrastructureBurn>[0]["simulationHistory"];
    selectedStackId?: string;
    creditBalances?: ReturnType<typeof parseInfrastructureState>["creditBalances"];
    currentSprint?: number;
    state?: ReturnType<typeof parseInfrastructureState>;
  }) {
    const previewInput = {
      startup: input.startup,
      simulationHistory: input.simulationHistory ?? [],
      currentSprint: input.currentSprint ?? 6,
    };
    const runtime = calculateRuntimeInfrastructureBurn(previewInput, {
      selectedStackId: input.selectedStackId,
      creditBalances: input.creditBalances,
    });
    const state = input.state ?? {
      ...parseInfrastructureState({}),
      creditBalances: input.creditBalances ?? [],
    };
    return selectInfrastructureEventForSprint({
      state,
      previewInput,
      runtime,
      currentSprint: input.currentSprint ?? 6,
    }).event;
  }

  it("can trigger each required infra event type from deterministic infra state", () => {
    const creditState = parseInfrastructureState({
      infrastructure: {
        creditBalances: [{
          id: "credit-cliff",
          providerScope: "any",
          originalAmount: 50_000,
          remainingAmount: 9000,
          acceptedAtSprint: 3,
          expiresAtSprint: 7,
          status: "active",
          totalApplied: 41_000,
          lastAppliedSprint: 5,
          restrictions: [],
        }],
      },
    });
    const previousCompliance = parseInfrastructureState({
      infrastructure: {
        infraEventHistory: [{
          id: "infra:compliance_infrastructure_upgrade:w5",
          type: "compliance_infrastructure_upgrade",
          week: 5,
          severity: "moderate",
          title: "Compliance Infrastructure Upgrade",
          triggerReason: "Already tested.",
          responseOptions: [],
          resolved: true,
        }],
      },
    });
    const previousComplianceAndDatabase = parseInfrastructureState({
      infrastructure: {
        infraEventHistory: [
          {
            id: "infra:compliance_infrastructure_upgrade:w5",
            type: "compliance_infrastructure_upgrade",
            week: 5,
            severity: "moderate",
            title: "Compliance Infrastructure Upgrade",
            triggerReason: "Already tested.",
            responseOptions: [],
            resolved: true,
          },
          {
            id: "infra:database_connection_limit:w6",
            type: "database_connection_limit",
            week: 6,
            severity: "moderate",
            title: "Database Connection Limit",
            triggerReason: "Already tested.",
            responseOptions: [],
            resolved: true,
          },
        ],
      },
    });
    const previousBandwidth = parseInfrastructureState({
      infrastructure: {
        infraEventHistory: [{
          id: "infra:bandwidth_egress_surprise:w5",
          type: "bandwidth_egress_surprise",
          week: 5,
          severity: "moderate",
          title: "Bandwidth / Egress Surprise",
          triggerReason: "Already tested.",
          responseOptions: [],
          resolved: true,
        }],
      },
    });
    const previousDatabase = parseInfrastructureState({
      infrastructure: {
        infraEventHistory: [{
          id: "infra:database_connection_limit:w5",
          type: "database_connection_limit",
          week: 5,
          severity: "moderate",
          title: "Database Connection Limit",
          triggerReason: "Already tested.",
          responseOptions: [],
          resolved: true,
        }],
      },
    });

    const cases = [
      {
        expected: "prototype_outgrown",
        startup: { sector: "consumer", stage: "prototype", status: "active", description: "Consumer prototype", productProgress: 45, revenue: 0 },
        selectedStackId: "cheap_static_landing",
        simulationHistory: [{ userGrowth: 6000 }],
      },
      {
        expected: "serverless_bill_spike",
        startup: { sector: "SaaS", stage: "growth", status: "active", description: "Workflow SaaS", productProgress: 70, revenue: 70_000 },
        selectedStackId: "vercel_serverless",
        simulationHistory: [{ userGrowth: 30_000 }],
      },
      {
        expected: "database_connection_limit",
        startup: { sector: "fintech", stage: "seed", status: "active", description: "Database records workflow", productProgress: 62, revenue: 20_000 },
        selectedStackId: "supabase_neon_db",
        simulationHistory: [{ userGrowth: 9000 }],
      },
      {
        expected: "bandwidth_egress_surprise",
        startup: { sector: "marketplace", stage: "growth", status: "active", description: "Media marketplace traffic", productProgress: 82, revenue: 150_000 },
        selectedStackId: "aws_gcp_scale",
        simulationHistory: [{ userGrowth: 120_000 }],
      },
      {
        expected: "logs_observability_spike",
        startup: { sector: "SaaS", stage: "seed", status: "active", description: "B2B workflow", productProgress: 72, revenue: 40_000 },
        selectedStackId: "aws_gcp_scale",
        simulationHistory: [{ userGrowth: 18_000 }],
        state: previousBandwidth,
      },
      {
        expected: "cloud_credits_expiring",
        startup: { sector: "SaaS", stage: "growth", status: "active", description: "High traffic SaaS", productProgress: 86, revenue: 90_000 },
        selectedStackId: "aws_gcp_scale",
        simulationHistory: [{ userGrowth: 75_000 }],
        creditBalances: creditState.creditBalances,
        currentSprint: 6,
      },
      {
        expected: "llm_token_bill_shock",
        startup: { sector: "AI infrastructure", stage: "growth", status: "active", description: "Agentic AI workflow automation", productProgress: 84, revenue: 110_000 },
        selectedStackId: "ai_heavy_stack",
        simulationHistory: [{ userGrowth: 42_000 }],
      },
      {
        expected: "compliance_infrastructure_upgrade",
        startup: { sector: "healthcare fintech", stage: "seed", status: "active", description: "Regulated healthcare finance platform", productProgress: 55, revenue: 30_000 },
        selectedStackId: "aws_gcp_scale",
        simulationHistory: [{ userGrowth: 5000 }],
        state: previousDatabase,
      },
      {
        expected: "enterprise_reliability_audit",
        startup: { sector: "enterprise healthcare", stage: "growth", status: "active", description: "Enterprise hospital platform", productProgress: 78, revenue: 130_000 },
        selectedStackId: "render_full_stack",
        simulationHistory: [{ userGrowth: 20_000 }],
        state: previousComplianceAndDatabase,
        currentSprint: 8,
      },
    ];

    for (const testCase of cases) {
      const event = triggerEvent(testCase);
      expect(event?.type, testCase.expected).toBe(testCase.expected);
      expect(event?.responseOptions.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("does not trigger below threshold or before Week 3", () => {
    const early = triggerEvent({
      startup: { sector: "consumer", stage: "idea", status: "active", description: "Tiny prototype", productProgress: 5, revenue: 0 },
      selectedStackId: "cheap_static_landing",
      simulationHistory: [],
      currentSprint: 2,
    });
    const quiet = triggerEvent({
      startup: { sector: "SaaS", stage: "seed", status: "active", description: "Small B2B workflow", productProgress: 20, revenue: 1000 },
      selectedStackId: "vercel_serverless",
      simulationHistory: [{ userGrowth: 100 }],
      currentSprint: 4,
    });

    expect(early).toBeNull();
    expect(quiet).toBeNull();
  });

  it("prevents repeat event types, multiple events in one sprint, and open-event stacking", () => {
    const openState = parseInfrastructureState({
      infrastructure: {
        infraEventHistory: [{
          id: "infra:prototype_outgrown:w4",
          type: "prototype_outgrown",
          week: 4,
          severity: "moderate",
          title: "Prototype Outgrown",
          triggerReason: "Open.",
          responseOptions: [],
          resolved: false,
        }],
      },
    });
    const repeatedState = parseInfrastructureState({
      infrastructure: {
        infraEventHistory: [{
          id: "infra:prototype_outgrown:w4",
          type: "prototype_outgrown",
          week: 4,
          severity: "moderate",
          title: "Prototype Outgrown",
          triggerReason: "Resolved.",
          responseOptions: [],
          resolved: true,
        }],
      },
    });

    const openAttempt = triggerEvent({
      state: openState,
      startup: { sector: "consumer", stage: "prototype", status: "active", description: "Consumer prototype", productProgress: 50, revenue: 0 },
      selectedStackId: "cheap_static_landing",
      simulationHistory: [{ userGrowth: 7000 }],
      currentSprint: 5,
    });
    const repeatAttempt = triggerEvent({
      state: repeatedState,
      startup: { sector: "consumer", stage: "prototype", status: "active", description: "Consumer prototype", productProgress: 50, revenue: 0 },
      selectedStackId: "cheap_static_landing",
      simulationHistory: [{ userGrowth: 7000 }],
      currentSprint: 5,
    });

    expect(openAttempt).toBeNull();
    expect(repeatAttempt).toBeNull();
  });

  it("resolves valid responses deterministically and rejects invalid responses", () => {
    const event = triggerEvent({
      startup: { sector: "AI infrastructure", stage: "growth", status: "active", description: "Agentic AI workflow automation", productProgress: 84, revenue: 110_000 },
      selectedStackId: "ai_heavy_stack",
      simulationHistory: [{ userGrowth: 42_000 }],
      currentSprint: 8,
    });
    const state = parseInfrastructureState({ infrastructure: { infraEventHistory: [event] } });
    const responseId = event!.responseOptions[0].id;
    const resolved = resolveInfrastructureEvent({ state, eventId: event!.id, responseId });
    const retry = resolveInfrastructureEvent({ state: resolved.state, eventId: event!.id, responseId });

    expect(resolved.event.resolved).toBe(true);
    expect(resolved.event.selectedResponseId).toBe(responseId);
    expect(resolved.effect.riskDelta).toBeLessThanOrEqual(0);
    expect(retry.effect).toEqual({});
    expect(() => resolveInfrastructureEvent({ state, eventId: event!.id, responseId: "fake" })).toThrow(/Invalid/);
  });

  it("builds idempotent Arena Feed entries for infra trigger and resolution", () => {
    const event = triggerEvent({
      startup: { sector: "AI infrastructure", stage: "growth", status: "active", description: "Agentic AI workflow automation", productProgress: 84, revenue: 110_000 },
      selectedStackId: "ai_heavy_stack",
      simulationHistory: [{ userGrowth: 42_000 }],
      currentSprint: 8,
    });
    const state = parseInfrastructureState({ infrastructure: { infraEventHistory: [event] } });
    const resolved = resolveInfrastructureEvent({ state, eventId: event!.id, responseId: event!.responseOptions[0].id });
    const triggerFeed = buildInfrastructureEventTriggerFeedItem(event!);
    const resolutionFeed = buildInfrastructureEventResolutionFeedItem(resolved.event);
    const feed = appendInfrastructureFeedItems([], [triggerFeed, resolutionFeed, triggerFeed, resolutionFeed]);

    expect(triggerFeed.category).toBe("infrastructure");
    expect(triggerFeed.title).toContain("Infrastructure Warning");
    expect(resolutionFeed?.category).toBe("operations");
    expect(feed).toHaveLength(2);
  });

  it("maps critical infra events into reveal presentations and week-grouped history", () => {
    const event = {
      id: "infra:cloud_credits_expiring:w10",
      type: "cloud_credits_expiring",
      week: 10,
      severity: "critical" as const,
      title: "Cloud Credits Cliff",
      triggerReason: "Credits are masking gross infrastructure burn.",
      responseOptions: [],
      resolved: false,
    };
    const presentation = buildInfrastructureEventPresentation({ startupId: "startup_1", event });
    const groups = groupInfrastructureEventsByWeek([
      event,
      { ...event, id: "infra:llm_token_bill_shock:w8", type: "llm_token_bill_shock", week: 8, title: "LLM Token Bill Shock" },
    ]);

    expect(presentation.severity).toBe("critical");
    expect(presentation.primaryCta?.href).toBe("/startup/startup_1/infrastructure");
    expect(presentation.affectedStats?.some((stat) => stat.label === "Founder Week")).toBe(true);
    expect(groups.map((group) => group.week)).toEqual([10, 8]);
  });

  it("emits a small strategy signal for resolved infra responses without duplicating source ids", () => {
    const event = triggerEvent({
      startup: { sector: "SaaS", stage: "growth", status: "active", description: "Workflow SaaS", productProgress: 70, revenue: 70_000 },
      selectedStackId: "vercel_serverless",
      simulationHistory: [{ userGrowth: 30_000 }],
      currentSprint: 7,
    });
    const state = parseInfrastructureState({ infrastructure: { infraEventHistory: [event] } });
    const cacheResponse = event!.responseOptions.find((response) => response.id === "cache_hot_paths")!;
    const resolved = resolveInfrastructureEvent({ state, eventId: event!.id, responseId: cacheResponse.id });
    const signal = signalFromInfrastructureEventResolution(resolved.event);
    const duplicate = signalFromInfrastructureEventResolution(resolved.event);

    expect(signal?.source).toBe("infrastructure_event");
    expect(signal?.playstyle).toBe("technical_builder");
    expect(signal?.weight).toBeLessThanOrEqual(6);
    expect(duplicate?.sourceId).toBe(signal?.sourceId);
  });

  it("caps event history growth before triggering more infra events", () => {
    const fullHistory = parseInfrastructureState({
      infrastructure: {
        infraEventHistory: Array.from({ length: 5 }, (_, index) => ({
          id: `infra:old_${index}:w${index + 3}`,
          type: `old_${index}`,
          week: index + 3,
          severity: "minor",
          title: "Old Event",
          triggerReason: "Cap fixture.",
          responseOptions: [],
          resolved: true,
        })),
      },
    });
    const event = triggerEvent({
      state: fullHistory,
      startup: { sector: "AI infrastructure", stage: "growth", status: "active", description: "Agentic AI workflow automation", productProgress: 84, revenue: 110_000 },
      selectedStackId: "ai_heavy_stack",
      simulationHistory: [{ userGrowth: 42_000 }],
      currentSprint: 10,
    });

    expect(event).toBeNull();
  });
});
