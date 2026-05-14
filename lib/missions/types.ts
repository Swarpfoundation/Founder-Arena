/**
 * Founder Arena — Mission System Types
 */

export type MissionCategory =
  | "product"
  | "engineering"
  | "ai_model"
  | "compliance"
  | "security"
  | "sales"
  | "marketing"
  | "operations"
  | "fundraising"
  | "growth"
  | "partnership"
  | "infrastructure"
  | "research"
  | "launch";

export type MissionStatus = "pending" | "active" | "completed" | "delayed" | "failed" | "skipped";

export interface MissionEffect {
  productProgressDelta?: number;
  revenueDelta?: number;
  investorScoreDelta?: number;
  marketScoreDelta?: number;
  riskScoreDelta?: number;
  valuationDelta?: number;
  cashDelta?: number;
  burnDelta?: number;
  userGrowthDelta?: number;
}

export interface RequiredRole {
  role: string;
  seniority: "junior" | "mid" | "senior" | "lead";
  count: number;
}

export interface MissionTemplate {
  id: string;
  title: string;
  category: MissionCategory;
  startupTypes: string[];
  sectors: string[];
  stages: string[];
  minMonth?: number;
  maxMonth?: number;
  requiredRoles: RequiredRole[];
  optionalRoles: RequiredRole[];
  requiredCapabilities: string[];
  estimatedCost: number;
  monthlyCostDelta: number;
  durationMonths: number;
  complexity?: number; // 1-10
  risk: number; // 1-10
  successMetrics: string[];
  failureRisks: string[];
  effectsOnComplete: MissionEffect;
  effectsOnFail: MissionEffect;
  aiPromptContext: string;
}

export interface MissionInstance {
  id: string;
  startupId: string;
  templateId?: string;
  title: string;
  category: MissionCategory | string;
  status: MissionStatus | string;
  sequence: number;
  monthStart: number | null;
  monthEnd: number | null;
  requiredRoles: RequiredRole[] | unknown;
  optionalRoles: RequiredRole[] | unknown;
  requiredCapabilities: string[] | unknown;
  estimatedCost: number;
  monthlyCostDelta: number;
  progress: number;
  successScore: number | null;
  effects: MissionEffect | null | unknown;
  aiSummary: string | null;
  complexity?: number;
  metadata: Record<string, unknown> | null | unknown;
}

export interface MissionRoadmap {
  startupId: string;
  classification: StartupClassification;
  missions: MissionInstance[];
  generatedAt: string;
}

// ─── Startup Classification ───────────────────────────────────────

export type StartupTypeId =
  | "ai_saas"
  | "ai_infrastructure"
  | "fintech"
  | "remittance"
  | "web3_protocol"
  | "web3_wallet"
  | "saas_b2b"
  | "consumer_app"
  | "marketplace"
  | "gaming"
  | "healthcare_ai"
  | "logistics"
  | "energy"
  | "hardware"
  | "cybersecurity"
  | "developer_tools"
  | "enterprise_software";

export interface StartupClassification {
  primaryStartupType: StartupTypeId;
  secondaryTypes: StartupTypeId[];
  complexityLevel: number; // 1-10
  capitalIntensity: number; // 1-10
  regulatoryIntensity: number; // 1-10
  technicalIntensity: number; // 1-10
  salesIntensity: number; // 1-10
  hiringIntensity: number; // 1-10
  missionArchetype: string;
  explanation: string;
}

// ─── Role Coverage ────────────────────────────────────────────────

export interface RoleCoverage {
  role: string;
  required: number;
  filled: number;
  coverage: number; // 0-1
  employees?: { id: string; name: string; seniority: string }[];
}

export interface MissionProgressInput {
  mission: MissionInstance;
  employees: { role: string; seniority: string; skill: string; morale: number; productivity: number }[];
  monthlyDecisions: string[];
  marketTailwind: number;
  marketHeadwind: number;
  cash: number;
  runwayMonths: number;
  riskScore: number;
  teamProductivity: number;
  teamMorale: number;
}

export interface MissionProgressResult {
  progressDelta: number;
  newProgress: number;
  status: MissionStatus | string;
  roleCoverage: RoleCoverage[];
  cashReadiness: number;
  teamReadiness: number;
  marketImpact: number;
  decisionAlignment: number;
  riskPenalty: number;
  runwayPenalty: number;
  score: number;
  explanation: string;
}

// ─── Next Move ────────────────────────────────────────────────────

export type NextMoveType =
  | "hire"
  | "complete_mission"
  | "reduce_burn"
  | "delay_launch"
  | "launch_beta"
  | "improve_compliance"
  | "fix_security"
  | "customer_interviews"
  | "investor_update"
  | "focus_sales"
  | "reduce_ai_costs"
  | "complete_audit"
  | "secure_partner"
  | "improve_retention"
  | "fundraising_prep"
  | "product_focus"
  | "marketing_spend"
  | "cut_costs"
  | "improve_security"
  | "enterprise_push"
  | "delay_launch_quality";

export interface NextMove {
  id: string;
  title: string;
  type: NextMoveType;
  whyItMatters: string;
  estimatedCost: number;
  expectedImpact: string;
  relatedMissionId?: string;
  requiredRole?: string;
  urgency: "critical" | "high" | "medium" | "low";
  riskIfIgnored: string;
  deterministicEffectPreview: MissionEffect;
}

// ─── AI Advisor ───────────────────────────────────────────────────

export interface OperationsAdvisorResult {
  currentSituationSummary: string;
  topOperationalRisks: string[];
  missionGapAnalysis: string;
  recommendedNextMoves: string[];
  recommendedHires: string[];
  spendingWarnings: string[];
  whatNotToDo: string[];
  next30DaysPlan: string;
  next90DaysPlan: string;
  reasoning: string;
  confidence: number;
}
