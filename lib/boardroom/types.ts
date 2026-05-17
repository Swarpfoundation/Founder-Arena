// ─── Pressure Types ───────────────────────────────────────────────────────────

export type BoardroomPressureType =
  | "burn_rate"
  | "runway_crisis"
  | "revenue_miss"
  | "product_delay"
  | "brand_risk"
  | "rival_pressure"
  | "investor_conflict"
  | "acquisition_pressure"
  | "fundraising_pressure"
  | "strategy_doubt"
  | "compliance_risk"
  | "growth_expectation";

export type BoardroomSeverity = "low" | "medium" | "high" | "critical";

export type BoardroomResponseStance =
  | "defensive"
  | "aggressive"
  | "transparent"
  | "pivot"
  | "negotiate"
  | "delay"
  | "accept"
  | "reject"
  | "double_down";

// ─── Effects ─────────────────────────────────────────────────────────────────

export interface BoardroomEffect {
  investorScoreDelta?: number;
  boardConfidenceDelta?: number;
  revenueDelta?: number;
  burnDelta?: number;
  productProgressDelta?: number;
  riskScoreDelta?: number;
  valuationDelta?: number;
  socialTrustDelta?: number;
  socialHypeDelta?: number;
  brandRiskDelta?: number;
  founderControlDelta?: number;
  investorPatienceDelta?: number;
  strategySignal?: string; // playstyle slug to emit as signal
}

// ─── Response Option ──────────────────────────────────────────────────────────

export interface BoardroomResponseRequirements {
  minRevenue?: number;
  minProductProgress?: number;
  minInvestorScore?: number;
  minBoardConfidence?: number;
  minCash?: number;
  maxBurnRate?: number;
}

export interface BoardroomResponseOption {
  id: string;
  title: string;
  stance: BoardroomResponseStance;
  description: string;
  requirements?: BoardroomResponseRequirements;
  projectedEffects: BoardroomEffect;
  risk: "low" | "medium" | "high";
  recommendedForPlaystyles?: string[];
  contextNote?: string;
}

// ─── Event ────────────────────────────────────────────────────────────────────

export interface BoardroomEvent {
  id: string;
  startupId: string;
  month: number;
  pressureType: BoardroomPressureType;
  severity: BoardroomSeverity;
  title: string;
  concern: string;
  boardQuestion: string;
  contextSummary: string;
  responseOptions: BoardroomResponseOption[];
  selectedResponseId?: string;
  resolved: boolean;
  resolvedMonth?: number;
  appliedEffects?: BoardroomEffect;
  outcomeNarrative?: string;
  tags: string[];
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface BoardroomState {
  currentOpenEvent: BoardroomEvent | null;
  eventHistory: BoardroomEvent[];
  boardConfidence: number;   // 0–100
  investorPatience: number;  // 0–100
  founderControl: number;    // 0–100
  pressureLevel: number;     // 0–100
  lastTriggeredMonth: number | null;
}

export const DEFAULT_BOARDROOM_STATE: BoardroomState = {
  currentOpenEvent: null,
  eventHistory: [],
  boardConfidence: 60,
  investorPatience: 70,
  founderControl: 80,
  pressureLevel: 0,
  lastTriggeredMonth: null,
};

// ─── Trigger Context ──────────────────────────────────────────────────────────

export interface BoardroomTriggerContext {
  startupId: string;
  startupName: string;
  sector: string;
  month: number;
  cash: number;
  monthlyBurn: number;
  revenue: number;
  productProgress: number;
  investorScore: number;
  riskScore: number;
  brandRisk: number;
  rivalryMaxScore: number;
  runwayMonths: number;
  dominantPlaystyle: string | null;
  currentState: BoardroomState;
}

// ─── Resolution ───────────────────────────────────────────────────────────────

export interface ResolveBoardroomResult {
  appliedEffects: BoardroomEffect;
  outcomeNarrative: string;
  updatedState: BoardroomState;
  feedTitle: string;
  feedBody: string;
  feedSeverity: "positive" | "neutral" | "warning" | "critical";
}

// ─── Catalog Template ─────────────────────────────────────────────────────────

export interface BoardroomEventTemplate {
  pressureType: BoardroomPressureType;
  severity: BoardroomSeverity;
  titleTemplate: string;
  concernTemplate: string;
  boardQuestionTemplate: string;
  contextTemplate: string;
  responseOptions: BoardroomResponseOption[];
  tags: string[];
}
