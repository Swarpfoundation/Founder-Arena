export const RUN_TOTAL_STEPS = 12;

export type RunStepStyle = "week" | "sprint";

export interface RunPhase {
  id: "launch_signal" | "market_proof" | "survive_or_scale" | "demo_day_runway";
  label: string;
  rangeLabel: string;
  tagline: string;
}

export type SprintPressureLevel = "early" | "rising" | "dangerous" | "demo_day";

export interface RunPhaseProgress {
  phaseIndex: number;
  stepWithinPhase: number;
  phaseTotalSteps: number;
  percentComplete: number;
}

const PHASES: Array<RunPhase & { min: number; max: number }> = [
  {
    id: "launch_signal",
    min: 1,
    max: 3,
    label: "Launch Signal",
    rangeLabel: "Weeks 1-3",
    tagline: "Find your first signal before the arena notices.",
  },
  {
    id: "market_proof",
    min: 4,
    max: 6,
    label: "Market Proof",
    rangeLabel: "Weeks 4-6",
    tagline: "Proof compounds or the market moves on.",
  },
  {
    id: "survive_or_scale",
    min: 7,
    max: 9,
    label: "Survive or Scale",
    rangeLabel: "Weeks 7-9",
    tagline: "Scale the signal or get crushed by burn.",
  },
  {
    id: "demo_day_runway",
    min: 10,
    max: 12,
    label: "Demo Day Runway",
    rangeLabel: "Weeks 10-12",
    tagline: "Every choice now feeds the Demo Day Verdict.",
  },
];

function normalizeStep(step: number | null | undefined): number {
  if (!Number.isFinite(step ?? NaN)) return 1;
  return Math.max(1, Math.min(RUN_TOTAL_STEPS, Math.trunc(step as number)));
}

export function getRunStepLabel(
  step: number | null | undefined,
  options: { style?: RunStepStyle } = {}
): string {
  const safeStep = normalizeStep(step);
  return `${options.style === "sprint" ? "Sprint" : "Week"} ${safeStep}`;
}

export function getShortRunStepLabel(
  step: number | null | undefined,
  options: { style?: RunStepStyle } = {}
): string {
  const safeStep = normalizeStep(step);
  return `${options.style === "sprint" ? "S" : "W"}${safeStep}`;
}

export function getRunPhase(step: number | null | undefined): RunPhase {
  const safeStep = normalizeStep(step);
  const phase = PHASES.find((item) => safeStep >= item.min && safeStep <= item.max) ?? PHASES[0];
  return {
    id: phase.id,
    label: phase.label,
    rangeLabel: phase.rangeLabel,
    tagline: phase.tagline,
  };
}

export function getRunPhaseLabel(step: number | null | undefined): string {
  return getRunPhase(step).label;
}

export function getRunPhaseTagline(step: number | null | undefined): string {
  return getRunPhase(step).tagline;
}

export function getRunPhaseProgress(step: number | null | undefined): RunPhaseProgress {
  const safeStep = normalizeStep(step);
  const phaseIndex = PHASES.findIndex((item) => safeStep >= item.min && safeStep <= item.max);
  const phase = PHASES[phaseIndex >= 0 ? phaseIndex : 0];
  const phaseTotalSteps = phase.max - phase.min + 1;
  const stepWithinPhase = safeStep - phase.min + 1;

  return {
    phaseIndex: (phaseIndex >= 0 ? phaseIndex : 0) + 1,
    stepWithinPhase,
    phaseTotalSteps,
    percentComplete: Math.round((stepWithinPhase / phaseTotalSteps) * 100),
  };
}

export function getNextRunPhase(step: number | null | undefined): RunPhase | null {
  const safeStep = normalizeStep(step);
  const currentIndex = PHASES.findIndex((item) => safeStep >= item.min && safeStep <= item.max);
  const next = PHASES[currentIndex + 1];
  if (!next) return null;
  return {
    id: next.id,
    label: next.label,
    rangeLabel: next.rangeLabel,
    tagline: next.tagline,
  };
}

export function getSprintPressureLevel(step: number | null | undefined): SprintPressureLevel {
  const safeStep = normalizeStep(step);
  if (safeStep >= 10) return "demo_day";
  if (safeStep >= 7) return "dangerous";
  if (safeStep >= 4) return "rising";
  return "early";
}

export function getSprintMilestoneLabel(step: number | null | undefined): string | null {
  const safeStep = normalizeStep(step);
  if (safeStep === 1) return "First Signal";
  if (safeStep === 3) return "Launch Signal Checkpoint";
  if (safeStep === 6) return "Market Proof Checkpoint";
  if (safeStep === 9) return "Survive or Scale Checkpoint";
  if (safeStep === 12) return "Demo Day Verdict";
  return null;
}

export function getSprintNextActionHint(
  step: number | null | undefined,
  startupState: { status?: string | null; hasTeam?: boolean } = {}
): string {
  const status = startupState.status ?? "";
  if (status === "completed" || status === "dead") {
    return "Review the story, career record, and arena ranking.";
  }
  if (!startupState.hasTeam && (status === "funded" || status === "active")) {
    return "Build the team or run the next sprint to create a stronger signal.";
  }

  const pressure = getSprintPressureLevel(step);
  if (pressure === "demo_day") return "Make the final sprint choices count; Demo Day is close.";
  if (pressure === "dangerous") return "Pressure is rising. Protect runway while scaling the strongest signal.";
  if (pressure === "rising") return "Turn early activity into market proof before the arena moves on.";
  return "Create the first market signal and decide what deserves the next sprint.";
}

export function getDemoDayCountdown(step: number | null | undefined): string {
  const safeStep = normalizeStep(step);
  const remaining = RUN_TOTAL_STEPS - safeStep;
  if (remaining <= 0) return getFinalVerdictLabel();
  if (remaining === 1) return "Demo Day is next";
  return `${remaining} sprints to Demo Day`;
}

export function formatRunDuration(stepCount: number = RUN_TOTAL_STEPS): string {
  const safeCount = Number.isFinite(stepCount) && stepCount > 0 ? Math.trunc(stepCount) : RUN_TOTAL_STEPS;
  return `${safeCount} Founder Week${safeCount === 1 ? "" : "s"}`;
}

export function formatTimelineMoment(step: number | null | undefined): string {
  return getRunStepLabel(step);
}

export function isDemoDayStep(step: number | null | undefined): boolean {
  return normalizeStep(step) >= RUN_TOTAL_STEPS;
}

export function getDemoDayLabel(): string {
  return "Demo Day";
}

export function getFinalVerdictLabel(): string {
  return "Demo Day Verdict";
}

export function formatFinancialPeriod(): string {
  return "monthly";
}

export function formatFinancialMetricLabel(label: string): string {
  const normalized = label.trim();
  const lower = normalized.toLowerCase();

  if (lower === "burn" || lower === "monthly burn") return "Monthly Burn";
  if (lower === "runway") return "Runway";
  if (lower === "revenue" || lower === "mrr") return "MRR";
  if (lower === "salary") return "Salary/mo";

  return normalized;
}
