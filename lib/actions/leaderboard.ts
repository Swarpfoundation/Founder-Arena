"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getCurrentSeason, calculateChallengeProgress } from "@/lib/seasons/season-catalog";
import { generatePublicArenaFeed } from "@/lib/seasons/arena-public-feed";
import type {
  LeaderboardPageData,
  LeaderboardEntryDisplay,
  PlayerPositionData,
  SeasonChallengeProgress,
} from "@/lib/seasons/types";

// Valid special category tabs
const SPECIAL_CATEGORIES = ["overall", "revenue", "valuation", "survival"];
const SECTOR_SLUGS = ["ai", "fintech", "web3", "gaming", "saas", "healthcare"];
const PLAYSTYLE_SLUGS = [
  "growth-hacker",
  "capital-efficient",
  "technical-founder",
  "community-builder",
  "revenue-first",
  "product-visionary",
  "operator",
];

function resolveCategory(tab: string): string {
  if (!tab || tab === "all") return "overall";
  return tab;
}

export async function getLeaderboardPageData(
  tab: string = "overall",
  season: string = "beta-season-1"
): Promise<LeaderboardPageData> {
  const currentSeason = getCurrentSeason();
  const category = resolveCategory(tab);

  // Fetch entries
  const rawEntries = await db.leaderboardEntry.findMany({
    where: { category, season },
    orderBy: { score: "desc" },
    take: 50,
    include: {
      startup: { include: { user: true } },
    },
  });

  const entries: LeaderboardEntryDisplay[] = rawEntries.map((e, i) => {
    const meta = (e.metadata as Record<string, unknown> | null) ?? {};
    return {
      id: e.id,
      rank: i + 1,
      startupId: e.startupId,
      startupName: e.startup.name,
      founderName: e.startup.user.name ?? "Unknown Founder",
      sector: e.startup.sector,
      score: e.score,
      valuation: e.valuation,
      revenue: e.revenue,
      survivalMonths: e.survivalMonths,
      outcome: e.outcome ?? null,
      publicSlug: e.startup.publicSlug ?? null,
      dominantPlaystyle: (meta.dominantPlaystyle as string | null) ?? null,
      founderTitle: (meta.founderTitle as string | null) ?? null,
      completedAt: e.completedAt ?? null,
    };
  });

  // Public arena feed from top entries
  const publicFeed = generatePublicArenaFeed(entries, 12);

  // Optional auth: player position
  let playerPosition: PlayerPositionData | null = null;
  let challengeProgress: SeasonChallengeProgress[] | null = null;

  const user = await getCurrentUser();
  if (user) {
    // Find the player's best entry in this category/season
    const playerEntry = await db.leaderboardEntry.findFirst({
      where: { userId: user.id, category, season },
      orderBy: { score: "desc" },
      include: { startup: true },
    });

    if (playerEntry) {
      // Determine rank by counting entries with higher score
      const higherCount = await db.leaderboardEntry.count({
        where: { category, season, score: { gt: playerEntry.score } },
      });
      playerPosition = {
        bestRank: higherCount + 1,
        bestScore: playerEntry.score,
        category,
        season,
        startupName: playerEntry.startup.name,
        startupId: playerEntry.startupId,
        outcome: playerEntry.outcome ?? null,
      };

      // Challenge progress from overall entry metadata
      const overallEntry = await db.leaderboardEntry.findFirst({
        where: { userId: user.id, category: "overall", season },
        orderBy: { score: "desc" },
        include: { startup: true },
      });
      if (overallEntry) {
        const meta = (overallEntry.metadata as Record<string, unknown> | null) ?? {};
        challengeProgress = calculateChallengeProgress(currentSeason.challenges, {
          productProgress: overallEntry.startup.productProgress,
          survivalMonths: overallEntry.survivalMonths,
          rivalsDefeated: (meta.rivalsDefeated as number) ?? 0,
          boardroomEventsResolved: (meta.boardroomEventsResolved as number) ?? 0,
          socialTrust: (meta.socialTrust as number) ?? 50,
          revenue: overallEntry.revenue,
          score: overallEntry.score,
          outcome: overallEntry.outcome ?? null,
        });
      }
    }
  }

  const totalEntries = await db.leaderboardEntry.count({ where: { category, season } });

  return {
    season: currentSeason,
    entries,
    category,
    sector: SECTOR_SLUGS.includes(category) ? category : null,
    publicFeed,
    challengeProgress,
    playerPosition,
    totalEntries,
  };
}

// Lightweight version for the startup page "View Arena Ranking" panel
export async function getStartupRankingData(startupId: string): Promise<{
  rank: number | null;
  score: number | null;
  category: string;
  season: string;
  totalEntries: number;
} | null> {
  const entry = await db.leaderboardEntry.findFirst({
    where: { startupId, category: "overall", season: "beta-season-1" },
  });
  if (!entry) return null;

  const higherCount = await db.leaderboardEntry.count({
    where: {
      category: "overall",
      season: "beta-season-1",
      score: { gt: entry.score },
    },
  });
  const total = await db.leaderboardEntry.count({
    where: { category: "overall", season: "beta-season-1" },
  });

  return {
    rank: higherCount + 1,
    score: entry.score,
    category: "overall",
    season: "beta-season-1",
    totalEntries: total,
  };
}
