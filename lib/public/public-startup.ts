import { db } from "@/lib/db";

export interface PublicStartupResult {
  name: string;
  tagline: string | null;
  sector: string;
  status: string;
  finalOutcome: string | null;
  finalScore: number | null;
  finalSummary: string | null;
  valuation: number;
  revenue: number;
  productProgress: number;
  monthsSurvived: number;
  deathReason: string | null;
  publicSlug: string;
  founderName: string;
  founderSlug: string | null;
  fundingRaised: number | null;
  teamSize: number;
  workSetup: string;
  leaderboardScore: number | null;
  leaderboardCategory: string | null;
  simulationHighlights: {
    biggestCrisis: string | null;
    strongestAchievement: string | null;
    keyLesson: string | null;
  };
}

export async function getPublicStartupBySlug(slug: string): Promise<PublicStartupResult | null> {
  const startup = await db.startup.findUnique({
    where: { publicSlug: slug },
    include: {
      simulationMonths: { orderBy: { monthNumber: "asc" } },
      fundingRounds: true,
      employees: true,
      leaderboardEntries: { orderBy: { score: "desc" }, take: 1 },
      user: { select: { name: true } },
    },
  });

  if (!startup || !startup.publicSlug) return null;

  const history = startup.simulationMonths;
  const monthsSurvived = history.length;
  const latestRound = startup.fundingRounds[0];
  const teamSize = startup.employees.filter((e) => e.status === "active").length;
  const entry = startup.leaderboardEntries[0];

  // Extract highlights from simulation history
  let biggestCrisis: string | null = null;
  const strongestAchievement: string | null = null;
  let keyLesson: string | null = null;

  for (const month of history) {
    const meta = month.metadata as Record<string, unknown> | null;
    const resolvedEvent = meta?.resolvedEvent as Record<string, unknown> | undefined;
    if (resolvedEvent && resolvedEvent.severity === "critical" && !biggestCrisis) {
      biggestCrisis = String(resolvedEvent.title ?? "");
    }
  }

  if (startup.aiAnalysis && typeof startup.aiAnalysis === "object") {
    const analysis = startup.aiAnalysis as Record<string, unknown>;
    keyLesson = analysis.finalCoaching && typeof analysis.finalCoaching === "object"
      ? String((analysis.finalCoaching as Record<string, unknown>).startupLesson ?? "")
      : null;
  }

  keyLesson = keyLesson ?? startup.finalSummary ?? null;

  // Founder profile slug
  const founderProfile = await db.founderProfile.findUnique({
    where: { userId: startup.userId },
    select: { publicSlug: true },
  });

  return {
    name: startup.name,
    tagline: startup.tagline,
    sector: startup.sector,
    status: startup.status,
    finalOutcome: startup.finalOutcome,
    finalScore: startup.finalScore,
    finalSummary: startup.finalSummary,
    valuation: startup.valuation,
    revenue: startup.revenue,
    productProgress: startup.productProgress,
    monthsSurvived,
    deathReason: startup.deathReason,
    publicSlug: startup.publicSlug,
    founderName: startup.user.name ?? "Unknown Founder",
    founderSlug: founderProfile?.publicSlug ?? null,
    fundingRaised: latestRound ? Number(latestRound.amountRaised) : null,
    teamSize,
    workSetup: startup.workSetup,
    leaderboardScore: entry?.score ?? null,
    leaderboardCategory: entry?.category ?? null,
    simulationHighlights: {
      biggestCrisis,
      strongestAchievement,
      keyLesson,
    },
  };
}
