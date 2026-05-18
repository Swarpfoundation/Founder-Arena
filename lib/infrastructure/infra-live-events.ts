import { getInfrastructureStack } from "./infra-catalog";
import { getInfrastructureEvent } from "./infra-events";
import { InfrastructurePreviewInput } from "./infra-preview";
import { RuntimeInfrastructureBurnResult } from "./infra-runtime";
import {
  LiveInfrastructureEventEffect,
  LiveInfrastructureEventRecord,
  LiveInfrastructureEventResponse,
  PersistentInfrastructureState,
} from "./infra-state";
import type { ArenaFeedItem, FeedItemSeverity } from "@/lib/social/types";
import type { CriticalEventPresentation } from "@/lib/gamefeel/critical-events";
import type { CeremonyAccent } from "@/lib/gamefeel/ceremony";
import type { FounderPlaystyle, StrategySignal } from "@/lib/strategy/types";

export const INFRA_LIVE_EVENT_GUARDRAILS = {
  minTriggerSprint: 3,
  maxEventsPerRun: 5,
  maxCashCost: 12_000,
  maxRiskDelta: 5,
  maxInvestorDelta: 5,
  maxProductDelta: 5,
};

interface CandidateEvent {
  type: string;
  priority: number;
  triggerReason: string;
  severity?: LiveInfrastructureEventRecord["severity"];
}

export interface InfraEventSelectionInput {
  state: PersistentInfrastructureState;
  previewInput: InfrastructurePreviewInput;
  runtime: RuntimeInfrastructureBurnResult;
  currentSprint: number;
}

export interface InfraEventResolutionResult {
  state: PersistentInfrastructureState;
  event: LiveInfrastructureEventRecord;
  effect: LiveInfrastructureEventEffect;
}

export interface InfrastructureEventHistoryGroup {
  week: number;
  events: LiveInfrastructureEventRecord[];
}

function textForStartup(input: InfrastructurePreviewInput): string {
  return [
    input.startup?.sector,
    input.startup?.stage,
    input.startup?.status,
    input.startup?.monetizationModel,
    input.startup?.description,
    input.startup?.problem,
    input.startup?.solution,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function capEffect(effect: LiveInfrastructureEventEffect): LiveInfrastructureEventEffect {
  return {
    cashDelta: effect.cashDelta === undefined ? undefined : clamp(effect.cashDelta, -INFRA_LIVE_EVENT_GUARDRAILS.maxCashCost, INFRA_LIVE_EVENT_GUARDRAILS.maxCashCost),
    productDelta: effect.productDelta === undefined ? undefined : clamp(effect.productDelta, -INFRA_LIVE_EVENT_GUARDRAILS.maxProductDelta, INFRA_LIVE_EVENT_GUARDRAILS.maxProductDelta),
    investorDelta: effect.investorDelta === undefined ? undefined : clamp(effect.investorDelta, -INFRA_LIVE_EVENT_GUARDRAILS.maxInvestorDelta, INFRA_LIVE_EVENT_GUARDRAILS.maxInvestorDelta),
    riskDelta: effect.riskDelta === undefined ? undefined : clamp(effect.riskDelta, -INFRA_LIVE_EVENT_GUARDRAILS.maxRiskDelta, INFRA_LIVE_EVENT_GUARDRAILS.maxRiskDelta),
  };
}

function feedSeverityFor(event: Pick<LiveInfrastructureEventRecord, "severity" | "type">): FeedItemSeverity {
  if (event.severity === "critical") return "critical";
  if (event.severity === "moderate") return "warning";
  if (event.type.includes("credit")) return "warning";
  return "neutral";
}

function feedBodyForTrigger(event: LiveInfrastructureEventRecord): string {
  const type = event.type.replace(/_/g, " ");
  return `${event.triggerReason} This is a gameplay infrastructure signal, not an exact provider bill. Resolve it in the Infra Console before the risk compounds. (${type})`;
}

function responseFor(event: LiveInfrastructureEventRecord): LiveInfrastructureEventResponse | null {
  if (!event.selectedResponseId) return null;
  return event.responseOptions.find((response) => response.id === event.selectedResponseId) ?? null;
}

export function buildInfrastructureEventTriggerFeedItem(event: LiveInfrastructureEventRecord): ArenaFeedItem {
  return {
    id: event.triggerFeedItemId ?? `feed_${event.id}:trigger`,
    month: event.week,
    category: "infrastructure",
    title: `Infrastructure Warning: ${event.title}`,
    body: feedBodyForTrigger(event),
    severity: feedSeverityFor(event),
    source: "operations",
  };
}

export function buildInfrastructureEventResolutionFeedItem(event: LiveInfrastructureEventRecord): ArenaFeedItem | null {
  if (!event.resolved) return null;
  const response = responseFor(event);
  const positive =
    (response?.effect.riskDelta ?? 0) < 0 ||
    (response?.effect.investorDelta ?? 0) > 0 ||
    (response?.effect.productDelta ?? 0) > 0;
  const negative = (response?.effect.riskDelta ?? 0) > 0 || (response?.effect.investorDelta ?? 0) < 0;
  return {
    id: event.resolutionFeedItemId ?? `feed_${event.id}:resolved`,
    month: event.week,
    category: "operations",
    title: `Infra Response Resolved: ${response?.label ?? event.title}`,
    body: `${event.title} was answered with "${response?.label ?? "a response"}." ${event.effectsSummary ?? "No direct stat effect."} ${response?.counterplay ?? "The infrastructure risk remains visible to operators."}`,
    severity: negative ? "warning" : positive ? "positive" : "neutral",
    source: "operations",
  };
}

export function appendInfrastructureFeedItems(
  existing: ArenaFeedItem[],
  incoming: Array<ArenaFeedItem | null | undefined>
): ArenaFeedItem[] {
  const byId = new Map(existing.map((item) => [item.id, item]));
  for (const item of incoming) {
    if (!item || byId.has(item.id)) continue;
    byId.set(item.id, item);
  }
  return Array.from(byId.values()).slice(-100);
}

function presentationType(type: string): CriticalEventPresentation["type"] {
  if (type.includes("compliance") || type.includes("enterprise")) return "boardroom";
  if (type.includes("credit")) return "acquisition";
  if (type.includes("llm") || type.includes("gpu")) return "warning";
  if (type.includes("outgrown") || type.includes("database") || type.includes("serverless")) return "danger";
  return "warning";
}

function presentationAccent(event: LiveInfrastructureEventRecord): CeremonyAccent {
  if (event.severity === "critical") return "rose";
  if (event.severity === "moderate" || event.type.includes("credit")) return "amber";
  return "cyan";
}

export function buildInfrastructureEventPresentation(input: {
  startupId: string;
  event: LiveInfrastructureEventRecord;
}): CriticalEventPresentation {
  const { event, startupId } = input;
  const accent = presentationAccent(event);
  return {
    type: presentationType(event.type),
    severity: event.severity === "critical" ? "critical" : event.severity === "moderate" ? "high" : "medium",
    eyebrow: event.severity === "critical" ? "Critical Infra Event" : "Infrastructure Interrupt",
    title: event.title,
    subtitle: event.triggerReason,
    accent,
    primaryCta: { label: "Open Infra Console", href: `/startup/${startupId}/infrastructure` },
    secondaryCta: { label: "Continue Operating", href: `/startup/${startupId}/operate` },
    affectedStats: [
      { label: "Severity", value: event.severity.toUpperCase(), accent },
      { label: "Founder Week", value: `W${event.week}`, accent: "cyan" },
      { label: "Risk Area", value: event.type.replace(/_/g, " ").toUpperCase(), accent: "amber" },
    ],
    displayKey: `infra-live:${startupId}:${event.id}`,
  };
}

export function groupInfrastructureEventsByWeek(events: LiveInfrastructureEventRecord[]): InfrastructureEventHistoryGroup[] {
  const groups = new Map<number, LiveInfrastructureEventRecord[]>();
  for (const event of events) {
    groups.set(event.week, [...(groups.get(event.week) ?? []), event]);
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([week, groupedEvents]) => ({
      week,
      events: groupedEvents.slice().sort((a, b) => a.title.localeCompare(b.title)),
    }));
}

function strategyMappingForResponse(event: LiveInfrastructureEventRecord, response: LiveInfrastructureEventResponse): {
  playstyle: FounderPlaystyle;
  weight: number;
  reason: string;
} | null {
  const key = `${event.type}:${response.id}`;
  if (/compliance|security|audit|minimum_controls|reliability_plan/.test(key)) {
    return { playstyle: "regulated_operator", weight: 6, reason: `${response.label} signals regulated infrastructure discipline.` };
  }
  if (/cache|pooling|compress|cdn|monitoring|fallback|optimize|queue/.test(key)) {
    return { playstyle: "technical_builder", weight: 6, reason: `${response.label} signals technical infrastructure execution.` };
  }
  if (/rate_limit|cut_usage|sample_logs|retention|decline|ride_it_out/.test(key)) {
    return { playstyle: "cockroach", weight: 5, reason: `${response.label} signals runway-preserving operating discipline.` };
  }
  if (/paid_stack|upgrade|usage_based_pricing/.test(key)) {
    return { playstyle: "capital_blitzscaler", weight: 5, reason: `${response.label} signals capital-aware scale planning.` };
  }
  if (/transparent|trust|community/.test(key)) {
    return { playstyle: "trust_builder", weight: 5, reason: `${response.label} signals trust-building infrastructure communication.` };
  }
  return null;
}

function signalId(sourceId: string): string {
  let h = 5381;
  for (let i = 0; i < sourceId.length; i++) {
    h = ((h << 5) + h) ^ sourceId.charCodeAt(i);
    h |= 0;
  }
  return `sig-${Math.abs(h).toString(36)}`;
}

export function signalFromInfrastructureEventResolution(event: LiveInfrastructureEventRecord): StrategySignal | null {
  const response = responseFor(event);
  if (!event.resolved || !response) return null;
  const mapping = strategyMappingForResponse(event, response);
  if (!mapping) return null;
  const sourceId = `infrastructure_event:${event.id}:${response.id}:${mapping.playstyle}`;
  return {
    id: signalId(sourceId),
    source: "infrastructure_event",
    sourceId,
    month: event.week,
    playstyle: mapping.playstyle,
    weight: mapping.weight,
    reason: mapping.reason,
    tags: ["infrastructure", event.type, response.id],
  };
}

function responses(type: string): LiveInfrastructureEventResponse[] {
  const sharedIgnore = {
    id: "ride_it_out",
    label: "Ride It Out",
    description: "Spend nothing now and accept higher operating risk.",
    effect: { riskDelta: 4, investorDelta: -2 },
    counterplay: "Only viable if runway and reputation can absorb the hit.",
  };

  const map: Record<string, LiveInfrastructureEventResponse[]> = {
    prototype_outgrown: [
      { id: "upgrade_stack", label: "Upgrade The Stack", description: "Move off prototype infrastructure before growth breaks it.", effect: { cashDelta: -8000, riskDelta: -3, investorDelta: 2 }, counterplay: "Burn rises now, but scaling risk falls." },
      { id: "optimize_launch", label: "Optimize The Launch", description: "Throttle non-critical traffic and clean up hot paths.", effect: { cashDelta: -3000, productDelta: 2, riskDelta: -1 }, counterplay: "Lower cost response with less trust upside." },
      sharedIgnore,
    ],
    serverless_bill_spike: [
      { id: "cache_hot_paths", label: "Cache Hot Paths", description: "Reduce function churn and repeated compute.", effect: { cashDelta: -5000, riskDelta: -3, productDelta: 1 }, counterplay: "Best when growth is real but waste is obvious." },
      { id: "rate_limit_free", label: "Rate Limit Free Users", description: "Protect margins at the cost of some market goodwill.", effect: { riskDelta: -2, investorDelta: -1, productDelta: -1 }, counterplay: "Preserves runway without adding cash cost." },
      { id: "upgrade_plan", label: "Upgrade Plan", description: "Pay for predictability and reduce investor concern.", effect: { cashDelta: -9000, investorDelta: 3, riskDelta: -2 }, counterplay: "Expensive, but cleaner for high-traffic demos." },
      sharedIgnore,
    ],
    database_connection_limit: [
      { id: "add_pooling", label: "Add Connection Pooling", description: "Stabilize database concurrency without a full rebuild.", effect: { cashDelta: -4000, productDelta: 2, riskDelta: -3 }, counterplay: "Good default response for DB-heavy startups." },
      { id: "upgrade_database", label: "Upgrade Database Tier", description: "Buy more headroom and reassure enterprise buyers.", effect: { cashDelta: -9000, investorDelta: 2, riskDelta: -3 }, counterplay: "Costs more, but reduces reliability risk." },
      { id: "queue_writes", label: "Queue Writes", description: "Reduce peak pressure but slow some user workflows.", effect: { cashDelta: -2500, productDelta: -1, riskDelta: -2 }, counterplay: "Cheap, but creates product friction." },
      sharedIgnore,
    ],
    bandwidth_egress_surprise: [
      { id: "compress_payloads", label: "Compress Payloads", description: "Cut payload size and reduce egress pressure.", effect: { cashDelta: -3500, productDelta: 1, riskDelta: -2 }, counterplay: "Good when usage is growing but media is wasteful." },
      { id: "cdn_rules", label: "Tighten CDN Rules", description: "Cache aggressively and protect hot assets.", effect: { cashDelta: -6000, riskDelta: -3, investorDelta: 1 }, counterplay: "Best for social or viral traffic." },
      sharedIgnore,
    ],
    logs_observability_spike: [
      { id: "sample_logs", label: "Sample Logs", description: "Keep signal while cutting noisy retention.", effect: { cashDelta: -2000, riskDelta: -2 }, counterplay: "Low-cost operational cleanup." },
      { id: "set_retention", label: "Set Retention Policy", description: "Stop paying to remember every low-value request.", effect: { productDelta: 1, riskDelta: -1 }, counterplay: "No direct spend, but requires discipline." },
      { id: "upgrade_observability", label: "Upgrade Observability", description: "Improve incident visibility for a real growth team.", effect: { cashDelta: -7000, investorDelta: 2, riskDelta: -2 }, counterplay: "Useful when reliability is now investor-visible." },
    ],
    cloud_credits_expiring: [
      { id: "negotiate_extension", label: "Negotiate Extension", description: "Use traction to buy more time before the cliff.", effect: { investorDelta: 2, riskDelta: -1 }, counterplay: "Best if partner trust is still strong." },
      { id: "cut_usage", label: "Cut Infra Usage", description: "Reduce gross burn before credits disappear.", effect: { productDelta: -2, riskDelta: -3 }, counterplay: "Protects runway but slows product momentum." },
      { id: "paid_stack_plan", label: "Plan Paid Stack", description: "Convert hidden spend into predictable burn.", effect: { cashDelta: -5000, investorDelta: 2, riskDelta: -2 }, counterplay: "Moderate cost for fewer surprises." },
      sharedIgnore,
    ],
    llm_token_bill_shock: [
      { id: "optimize_prompts", label: "Optimize Prompts & Caching", description: "Cut repeated context and cache high-volume paths.", effect: { cashDelta: -6000, productDelta: 1, riskDelta: -4 }, counterplay: "Best first response for AI-heavy products." },
      { id: "rate_limit_ai", label: "Rate Limit Free AI Usage", description: "Protect gross margin while angering some users.", effect: { riskDelta: -2, investorDelta: -1, productDelta: -1 }, counterplay: "Runway-friendly but growth-sensitive." },
      { id: "usage_based_pricing", label: "Move To Usage-Based Pricing", description: "Align AI cost with revenue instead of hype.", effect: { investorDelta: 3, riskDelta: -2, productDelta: -1 }, counterplay: "Good for investor trust, slower for adoption." },
      sharedIgnore,
    ],
    compliance_infrastructure_upgrade: [
      { id: "security_audit", label: "Fund Security Audit", description: "Prove enterprise readiness with a focused audit.", effect: { cashDelta: -10_000, investorDelta: 4, riskDelta: -3 }, counterplay: "Costs cash but improves trust." },
      { id: "delay_enterprise", label: "Delay Enterprise Sales", description: "Avoid compliance overreach until product is ready.", effect: { productDelta: 1, investorDelta: -1, riskDelta: -2 }, counterplay: "Safer, but less exciting for investors." },
      { id: "minimum_controls", label: "Ship Minimum Controls", description: "Patch the largest gaps without a full enterprise stack.", effect: { cashDelta: -4500, investorDelta: 1, riskDelta: -2 }, counterplay: "Balanced response for seed-stage teams." },
    ],
    enterprise_reliability_audit: [
      { id: "reliability_plan", label: "Publish Reliability Plan", description: "Give the buyer a credible path to uptime.", effect: { cashDelta: -5000, investorDelta: 3, riskDelta: -2 }, counterplay: "Good if revenue depends on enterprise trust." },
      { id: "add_monitoring", label: "Add Monitoring Coverage", description: "Improve detection before enterprise traffic arrives.", effect: { cashDelta: -7000, riskDelta: -3, productDelta: 1 }, counterplay: "Operationally useful beyond this deal." },
      { id: "decline_enterprise", label: "Decline The Deal", description: "Protect product focus at the cost of investor excitement.", effect: { investorDelta: -2, riskDelta: -3 }, counterplay: "Viable for product-led founders." },
    ],
    gpu_inference_overload: [
      { id: "queue_inference", label: "Queue Inference", description: "Protect uptime by slowing expensive jobs.", effect: { productDelta: -1, riskDelta: -3 }, counterplay: "Safer than buying capacity too early." },
      { id: "fallback_models", label: "Add Fallback Models", description: "Route spikes to cheaper or smaller models.", effect: { cashDelta: -9000, riskDelta: -4, investorDelta: 1 }, counterplay: "Good AI reliability move." },
      sharedIgnore,
    ],
  };

  return (map[type] ?? [sharedIgnore]).map((response) => ({ ...response, effect: capEffect(response.effect) }));
}

function severityFor(type: string): LiveInfrastructureEventRecord["severity"] {
  const definition = getInfrastructureEvent(type);
  if (definition?.severity === "critical") return "critical";
  if (definition?.severity === "high" || definition?.severity === "medium") return "moderate";
  return "minor";
}

function hasOpenEvent(state: PersistentInfrastructureState): boolean {
  return state.infraEventHistory.some((event) => !event.resolved);
}

function triggeredTypes(state: PersistentInfrastructureState): Set<string> {
  return new Set(state.infraEventHistory.map((event) => event.type));
}

function eventCountThisSprint(state: PersistentInfrastructureState, sprint: number): number {
  return state.infraEventHistory.filter((event) => event.week === sprint).length;
}

function buildCandidates(input: InfraEventSelectionInput): CandidateEvent[] {
  const { previewInput, runtime, state, currentSprint } = input;
  const stack = getInfrastructureStack(runtime.sourceStackId);
  const usage = runtime.preview.usageProfile;
  const text = textForStartup(previewInput);
  const productProgress = previewInput.startup?.productProgress ?? 0;
  const revenue = previewInput.startup?.revenue ?? 0;
  const regulated = hasAny(text, ["fintech", "finance", "payment", "health", "healthcare", "insurance", "banking", "security", "enterprise"]);
  const hasActiveCredits = state.creditBalances.some((credit) => credit.status === "active" && credit.remainingAmount > 0);
  const candidates: CandidateEvent[] = [];

  if ((runtime.sourceStackId === "cheap_static_landing" || runtime.sourceStackId === "replit_mvp") && (productProgress >= 35 || usage.users >= 5000)) {
    candidates.push({ type: "prototype_outgrown", priority: 85, triggerReason: "Prototype stack is handling real product traction." });
  }
  if ((runtime.sourceStackId === "vercel_serverless" || stack?.provider === "vercel" || stack?.provider === "cloudflare") && (usage.users >= 25_000 || usage.dataTransferGb >= 200 || usage.trafficVolatility !== "stable")) {
    candidates.push({ type: "serverless_bill_spike", priority: 78, triggerReason: "Serverless usage is scaling with traffic volatility." });
  }
  if ((runtime.sourceStackId === "supabase_neon_db" || runtime.sourceStackId === "render_full_stack") && (usage.dbStorageGb >= 8 || usage.users >= 7000 || productProgress >= 55)) {
    candidates.push({ type: "database_connection_limit", priority: 74, triggerReason: "Database pressure is rising with product and usage." });
  }
  if ((usage.dataTransferGb >= 300 || usage.trafficVolatility === "viral" || usage.users >= 75_000) && ["aws", "google_cloud", "vercel", "cloudflare"].includes(stack?.provider ?? "")) {
    candidates.push({ type: "bandwidth_egress_surprise", priority: 70, triggerReason: "Traffic and data transfer are large enough to create egress pressure." });
  }
  if ((usage.users >= 20_000 || productProgress >= 70 || revenue >= 50_000) && currentSprint >= 5) {
    candidates.push({ type: "logs_observability_spike", priority: 52, triggerReason: "Growth-stage traffic is making observability costs visible." });
  }
  if (hasActiveCredits && (runtime.warnings.some((warning) => warning.toLowerCase().includes("credit")) || runtime.creditsApplied >= Math.max(500, runtime.grossInfraBurn * 0.5))) {
    candidates.push({ type: "cloud_credits_expiring", priority: 95, triggerReason: "Credits are masking gross infrastructure burn or approaching expiry." });
  }
  if ((runtime.preview.aiUsageTier === "heavy" || runtime.preview.aiUsageTier === "agentic" || runtime.preview.aiUsageTier === "multimodal" || runtime.aiApiBurn >= 1500) && runtime.sourceStackId === "ai_heavy_stack") {
    candidates.push({ type: "llm_token_bill_shock", priority: runtime.preview.aiUsageTier === "agentic" ? 92 : 82, triggerReason: "AI/API usage is now material to monthly burn." });
  }
  if (regulated && (runtime.complianceBurn > 0 || (stack?.complianceReadiness ?? 0) < 70)) {
    candidates.push({ type: "compliance_infrastructure_upgrade", priority: 68, triggerReason: "Regulated or enterprise posture requires stronger infrastructure controls." });
  }
  if ((regulated || revenue >= 100_000) && (stack?.reliability ?? 100) < 80 && usage.users >= 15_000) {
    candidates.push({ type: "enterprise_reliability_audit", priority: 62, triggerReason: "Enterprise trust is outpacing current reliability posture." });
  }
  if (runtime.preview.aiUsageTier === "multimodal" && usage.trafficVolatility !== "stable") {
    candidates.push({ type: "gpu_inference_overload", priority: 60, triggerReason: "Multimodal inference is exposed to uneven demand." });
  }

  const seen = triggeredTypes(state);
  return candidates.filter((candidate) => !seen.has(candidate.type));
}

export function selectInfrastructureEventForSprint(input: InfraEventSelectionInput): { state: PersistentInfrastructureState; event: LiveInfrastructureEventRecord | null } {
  if (input.currentSprint < INFRA_LIVE_EVENT_GUARDRAILS.minTriggerSprint) return { state: input.state, event: null };
  if (hasOpenEvent(input.state)) return { state: input.state, event: null };
  if (eventCountThisSprint(input.state, input.currentSprint) > 0) return { state: input.state, event: null };
  if (input.state.infraEventHistory.length >= INFRA_LIVE_EVENT_GUARDRAILS.maxEventsPerRun) return { state: input.state, event: null };

  const candidate = buildCandidates(input).sort((a, b) => b.priority - a.priority)[0];
  if (!candidate) return { state: input.state, event: null };
  const definition = getInfrastructureEvent(candidate.type);
  if (!definition) return { state: input.state, event: null };

  const event: LiveInfrastructureEventRecord = {
    id: `infra:${candidate.type}:w${input.currentSprint}`,
    type: candidate.type,
    week: input.currentSprint,
    severity: candidate.severity ?? severityFor(candidate.type),
    title: definition.title,
    triggerReason: candidate.triggerReason,
    responseOptions: responses(candidate.type),
    triggerFeedItemId: `feed_infra_${candidate.type}_w${input.currentSprint}_trigger`,
    resolved: false,
    createdAt: new Date().toISOString(),
  };

  return {
    event,
    state: {
      ...input.state,
      infraEventHistory: [...input.state.infraEventHistory, event].slice(-12),
      updatedAt: new Date().toISOString(),
    },
  };
}

function effectSummary(effect: LiveInfrastructureEventEffect): string {
  const parts: string[] = [];
  if (effect.cashDelta) parts.push(`Cash ${effect.cashDelta > 0 ? "+" : ""}$${effect.cashDelta.toLocaleString()}`);
  if (effect.productDelta) parts.push(`Product ${effect.productDelta > 0 ? "+" : ""}${effect.productDelta}`);
  if (effect.investorDelta) parts.push(`Investor ${effect.investorDelta > 0 ? "+" : ""}${effect.investorDelta}`);
  if (effect.riskDelta) parts.push(`Risk ${effect.riskDelta > 0 ? "+" : ""}${effect.riskDelta}`);
  return parts.join(" / ") || "No direct stat effect";
}

export function resolveInfrastructureEvent(input: {
  state: PersistentInfrastructureState;
  eventId: string;
  responseId: string;
}): InfraEventResolutionResult {
  const event = input.state.infraEventHistory.find((candidate) => candidate.id === input.eventId);
  if (!event) throw new Error("Infrastructure event not found.");
  if (event.resolved) {
    return { state: input.state, event, effect: {} };
  }
  const response = event.responseOptions.find((candidate) => candidate.id === input.responseId);
  if (!response) throw new Error("Invalid infrastructure event response.");

  const effect = capEffect(response.effect);
  const resolvedEvent: LiveInfrastructureEventRecord = {
    ...event,
    selectedResponseId: response.id,
    resolved: true,
    effectsSummary: effectSummary(effect),
    resolutionFeedItemId: event.resolutionFeedItemId ?? `feed_${event.id}:resolved`,
    resolvedAt: new Date().toISOString(),
  };

  return {
    event: resolvedEvent,
    effect,
    state: {
      ...input.state,
      infraEventHistory: input.state.infraEventHistory.map((candidate) => candidate.id === event.id ? resolvedEvent : candidate).slice(-12),
      updatedAt: new Date().toISOString(),
    },
  };
}

export function getOpenInfrastructureEvent(state: PersistentInfrastructureState): LiveInfrastructureEventRecord | null {
  return state.infraEventHistory.find((event) => !event.resolved) ?? null;
}
