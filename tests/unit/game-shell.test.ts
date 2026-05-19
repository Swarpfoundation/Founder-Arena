import { describe, expect, it } from "vitest";
import {
  getDashboardObjective,
  getNextObjective,
  getRunSlotPresentation,
  getStartupRunStep,
  pickPrimaryStartup,
  type StartupObjectiveInput,
} from "@/lib/game/objectives";

function startup(overrides: Partial<StartupObjectiveInput> = {}): StartupObjectiveInput {
  return {
    id: "startup-1",
    status: "draft",
    name: "Acme Arena",
    simulationMonths: [],
    vcReviews: [],
    termSheets: [],
    ...overrides,
  };
}

describe("game shell objective helpers", () => {
  it("routes a draft startup to pitch construction", () => {
    const objective = getNextObjective(startup());
    expect(objective).toMatchObject({
      title: "Complete the pitch deck",
      href: "/startup/startup-1/pitch",
      category: "pitch",
    });
  });

  it("routes a pending AI review to the verdict chamber", () => {
    const objective = getNextObjective(startup({
      status: "pitching",
      pitchDeck: {},
      hasPendingReviewJob: true,
    }));

    expect(objective).toMatchObject({
      title: "VC review is processing",
      href: "/startup/startup-1/review",
      category: "review",
    });
  });

  it("routes a funded startup with no simulation months to Sprint 1", () => {
    const objective = getNextObjective(startup({
      status: "funded",
      pitchDeck: {},
      vcReviews: [{ decision: "proposal" }],
      termSheets: [{ status: "accepted" }],
      simulationMonths: [],
    }));

    expect(objective).toMatchObject({
      title: "Run Sprint 1",
      href: "/startup/startup-1/operate",
      category: "operations",
    });
  });

  it("prioritizes infrastructure incidents before normal operation", () => {
    const objective = getNextObjective(startup({
      status: "active",
      simulationMonths: [{ monthNumber: 1 }],
      openInfrastructureEvent: true,
    }));

    expect(objective).toMatchObject({
      title: "Resolve infrastructure incident",
      href: "/startup/startup-1/infrastructure",
      severity: "critical",
    });
  });

  it("prioritizes boardroom pressure before normal operation", () => {
    const objective = getNextObjective(startup({
      status: "active",
      simulationMonths: [{ monthNumber: 1 }],
      openBoardroomEvent: true,
    }));

    expect(objective).toMatchObject({
      title: "Answer the board",
      href: "/startup/startup-1/boardroom",
      severity: "critical",
    });
  });

  it("routes finalized startups to story review", () => {
    const objective = getNextObjective(startup({
      status: "completed",
      simulationMonths: Array.from({ length: 12 }, (_, index) => ({ monthNumber: index + 1 })),
    }));

    expect(objective).toMatchObject({
      title: "Review the final story",
      href: "/startup/startup-1/documentary",
      category: "story",
    });
  });

  it("builds dashboard objective from the highest priority active run", () => {
    const objective = getDashboardObjective([
      startup({ id: "old", status: "draft" }),
      startup({ id: "live", status: "active", simulationMonths: [{ monthNumber: 1 }] }),
    ]);

    expect(objective.href).toBe("/startup/live/operate");
  });

  it("uses deployment objective when there are no runs", () => {
    expect(getDashboardObjective([])).toMatchObject({
      title: "Deploy your first startup",
      href: "/startup/new",
    });
  });

  it("selects active runs before setup and archive slots", () => {
    const selected = pickPrimaryStartup([
      startup({ id: "archive", status: "completed" }),
      startup({ id: "setup", status: "draft" }),
      startup({ id: "active", status: "active" }),
    ]);

    expect(selected?.id).toBe("active");
  });

  it("maps run slot presentation labels by status", () => {
    expect(getRunSlotPresentation(startup({ status: "active" }))).toMatchObject({
      label: "ACTIVE OPERATION",
      kind: "active",
    });
    expect(getRunSlotPresentation(startup({ status: "dead", publicSlug: "fallen-run" }))).toMatchObject({
      label: "FALLEN RUN",
      href: "/s/fallen-run",
      kind: "archive",
    });
    expect(getRunSlotPresentation(startup({ status: "completed", finalOutcome: "BREAKOUT" }))).toMatchObject({
      label: "BREAKOUT",
      kind: "archive",
    });
  });

  it("normalizes startup run step for active and finalized runs", () => {
    expect(getStartupRunStep(startup({ status: "active", simulationMonths: [{ monthNumber: 1 }] }))).toBe(2);
    expect(getStartupRunStep(startup({ status: "dead", simulationMonths: [] }))).toBe(12);
  });
});
