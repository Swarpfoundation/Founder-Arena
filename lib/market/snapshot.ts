import { db } from "@/lib/db";

export async function getMarketSnapshotForMonth(date: Date) {
  const snapshot = await db.marketSnapshot.findUnique({
    where: { month: date },
    include: { events: true, dataRun: true },
  });
  return snapshot;
}

export async function seedMarketSnapshots() {
  const count = await db.marketSnapshot.count();
  if (count > 0) return;

  const conditions: Array<"bullish" | "neutral" | "bearish"> = ["bullish", "neutral", "bearish"];
  const snapshots = Array.from({ length: 24 }, (_, i) => {
    const month = new Date(2024, i, 1);
    return {
      month,
      condition: conditions[i % 3],
      description: `Market snapshot for ${month.toISOString().slice(0, 7)}`,
      sectorTrends: { saas: 1.05, fintech: 0.95, healthtech: 1.02 },
    };
  });

  await db.marketSnapshot.createMany({ data: snapshots });
}
