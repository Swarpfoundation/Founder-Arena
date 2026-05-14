import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { InterpretedMarketState, BuildSnapshotResult, ProviderMode, NormalizedMarketSignal } from "./types";


export interface PreviewResult {
  mode: ProviderMode;
  signalCount: number;
  confidence: number;
  condition: string;
  macroScores: InterpretedMarketState["macroScores"];
  sectorModifiers: InterpretedMarketState["sectorModifiers"];
  topSignals: InterpretedMarketState["topSignals"];
  hotSectors: string[];
  coldSectors: string[];
  explanation: string;
  warnings: string[];
}

function buildSectorTrends(state: InterpretedMarketState): Record<string, number> {
  const trends: Record<string, number> = {};
  for (const [sector, mod] of Object.entries(state.sectorModifiers)) {
    trends[sector] = 1 + mod.revenueDelta / 100;
  }
  if (state.condition === "bullish") {
    trends["default"] = 1.03;
  } else if (state.condition === "bearish") {
    trends["default"] = 0.97;
  } else {
    trends["default"] = 1.0;
  }
  return trends;
}

function buildHotColdSectors(state: InterpretedMarketState): { hot: string[]; cold: string[] } {
  const hot: string[] = [];
  const cold: string[] = [];
  const trends = buildSectorTrends(state);
  for (const [sector, value] of Object.entries(trends)) {
    if (sector === "default") continue;
    if (value > 1.05) hot.push(sector);
    if (value < 0.95) cold.push(sector);
  }
  return { hot, cold };
}

export function buildPreview(state: InterpretedMarketState, mode: ProviderMode): PreviewResult {
  const { hot, cold } = buildHotColdSectors(state);
  const warnings: string[] = [];

  if (mode === "external") {
    warnings.push("External providers may return incomplete or delayed data.");
  }
  if (mode === "static") {
    warnings.push("Using deterministic static signals — not real-time market data.");
  }
  if (state.signalCount < 3) {
    warnings.push("Low signal count — market state may be less reliable.");
  }
  if (state.overallConfidence < 50) {
    warnings.push("Low overall confidence — interpretation is uncertain.");
  }

  return {
    mode,
    signalCount: state.signalCount,
    confidence: state.overallConfidence,
    condition: state.condition,
    macroScores: state.macroScores,
    sectorModifiers: state.sectorModifiers,
    topSignals: state.topSignals,
    hotSectors: hot,
    coldSectors: cold,
    explanation: state.explanation,
    warnings,
  };
}

export async function persistSignals(
  signals: NormalizedMarketSignal[],
  dataRunId: string
): Promise<number> {
  if (signals.length === 0) return 0;

  const data = signals.map((s) => ({
    source: s.source,
    sourceId: s.sourceId,
    title: s.title,
    summary: s.summary,
    url: s.url ?? null,
    publishedAt: s.publishedAt,
    signalType: s.signalType,
    direction: s.direction,
    severity: s.severity,
    confidence: s.confidence,
    sectors: s.mappedSectors as unknown as Prisma.InputJsonValue,
    regions: s.mappedRegions as unknown as Prisma.InputJsonValue,
    effects: s.proposedEffects as unknown as Prisma.InputJsonValue,
    metadata: { hash: s.hash, macroDimensions: s.macroDimensions } as unknown as Prisma.InputJsonValue,
    dataRunId,
  }));

  // Use createMany with skipDuplicates to avoid issues if same signal hash exists
  const result = await db.marketSignal.createMany({
    data,
    skipDuplicates: true,
  });

  return result.count;
}

export async function createDataRun(
  mode: ProviderMode,
  providerSources: string[]
): Promise<string> {
  const run = await db.marketDataRun.create({
    data: {
      mode,
      status: "pending",
      startedAt: new Date(),
      signalsFetched: 0,
      signalsStored: 0,
      metadata: {
        providerAvailability: providerSources,
        providerCount: providerSources.length,
      } as unknown as Prisma.InputJsonValue,
    },
  });
  return run.id;
}

export async function completeDataRun(
  runId: string,
  options: {
    status: "success" | "failed" | "partial";
    signalsFetched: number;
    signalsStored: number;
    snapshotId?: string;
    error?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  // If connecting to an existing snapshot, disconnect any previous run first
  // to avoid unique constraint violations on the 1:1 relation
  if (options.snapshotId) {
    await db.marketDataRun.updateMany({
      where: { snapshotId: options.snapshotId, NOT: { id: runId } },
      data: { snapshotId: null },
    });
  }

  await db.marketDataRun.update({
    where: { id: runId },
    data: {
      status: options.status,
      completedAt: new Date(),
      signalsFetched: options.signalsFetched,
      signalsStored: options.signalsStored,
      snapshotId: options.snapshotId ?? null,
      error: options.error ?? null,
      metadata: {
        ...(options.metadata ?? {}),
        completedAt: new Date().toISOString(),
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function activateMarketSnapshot(
  state: InterpretedMarketState,
  mode: ProviderMode,
  signalCount: number,
  providerSources: string[],
  dataRunId: string
): Promise<BuildSnapshotResult> {
  const month = new Date();
  month.setDate(1);
  month.setHours(0, 0, 0, 0);

  const scenarioKey = `${mode}_adapter_v1`;
  const sectorTrends = buildSectorTrends(state);

  const metadata = {
    macro: state.macroScores,
    scenarioKey,
    source: mode,
    signalCount,
    providerSources,
    confidence: state.overallConfidence,
    generatedAt: new Date().toISOString(),
    topSignals: state.topSignals,
    explanation: state.explanation,
    limitations: [
      "Signals are simplified for gameplay purposes.",
      "Not financial advice.",
      mode === "static" ? "Using deterministic static signals." : "Using external provider data.",
    ],
  };

  const eventMetadata = {
    gameplayEffects: {
      demandDelta: 0,
      revenueDelta: 0,
      burnDelta: 0,
      valuationDelta: 0,
      investorDelta: 0,
      riskDelta: 0,
    },
    affectedSectors: Object.keys(state.sectorModifiers),
    affectedRegions: ["global"],
  };

  // Deactivate any previously active snapshots for this month
  await db.marketSnapshot.updateMany({
    where: { month, isActive: true },
    data: { isActive: false },
  });

  // Create or update MarketSnapshot for this month
  const snapshot = await db.marketSnapshot.upsert({
    where: { month },
    update: {
      condition: state.condition,
      description: state.explanation,
      scenarioKey,
      metadata: metadata as unknown as Prisma.InputJsonValue,
      sectorTrends: sectorTrends as unknown as Prisma.InputJsonValue,
      dataRunId,
      isActive: true,
      activatedAt: new Date(),
    },
    create: {
      month,
      condition: state.condition,
      description: state.explanation,
      scenarioKey,
      metadata: metadata as unknown as Prisma.InputJsonValue,
      sectorTrends: sectorTrends as unknown as Prisma.InputJsonValue,
      dataRunId,
      isActive: true,
      activatedAt: new Date(),
      events: {
        create: {
          name: `Market Update: ${state.condition}`,
          description: state.explanation,
          type: state.condition === "bullish" ? "positive" : state.condition === "bearish" ? "negative" : "neutral",
          severity: Math.min(100, Math.max(20, Math.round(Math.abs(Object.values(state.macroScores).reduce((s, v) => s + Math.abs(v), 0)) / 5))),
          globalImpact: 0,
          metadata: eventMetadata as unknown as Prisma.InputJsonValue,
        },
      },
    },
  });

  return {
    snapshotId: snapshot.id,
    runId: dataRunId,
    success: true,
    signalsUsed: signalCount,
    scenarioKey,
  };
}

export async function getLatestMarketDataRun() {
  return db.marketDataRun.findFirst({
    orderBy: { createdAt: "desc" },
    include: { snapshot: true },
  });
}

export async function getLatestMarketSignals(limit = 20) {
  return db.marketSignal.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { dataRun: { select: { mode: true, status: true } } },
  });
}

export async function getActiveMarketSnapshot() {
  const now = new Date();
  const realMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Prefer active adapter snapshot for current month
  const active = await db.marketSnapshot.findFirst({
    where: { month: realMonth, isActive: true },
    include: { events: true, dataRun: true },
  });
  if (active) return active;

  // Fallback to any snapshot for current month
  const any = await db.marketSnapshot.findFirst({
    where: { month: realMonth },
    include: { events: true, dataRun: true },
    orderBy: { createdAt: "desc" },
  });
  if (any) return any;

  // Fallback to seeded scenarios
  const monthIndex = now.getMonth();
  const seededMonth = new Date(2024, monthIndex % 12, 1);
  return db.marketSnapshot.findUnique({
    where: { month: seededMonth },
    include: { events: true, dataRun: true },
  });
}
