import { db } from "@/lib/db";

export async function createOrUpdateLeaderboardEntry(
  startupId: string,
  userId: string,
  score: number,
  valuation: number,
  revenue: number,
  survivalMonths: number,
  outcome: string,
  category: string = "overall",
  season: string = "beta-season-1",
  metadata?: Record<string, unknown>
) {
  // Check for existing entry to avoid duplicates
  const existing = await db.leaderboardEntry.findFirst({
    where: { startupId, category, season },
  });

  if (existing) {
    return db.leaderboardEntry.update({
      where: { id: existing.id },
      data: {
        userId,
        score,
        valuation,
        revenue,
        survivalMonths,
        outcome,
        completedAt: new Date(),
        metadata: metadata ? metadata as unknown as import("@prisma/client").Prisma.InputJsonValue : undefined,
      },
    });
  }

  return db.leaderboardEntry.create({
    data: {
      startupId,
      userId,
      score,
      valuation,
      revenue,
      survivalMonths,
      outcome,
      category,
      season,
      completedAt: new Date(),
      metadata: metadata ? metadata as unknown as import("@prisma/client").Prisma.InputJsonValue : undefined,
    },
  });
}

export async function getLeaderboardEntries(
  category?: string,
  season?: string,
  sector?: string,
  limit: number = 50
) {
  const where: {
    category?: string;
    season?: string;
    startup?: { sector?: string };
  } = {};

  if (category && category !== "all") {
    where.category = category;
  }
  if (season && season !== "all") {
    where.season = season;
  }
  if (sector && sector !== "all") {
    where.startup = { sector };
  }

  const entries = await db.leaderboardEntry.findMany({
    where,
    orderBy: { score: "desc" },
    take: limit,
    include: {
      startup: {
        include: { user: true },
      },
    },
  });

  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}
