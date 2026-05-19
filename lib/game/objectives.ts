import {
  getRunPhaseLabel,
  getRunStepLabel,
  getSprintPressureLevel,
  type SprintPressureLevel,
} from "@/lib/game-time/time-scale";

export type ObjectiveSeverity = "neutral" | "focus" | "warning" | "critical" | "success";
export type ObjectiveCategory =
  | "deployment"
  | "pitch"
  | "review"
  | "funding"
  | "operations"
  | "infrastructure"
  | "boardroom"
  | "rivals"
  | "story"
  | "arena";

export interface GameObjective {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  severity: ObjectiveSeverity;
  category: ObjectiveCategory;
}

export interface RunSlotPresentation {
  label: string;
  eyebrow: string;
  href: string;
  accent: "cyan" | "violet" | "rose" | "amber" | "emerald" | "white";
  kind: "active" | "setup" | "archive";
}

export interface StartupObjectiveInput {
  id: string;
  status: string;
  name?: string | null;
  publicSlug?: string | null;
  finalOutcome?: string | null;
  cash?: number | null;
  monthlyBurn?: number | null;
  pitchDeck?: unknown | null;
  vcReviews?: Array<{ decision?: string | null }> | null;
  termSheets?: Array<{ status?: string | null }> | null;
  simulationMonths?: Array<{ monthNumber?: number | null }> | null;
  openInfrastructureEvent?: boolean;
  openBoardroomEvent?: boolean;
  hasPendingReviewJob?: boolean;
  hasRivalThreat?: boolean;
}

export function getStartupRunStep(startup: Pick<StartupObjectiveInput, "status" | "simulationMonths">): number {
  const completed = startup.status === "completed" || startup.status === "dead";
  const months = startup.simulationMonths?.length ?? 0;
  return completed ? Math.max(1, Math.min(12, months || 12)) : Math.max(1, Math.min(12, months + 1));
}

function hasInvestableReview(startup: StartupObjectiveInput): boolean {
  const latest = startup.vcReviews?.[0];
  return latest?.decision === "proposal" || latest?.decision === "accept";
}

function hasAcceptedTerms(startup: StartupObjectiveInput): boolean {
  return startup.termSheets?.some((term) => term.status === "accepted") ?? false;
}

export function getNextObjective(startup: StartupObjectiveInput): GameObjective {
  const runStep = getStartupRunStep(startup);
  const startupName = startup.name ?? "this run";

  if (startup.status === "completed" || startup.status === "dead") {
    return {
      title: "Review the final story",
      description: `${startupName} has reached a final verdict. Open the documentary, career record, or arena ranking.`,
      ctaLabel: "View Story",
      href: `/startup/${startup.id}/documentary`,
      severity: startup.status === "dead" ? "warning" : "success",
      category: "story",
    };
  }

  if (startup.openInfrastructureEvent) {
    return {
      title: "Resolve infrastructure incident",
      description: "An infrastructure event is active. Stabilize the stack before running another sprint.",
      ctaLabel: "Open Infra Console",
      href: `/startup/${startup.id}/infrastructure`,
      severity: "critical",
      category: "infrastructure",
    };
  }

  if (startup.openBoardroomEvent) {
    return {
      title: "Answer the board",
      description: "Investor pressure is live. Pick a boardroom response before the run loses confidence.",
      ctaLabel: "Enter Boardroom",
      href: `/startup/${startup.id}/boardroom`,
      severity: "critical",
      category: "boardroom",
    };
  }

  if (startup.hasRivalThreat) {
    return {
      title: "Counter rival pressure",
      description: "A rival founder is moving against your narrative. Review the threat and decide whether to answer.",
      ctaLabel: "View Rivals",
      href: `/startup/${startup.id}/rivals`,
      severity: "warning",
      category: "rivals",
    };
  }

  if (startup.status === "draft" && !startup.pitchDeck) {
    return {
      title: "Complete the pitch deck",
      description: "Turn the venture brief into an investor-ready pitch before asking the committee for capital.",
      ctaLabel: "Build Pitch",
      href: `/startup/${startup.id}/pitch`,
      severity: "focus",
      category: "pitch",
    };
  }

  if (startup.hasPendingReviewJob) {
    return {
      title: "VC review is processing",
      description: "The private beta review queue is evaluating your pitch. Check the verdict chamber for status.",
      ctaLabel: "Check Review",
      href: `/startup/${startup.id}/review`,
      severity: "focus",
      category: "review",
    };
  }

  if ((startup.status === "draft" || startup.status === "pitching") && (startup.vcReviews?.length ?? 0) === 0) {
    return {
      title: "Submit VC review",
      description: "The pitch is ready for the investor chamber. Submit it to unlock funding terms.",
      ctaLabel: "Submit Pitch",
      href: `/startup/${startup.id}/pitch`,
      severity: "focus",
      category: "review",
    };
  }

  if (hasInvestableReview(startup) && !hasAcceptedTerms(startup) && startup.status !== "funded" && startup.status !== "active") {
    return {
      title: "Negotiate the term sheet",
      description: "The committee is open to a deal. Inspect dilution, control, and runway before taking capital.",
      ctaLabel: "Review Terms",
      href: `/startup/${startup.id}/terms`,
      severity: "warning",
      category: "funding",
    };
  }

  if (startup.status === "funded" && (startup.simulationMonths?.length ?? 0) === 0) {
    return {
      title: "Run Sprint 1",
      description: "Capital is live. Choose your first operating moves and create the first market signal.",
      ctaLabel: "Start Sprint",
      href: `/startup/${startup.id}/operate`,
      severity: "focus",
      category: "operations",
    };
  }

  if (startup.status === "funded" || startup.status === "active") {
    const pressure = getSprintPressureLevel(runStep);
    return {
      title: `Run ${getRunStepLabel(runStep)}`,
      description: `${getRunPhaseLabel(runStep)} is active. ${getPressureObjectiveCopy(pressure)}`,
      ctaLabel: "Resume Operation",
      href: `/startup/${startup.id}/operate`,
      severity: pressure === "demo_day" || pressure === "dangerous" ? "warning" : "focus",
      category: "operations",
    };
  }

  return {
    title: "Open operation profile",
    description: "Review this venture slot and choose the next move.",
    ctaLabel: "Open Run",
    href: `/startup/${startup.id}`,
    severity: "neutral",
    category: "arena",
  };
}

function getPressureObjectiveCopy(pressure: SprintPressureLevel): string {
  if (pressure === "demo_day") return "Demo Day is close; every choice now shapes the final verdict.";
  if (pressure === "dangerous") return "Runway pressure is rising; protect the strongest signal.";
  if (pressure === "rising") return "Convert traction into proof before the market moves on.";
  return "Find the first signal before rivals and investors harden their judgment.";
}

export function getDashboardObjective(startups: StartupObjectiveInput[]): GameObjective {
  const active = pickPrimaryStartup(startups);
  if (!active) {
    return {
      title: "Deploy your first startup",
      description: "Choose a venture archetype, pitch the committee, and enter the 12-week arena.",
      ctaLabel: "Deploy Startup",
      href: "/startup/new",
      severity: "focus",
      category: "deployment",
    };
  }
  return getNextObjective(active);
}

export function pickPrimaryStartup<T extends StartupObjectiveInput>(startups: T[]): T | null {
  const priority = ["active", "funded", "pitching", "draft", "completed", "dead"];
  return [...startups].sort((a, b) => priority.indexOf(a.status) - priority.indexOf(b.status))[0] ?? null;
}

export function getRunSlotPresentation(startup: StartupObjectiveInput): RunSlotPresentation {
  if (startup.status === "dead") {
    return {
      label: "FALLEN RUN",
      eyebrow: "Archived Operation",
      href: startup.publicSlug ? `/s/${startup.publicSlug}` : `/startup/${startup.id}/documentary`,
      accent: "rose",
      kind: "archive",
    };
  }

  if (startup.status === "completed") {
    return {
      label: startup.finalOutcome ? startup.finalOutcome.replace(/_/g, " ") : "DEMO DAY VERDICT",
      eyebrow: "Archived Victory",
      href: startup.publicSlug ? `/s/${startup.publicSlug}` : `/startup/${startup.id}/documentary`,
      accent: "emerald",
      kind: "archive",
    };
  }

  if (startup.status === "funded" || startup.status === "active") {
    return {
      label: "ACTIVE OPERATION",
      eyebrow: "Run Slot",
      href: `/startup/${startup.id}/operate`,
      accent: "cyan",
      kind: "active",
    };
  }

  if (startup.status === "pitching") {
    return {
      label: "INVESTOR GATE",
      eyebrow: "Run Setup",
      href: `/startup/${startup.id}/review`,
      accent: "violet",
      kind: "setup",
    };
  }

  return {
    label: "DEPLOYMENT BRIEF",
    eyebrow: "Run Setup",
    href: `/startup/${startup.id}/pitch`,
    accent: "amber",
    kind: "setup",
  };
}
