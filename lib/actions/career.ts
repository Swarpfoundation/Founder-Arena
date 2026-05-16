"use server";

import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-helpers";
import { getOrCreateFounderProfile } from "@/lib/game/founder-progression";
import { generateNextChallenge } from "@/lib/career/career-recommendations";
import { BADGE_CATALOG } from "@/lib/career/badge-catalog";
import type {
  SectorCareerStat,
  PlaystyleCareerStat,
  RivalCareerStat,
  LegacyBadge,
  CareerRunEntry,
  FounderRankKey,
} from "@/lib/career/types";

export interface CareerPageData {
  // Identity
  userName: string | null;
  userEmail: string;
  founderTitle: string;
  founderRank: FounderRankKey;
  publicSlug: string | null;
  // XP / level
  xp: number;
  level: number;
  xpForNextLevel: number;
  // Reputation
  reputationScore: number;
  // Core counts (from base FounderProfile)
  totalStartups: number;
  completedStartups: number;
  deadStartups: number;
  bestValuation: number;
  bestScore: number;
  // Career fields
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
  // Derived
  survivalRate: number;
  // JSON stats
  sectorStats: Record<string, SectorCareerStat>;
  playstyleStats: Record<string, PlaystyleCareerStat>;
  rivalStats: RivalCareerStat;
  legacyBadges: LegacyBadge[];
  recentRuns: CareerRunEntry[];
  // Best run details (resolved from bestStartupId)
  bestRun: CareerRunEntry | null;
  // Recommendations
  nextChallenge: string;
  // All badge defs for locked/unlocked display
  allBadgeIds: string[];
  // Rank progression info
  nextRankLabel: string | null;
  nextRankRequirement: string | null;
  // Achievement count
  achievementCount: number;
}

const RANK_LABELS: Record<FounderRankKey, string> = {
  rookie: "Rookie",
  builder: "Builder",
  operator: "Operator",
  closer: "Closer",
  veteran: "Veteran",
  arena_legend: "Arena Legend",
};

const RANK_NEXT: Record<FounderRankKey, { label: string; requirement: string } | null> = {
  rookie: { label: "Builder", requirement: "Complete 3 startup runs" },
  builder: { label: "Operator", requirement: "Complete 5 runs with 40%+ survival rate" },
  operator: { label: "Closer", requirement: "Achieve 1 breakout or acquisition" },
  closer: { label: "Veteran", requirement: "Complete 10 startup runs" },
  veteran: { label: "Arena Legend", requirement: "3 breakouts or 2 acquisitions + 10 completed runs" },
  arena_legend: null,
};

const XP_LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 1750, 3000, 5000, 8000, 12000];

function xpForNext(level: number): number {
  return XP_LEVEL_THRESHOLDS[level] ?? XP_LEVEL_THRESHOLDS[XP_LEVEL_THRESHOLDS.length - 1] * 2;
}

const DEFAULT_RIVAL_STATS: RivalCareerStat = {
  rivalsFaced: 0,
  rivalsDefeated: 0,
  rivalLosses: 0,
  mostDangerousRivalName: null,
  lastNemesisName: null,
};

export async function getCareerRecord(): Promise<CareerPageData> {
  const user = await requireCurrentUser();
  const profile = await getOrCreateFounderProfile(user.id);

  const rank = (profile.founderRank as FounderRankKey) ?? "rookie";
  const sectorStats = (profile.sectorStats as unknown as Record<string, SectorCareerStat>) ?? {};
  const playstyleStats = (profile.playstyleStats as unknown as Record<string, PlaystyleCareerStat>) ?? {};
  const rivalStats = (profile.rivalStats as unknown as RivalCareerStat) ?? DEFAULT_RIVAL_STATS;
  const legacyBadges = (profile.legacyBadges as unknown as LegacyBadge[]) ?? [];
  const completedStartupIds = (profile.completedStartupIds as unknown as string[]) ?? [];
  const recentRuns = (profile.recentRuns as unknown as CareerRunEntry[]) ?? [];

  const survivalRate =
    profile.totalStartups > 0
      ? Math.round((profile.completedStartups / profile.totalStartups) * 100)
      : 0;

  // Resolve best run from recentRuns or via bestStartupId
  let bestRun: CareerRunEntry | null = null;
  if (profile.bestStartupId) {
    bestRun =
      recentRuns.find((r) => r.startupId === profile.bestStartupId) ?? null;
    if (!bestRun) {
      // Not in recent runs — do a lightweight DB lookup
      const s = await db.startup.findUnique({
        where: { id: profile.bestStartupId },
        select: { id: true, name: true, sector: true, finalOutcome: true, finalScore: true, valuation: true, revenue: true, completedAt: true },
      });
      if (s) {
        bestRun = {
          startupId: s.id,
          startupName: s.name,
          sector: s.sector,
          outcome: s.finalOutcome ?? "UNKNOWN",
          score: s.finalScore ?? 0,
          valuation: s.valuation,
          revenue: s.revenue,
          monthsSurvived: 0,
          dominantPlaystyle: null,
          rivalSummary: null,
          completedAt: s.completedAt?.toISOString() ?? new Date().toISOString(),
        };
      }
    }
  }

  const profileSnapshot = {
    completedStartups: profile.completedStartups,
    deadStartups: profile.deadStartups,
    totalStartups: profile.totalStartups,
    bestValuation: profile.bestValuation,
    bestScore: profile.bestScore,
    reputationScore: profile.reputationScore,
    founderTitle: profile.founderTitle,
    founderRank: rank,
    totalMonthsPlayed: profile.totalMonthsPlayed,
    totalRevenueGenerated: profile.totalRevenueGenerated,
    bestMonthlyRevenue: profile.bestMonthlyRevenue,
    bestOutcome: profile.bestOutcome,
    bestStartupId: profile.bestStartupId,
    lastCompletedStartupId: profile.lastCompletedStartupId,
    totalAcquisitions: profile.totalAcquisitions,
    totalBreakouts: profile.totalBreakouts,
    totalSeriesAReady: profile.totalSeriesAReady,
    totalSurvived12: profile.totalSurvived12,
    sectorStats,
    playstyleStats,
    rivalStats,
    legacyBadges,
    completedStartupIds,
    recentRuns,
  };

  const nextChallenge = generateNextChallenge(profileSnapshot);
  const nextRankInfo = RANK_NEXT[rank];

  const achievementCount = await db.founderAchievement.count({
    where: { founderProfileId: profile.id },
  });

  return {
    userName: user.name,
    userEmail: user.email,
    founderTitle: profile.founderTitle,
    founderRank: rank,
    publicSlug: profile.publicSlug,
    xp: profile.xp,
    level: profile.level,
    xpForNextLevel: xpForNext(profile.level),
    reputationScore: profile.reputationScore,
    totalStartups: profile.totalStartups,
    completedStartups: profile.completedStartups,
    deadStartups: profile.deadStartups,
    bestValuation: profile.bestValuation,
    bestScore: profile.bestScore,
    totalMonthsPlayed: profile.totalMonthsPlayed,
    totalRevenueGenerated: profile.totalRevenueGenerated,
    bestMonthlyRevenue: profile.bestMonthlyRevenue,
    bestOutcome: profile.bestOutcome,
    bestStartupId: profile.bestStartupId,
    lastCompletedStartupId: profile.lastCompletedStartupId,
    totalAcquisitions: profile.totalAcquisitions,
    totalBreakouts: profile.totalBreakouts,
    totalSeriesAReady: profile.totalSeriesAReady,
    totalSurvived12: profile.totalSurvived12,
    survivalRate,
    sectorStats,
    playstyleStats,
    rivalStats,
    legacyBadges,
    recentRuns: [...recentRuns].reverse(), // newest first
    bestRun,
    nextChallenge,
    allBadgeIds: BADGE_CATALOG.map((b) => b.id),
    nextRankLabel: nextRankInfo?.label ?? null,
    nextRankRequirement: nextRankInfo?.requirement ?? null,
    achievementCount,
  };
}

// Surface the career update summary from a finalized startup (used on startup detail page)
export async function getCareerUpdateSummary(startupId: string): Promise<{
  careerUpdate: {
    newBadges: string[];
    rankAdvanced: boolean;
    titleChanged: boolean;
    newTitle: string;
    newRank: string;
    reputationScore: number;
    reputationDelta: number;
  } | null;
}> {
  const user = await requireCurrentUser();
  const startup = await db.startup.findUnique({
    where: { id: startupId },
    select: { userId: true, aiAnalysis: true },
  });
  if (!startup || startup.userId !== user.id) return { careerUpdate: null };

  const analysis = startup.aiAnalysis as Record<string, unknown> | null;
  const careerUpdate = analysis?.careerUpdate as {
    newBadges: string[];
    rankAdvanced: boolean;
    titleChanged: boolean;
    newTitle: string;
    newRank: string;
    reputationScore: number;
    reputationDelta: number;
  } | null ?? null;

  return { careerUpdate };
}
