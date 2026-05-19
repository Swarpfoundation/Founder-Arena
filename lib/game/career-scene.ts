import { BADGE_CATALOG, type BadgeDef } from "@/lib/career/badge-catalog";
import type { FounderRankKey, LegacyBadge, PlaystyleCareerStat, RivalCareerStat, SectorCareerStat, CareerRunEntry } from "@/lib/career/types";
import type { CareerPageData } from "@/lib/actions/career";

export type CareerTone = "cyan" | "violet" | "rose" | "amber" | "emerald" | "white";

export interface LegacyHeroPresentation {
  title: string;
  rank: FounderRankKey;
  rankLabel: string;
  identityStamp: string;
  reputationScore: number;
  level: number;
  xp: number;
  xpForNextLevel: number;
  xpProgress: number;
  nextRankLabel: string | null;
  nextRankRequirement: string | null;
  tone: CareerTone;
}

export interface CareerStatCardPresentation {
  label: string;
  value: string;
  tone: CareerTone;
  detail: string;
}

export interface BadgeWallEntry {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "legendary";
  category: string;
  unlocked: boolean;
  requirement: string;
  unlockedAt?: string;
  sourceStartupId?: string;
}

export interface RunArchiveEntryPresentation {
  startupId: string;
  startupName: string;
  sector: string;
  outcome: string;
  stamp: string;
  tone: CareerTone;
  score: number;
  valuation: string;
  revenue: string;
  weeksSurvived: number;
  playstyleLabel: string | null;
  rivalSummary: string | null;
  completedAt: string;
}

export interface MasteryEntryPresentation {
  id: string;
  label: string;
  tone: CareerTone;
  status: "strong" | "partial" | "missing";
  detail: string;
  bestOutcome: string | null;
  bestScore: number;
}

export interface RivalLegacyPresentation {
  rivalsFaced: number;
  rivalsDefeated: number;
  rivalLosses: number;
  winRate: number;
  mostDangerousRivalName: string | null;
  lastNemesisName: string | null;
  tone: CareerTone;
  summary: string;
}

export interface NextChallengePresentation {
  title: string;
  description: string;
  ctas: Array<{ label: string; href: string; tone: CareerTone }>;
}

export interface CareerEmptyStatePresentation {
  title: string;
  description: string;
  ctas: Array<{ label: string; href: string; tone: CareerTone }>;
}

const RANK_LABELS: Record<FounderRankKey, string> = {
  rookie: "Rookie",
  builder: "Builder",
  operator: "Operator",
  closer: "Closer",
  veteran: "Veteran",
  arena_legend: "Arena Legend",
};

const RANK_TONES: Record<FounderRankKey, CareerTone> = {
  rookie: "white",
  builder: "cyan",
  operator: "violet",
  closer: "emerald",
  veteran: "amber",
  arena_legend: "amber",
};

const PLAYSTYLE_LABELS: Record<string, string> = {
  product_led: "Product-Led",
  enterprise_sales: "Enterprise Sales",
  regulated_operator: "Regulated Operator",
  technical_builder: "Technical Moat",
  hype_machine: "Hype Machine",
  cockroach: "Cockroach Founder",
  community_led: "Community-Led",
  rival_killer: "Rival Killer",
  capital_blitzscaler: "Capital Blitzscaler",
  trust_builder: "Trust Builder",
};

export function formatCareerMoney(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

export function getFounderLegacyHero(record: Pick<CareerPageData, "founderTitle" | "founderRank" | "reputationScore" | "level" | "xp" | "xpForNextLevel" | "nextRankLabel" | "nextRankRequirement" | "totalBreakouts" | "totalAcquisitions" | "rivalStats">): LegacyHeroPresentation {
  const xpProgress = record.xpForNextLevel > 0 ? Math.min(100, Math.round((record.xp / record.xpForNextLevel) * 100)) : 100;
  return {
    title: record.founderTitle,
    rank: record.founderRank,
    rankLabel: RANK_LABELS[record.founderRank] ?? "Founder",
    identityStamp: getIdentityStamp(record),
    reputationScore: record.reputationScore,
    level: record.level,
    xp: record.xp,
    xpForNextLevel: record.xpForNextLevel,
    xpProgress,
    nextRankLabel: record.nextRankLabel,
    nextRankRequirement: record.nextRankRequirement,
    tone: RANK_TONES[record.founderRank] ?? "cyan",
  };
}

export function getCareerStatCards(record: Pick<CareerPageData, "totalStartups" | "completedStartups" | "deadStartups" | "totalAcquisitions" | "totalBreakouts" | "bestScore" | "bestValuation" | "totalRevenueGenerated" | "totalMonthsPlayed" | "survivalRate" | "bestMonthlyRevenue" | "totalSurvived12">): CareerStatCardPresentation[] {
  return [
    { label: "Runs Created", value: String(record.totalStartups), tone: "cyan", detail: "Total startups deployed" },
    { label: "Runs Completed", value: String(record.completedStartups), tone: "emerald", detail: "Finished runs in the archive" },
    { label: "Failed Runs", value: String(record.deadStartups), tone: "rose", detail: "Deaths still teach the founder" },
    { label: "Acquisitions", value: String(record.totalAcquisitions), tone: "emerald", detail: "Exit paths secured" },
    { label: "Breakouts", value: String(record.totalBreakouts), tone: "amber", detail: "Rare high-performance runs" },
    { label: "Best Score", value: String(record.bestScore), tone: "violet", detail: "Highest run score recorded" },
    { label: "Best Valuation", value: formatCareerMoney(record.bestValuation), tone: "emerald", detail: "Peak company value" },
    { label: "Total Revenue", value: formatCareerMoney(record.totalRevenueGenerated), tone: "amber", detail: "Career revenue generated" },
    { label: "Founder Weeks", value: String(record.totalMonthsPlayed), tone: "cyan", detail: "Total weeks survived" },
    { label: "Survival Rate", value: `${record.survivalRate}%`, tone: "violet", detail: "Completed runs versus attempts" },
    { label: "Best MRR", value: formatCareerMoney(record.bestMonthlyRevenue), tone: "emerald", detail: "Best monthly revenue signal" },
    { label: "Full Runs", value: String(record.totalSurvived12), tone: "amber", detail: "Survived the full 12 weeks" },
  ];
}

export function getBadgeWallPresentation(unlockedBadges: LegacyBadge[], catalog: BadgeDef[] = BADGE_CATALOG): BadgeWallEntry[] {
  const unlockedById = new Map(unlockedBadges.map((badge) => [badge.id, badge]));
  return catalog.map((badge) => {
    const unlocked = unlockedById.get(badge.id);
    return {
      id: badge.id,
      title: unlocked?.title ?? badge.title,
      description: unlocked?.description ?? badge.description,
      icon: unlocked?.icon ?? badge.icon,
      rarity: unlocked?.rarity ?? badge.rarity,
      category: unlocked?.category ?? badge.category,
      unlocked: Boolean(unlocked),
      requirement: badge.requirement,
      unlockedAt: unlocked?.unlockedAt,
      sourceStartupId: unlocked?.sourceStartupId,
    };
  });
}

export function getRunArchivePresentation(runs: CareerRunEntry[]): RunArchiveEntryPresentation[] {
  return runs.map((run) => ({
    startupId: run.startupId,
    startupName: run.startupName,
    sector: run.sector,
    outcome: run.outcome,
    stamp: getOutcomeStamp(run.outcome),
    tone: getOutcomeTone(run.outcome),
    score: run.score,
    valuation: formatCareerMoney(run.valuation),
    revenue: formatCareerMoney(run.revenue),
    weeksSurvived: run.monthsSurvived,
    playstyleLabel: run.dominantPlaystyle ? PLAYSTYLE_LABELS[run.dominantPlaystyle] ?? titleize(run.dominantPlaystyle) : null,
    rivalSummary: run.rivalSummary,
    completedAt: run.completedAt,
  }));
}

export function getPlaystyleMasteryPresentation(stats: Record<string, PlaystyleCareerStat>): MasteryEntryPresentation[] {
  const entries = Object.entries(stats)
    .map(([id, stat]) => ({
      id,
      label: PLAYSTYLE_LABELS[id] ?? titleize(id),
      tone: stat.bestScore >= 900 ? "amber" as CareerTone : stat.completedRuns > 0 ? "emerald" as CareerTone : "violet" as CareerTone,
      status: stat.timesDominant >= 3 ? "strong" as const : stat.timesDominant > 0 || stat.timesSecondary > 0 ? "partial" as const : "missing" as const,
      detail: `Dominant ${stat.timesDominant}x, secondary ${stat.timesSecondary}x, ${stat.completedRuns} completed, ${stat.failedRuns} failed`,
      bestOutcome: stat.bestOutcome,
      bestScore: stat.bestScore,
    }))
    .sort((a, b) => b.bestScore - a.bestScore);
  return entries;
}

export function getSectorMasteryPresentation(stats: Record<string, SectorCareerStat>): MasteryEntryPresentation[] {
  return Object.entries(stats)
    .map(([sectorKey, stat]) => {
      const sector = stat.sector || sectorKey;
      return {
        id: sector,
        label: sector,
        tone: stat.breakoutCount > 0 ? "amber" as CareerTone : stat.completed > stat.failed ? "emerald" as CareerTone : stat.failed > 0 ? "rose" as CareerTone : "cyan" as CareerTone,
        status: stat.completed >= 3 || stat.breakoutCount > 0 ? "strong" as const : stat.completed > 0 || stat.failed > 0 ? "partial" as const : "missing" as const,
        detail: `${stat.completed} completed, ${stat.failed} failed, best valuation ${formatCareerMoney(stat.bestValuation)}`,
        bestOutcome: stat.bestOutcome,
        bestScore: stat.bestScore,
      };
    })
    .sort((a, b) => b.bestScore - a.bestScore);
}

export function getRivalLegacyPresentation(stats: RivalCareerStat): RivalLegacyPresentation {
  const winRate = stats.rivalsFaced > 0 ? Math.round((stats.rivalsDefeated / stats.rivalsFaced) * 100) : 0;
  return {
    rivalsFaced: stats.rivalsFaced,
    rivalsDefeated: stats.rivalsDefeated,
    rivalLosses: stats.rivalLosses,
    winRate,
    mostDangerousRivalName: stats.mostDangerousRivalName,
    lastNemesisName: stats.lastNemesisName,
    tone: stats.rivalsDefeated >= 5 ? "rose" : stats.rivalsDefeated > stats.rivalLosses ? "emerald" : stats.rivalsFaced > 0 ? "amber" : "white",
    summary:
      stats.rivalsFaced === 0
        ? "No rival record yet. Fund a startup and the arena will start pushing back."
        : `${stats.rivalsDefeated} wins against ${stats.rivalsFaced} rival encounters.`,
  };
}

export function getNextChallengePresentation(recommendation: string): NextChallengePresentation {
  return {
    title: "Next Challenge",
    description: recommendation,
    ctas: [
      { label: "Deploy New Run", href: "/startup/new", tone: "cyan" },
      { label: "Read Market Map", href: "/market", tone: "violet" },
      { label: "Arena Leaderboard", href: "/leaderboard", tone: "amber" },
    ],
  };
}

export function getCareerEmptyStatePresentation(): CareerEmptyStatePresentation {
  return {
    title: "Legacy Archive Empty",
    description: "Complete or lose a startup run to stamp your first founder record. Death still counts as founder experience.",
    ctas: [
      { label: "Deploy Startup", href: "/startup/new", tone: "cyan" },
      { label: "Command Deck", href: "/dashboard", tone: "white" },
      { label: "How To Play", href: "/how-to-play", tone: "amber" },
    ],
  };
}

function getIdentityStamp(record: Pick<CareerPageData, "founderRank" | "totalBreakouts" | "totalAcquisitions" | "rivalStats">): string {
  if (record.founderRank === "arena_legend") return "Arena Legend";
  if (record.totalBreakouts >= 2) return "Breakout Architect";
  if (record.totalAcquisitions >= 2) return "Exit Artist";
  if (record.rivalStats.rivalsDefeated >= 5) return "Rival Killer";
  if (record.founderRank === "operator") return "Operator";
  if (record.founderRank === "builder") return "Builder";
  return "Rookie Founder";
}

function getOutcomeStamp(outcome: string): string {
  return outcome.replace(/_/g, " ");
}

function getOutcomeTone(outcome: string): CareerTone {
  if (outcome === "BREAKOUT") return "amber";
  if (outcome === "ACQUISITION_TARGET") return "emerald";
  if (outcome === "SERIES_A_READY") return "violet";
  if (outcome === "SEED_READY") return "cyan";
  if (outcome === "DEAD") return "rose";
  return "white";
}

function titleize(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
