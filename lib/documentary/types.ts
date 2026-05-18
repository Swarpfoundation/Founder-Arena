// ─── Tone & Genre ─────────────────────────────────────────────────────────────

export type DocumentaryTone =
  | "triumphant"
  | "cautionary"
  | "chaotic"
  | "gritty"
  | "tragic"
  | "satirical"
  | "legendary"
  | "underdog";

export type DocumentaryGenre =
  | "founder_memoir"
  | "arena_highlight"
  | "startup_true_crime"
  | "investor_case_study"
  | "comeback_story"
  | "cautionary_tale";

// ─── Chapter & Timeline ───────────────────────────────────────────────────────

export type ChapterCategory =
  | "origin"
  | "funding"
  | "strategy"
  | "social"
  | "rival"
  | "verdict";

export type TimelineImpact = "positive" | "negative" | "mixed" | "neutral";

export type TimelineSource =
  | "simulation"
  | "social"
  | "infrastructure"
  | "rival"
  | "funding"
  | "career"
  | "final";

export interface FounderDocumentaryChapter {
  id: string;
  title: string;
  body: string;
  category: ChapterCategory;
  month?: number;
  tags: string[];
}

export interface DocumentaryTimelineMoment {
  id: string;
  month: number;
  title: string;
  description: string;
  category: string;
  impact: TimelineImpact;
  source: TimelineSource;
  importance: number; // 0–100
}

// ─── Summaries ────────────────────────────────────────────────────────────────

export interface DocumentaryHeroStats {
  finalScore: number;
  finalValuation: number;
  finalRevenue: number;
  monthsSurvived: number;
  finalOutcome: string;
  dominantPlaystyle: string | null;
  strongestRival: string | null;
  reputationDelta: number | null;
}

export interface DocumentaryShareCard {
  title: string;
  subtitle: string;
  outcomeLabel: string;
  founderTitle: string;
  startupName: string;
  sector: string;
  finalScore: number;
  finalValuation: number;
  finalRevenue: number;
  monthsSurvived: number;
  dominantPlaystyle: string | null;
  badgeLine: string | null;
  quote: string;
  shareText: string;
}

export interface DocumentaryRivalSummary {
  totalRivals: number;
  defeated: number;
  strongestRivalName: string | null;
  strongestRivalArchetype: string | null;
  overallOutcome: string;
  topMoment: string | null;
}

export interface DocumentarySocialSummary {
  finalHype: number;
  finalTrust: number;
  finalBrandRisk: number;
  followers: number;
  totalActions: number;
  topMoment: string | null;
  narrative: string;
}

export interface DocumentaryStrategySummary {
  dominantPlaystyle: string | null;
  secondaryPlaystyle: string | null;
  finalRunNarrative: string;
  strengths: string[];
  weaknesses: string[];
}

export interface DocumentaryCareerImpactSummary {
  reputationDelta: number;
  newReputationScore: number;
  rankAdvanced: boolean;
  newRank: string;
  titleChanged: boolean;
  newTitle: string;
  badgeCount: number;
}

// ─── Primary output ───────────────────────────────────────────────────────────

export interface FounderDocumentary {
  startupId: string;
  outcome: string;
  title: string;
  tagline: string;
  genre: DocumentaryGenre;
  tone: DocumentaryTone;
  chapters: FounderDocumentaryChapter[];
  timeline: DocumentaryTimelineMoment[];
  heroStats: DocumentaryHeroStats;
  rivalSummary: DocumentaryRivalSummary | null;
  socialSummary: DocumentarySocialSummary | null;
  strategySummary: DocumentaryStrategySummary | null;
  careerImpactSummary: DocumentaryCareerImpactSummary | null;
  finalVerdict: string;
  shareCard: DocumentaryShareCard;
  tags: string[];
}

// ─── Engine input snapshots ───────────────────────────────────────────────────

export interface SimMonthSnap {
  monthNumber: number;
  cashStart: number;
  cashEnd: number;
  burnRate: number;
  revenue: number;
  runwayMonths: number;
  productProgress: number;
  productProgressBefore?: number;
  userGrowth: number;
  employeeCount: number;
  valuation: number;
  eventsTriggered: string[];
  eventTitle: string | null;
  eventSummary: string | null;
  aiSummary: string | null;
  marketCondition: string;
  riskScoreAfter: number | null;
  riskScoreBefore?: number | null;
  investorScoreAfter: number | null;
  investorScoreBefore: number | null;
}

export interface FundingRoundSnap {
  roundType: string;
  amountRaised: number;
  equitySold: number;
}

export interface EmployeeSnap {
  role: string;
  status: string;
}

export interface MissionSnap {
  title: string;
  status: string;
  category: string;
}

export interface RivalStartupSnap {
  id: string;
  name: string;
  founder: { name: string; archetype: string };
  rivalryScore: number;
  isDefeated: boolean;
  latestMoveType?: string;
  latestMoveTitle?: string;
  monthGenerated: number;
}

export interface RivalMoveSnap {
  id: string;
  rivalName: string;
  month: number;
  title: string;
  description: string;
  severity: string;
}

export interface FeedItemSnap {
  id: string;
  month: number;
  category: string;
  title: string;
  body: string;
  severity: string;
  source: string;
}

export interface ActionTakenSnap {
  month: number;
  actionId: string;
  didBackfire: boolean;
}

export interface SocialStateSnap {
  hype: number;
  trust: number;
  brandRisk: number;
  followers: number;
  viralMomentum: number;
  founderReputation: number;
  feedItems: FeedItemSnap[];
  actionsTaken: ActionTakenSnap[];
  rivalProfiles: RivalStartupSnap[];
  rivalMoveHistory: RivalMoveSnap[];
}

export interface CareerSnapForDocumentary {
  founderTitle: string;
  founderRank: string;
  reputationScore: number;
  reputationDelta: number;
  rankAdvanced: boolean;
  titleChanged: boolean;
  badgeCount: number;
}

export interface DocumentaryEngineInput {
  startup: {
    id: string;
    name: string;
    tagline: string;
    sector: string;
    region: string;
    status: string;
    problem: string;
    solution: string;
    monetizationModel: string;
    targetMarket: string;
    fundingAsk: number;
    revenue: number;
    valuation: number;
    productProgress: number;
    investorScore: number | null;
    riskScore: number | null;
    finalScore: number | null;
    finalOutcome: string | null;
    finalSummary: string | null;
    deathReason: string | null;
    aiAnalysis: Record<string, unknown> | null;
    simulationMonths: SimMonthSnap[];
    fundingRounds: FundingRoundSnap[];
    employees: EmployeeSnap[];
    missions: MissionSnap[];
  };
  socialState?: SocialStateSnap;
  career?: CareerSnapForDocumentary;
}
