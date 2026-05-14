import { BaseProvider } from "./base";
import { RawMarketSignal, ProviderConfig, ProviderFetchResult } from "../types";

/**
 * Crypto market provider using CoinGecko public API (no API key required).
 * Provides crypto sentiment signals based on BTC/ETH 24h price changes.
 * Server-side only.
 */
export class CryptoProvider extends BaseProvider {
  readonly name = "crypto";

  get isAvailable(): boolean {
    // CoinGecko public API requires no key for basic endpoints
    return true;
  }

  async fetchSignals(_config: ProviderConfig): Promise<RawMarketSignal[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const url =
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true";

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[Crypto] CoinGecko HTTP ${res.status}`);
        return [];
      }

      const data = await res.json() as {
        bitcoin?: { usd_24h_change?: number };
        ethereum?: { usd_24h_change?: number };
      };

      const signals: RawMarketSignal[] = [];
      const now = new Date();

      // BTC signal
      const btcChange = data.bitcoin?.usd_24h_change;
      if (typeof btcChange === "number") {
        const direction: "positive" | "negative" | "neutral" =
          btcChange > 3 ? "positive" : btcChange < -3 ? "negative" : "neutral";
        const severity = Math.min(60, Math.max(20, 30 + Math.abs(btcChange) * 2));

        signals.push({
          id: `crypto-btc-${now.toISOString().split("T")[0]}`,
          sourceId: `crypto-btc-${now.toISOString().split("T")[0]}`,
          source: "crypto",
          title: `Bitcoin ${direction === "positive" ? "Rallies" : direction === "negative" ? "Declines" : "Steady"} (${btcChange > 0 ? "+" : ""}${btcChange.toFixed(1)}% 24h)`,
          summary: `Bitcoin 24-hour change: ${btcChange > 0 ? "+" : ""}${btcChange.toFixed(2)}%. ${direction === "positive" ? "Positive momentum in digital asset markets." : direction === "negative" ? "Downward pressure in crypto markets." : "Sideways price action."}`,
          publishedAt: now,
          signalType: "crypto",
          direction,
          severity,
          confidence: 50, // capped by normalizer to 55
          sectors: ["web3", "fintech", "consumer"],
          regions: ["global"],
        });
      }

      // ETH confirmation signal (only if direction differs or for additional context)
      const ethChange = data.ethereum?.usd_24h_change;
      if (typeof ethChange === "number") {
        const direction: "positive" | "negative" | "neutral" =
          ethChange > 3 ? "positive" : ethChange < -3 ? "negative" : "neutral";
        const severity = Math.min(55, Math.max(20, 25 + Math.abs(ethChange) * 2));

        // Only include ETH if it reinforces the same direction as BTC, or provides contrast
        const btcDir = signals[0]?.direction;
        if (btcDir && direction !== btcDir) {
          // Mixed signal — add ETH as a separate, slightly lower-confidence signal
          signals.push({
            id: `crypto-eth-${now.toISOString().split("T")[0]}`,
            sourceId: `crypto-eth-${now.toISOString().split("T")[0]}`,
            source: "crypto",
            title: `Ethereum ${direction === "positive" ? "Rallies" : direction === "negative" ? "Declines" : "Steady"} (${ethChange > 0 ? "+" : ""}${ethChange.toFixed(1)}% 24h)`,
            summary: `Ethereum 24-hour change: ${ethChange > 0 ? "+" : ""}${ethChange.toFixed(2)}%. Contrasting BTC movement suggests selective altcoin sentiment.`,
            publishedAt: now,
            signalType: "crypto",
            direction,
            severity,
            confidence: 45, // lower confidence when conflicting
            sectors: ["web3", "fintech"],
            regions: ["global"],
          });
        }
      }

      return signals;
    } catch (err) {
      clearTimeout(timeout);
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[Crypto] Fetch failed: ${message}`);
      return [];
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
