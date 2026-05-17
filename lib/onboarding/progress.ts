import { db } from "@/lib/db";

export interface OnboardingChecklistItem {
  key: string;
  label: string;
  completed: boolean;
}

export interface OnboardingProgress {
  items: OnboardingChecklistItem[];
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  nextAction: NextBestAction | null;
}

export interface NextBestAction {
  label: string;
  href: string;
  description: string;
  urgency: "high" | "medium" | "low";
}

export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress> {
  const [startups, pitchDecks, vcReviews, termSheets, fundingRounds, simulationMonths, employees] =
    await Promise.all([
      db.startup.findMany({ where: { userId }, select: { id: true, status: true } }),
      db.pitchDeck.findMany({
        where: { startup: { userId } },
        select: { id: true },
      }),
      db.vcReview.findMany({
        where: { startup: { userId } },
        select: { id: true },
      }),
      db.termSheet.findMany({
        where: { startup: { userId } },
        select: { id: true },
      }),
      db.fundingRound.findMany({
        where: { startup: { userId } },
        select: { id: true },
      }),
      db.simulationMonth.findMany({
        where: { startup: { userId } },
        select: { id: true },
      }),
      db.employee.findMany({
        where: { startup: { userId }, status: "active" },
        select: { id: true },
      }),
    ]);

  const hasStartup = startups.length > 0;
  const hasPitch = pitchDecks.length > 0;
  const hasReview = vcReviews.length > 0;
  const hasTermSheet = termSheets.length > 0;
  const hasFunding = fundingRounds.length > 0;
  const hasSimMonth = simulationMonths.length > 0;
  const hasEmployee = employees.length > 0;

  const items: OnboardingChecklistItem[] = [
    { key: "create_startup", label: "Create your first startup", completed: hasStartup },
    { key: "build_pitch", label: "Build your pitch deck", completed: hasPitch },
    { key: "submit_vc", label: "Submit to AI VC", completed: hasReview },
    { key: "review_terms", label: "Review term sheet", completed: hasTermSheet },
    { key: "accept_funding", label: "Accept or reject funding", completed: hasFunding },
    { key: "run_month", label: "Run your first operating month", completed: hasSimMonth },
    { key: "hire_team", label: "Hire your first team member", completed: hasEmployee },
    { key: "check_leaderboard", label: "Check leaderboard / profile", completed: false },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const percentComplete = Math.round((completedCount / totalCount) * 100);

  const nextAction = deriveNextBestAction({
    hasStartup,
    hasPitch,
    hasReview,
    hasTermSheet,
    hasFunding,
    hasSimMonth,
    hasEmployee,
    startups,
  });

  return {
    items,
    completedCount,
    totalCount,
    percentComplete,
    nextAction,
  };
}

interface ActionDerivationInput {
  hasStartup: boolean;
  hasPitch: boolean;
  hasReview: boolean;
  hasTermSheet: boolean;
  hasFunding: boolean;
  hasSimMonth: boolean;
  hasEmployee: boolean;
  startups: { id: string; status: string }[];
}

function deriveNextBestAction(input: ActionDerivationInput): NextBestAction | null {
  const { hasStartup, hasPitch, hasReview, hasTermSheet, hasFunding, hasSimMonth, hasEmployee, startups } = input;

  // Priority 1: Create startup
  if (!hasStartup) {
    return {
      label: "Create your first startup",
      href: "/startup/new",
      description: "Every founder starts with an idea. Pick a template or build from scratch.",
      urgency: "high",
    };
  }

  const activeStartup = startups.find((s) => ["draft", "pitching", "funded", "active"].includes(s.status));
  const latestStartup = startups[0];
  const targetId = activeStartup?.id ?? latestStartup?.id;

  if (!targetId) return null;

  // Priority 2: Build pitch
  if (!hasPitch) {
    return {
      label: "Build your pitch deck",
      href: `/startup/${targetId}/pitch`,
      description: "Tell your story. Use the suggested draft to get started quickly.",
      urgency: "high",
    };
  }

  // Priority 3: Submit for review
  if (!hasReview) {
    return {
      label: "Submit to AI VC",
      href: `/startup/${targetId}/pitch`,
      description: "Get brutally honest feedback from AI investors and a committee of personas.",
      urgency: "high",
    };
  }

  // Priority 4: Review terms
  if (!hasTermSheet) {
    return {
      label: "Review your term sheet",
      href: `/startup/${targetId}/terms`,
      description: "The AI VC has made an offer. Review valuation, dilution, and board terms.",
      urgency: "high",
    };
  }

  // Priority 5: Accept/reject funding
  if (!hasFunding) {
    return {
      label: "Accept or reject funding",
      href: `/startup/${targetId}/terms`,
      description: "Close your round to unlock operations and team management.",
      urgency: "high",
    };
  }

  // Priority 6: Run first month
  if (!hasSimMonth) {
    return {
      label: "Run your first sprint",
      href: `/startup/${targetId}/operate`,
      description: "Make decisions, hire team members, and navigate market conditions.",
      urgency: "high",
    };
  }

  // Priority 7: Hire team
  if (!hasEmployee) {
    return {
      label: "Hire your first teammate",
      href: `/startup/${targetId}/team`,
      description: "Engineers and sales reps help you build faster and generate revenue.",
      urgency: "medium",
    };
  }

  // If active startup still running
  if (activeStartup && ["funded", "active"].includes(activeStartup.status)) {
    return {
      label: "Continue operating",
      href: `/startup/${activeStartup.id}/operate`,
      description: "Keep making sprint decisions to survive all 12 Founder Weeks.",
      urgency: "medium",
    };
  }

  // If completed/dead
  if (activeStartup && ["completed", "dead"].includes(activeStartup.status)) {
    return {
      label: "Start a new startup",
      href: "/startup/new",
      description: "Learn from the last run and try a new idea or template.",
      urgency: "low",
    };
  }

  return {
    label: "View your startup",
    href: `/startup/${targetId}`,
    description: "Check your progress and take the next step.",
    urgency: "low",
  };
}

export function getNextBestActionForStartup(
  startup: {
    id: string;
    status: string;
    pitchDeck?: { id: string } | null;
    vcReviews?: { id: string }[];
    termSheets?: { id: string; status: string }[];
    fundingRounds?: { id: string }[];
    simulationMonths?: { id: string }[];
    employees?: { id: string; status: string }[];
  } | null
): NextBestAction | null {
  if (!startup) {
    return {
      label: "Create a startup",
      href: "/startup/new",
      description: "Start your founder journey by creating your first idea.",
      urgency: "high",
    };
  }

  const id = startup.id;

  if (!startup.pitchDeck) {
    return {
      label: "Build pitch deck",
      href: `/startup/${id}/pitch`,
      description: "Fill out your pitch sections before submitting to investors.",
      urgency: "high",
    };
  }

  if (!startup.vcReviews || startup.vcReviews.length === 0) {
    return {
      label: "Submit to AI VC",
      href: `/startup/${id}/pitch`,
      description: "Your pitch is ready. Get feedback from AI investors.",
      urgency: "high",
    };
  }

  const hasProposedTermSheet = startup.termSheets?.some((t) =>
    ["proposed", "countered"].includes(t.status)
  );

  if (!hasProposedTermSheet && (!startup.fundingRounds || startup.fundingRounds.length === 0)) {
    return {
      label: "Review term sheet",
      href: `/startup/${id}/terms`,
      description: "Check if the AI VC made an offer and review the terms.",
      urgency: "high",
    };
  }

  if (!startup.fundingRounds || startup.fundingRounds.length === 0) {
    return {
      label: "Close your round",
      href: `/startup/${id}/terms`,
      description: "Accept or reject the term sheet to unlock operations.",
      urgency: "high",
    };
  }

  if (startup.status === "funded" || startup.status === "active") {
    if (!startup.simulationMonths || startup.simulationMonths.length === 0) {
      return {
        label: "Run first sprint",
        href: `/startup/${id}/operate`,
        description: "Make your first sprint operating decisions.",
        urgency: "high",
      };
    }

    const activeEmployees = startup.employees?.filter((e) => e.status === "active") ?? [];
    if (activeEmployees.length === 0) {
      return {
        label: "Hire your first employee",
        href: `/startup/${id}/team`,
        description: "Build your team to improve product velocity and revenue.",
        urgency: "medium",
      };
    }

    return {
      label: "Continue operating",
      href: `/startup/${id}/operate`,
      description: "Make decisions for the next sprint and survive all 12 Founder Weeks.",
      urgency: "medium",
    };
  }

  if (startup.status === "completed" || startup.status === "dead") {
    return {
      label: "Start new startup",
      href: "/startup/new",
      description: "Your run is complete. Try a new idea or template.",
      urgency: "low",
    };
  }

  return {
    label: "View startup",
    href: `/startup/${id}`,
    description: "Review your startup profile and take the next step.",
    urgency: "low",
  };
}
