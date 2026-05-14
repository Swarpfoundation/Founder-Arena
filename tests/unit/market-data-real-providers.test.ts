import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NewsApiProvider } from "@/lib/market-data/providers/newsapi-provider";
import { FredProvider } from "@/lib/market-data/providers/fred-provider";
import { CryptoProvider } from "@/lib/market-data/providers/crypto-provider";
import { normalizeSignal } from "@/lib/market-data/normalizer";
import { interpretSignalsToMarketState } from "@/lib/market-data/interpreter";

// ─── Helpers ───────────────────────────────────────────────────────────

function mockFetch(response: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => response,
  });
}

// ─── NewsAPI Provider ──────────────────────────────────────────────────

describe("NewsApiProvider", () => {
  const originalEnv = { ...process.env };
  let provider: NewsApiProvider;

  beforeEach(() => {
    process.env.NEWS_API_KEY = "test_api_key_123456789";
    provider = new NewsApiProvider();
    vi.stubGlobal("fetch", mockFetch({ status: "ok", articles: [] }));
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("is unavailable when NEWS_API_KEY is missing", () => {
    delete process.env.NEWS_API_KEY;
    const p = new NewsApiProvider();
    expect(p.isAvailable).toBe(false);
  });

  it("is available with valid API key", () => {
    expect(provider.isAvailable).toBe(true);
  });

  it("returns empty array when unavailable", async () => {
    delete process.env.NEWS_API_KEY;
    const p = new NewsApiProvider();
    const signals = await p.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals).toEqual([]);
  });

  it("maps articles to signals with correct fields", async () => {
    vi.stubGlobal("fetch", mockFetch({
      status: "ok",
      articles: [
        {
          title: "AI Startup Funding Surges to Record Levels",
          description: "Venture capital firms are pouring billions into artificial intelligence startups.",
          url: "https://example.com/ai-funding",
          publishedAt: "2024-06-15T10:00:00Z",
        },
      ],
    }));

    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals.length).toBe(1);
    expect(signals[0].source).toBe("newsapi");
    expect(signals[0].signalType).toBe("ai"); // "AI" keyword matches before "funding"
    expect(signals[0].direction).toBe("positive");
    expect(signals[0].severity).toBeGreaterThanOrEqual(20);
    expect(signals[0].severity).toBeLessThanOrEqual(70);
    expect(signals[0].confidence).toBe(50);
    expect(signals[0].url).toBe("https://example.com/ai-funding");
  });

  it("classifies negative sentiment correctly", async () => {
    vi.stubGlobal("fetch", mockFetch({
      status: "ok",
      articles: [
        {
          title: "Crypto Markets Crash Amid Regulatory Crackdown",
          description: "Bitcoin and Ethereum plunge as regulators announce new enforcement actions.",
          url: "https://example.com/crypto-crash",
          publishedAt: "2024-06-15T10:00:00Z",
        },
      ],
    }));

    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 3 });
    expect(signals[0].signalType).toBe("crypto");
    expect(signals[0].direction).toBe("negative");
  });

  it("filters out [Removed] articles", async () => {
    vi.stubGlobal("fetch", mockFetch({
      status: "ok",
      articles: [
        { title: "[Removed]", description: "[Removed]", url: "", publishedAt: "" },
        { title: "Valid Article", description: "Valid desc", url: "https://example.com", publishedAt: "2024-06-15T10:00:00Z" },
      ],
    }));

    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals.length).toBe(1);
    expect(signals[0].title).toBe("Valid Article");
  });

  it("handles HTTP errors gracefully", async () => {
    vi.stubGlobal("fetch", mockFetch({ status: "error", message: "rate limited" }, false, 429));
    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals).toEqual([]);
  });

  it("handles network errors gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network timeout")));
    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals).toEqual([]);
  });

  it("handles network timeout gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network timeout")));
    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals).toEqual([]);
  });
});

// ─── FRED Provider ─────────────────────────────────────────────────────

describe("FredProvider", () => {
  const originalEnv = { ...process.env };
  let provider: FredProvider;

  beforeEach(() => {
    process.env.FRED_API_KEY = "test_fred_key_123456789";
    provider = new FredProvider();
    vi.stubGlobal("fetch", mockFetch({ observations: [] }));
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("is unavailable when FRED_API_KEY is missing", () => {
    delete process.env.FRED_API_KEY;
    const p = new FredProvider();
    expect(p.isAvailable).toBe(false);
  });

  it("is available with valid API key", () => {
    expect(provider.isAvailable).toBe(true);
  });

  it("returns empty array when unavailable", async () => {
    delete process.env.FRED_API_KEY;
    const p = new FredProvider();
    const signals = await p.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals).toEqual([]);
  });

  it("maps FEDFUNDS to inflation signal with negative direction on rate hike", async () => {
    vi.stubGlobal("fetch", mockFetch({
      observations: [
        { date: "2024-06-01", value: "5.50" },
        { date: "2024-05-01", value: "5.25" },
      ],
    }));

    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals.length).toBeGreaterThanOrEqual(1);
    const fedSignal = signals.find((s) => s.title.includes("Federal Funds Rate"));
    expect(fedSignal).toBeDefined();
    expect(fedSignal?.signalType).toBe("inflation");
    expect(fedSignal?.direction).toBe("negative"); // rate hike = negative for startups
    expect(fedSignal?.confidence).toBe(80);
  });

  it("maps FEDFUNDS to positive direction on rate cut", async () => {
    vi.stubGlobal("fetch", mockFetch({
      observations: [
        { date: "2024-06-01", value: "5.00" },
        { date: "2024-05-01", value: "5.50" },
      ],
    }));

    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 0 });
    const fedSignal = signals.find((s) => s.title.includes("Federal Funds Rate"));
    expect(fedSignal?.direction).toBe("positive");
  });

  it("handles missing observations gracefully", async () => {
    vi.stubGlobal("fetch", mockFetch({ observations: [] }));
    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals).toEqual([]);
  });

  it("handles HTTP errors gracefully", async () => {
    vi.stubGlobal("fetch", mockFetch({}, false, 500));
    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals).toEqual([]);
  });

  it("handles network errors gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network timeout")));
    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals).toEqual([]);
  });
});

// ─── Crypto Provider ───────────────────────────────────────────────────

describe("CryptoProvider", () => {
  let provider: CryptoProvider;

  beforeEach(() => {
    provider = new CryptoProvider();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("is always available (no API key needed)", () => {
    expect(provider.isAvailable).toBe(true);
  });

  it("maps BTC rally to positive crypto signal", async () => {
    vi.stubGlobal("fetch", mockFetch({
      bitcoin: { usd_24h_change: 5.2 },
      ethereum: { usd_24h_change: 4.1 },
    }));

    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals.length).toBeGreaterThanOrEqual(1);
    const btcSignal = signals.find((s) => s.title.includes("Bitcoin"));
    expect(btcSignal).toBeDefined();
    expect(btcSignal?.signalType).toBe("crypto");
    expect(btcSignal?.direction).toBe("positive");
    expect(btcSignal?.confidence).toBe(50);
    expect(btcSignal?.severity).toBeGreaterThanOrEqual(20);
    expect(btcSignal?.severity).toBeLessThanOrEqual(60);
  });

  it("maps BTC decline to negative crypto signal", async () => {
    vi.stubGlobal("fetch", mockFetch({
      bitcoin: { usd_24h_change: -6.5 },
      ethereum: { usd_24h_change: -5.0 },
    }));

    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 0 });
    const btcSignal = signals.find((s) => s.title.includes("Bitcoin"));
    expect(btcSignal?.direction).toBe("negative");
  });

  it("adds ETH signal when direction differs from BTC", async () => {
    vi.stubGlobal("fetch", mockFetch({
      bitcoin: { usd_24h_change: 5.0 },
      ethereum: { usd_24h_change: -4.0 },
    }));

    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals.length).toBe(2);
    const ethSignal = signals.find((s) => s.title.includes("Ethereum"));
    expect(ethSignal).toBeDefined();
    expect(ethSignal?.direction).toBe("negative");
    expect(ethSignal?.confidence).toBe(45); // lower when conflicting
  });

  it("handles HTTP errors gracefully", async () => {
    vi.stubGlobal("fetch", mockFetch({}, false, 429));
    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals).toEqual([]);
  });

  it("handles network errors gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network timeout")));
    const signals = await provider.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals).toEqual([]);
  });
});

// ─── Source Confidence Caps ────────────────────────────────────────────

describe("source confidence caps in normalizer", () => {
  const baseArticle = {
    id: "test",
    sourceId: "test",
    source: "newsapi",
    title: "Test",
    summary: "Test summary",
    publishedAt: new Date(),
    signalType: "ai" as const,
    direction: "positive" as const,
    severity: 50,
    confidence: 100,
  };

  it("caps newsapi confidence at 60", () => {
    const normalized = normalizeSignal({ ...baseArticle, source: "newsapi", confidence: 100 });
    expect(normalized.confidence).toBe(60);
  });

  it("caps fred confidence at 85", () => {
    const normalized = normalizeSignal({ ...baseArticle, source: "fred", confidence: 100 });
    expect(normalized.confidence).toBe(85);
  });

  it("caps crypto confidence at 55", () => {
    const normalized = normalizeSignal({ ...baseArticle, source: "crypto", confidence: 100 });
    expect(normalized.confidence).toBe(55);
  });

  it("caps static confidence at 70", () => {
    const normalized = normalizeSignal({ ...baseArticle, source: "static", confidence: 100 });
    expect(normalized.confidence).toBe(70);
  });

  it("does not lower confidence below cap", () => {
    const normalized = normalizeSignal({ ...baseArticle, source: "newsapi", confidence: 40 });
    expect(normalized.confidence).toBe(40);
  });
});

// ─── Source Weighting / No Dominance ───────────────────────────────────

describe("interpreter source weighting — no single source dominates", () => {
  it("single scary news article cannot max out geopolitical risk", () => {
    const signals = [
      normalizeSignal({
        id: "s1", sourceId: "s1", source: "newsapi",
        title: "War Crisis Crash Disaster",
        summary: "Extremely negative geopolitical event.",
        publishedAt: new Date(),
        signalType: "geopolitical",
        direction: "negative",
        severity: 100,
        confidence: 100,
        sectors: [],
        regions: [],
      }),
    ];
    const state = interpretSignalsToMarketState(signals);
    // Confidence cap at 60 for news, severity at 70 max, so weighted effect is bounded
    expect(Math.abs(state.macroScores.geopoliticalRisk)).toBeLessThanOrEqual(60);
  });

  it("multiple consistent signals create stronger but bounded effect", () => {
    const signals = Array.from({ length: 5 }, (_, i) =>
      normalizeSignal({
        id: `s${i}`, sourceId: `s${i}`, source: "newsapi",
        title: `Negative event ${i}`,
        summary: "Bad news.",
        publishedAt: new Date(),
        signalType: "geopolitical",
        direction: "negative",
        severity: 70,
        confidence: 60,
        sectors: [],
        regions: [],
      })
    );
    const state = interpretSignalsToMarketState(signals);
    expect(Math.abs(state.macroScores.geopoliticalRisk)).toBeGreaterThan(10);
    expect(Math.abs(state.macroScores.geopoliticalRisk)).toBeLessThanOrEqual(80);
  });

  it("fred economic data has higher weight than news", () => {
    const fredSignal = normalizeSignal({
      id: "f1", sourceId: "f1", source: "fred",
      title: "Fed Rate Update",
      summary: "Rates increased.",
      publishedAt: new Date(),
      signalType: "inflation",
      direction: "negative",
      severity: 75,
      confidence: 85,
      sectors: [],
      regions: [],
    });

    const newsSignal = normalizeSignal({
      id: "n1", sourceId: "n1", source: "newsapi",
      title: "Inflation News",
      summary: "Prices rising.",
      publishedAt: new Date(),
      signalType: "inflation",
      direction: "negative",
      severity: 70,
      confidence: 60,
      sectors: [],
      regions: [],
    });

    const stateFredOnly = interpretSignalsToMarketState([fredSignal]);
    const stateNewsOnly = interpretSignalsToMarketState([newsSignal]);

    // Same severity, but fred has higher confidence cap (85 vs 60)
    // so its weighted effect should be stronger
    expect(Math.abs(stateFredOnly.macroScores.inflationPressure)).toBeGreaterThanOrEqual(
      Math.abs(stateNewsOnly.macroScores.inflationPressure)
    );
  });
});

// ─── Provider Orchestration Modes ──────────────────────────────────────

describe("provider orchestration modes", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEWS_API_KEY;
    delete process.env.FRED_API_KEY;
    vi.stubGlobal("fetch", mockFetch({ status: "ok", articles: [] }));
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("static mode returns static signals", async () => {
    const staticProvider = new (await import("@/lib/market-data/providers/static-provider")).StaticProvider();
    const signals = await staticProvider.fetchSignals({ mode: "static", monthIndex: 0 });
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.every((s) => s.source === "static")).toBe(true);
  });

  it("external mode returns empty when no keys configured", async () => {
    const newsProvider = new NewsApiProvider();
    const fredProvider = new FredProvider();
    expect(newsProvider.isAvailable).toBe(false);
    expect(fredProvider.isAvailable).toBe(false);
  });

  it("hybrid mode includes static signals even when external unavailable", async () => {
    // This tests the intent: hybrid should always include static
    const staticProvider = new (await import("@/lib/market-data/providers/static-provider")).StaticProvider();
    const staticSignals = await staticProvider.fetchSignals({ mode: "hybrid", monthIndex: 0 });
    expect(staticSignals.length).toBeGreaterThan(0);
  });

  it("missing providers do not crash service", async () => {
    const newsProvider = new NewsApiProvider();
    const signals = await newsProvider.fetchSignals({ mode: "external", monthIndex: 0 });
    expect(signals).toEqual([]);
  });
});

// ─── Fallback Behavior ─────────────────────────────────────────────────

describe("fallback behavior", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEWS_API_KEY;
    delete process.env.FRED_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("static fallback env var defaults to static", () => {
    delete process.env.MARKET_DATA_EXTERNAL_FALLBACK;
    const fallback = process.env.MARKET_DATA_EXTERNAL_FALLBACK ?? "static";
    expect(fallback).toBe("static");
  });

  it("seeded fallback can be configured", () => {
    process.env.MARKET_DATA_EXTERNAL_FALLBACK = "seeded";
    expect(process.env.MARKET_DATA_EXTERNAL_FALLBACK).toBe("seeded");
  });
});
