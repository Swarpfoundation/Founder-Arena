import { ProviderConfig, BuildSnapshotResult, ProviderMode, NormalizedMarketSignal } from "./types";
import { StaticProvider } from "./providers/static-provider";
import { NewsApiProvider } from "./providers/newsapi-provider";
import { FredProvider } from "./providers/fred-provider";
import { CryptoProvider } from "./providers/crypto-provider";
import { normalizeSignal, deduplicateSignals } from "./normalizer";
import { interpretSignalsToMarketState } from "./interpreter";
import {
  buildPreview,
  persistSignals,
  createDataRun,
  completeDataRun,
  activateMarketSnapshot,
  PreviewResult,
} from "./snapshot-builder";
import { seedMarketSnapshotsV1 } from "@/lib/market/snapshot-service";
import { ProviderUnavailableError } from "./errors";
import { withTiming } from "@/lib/observability/timing";

const staticProvider = new StaticProvider();
const newsApiProvider = new NewsApiProvider();
const fredProvider = new FredProvider();
const cryptoProvider = new CryptoProvider();

const EXTERNAL_PROVIDERS = [newsApiProvider, fredProvider, cryptoProvider];

const FALLBACK_MODE = (process.env.MARKET_DATA_EXTERNAL_FALLBACK as "static" | "seeded" | "none") ?? "static";

export function getProviderStatus() {
  return [
    { name: "static", configured: true, available: staticProvider.isAvailable, envVar: null },
    { name: "newsapi", configured: !!process.env.NEWS_API_KEY, available: newsApiProvider.isAvailable, envVar: "NEWS_API_KEY" },
    { name: "fred", configured: !!process.env.FRED_API_KEY, available: fredProvider.isAvailable, envVar: "FRED_API_KEY" },
    { name: "crypto", configured: true, available: cryptoProvider.isAvailable, envVar: null },
  ];
}

export function getAvailableProviderModes(): { mode: ProviderMode; label: string; available: boolean }[] {
  const externalAvailable = EXTERNAL_PROVIDERS.some((p) => p.isAvailable);
  return [
    { mode: "static", label: "Static Adapter (deterministic, no API keys)", available: true },
    { mode: "seeded", label: "Seeded Scenarios (Phase 6 presets)", available: true },
    { mode: "external", label: "External Providers only (NewsAPI, FRED, Crypto if configured)", available: externalAvailable },
    { mode: "hybrid", label: "Hybrid — external + static fallback", available: true },
  ];
}

interface FetchResult {
  signals: NormalizedMarketSignal[];
  providerSources: string[];
  warnings: string[];
  providerErrors: Record<string, string>;
  fallbackUsed: boolean;
}

async function fetchRawSignals(mode: ProviderMode, config: ProviderConfig): Promise<FetchResult> {
  const rawSignals: Awaited<ReturnType<typeof staticProvider.fetchSignals>> = [];
  const providerSources: string[] = [];
  const warnings: string[] = [];
  const providerErrors: Record<string, string> = {};
  let fallbackUsed = false;

  if (mode === "static") {
    rawSignals.push(...await staticProvider.fetchSignals(config));
    providerSources.push("static");
  } else if (mode === "external" || mode === "hybrid") {
    const availableExternal = EXTERNAL_PROVIDERS.filter((p) => p.isAvailable);
    const requestedExternal = EXTERNAL_PROVIDERS.map((p) => p.name);

    if (availableExternal.length === 0) {
      warnings.push(`No external providers available. Requested: ${requestedExternal.join(", ")}.`);

      if (mode === "hybrid" || FALLBACK_MODE === "static") {
        warnings.push(`Falling back to static provider (MARKET_DATA_EXTERNAL_FALLBACK=${FALLBACK_MODE}).`);
        rawSignals.push(...await staticProvider.fetchSignals(config));
        providerSources.push("static (fallback)");
        fallbackUsed = true;
      } else if (FALLBACK_MODE === "seeded") {
        warnings.push("Falling back to seeded scenarios.");
        // Seeded fallback is handled at a higher level
      } else {
        warnings.push("No fallback configured. Snapshot may have insufficient signals.");
      }
    } else {
      for (const provider of availableExternal) {
        try {
          const signals = await provider.fetchSignals(config);
          rawSignals.push(...signals);
          providerSources.push(provider.name);
          if (signals.length === 0) {
            warnings.push(`${provider.name} returned no signals.`);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          warnings.push(`${provider.name} failed: ${message}`);
          providerErrors[provider.name] = message;
        }
      }

      // In hybrid mode, also include static signals to ensure coverage
      if (mode === "hybrid") {
        try {
          const staticSignals = await staticProvider.fetchSignals(config);
          rawSignals.push(...staticSignals);
          providerSources.push("static");
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          warnings.push(`static failed: ${message}`);
          providerErrors["static"] = message;
        }
      }

      // Fallback if all external providers returned empty signals
      if (rawSignals.length === 0 && mode === "external" && FALLBACK_MODE === "static") {
        warnings.push("All external providers returned no signals. Falling back to static provider.");
        const staticSignals = await staticProvider.fetchSignals(config);
        rawSignals.push(...staticSignals);
        providerSources.push("static (fallback)");
        fallbackUsed = true;
      }
    }
  }

  const normalized = deduplicateSignals(rawSignals.map(normalizeSignal));
  return { signals: normalized, providerSources, warnings, providerErrors, fallbackUsed };
}

export async function previewMarketSnapshot(
  mode: ProviderMode,
  monthIndex?: number
): Promise<PreviewResult> {
  return withTiming("previewMarketSnapshot", async () => {
    const config: ProviderConfig = { mode, monthIndex, date: new Date() };

    if (mode === "seeded") {
      return {
        mode,
        signalCount: 0,
        confidence: 100,
        condition: "neutral",
        macroScores: {
          vcClimate: 0, inflationPressure: 0, geopoliticalRisk: 0,
          consumerSpending: 0, enterpriseSpending: 0, aiDemand: 0,
          cryptoSentiment: 0, regulationPressure: 0, supplyChainPressure: 0, energyPrices: 0,
        },
        sectorModifiers: {},
        topSignals: [],
        hotSectors: [],
        coldSectors: [],
        explanation: "Seeded scenarios will restore Phase 6 preset market snapshots.",
        warnings: ["This will overwrite the current month's adapter snapshot."],
      };
    }

    const { signals, warnings, fallbackUsed } = await fetchRawSignals(mode, config);
    const state = interpretSignalsToMarketState(signals);
    const preview = buildPreview(state, mode);

    const allWarnings = [...preview.warnings, ...warnings];
    if (fallbackUsed) {
      allWarnings.push("External provider fallback was used.");
    }

    return {
      ...preview,
      warnings: allWarnings,
    };
  }, { mode });
}

export async function generateAndActivateMarketSnapshot(
  mode: ProviderMode,
  monthIndex?: number
): Promise<BuildSnapshotResult> {
  return withTiming("generateAndActivateMarketSnapshot", async () => {
    const config: ProviderConfig = { mode, monthIndex, date: new Date() };

  if (mode === "seeded") {
    await seedMarketSnapshotsV1();
    return {
      snapshotId: undefined,
      runId: "seeded",
      success: true,
      signalsUsed: 0,
      scenarioKey: "seeded",
    };
  }

  // Create data run
  const providerStatus = getProviderStatus();
  const availableProviders = providerStatus.filter((p) => p.available).map((p) => p.name);
  const dataRunId = await createDataRun(mode, availableProviders);

  try {
    const { signals, providerSources, warnings, providerErrors, fallbackUsed } = await fetchRawSignals(mode, config);

    if (signals.length === 0 && mode === "external" && FALLBACK_MODE === "none") {
      throw new ProviderUnavailableError(
        "external providers",
        "No external providers returned signals and fallback is disabled (MARKET_DATA_EXTERNAL_FALLBACK=none)."
      );
    }

    // Handle seeded fallback
    if (signals.length === 0 && FALLBACK_MODE === "seeded" && (mode === "external" || mode === "hybrid")) {
      await seedMarketSnapshotsV1();
      await completeDataRun(dataRunId, {
        status: "partial",
        signalsFetched: 0,
        signalsStored: 0,
        metadata: {
          fallbackUsed: true,
          fallbackMode: "seeded",
          providerSources,
          providerErrors,
          warnings,
        },
      });
      return {
        runId: dataRunId,
        success: true,
        signalsUsed: 0,
        scenarioKey: "seeded_fallback",
      };
    }

    const state = interpretSignalsToMarketState(signals);

    // Persist signals
    const storedCount = await persistSignals(signals, dataRunId);

    // Activate snapshot
    const result = await activateMarketSnapshot(state, mode, signals.length, providerSources, dataRunId);

    // Complete run with enriched metadata
    await completeDataRun(dataRunId, {
      status: warnings.length > 0 || fallbackUsed ? "partial" : "success",
      signalsFetched: signals.length,
      signalsStored: storedCount,
      snapshotId: result.snapshotId,
      metadata: {
        warnings,
        providerSourcesRequested: EXTERNAL_PROVIDERS.map((p) => p.name),
        providerSourcesUsed: providerSources,
        providerErrors,
        fallbackUsed,
        totalRawSignals: signals.length + warnings.filter((w) => w.includes("returned no signals")).length * 5,
        totalNormalizedSignals: signals.length,
        dedupedCount: signals.length,
        confidence: state.overallConfidence,
        topSignalHashes: signals.slice(0, 5).map((s) => s.hash),
        limitations: [
          "External provider data may be incomplete or delayed.",
          "News signals are heuristic-based, not quantitative analysis.",
          "Crypto signals reflect 24h price action only.",
          "FRED signals use limited series (FEDFUNDS, UNRATE).",
        ],
      },
    });

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during snapshot generation";
    await completeDataRun(dataRunId, {
      status: "failed",
      signalsFetched: 0,
      signalsStored: 0,
      error: message,
      metadata: {
        providerSourcesRequested: EXTERNAL_PROVIDERS.map((p) => p.name),
      },
    });

    return {
      runId: dataRunId,
      success: false,
      error: message,
      signalsUsed: 0,
      scenarioKey: `${mode}_adapter_v1`,
    };
  }
  }, { mode });
}

export async function generateMarketSnapshot(
  mode: ProviderMode,
  monthIndex?: number
): Promise<BuildSnapshotResult> {
  return generateAndActivateMarketSnapshot(mode, monthIndex);
}
