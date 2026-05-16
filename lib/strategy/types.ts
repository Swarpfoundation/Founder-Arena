// ─── Founder Playstyles ───────────────────────────────────────────────────────

export type FounderPlaystyle =
  | "product_led"
  | "enterprise_sales"
  | "regulated_operator"
  | "technical_builder"
  | "hype_machine"
  | "cockroach"
  | "community_led"
  | "rival_killer"
  | "capital_blitzscaler"
  | "trust_builder";

export type StrategyLevel = "dormant" | "emerging" | "active" | "dominant";

export type StrategySignalSource =
  | "monthly_decision"
  | "hire"
  | "social_action"
  | "rival_counter_action"
  | "mission"
  | "outcome";

// ─── Signal ───────────────────────────────────────────────────────────────────

export interface StrategySignal {
  id: string;
  source: StrategySignalSource;
  sourceId: string;   // dedup key — format: "{source}:{actionId}:m{month}:{playstyle}"
  month: number;
  playstyle: FounderPlaystyle;
  weight: number;     // 5–25
  reason: string;
  tags: string[];
}

// ─── Effects ──────────────────────────────────────────────────────────────────

export interface StrategyEffect {
  productProgressDelta?: number;
  revenueDelta?: number;
  userGrowthDelta?: number;
  investorScoreDelta?: number;
  riskScoreDelta?: number;
  valuationDelta?: number;
  burnDelta?: number;
  socialHypeDelta?: number;
  socialTrustDelta?: number;
  brandRiskDelta?: number;
}

// ─── Synergy ──────────────────────────────────────────────────────────────────

export interface StrategySynergy {
  id: string;
  title: string;
  playstyle: FounderPlaystyle;
  description: string;
  unlockLevel: "active" | "dominant";
  effects: StrategyEffect;
  tradeoffs: string[];
}

// ─── Stack ────────────────────────────────────────────────────────────────────

export interface StrategyStack {
  playstyle: FounderPlaystyle;
  title: string;
  description: string;
  progress: number;
  level: StrategyLevel;
  active: boolean;
  synergies: StrategySynergy[];
  activeSynergies: StrategySynergy[];
  recentSignals: StrategySignal[];
  strengths: string[];
  tradeoffs: string[];
}

// ─── Full computed state ───────────────────────────────────────────────────────

export interface StrategyState {
  dominantPlaystyle: FounderPlaystyle | null;
  secondaryPlaystyles: FounderPlaystyle[];
  stacks: StrategyStack[];
  activeSynergies: StrategySynergy[];
  warnings: string[];
  recommendations: string[];
  totalSignals: number;
}

// ─── Archetype final summary ──────────────────────────────────────────────────

export interface FounderArchetypeSummary {
  title: string;
  description: string;
  dominantPlaystyle: FounderPlaystyle | null;
  secondaryPlaystyle: FounderPlaystyle | null;
  strengths: string[];
  weaknesses: string[];
  finalRunNarrative: string;
}

// ─── Context for computing effects and warnings ───────────────────────────────

export interface ComputeStrategyContext {
  productProgress: number;
  revenue: number;
  brandRisk: number;
  socialTrust: number;
  socialHype: number;
  investorScore: number;
  monthlyBurn: number;
  currentMonth: number;
  rivalryMaxScore: number;
}
