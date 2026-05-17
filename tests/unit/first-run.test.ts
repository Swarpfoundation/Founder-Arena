import { describe, expect, it } from "vitest";
import {
  buildFirstRunAction,
  buildRunPhaseSteps,
  getDemoChecklistLinks,
  getStartupRunPhase,
} from "@/lib/gamefeel/first-run";

describe("first-run demo helpers", () => {
  it("maps startup statuses to compact run phases", () => {
    expect(getStartupRunPhase("draft")).toBe("pitch");
    expect(getStartupRunPhase("pitching")).toBe("funding");
    expect(getStartupRunPhase("funded")).toBe("operate");
    expect(getStartupRunPhase("active")).toBe("operate");
    expect(getStartupRunPhase("completed")).toBe("finalized");
    expect(getStartupRunPhase("dead")).toBe("finalized");
  });

  it("builds the right first action for a new visitor", () => {
    const action = buildFirstRunAction({});
    expect(action).toMatchObject({
      label: "Deploy Startup",
      href: "/startup/new",
      phase: "draft",
    });
  });

  it("routes newly funded startups to month one", () => {
    const action = buildFirstRunAction({
      startupId: "s1",
      status: "funded",
      hasPitch: true,
      hasReview: true,
      hasFunding: true,
      monthsRun: 0,
      teamSize: 0,
    });

    expect(action.label).toBe("Run Sprint 1");
    expect(action.href).toBe("/startup/s1/operate");
  });

  it("routes operating startups without a team to team setup after month one", () => {
    const action = buildFirstRunAction({
      startupId: "s1",
      status: "active",
      hasPitch: true,
      hasReview: true,
      hasFunding: true,
      monthsRun: 1,
      teamSize: 0,
    });

    expect(action.label).toBe("Open Team");
    expect(action.href).toBe("/startup/s1/team");
  });

  it("marks run phase steps with one current step", () => {
    const steps = buildRunPhaseSteps("funded");
    expect(steps.filter((step) => step.state === "current")).toHaveLength(1);
    expect(steps.find((step) => step.key === "operate")?.state).toBe("current");
    expect(steps.find((step) => step.key === "pitch")?.state).toBe("complete");
  });

  it("builds demo checklist links without placeholder startup routes", () => {
    const links = getDemoChecklistLinks();
    expect(links).toContain("/startup/new");
    expect(links.every((href) => !href.includes("/startup/new/"))).toBe(true);
    expect(links).toContain("/career");
    expect(links).toContain("/leaderboard");
  });
});
