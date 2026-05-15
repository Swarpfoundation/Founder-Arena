import type { ArenaFeedItem } from "@/lib/social/types";

// ─── Enumerations ─────────────────────────────────────────────────────────────

export type RivalArchetype =
  | "copycat"
  | "hype_founder"
  | "enterprise_killer"
  | "technical_genius"
  | "predator_vc_backed"
  | "community_builder"
  | "regulatory_operator"
  | "chaos_founder";

export type RivalRelationship =
  | "neutral"
  | "friendly"
  | "tense"
  | "hostile"
  | "feared"
  | "respected"
  | "defeated";

export type RivalMoveType =
  | "launch_beta"
  | "raise_round"
  | "ship_feature"
  | "copy_positioning"
  | "poach_attention"
  | "price_war"
  | "enterprise_push"
  | "viral_campaign"
  | "founder_callout"
  | "security_fumble"
  | "compliance_win"
  | "partnership_announcement"
  | "customer_poach"
  | "team_poach_attempt"
  | "acquisition_rumor"
  | "market_narrative_shift";

// ─── Effect model ─────────────────────────────────────────────────────────────

export interface RivalEventEffect {
  // Applied to player's simulation result
  userGrowthDelta?: number;
  revenueDelta?: number;
  investorScoreDelta?: number;
  riskScoreDelta?: number;
  marketScoreDelta?: number;
  valuationDelta?: number;
  // Applied to player's SocialMetrics
  socialHypeDelta?: number;
  socialTrustDelta?: number;
  brandRiskDelta?: number;
  // Applied to the rival's own internal stats
  rivalTractionDelta?: number;
  rivalHypeDelta?: number;
}

// ─── Founder identity ─────────────────────────────────────────────────────────

export interface RivalFounderProfile {
  id: string;
  name: string;
  personality: string;
  archetype: RivalArchetype;
  aggression: number;        // 0–100
  ethics: number;            // 0–100
  mediaSkill: number;        // 0–100
  fundraisingSkill: number;  // 0–100
  productSkill: number;      // 0–100
  salesSkill: number;        // 0–100
  catchphrase?: string;
}

// ─── Rival startup snapshot ───────────────────────────────────────────────────

export interface RivalStartup {
  id: string;
  name: string;
  founder: RivalFounderProfile;
  sector: string;
  stage: string;
  fundingStatus: "bootstrapped" | "seed" | "series_a" | "acquired" | "dead";
  cashEstimate: number;
  valuationEstimate: number;
  productProgress: number;   // 0–100
  traction: number;          // 0–100
  revenueEstimate: number;
  hype: number;              // 0–100
  trust: number;             // 0–100
  risk: number;              // 0–100
  investorHeat: number;      // 0–100
  mediaPresence: number;     // 0–100
  relationshipToPlayer: RivalRelationship;
  rivalryScore: number;      // 0–100, increases with confrontations
  activeNarrativeTags: string[];
  isDefeated: boolean;
  monthGenerated: number;
  latestMoveMonth?: number;
  latestMoveType?: RivalMoveType;
  latestMoveTitle?: string;
}

// ─── Monthly move record ──────────────────────────────────────────────────────

export interface RivalMove {
  id: string;
  rivalId: string;
  rivalName: string;
  month: number;
  type: RivalMoveType;
  title: string;
  description: string;
  playerEffects: RivalEventEffect;
  rivalEffects: RivalEventEffect;
  severity: "positive" | "neutral" | "warning" | "critical";
  feedCategory: "rival" | "crisis" | "reaction";
  tags: string[];
  targetedPlayerActionId?: string;
}

// ─── Counter-action ───────────────────────────────────────────────────────────

export interface RivalCounterEffects {
  socialHypeDelta?: number;
  socialTrustDelta?: number;
  brandRiskDelta?: number;
  socialSentimentDelta?: number;
  revenueDelta?: number;
  riskScoreDelta?: number;
  investorScoreDelta?: number;
  userGrowthDelta?: number;
  productProgressDelta?: number;
  rivalryScoreReduction?: number;
  rivalHypeReduction?: number;
  rivalTractionReduction?: number;
}

export interface RivalCounterAction {
  id: string;
  title: string;
  description: string;
  cost: number;
  effects: RivalCounterEffects;
  riskLevel: "low" | "medium" | "high";
  requiredMinRevenue?: number;
  requiredMinProductProgress?: number;
  requiredMinTrust?: number;
  requiredMinRivalryScore?: number;
  countersArchetypes?: RivalArchetype[];
  tags: string[];
}

// ─── Full in-memory state ─────────────────────────────────────────────────────

export interface RivalStateData {
  rivals: RivalStartup[];
  moveHistory: RivalMove[];
}

// ─── Generation context ───────────────────────────────────────────────────────

export interface GenerateRivalsContext {
  startupId: string;
  startupName: string;
  sector: string;
  stage: string;
  currentMonth: number;
  productProgress: number;
  revenue: number;
  investorScore: number;
  riskScore: number;
}

// ─── Move execution context ───────────────────────────────────────────────────

export interface RivalMoveContext {
  rival: RivalStartup;
  month: number;
  playerProductProgress: number;
  playerRevenue: number;
  playerHype: number;
  playerTrust: number;
  playerBrandRisk: number;
  playerInvestorScore: number;
  lastPlayerSocialActionId?: string;
  marketCondition: string;
  sector: string;
}

// ─── Aggregated monthly result ────────────────────────────────────────────────

export interface ApplyRivalMovesResult {
  rivalMoves: RivalMove[];
  updatedRivals: RivalStartup[];
  newFeedItems: ArenaFeedItem[];
  playerEffects: RivalEventEffect;
}

// ─── Availability check result ────────────────────────────────────────────────

export interface CounterActionAvailability {
  action: RivalCounterAction;
  available: boolean;
  reason?: string;
  targetedRivalId?: string;
}

// ─── Server-action result ─────────────────────────────────────────────────────

export interface PerformCounterActionResult {
  success: boolean;
  message: string;
  updatedRivals: RivalStartup[];
  newFeedItem?: ArenaFeedItem;
  appliedEffects: RivalCounterEffects;
}

// ─── Final run comparison ─────────────────────────────────────────────────────

export interface RivalRunComparison {
  playerValuation: number;
  playerRevenue: number;
  playerOutcome: string;
  rivals: RivalRunEntry[];
  overallSummary: string;
}

export interface RivalRunEntry {
  id: string;
  name: string;
  founderName: string;
  archetype: RivalArchetype;
  finalValuation: number;
  finalRevenue: number;
  finalOutcome: string;
  relationship: RivalRelationship;
  rivalryScore: number;
  summary: string;
  playerWon: boolean;
}
