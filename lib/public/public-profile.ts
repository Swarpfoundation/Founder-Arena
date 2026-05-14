import { db } from "@/lib/db";

export interface PublicFounderProfile {
  displayName: string;
  publicSlug: string;
  level: number;
  xp: number;
  totalStartups: number;
  completedStartups: number;
  deadStartups: number;
  bestScore: number;
  bestValuation: number;
  achievements: Array<{
    key: string;
    title: string;
    description: string;
    icon: string | null;
    unlockedAt: Date;
  }>;
  startups: Array<{
    name: string;
    sector: string;
    status: string;
    finalOutcome: string | null;
    finalScore: number | null;
    valuation: number;
    revenue: number;
    monthsSurvived: number;
    publicSlug: string | null;
  }>;
  leaderboardEntries: Array<{
    score: number;
    category: string;
    season: string;
    outcome: string | null;
    survivalMonths: number;
    startupName: string;
    startupSlug: string | null;
  }>;
}

export async function getPublicFounderProfileBySlug(
  slug: string
): Promise<PublicFounderProfile | null> {
  const profile = await db.founderProfile.findUnique({
    where: { publicSlug: slug },
    include: {
      user: { select: { name: true } },
      achievements: { orderBy: { unlockedAt: "desc" } },
    },
  });

  if (!profile) return null;

  const startups = await db.startup.findMany({
    where: {
      userId: profile.userId,
      OR: [{ status: "completed" }, { status: "dead" }],
    },
    orderBy: { completedAt: "desc" },
    select: {
      name: true,
      sector: true,
      status: true,
      finalOutcome: true,
      finalScore: true,
      valuation: true,
      revenue: true,
      publicSlug: true,
      simulationMonths: { select: { monthNumber: true } },
    },
  });

  const leaderboardEntries = await db.leaderboardEntry.findMany({
    where: { userId: profile.userId },
    orderBy: { score: "desc" },
    take: 10,
    select: {
      score: true,
      category: true,
      season: true,
      outcome: true,
      survivalMonths: true,
      startup: { select: { name: true, publicSlug: true } },
    },
  });

  return {
    displayName: profile.user.name ?? "Founder",
    publicSlug: profile.publicSlug ?? slug,
    level: profile.level,
    xp: profile.xp,
    totalStartups: profile.totalStartups,
    completedStartups: profile.completedStartups,
    deadStartups: profile.deadStartups,
    bestScore: profile.bestScore,
    bestValuation: profile.bestValuation,
    achievements: profile.achievements.map((a) => ({
      key: a.key,
      title: a.title,
      description: a.description,
      icon: a.icon,
      unlockedAt: a.unlockedAt,
    })),
    startups: startups.map((s) => ({
      name: s.name,
      sector: s.sector,
      status: s.status,
      finalOutcome: s.finalOutcome,
      finalScore: s.finalScore,
      valuation: s.valuation,
      revenue: s.revenue,
      monthsSurvived: s.simulationMonths.length,
      publicSlug: s.publicSlug,
    })),
    leaderboardEntries: leaderboardEntries.map((e) => ({
      score: e.score,
      category: e.category,
      season: e.season,
      outcome: e.outcome,
      survivalMonths: e.survivalMonths,
      startupName: e.startup.name,
      startupSlug: e.startup.publicSlug,
    })),
  };
}

export async function getPublicFounderProfileByUserId(
  userId: string
): Promise<PublicFounderProfile | null> {
  const profile = await db.founderProfile.findUnique({
    where: { userId },
    select: { publicSlug: true },
  });
  if (!profile?.publicSlug) return null;
  return getPublicFounderProfileBySlug(profile.publicSlug);
}
