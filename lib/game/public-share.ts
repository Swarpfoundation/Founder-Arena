import type { Metadata } from "next";
import type { PublicFounderProfile } from "@/lib/public/public-profile";
import type { PublicStartupResult } from "@/lib/public/public-startup";

export type PublicShareTone = "cyan" | "violet" | "rose" | "amber" | "emerald" | "white";

export interface OutcomeStampPresentation {
  label: string;
  tone: PublicShareTone;
  verdict: string;
}

export interface PublicStartupShareData {
  type: "startup";
  name: string;
  tagline: string | null;
  sector: string;
  status: string;
  finalOutcome: string | null;
  outcomeStamp: OutcomeStampPresentation;
  finalScore: number;
  valuation: number;
  revenue: number;
  weeksSurvived: number;
  productProgress: number;
  founderName: string;
  founderSlug: string | null;
  publicSlug: string;
  fundingRaised: number | null;
  teamSize: number;
  workSetup: string;
  leaderboardScore: number | null;
  leaderboardCategory: string | null;
  biggestCrisis: string | null;
  keyLesson: string | null;
  deathReason: string | null;
  verdictLine: string;
  shareText: string;
}

export interface PublicFounderShareData {
  type: "founder";
  displayName: string;
  publicSlug: string;
  level: number;
  totalStartups: number;
  completedStartups: number;
  deadStartups: number;
  bestScore: number;
  bestValuation: number;
  achievementCount: number;
  bestOutcome: string | null;
  founderStamp: string;
  startups: Array<{
    name: string;
    sector: string;
    status: string;
    finalOutcome: string | null;
    outcomeStamp: OutcomeStampPresentation;
    finalScore: number;
    valuation: number;
    revenue: number;
    weeksSurvived: number;
    publicSlug: string | null;
  }>;
  achievements: Array<{
    key: string;
    title: string;
    description: string;
    icon: string | null;
    unlockedAt: Date;
  }>;
  leaderboardEntries: Array<{
    score: number;
    category: string;
    season: string;
    outcome: string | null;
    startupName: string;
    startupSlug: string | null;
    survivalMonths: number;
  }>;
  shareText: string;
}

export function buildPublicStartupShareData(raw: PublicStartupResult): PublicStartupShareData {
  const finalOutcome = raw.finalOutcome ?? (raw.status === "dead" ? "DEAD" : raw.status.toUpperCase());
  const outcomeStamp = getOutcomeStampPresentation(finalOutcome);
  const finalScore = raw.finalScore ?? 0;
  const verdictLine = buildStartupVerdictLine({
    outcome: finalOutcome,
    weeks: raw.monthsSurvived,
    valuation: raw.valuation,
    score: finalScore,
  });

  return {
    type: "startup",
    name: sanitizePublicShareText(raw.name),
    tagline: raw.tagline ? sanitizePublicShareText(raw.tagline) : null,
    sector: sanitizePublicShareText(raw.sector),
    status: sanitizePublicShareText(raw.status),
    finalOutcome: raw.finalOutcome ? sanitizePublicShareText(raw.finalOutcome) : null,
    outcomeStamp,
    finalScore,
    valuation: raw.valuation,
    revenue: raw.revenue,
    weeksSurvived: raw.monthsSurvived,
    productProgress: raw.productProgress,
    founderName: sanitizePublicShareText(raw.founderName),
    founderSlug: raw.founderSlug,
    publicSlug: raw.publicSlug,
    fundingRaised: raw.fundingRaised,
    teamSize: raw.teamSize,
    workSetup: sanitizePublicShareText(raw.workSetup),
    leaderboardScore: raw.leaderboardScore,
    leaderboardCategory: raw.leaderboardCategory ? sanitizePublicShareText(raw.leaderboardCategory) : null,
    biggestCrisis: raw.simulationHighlights.biggestCrisis ? sanitizePublicShareText(raw.simulationHighlights.biggestCrisis) : null,
    keyLesson: raw.simulationHighlights.keyLesson ? sanitizePublicShareText(raw.simulationHighlights.keyLesson) : null,
    deathReason: raw.deathReason ? sanitizePublicShareText(raw.deathReason) : null,
    verdictLine,
    shareText: buildStartupShareText({
      name: raw.name,
      outcome: outcomeStamp.label,
      score: finalScore,
      weeks: raw.monthsSurvived,
      valuation: raw.valuation,
    }),
  };
}

export function buildPublicFounderShareData(raw: PublicFounderProfile): PublicFounderShareData {
  const bestOutcome = raw.startups.find((startup) => startup.finalOutcome)?.finalOutcome ?? null;
  return {
    type: "founder",
    displayName: sanitizePublicShareText(raw.displayName),
    publicSlug: raw.publicSlug,
    level: raw.level,
    totalStartups: raw.totalStartups,
    completedStartups: raw.completedStartups,
    deadStartups: raw.deadStartups,
    bestScore: raw.bestScore,
    bestValuation: raw.bestValuation,
    achievementCount: raw.achievements.length,
    bestOutcome,
    founderStamp: getFounderStamp(raw),
    startups: raw.startups.map((startup) => ({
      name: sanitizePublicShareText(startup.name),
      sector: sanitizePublicShareText(startup.sector),
      status: sanitizePublicShareText(startup.status),
      finalOutcome: startup.finalOutcome ? sanitizePublicShareText(startup.finalOutcome) : null,
      outcomeStamp: getOutcomeStampPresentation(startup.finalOutcome ?? startup.status.toUpperCase()),
      finalScore: startup.finalScore ?? 0,
      valuation: startup.valuation,
      revenue: startup.revenue,
      weeksSurvived: startup.monthsSurvived,
      publicSlug: startup.publicSlug,
    })),
    achievements: raw.achievements.map((achievement) => ({
      key: sanitizePublicShareText(achievement.key),
      title: sanitizePublicShareText(achievement.title),
      description: sanitizePublicShareText(achievement.description),
      icon: achievement.icon ? sanitizePublicShareText(achievement.icon) : null,
      unlockedAt: achievement.unlockedAt,
    })),
    leaderboardEntries: raw.leaderboardEntries.map((entry) => ({
      score: entry.score,
      category: sanitizePublicShareText(entry.category),
      season: sanitizePublicShareText(entry.season),
      outcome: entry.outcome ? sanitizePublicShareText(entry.outcome) : null,
      startupName: sanitizePublicShareText(entry.startupName),
      startupSlug: entry.startupSlug,
      survivalMonths: entry.survivalMonths,
    })),
    shareText: buildFounderShareText(raw),
  };
}

export function sanitizePublicShareText(value: unknown): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

export function getOutcomeStampPresentation(outcome: string | null | undefined): OutcomeStampPresentation {
  const normalized = String(outcome ?? "UNKNOWN").toUpperCase();
  if (normalized === "BREAKOUT") return { label: "BREAKOUT", tone: "amber", verdict: "Legendary growth run" };
  if (normalized === "SERIES_A_READY") return { label: "SERIES A READY", tone: "violet", verdict: "Institutional signal achieved" };
  if (normalized === "ACQUISITION_TARGET" || normalized === "ACQUISITION" || normalized === "ACQUIRED") return { label: "ACQUIRED", tone: "emerald", verdict: "Exit path secured" };
  if (normalized === "SEED_READY") return { label: "SEED READY", tone: "cyan", verdict: "Fundable seed signal" };
  if (normalized === "SMALL_PROFITABLE") return { label: "PROFITABLE", tone: "emerald", verdict: "Lean survival win" };
  if (normalized === "ZOMBIE") return { label: "ZOMBIE", tone: "white", verdict: "Alive, but momentum stalled" };
  if (normalized === "DEAD" || normalized === "HIGH_RISK_FAILURE") return { label: "DEAD", tone: "rose", verdict: "Run ended in the arena" };
  return { label: normalized.replace(/_/g, " "), tone: "white", verdict: "Run archived" };
}

export function getPublicShareMetadata(data: PublicStartupShareData | PublicFounderShareData): Metadata {
  if (data.type === "startup") {
    const title = `${data.name} reached ${data.outcomeStamp.label} in Founder Arena`;
    const description = `${data.weeksSurvived} Founder Weeks. Score ${data.finalScore.toLocaleString()}. Valuation ${formatShareMoney(data.valuation)}. Build your own run.`;
    return {
      title,
      description,
      openGraph: { title, description, type: "article" },
      twitter: { card: "summary", title, description },
    };
  }

  const title = `${data.displayName} - ${data.founderStamp} | Founder Arena`;
  const description = `Founder Arena legacy card: ${data.totalStartups} ventures, best score ${data.bestScore.toLocaleString()}, best valuation ${formatShareMoney(data.bestValuation)}.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary", title, description },
  };
}

export function formatShareMoney(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function buildStartupVerdictLine(input: { outcome: string; weeks: number; valuation: number; score: number }): string {
  const stamp = getOutcomeStampPresentation(input.outcome);
  return `${stamp.verdict}. ${input.weeks} Founder Weeks survived, ${formatShareMoney(input.valuation)} valuation, ${input.score.toLocaleString()} final score.`;
}

function buildStartupShareText(input: { name: string; outcome: string; score: number; weeks: number; valuation: number }): string {
  return sanitizePublicShareText(
    `I took ${input.name} to ${input.outcome} in Founder Arena. Score: ${input.score.toLocaleString()}. Founder Weeks survived: ${input.weeks}. Valuation: ${formatShareMoney(input.valuation)}. Build your own run.`
  );
}

function buildFounderShareText(input: PublicFounderProfile): string {
  return sanitizePublicShareText(
    `${input.displayName} is a Level ${input.level} founder in Founder Arena. Best score: ${input.bestScore.toLocaleString()}. ${input.totalStartups} ventures started. Challenge this founder.`
  );
}

function getFounderStamp(profile: PublicFounderProfile): string {
  const bestOutcome = profile.startups.find((startup) => startup.finalOutcome)?.finalOutcome;
  if (bestOutcome === "BREAKOUT") return "Breakout Founder";
  if (bestOutcome === "ACQUISITION_TARGET") return "Exit Builder";
  if (profile.completedStartups >= 5) return "Serial Founder";
  if (profile.bestScore >= 1000) return "Arena Contender";
  if (profile.totalStartups > 0) return "Founder In Progress";
  return "New Founder";
}
