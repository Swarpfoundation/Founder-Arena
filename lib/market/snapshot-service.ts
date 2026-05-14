import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { MarketScenario, SnapshotMetadata, EventMetadata } from "./types";
import { getAllScenarios, getScenarioByKey } from "./scenarios";

export async function seedMarketSnapshotsV1() {
  const count = await db.marketSnapshot.count();
  if (count >= 12) return; // Already seeded

  const scenarios = getAllScenarios();

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const month = new Date(2024, i, 1);

    const metadata: SnapshotMetadata = {
      macro: scenario.macro,
      scenarioKey: scenario.key,
      source: "seeded",
    };

    const eventMetadata: EventMetadata = {
      gameplayEffects: scenario.gameplayEffects,
      affectedSectors: scenario.event.affectedSectors,
      affectedRegions: scenario.event.affectedRegions,
    };

    await db.marketSnapshot.upsert({
      where: { month },
      update: {
        condition: scenario.condition,
        description: scenario.description,
        scenarioKey: scenario.key,
        metadata: metadata as unknown as Prisma.InputJsonValue,
        sectorTrends: buildSectorTrends(scenario) as unknown as Prisma.InputJsonValue,
      },
      create: {
        month,
        condition: scenario.condition,
        description: scenario.description,
        scenarioKey: scenario.key,
        metadata: metadata as unknown as Prisma.InputJsonValue,
        sectorTrends: buildSectorTrends(scenario) as unknown as Prisma.InputJsonValue,
        events: {
          create: {
            name: scenario.event.name,
            description: scenario.event.description,
            type: scenario.event.type,
            severity: scenario.event.severity,
            globalImpact: 0,
            metadata: eventMetadata as unknown as Prisma.InputJsonValue,
          },
        },
      },
    });
  }

  // Seed complete — count available in database if verification needed
}

function buildSectorTrends(scenario: MarketScenario): Record<string, number> {
  const trends: Record<string, number> = {};
  for (const [sector, mod] of Object.entries(scenario.sectorModifiers)) {
    trends[sector] = 1 + mod.revenueDelta / 100;
  }
  // Default for unmentioned sectors
  if (scenario.condition === "bullish") {
    trends["default"] = 1.03;
  } else if (scenario.condition === "bearish") {
    trends["default"] = 0.97;
  } else {
    trends["default"] = 1.0;
  }
  return trends;
}

export async function getMarketSnapshotForMonth(date: Date) {
  return db.marketSnapshot.findUnique({
    where: { month: date },
    include: { events: true },
  });
}

export async function getCurrentMarketSnapshot() {
  // Try the current real month first (adapter-generated snapshots)
  const now = new Date();
  const realMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const realSnapshot = await getMarketSnapshotForMonth(realMonth);
  if (realSnapshot) return realSnapshot;

  // Fallback to seeded scenarios (2024 cycle)
  const monthIndex = now.getMonth();
  const seededMonth = new Date(2024, monthIndex % 12, 1);
  return getMarketSnapshotForMonth(seededMonth);
}

export async function getMarketTimeline() {
  return db.marketSnapshot.findMany({
    orderBy: { month: "asc" },
    include: { events: true },
    take: 24,
  });
}

export function getScenarioByKeyOrFallback(key?: string | null): MarketScenario {
  if (key) {
    const found = getScenarioByKey(key);
    if (found) return found;
  }
  return getScenarioByKey("neutral_market")!;
}
