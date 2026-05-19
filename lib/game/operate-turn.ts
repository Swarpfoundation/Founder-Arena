import type { DecisionOption } from "@/lib/simulation/decisions";
import type { RecapHighlight } from "@/components/game/StatDeltaRecap";
import type { StatDeltaItem } from "@/lib/gamefeel/ceremony";

export type OperateAccent = "cyan" | "violet" | "rose" | "amber" | "emerald" | "white";
export type OperateThreatSeverity = "critical" | "warning" | "opportunity" | "info";

export interface ActionCardPresentation {
  id: string;
  title: string;
  description: string;
  accent: OperateAccent;
  tags: string[];
  upside: string;
  tradeoff: string;
  costLabel: string;
  burnLabel: string;
  effectPreview: string[];
  lockedReason?: string;
  selected: boolean;
}

export interface ThreatRadarItem {
  id: string;
  label: string;
  severity: OperateThreatSeverity;
  description: string;
  href?: string;
}

export interface EndSprintConsolePresentation {
  canRun: boolean;
  label: string;
  statusLine: string;
  warning?: string;
  selectedCount: number;
  resolves: string[];
}

export interface ResolutionStage {
  id: string;
  label: string;
  description: string;
  tone: OperateAccent;
}

export function getActionCardPresentation(
  decision: DecisionOption,
  options: {
    selected?: boolean;
    lockedReason?: string;
  } = {}
): ActionCardPresentation {
  const tags = getDecisionTags(decision);
  return {
    id: decision.id,
    title: decision.label,
    description: decision.description,
    accent: getDecisionAccent(decision),
    tags,
    upside: getDecisionUpside(decision),
    tradeoff: getDecisionTradeoff(decision),
    costLabel: decision.cashCost > 0 ? `-$${formatK(decision.cashCost)}` : "No cash cost",
    burnLabel: formatSignedMoney(decision.burnDelta, "/mo burn"),
    effectPreview: buildEffectPreview(decision),
    lockedReason: options.lockedReason,
    selected: options.selected ?? false,
  };
}

export function getLockedDecisionReason(
  decision: DecisionOption,
  input: {
    cash: number;
    productProgress: number;
    month: number;
  }
): string | undefined {
  if (decision.cashCost > input.cash && decision.id !== "cut_costs") {
    return `Requires $${formatK(decision.cashCost)} cash.`;
  }
  if (decision.minProductProgress && input.productProgress < decision.minProductProgress) {
    return `Requires ${decision.minProductProgress}% product progress.`;
  }
  if (input.month <= 1 && (decision.id === "launch_beta" || decision.id === "enterprise_push")) {
    return "Locked until the first sprint creates an operating signal.";
  }
  return undefined;
}

export function getThreatRadarItems(input: {
  startupId: string;
  cash: number;
  monthlyBurn: number;
  revenue: number;
  riskScore?: number | null;
  investorScore?: number | null;
  currentMonth: number;
  monthlyEvent?: { title: string; severity: "minor" | "moderate" | "critical" } | null;
  openInfrastructureEvent?: { title: string; severity: "minor" | "moderate" | "critical" } | null;
  nextMoves?: Array<{ id: string; title: string; urgency: "low" | "medium" | "high" | "critical"; whyItMatters: string }>;
}): ThreatRadarItem[] {
  const runwayMonths = Math.floor(input.cash / Math.max(input.monthlyBurn, 1));
  const items: ThreatRadarItem[] = [];

  if (runwayMonths <= 3) {
    items.push({
      id: "runway-critical",
      label: "Runway Critical",
      severity: "critical",
      description: `${runwayMonths} month${runwayMonths === 1 ? "" : "s"} of runway left. Survival choices matter now.`,
    });
  } else if (runwayMonths <= 6) {
    items.push({
      id: "runway-warning",
      label: "Runway Pressure",
      severity: "warning",
      description: `${runwayMonths} months of runway. Burn discipline is becoming strategic.`,
    });
  }

  if ((input.riskScore ?? 0) >= 75) {
    items.push({
      id: "risk-score",
      label: "Risk Near Failure Band",
      severity: "critical",
      description: "Operational risk is high enough to threaten investor confidence and survival.",
    });
  }

  if ((input.investorScore ?? 100) <= 30) {
    items.push({
      id: "investor-score",
      label: "Investor Confidence Low",
      severity: "warning",
      description: "Investor score is weak. Funding narrative needs repair.",
    });
  }

  if (input.currentMonth >= 9 && input.revenue <= 0) {
    items.push({
      id: "late-no-revenue",
      label: "No Revenue Near Demo Day",
      severity: "critical",
      description: "The run is late and still has no revenue signal.",
    });
  }

  if (input.openInfrastructureEvent) {
    items.push({
      id: "infra-event",
      label: "Infrastructure Incident",
      severity: input.openInfrastructureEvent.severity === "critical" ? "critical" : "warning",
      description: input.openInfrastructureEvent.title,
      href: `/startup/${input.startupId}/infrastructure`,
    });
  }

  if (input.monthlyEvent) {
    items.push({
      id: "monthly-event",
      label: "Sprint Event Pending",
      severity: input.monthlyEvent.severity === "critical" ? "critical" : "warning",
      description: input.monthlyEvent.title,
    });
  }

  for (const move of input.nextMoves ?? []) {
    if (move.urgency === "critical" || move.urgency === "high") {
      items.push({
        id: `next-move-${move.id}`,
        label: move.title,
        severity: move.urgency === "critical" ? "critical" : "warning",
        description: move.whyItMatters,
      });
    }
  }

  return items.sort((a, b) => severityRank(b.severity) - severityRank(a.severity)).slice(0, 5);
}

export function getEndSprintConsolePresentation(input: {
  selectedCount: number;
  eventResolved: boolean;
  pending: boolean;
  currentWeek: number;
  runwayMonths: number;
  hasMonthlyEvent: boolean;
}): EndSprintConsolePresentation {
  const canRun = input.selectedCount > 0 && input.eventResolved && !input.pending;
  const resolves = [
    "burn and revenue",
    "market pressure",
    "rivals",
    "board confidence",
    "runway",
  ];
  if (input.hasMonthlyEvent) resolves.unshift("sprint event response");

  if (input.pending) {
    return {
      canRun: false,
      label: "Resolving Sprint",
      statusLine: "Command turn is resolving. Do not refresh unless the request fails.",
      selectedCount: input.selectedCount,
      resolves,
    };
  }

  if (!input.eventResolved) {
    return {
      canRun: false,
      label: "Resolve Event First",
      statusLine: "A live incident requires a response before the sprint can end.",
      selectedCount: input.selectedCount,
      resolves,
    };
  }

  if (input.selectedCount === 0) {
    return {
      canRun: false,
      label: "Select Action",
      statusLine: `Choose up to three sprint actions for Week ${input.currentWeek}.`,
      selectedCount: 0,
      resolves,
    };
  }

  return {
    canRun,
    label: "End Sprint",
    statusLine: `${input.selectedCount} action${input.selectedCount === 1 ? "" : "s"} armed for resolution.`,
    warning: input.runwayMonths <= 3 ? "Runway is critical. This sprint can decide survival." : undefined,
    selectedCount: input.selectedCount,
    resolves,
  };
}

export function buildResolutionStages(input: {
  recap?: { deltas: StatDeltaItem[]; highlights: RecapHighlight[]; nextAction?: { label: string; href: string } } | null;
  finalOutcome?: string | null;
}): ResolutionStage[] {
  const deltas = input.recap?.deltas ?? [];
  const highlights = input.recap?.highlights ?? [];
  const hasMoney = deltas.some((delta) => delta.id === "cash" || delta.id === "burn" || delta.id === "revenue" || delta.id === "runway");
  const hasProduct = deltas.some((delta) => delta.id === "product" || delta.id === "trust" || delta.id === "brand");
  const hasIncidents = highlights.some((h) => ["Event", "Rival Move", "Boardroom", "Infrastructure", "Arena Feed"].includes(h.label));

  const stages: ResolutionStage[] = [
    {
      id: "action-executed",
      label: "Action Executed",
      description: "The selected sprint actions were committed to the run.",
      tone: "cyan",
    },
  ];

  if (hasMoney) {
    stages.push({
      id: "financial-movement",
      label: "Financial Movement",
      description: "Cash, burn, revenue, and runway were recalculated by the simulation engine.",
      tone: "emerald",
    });
  }

  if (hasProduct) {
    stages.push({
      id: "traction-movement",
      label: "Product / Traction Movement",
      description: "Product progress, user trust, and brand risk were resolved.",
      tone: "violet",
    });
  }

  if (hasIncidents) {
    stages.push({
      id: "incident-scan",
      label: "Incident Scan",
      description: "Market, social, rival, boardroom, and infrastructure reactions were checked.",
      tone: "amber",
    });
  }

  stages.push({
    id: "next-objective",
    label: input.finalOutcome ? "Final Verdict Ready" : "Next Objective",
    description: input.finalOutcome
      ? `${input.finalOutcome} is ready for documentary, career, and arena review.`
      : input.recap?.nextAction?.label ?? "Review the next objective and continue the run.",
    tone: input.finalOutcome ? "rose" : "cyan",
  });

  return stages;
}

function getDecisionAccent(decision: DecisionOption): OperateAccent {
  if (decision.id === "cut_costs") return "amber";
  if (decision.riskDelta <= -5) return "emerald";
  if (decision.revenueDelta >= 8000) return "violet";
  if (decision.productDelta >= 10) return "cyan";
  if (decision.investorDelta >= 6) return "amber";
  return "white";
}

function getDecisionTags(decision: DecisionOption): string[] {
  const tags = new Set<string>();
  if (decision.productDelta > 0) tags.add("Product");
  if (decision.revenueDelta > 0) tags.add("Revenue");
  if (decision.investorDelta > 0) tags.add("Investor");
  if (decision.riskDelta < 0) tags.add("Risk Down");
  if (decision.riskDelta > 0) tags.add("Risk Up");
  if (decision.burnDelta < 0) tags.add("Survival");
  if (decision.id.includes("enterprise")) tags.add("Enterprise");
  if (decision.id.includes("security") || decision.id.includes("compliance")) tags.add("Security");
  if (decision.id.includes("marketing")) tags.add("Hype");
  return Array.from(tags).slice(0, 4);
}

function getDecisionUpside(decision: DecisionOption): string {
  const effects = buildEffectPreview(decision).filter((effect) => effect.startsWith("+") || effect.startsWith("-Risk"));
  return effects[0] ?? "Strategic positioning";
}

function getDecisionTradeoff(decision: DecisionOption): string {
  if (decision.cashCost > 0 || decision.burnDelta > 0) return "Consumes runway.";
  if (decision.productDelta < 0 || decision.revenueDelta < 0) return "Sacrifices momentum.";
  if (decision.riskDelta > 0) return "Raises execution risk.";
  return "Low direct downside.";
}

function buildEffectPreview(decision: DecisionOption): string[] {
  return [
    decision.productDelta ? formatSignedNumber(decision.productDelta, "Product") : null,
    decision.revenueDelta ? formatSignedMoney(decision.revenueDelta, "MRR") : null,
    decision.investorDelta ? formatSignedNumber(decision.investorDelta, "Investor") : null,
    decision.marketDelta ? formatSignedNumber(decision.marketDelta, "Market") : null,
    decision.riskDelta ? formatSignedNumber(decision.riskDelta, "Risk") : null,
  ].filter((item): item is string => Boolean(item));
}

function formatK(value: number): string {
  return `${Math.round(value / 1000)}K`;
}

function formatSignedMoney(value: number, label: string): string {
  if (value === 0) return `$0 ${label}`;
  const prefix = value > 0 ? "+" : "-";
  return `${prefix}$${formatK(Math.abs(value))} ${label}`;
}

function formatSignedNumber(value: number, label: string): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value} ${label}`;
}

function severityRank(severity: OperateThreatSeverity): number {
  if (severity === "critical") return 4;
  if (severity === "warning") return 3;
  if (severity === "opportunity") return 2;
  return 1;
}
