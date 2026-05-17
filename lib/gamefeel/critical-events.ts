import type { CeremonyAccent } from "@/lib/gamefeel/ceremony";
import { getRunStepLabel } from "@/lib/game-time/time-scale";

export type CriticalEventTone =
  | "danger"
  | "warning"
  | "viral"
  | "rival"
  | "boardroom"
  | "acquisition"
  | "breakout"
  | "death"
  | "strategy"
  | "leaderboard"
  | "neutral";

export type CriticalEventSeverity = "low" | "medium" | "high" | "critical";

export interface CriticalEventStat {
  label: string;
  value: string | number;
  delta?: string | number;
  accent?: CeremonyAccent;
}

export interface CriticalEventCta {
  label: string;
  href: string;
}

export interface CriticalEventPresentation {
  type: CriticalEventTone;
  severity: CriticalEventSeverity;
  eyebrow: string;
  title: string;
  subtitle?: string;
  accent: CeremonyAccent;
  primaryCta?: CriticalEventCta;
  secondaryCta?: CriticalEventCta;
  affectedStats?: CriticalEventStat[];
  displayKey?: string;
}

export function eventAccent(type: CriticalEventTone): CeremonyAccent {
  switch (type) {
    case "danger":
    case "death":
    case "rival":
      return "rose";
    case "warning":
    case "boardroom":
    case "acquisition":
    case "leaderboard":
      return "amber";
    case "viral":
    case "breakout":
      return "emerald";
    case "strategy":
      return "violet";
    default:
      return "cyan";
  }
}

export function normalizeCriticalSeverity(severity?: string | null): CriticalEventSeverity {
  const key = (severity ?? "medium").toLowerCase();
  if (key === "critical") return "critical";
  if (key === "high" || key === "moderate" || key === "warning") return "high";
  if (key === "minor" || key === "low" || key === "positive" || key === "neutral") return "low";
  return "medium";
}

export function buildCriticalEventKey(parts: Array<string | number | null | undefined>): string {
  return parts.filter((part) => part !== null && part !== undefined && String(part).length > 0).join(":");
}

export function buildSimulationEventPresentation(input: {
  startupId: string;
  event?: {
    id: string;
    title: string;
    narrative?: string;
    category?: string;
    severity?: string;
  } | null;
}): CriticalEventPresentation | null {
  if (!input.event) return null;
  const severity = normalizeCriticalSeverity(input.event.severity);
  const type: CriticalEventTone =
    input.event.category === "viral"
      ? "viral"
      : input.event.category === "competitor"
        ? "rival"
        : severity === "critical"
          ? "danger"
          : "warning";

  return {
    type,
    severity,
    eyebrow: severity === "critical" ? "Critical Event" : "Event Interrupt",
    title: input.event.title,
    subtitle: input.event.narrative,
    accent: eventAccent(type),
    primaryCta: { label: "Resolve Event", href: `/startup/${input.startupId}/operate` },
    affectedStats: [
      { label: "Severity", value: severity.toUpperCase(), accent: eventAccent(type) },
      { label: "Signal", value: (input.event.category ?? "event").toUpperCase(), accent: "cyan" },
    ],
    displayKey: buildCriticalEventKey(["simulation", input.startupId, input.event.id]),
  };
}

export function buildBoardroomPresentation(input: {
  startupId: string;
  event?: {
    id: string;
    title: string;
    concern?: string;
    pressureType?: string;
    severity?: string;
  } | null;
  boardConfidence?: number;
  investorPatience?: number;
  founderControl?: number;
}): CriticalEventPresentation | null {
  if (!input.event) return null;
  const severity = normalizeCriticalSeverity(input.event.severity);
  return {
    type: "boardroom",
    severity,
    eyebrow: severity === "critical" ? "Board Summons" : "Investor Pressure",
    title: input.event.title,
    subtitle: input.event.concern,
    accent: severity === "critical" ? "rose" : "amber",
    primaryCta: { label: "Enter Boardroom", href: `/startup/${input.startupId}/boardroom` },
    secondaryCta: { label: "Continue Operating", href: `/startup/${input.startupId}/operate` },
    affectedStats: [
      { label: "Pressure", value: (input.event.pressureType ?? "board").replace(/_/g, " ").toUpperCase(), accent: "amber" },
      ...(typeof input.boardConfidence === "number" ? [{ label: "Board", value: input.boardConfidence, accent: "cyan" as CeremonyAccent }] : []),
      ...(typeof input.investorPatience === "number" ? [{ label: "Patience", value: input.investorPatience, accent: "violet" as CeremonyAccent }] : []),
      ...(typeof input.founderControl === "number" ? [{ label: "Control", value: input.founderControl, accent: "emerald" as CeremonyAccent }] : []),
    ],
    displayKey: buildCriticalEventKey(["boardroom", input.startupId, input.event.id]),
  };
}

export function buildRivalMovePresentation(input: {
  startupId: string;
  move?: {
    id: string;
    rivalName?: string;
    title?: string;
    description?: string;
    type?: string;
    severity?: string;
    month?: number;
  } | null;
}): CriticalEventPresentation | null {
  if (!input.move) return null;
  const severity = normalizeCriticalSeverity(input.move.severity);
  return {
    type: "rival",
    severity,
    eyebrow: severity === "critical" ? "Rival Attack" : "Rival Move Detected",
    title: input.move.title ?? "Rival Move Detected",
    subtitle: input.move.description,
    accent: severity === "critical" ? "rose" : "amber",
    primaryCta: { label: "View Rivals", href: `/startup/${input.startupId}/rivals` },
    secondaryCta: { label: "Counter", href: `/startup/${input.startupId}/rivals` },
    affectedStats: [
      { label: "Rival", value: input.move.rivalName ?? "Unknown", accent: "rose" },
      { label: "Move", value: (input.move.type ?? "move").replace(/_/g, " ").toUpperCase(), accent: "amber" },
      ...(typeof input.move.month === "number" ? [{ label: "Week", value: getRunStepLabel(input.move.month), accent: "cyan" as CeremonyAccent }] : []),
    ],
    displayKey: buildCriticalEventKey(["rival", input.startupId, input.move.id]),
  };
}

export function buildSocialPresentation(input: {
  startupId: string;
  didBackfire?: boolean;
  viralMomentumDelta?: number;
  hypeDelta?: number;
  trustDelta?: number;
  brandRiskDelta?: number;
}): CriticalEventPresentation {
  const isCrisis = !!input.didBackfire || (input.brandRiskDelta ?? 0) > 0;
  const isViral = !isCrisis && ((input.viralMomentumDelta ?? 0) > 0 || (input.hypeDelta ?? 0) > 0);
  const type: CriticalEventTone = isCrisis ? "danger" : isViral ? "viral" : "neutral";

  return {
    type,
    severity: isCrisis ? "critical" : isViral ? "high" : "medium",
    eyebrow: isCrisis ? "Brand Crisis" : isViral ? "Viral Spike" : "Arena Signal",
    title: isCrisis ? "Brand Crisis Triggered" : isViral ? "Viral Spike Detected" : "Arena Post Live",
    subtitle: isCrisis
      ? "The feed punished the move. Trust, risk, and investor pressure may now become harder to manage."
      : isViral
        ? "The market is reacting. Convert attention into durable traction before rivals exploit it."
        : "The social layer reacted and updated the run state.",
    accent: eventAccent(type),
    primaryCta: { label: isCrisis ? "Damage Control" : "View Arena Feed", href: `/startup/${input.startupId}/social` },
    affectedStats: [
      ...(input.hypeDelta ? [{ label: "Hype", value: input.hypeDelta > 0 ? `+${input.hypeDelta}` : input.hypeDelta, accent: "violet" as CeremonyAccent }] : []),
      ...(input.trustDelta ? [{ label: "Trust", value: input.trustDelta > 0 ? `+${input.trustDelta}` : input.trustDelta, accent: input.trustDelta > 0 ? "emerald" as CeremonyAccent : "rose" as CeremonyAccent }] : []),
      ...(input.brandRiskDelta ? [{ label: "Brand Risk", value: input.brandRiskDelta > 0 ? `+${input.brandRiskDelta}` : input.brandRiskDelta, accent: "rose" as CeremonyAccent }] : []),
      ...(input.viralMomentumDelta ? [{ label: "Momentum", value: input.viralMomentumDelta > 0 ? `+${input.viralMomentumDelta}` : input.viralMomentumDelta, accent: "amber" as CeremonyAccent }] : []),
    ],
    displayKey: buildCriticalEventKey(["social", input.startupId, isCrisis ? "crisis" : "viral"]),
  };
}

export function buildDeathWarningPresentations(input: {
  startupId: string;
  cash: number;
  monthlyBurn: number;
  riskScore?: number | null;
  investorScore?: number | null;
  revenue: number;
  currentMonth: number;
}): CriticalEventPresentation[] {
  const runway = input.monthlyBurn > 0 ? Math.floor(input.cash / input.monthlyBurn) : 99;
  const warnings: CriticalEventPresentation[] = [];

  if (runway <= 2) {
    warnings.push({
      type: "death",
      severity: "critical",
      eyebrow: "Death Spiral Warning",
      title: "Runway Critical",
      subtitle: "Cash is close to zero. One bad sprint can end the company.",
      accent: "rose",
      primaryCta: { label: "Operate Carefully", href: `/startup/${input.startupId}/operate` },
      affectedStats: [
        { label: "Runway", value: `${runway} mo`, accent: "rose" },
        { label: "Cash", value: `$${Math.round(input.cash / 1000)}K`, accent: "cyan" },
      ],
      displayKey: buildCriticalEventKey(["warning", input.startupId, "runway", input.currentMonth]),
    });
  }

  if ((input.riskScore ?? 0) >= 85) {
    warnings.push({
      type: "danger",
      severity: "critical",
      eyebrow: "Catastrophic Risk Near",
      title: "Risk Score Near Failure Threshold",
      subtitle: "The run is unstable. Reduce risk before a crisis chain takes over.",
      accent: "rose",
      primaryCta: { label: "Review Strategy", href: `/startup/${input.startupId}/strategy` },
      affectedStats: [{ label: "Risk", value: input.riskScore ?? 0, accent: "rose" }],
      displayKey: buildCriticalEventKey(["warning", input.startupId, "risk", input.currentMonth]),
    });
  }

  if ((input.investorScore ?? 100) <= 25) {
    warnings.push({
      type: "boardroom",
      severity: "high",
      eyebrow: "Investor Confidence Collapsing",
      title: "Investor Patience Is Running Out",
      subtitle: "Low investor confidence can compound into board pressure and failed fundraising.",
      accent: "amber",
      primaryCta: { label: "View Boardroom", href: `/startup/${input.startupId}/boardroom` },
      affectedStats: [{ label: "Investor", value: input.investorScore ?? 0, accent: "amber" }],
      displayKey: buildCriticalEventKey(["warning", input.startupId, "investor", input.currentMonth]),
    });
  }

  if (input.currentMonth >= 6 && input.revenue <= 0) {
    warnings.push({
      type: "warning",
      severity: "high",
      eyebrow: "No Traction Warning",
      title: "Revenue Is Still Zero",
      subtitle: "The arena will not reward motion without traction. Find revenue before Demo Day.",
      accent: "amber",
      primaryCta: { label: "Run Next Sprint", href: `/startup/${input.startupId}/operate` },
      affectedStats: [{ label: "Revenue", value: "$0", accent: "rose" }],
      displayKey: buildCriticalEventKey(["warning", input.startupId, "traction", input.currentMonth]),
    });
  }

  return warnings;
}
