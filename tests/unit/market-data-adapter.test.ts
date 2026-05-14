import { describe, it, expect } from "vitest";
import { StaticProvider } from "@/lib/market-data/providers/static-provider";
import { normalizeSignal, deduplicateSignals } from "@/lib/market-data/normalizer";
import { interpretSignalsToMarketState } from "@/lib/market-data/interpreter";
import { RawMarketSignal } from "@/lib/market-data/types";

describe("static provider", () => {
  it("produces deterministic signals for the same month", async () => {
    const provider = new StaticProvider();
    const signals1 = await provider.fetchSignals({ mode: "static", monthIndex: 5 });
    const signals2 = await provider.fetchSignals({ mode: "static", monthIndex: 5 });

    expect(signals1.length).toBe(signals2.length);
    expect(signals1.map((s) => s.title)).toEqual(signals2.map((s) => s.title));
    expect(signals1[0].severity).toBe(signals2[0].severity);
  });

  it("produces different signals for different months", async () => {
    const provider = new StaticProvider();
    const signals1 = await provider.fetchSignals({ mode: "static", monthIndex: 0 });
    const signals2 = await provider.fetchSignals({ mode: "static", monthIndex: 6 });

    // At least some signals should differ in severity or direction
    const hasDifference = signals1.some((s, i) => {
      const other = signals2[i];
      return s.severity !== other.severity || s.direction !== other.direction;
    });
    expect(hasDifference).toBe(true);
  });

  it("includes expected signal types", async () => {
    const provider = new StaticProvider();
    const signals = await provider.fetchSignals({ mode: "static", monthIndex: 0 });

    const types = new Set(signals.map((s) => s.signalType));
    expect(types.has("ai")).toBe(true);
    expect(types.has("inflation")).toBe(true);
    expect(types.has("crypto")).toBe(true);
    expect(types.has("funding")).toBe(true);
  });

  it("bounds severity and confidence", async () => {
    const provider = new StaticProvider();
    const signals = await provider.fetchSignals({ mode: "static", monthIndex: 0 });

    for (const signal of signals) {
      expect(signal.severity).toBeGreaterThanOrEqual(1);
      expect(signal.severity).toBeLessThanOrEqual(100);
      expect(signal.confidence).toBeGreaterThanOrEqual(1);
      expect(signal.confidence).toBeLessThanOrEqual(100);
    }
  });
});

describe("normalizer", () => {
  const rawSignal: RawMarketSignal = {
    id: "test-1",
    sourceId: "test-1",
    source: "static",
    title: "AI funding surge in fintech",
    summary: "AI startups in fintech are raising record rounds.",
    publishedAt: new Date(),
    signalType: "ai",
    direction: "positive",
    severity: 80,
    confidence: 70,
    sectors: ["ai", "fintech"],
    regions: ["us", "europe"],
  };

  it("maps sectors from explicit list", () => {
    const normalized = normalizeSignal(rawSignal);
    expect(normalized.mappedSectors).toContain("ai");
    expect(normalized.mappedSectors).toContain("fintech");
  });

  it("bounds severity and confidence", () => {
    const oversized = normalizeSignal({ ...rawSignal, severity: 150, confidence: 200 });
    expect(oversized.severity).toBe(100);
    // static source has confidence cap of 70
    expect(oversized.confidence).toBe(70);

    const undersized = normalizeSignal({ ...rawSignal, severity: -10, confidence: -5 });
    expect(undersized.severity).toBe(1);
    expect(undersized.confidence).toBe(1);
  });

  it("allows uncapped confidence for unknown sources", () => {
    const uncapped = normalizeSignal({ ...rawSignal, source: "custom", confidence: 95 });
    expect(uncapped.confidence).toBe(95);
  });

  it("calculates proposed effects with correct sign", () => {
    const positive = normalizeSignal({ ...rawSignal, direction: "positive", signalType: "ai" });
    expect(positive.proposedEffects.revenueDelta).toBeGreaterThan(0);

    const negative = normalizeSignal({ ...rawSignal, direction: "negative", signalType: "ai" });
    expect(negative.proposedEffects.revenueDelta).toBeLessThan(0);

    const neutral = normalizeSignal({ ...rawSignal, direction: "neutral", signalType: "ai" });
    expect(neutral.proposedEffects.revenueDelta).toBe(0);
  });

  it("deduplicates signals by hash", () => {
    const signals = [normalizeSignal(rawSignal), normalizeSignal(rawSignal)];
    const deduped = deduplicateSignals(signals);
    expect(deduped.length).toBe(1);
  });

  it("maps signal type to macro dimensions", () => {
    const normalized = normalizeSignal(rawSignal);
    expect(normalized.macroDimensions).toContain("aiDemand");
    expect(normalized.macroDimensions).toContain("enterpriseSpending");
  });

  it("produces a stable hash", () => {
    const n1 = normalizeSignal(rawSignal);
    const n2 = normalizeSignal(rawSignal);
    expect(n1.hash).toBe(n2.hash);
  });
});

describe("interpreter", () => {
  it("returns neutral state with no signals", () => {
    const state = interpretSignalsToMarketState([]);
    expect(state.condition).toBe("neutral");
    expect(state.signalCount).toBe(0);
    expect(state.overallConfidence).toBe(0);
  });

  it("aggregates positive signals into bullish condition", () => {
    const signals = [
      normalizeSignal({
        id: "p1", sourceId: "p1", source: "static", title: "AI Boom", summary: "", publishedAt: new Date(),
        signalType: "ai", direction: "positive", severity: 90, confidence: 80, sectors: ["ai"], regions: ["global"],
      }),
      normalizeSignal({
        id: "p2", sourceId: "p2", source: "static", title: "VC Surge", summary: "", publishedAt: new Date(),
        signalType: "funding", direction: "positive", severity: 85, confidence: 75, sectors: ["saas"], regions: ["global"],
      }),
    ];
    const state = interpretSignalsToMarketState(signals);
    expect(state.condition).toBe("bullish");
    expect(state.macroScores.aiDemand).toBeGreaterThan(0);
    expect(state.macroScores.vcClimate).toBeGreaterThan(0);
  });

  it("aggregates negative signals into bearish condition", () => {
    const signals = [
      normalizeSignal({
        id: "n1", sourceId: "n1", source: "static", title: "Recession", summary: "", publishedAt: new Date(),
        signalType: "macro", direction: "negative", severity: 90, confidence: 80, sectors: ["b2c"], regions: ["global"],
      }),
      normalizeSignal({
        id: "n2", sourceId: "n2", source: "static", title: "Rate Hike", summary: "", publishedAt: new Date(),
        signalType: "inflation", direction: "negative", severity: 85, confidence: 75, sectors: ["fintech"], regions: ["global"],
      }),
    ];
    const state = interpretSignalsToMarketState(signals);
    expect(state.condition).toBe("bearish");
  });

  it("moderates conflicting signals", () => {
    const signals = [
      normalizeSignal({
        id: "c1", sourceId: "c1", source: "static", title: "AI Boom", summary: "", publishedAt: new Date(),
        signalType: "ai", direction: "positive", severity: 80, confidence: 70, sectors: ["ai"], regions: ["global"],
      }),
      normalizeSignal({
        id: "c2", sourceId: "c2", source: "static", title: "AI Crash", summary: "", publishedAt: new Date(),
        signalType: "ai", direction: "negative", severity: 80, confidence: 70, sectors: ["ai"], regions: ["global"],
      }),
    ];
    const state = interpretSignalsToMarketState(signals);
    // Conflicting signals of equal weight should moderate toward neutral
    expect(Math.abs(state.macroScores.aiDemand)).toBeLessThan(40);
  });

  it("bounds macro scores", () => {
    const signals = Array.from({ length: 20 }, (_, i) =>
      normalizeSignal({
        id: `e${i}`, sourceId: `e${i}`, source: "static", title: "Extreme", summary: "", publishedAt: new Date(),
        signalType: "ai", direction: "positive", severity: 100, confidence: 100, sectors: ["ai"], regions: ["global"],
      })
    );
    const state = interpretSignalsToMarketState(signals);
    for (const score of Object.values(state.macroScores)) {
      expect(Math.abs(score)).toBeLessThanOrEqual(80);
    }
  });

  it("produces sector modifiers", () => {
    const signals = [
      normalizeSignal({
        id: "s1", sourceId: "s1", source: "static", title: "SaaS Boom", summary: "", publishedAt: new Date(),
        signalType: "enterprise", direction: "positive", severity: 80, confidence: 80, sectors: ["saas"], regions: ["global"],
      }),
    ];
    const state = interpretSignalsToMarketState(signals);
    expect(Object.keys(state.sectorModifiers)).toContain("saas");
    expect(state.sectorModifiers.saas.revenueDelta).toBeGreaterThan(0);
  });

  it("includes top signals", () => {
    const signals = Array.from({ length: 10 }, (_, i) =>
      normalizeSignal({
        id: `t${i}`, sourceId: `t${i}`, source: "static", title: `Signal ${i}`, summary: "", publishedAt: new Date(),
        signalType: "ai", direction: "positive", severity: 50 + i * 5, confidence: 60, sectors: ["ai"], regions: ["global"],
      })
    );
    const state = interpretSignalsToMarketState(signals);
    expect(state.topSignals.length).toBeLessThanOrEqual(5);
    expect(state.topSignals[0].severity).toBeGreaterThanOrEqual(state.topSignals[1]?.severity ?? 0);
  });
});
