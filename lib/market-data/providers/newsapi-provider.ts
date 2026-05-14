import { BaseProvider } from "./base";
import { RawMarketSignal, ProviderConfig, ProviderFetchResult } from "../types";



const QUERIES = [
  "AI enterprise artificial intelligence startup",
  "venture capital startup funding",
  "inflation interest rates economy",
  "crypto bitcoin regulation",
  "fintech regulation compliance",
  "supply chain disruption logistics",
  "energy prices oil gas",
  "geopolitical conflict trade",
  "consumer spending retail economy",
  "enterprise software SaaS budget",
];

// Keyword maps for heuristic signal classification
const POSITIVE_WORDS = [
  "surge", "boom", "rally", "growth", "expand", "rise", "gain", "strong",
  "optimistic", "bullish", "recover", "upturn", "soar", "rocket", "breakthrough",
  "record", "all-time high", "momentum", "opportunity",
];

const NEGATIVE_WORDS = [
  "crash", "crisis", "recession", "decline", "fall", "drop", "plunge", "weak",
  "bearish", "pessimistic", "downturn", "collapse", "tumble", "slump", "risk",
  "warning", "threat", "cut", "layoff", "bankruptcy", "default",
];

const SIGNAL_TYPE_KEYWORDS: Record<string, string[]> = {
  ai: ["ai", "artificial intelligence", "machine learning", "llm", "generative ai", "enterprise ai"],
  crypto: ["crypto", "bitcoin", "ethereum", "blockchain", "digital asset", "token"],
  regulation: ["regulation", "regulatory", "compliance", "sec", "fda", "law", "policy"],
  inflation: ["inflation", "interest rate", "fed", "federal reserve", "cpi", "monetary"],
  funding: ["venture capital", "vc", "funding", "investment", "valuation", "ipo", "raise"],
  geopolitical: ["geopolitical", "conflict", "war", "trade war", "sanctions", "tension"],
  supply_chain: ["supply chain", "logistics", "shipping", "shortage", "procurement"],
  energy: ["energy", "oil", "gas", "electricity", "renewable", "power"],
  consumer: ["consumer", "retail", "spending", "shopping", "household"],
  enterprise: ["enterprise", "saas", "software", "b2b", "corporate"],
  macro: ["economy", "gdp", "recession", "growth", "market"],
};

function classifySignalType(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  for (const [type, keywords] of Object.entries(SIGNAL_TYPE_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return type;
  }
  return "macro";
}

function classifyDirection(title: string, description: string): "positive" | "negative" | "neutral" {
  const text = `${title} ${description}`.toLowerCase();
  let posScore = 0;
  let negScore = 0;
  for (const word of POSITIVE_WORDS) {
    if (text.includes(word)) posScore++;
  }
  for (const word of NEGATIVE_WORDS) {
    if (text.includes(word)) negScore++;
  }
  if (posScore > negScore + 1) return "positive";
  if (negScore > posScore + 1) return "negative";
  return "neutral";
}

function computeSeverity(title: string, description: string): number {
  const text = `${title} ${description}`.toLowerCase();
  let base = 35;
  // Intensity modifiers
  const strongWords = ["surge", "crash", "collapse", "crisis", "boom", "plunge", "soar", "rocket", "tumble"];
  for (const w of strongWords) {
    if (text.includes(w)) base += 10;
  }
  // Cap based on source reliability
  return Math.max(20, Math.min(70, base));
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).slice(0, 10);
}

function mapArticleToSignal(article: {
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
}): RawMarketSignal {
  const title = article.title || "Untitled";
  const description = article.description || "";
  const signalType = classifySignalType(title, description);
  const direction = classifyDirection(title, description);
  const severity = computeSeverity(title, description);

  return {
    id: `newsapi-${hashString(article.url)}`,
    sourceId: `newsapi-${hashString(article.url)}`,
    source: "newsapi",
    title: title.slice(0, 200),
    summary: description.slice(0, 500),
    url: article.url,
    publishedAt: new Date(article.publishedAt),
    signalType: signalType as RawMarketSignal["signalType"],
    direction,
    severity,
    confidence: 50, // capped further by normalizer to 60
    sectors: [],
    regions: [],
  };
}

/**
 * NewsAPI provider — fetches recent news articles and maps them to market signals.
 * Server-side only. Requires NEWS_API_KEY env var.
 */
export class NewsApiProvider extends BaseProvider {
  readonly name = "newsapi";

  get isAvailable(): boolean {
    const key = process.env.NEWS_API_KEY;
    return !!key && key.length > 10;
  }

  private get apiKey(): string | undefined {
    return process.env.NEWS_API_KEY;
  }

  async fetchSignals(config: ProviderConfig): Promise<RawMarketSignal[]> {
    if (!this.isAvailable) {
      return [];
    }

    const queryIndex = (config.monthIndex ?? new Date().getMonth()) % QUERIES.length;
    const query = QUERIES[queryIndex];
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7); // last 7 days

    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", query);
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "20");
    url.searchParams.set("language", "en");
    url.searchParams.set("from", fromDate.toISOString().split("T")[0]);
    url.searchParams.set("apiKey", this.apiKey!);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        if (res.status === 429) {
          console.warn("[NewsAPI] Rate limited");
        } else {
          console.warn(`[NewsAPI] HTTP ${res.status}`);
        }
        return [];
      }

      const data = await res.json() as {
        status: string;
        articles?: Array<{
          title: string;
          description: string | null;
          url: string;
          publishedAt: string;
        }>;
      };

      if (data.status !== "ok" || !Array.isArray(data.articles)) {
        return [];
      }

      // Filter out articles with missing/removed content
      const validArticles = data.articles.filter(
        (a) =>
          a.title &&
          a.title !== "[Removed]" &&
          a.description !== "[Removed]" &&
          a.url &&
          a.publishedAt
      );

      return validArticles.map(mapArticleToSignal);
    } catch (err) {
      clearTimeout(timeout);
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[NewsAPI] Fetch failed: ${message}`);
      return [];
    }
  }

  /**
   * Fetch with result wrapper for orchestration metadata.
   */
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
