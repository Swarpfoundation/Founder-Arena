// ─── Arena Season ──────────────────────────────────────────────────────────────

export type ArenaSeasonStatus = "active" | "ended" | "upcoming";

export interface ArenaSeason {
  slug: string;
  name: string;
  tagline: string;
  status: ArenaSeasonStatus;
  startDate: string; // ISO date
  endDate: string | null;
  challenges: SeasonChallenge[];
  lore: string;
}

// ─── Season Challenges ─────────────────────────────────────────────────────────

export type SeasonChallengeCategory =
  | "product"
  | "survival"
  | "rivalry"
  | "boardroom"
  | "community";

export interface SeasonChallenge {
  id: string;
  title: string;
  description: string;
  category: SeasonChallengeCategory;
  requirement: ChallengeRequirement;
  reward: string;
  badge: string;
}

export type ChallengeRequirement =
  | { type: "min_product_progress"; value: number }
  | { type: "min_survival_months"; value: number }
  | { type: "min_rivals_defeated"; value: number }
  | { type: "boardroom_events_resolved"; value: number }
  | { type: "min_social_trust"; value: number }
  | { type: "min_revenue"; value: number }
  | { type: "min_score"; value: number }
  | { type: "outcome_equals"; value: string };

// ─── Challenge Progress ───────────────────────────────────────────────────────

export interface SeasonChallengeProgress {
  challenge: SeasonChallenge;
  current: number;
  target: number;
  completed: boolean;
  pct: number; // 0–100
}

// ─── Public Arena Feed ────────────────────────────────────────────────────────

export type ArenaFeedPublicCategory =
  | "leaderboard_move"
  | "new_entry"
  | "season_milestone"
  | "rival_defeated"
  | "boardroom_drama"
  | "outcome_achieved";

export interface ArenaFeedPublicItem {
  id: string;
  category: ArenaFeedPublicCategory;
  title: string;
  body: string;
  startupName: string;
  founderName: string;
  sector: string;
  outcome: string | null;
  score: number;
  rank: number;
  generatedAt: string; // ISO timestamp (deterministic)
}

// ─── Leaderboard Page Data ────────────────────────────────────────────────────

export interface LeaderboardEntryDisplay {
  id: string;
  rank: number;
  startupId: string;
  startupName: string;
  founderName: string;
  sector: string;
  score: number;
  valuation: number;
  revenue: number;
  survivalMonths: number;
  outcome: string | null;
  publicSlug: string | null;
  dominantPlaystyle: string | null;
  founderTitle: string | null;
  completedAt: Date | null;
}

export interface PlayerPositionData {
  bestRank: number | null;
  bestScore: number | null;
  category: string;
  season: string;
  startupName: string | null;
  startupId: string | null;
  outcome: string | null;
}

export interface LeaderboardPageData {
  season: ArenaSeason;
  entries: LeaderboardEntryDisplay[];
  category: string;
  sector: string | null;
  publicFeed: ArenaFeedPublicItem[];
  challengeProgress: SeasonChallengeProgress[] | null; // null when not logged in
  playerPosition: PlayerPositionData | null;
  totalEntries: number;
}
