import { db } from "@/lib/db";
import type {
  CareerUpdateInput,
  CareerProfileSnapshot,
  CareerFieldUpdates,
  SectorCareerStat,
  PlaystyleCareerStat,
  RivalCareerStat,
  LegacyBadge,
  CareerRunEntry,
  FounderRankKey,
} from "@/lib/career/types";
import { buildCareerUpdates } from "@/lib/career/career-engine";
import { getOrCreateFounderProfile } from "./founder-progression";

// Build a CareerProfileSnapshot from the raw DB profile
function profileToSnapshot(profile: {
  completedStartups: number;
  deadStartups: number;
  totalStartups: number;
  bestValuation: number;
  bestScore: number;
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
  sectorStats: unknown;
  playstyleStats: unknown;
  rivalStats: unknown;
  legacyBadges: unknown;
  completedStartupIds: unknown;
  recentRuns: unknown;
}): CareerProfileSnapshot {
  const defaultRivalStats: RivalCareerStat = {
    rivalsFaced: 0,
    rivalsDefeated: 0,
    rivalLosses: 0,
    mostDangerousRivalName: null,
    lastNemesisName: null,
  };

  return {
    completedStartups: profile.completedStartups,
    deadStartups: profile.deadStartups,
    totalStartups: profile.totalStartups,
    bestValuation: profile.bestValuation,
    bestScore: profile.bestScore,
    reputationScore: profile.reputationScore,
    founderTitle: profile.founderTitle,
    founderRank: profile.founderRank as FounderRankKey,
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
    sectorStats: (profile.sectorStats as Record<string, SectorCareerStat>) ?? {},
    playstyleStats: (profile.playstyleStats as Record<string, PlaystyleCareerStat>) ?? {},
    rivalStats: (profile.rivalStats as RivalCareerStat) ?? defaultRivalStats,
    legacyBadges: (profile.legacyBadges as LegacyBadge[]) ?? [],
    completedStartupIds: (profile.completedStartupIds as string[]) ?? [],
    recentRuns: (profile.recentRuns as CareerRunEntry[]) ?? [],
  };
}

// Primary public function — called from finalize-startup.ts
export async function updateFounderCareer(
  userId: string,
  input: CareerUpdateInput
): Promise<CareerFieldUpdates> {
  const profile = await getOrCreateFounderProfile(userId);
  const snapshot = profileToSnapshot(profile);

  const updates = buildCareerUpdates(snapshot, input);

  await db.founderProfile.update({
    where: { userId },
    data: {
      reputationScore: updates.reputationScore,
      founderTitle: updates.founderTitle,
      founderRank: updates.founderRank,
      totalMonthsPlayed: updates.totalMonthsPlayed,
      totalRevenueGenerated: updates.totalRevenueGenerated,
      bestMonthlyRevenue: updates.bestMonthlyRevenue,
      bestOutcome: updates.bestOutcome ?? undefined,
      bestStartupId: updates.bestStartupId ?? undefined,
      lastCompletedStartupId: updates.lastCompletedStartupId ?? undefined,
      totalAcquisitions: updates.totalAcquisitions,
      totalBreakouts: updates.totalBreakouts,
      totalSeriesAReady: updates.totalSeriesAReady,
      totalSurvived12: updates.totalSurvived12,
      sectorStats: updates.sectorStats as object,
      playstyleStats: updates.playstyleStats as object,
      rivalStats: updates.rivalStats as object,
      legacyBadges: updates.legacyBadges as object[],
      completedStartupIds: updates.completedStartupIds as unknown as object[],
      recentRuns: updates.recentRuns as object[],
    },
  });

  return updates;
}
