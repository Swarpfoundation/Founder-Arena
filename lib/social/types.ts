export type SocialChannel =
  | "x"
  | "instagram"
  | "tiktok"
  | "linkedin"
  | "founder_blog";

export type SocialActorType =
  | "founder"
  | "team"
  | "operations"
  | "investor"
  | "customer"
  | "rival"
  | "journalist"
  | "influencer"
  | "community";

export type PostTone =
  | "builder"
  | "technical"
  | "visionary"
  | "transparent"
  | "hype"
  | "defensive"
  | "customer_centric"
  | "investor_facing"
  | "chaotic"
  | "crisis_response";

export type FeedItemCategory =
  | "post"
  | "reaction"
  | "press"
  | "viral"
  | "crisis"
  | "infrastructure"
  | "operations"
  | "rival"
  | "milestone";

export type FeedItemSeverity = "positive" | "neutral" | "warning" | "critical";

export type ActionRiskLevel = "low" | "medium" | "high";

// ─── Core metric object ──────────────────────────────────────────────────────

export interface SocialMetrics {
  followers: number;
  hype: number;              // 0–100
  trust: number;             // 0–100
  sentiment: number;         // 0–100
  brandRisk: number;         // 0–100
  viralMomentum: number;     // 0–100
  founderReputation: number; // 0–100
  communityStrength: number; // 0–100
}

export const DEFAULT_SOCIAL_METRICS: SocialMetrics = {
  followers: 0,
  hype: 20,
  trust: 50,
  sentiment: 50,
  brandRisk: 0,
  viralMomentum: 0,
  founderReputation: 30,
  communityStrength: 10,
};

// ─── Deltas ───────────────────────────────────────────────────────────────────

export interface SocialMetricsDelta {
  followersDelta?: number;
  hypeDelta?: number;
  trustDelta?: number;
  sentimentDelta?: number;
  brandRiskDelta?: number;
  viralMomentumDelta?: number;
  founderReputationDelta?: number;
  communityStrengthDelta?: number;
}

export interface SimulationEffectsDelta {
  revenueDelta?: number;
  investorDelta?: number;
  riskDelta?: number;
  userGrowthDelta?: number;
  valuationDelta?: number;
  moraleDelta?: number;
}

export type SocialActionEffects = SocialMetricsDelta & SimulationEffectsDelta;

// ─── Action model ─────────────────────────────────────────────────────────────

export interface BackfireCondition {
  /** Which game-state property triggers the backfire */
  condition:
    | "low_product_progress"
    | "low_trust"
    | "high_brand_risk"
    | "high_hype_low_trust";
  threshold: number;
  backfireEffects: SocialActionEffects;
  warningText: string;
}

export interface SocialAction {
  id: string;
  title: string;
  description: string;
  channel: SocialChannel | SocialChannel[];
  /** Display string shown in UI, e.g. "X / Instagram" */
  channelLabel: string;
  cost: number;
  effects: SocialActionEffects;
  riskLevel: ActionRiskLevel;
  cooldownMonths?: number;
  requiredProductProgress?: number;
  requiredStatus?: string[];
  requiredMinRevenue?: number;
  requiredMinFollowers?: number;
  /** Only available when brandRisk is AT OR ABOVE this value */
  requiredBrandRiskAbove?: number;
  /** Only available when brandRisk is BELOW this value */
  requiredBrandRiskBelow?: number;
  backfireCondition?: BackfireCondition;
  tags: string[];
}

// ─── Post / feed ─────────────────────────────────────────────────────────────

export interface SocialPost {
  id: string;
  month: number;
  actionId: string;
  channel: SocialChannel;
  actorType: SocialActorType;
  actorName: string;
  content: string;
  tone: PostTone;
  /** 0–100 */
  engagement: number;
  /** –100 to +100 */
  sentiment: number;
  tags: string[];
}

export interface ArenaFeedItem {
  id: string;
  month: number;
  category: FeedItemCategory;
  title: string;
  body: string;
  severity: FeedItemSeverity;
  source: SocialActorType;
  linkedPostId?: string;
  effects?: SocialActionEffects;
}

// ─── Action-taken record (persisted in JSON array) ───────────────────────────

export interface ActionTakenRecord {
  month: number;
  actionId: string;
  postId: string;
  effects: SocialActionEffects;
  didBackfire: boolean;
}

// ─── Full state loaded from DB ───────────────────────────────────────────────

export interface SocialStateData {
  metrics: SocialMetrics;
  feedItems: ArenaFeedItem[];
  actionsTaken: ActionTakenRecord[];
  lastActionMonth: number;
}

// ─── Availability check result ───────────────────────────────────────────────

export interface SocialActionAvailability {
  action: SocialAction;
  available: boolean;
  reason?: string;
  backfireWarning?: string;
}

// ─── Server-action result ────────────────────────────────────────────────────

export interface PerformSocialActionResult {
  post: SocialPost;
  newFeedItems: ArenaFeedItem[];
  updatedMetrics: SocialMetrics;
  appliedEffects: SocialActionEffects;
  didBackfire: boolean;
}

// ─── Context passed to engine / feed generator ───────────────────────────────

export interface SocialContext {
  startupId: string;
  startupName: string;
  sector: string;
  month: number;
  productProgress: number;
  revenue: number;
  investorScore: number;
  riskScore: number;
  status: string;
  founderName: string;
}
