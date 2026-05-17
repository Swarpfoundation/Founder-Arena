import { describe, it, expect } from "vitest";
import {
  selectBoardroomTrigger,
  generateBoardroomEvent,
  applyTriggerToState,
  resolveBoardroomEvent,
  checkResponseRequirements,
  applyBoardroomEffectsToState,
  parseBoardroomState,
} from "@/lib/boardroom/boardroom-engine";
import {
  BOARDROOM_EVENT_TEMPLATES,
  getTemplateByPressureType,
  instantiateTemplate,
} from "@/lib/boardroom/boardroom-catalog";
import {
  buildBoardroomTriggerFeedItem,
  buildBoardroomResolutionFeedItem,
} from "@/lib/boardroom/boardroom-feed";
import { DEFAULT_BOARDROOM_STATE } from "@/lib/boardroom/types";
import type {
  BoardroomState,
  BoardroomTriggerContext,
  BoardroomEffect,
} from "@/lib/boardroom/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseState: BoardroomState = {
  ...DEFAULT_BOARDROOM_STATE,
};

function makeCtx(overrides: Partial<BoardroomTriggerContext> = {}): BoardroomTriggerContext {
  return {
    startupId: "startup-test-abc",
    startupName: "TestCo",
    sector: "SaaS",
    month: 5,
    cash: 80000,
    monthlyBurn: 5000,   // 5000 < 3×revenue(3000)=9000 — no burn_rate trigger
    revenue: 3000,
    productProgress: 55,
    investorScore: 55,
    riskScore: 40,
    brandRisk: 20,
    rivalryMaxScore: 30,
    runwayMonths: 6,
    dominantPlaystyle: null,
    currentState: baseState,
    ...overrides,
  };
}

// ─── selectBoardroomTrigger ───────────────────────────────────────────────────

describe("selectBoardroomTrigger", () => {
  it("returns null when no trigger conditions met", () => {
    const ctx = makeCtx();
    expect(selectBoardroomTrigger(ctx)).toBeNull();
  });

  it("returns null when event is already open", () => {
    const openEvent = generateBoardroomEvent(makeCtx({ month: 2 }), "investor_conflict");
    const state = applyTriggerToState(baseState, openEvent);
    const ctx = makeCtx({
      investorScore: 20,
      currentState: state,
    });
    expect(selectBoardroomTrigger(ctx)).toBeNull();
  });

  it("returns null when cooldown is active", () => {
    const state: BoardroomState = {
      ...baseState,
      lastTriggeredMonth: 4,
      currentOpenEvent: null,
    };
    const ctx = makeCtx({
      investorScore: 20,
      currentState: state,
    });
    // month 5, lastTriggered 4 — too soon (< 2 month gap)
    expect(selectBoardroomTrigger(ctx)).toBeNull();
  });

  it("triggers runway_crisis when runway ≤ 2", () => {
    const ctx = makeCtx({ runwayMonths: 2 });
    expect(selectBoardroomTrigger(ctx)).toBe("runway_crisis");
  });

  it("triggers compliance_risk when riskScore ≥ 85", () => {
    const ctx = makeCtx({ riskScore: 85, month: 3 });
    expect(selectBoardroomTrigger(ctx)).toBe("compliance_risk");
  });

  it("triggers investor_conflict when investorScore ≤ 35", () => {
    const ctx = makeCtx({ investorScore: 30, month: 3 });
    expect(selectBoardroomTrigger(ctx)).toBe("investor_conflict");
  });

  it("triggers brand_risk when brandRisk ≥ 70", () => {
    const ctx = makeCtx({ brandRisk: 75, month: 3 });
    expect(selectBoardroomTrigger(ctx)).toBe("brand_risk");
  });

  it("triggers revenue_miss when revenue = 0 after month 6", () => {
    const ctx = makeCtx({ revenue: 0, month: 6 });
    expect(selectBoardroomTrigger(ctx)).toBe("revenue_miss");
  });

  it("does not trigger revenue_miss before month 6", () => {
    const ctx = makeCtx({ revenue: 0, month: 5 });
    expect(selectBoardroomTrigger(ctx)).toBeNull();
  });

  it("triggers burn_rate when burn > 3x revenue after month 4", () => {
    const ctx = makeCtx({
      monthlyBurn: 15000,
      revenue: 2000, // 15000 > 3 * 2000 = 6000 ✓
      month: 5,
    });
    expect(selectBoardroomTrigger(ctx)).toBe("burn_rate");
  });

  it("does not trigger burn_rate when revenue is 0", () => {
    const ctx = makeCtx({
      monthlyBurn: 15000,
      revenue: 0,
      month: 5,
    });
    // revenue = 0 fails the revenue > 0 check
    expect(selectBoardroomTrigger(ctx)).toBeNull();
  });

  it("triggers product_delay when productProgress < 40 after month 6", () => {
    // revenue high enough that burn_rate doesn't fire (burn > 3x revenue would be 12000 > 30000 = false)
    const ctx = makeCtx({ productProgress: 35, month: 6, revenue: 10000 });
    expect(selectBoardroomTrigger(ctx)).toBe("product_delay");
  });

  it("triggers rival_pressure when rivalryMaxScore ≥ 70", () => {
    // revenue high enough to prevent burn_rate from firing
    const ctx = makeCtx({ rivalryMaxScore: 75, month: 4, revenue: 10000 });
    expect(selectBoardroomTrigger(ctx)).toBe("rival_pressure");
  });

  it("runway_crisis takes priority over investor_conflict", () => {
    const ctx = makeCtx({
      runwayMonths: 1,
      investorScore: 20,
    });
    expect(selectBoardroomTrigger(ctx)).toBe("runway_crisis");
  });

  it("skips already-resolved pressure types", () => {
    const resolvedEvent = generateBoardroomEvent(makeCtx({ month: 2 }), "runway_crisis");
    const resolvedEventDone: typeof resolvedEvent = {
      ...resolvedEvent,
      resolved: true,
      resolvedMonth: 2,
    };
    const stateWithHistory: BoardroomState = {
      ...baseState,
      eventHistory: [resolvedEventDone],
      lastTriggeredMonth: 2,
    };
    const ctx = makeCtx({
      runwayMonths: 1,
      month: 5,
      currentState: stateWithHistory,
    });
    // runway_crisis already in history — should skip to compliance_risk or investor etc
    const trigger = selectBoardroomTrigger(ctx);
    expect(trigger).not.toBe("runway_crisis");
  });
});

// ─── generateBoardroomEvent ───────────────────────────────────────────────────

describe("generateBoardroomEvent", () => {
  it("generates a valid runway_crisis event", () => {
    const ctx = makeCtx({ runwayMonths: 2 });
    const event = generateBoardroomEvent(ctx, "runway_crisis");
    expect(event.pressureType).toBe("runway_crisis");
    expect(event.severity).toBe("critical");
    expect(event.title).toBe("Emergency Runway Meeting");
    expect(event.responseOptions.length).toBeGreaterThanOrEqual(3);
    expect(event.resolved).toBe(false);
    expect(event.startupId).toBe("startup-test-abc");
  });

  it("injects startup name into concern text", () => {
    const ctx = makeCtx({ startupName: "NovaCorp" });
    const event = generateBoardroomEvent(ctx, "burn_rate");
    expect(event.contextSummary).toContain("NovaCorp");
  });

  it("injects month number into context", () => {
    const ctx = makeCtx({ month: 8 });
    const event = generateBoardroomEvent(ctx, "revenue_miss");
    expect(event.concern).toContain("8");
  });

  it("generates deterministic IDs for same input", () => {
    const ctx = makeCtx({ month: 5 });
    const e1 = generateBoardroomEvent(ctx, "brand_risk");
    const e2 = generateBoardroomEvent(ctx, "brand_risk");
    expect(e1.id).toBe(e2.id);
  });

  it("generates different IDs for different months", () => {
    const ctx1 = makeCtx({ month: 4 });
    const ctx2 = makeCtx({ month: 6 });
    const e1 = generateBoardroomEvent(ctx1, "brand_risk");
    const e2 = generateBoardroomEvent(ctx2, "brand_risk");
    expect(e1.id).not.toBe(e2.id);
  });

  it("throws for unknown pressure type", () => {
    const ctx = makeCtx();
    expect(() => generateBoardroomEvent(ctx, "nonexistent_type")).toThrow();
  });
});

// ─── applyTriggerToState ──────────────────────────────────────────────────────

describe("applyTriggerToState", () => {
  it("sets currentOpenEvent", () => {
    const ctx = makeCtx();
    const event = generateBoardroomEvent(ctx, "runway_crisis");
    const state = applyTriggerToState(baseState, event);
    expect(state.currentOpenEvent).not.toBeNull();
    expect(state.currentOpenEvent?.pressureType).toBe("runway_crisis");
  });

  it("sets lastTriggeredMonth", () => {
    const ctx = makeCtx({ month: 7 });
    const event = generateBoardroomEvent(ctx, "runway_crisis");
    const state = applyTriggerToState(baseState, event);
    expect(state.lastTriggeredMonth).toBe(7);
  });

  it("increases pressureLevel", () => {
    const ctx = makeCtx();
    const event = generateBoardroomEvent(ctx, "runway_crisis");
    const state = applyTriggerToState(baseState, event);
    expect(state.pressureLevel).toBeGreaterThan(baseState.pressureLevel);
  });
});

// ─── checkResponseRequirements ────────────────────────────────────────────────

describe("checkResponseRequirements", () => {
  it("returns available for option with no requirements", () => {
    const ctx = makeCtx();
    const event = generateBoardroomEvent(ctx, "runway_crisis");
    const noReqOption = event.responseOptions.find((o) => !o.requirements);
    if (!noReqOption) return; // skip if all have requirements
    const result = checkResponseRequirements(noReqOption, {
      cash: 0, revenue: 0, productProgress: 0, investorScore: 0, boardConfidence: 0, monthlyBurn: 0,
    });
    expect(result.available).toBe(true);
  });

  it("blocks option when minCash not met", () => {
    const option = {
      id: "test",
      title: "test",
      stance: "defensive" as const,
      description: "test",
      requirements: { minCash: 50000 },
      projectedEffects: {},
      risk: "low" as const,
    };
    const result = checkResponseRequirements(option, {
      cash: 20000, revenue: 0, productProgress: 0, investorScore: 0, boardConfidence: 0, monthlyBurn: 0,
    });
    expect(result.available).toBe(false);
    expect(result.reason).toContain("50,000");
  });

  it("passes option when minCash is met", () => {
    const option = {
      id: "test",
      title: "test",
      stance: "defensive" as const,
      description: "test",
      requirements: { minCash: 15000 },
      projectedEffects: {},
      risk: "low" as const,
    };
    const result = checkResponseRequirements(option, {
      cash: 20000, revenue: 0, productProgress: 0, investorScore: 0, boardConfidence: 0, monthlyBurn: 0,
    });
    expect(result.available).toBe(true);
  });

  it("blocks option when minProductProgress not met", () => {
    const option = {
      id: "test",
      title: "test",
      stance: "aggressive" as const,
      description: "test",
      requirements: { minProductProgress: 50 },
      projectedEffects: {},
      risk: "medium" as const,
    };
    const result = checkResponseRequirements(option, {
      cash: 99999, revenue: 0, productProgress: 30, investorScore: 0, boardConfidence: 0, monthlyBurn: 0,
    });
    expect(result.available).toBe(false);
  });

  it("blocks option when minInvestorScore not met", () => {
    const option = {
      id: "test",
      title: "test",
      stance: "aggressive" as const,
      description: "test",
      requirements: { minInvestorScore: 45 },
      projectedEffects: {},
      risk: "medium" as const,
    };
    const result = checkResponseRequirements(option, {
      cash: 0, revenue: 0, productProgress: 0, investorScore: 30, boardConfidence: 0, monthlyBurn: 0,
    });
    expect(result.available).toBe(false);
  });
});

// ─── applyBoardroomEffectsToState ─────────────────────────────────────────────

describe("applyBoardroomEffectsToState", () => {
  it("increases boardConfidence with positive delta", () => {
    const effects: BoardroomEffect = { boardConfidenceDelta: 10 };
    const next = applyBoardroomEffectsToState(baseState, effects);
    expect(next.boardConfidence).toBe(baseState.boardConfidence + 10);
  });

  it("clamps boardConfidence to [0, 100]", () => {
    const effects: BoardroomEffect = { boardConfidenceDelta: 200 };
    const next = applyBoardroomEffectsToState(baseState, effects);
    expect(next.boardConfidence).toBe(100);

    const effects2: BoardroomEffect = { boardConfidenceDelta: -200 };
    const next2 = applyBoardroomEffectsToState(baseState, effects2);
    expect(next2.boardConfidence).toBe(0);
  });

  it("reduces investorPatience with negative delta", () => {
    const effects: BoardroomEffect = { investorPatienceDelta: -15 };
    const next = applyBoardroomEffectsToState(baseState, effects);
    expect(next.investorPatience).toBe(baseState.investorPatience - 15);
  });

  it("preserves unchanged fields", () => {
    const effects: BoardroomEffect = { boardConfidenceDelta: 5 };
    const next = applyBoardroomEffectsToState(baseState, effects);
    expect(next.investorPatience).toBe(baseState.investorPatience);
    expect(next.founderControl).toBe(baseState.founderControl);
    expect(next.eventHistory).toBe(baseState.eventHistory);
  });
});

// ─── resolveBoardroomEvent ────────────────────────────────────────────────────

describe("resolveBoardroomEvent", () => {
  it("marks event as resolved and moves to history", () => {
    const ctx = makeCtx({ month: 5 });
    const event = generateBoardroomEvent(ctx, "runway_crisis");
    const stateWithEvent = applyTriggerToState(baseState, event);

    const firstOption = event.responseOptions[0];
    const result = resolveBoardroomEvent(stateWithEvent, event, firstOption.id, 5);

    expect(result.updatedState.currentOpenEvent).toBeNull();
    expect(result.updatedState.eventHistory.length).toBe(1);
    expect(result.updatedState.eventHistory[0].resolved).toBe(true);
    expect(result.updatedState.eventHistory[0].selectedResponseId).toBe(firstOption.id);
  });

  it("includes outcomeNarrative in result", () => {
    const ctx = makeCtx({ month: 3 });
    const event = generateBoardroomEvent(ctx, "investor_conflict");
    const stateWithEvent = applyTriggerToState(baseState, event);
    const firstOption = event.responseOptions[0];
    const result = resolveBoardroomEvent(stateWithEvent, event, firstOption.id, 3);
    expect(result.outcomeNarrative).toBeTruthy();
    expect(typeof result.outcomeNarrative).toBe("string");
  });

  it("includes applied effects in result", () => {
    const ctx = makeCtx({ month: 3 });
    const event = generateBoardroomEvent(ctx, "brand_risk");
    const stateWithEvent = applyTriggerToState(baseState, event);
    const firstOption = event.responseOptions[0];
    const result = resolveBoardroomEvent(stateWithEvent, event, firstOption.id, 3);
    expect(result.appliedEffects).toBeTruthy();
    expect(typeof result.appliedEffects).toBe("object");
  });

  it("throws for unknown response id", () => {
    const ctx = makeCtx({ month: 5 });
    const event = generateBoardroomEvent(ctx, "burn_rate");
    const stateWithEvent = applyTriggerToState(baseState, event);
    expect(() =>
      resolveBoardroomEvent(stateWithEvent, event, "nonexistent_response", 5)
    ).toThrow();
  });

  it("provides a feed title in result", () => {
    const ctx = makeCtx({ month: 4 });
    const event = generateBoardroomEvent(ctx, "burn_rate");
    const stateWithEvent = applyTriggerToState(baseState, event);
    const firstOption = event.responseOptions[0];
    const result = resolveBoardroomEvent(stateWithEvent, event, firstOption.id, 4);
    expect(result.feedTitle).toContain("Boardroom");
  });

  it("limits event history to 20 events", () => {
    const oldEvents = Array.from({ length: 20 }, (_, i) => ({
      ...generateBoardroomEvent(makeCtx({ month: i + 1 }), "burn_rate"),
      resolved: true,
    }));
    const stateWithHistory: BoardroomState = {
      ...baseState,
      eventHistory: oldEvents,
      currentOpenEvent: null,
    };

    const ctx = makeCtx({ month: 21 });
    const newEvent = generateBoardroomEvent(ctx, "brand_risk");
    const stateWithNewEvent = applyTriggerToState(stateWithHistory, newEvent);
    const firstOption = newEvent.responseOptions[0];
    const result = resolveBoardroomEvent(
      stateWithNewEvent,
      newEvent,
      firstOption.id,
      21
    );
    expect(result.updatedState.eventHistory.length).toBeLessThanOrEqual(20);
  });
});

// ─── parseBoardroomState ──────────────────────────────────────────────────────

describe("parseBoardroomState", () => {
  it("returns DEFAULT_BOARDROOM_STATE for null input", () => {
    const result = parseBoardroomState(null);
    expect(result.boardConfidence).toBe(60);
    expect(result.investorPatience).toBe(70);
    expect(result.founderControl).toBe(80);
    expect(result.currentOpenEvent).toBeNull();
    expect(result.eventHistory).toEqual([]);
  });

  it("returns DEFAULT_BOARDROOM_STATE for empty object", () => {
    const result = parseBoardroomState({});
    expect(result.boardConfidence).toBe(60);
    expect(result.pressureLevel).toBe(0);
    expect(result.lastTriggeredMonth).toBeNull();
  });

  it("returns DEFAULT_BOARDROOM_STATE for array input", () => {
    const result = parseBoardroomState([]);
    expect(result.boardConfidence).toBe(60);
  });

  it("parses valid state correctly", () => {
    const raw = {
      boardConfidence: 45,
      investorPatience: 55,
      founderControl: 70,
      pressureLevel: 25,
      currentOpenEvent: null,
      eventHistory: [],
      lastTriggeredMonth: 5,
    };
    const result = parseBoardroomState(raw);
    expect(result.boardConfidence).toBe(45);
    expect(result.investorPatience).toBe(55);
    expect(result.lastTriggeredMonth).toBe(5);
  });
});

// ─── BOARDROOM_EVENT_TEMPLATES ────────────────────────────────────────────────

describe("BOARDROOM_EVENT_TEMPLATES", () => {
  it("has at least 8 templates", () => {
    expect(BOARDROOM_EVENT_TEMPLATES.length).toBeGreaterThanOrEqual(8);
  });

  it("each template has at least 3 response options", () => {
    for (const template of BOARDROOM_EVENT_TEMPLATES) {
      expect(template.responseOptions.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("each response option has required fields", () => {
    for (const template of BOARDROOM_EVENT_TEMPLATES) {
      for (const opt of template.responseOptions) {
        expect(opt.id).toBeTruthy();
        expect(opt.title).toBeTruthy();
        expect(opt.description).toBeTruthy();
        expect(["low", "medium", "high"]).toContain(opt.risk);
        expect(opt.projectedEffects).toBeTruthy();
      }
    }
  });

  it("getTemplateByPressureType returns correct template", () => {
    const tmpl = getTemplateByPressureType("runway_crisis");
    expect(tmpl).toBeTruthy();
    expect(tmpl?.pressureType).toBe("runway_crisis");
  });

  it("getTemplateByPressureType returns undefined for unknown type", () => {
    const tmpl = getTemplateByPressureType("nonexistent");
    expect(tmpl).toBeUndefined();
  });
});

// ─── instantiateTemplate ─────────────────────────────────────────────────────

describe("instantiateTemplate", () => {
  it("replaces {name} token", () => {
    const tmpl = getTemplateByPressureType("runway_crisis")!;
    const ctx = makeCtx({ startupName: "RocketCo" });
    const event = instantiateTemplate(tmpl, ctx);
    expect(event.contextSummary).toContain("RocketCo");
  });

  it("replaces {month} token", () => {
    const tmpl = getTemplateByPressureType("burn_rate")!;
    const ctx = makeCtx({ month: 7 });
    const event = instantiateTemplate(tmpl, ctx);
    expect(event.contextSummary).toContain("7");
  });

  it("produces same output for same input", () => {
    const tmpl = getTemplateByPressureType("brand_risk")!;
    const ctx = makeCtx({ startupName: "AlphaStartup", brandRisk: 75 });
    const e1 = instantiateTemplate(tmpl, ctx);
    const e2 = instantiateTemplate(tmpl, ctx);
    expect(e1.concern).toBe(e2.concern);
    expect(e1.title).toBe(e2.title);
  });
});

// ─── buildBoardroomTriggerFeedItem ────────────────────────────────────────────

describe("buildBoardroomTriggerFeedItem", () => {
  it("creates feed item with BOARD ALERT prefix", () => {
    const ctx = makeCtx({ month: 5 });
    const event = generateBoardroomEvent(ctx, "runway_crisis");
    const feed = buildBoardroomTriggerFeedItem(event);
    expect(feed.title).toContain("BOARD ALERT");
    expect(feed.category).toBe("boardroom");
    expect(feed.source).toBe("boardroom");
    expect(feed.severity).toBe("critical");
  });

  it("uses correct severity for investor_conflict", () => {
    const ctx = makeCtx({ month: 3 });
    const event = generateBoardroomEvent(ctx, "investor_conflict");
    const feed = buildBoardroomTriggerFeedItem(event);
    expect(feed.severity).toBe("critical");
  });

  it("uses correct severity for product_delay", () => {
    const ctx = makeCtx({ month: 7 });
    const event = generateBoardroomEvent(ctx, "product_delay");
    const feed = buildBoardroomTriggerFeedItem(event);
    expect(feed.severity).toBe("neutral");
  });
});

// ─── buildBoardroomResolutionFeedItem ─────────────────────────────────────────

describe("buildBoardroomResolutionFeedItem", () => {
  it("creates resolved feed item", () => {
    const ctx = makeCtx({ month: 5 });
    const event = generateBoardroomEvent(ctx, "burn_rate");
    const firstOpt = event.responseOptions[0];
    const feed = buildBoardroomResolutionFeedItem(
      event,
      firstOpt.title,
      "Cost audit complete.",
      firstOpt.projectedEffects,
      5
    );
    expect(feed.title).toContain("Resolved");
    expect(feed.body).toContain(firstOpt.title);
    expect(feed.month).toBe(5);
    expect(feed.category).toBe("boardroom");
  });

  it("severity is positive when effects have positive investorScoreDelta", () => {
    const ctx = makeCtx({ month: 3 });
    const event = generateBoardroomEvent(ctx, "investor_conflict");
    const effects: BoardroomEffect = { investorScoreDelta: 12 };
    const feed = buildBoardroomResolutionFeedItem(event, "Data Defense", "Good.", effects, 3);
    expect(feed.severity).toBe("positive");
  });

  it("severity is warning when effects have high riskScoreDelta", () => {
    const ctx = makeCtx({ month: 4 });
    const event = generateBoardroomEvent(ctx, "brand_risk");
    const effects: BoardroomEffect = { riskScoreDelta: 8 };
    const feed = buildBoardroomResolutionFeedItem(event, "Double Down", "Risky.", effects, 4);
    expect(feed.severity).toBe("warning");
  });
});

// ─── Determinism ─────────────────────────────────────────────────────────────

describe("boardroom determinism", () => {
  it("same ctx always produces same event id", () => {
    const ctx = makeCtx({ startupId: "fixed-id-001", month: 6 });
    const e1 = generateBoardroomEvent(ctx, "burn_rate");
    const e2 = generateBoardroomEvent(ctx, "burn_rate");
    expect(e1.id).toBe(e2.id);
  });

  it("different startupIds produce different event ids", () => {
    const ctx1 = makeCtx({ startupId: "abc", month: 5 });
    const ctx2 = makeCtx({ startupId: "xyz", month: 5 });
    const e1 = generateBoardroomEvent(ctx1, "brand_risk");
    const e2 = generateBoardroomEvent(ctx2, "brand_risk");
    expect(e1.id).not.toBe(e2.id);
  });

  it("trigger selection is deterministic for same ctx", () => {
    const ctx = makeCtx({ runwayMonths: 1 });
    const t1 = selectBoardroomTrigger(ctx);
    const t2 = selectBoardroomTrigger(ctx);
    expect(t1).toBe(t2);
  });
});
