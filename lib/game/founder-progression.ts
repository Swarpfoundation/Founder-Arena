import { db } from "@/lib/db";
import { FounderProfile, Startup, SimulationMonth } from "@prisma/client";
import { generateFounderPublicSlug } from "./public-slug";

const XP_LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 1750, 3000, 5000, 8000, 12000];

export function calculateLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < XP_LEVEL_THRESHOLDS.length; i++) {
    if (xp >= XP_LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

export function xpForNextLevel(level: number): number {
  return XP_LEVEL_THRESHOLDS[level] ?? XP_LEVEL_THRESHOLDS[XP_LEVEL_THRESHOLDS.length - 1] * 2;
}

export async function getOrCreateFounderProfile(userId: string): Promise<FounderProfile> {
  let profile = await db.founderProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
    const publicSlug = user?.name ? await generateFounderPublicSlug(userId, user.name) : undefined;
    profile = await db.founderProfile.create({
      data: {
        userId,
        publicSlug,
        xp: 0,
        level: 1,
        totalStartups: 0,
        completedStartups: 0,
        deadStartups: 0,
        bestValuation: 0,
        bestScore: 0,
      },
    });
  }

  // Backfill slug for existing profiles that don't have one
  if (profile && !profile.publicSlug) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
    if (user?.name) {
      const publicSlug = await generateFounderPublicSlug(userId, user.name);
      profile = await db.founderProfile.update({
        where: { userId },
        data: { publicSlug },
      });
    }
  }

  return profile;
}

export async function addXP(userId: string, xpGain: number): Promise<FounderProfile> {
  const profile = await getOrCreateFounderProfile(userId);
  const newXp = profile.xp + xpGain;
  const newLevel = calculateLevel(newXp);

  return db.founderProfile.update({
    where: { userId },
    data: {
      xp: newXp,
      level: newLevel,
    },
  });
}

export async function updateFounderStatsAfterFinalization(
  userId: string,
  startup: Startup & { simulationMonths: SimulationMonth[] }
): Promise<FounderProfile> {
  const profile = await getOrCreateFounderProfile(userId);

  const isDead = startup.status === "dead";
  const isCompleted = startup.status === "completed";
  const score = startup.finalScore ?? 0;
  const valuation = startup.valuation;

  const updates: {
    totalStartups?: { increment: number };
    completedStartups?: { increment: number };
    deadStartups?: { increment: number };
    bestValuation?: number;
    bestScore?: number;
  } = {
    totalStartups: { increment: 1 },
  };

  if (isCompleted) {
    updates.completedStartups = { increment: 1 };
  }
  if (isDead) {
    updates.deadStartups = { increment: 1 };
  }
  if (valuation > profile.bestValuation) {
    updates.bestValuation = valuation;
  }
  if (score > profile.bestScore) {
    updates.bestScore = score;
  }

  return db.founderProfile.update({
    where: { userId },
    data: updates,
  });
}
