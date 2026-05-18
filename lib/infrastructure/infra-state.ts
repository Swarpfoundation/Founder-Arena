import { getInfrastructureStack } from "./infra-catalog";
import { buildInfrastructurePreview, InfrastructurePreviewInput } from "./infra-preview";
import { INFRASTRUCTURE_ECONOMY_VERSION, InfrastructureProvider } from "./types";

export type CloudCreditBalanceStatus = "active" | "depleted" | "expired";
export type LiveInfrastructureEventSeverity = "minor" | "moderate" | "critical";

export interface LiveInfrastructureEventEffect {
  cashDelta?: number;
  productDelta?: number;
  investorDelta?: number;
  riskDelta?: number;
}

export interface LiveInfrastructureEventResponse {
  id: string;
  label: string;
  description: string;
  effect: LiveInfrastructureEventEffect;
  counterplay: string;
}

export interface LiveInfrastructureEventRecord {
  id: string;
  type: string;
  week: number;
  severity: LiveInfrastructureEventSeverity;
  title: string;
  triggerReason: string;
  responseOptions: LiveInfrastructureEventResponse[];
  triggerFeedItemId?: string;
  resolutionFeedItemId?: string;
  selectedResponseId?: string;
  resolved: boolean;
  effectsSummary?: string;
  createdAt?: string;
  resolvedAt?: string;
}

export interface CloudCreditBalance {
  id: string;
  startupId?: string;
  sourceOfferId?: string;
  providerScope: InfrastructureProvider[] | "any";
  originalAmount: number;
  remainingAmount: number;
  acceptedAtSprint: number;
  expiresAtSprint: number;
  status: CloudCreditBalanceStatus;
  totalApplied: number;
  lastAppliedSprint?: number;
  restrictions: string[];
}

export interface PersistentInfrastructureState {
  version: string;
  selectedStackId?: string | null;
  previousStackId?: string | null;
  selectedAtSprint?: number;
  lastSwitchedSprint?: number;
  creditBalances: CloudCreditBalance[];
  infraEventHistory: LiveInfrastructureEventRecord[];
  updatedAt?: string;
}

export interface InfrastructureStackOption {
  stackId: string;
  allowed: boolean;
  lockedReason?: string;
  warnings: string[];
}

export interface CloudCreditApplicationResult {
  creditsApplied: number;
  updatedBalances: CloudCreditBalance[];
  warnings: string[];
  appliedCreditIds: string[];
}

const DEFAULT_CREDIT_DURATION_SPRINTS = 8;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asMoney(value: unknown): number {
  return Math.max(0, Math.round(typeof value === "number" && Number.isFinite(value) ? value : 0));
}

function asSprint(value: unknown, fallback: number): number {
  return Math.max(1, Math.round(typeof value === "number" && Number.isFinite(value) ? value : fallback));
}

function normalizeProviderScope(value: unknown): InfrastructureProvider[] | "any" {
  if (value === "any") return "any";
  if (Array.isArray(value)) return value.filter((item): item is InfrastructureProvider => typeof item === "string") as InfrastructureProvider[];
  return "any";
}

function normalizeCreditStatus(value: unknown): CloudCreditBalanceStatus {
  if (value === "depleted" || value === "expired") return value;
  return "active";
}

function normalizeCreditBalance(value: unknown): CloudCreditBalance | null {
  if (!isRecord(value)) return null;
  const id = typeof value.id === "string" ? value.id : null;
  if (!id) return null;

  const originalAmount = asMoney(value.originalAmount);
  const remainingAmount = Math.min(originalAmount, asMoney(value.remainingAmount));
  const expiresAtSprint = asSprint(value.expiresAtSprint, DEFAULT_CREDIT_DURATION_SPRINTS);
  const totalApplied = asMoney(value.totalApplied);
  const status = remainingAmount <= 0 ? "depleted" : normalizeCreditStatus(value.status);

  return {
    id,
    startupId: typeof value.startupId === "string" ? value.startupId : undefined,
    sourceOfferId: typeof value.sourceOfferId === "string" ? value.sourceOfferId : undefined,
    providerScope: normalizeProviderScope(value.providerScope),
    originalAmount,
    remainingAmount,
    acceptedAtSprint: asSprint(value.acceptedAtSprint, 1),
    expiresAtSprint,
    status,
    totalApplied,
    lastAppliedSprint: typeof value.lastAppliedSprint === "number" ? Math.round(value.lastAppliedSprint) : undefined,
    restrictions: Array.isArray(value.restrictions) ? value.restrictions.filter((item): item is string => typeof item === "string") : [],
  };
}

function normalizeEventEffect(value: unknown): LiveInfrastructureEventEffect {
  if (!isRecord(value)) return {};
  const effect: LiveInfrastructureEventEffect = {};
  for (const key of ["cashDelta", "productDelta", "investorDelta", "riskDelta"] as const) {
    if (typeof value[key] === "number" && Number.isFinite(value[key])) effect[key] = Math.round(value[key]);
  }
  return effect;
}

function normalizeResponse(value: unknown): LiveInfrastructureEventResponse | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.label !== "string") return null;
  return {
    id: value.id,
    label: value.label,
    description: typeof value.description === "string" ? value.description : "",
    effect: normalizeEventEffect(value.effect),
    counterplay: typeof value.counterplay === "string" ? value.counterplay : "",
  };
}

function normalizeEventSeverity(value: unknown): LiveInfrastructureEventSeverity {
  if (value === "critical" || value === "moderate") return value;
  return "minor";
}

function normalizeInfraEvent(value: unknown): LiveInfrastructureEventRecord | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.type !== "string" || typeof value.title !== "string") return null;
  const responseOptions = Array.isArray(value.responseOptions)
    ? value.responseOptions.map(normalizeResponse).filter((response): response is LiveInfrastructureEventResponse => response !== null)
    : [];
  return {
    id: value.id,
    type: value.type,
    week: asSprint(value.week, 1),
    severity: normalizeEventSeverity(value.severity),
    title: value.title,
    triggerReason: typeof value.triggerReason === "string" ? value.triggerReason : "",
    responseOptions,
    triggerFeedItemId: typeof value.triggerFeedItemId === "string" ? value.triggerFeedItemId : undefined,
    resolutionFeedItemId: typeof value.resolutionFeedItemId === "string" ? value.resolutionFeedItemId : undefined,
    selectedResponseId: typeof value.selectedResponseId === "string" ? value.selectedResponseId : undefined,
    resolved: value.resolved === true,
    effectsSummary: typeof value.effectsSummary === "string" ? value.effectsSummary : undefined,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : undefined,
    resolvedAt: typeof value.resolvedAt === "string" ? value.resolvedAt : undefined,
  };
}

export function parseInfrastructureState(aiAnalysis: unknown): PersistentInfrastructureState {
  const root = isRecord(aiAnalysis) ? aiAnalysis : {};
  const raw = isRecord(root.infrastructure) ? root.infrastructure : {};
  const selectedStackId = typeof raw.selectedStackId === "string" ? raw.selectedStackId : null;
  const previousStackId = typeof raw.previousStackId === "string" ? raw.previousStackId : null;
  const creditBalances = Array.isArray(raw.creditBalances)
    ? raw.creditBalances.map(normalizeCreditBalance).filter((credit): credit is CloudCreditBalance => credit !== null)
    : [];
  const infraEventHistory = Array.isArray(raw.infraEventHistory)
    ? raw.infraEventHistory.map(normalizeInfraEvent).filter((event): event is LiveInfrastructureEventRecord => event !== null).slice(-12)
    : [];

  return {
    version: typeof raw.version === "string" ? raw.version : INFRASTRUCTURE_ECONOMY_VERSION,
    selectedStackId,
    previousStackId,
    selectedAtSprint: typeof raw.selectedAtSprint === "number" ? Math.round(raw.selectedAtSprint) : undefined,
    lastSwitchedSprint: typeof raw.lastSwitchedSprint === "number" ? Math.round(raw.lastSwitchedSprint) : undefined,
    creditBalances,
    infraEventHistory,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
  };
}

export function mergeInfrastructureStateIntoAiAnalysis(
  aiAnalysis: unknown,
  state: PersistentInfrastructureState
): Record<string, unknown> {
  const root = isRecord(aiAnalysis) ? { ...aiAnalysis } : {};
  return {
    ...root,
    infrastructure: {
    version: state.version,
      selectedStackId: state.selectedStackId ?? null,
      previousStackId: state.previousStackId ?? null,
      selectedAtSprint: state.selectedAtSprint,
      lastSwitchedSprint: state.lastSwitchedSprint,
    creditBalances: state.creditBalances,
      infraEventHistory: state.infraEventHistory.slice(-12),
      updatedAt: state.updatedAt ?? new Date().toISOString(),
    },
  };
}

export function syncCloudCreditBalancesFromOffers(
  state: PersistentInfrastructureState,
  offers: NonNullable<InfrastructurePreviewInput["cloudCreditOffers"]>,
  currentSprint: number,
  startupId?: string
): PersistentInfrastructureState {
  const existingBySource = new Set(state.creditBalances.map((credit) => credit.sourceOfferId).filter(Boolean));
  const syncedBalances = [...state.creditBalances];

  for (const offer of offers) {
    const amount = asMoney(offer.amount);
    if (offer.status !== "accepted" || amount <= 0) continue;
    const sourceOfferId = offer.sourceOfferId ?? offer.id;
    if (existingBySource.has(sourceOfferId)) continue;

    const acceptedAtSprint = Math.max(1, Math.round(currentSprint));
    const duration = Math.max(1, Math.round(offer.expiresInSprints ?? DEFAULT_CREDIT_DURATION_SPRINTS));
    syncedBalances.push({
      id: `cloud-credit-${sourceOfferId}`,
      startupId,
      sourceOfferId,
      providerScope: offer.providerScope ?? "any",
      originalAmount: amount,
      remainingAmount: amount,
      acceptedAtSprint,
      expiresAtSprint: Math.min(12, acceptedAtSprint + duration - 1),
      status: "active",
      totalApplied: 0,
      restrictions: [
        "Credits reduce infrastructure burn only.",
        "Gameplay credit balance, not a live provider invoice.",
      ],
    });
    existingBySource.add(sourceOfferId);
  }

  return {
    ...state,
    creditBalances: syncedBalances,
    infraEventHistory: state.infraEventHistory ?? [],
  };
}

function providerMatches(scope: InfrastructureProvider[] | "any", provider: InfrastructureProvider): boolean {
  return scope === "any" || scope.includes(provider);
}

export function refreshCloudCreditStatuses(
  balances: CloudCreditBalance[],
  currentSprint: number
): CloudCreditBalance[] {
  return balances.map((credit) => {
    if (credit.status === "depleted" || credit.remainingAmount <= 0) {
      return { ...credit, remainingAmount: 0, status: "depleted" };
    }
    if (currentSprint > credit.expiresAtSprint) {
      return { ...credit, status: "expired" };
    }
    return { ...credit, status: "active" };
  });
}

export function applyCloudCreditBalances(input: {
  grossInfraBurn: number;
  balances: CloudCreditBalance[];
  provider: InfrastructureProvider;
  currentSprint: number;
}): CloudCreditApplicationResult {
  const grossInfraBurn = asMoney(input.grossInfraBurn);
  let remainingBurn = grossInfraBurn;
  let creditsApplied = 0;
  const warnings: string[] = [];
  const appliedCreditIds: string[] = [];

  const updatedBalances = refreshCloudCreditStatuses(input.balances, input.currentSprint).map((credit) => {
    if (remainingBurn <= 0) return credit;
    if (credit.status !== "active") return credit;
    if (!providerMatches(credit.providerScope, input.provider)) return credit;
    if (credit.lastAppliedSprint === input.currentSprint) return credit;

    const applied = Math.min(credit.remainingAmount, remainingBurn);
    if (applied <= 0) return credit;

    remainingBurn -= applied;
    creditsApplied += applied;
    appliedCreditIds.push(credit.id);
    const remainingAmount = Math.max(0, credit.remainingAmount - applied);
    const status: CloudCreditBalanceStatus = remainingAmount <= 0 ? "depleted" : "active";

    return {
      ...credit,
      remainingAmount,
      status,
      totalApplied: credit.totalApplied + applied,
      lastAppliedSprint: input.currentSprint,
    };
  });

  if (creditsApplied > 0) {
    warnings.push(`Cloud credits offset $${creditsApplied.toLocaleString()}/mo of infrastructure burn this sprint.`);
  }

  warnings.push(...getCloudCreditCliffWarnings(updatedBalances, grossInfraBurn, input.currentSprint));

  return {
    creditsApplied,
    updatedBalances,
    warnings: Array.from(new Set(warnings)),
    appliedCreditIds,
  };
}

export function getCloudCreditCliffWarnings(
  balances: CloudCreditBalance[],
  grossInfraBurn: number,
  currentSprint: number
): string[] {
  const warnings: string[] = [];
  for (const credit of refreshCloudCreditStatuses(balances, currentSprint)) {
    if (credit.status !== "active") continue;
    const remainingRatio = credit.originalAmount > 0 ? credit.remainingAmount / credit.originalAmount : 0;
    const sprintsUntilExpiry = credit.expiresAtSprint - currentSprint;
    if (remainingRatio <= 0.2) {
      warnings.push(`Cloud credit ${credit.id} is below 20% remaining. Effective infrastructure burn may jump soon.`);
    }
    if (sprintsUntilExpiry <= 2) {
      warnings.push(`Cloud credit ${credit.id} expires within ${Math.max(0, sprintsUntilExpiry)} sprint${sprintsUntilExpiry === 1 ? "" : "s"}.`);
    }
    if (grossInfraBurn >= 1000 && credit.remainingAmount >= grossInfraBurn * 0.6) {
      warnings.push("Cloud credits are masking a large share of gross infrastructure burn. Watch the credit cliff.");
    }
  }
  return Array.from(new Set(warnings));
}

function textForSelection(input: InfrastructurePreviewInput): string {
  const startup = input.startup;
  return [
    startup?.sector,
    startup?.stage,
    startup?.status,
    startup?.monetizationModel,
    startup?.description,
    startup?.problem,
    startup?.solution,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function progress(input: InfrastructurePreviewInput): number {
  return Math.max(0, Math.round(input.startup?.productProgress ?? 0));
}

function latestUsers(input: InfrastructurePreviewInput): number {
  const history = input.simulationHistory ?? [];
  return 100 + history.reduce((sum, point) => sum + Math.max(0, Math.round(point.userGrowth ?? 0)), 0);
}

export function getInfrastructureStackOptions(input: InfrastructurePreviewInput): InfrastructureStackOption[] {
  const preview = buildInfrastructurePreview(input);
  const text = textForSelection(input);
  const users = latestUsers(input);
  const productProgress = progress(input);
  const revenue = Math.max(0, Math.round(input.startup?.revenue ?? 0));
  const regulated = hasAny(text, ["fintech", "finance", "payment", "health", "healthcare", "insurance", "banking", "security", "cyber", "enterprise"]);
  const dbHeavy = hasAny(text, ["database", "data", "analytics", "crm", "workflow", "records", "platform", "saas", "fintech"]);
  const aiRelated = preview.aiUsageTier !== "none" || hasAny(text, ["ai", "ml", "llm", "agent", "copilot", "automation", "inference"]);
  const lateStage = productProgress >= 60 || revenue >= 50_000 || users >= 25_000 || input.startup?.stage === "growth" || input.startup?.stage === "series_a";

  const optionFor = (stackId: string): InfrastructureStackOption => {
    const warnings: string[] = [];
    let allowed = true;
    let lockedReason: string | undefined;

    if (stackId === "supabase_neon_db" && !(dbHeavy || regulated || productProgress >= 25)) {
      allowed = false;
      lockedReason = "Unlocks once your product shows DB-heavy, SaaS, fintech, or stronger product progress.";
    }
    if (stackId === "ai_heavy_stack" && !aiRelated) {
      allowed = false;
      lockedReason = "Requires AI/ML, agentic, automation, or inference-heavy positioning.";
    }
    if (stackId === "aws_gcp_scale" && !(lateStage || users >= 20_000 || revenue >= 40_000)) {
      allowed = false;
      lockedReason = "Unlocks when usage, revenue, or product maturity justifies scale-cloud complexity.";
    }
    if (stackId === "enterprise_cloud" && !(regulated || lateStage || revenue >= 100_000)) {
      allowed = false;
      lockedReason = "Requires regulated/enterprise positioning or later-stage traction.";
    }

    if (stackId === "cheap_static_landing" && users >= 20_000) warnings.push("Cheap static stack saves burn but carries scaling and reliability risk at current traffic.");
    if (stackId === "replit_mvp" && productProgress >= 50) warnings.push("Replit MVP is fast, but this startup may be outgrowing prototype infrastructure.");
    if (stackId === "aws_gcp_scale" || stackId === "enterprise_cloud") warnings.push("Upgrade increases burn and complexity, but improves trust, security, and scaling posture.");
    if (stackId === "ai_heavy_stack") warnings.push("AI-heavy stack improves AI readiness but increases token/API bill shock exposure.");

    return { stackId, allowed, lockedReason, warnings };
  };

  const ordered = [
    preview.recommendedStackId,
    ...preview.alternateStackIds,
    "cheap_static_landing",
    "replit_mvp",
    "vercel_serverless",
    "render_full_stack",
    "supabase_neon_db",
    "ai_heavy_stack",
    "aws_gcp_scale",
    "enterprise_cloud",
    "cloudflare_edge",
  ];
  return Array.from(new Set(ordered))
    .filter((stackId) => getInfrastructureStack(stackId))
    .map(optionFor);
}

export function validateInfrastructureStackSelection(
  stackId: string,
  input: InfrastructurePreviewInput
): { valid: boolean; reason?: string; option?: InfrastructureStackOption } {
  const option = getInfrastructureStackOptions(input).find((candidate) => candidate.stackId === stackId);
  if (!option) return { valid: false, reason: "Unknown infrastructure stack." };
  if (!option.allowed) return { valid: false, reason: option.lockedReason ?? "Infrastructure stack is locked for this startup.", option };
  return { valid: true, option };
}

export function selectInfrastructureStackInState(input: {
  state: PersistentInfrastructureState;
  stackId: string;
  previewInput: InfrastructurePreviewInput;
  currentSprint: number;
}): { state: PersistentInfrastructureState; warnings: string[] } {
  const validation = validateInfrastructureStackSelection(input.stackId, input.previewInput);
  if (!validation.valid) {
    throw new Error(validation.reason ?? "Infrastructure stack selection rejected.");
  }
  if (
    input.state.selectedStackId &&
    input.state.selectedStackId !== input.stackId &&
    input.state.lastSwitchedSprint === input.currentSprint
  ) {
    throw new Error("Infrastructure stack can only be switched once per sprint.");
  }
  const warnings = [...(validation.option?.warnings ?? [])];
  if ((input.previewInput.currentSprint ?? input.currentSprint) >= 10) {
    warnings.push("Switching infrastructure during Demo Day Runway is allowed, but migration risk is elevated.");
  }
  return {
    state: {
      ...input.state,
      version: INFRASTRUCTURE_ECONOMY_VERSION,
      previousStackId: input.state.selectedStackId ?? null,
      selectedStackId: input.stackId,
      selectedAtSprint: input.currentSprint,
      lastSwitchedSprint: input.currentSprint,
      updatedAt: new Date().toISOString(),
    },
    warnings,
  };
}
