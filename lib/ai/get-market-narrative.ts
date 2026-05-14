import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ai } from "@/lib/ai";
import { marketAnalystNarrativeSchema, type MarketAnalystNarrative } from "./schemas";
import { logger } from "@/lib/observability/logger";
import { withTiming } from "@/lib/observability/timing";

export async function getMarketAnalystNarrativeForSnapshot(
  snapshotId: string
): Promise<MarketAnalystNarrative | null> {
  return withTiming("getMarketAnalystNarrative", async () => {
    const snapshot = await db.marketSnapshot.findUnique({
      where: { id: snapshotId },
      include: { dataRun: { include: { signals: { take: 10, orderBy: { publishedAt: "desc" } } } } },
    });

    if (!snapshot) return null;

    // Check cache in metadata
    const meta = snapshot.metadata as Record<string, unknown> | null;
    const cached = meta?.aiNarrative as MarketAnalystNarrative | undefined;
    if (cached && marketAnalystNarrativeSchema.safeParse(cached).success) {
      return cached;
    }

    // Generate new narrative
    try {
      const narrative = await ai.generateMarketAnalystNarrative({
        snapshot: {
          condition: snapshot.condition,
          scenarioKey: snapshot.scenarioKey,
          description: snapshot.description,
          sectorTrends: snapshot.sectorTrends,
          metadata: snapshot.metadata,
        },
        signals: snapshot.dataRun?.signals?.map((s: { title: string; direction: string }) => ({
          title: s.title,
          direction: s.direction,
        })) ?? [],
      });

      // Cache it
      await db.marketSnapshot.update({
        where: { id: snapshotId },
        data: {
          metadata: {
            ...((snapshot.metadata as Record<string, unknown> | null) ?? {}),
            aiNarrative: narrative,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return narrative;
    } catch (err) {
      logger.error("[market-analyst] Failed to generate narrative", {
        snapshotId,
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }, { snapshotId });
}
