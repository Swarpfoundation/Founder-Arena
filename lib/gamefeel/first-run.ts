export type StartupRunPhase = "draft" | "pitch" | "funding" | "operate" | "finalized";

export interface FirstRunAction {
  label: string;
  href: string;
  description: string;
  phase: StartupRunPhase;
}

export interface RunPhaseStep {
  key: StartupRunPhase;
  label: string;
  state: "complete" | "current" | "locked";
}

export function getStartupRunPhase(status?: string | null): StartupRunPhase {
  if (status === "completed" || status === "dead") return "finalized";
  if (status === "funded" || status === "active") return "operate";
  if (status === "pitching") return "funding";
  return "pitch";
}

export function buildFirstRunAction(input: {
  startupId?: string | null;
  status?: string | null;
  hasPitch?: boolean;
  hasReview?: boolean;
  hasFunding?: boolean;
  monthsRun?: number;
  teamSize?: number;
}): FirstRunAction {
  const id = input.startupId;

  if (!id) {
    return {
      label: "Deploy Startup",
      href: "/startup/new",
      description: "Create the company that will enter the Founder Arena.",
      phase: "draft",
    };
  }

  if (!input.hasPitch) {
    return {
      label: "Build Pitch",
      href: `/startup/${id}/pitch`,
      description: "Turn the venture brief into an investor-ready pitch console.",
      phase: "pitch",
    };
  }

  if (!input.hasReview) {
    return {
      label: "Enter VC Review",
      href: `/startup/${id}/pitch`,
      description: "Submit the pitch and trigger the investor verdict.",
      phase: "pitch",
    };
  }

  if (!input.hasFunding) {
    return {
      label: "Negotiate Terms",
      href: `/startup/${id}/terms`,
      description: "Close or reject the term sheet before the company can operate.",
      phase: "funding",
    };
  }

  if ((input.monthsRun ?? 0) === 0 && (input.status === "funded" || input.status === "active")) {
    return {
      label: "Run Sprint 1",
      href: `/startup/${id}/operate`,
      description: "Choose the first operating decision and generate your first arena signal.",
      phase: "operate",
    };
  }

  if ((input.teamSize ?? 0) === 0 && (input.status === "funded" || input.status === "active")) {
    return {
      label: "Open Team",
      href: `/startup/${id}/team`,
      description: "Add your first operator before pressure compounds.",
      phase: "operate",
    };
  }

  if (input.status === "completed" || input.status === "dead") {
    return {
      label: "View Story",
      href: `/startup/${id}/documentary`,
      description: "The run is finalized. Review the story, career record, and arena ranking.",
      phase: "finalized",
    };
  }

  return {
    label: "Continue Run",
    href: `/startup/${id}/operate`,
    description: "Keep operating through sprint pressure until the run resolves.",
    phase: "operate",
  };
}

export function buildRunPhaseSteps(status?: string | null): RunPhaseStep[] {
  const current = getStartupRunPhase(status);
  const order: RunPhaseStep[] = [
    { key: "pitch", label: "Pitch", state: "locked" },
    { key: "funding", label: "Fund", state: "locked" },
    { key: "operate", label: "Operate", state: "locked" },
    { key: "finalized", label: "Story", state: "locked" },
  ];
  const currentIndex = order.findIndex((step) => step.key === current);

  return order.map((step, index) => ({
    ...step,
    state:
      index < currentIndex
        ? "complete"
        : index === currentIndex
          ? "current"
          : "locked",
  }));
}

export function getDemoChecklistLinks(startupId?: string): string[] {
  return [
    "/startup/new",
    startupId ? `/startup/${startupId}/pitch` : "/startup/new",
    startupId ? `/startup/${startupId}/terms` : "/startup/new",
    startupId ? `/startup/${startupId}/operate` : "/startup/new",
    startupId ? `/startup/${startupId}/social` : "/leaderboard",
    startupId ? `/startup/${startupId}/rivals` : "/leaderboard",
    startupId ? `/startup/${startupId}/strategy` : "/leaderboard",
    startupId ? `/startup/${startupId}/boardroom` : "/leaderboard",
    startupId ? `/startup/${startupId}/documentary` : "/career",
    "/career",
    "/leaderboard",
  ];
}
