export type FounderRankKey =
  | "rookie"
  | "builder"
  | "operator"
  | "closer"
  | "veteran"
  | "arena_legend";

export type BadgeRarity = "common" | "rare" | "legendary";

export interface SectorCareerStat {
  sector: string;
  startupsCreated: number;
  completed: number;
  failed: number;
  bestOutcome: string | null;
  bestScore: number;
  bestRevenue: number;
  bestValuation: number;
  breakoutCount: number;
}

export interface PlaystyleCareerStat {
  playstyle: string;
  timesDominant: number;
  timesSecondary: number;
  completedRuns: number;
  failedRuns: number;
  bestOutcome: string | null;
  bestScore: number;
}

export interface RivalCareerStat {
  rivalsFaced: number;
  rivalsDefeated: number;
  rivalLosses: number;
  mostDangerousRivalName: string | null;
  lastNemesisName: string | null;
}

export interface LegacyBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlockedAt: string; // ISO date
  sourceStartupId?: string;
  rarity: BadgeRarity;
}

export interface CareerRunEntry {
  startupId: string;
  startupName: string;
  sector: string;
  outcome: string;
  score: number;
  valuation: number;
  revenue: number;
  monthsSurvived: number;
  dominantPlaystyle: string | null;
  rivalSummary: string | null;
  completedAt: string; // ISO date
}

export interface CareerUpdateInput {
  startupId: string;
  startupName: string;
  sector: string;
  outcome: string;
  score: number;
  valuation: number;
  revenue: number;
  monthsSurvived: number;
  isDead: boolean;
  isCompleted: boolean;
  dominantPlaystyle: string | null;
  secondaryPlaystyle: string | null;
  rivalsFaced: number;
  rivalsDefeated: number;
  rivalLosses: number;
  mostDangerousRivalName: string | null;
  rivalSummary: string | null;
  completedAt: Date;
}

// Full profile snapshot (scalar + JSON fields) passed into the engine
export interface CareerProfileSnapshot {
  // From base FounderProfile (already updated by updateFounderStatsAfterFinalization)
  completedStartups: number;
  deadStartups: number;
  totalStartups: number;
  bestValuation: number;
  bestScore: number;
  // Career fields (to be updated)
  reputationScore: number;
  founderTitle: string;
  founderRank: FounderRankKey;
  totalMonthsPlayed: number;
  totalRevenueGenerated: number;
  bestMonthlyRevenue: number;
  bestOutcome: string | null;
  bestStartupId: string | null;
  lastCompletedStartupId: string | null;
  totalAcquisitions: number;
  totalBreakouts: number;
  totalSeriesAReady: number;
  totalSurvived12: number;
  sectorStats: Record<string, SectorCareerStat>;
  playstyleStats: Record<string, PlaystyleCareerStat>;
  rivalStats: RivalCareerStat;
  legacyBadges: LegacyBadge[];
  completedStartupIds: string[];
  recentRuns: CareerRunEntry[];
}

// The delta returned by the engine — only changed fields
export interface CareerFieldUpdates {
  reputationScore: number;
  founderTitle: string;
  founderRank: string;
  totalMonthsPlayed: number;
  totalRevenueGenerated: number;
  bestMonthlyRevenue: number;
  bestOutcome: string | null;
  bestStartupId: string | null;
  lastCompletedStartupId: string | null;
  totalAcquisitions: number;
  totalBreakouts: number;
  totalSeriesAReady: number;
  totalSurvived12: number;
  sectorStats: Record<string, SectorCareerStat>;
  playstyleStats: Record<string, PlaystyleCareerStat>;
  rivalStats: RivalCareerStat;
  legacyBadges: LegacyBadge[];
  completedStartupIds: string[];
  recentRuns: CareerRunEntry[];
  newBadges: LegacyBadge[];
  rankAdvanced: boolean;
  titleChanged: boolean;
  previousReputationScore: number;
}
