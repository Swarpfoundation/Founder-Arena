import type {
  BoardroomState,
  BoardroomEvent,
  BoardroomEffect,
  BoardroomPressureType,
  BoardroomTriggerContext,
  BoardroomResponseOption,
  ResolveBoardroomResult,
} from "./types";
import { DEFAULT_BOARDROOM_STATE } from "./types";
import {
  BOARDROOM_EVENT_TEMPLATES,
  instantiateTemplate,
} from "./boardroom-catalog";

// ─── Deterministic Seed ───────────────────────────────────────────────────────

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash;
}

// ─── Trigger Guard ────────────────────────────────────────────────────────────

const MIN_MONTHS_BETWEEN_EVENTS = 2;

function canTrigger(ctx: BoardroomTriggerContext): boolean {
  if (ctx.currentState.currentOpenEvent !== null) return false;
  const last = ctx.currentState.lastTriggeredMonth;
  if (last !== null && ctx.month - last < MIN_MONTHS_BETWEEN_EVENTS) return false;
  return true;
}

// ─── Trigger Checks (ordered by priority) ────────────────────────────────────

interface TriggerCheck {
  pressureType: BoardroomPressureType;
  passes: (ctx: BoardroomTriggerContext) => boolean;
}

const TRIGGER_CHECKS: TriggerCheck[] = [
  {
    pressureType: "runway_crisis",
    passes: (ctx) => ctx.runwayMonths <= 2 && ctx.month >= 2,
  },
  {
    pressureType: "compliance_risk",
    passes: (ctx) => ctx.riskScore >= 85 && ctx.month >= 3,
  },
  {
    pressureType: "investor_conflict",
    passes: (ctx) => ctx.investorScore <= 35 && ctx.month >= 2,
  },
  {
    pressureType: "brand_risk",
    passes: (ctx) => ctx.brandRisk >= 70 && ctx.month >= 2,
  },
  {
    pressureType: "revenue_miss",
    passes: (ctx) => ctx.revenue === 0 && ctx.month >= 6,
  },
  {
    pressureType: "burn_rate",
    passes: (ctx) =>
      ctx.month >= 4 &&
      ctx.monthlyBurn > 0 &&
      ctx.revenue > 0 &&
      ctx.monthlyBurn > ctx.revenue * 3,
  },
  {
    pressureType: "product_delay",
    passes: (ctx) => ctx.productProgress < 40 && ctx.month >= 6,
  },
  {
    pressureType: "rival_pressure",
    passes: (ctx) => ctx.rivalryMaxScore >= 70 && ctx.month >= 3,
  },
  {
    pressureType: "fundraising_pressure",
    passes: (ctx) =>
      ctx.month >= 9 &&
      ctx.runwayMonths <= 5 &&
      ctx.investorScore < 60,
  },
];

// ─── Trigger Selection ────────────────────────────────────────────────────────

export function selectBoardroomTrigger(
  ctx: BoardroomTriggerContext
): string | null {
  if (!canTrigger(ctx)) return null;

  // Exclude pressure types already in event history this run
  const resolvedTypes = new Set(
    ctx.currentState.eventHistory.map((e) => e.pressureType)
  );

  for (const check of TRIGGER_CHECKS) {
    if (resolvedTypes.has(check.pressureType)) continue;
    if (check.passes(ctx)) return check.pressureType;
  }

  return null;
}

// ─── Event Generation ─────────────────────────────────────────────────────────

export function generateBoardroomEvent(
  ctx: BoardroomTriggerContext,
  pressureType: string
): BoardroomEvent {
  const template = BOARDROOM_EVENT_TEMPLATES.find(
    (t) => t.pressureType === pressureType
  );
  if (!template) {
    throw new Error(`No boardroom template for pressureType: ${pressureType}`);
  }

  const partial = instantiateTemplate(template, ctx);
  const seed = djb2(`${ctx.startupId}:${ctx.month}:${pressureType}`);
  const idSuffix = seed.toString(36).slice(0, 6);

  return {
    ...partial,
    id: `boardroom_${pressureType}_m${ctx.month}_${idSuffix}`,
    startupId: ctx.startupId,
    resolved: false,
  };
}

// ─── State After Trigger ──────────────────────────────────────────────────────

export function applyTriggerToState(
  state: BoardroomState,
  event: BoardroomEvent
): BoardroomState {
  return {
    ...state,
    currentOpenEvent: event,
    lastTriggeredMonth: event.month,
    pressureLevel: Math.min(100, state.pressureLevel + 15),
  };
}

// ─── Requirement Check ────────────────────────────────────────────────────────

export function checkResponseRequirements(
  option: BoardroomResponseOption,
  ctx: { cash: number; revenue: number; productProgress: number; investorScore: number; boardConfidence: number; monthlyBurn: number }
): { available: boolean; reason?: string } {
  const req = option.requirements;
  if (!req) return { available: true };
  if (req.minCash !== undefined && ctx.cash < req.minCash) {
    return { available: false, reason: `Requires $${req.minCash.toLocaleString()} cash` };
  }
  if (req.minRevenue !== undefined && ctx.revenue < req.minRevenue) {
    return { available: false, reason: `Requires $${req.minRevenue.toLocaleString()}/mo revenue` };
  }
  if (req.minProductProgress !== undefined && ctx.productProgress < req.minProductProgress) {
    return { available: false, reason: `Requires ${req.minProductProgress}% product progress` };
  }
  if (req.minInvestorScore !== undefined && ctx.investorScore < req.minInvestorScore) {
    return { available: false, reason: `Requires investor score ≥ ${req.minInvestorScore}` };
  }
  if (req.minBoardConfidence !== undefined && ctx.boardConfidence < req.minBoardConfidence) {
    return { available: false, reason: `Requires board confidence ≥ ${req.minBoardConfidence}` };
  }
  if (req.maxBurnRate !== undefined && ctx.monthlyBurn > req.maxBurnRate) {
    return { available: false, reason: `Requires burn ≤ $${req.maxBurnRate.toLocaleString()}/mo` };
  }
  return { available: true };
}

// ─── Effect Application ───────────────────────────────────────────────────────

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

export function applyBoardroomEffectsToState(
  state: BoardroomState,
  effects: BoardroomEffect
): BoardroomState {
  return {
    ...state,
    boardConfidence: clamp(state.boardConfidence + (effects.boardConfidenceDelta ?? 0)),
    investorPatience: clamp(state.investorPatience + (effects.investorPatienceDelta ?? 0)),
    founderControl: clamp(state.founderControl + (effects.founderControlDelta ?? 0)),
    pressureLevel: clamp(state.pressureLevel - Math.abs(effects.boardConfidenceDelta ?? 0) * 0.5),
  };
}

// ─── Outcome Narrative ────────────────────────────────────────────────────────

const OUTCOME_NARRATIVES: Record<string, Record<string, string>> = {
  runway_crisis: {
    runway_cut_burn: "The board accepted the burn cuts. Runway extended. Everyone's watching.",
    runway_emergency_raise: "Emergency round initiated. Investors are nervous but listening.",
    runway_pivot_revenue: "Revenue-first sprint activated. No product work this sprint — only sales.",
    runway_transparent_hold: "The board granted 60 days. The clock is ticking.",
  },
  investor_conflict: {
    investor_data_defense: "Metrics review went well. Confidence partially restored.",
    investor_new_terms: "Board restructure accepted. You gave up control to buy time.",
    investor_double_down: "Vision pitch landed with mixed results. Some believers, some skeptics.",
    investor_new_hire: "New operator hire announced. Board cautiously optimistic.",
  },
  revenue_miss: {
    revenue_direct_sales: "Founder-led sales sprint underway. Pipeline building.",
    revenue_pricing_change: "New pricing tier launched. Conversion rate improving.",
    revenue_enterprise_pivot: "Enterprise pivot initiated. First enterprise prospect in talks.",
    revenue_honest_timeline: "New revenue timeline filed. Board disappointed but aligned.",
  },
  product_delay: {
    product_scope_cut: "Scope reduced. Smaller product ships faster. Team relieved.",
    product_hire_engineer: "Senior engineer offer out. Product velocity expected to double.",
    product_customer_codevelopment: "Design partner agreement signed. Product roadmap now revenue-aligned.",
    product_delay_accept: "Delay accepted. New ship date locked. Quality protected.",
  },
  brand_risk: {
    brand_public_apology: "Public statement released. Community response mixed but mostly positive.",
    brand_silence_legal: "Legal silence protocol active. Brand risk paused, trust declining.",
    brand_redirect_narrative: "New feature launched. Narrative partially shifted.",
    brand_community_repair: "AMA held. Community energy rebuilding.",
  },
  rival_pressure: {
    rival_differentiate: "Differentiation strategy locked in. Distinct wedge communicated.",
    rival_aggressive_counter: "Counter-campaign live. Rival responded publicly — war mode on.",
    rival_partnership: "Partnership talks opened. Unusual move that confused the market.",
    rival_ignore_focus: "Competition ignored. Team focused. Customers noticing.",
  },
  burn_rate: {
    burn_rationalize: "Cost audit complete. Monthly burn reduced significantly.",
    burn_accelerate_revenue: "Revenue acceleration bet placed. High stakes.",
    burn_extend_runway_plan: "18-month cash plan presented. Board aligned on timeline.",
  },
  compliance_risk: {
    compliance_legal_review: "Legal audit underway. Risky features paused.",
    compliance_proactive_disclosure: "Regulator notified. Unusual transparency earned respect.",
    compliance_accelerate_mitigations: "Engineering sprint re-routed to compliance. Risk dropping.",
  },
  fundraising_pressure: {
    fundraising_initiate_now: "Investor outreach started. Pipeline warming up.",
    fundraising_milestone_first: "Milestone-first decision made. One more month before raise.",
    fundraising_revenue_route: "Default-alive path chosen. Tight execution required.",
  },
};

function getOutcomeNarrative(
  pressureType: string,
  responseId: string
): string {
  return (
    OUTCOME_NARRATIVES[pressureType]?.[responseId] ??
    "Board acknowledged the response. Outcome pending."
  );
}

// ─── Event Resolution ─────────────────────────────────────────────────────────

export function resolveBoardroomEvent(
  state: BoardroomState,
  event: BoardroomEvent,
  responseId: string,
  month: number
): ResolveBoardroomResult {
  const option = event.responseOptions.find((o) => o.id === responseId);
  if (!option) {
    throw new Error(`Unknown response option: ${responseId}`);
  }

  const effects = option.projectedEffects;
  const outcomeNarrative = getOutcomeNarrative(event.pressureType, responseId);

  const resolvedEvent: BoardroomEvent = {
    ...event,
    selectedResponseId: responseId,
    resolved: true,
    resolvedMonth: month,
    appliedEffects: effects,
    outcomeNarrative,
  };

  const updatedHistory = [...state.eventHistory, resolvedEvent].slice(-20);
  let updatedState = applyBoardroomEffectsToState(state, effects);
  updatedState = {
    ...updatedState,
    currentOpenEvent: null,
    eventHistory: updatedHistory,
    pressureLevel: Math.max(0, updatedState.pressureLevel - 10),
  };

  // Feed item
  const feedSeverity = option.risk === "high"
    ? "warning"
    : option.stance === "transparent" || option.stance === "negotiate"
    ? "positive"
    : "neutral";

  return {
    appliedEffects: effects,
    outcomeNarrative,
    updatedState,
    feedTitle: `Boardroom: ${event.title}`,
    feedBody: `Response: "${option.title}". ${outcomeNarrative}`,
    feedSeverity: feedSeverity as "positive" | "neutral" | "warning" | "critical",
  };
}

// ─── State Deserializer ───────────────────────────────────────────────────────

export function parseBoardroomState(raw: unknown): BoardroomState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_BOARDROOM_STATE };
  }
  const obj = raw as Record<string, unknown>;
  return {
    currentOpenEvent: (obj.currentOpenEvent as BoardroomEvent | null) ?? null,
    eventHistory: (obj.eventHistory as BoardroomEvent[]) ?? [],
    boardConfidence: typeof obj.boardConfidence === "number" ? obj.boardConfidence : 60,
    investorPatience: typeof obj.investorPatience === "number" ? obj.investorPatience : 70,
    founderControl: typeof obj.founderControl === "number" ? obj.founderControl : 80,
    pressureLevel: typeof obj.pressureLevel === "number" ? obj.pressureLevel : 0,
    lastTriggeredMonth: typeof obj.lastTriggeredMonth === "number" ? obj.lastTriggeredMonth : null,
  };
}
