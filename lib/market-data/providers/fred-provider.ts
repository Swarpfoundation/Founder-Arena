import { BaseProvider } from "./base";
import { RawMarketSignal, ProviderConfig, ProviderFetchResult } from "../types";



// FRED series we monitor
const SERIES = [
  { id: "FEDFUNDS", name: "Federal Funds Rate", signalType: "inflation" as const },
  { id: "UNRATE", name: "Unemployment Rate", signalType: "macro" as const },
];

/**
 * FRED (Federal Reserve Economic Data) provider.
 * Fetches key economic series and maps them to macro signals.
 * Server-side only. Requires FRED_API_KEY env var.
 */
export class FredProvider extends BaseProvider {
  readonly name = "fred";

  get isAvailable(): boolean {
    const key = process.env.FRED_API_KEY;
    return !!key && key.length > 10;
  }

  private get apiKey(): string | undefined {
    return process.env.FRED_API_KEY;
  }

  async fetchSignals(_config: ProviderConfig): Promise<RawMarketSignal[]> {
    if (!this.isAvailable) {
      return [];
    }

    const signals: RawMarketSignal[] = [];

    for (const series of SERIES) {
      try {
        const signal = await this.fetchSeriesSignal(series);
        if (signal) signals.push(signal);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[FRED] ${series.id} failed: ${message}`);
      }
    }

    return signals;
  }

  private async fetchSeriesSignal(series: typeof SERIES[number]): Promise<RawMarketSignal | null> {
    const url = new URL("https://api.stlouisfed.org/fred/series/observations");
    url.searchParams.set("series_id", series.id);
    url.searchParams.set("api_key", this.apiKey!);
    url.searchParams.set("file_type", "json");
    url.searchParams.set("sort_order", "desc");
    url.searchParams.set("limit", "2");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[FRED] ${series.id} HTTP ${res.status}`);
        return null;
      }

      const data = await res.json() as {
        observations?: Array<{ date: string; value: string }>;
      };

      if (!Array.isArray(data.observations) || data.observations.length < 2) {
        return null;
      }

      const [latest, previous] = data.observations;
      const latestVal = parseFloat(latest.value);
      const prevVal = parseFloat(previous.value);

      if (isNaN(latestVal) || isNaN(prevVal)) {
        return null;
      }

      const change = latestVal - prevVal;
      const changePct = prevVal !== 0 ? (change / prevVal) * 100 : 0;

      let direction: "positive" | "negative" | "neutral" = "neutral";
      let severity = 40;

      if (series.id === "FEDFUNDS") {
        // Rate hikes = negative for startups (tighter money)
        // Rate cuts = positive (easier money)
        direction = change > 0.05 ? "negative" : change < -0.05 ? "positive" : "neutral";
        severity = Math.min(75, Math.max(30, 40 + Math.abs(change) * 20));
      } else if (series.id === "UNRATE") {
        // Rising unemployment = negative (weaker economy)
        // Falling unemployment = positive
        direction = change > 0.1 ? "negative" : change < -0.1 ? "positive" : "neutral";
        severity = Math.min(70, Math.max(30, 40 + Math.abs(change) * 15));
      }

      const summary = `${series.name}: ${latestVal.toFixed(2)}% (was ${prevVal.toFixed(2)}%). ${change > 0 ? "Up" : change < 0 ? "Down" : "Unchanged"} ${Math.abs(changePct).toFixed(1)}% from prior period.`;

      return {
        id: `fred-${series.id}-${latest.date}`,
        sourceId: `fred-${series.id}-${latest.date}`,
        source: "fred",
        title: `${series.name} Update`,
        summary: summary.slice(0, 500),
        publishedAt: new Date(latest.date),
        signalType: series.signalType,
        direction,
        severity,
        confidence: 80, // capped by normalizer to 85
        sectors: [],
        regions: ["us"],
      };
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  async fetchSignalsWithMeta(config: ProviderConfig): Promise<ProviderFetchResult> {
    try {
      const signals = await this.fetchSignals(config);
      return { signals, source: this.name };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { signals: [], source: this.name, error: message };
    }
  }
}
