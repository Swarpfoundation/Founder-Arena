export const INFRASTRUCTURE_ECONOMY_VERSION = "2026.05.v0";

export type InfrastructureProvider =
  | "replit"
  | "vercel"
  | "render"
  | "supabase_neon"
  | "aws"
  | "google_cloud"
  | "enterprise_cloud"
  | "ai_heavy_stack"
  | "cloudflare"
  | "static_landing"
  | "custom";

export type StartupStage =
  | "idea"
  | "prototype"
  | "pre_seed"
  | "seed"
  | "growth"
  | "series_a"
  | "enterprise";

export type InfraCostComponent =
  | "frontend_hosting"
  | "backend_compute"
  | "database"
  | "storage"
  | "bandwidth_egress"
  | "build_deploy_usage"
  | "logs_monitoring"
  | "llm_api"
  | "embeddings"
  | "gpu_inference"
  | "compliance_overhead"
  | "devops_overhead";

export type AIUsageTier =
  | "none"
  | "light"
  | "moderate"
  | "heavy"
  | "agentic"
  | "multimodal";

export type ComplianceLevel = "none" | "basic" | "regulated" | "enterprise";
export type TrafficVolatility = "stable" | "spiky" | "viral";
export type InfraEventSeverity = "low" | "medium" | "high" | "critical";

export interface CostRange {
  min: number;
  max: number;
}

export interface InfrastructureStack {
  id: string;
  version: string;
  provider: InfrastructureProvider;
  title: string;
  description: string;
  stageFit: StartupStage[];
  baseMonthlyCostRange: CostRange;
  defaultMonthlyCost: number;
  variableCostDrivers: InfraCostComponent[];
  reliability: number;
  scalability: number;
  security: number;
  devSpeed: number;
  complexity: number;
  investorTrust: number;
  outageRisk: number;
  lockInRisk: number;
  aiReadiness: number;
  complianceReadiness: number;
  tags: string[];
}

export interface AIUsageTierDefinition {
  id: AIUsageTier;
  title: string;
  description: string;
  baseMonthlyCost: number;
  costMultiplier: number;
  billShockRisk: number;
  investorTrustModifier: number;
  riskScoreModifier: number;
  warnings: string[];
}

export interface InfraUsageProfile {
  users: number;
  monthlyActiveUsers: number;
  requestsPerUser: number;
  dataTransferGb: number;
  dbStorageGb: number;
  aiRequestsPerUser: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  usesEmbeddings: boolean;
  usesImageAudio: boolean;
  complianceLevel: ComplianceLevel;
  trafficVolatility: TrafficVolatility;
}

export interface CloudCreditGrant {
  id: string;
  providerScope: InfrastructureProvider[] | "any";
  amount: number;
  remainingAmount: number;
  expiresInSprints: number;
  restrictions: string[];
  sourceOfferId?: string;
}

export interface InfrastructureBurnInput {
  stackId: string;
  startupStage: StartupStage | string;
  sector?: string;
  classification?: string;
  usageProfile: Partial<InfraUsageProfile>;
  aiUsageTier?: AIUsageTier;
  cloudCredits?: CloudCreditGrant[];
  currentSprint?: number;
  complianceRequired?: boolean;
  productProgress?: number;
  revenue?: number;
  userGrowth?: number;
}

export interface InfrastructureBurnEstimate {
  stackId: string;
  version: string;
  fixedMonthlyCost: number;
  variableMonthlyCost: number;
  aiMonthlyCost: number;
  complianceMonthlyCost: number;
  grossMonthlyInfraBurn: number;
  cloudCreditsApplied: number;
  effectiveMonthlyInfraBurn: number;
  reliabilityRisk: number;
  scalingRisk: number;
  securityRisk: number;
  billShockRisk: number;
  outageRisk: number;
  investorTrustModifier: number;
  riskScoreModifier: number;
  explanation: string[];
  warnings: string[];
}

export interface RuntimeInfrastructureBurnEstimate {
  sourceStackId: string;
  version: string;
  runtimeMonthlyInfraBurn: number;
  grossInfraBurn: number;
  uncappedGrossInfraBurn: number;
  creditsApplied: number;
  aiApiBurn: number;
  complianceBurn: number;
  capApplied: number | null;
  riskModifiersPreview: {
    reliabilityRisk: number;
    scalingRisk: number;
    securityRisk: number;
    billShockRisk: number;
    outageRisk: number;
    investorTrustModifier: number;
    riskScoreModifier: number;
  };
  explanation: string[];
  warnings: string[];
}

export interface CloudCreditApplication {
  creditsApplied: number;
  updatedCredits: CloudCreditGrant[];
  warnings: string[];
}

export interface InfrastructureEventDefinition {
  id: string;
  title: string;
  severity: InfraEventSeverity;
  triggerConditions: string[];
  affectedStats: string[];
  futurePlayerChoices: string[];
  recommendedCounterplay: string[];
  warningCopy: string;
  tags: string[];
}
