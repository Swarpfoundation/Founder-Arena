import type {
  CareerProfileSnapshot,
  CareerUpdateInput,
  CareerFieldUpdates,
  SectorCareerStat,
  PlaystyleCareerStat,
  RivalCareerStat,
  LegacyBadge,
  CareerRunEntry,
  FounderRankKey,
} from "./types";
import { BADGE_CATALOG } from "./badge-catalog";

// ─── Outcome ordering (higher = better) ─────────────────────────────────────

const OUTCOME_RANK: Record<string, number> = {
  BREAKOUT: 7,
  SERIES_A_READY: 6,
  ACQUISITION_TARGET: 5,
  SEED_READY: 4,
  SMALL_PROFITABLE: 3,
  ZOMBIE: 2,
  DEAD: 1,
};

function isBetterOutcome(a: string | null, b: string | null): boolean {
  return (OUTCOME_RANK[a ?? ""] ?? 0) > (OUTCOME_RANK[b ?? ""] ?? 0);
}

// ─── Rank computation ────────────────────────────────────────────────────────

export function computeFounderRank(
  completedRuns: number,
  totalRuns: number,
  breakouts: number,
  acquisitions: number
): FounderRankKey {
  if (breakouts >= 3 || (acquisitions >= 2 && completedRuns >= 10)) return "arena_legend";
  if (completedRuns >= 10) return "veteran";
  if (breakouts >= 1 || acquisitions >= 1) return "closer";
  if (completedRuns >= 5 && totalRuns > 0 && completedRuns / totalRuns >= 0.4) return "operator";
  if (completedRuns >= 3) return "builder";
  return "rookie";
}

// ─── Title computation ───────────────────────────────────────────────────────

export function computeFounderTitle(
  rank: FounderRankKey,
  breakouts: number,
  acquisitions: number,
  totalSurvived12: number,
  playstyleStats: Record<string, PlaystyleCareerStat>
): string {
  if (rank === "arena_legend") return "Arena Legend";
  if (breakouts >= 2) return "Breakout Founder";
  if (acquisitions >= 2) return "Exit Artist";

  // Find dominant playstyle (most times dominant)
  let topPlaystyle: string | null = null;
  let topCount = 0;
  for (const [ps, stat] of Object.entries(playstyleStats)) {
    if (stat.timesDominant > topCount) {
      topCount = stat.timesDominant;
      topPlaystyle = ps;
    }
  }

  if (topCount >= 2 && topPlaystyle) {
    const playstyleTitles: Record<string, string> = {
      product_led: "Product Builder",
      enterprise_sales: "Enterprise Closer",
      regulated_operator: "Regulated Operator",
      technical_builder: "Technical Operator",
      hype_machine: "Hype Machine",
      cockroach: "Cockroach Founder",
      community_led: "Community Builder",
      rival_killer: "Rival Killer",
      capital_blitzscaler: "Capital Blitzscaler",
      trust_builder: "Trust Builder",
    };
    const title = playstyleTitles[topPlaystyle];
    if (title) return title;
  }

  if (totalSurvived12 >= 3) return "Iron Founder";
  if (rank === "veteran") return "Veteran Founder";
  if (rank === "closer") return "Startup Closer";
  if (rank === "operator") return "Operator";
  if (rank === "builder") return "Builder";
  return "Rookie Founder";
}

// ─── Reputation score (0–100) ────────────────────────────────────────────────

export function computeReputationScore(
  completedRuns: number,
  totalRuns: number,
  breakouts: number,
  seriesAReady: number,
  acquisitions: number,
  bestScore: number,
  playstyleStats: Record<string, PlaystyleCareerStat>
): number {
  // Completed runs contribution: max 25
  const runBase = Math.min(completedRuns * 5, 25);

  // Outcome bonus: max 25
  const outcomeBonus = Math.min(breakouts * 10 + seriesAReady * 6 + acquisitions * 7, 25);

  // Survival rate: max 20
  const survivalBonus =
    totalRuns > 0 ? Math.min(Math.round((completedRuns / totalRuns) * 20), 20) : 0;

  // Best score: max 15 (score of ~1500+ → 15)
  const scoreBonus = Math.min(Math.floor(bestScore / 100), 15);

  // Playstyle diversity: max 15 (1 dominant per playstyle → 15 points for 7+ different)
  const dominantCount = Object.values(playstyleStats).filter(
    (s) => s.timesDominant >= 1
  ).length;
  const diversityBonus = Math.min(dominantCount * 2, 15);

  return Math.min(100, Math.round(runBase + outcomeBonus + survivalBonus + scoreBonus + diversityBonus));
}

// ─── Sector stats update ─────────────────────────────────────────────────────

function updateSectorStats(
  existing: Record<string, SectorCareerStat>,
  input: CareerUpdateInput
): Record<string, SectorCareerStat> {
  const current = existing[input.sector] ?? {
    sector: input.sector,
    startupsCreated: 0,
    completed: 0,
    failed: 0,
    bestOutcome: null,
    bestScore: 0,
    bestRevenue: 0,
    bestValuation: 0,
    breakoutCount: 0,
  };

  const updated: SectorCareerStat = {
    ...current,
    startupsCreated: current.startupsCreated + 1,
    completed: input.isCompleted ? current.completed + 1 : current.completed,
    failed: input.isDead ? current.failed + 1 : current.failed,
    bestScore: Math.max(current.bestScore, input.score),
    bestRevenue: Math.max(current.bestRevenue, input.revenue),
    bestValuation: Math.max(current.bestValuation, input.valuation),
    breakoutCount: input.outcome === "BREAKOUT" ? current.breakoutCount + 1 : current.breakoutCount,
    bestOutcome: isBetterOutcome(input.outcome, current.bestOutcome)
      ? input.outcome
      : current.bestOutcome,
  };

  return { ...existing, [input.sector]: updated };
}

// ─── Playstyle stats update ──────────────────────────────────────────────────

function updatePlaystyleStats(
  existing: Record<string, PlaystyleCareerStat>,
  input: CareerUpdateInput
): Record<string, PlaystyleCareerStat> {
  const updated = { ...existing };

  const updateEntry = (playstyle: string, isDominant: boolean) => {
    const current = updated[playstyle] ?? {
      playstyle,
      timesDominant: 0,
      timesSecondary: 0,
      completedRuns: 0,
      failedRuns: 0,
      bestOutcome: null,
      bestScore: 0,
    };
    updated[playstyle] = {
      ...current,
      timesDominant: isDominant ? current.timesDominant + 1 : current.timesDominant,
      timesSecondary: !isDominant ? current.timesSecondary + 1 : current.timesSecondary,
      completedRuns: input.isCompleted ? current.completedRuns + 1 : current.completedRuns,
      failedRuns: input.isDead ? current.failedRuns + 1 : current.failedRuns,
      bestScore: Math.max(current.bestScore, input.score),
      bestOutcome: isBetterOutcome(input.outcome, current.bestOutcome)
        ? input.outcome
        : current.bestOutcome,
    };
  };

  if (input.dominantPlaystyle) updateEntry(input.dominantPlaystyle, true);
  if (input.secondaryPlaystyle && input.secondaryPlaystyle !== input.dominantPlaystyle) {
    updateEntry(input.secondaryPlaystyle, false);
  }

  return updated;
}

// ─── Rival stats update ──────────────────────────────────────────────────────

function updateRivalStats(
  existing: RivalCareerStat,
  input: CareerUpdateInput
): RivalCareerStat {
  return {
    rivalsFaced: existing.rivalsFaced + input.rivalsFaced,
    rivalsDefeated: existing.rivalsDefeated + input.rivalsDefeated,
    rivalLosses: existing.rivalLosses + input.rivalLosses,
    mostDangerousRivalName: input.mostDangerousRivalName ?? existing.mostDangerousRivalName,
    lastNemesisName: input.rivalsFaced > 0 ? (input.mostDangerousRivalName ?? existing.lastNemesisName) : existing.lastNemesisName,
  };
}

// ─── Badge unlock check ──────────────────────────────────────────────────────

function checkBadgeUnlocks(
  existingBadges: LegacyBadge[],
  updatedProfile: {
    completedRuns: number;
    totalRuns: number;
    deadRuns: number;
    breakouts: number;
    acquisitions: number;
    survived12: number;
    rivalsDefeated: number;
    rank: FounderRankKey;
    playstyleStats: Record<string, PlaystyleCareerStat>;
    sector: string;
    outcome: string;
    startupId: string;
  }
): LegacyBadge[] {
  const existingIds = new Set(existingBadges.map((b) => b.id));
  const now = new Date().toISOString();
  const newBadges: LegacyBadge[] = [];

  const maybeUnlock = (id: string, condition: boolean, sourceStartupId?: string) => {
    if (!existingIds.has(id) && condition) {
      const def = BADGE_CATALOG.find((b) => b.id === id);
      if (def) {
        newBadges.push({
          id: def.id,
          title: def.title,
          description: def.description,
          icon: def.icon,
          category: def.category,
          rarity: def.rarity,
          unlockedAt: now,
          sourceStartupId,
        });
        existingIds.add(id); // prevent double-add within same update
      }
    }
  };

  const ps = updatedProfile.playstyleStats;

  maybeUnlock("first_run_completed", updatedProfile.completedRuns >= 1, updatedProfile.startupId);
  maybeUnlock("first_death", updatedProfile.deadRuns >= 1, updatedProfile.startupId);
  maybeUnlock("iron_will", updatedProfile.survived12 >= 1, updatedProfile.startupId);
  maybeUnlock("serial_founder", updatedProfile.completedRuns >= 5, updatedProfile.startupId);
  maybeUnlock("first_acquisition", updatedProfile.acquisitions >= 1, updatedProfile.startupId);
  maybeUnlock("first_breakout", updatedProfile.breakouts >= 1, updatedProfile.startupId);
  maybeUnlock("exit_artist", updatedProfile.acquisitions >= 2, updatedProfile.startupId);
  maybeUnlock("cockroach_founder", (ps["cockroach"]?.timesDominant ?? 0) >= 2, updatedProfile.startupId);
  maybeUnlock("product_led_master", (ps["product_led"]?.timesDominant ?? 0) >= 2, updatedProfile.startupId);
  maybeUnlock("hype_machine_master", (ps["hype_machine"]?.timesDominant ?? 0) >= 2, updatedProfile.startupId);
  maybeUnlock("rival_killer", updatedProfile.rivalsDefeated >= 5, updatedProfile.startupId);
  maybeUnlock(
    "enterprise_closer",
    (ps["enterprise_sales"]?.timesDominant ?? 0) >= 1 &&
      ["SEED_READY", "SERIES_A_READY", "BREAKOUT", "ACQUISITION_TARGET"].includes(updatedProfile.outcome),
    updatedProfile.startupId
  );
  maybeUnlock("technical_moat", (ps["technical_builder"]?.timesDominant ?? 0) >= 3, updatedProfile.startupId);
  maybeUnlock("regulated_operator", (ps["regulated_operator"]?.timesDominant ?? 0) >= 2, updatedProfile.startupId);
  maybeUnlock("arena_legend", updatedProfile.rank === "arena_legend", updatedProfile.startupId);

  return newBadges;
}

// ─── Main career update function ─────────────────────────────────────────────

export function buildCareerUpdates(
  profile: CareerProfileSnapshot,
  input: CareerUpdateInput
): CareerFieldUpdates {
  // Idempotency: skip if already recorded
  if (profile.completedStartupIds.includes(input.startupId)) {
    return {
      ...profile,
      newBadges: [],
      rankAdvanced: false,
      titleChanged: false,
      previousReputationScore: profile.reputationScore,
    };
  }

  const updatedCompletedIds = [...profile.completedStartupIds, input.startupId];
  const totalRuns = profile.totalStartups; // already incremented by updateFounderStatsAfterFinalization
  const completedRuns = profile.completedStartups; // ditto
  const deadRuns = profile.deadStartups; // ditto

  // Counters
  const newBreakouts =
    profile.totalBreakouts + (input.outcome === "BREAKOUT" ? 1 : 0);
  const newSeriesAReady =
    profile.totalSeriesAReady + (input.outcome === "SERIES_A_READY" ? 1 : 0);
  const newAcquisitions =
    profile.totalAcquisitions + (input.outcome === "ACQUISITION_TARGET" ? 1 : 0);
  const newSurvived12 =
    profile.totalSurvived12 + (input.monthsSurvived >= 12 ? 1 : 0);

  const newTotalMonths = profile.totalMonthsPlayed + input.monthsSurvived;
  const newTotalRevenue = profile.totalRevenueGenerated + input.revenue;
  const newBestMonthlyRevenue = Math.max(profile.bestMonthlyRevenue, input.revenue);
  const newBestOutcome = isBetterOutcome(input.outcome, profile.bestOutcome)
    ? input.outcome
    : profile.bestOutcome;
  const newBestStartupId = isBetterOutcome(input.outcome, profile.bestOutcome)
    ? input.startupId
    : profile.bestStartupId;

  // JSON stats
  const newSectorStats = updateSectorStats(profile.sectorStats, input);
  const newPlaystyleStats = updatePlaystyleStats(profile.playstyleStats, input);
  const newRivalStats = updateRivalStats(profile.rivalStats, input);

  // Rank + title (using the already-updated completedStartups/deadStartups from base profile)
  const newRank = computeFounderRank(completedRuns, totalRuns, newBreakouts, newAcquisitions);
  const newTitle = computeFounderTitle(newRank, newBreakouts, newAcquisitions, newSurvived12, newPlaystyleStats);

  // Reputation
  const newReputation = computeReputationScore(
    completedRuns,
    totalRuns,
    newBreakouts,
    newSeriesAReady,
    newAcquisitions,
    profile.bestScore,
    newPlaystyleStats
  );

  // Badges
  const newBadgesFromUnlocks = checkBadgeUnlocks(profile.legacyBadges, {
    completedRuns,
    totalRuns,
    deadRuns,
    breakouts: newBreakouts,
    acquisitions: newAcquisitions,
    survived12: newSurvived12,
    rivalsDefeated: newRivalStats.rivalsDefeated,
    rank: newRank,
    playstyleStats: newPlaystyleStats,
    sector: input.sector,
    outcome: input.outcome,
    startupId: input.startupId,
  });
  const updatedBadges = [...profile.legacyBadges, ...newBadgesFromUnlocks];

  // Recent runs (last 10)
  const newRun: CareerRunEntry = {
    startupId: input.startupId,
    startupName: input.startupName,
    sector: input.sector,
    outcome: input.outcome,
    score: input.score,
    valuation: input.valuation,
    revenue: input.revenue,
    monthsSurvived: input.monthsSurvived,
    dominantPlaystyle: input.dominantPlaystyle,
    rivalSummary: input.rivalSummary,
    completedAt: input.completedAt.toISOString(),
  };
  const updatedRecentRuns = [...profile.recentRuns, newRun].slice(-10);

  return {
    reputationScore: newReputation,
    founderTitle: newTitle,
    founderRank: newRank,
    totalMonthsPlayed: newTotalMonths,
    totalRevenueGenerated: newTotalRevenue,
    bestMonthlyRevenue: newBestMonthlyRevenue,
    bestOutcome: newBestOutcome,
    bestStartupId: newBestStartupId,
    lastCompletedStartupId: input.startupId,
    totalAcquisitions: newAcquisitions,
    totalBreakouts: newBreakouts,
    totalSeriesAReady: newSeriesAReady,
    totalSurvived12: newSurvived12,
    sectorStats: newSectorStats,
    playstyleStats: newPlaystyleStats,
    rivalStats: newRivalStats,
    legacyBadges: updatedBadges,
    completedStartupIds: updatedCompletedIds,
    recentRuns: updatedRecentRuns,
    newBadges: newBadgesFromUnlocks,
    rankAdvanced: newRank !== profile.founderRank,
    titleChanged: newTitle !== profile.founderTitle,
    previousReputationScore: profile.reputationScore,
  };
}
