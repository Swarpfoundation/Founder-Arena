import { describe, it, expect } from "vitest";
import {
  mulberry32,
  hashString,
  EventStateContext,
  EventEffect,
} from "@/lib/events/types";
import { EVENT_LIBRARY, getEventById } from "@/lib/events/event-library";
import {
  getEligibleEvents,
  getAvailableChoices,
  selectMonthlyEvent,
  previewChoiceEffects,
  isClutchChoice,
  getAdjustedEventChance,
  MAX_EVENTS_PER_RUN,
  MAX_CRITICAL_EVENTS_PER_RUN,
} from "@/lib/events/event-selection";
import {
  applyEventEffects,
  calculateEventCrisisBonus,
  calculateEventDifficultyScore,
} from "@/lib/events/event-effects";
import {
  validateEventChoice,
  resolveEventChoice,
  resolvedEventToJson,
  resolvedEventFromJson,
} from "@/lib/events/event-engine";

describe("Event Types / Utilities", () => {
  it("hashString produces consistent results", () => {
    expect(hashString("abc")).toBe(hashString("abc"));
    expect(hashString("abc")).not.toBe(hashString("def"));
  });

  it("mulberry32 is deterministic for same seed", () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("mulberry32 returns values in [0, 1)", () => {
    const rng = mulberry32(999);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("Event Library", () => {
  it("has at least 25 events", () => {
    expect(EVENT_LIBRARY.length).toBeGreaterThanOrEqual(25);
  });

  it("covers all 11 categories", () => {
    const categories = new Set(EVENT_LIBRARY.map((e) => e.category));
    expect(categories.size).toBe(11);
  });

  it("every event has at least 2 choices", () => {
    for (const ev of EVENT_LIBRARY) {
      expect(ev.choices.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every event has a unique id", () => {
    const ids = EVENT_LIBRARY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getEventById finds existing events", () => {
    expect(getEventById("market_correction")?.category).toBe("market");
    expect(getEventById("data_breach_scare")?.category).toBe("security");
    expect(getEventById("nonexistent")).toBeUndefined();
  });

  it("critical events have significant but bounded effects", () => {
    const critical = EVENT_LIBRARY.filter((e) => e.severity === "critical");
    expect(critical.length).toBeGreaterThanOrEqual(3);
    for (const ev of critical) {
      for (const c of ev.choices) {
        const eff = c.effects;
        // No single choice should instantly kill a startup
        expect(Math.abs(eff.cashDelta ?? 0)).toBeLessThanOrEqual(50000);
        expect(Math.abs(eff.burnDelta ?? 0)).toBeLessThanOrEqual(20000);
        expect(Math.abs(eff.riskDelta ?? 0)).toBeLessThanOrEqual(10);
      }
    }
  });
});

describe("Event Selection / Eligibility", () => {
  function makeCtx(overrides: Partial<EventStateContext> = {}): EventStateContext {
    return {
      startupId: "test-startup",
      monthNumber: 5,
      cash: 200000,
      monthlyBurn: 30000,
      revenue: 15000,
      productProgress: 40,
      investorScore: 60,
      marketScore: 55,
      riskScore: 40,
      employeeCount: 3,
      sector: "SaaS",
      eventsTriggered: [],
      ...overrides,
    };
  }

  it("getEligibleEvents filters by month", () => {
    const ctx = makeCtx({ monthNumber: 1 });
    const eligible = getEligibleEvents(ctx);
    // Events with minMonth > 1 should not appear
    expect(eligible.some((e) => e.id === "market_correction")).toBe(false);
    expect(eligible.some((e) => e.id === "phishing_attempt")).toBe(true);
  });

  it("getEligibleEvents respects oncePerRun", () => {
    const ctx = makeCtx({ eventsTriggered: ["market_correction"] });
    const eligible = getEligibleEvents(ctx);
    expect(eligible.some((e) => e.id === "market_correction")).toBe(false);
  });

  it("getEligibleEvents enforces max critical events", () => {
    const criticalIds = EVENT_LIBRARY.filter((e) => e.severity === "critical").map((e) => e.id);
    const ctx = makeCtx({ eventsTriggered: criticalIds.slice(0, MAX_CRITICAL_EVENTS_PER_RUN) });
    const eligible = getEligibleEvents(ctx);
    expect(eligible.some((e) => e.severity === "critical")).toBe(false);
  });

  it("getEligibleEvents enforces max total events", () => {
    const ctx = makeCtx({ eventsTriggered: EVENT_LIBRARY.slice(0, MAX_EVENTS_PER_RUN).map((e) => e.id) });
    const eligible = getEligibleEvents(ctx);
    expect(eligible.length).toBe(0);
  });

  it("getAvailableChoices filters by cash requirement", () => {
    const event = getEventById("market_correction")!;
    const ctx = makeCtx({ cash: 5000 });
    const choices = getAvailableChoices(event, ctx);
    expect(choices.some((c) => c.id === "double_down")).toBe(false);
  });

  it("selectMonthlyEvent is deterministic for same inputs", () => {
    const ctx = makeCtx();
    const first = selectMonthlyEvent(ctx);
    const second = selectMonthlyEvent(ctx);
    // Same seed = same result
    expect(first?.id ?? null).toBe(second?.id ?? null);
  });

  it("selectMonthlyEvent can return null", () => {
    // Use a seed that will produce a roll above the chance threshold
    // We can't control this directly, but over many runs with different seeds
    // we should see some nulls
    let nullCount = 0;
    for (let i = 0; i < 50; i++) {
      const ctx = makeCtx({ startupId: `startup-${i}` });
      if (selectMonthlyEvent(ctx) === null) nullCount++;
    }
    expect(nullCount).toBeGreaterThan(0);
  });

  it("getAdjustedEventChance is bounded", () => {
    const lowRisk = getAdjustedEventChance(makeCtx({ riskScore: 0, cash: 1000000, monthlyBurn: 1000 }));
    const highRisk = getAdjustedEventChance(makeCtx({ riskScore: 90, cash: 1000, monthlyBurn: 10000 }));
    expect(lowRisk).toBeGreaterThanOrEqual(0.15);
    expect(highRisk).toBeLessThanOrEqual(0.6);
    expect(highRisk).toBeGreaterThan(lowRisk);
  });
});

describe("Event Effects", () => {
  it("applyEventEffects adds deltas correctly", () => {
    const base = {
      totalCashCost: 10000,
      eventCashDelta: 0,
      burnDelta: 5000,
      revenueDelta: 2000,
      productDelta: 5,
      investorDelta: 2,
      marketDelta: 1,
      riskDelta: 3,
      valuation: 2000000,
      revenueMultiplier: 1,
      burnMultiplier: 1,
      valuationMultiplier: 1,
    };
    const effect: EventEffect = {
      cashDelta: -5000,
      burnDelta: 3000,
      revenueDelta: 4000,
      productDelta: 8,
      investorDelta: -1,
      riskDelta: -2,
    };
    const result = applyEventEffects(base, effect);
    expect(result.totalCashCost).toBe(10000);
    expect(result.eventCashDelta).toBe(-5000);
    expect(result.burnDelta).toBe(8000);
    expect(result.revenueDelta).toBe(6000);
    expect(result.productDelta).toBe(13);
    expect(result.investorDelta).toBe(1);
    expect(result.riskDelta).toBe(1);
  });

  it("applyEventEffects clamps multipliers", () => {
    const base = {
      totalCashCost: 0,
      eventCashDelta: 0,
      burnDelta: 0,
      revenueDelta: 0,
      productDelta: 0,
      investorDelta: 0,
      marketDelta: 0,
      riskDelta: 0,
      valuation: 1000000,
      revenueMultiplier: 1,
      burnMultiplier: 1,
      valuationMultiplier: 1,
    };
    const result = applyEventEffects(base, { revenueMultiplier: 5, burnMultiplier: 0.1, valuationMultiplier: 5 });
    expect(result.revenueMultiplier).toBe(1.5);
    expect(result.burnMultiplier).toBe(0.8);
    expect(result.valuationMultiplier).toBe(1.3);
  });

  it("calculateEventCrisisBonus is capped at 25", () => {
    const events = Array.from({ length: 20 }, () => ({
      severity: "critical" as const,
      choiceEffects: { cashDelta: -30000, riskDelta: 5 } as EventEffect,
    }));
    expect(calculateEventCrisisBonus(events)).toBe(25);
  });

  it("calculateEventDifficultyScore returns correct values", () => {
    expect(calculateEventDifficultyScore("critical")).toBe(75);
    expect(calculateEventDifficultyScore("moderate")).toBe(50);
    expect(calculateEventDifficultyScore("minor")).toBe(25);
  });
});

describe("Event Engine", () => {
  function makeCtx(overrides: Partial<EventStateContext> = {}): EventStateContext {
    return {
      startupId: "test-startup",
      monthNumber: 5,
      cash: 200000,
      monthlyBurn: 30000,
      revenue: 15000,
      productProgress: 40,
      investorScore: 60,
      marketScore: 55,
      riskScore: 40,
      employeeCount: 3,
      sector: "SaaS",
      eventsTriggered: [],
      ...overrides,
    };
  }

  it("validateEventChoice rejects invalid event id", () => {
    const result = validateEventChoice("fake", "choice", makeCtx());
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not found");
  });

  it("validateEventChoice rejects invalid choice id", () => {
    const result = validateEventChoice("market_correction", "fake_choice", makeCtx());
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Choice not found");
  });

  it("validateEventChoice rejects unavailable choice due to cash", () => {
    const result = validateEventChoice("market_correction", "double_down", makeCtx({ cash: 5000 }));
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not available");
  });

  it("validateEventChoice accepts valid choice", () => {
    const result = validateEventChoice("market_correction", "conserve_cash", makeCtx());
    expect(result.valid).toBe(true);
  });

  it("resolveEventChoice produces correct structure", () => {
    const event = getEventById("phishing_attempt")!;
    const choice = event.choices[0];
    const resolved = resolveEventChoice(event, choice, "AI narrative", "AI coaching");
    expect(resolved.eventId).toBe("phishing_attempt");
    expect(resolved.selectedChoiceId).toBe(choice.id);
    expect(resolved.aiNarrative).toBe("AI narrative");
    expect(resolved.aiCoaching).toBe("AI coaching");
  });

  it("resolvedEventToJson and resolvedEventFromJson are symmetrical", () => {
    const event = getEventById("phishing_attempt")!;
    const choice = event.choices[0];
    const resolved = resolveEventChoice(event, choice);
    const json = resolvedEventToJson(resolved);
    const back = resolvedEventFromJson(json);
    expect(back).not.toBeNull();
    expect(back!.eventId).toBe("phishing_attempt");
    expect(back!.selectedChoiceId).toBe(choice.id);
  });

  it("resolvedEventFromJson returns null for invalid input", () => {
    expect(resolvedEventFromJson({})).toBeNull();
    expect(resolvedEventFromJson({ eventId: "x" })).toBeNull();
  });
});

describe("Event Choice Utilities", () => {
  it("previewChoiceEffects formats correctly", () => {
    const choice = {
      id: "test",
      label: "Test",
      description: "Test choice",
      effects: { cashDelta: -10000, productDelta: 5, riskDelta: -3 },
    };
    const preview = previewChoiceEffects(choice);
    expect(preview).toContain("Cash $-10,000");
    expect(preview).toContain("Product +5");
    expect(preview).toContain("Risk -3");
  });

  it("previewChoiceEffects handles empty effects", () => {
    const choice = { id: "test", label: "Test", description: "Test choice", effects: {} };
    expect(previewChoiceEffects(choice)).toBe("No direct effect");
  });

  it("isClutchChoice identifies high-risk high-reward choices", () => {
    expect(isClutchChoice("critical", { cashDelta: -25000, revenueDelta: 10000 })).toBe(true);
    expect(isClutchChoice("critical", { riskDelta: 5, investorDelta: 5 })).toBe(true);
    expect(isClutchChoice("moderate", { cashDelta: -25000, revenueDelta: 10000 })).toBe(false);
    expect(isClutchChoice("critical", { cashDelta: -1000 })).toBe(false);
  });
});

describe("Event Integration with Simulation Engine", () => {
  it("simulateMonth accepts eventEffect parameter", async () => {
    const { simulateMonth } = await import("@/lib/simulation/engine");
    const state = {
      cash: 500000,
      monthlyBurn: 25000,
      revenue: 10000,
      valuation: 2000000,
      productProgress: 30,
      investorScore: 60,
      marketScore: 55,
      riskScore: 40,
    };
    const decisions: Parameters<typeof simulateMonth>[1] = [];
    const withoutEvent = simulateMonth(state, decisions, null, "SaaS", [], "remote", undefined, 1, undefined);
    const withEvent = simulateMonth(state, decisions, null, "SaaS", [], "remote", undefined, 1, {
      cashDelta: -20000,
      revenueDelta: 5000,
    });
    expect(withEvent.cashEnd).toBe(withoutEvent.cashEnd - 20000 + 5000); // event costs 20k but adds 5k revenue
  });
});
