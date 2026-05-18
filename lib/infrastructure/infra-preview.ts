import {
  AIUsageTier,
  CloudCreditGrant,
  InfraUsageProfile,
  InfrastructureBurnEstimate,
  InfrastructureEventDefinition,
  InfrastructureStack,
} from "./types";
import { INFRASTRUCTURE_EVENT_CATALOG } from "./infra-events";
import { calculateInfrastructureBurn, getCloudCreditWarning } from "./infra-burn-engine";
import { getAIUsageTierDefinition, getInfrastructureStack } from "./infra-catalog";
import { normalizeStage } from "./infra-balance";

export interface InfrastructurePreviewStartupInput {
  id?: string;
  sector?: string | null;
  stage?: string | null;
  status?: string | null;
  monetizationModel?: string | null;
  description?: string | null;
  problem?: string | null;
  solution?: string | null;
  productProgress?: number | null;
  revenue?: number | null;
  riskScore?: number | null;
}

export interface InfrastructurePreviewSimulationPoint {
  monthNumber?: number;
  userGrowth?: number | null;
  revenue?: number | null;
  burnRate?: number | null;
}

export interface InfrastructurePreviewCloudCreditOffer {
  id: string;
  amount?: number | null;
  status?: string | null;
  providerScope?: CloudCreditGrant["providerScope"];
  expiresInSprints?: number | null;
  sourceOfferId?: string;
}

export interface InfrastructurePreviewInput {
  startup?: InfrastructurePreviewStartupInput | null;
  simulationHistory?: InfrastructurePreviewSimulationPoint[];
  cloudCreditOffers?: InfrastructurePreviewCloudCreditOffer[];
  currentSprint?: number | null;
}

export interface InfrastructurePreviewStartupRecord extends InfrastructurePreviewStartupInput {
  simulationMonths?: InfrastructurePreviewSimulationPoint[];
}

export function buildInfrastructurePreviewInputForStartup(input: {
  startup: InfrastructurePreviewStartupRecord;
  cloudCreditOffers?: InfrastructurePreviewCloudCreditOffer[];
  currentSprint?: number | null;
}): InfrastructurePreviewInput {
  return {
    startup: input.startup,
    simulationHistory: [...(input.startup.simulationMonths ?? [])],
    cloudCreditOffers: [...(input.cloudCreditOffers ?? [])],
    currentSprint: input.currentSprint ?? null,
  };
}

export interface InfrastructurePreview {
  recommendedStackId: string;
  alternateStackIds: string[];
  aiUsageTier: AIUsageTier;
  usageProfile: InfraUsageProfile;
  burnEstimate: InfrastructureBurnEstimate;
  stackFitReason: string;
  warnings: string[];
  tradeoffs: string[];
  futureEventsPreview: InfrastructureEventDefinition[];
  cloudCreditPreview: {
    credits: CloudCreditGrant[];
    totalAvailable: number;
    warning: string | null;
    note: string;
  };
  isAppliedToLiveBurn: false;
}

function textForStartup(startup?: InfrastructurePreviewStartupInput | null): string {
  return [
    startup?.sector,
    startup?.stage,
    startup?.monetizationModel,
    startup?.description,
    startup?.problem,
    startup?.solution,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function clampNonNegative(value: number | null | undefined): number {
  return Math.max(0, Math.round(value ?? 0));
}

function deriveUsers(history: InfrastructurePreviewSimulationPoint[] = []): number {
  return 100 + history.reduce((sum, point) => sum + clampNonNegative(point.userGrowth), 0);
}

function deriveTrafficVolatility(history: InfrastructurePreviewSimulationPoint[]): InfraUsageProfile["trafficVolatility"] {
  const latestGrowth = clampNonNegative(history[history.length - 1]?.userGrowth);
  if (latestGrowth >= 10_000) return "viral";
  if (latestGrowth >= 2_000) return "spiky";
  return "stable";
}

function recommendAIUsageTier(text: string, productProgress: number, users: number): AIUsageTier {
  const ai = includesAny(text, ["ai", "ml", "llm", "agent", "copilot", "automation", "machine learning", "inference"]);
  if (!ai) return "none";
  if (includesAny(text, ["agent", "workflow", "autonomous"])) return "agentic";
  if (includesAny(text, ["image", "audio", "video", "realtime", "multimodal"])) return "multimodal";
  if (productProgress >= 65 || users >= 25_000) return "heavy";
  return "moderate";
}

function isRegulated(text: string): boolean {
  return includesAny(text, ["fintech", "finance", "payment", "health", "healthcare", "insurance", "banking", "security", "cyber", "enterprise"]);
}

function isDatabaseHeavy(text: string): boolean {
  return includesAny(text, ["database", "data", "analytics", "crm", "workflow", "records", "platform", "saas", "fintech"]);
}

function recommendStack(input: {
  startup?: InfrastructurePreviewStartupInput | null;
  text: string;
  users: number;
  aiUsageTier: AIUsageTier;
}): { stackId: string; alternates: string[]; reason: string } {
  const status = input.startup?.status ?? "draft";
  const stage = normalizeStage(input.startup?.stage ?? status);
  const productProgress = clampNonNegative(input.startup?.productProgress);
  const revenue = clampNonNegative(input.startup?.revenue);
  const regulated = isRegulated(input.text);

  if (input.aiUsageTier !== "none") {
    return {
      stackId: "ai_heavy_stack",
      alternates: regulated ? ["aws_gcp_scale", "enterprise_cloud"] : ["vercel_serverless", "aws_gcp_scale"],
      reason: "AI-heavy classification raises token/API cost exposure, so the preview uses the AI-Heavy Stack.",
    };
  }

  if (regulated && (stage === "growth" || stage === "series_a" || stage === "enterprise" || revenue >= 50_000 || input.users >= 50_000)) {
    return {
      stackId: "enterprise_cloud",
      alternates: ["aws_gcp_scale", "supabase_neon_db"],
      reason: "Regulated or enterprise profile increases compliance readiness needs.",
    };
  }

  if (input.users >= 60_000 || revenue >= 100_000 || stage === "growth" || stage === "series_a") {
    return {
      stackId: "aws_gcp_scale",
      alternates: regulated ? ["enterprise_cloud", "render_full_stack"] : ["vercel_serverless", "render_full_stack"],
      reason: "High usage or later-stage traction increases scaling, egress, and observability pressure.",
    };
  }

  if (stage === "idea" || status === "draft" || productProgress < 15) {
    return {
      stackId: "replit_mvp",
      alternates: ["cheap_static_landing", "vercel_serverless"],
      reason: "Early prototype state favors a cheap, fast MVP stack before serious product traffic arrives.",
    };
  }

  if (isDatabaseHeavy(input.text) || regulated) {
    return {
      stackId: "supabase_neon_db",
      alternates: ["render_full_stack", "aws_gcp_scale"],
      reason: "Database-heavy and regulated workflows need stronger Postgres/storage posture than a static prototype.",
    };
  }

  if (includesAny(input.text, ["api", "backend", "workflow", "full-stack", "full stack"])) {
    return {
      stackId: "render_full_stack",
      alternates: ["vercel_serverless", "supabase_neon_db"],
      reason: "Backend-heavy product shape fits a managed full-stack app and database posture.",
    };
  }

  return {
    stackId: "vercel_serverless",
    alternates: ["render_full_stack", "supabase_neon_db"],
    reason: "Early SaaS, consumer, or marketplace products fit a serverless launch stack with high developer speed.",
  };
}

function buildUsageProfile(input: {
  startup?: InfrastructurePreviewStartupInput | null;
  history: InfrastructurePreviewSimulationPoint[];
  aiUsageTier: AIUsageTier;
  users: number;
  regulated: boolean;
}): InfraUsageProfile {
  const productProgress = clampNonNegative(input.startup?.productProgress);
  const monthlyActiveUsers = Math.max(50, Math.round(input.users * 0.42));
  const aiActive = input.aiUsageTier !== "none";

  return {
    users: input.users,
    monthlyActiveUsers,
    requestsPerUser: 90 + Math.round(productProgress * 1.8),
    dataTransferGb: Math.max(8, Math.round(monthlyActiveUsers * 0.018)),
    dbStorageGb: Math.max(2, Math.round(monthlyActiveUsers / 4500 + productProgress / 12)),
    aiRequestsPerUser:
      input.aiUsageTier === "none" ? 0 :
      input.aiUsageTier === "light" ? 1 :
      input.aiUsageTier === "moderate" ? 3 :
      input.aiUsageTier === "heavy" ? 8 :
      input.aiUsageTier === "agentic" ? 14 : 10,
    avgInputTokens:
      input.aiUsageTier === "agentic" ? 6000 :
      input.aiUsageTier === "multimodal" ? 3500 :
      aiActive ? 2200 : 0,
    avgOutputTokens:
      input.aiUsageTier === "agentic" ? 1800 :
      input.aiUsageTier === "multimodal" ? 1200 :
      aiActive ? 700 : 0,
    usesEmbeddings: input.aiUsageTier === "heavy" || input.aiUsageTier === "agentic",
    usesImageAudio: input.aiUsageTier === "multimodal",
    complianceLevel: input.regulated ? "regulated" : "none",
    trafficVolatility: deriveTrafficVolatility(input.history),
  };
}

function mapCloudCredits(offers: InfrastructurePreviewCloudCreditOffer[] = []): CloudCreditGrant[] {
  return offers
    .filter((offer) => clampNonNegative(offer.amount) > 0)
    .map((offer) => {
      const amount = clampNonNegative(offer.amount);
      return {
        id: `preview-credit-${offer.id}`,
        providerScope: offer.providerScope ?? "any",
        amount,
        remainingAmount: amount,
        expiresInSprints: Math.max(1, Math.round(offer.expiresInSprints ?? (offer.status === "accepted" ? 8 : 4))),
        restrictions: ["Preview-only credit estimate", "Not yet connected to live Monthly Burn"],
        sourceOfferId: offer.sourceOfferId ?? offer.id,
      };
    });
}

function selectFutureEvents(input: {
  stack: InfrastructureStack;
  estimate: InfrastructurePreview["burnEstimate"];
  usageProfile: InfraUsageProfile;
  aiUsageTier: AIUsageTier;
  hasCredits: boolean;
}): InfrastructureEventDefinition[] {
  const events: InfrastructureEventDefinition[] = [];
  const add = (id: string) => {
    const event = INFRASTRUCTURE_EVENT_CATALOG.find((candidate) => candidate.id === id);
    if (event && !events.some((existing) => existing.id === event.id)) events.push(event);
  };

  if (input.stack.id === "replit_mvp" || input.stack.id === "cheap_static_landing") add("prototype_outgrown");
  if (input.stack.id === "vercel_serverless" || input.usageProfile.trafficVolatility !== "stable") add("serverless_bill_spike");
  if (input.usageProfile.dbStorageGb >= 8 || input.stack.id === "supabase_neon_db") add("database_connection_limit");
  if (input.usageProfile.dataTransferGb >= 100 || input.usageProfile.trafficVolatility === "viral") add("bandwidth_egress_surprise");
  if (input.estimate.billShockRisk >= 45) add("logs_observability_spike");
  if (input.hasCredits) add("cloud_credits_expiring");
  if (input.aiUsageTier === "heavy" || input.aiUsageTier === "agentic" || input.aiUsageTier === "multimodal") add("llm_token_bill_shock");
  if (input.aiUsageTier === "multimodal") add("gpu_inference_overload");
  if (input.usageProfile.complianceLevel !== "none") add("compliance_infrastructure_upgrade");
  if (input.stack.id === "enterprise_cloud" || input.usageProfile.complianceLevel === "enterprise") add("enterprise_reliability_audit");

  if (events.length < 3) {
    add("bandwidth_egress_surprise");
    add("logs_observability_spike");
    add("enterprise_reliability_audit");
  }

  return events.slice(0, 5);
}

function buildTradeoffs(stack: InfrastructureStack, estimate: InfrastructurePreview["burnEstimate"]): string[] {
  const tradeoffs = [
    `${stack.title} trades ${stack.devSpeed >= 75 ? "high developer speed" : "operational control"} against ${stack.complexity >= 70 ? "high infrastructure complexity" : "limited scaling depth"}.`,
    `Investor trust modifier: ${estimate.investorTrustModifier >= 0 ? "+" : ""}${estimate.investorTrustModifier}. Risk modifier: ${estimate.riskScoreModifier >= 0 ? "+" : ""}${estimate.riskScoreModifier}.`,
  ];

  if (estimate.cloudCreditsApplied > 0) tradeoffs.push("Cloud credits improve the preview runway picture but hide gross burn until credits expire.");
  if (estimate.aiMonthlyCost > estimate.fixedMonthlyCost) tradeoffs.push("AI/API exposure is larger than fixed hosting in this preview.");
  if (estimate.complianceMonthlyCost > 0) tradeoffs.push("Compliance readiness adds burn but improves enterprise trust posture.");

  return tradeoffs;
}

export function buildInfrastructurePreview(input: InfrastructurePreviewInput): InfrastructurePreview {
  const history = [...(input.simulationHistory ?? [])];
  const startup = input.startup ?? null;
  const text = textForStartup(startup);
  const users = deriveUsers(history);
  const productProgress = clampNonNegative(startup?.productProgress);
  const regulated = isRegulated(text);
  const aiUsageTier = recommendAIUsageTier(text, productProgress, users);
  const recommendation = recommendStack({ startup, text, users, aiUsageTier });
  const usageProfile = buildUsageProfile({ startup, history, aiUsageTier, users, regulated });
  const cloudCredits = mapCloudCredits(input.cloudCreditOffers);
  const burnEstimate = calculateInfrastructureBurn({
    stackId: recommendation.stackId,
    startupStage: startup?.stage ?? startup?.status ?? "pre_seed",
    sector: startup?.sector ?? undefined,
    classification: text,
    usageProfile,
    aiUsageTier,
    cloudCredits,
    currentSprint: input.currentSprint ?? undefined,
    complianceRequired: regulated,
    productProgress: startup?.productProgress ?? undefined,
    revenue: startup?.revenue ?? undefined,
    userGrowth: history[history.length - 1]?.userGrowth ?? undefined,
  });
  const stack = getInfrastructureStack(recommendation.stackId);
  if (!stack) throw new Error(`Missing recommended infrastructure stack: ${recommendation.stackId}`);

  const futureEventsPreview = selectFutureEvents({
    stack,
    estimate: burnEstimate,
    usageProfile,
    aiUsageTier,
    hasCredits: cloudCredits.length > 0,
  });
  const aiDefinition = getAIUsageTierDefinition(aiUsageTier);
  const cloudCreditWarning = getCloudCreditWarning(cloudCredits);

  return {
    recommendedStackId: recommendation.stackId,
    alternateStackIds: recommendation.alternates,
    aiUsageTier,
    usageProfile,
    burnEstimate,
    stackFitReason: recommendation.reason,
    warnings: [
      ...burnEstimate.warnings,
      ...(aiDefinition?.warnings ?? []),
      "Preview mode: use runtime helpers for selected-stack burn and persistent cloud credit depletion.",
    ],
    tradeoffs: buildTradeoffs(stack, burnEstimate),
    futureEventsPreview,
    cloudCreditPreview: {
      credits: cloudCredits,
      totalAvailable: cloudCredits.reduce((sum, credit) => sum + credit.remainingAmount, 0),
      warning: cloudCreditWarning,
      note:
        cloudCredits.length > 0
          ? "Preview credits estimate the credit effect. Runtime credit balances deplete server-side during sprint simulation."
          : "Accept Cloud Credits from Growth Offers to create runtime infrastructure credit balances.",
    },
    isAppliedToLiveBurn: false,
  };
}
