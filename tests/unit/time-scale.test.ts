import { describe, expect, it } from "vitest";
import {
  RUN_TOTAL_STEPS,
  formatFinancialMetricLabel,
  formatFinancialPeriod,
  formatRunDuration,
  formatTimelineMoment,
  getDemoDayCountdown,
  getDemoDayLabel,
  getFinalVerdictLabel,
  getNextRunPhase,
  getRunPhase,
  getRunPhaseLabel,
  getRunPhaseProgress,
  getRunPhaseTagline,
  getRunStepLabel,
  getShortRunStepLabel,
  getSprintMilestoneLabel,
  getSprintNextActionHint,
  getSprintPressureLevel,
  isDemoDayStep,
} from "@/lib/game-time/time-scale";

describe("game time scale helpers", () => {
  it("uses 12 total run steps", () => {
    expect(RUN_TOTAL_STEPS).toBe(12);
    expect(formatRunDuration()).toBe("12 Founder Weeks");
  });

  it("formats week and sprint labels", () => {
    expect(getRunStepLabel(1)).toBe("Week 1");
    expect(getRunStepLabel(4, { style: "sprint" })).toBe("Sprint 4");
    expect(getShortRunStepLabel(7)).toBe("W7");
    expect(getShortRunStepLabel(7, { style: "sprint" })).toBe("S7");
  });

  it("clamps invalid timeline inputs safely", () => {
    expect(formatTimelineMoment(undefined)).toBe("Week 1");
    expect(formatTimelineMoment(0)).toBe("Week 1");
    expect(formatTimelineMoment(99)).toBe("Week 12");
  });

  it("maps phases across the 12 sprint arc", () => {
    expect(getRunPhase(1).label).toBe("Launch Signal");
    expect(getRunPhase(3).label).toBe("Launch Signal");
    expect(getRunPhase(4).label).toBe("Market Proof");
    expect(getRunPhase(6).label).toBe("Market Proof");
    expect(getRunPhase(7).label).toBe("Survive or Scale");
    expect(getRunPhase(9).label).toBe("Survive or Scale");
    expect(getRunPhase(10).label).toBe("Demo Day Runway");
    expect(getRunPhase(12).label).toBe("Demo Day Runway");
  });

  it("exposes phase labels and taglines", () => {
    expect(getRunPhaseLabel(5)).toBe("Market Proof");
    expect(getRunPhaseTagline(11)).toContain("Demo Day Verdict");
  });

  it("reports progress inside each three-week phase", () => {
    expect(getRunPhaseProgress(1)).toEqual({
      phaseIndex: 1,
      stepWithinPhase: 1,
      phaseTotalSteps: 3,
      percentComplete: 33,
    });
    expect(getRunPhaseProgress(6)).toEqual({
      phaseIndex: 2,
      stepWithinPhase: 3,
      phaseTotalSteps: 3,
      percentComplete: 100,
    });
    expect(getRunPhaseProgress(12).phaseIndex).toBe(4);
  });

  it("finds the next phase when one remains", () => {
    expect(getNextRunPhase(2)?.label).toBe("Market Proof");
    expect(getNextRunPhase(6)?.label).toBe("Survive or Scale");
    expect(getNextRunPhase(12)).toBeNull();
  });

  it("maps sprint pressure levels", () => {
    expect(getSprintPressureLevel(1)).toBe("early");
    expect(getSprintPressureLevel(4)).toBe("rising");
    expect(getSprintPressureLevel(7)).toBe("dangerous");
    expect(getSprintPressureLevel(10)).toBe("demo_day");
  });

  it("labels checkpoints and countdowns", () => {
    expect(getSprintMilestoneLabel(1)).toBe("First Signal");
    expect(getSprintMilestoneLabel(3)).toBe("Launch Signal Checkpoint");
    expect(getSprintMilestoneLabel(6)).toBe("Market Proof Checkpoint");
    expect(getSprintMilestoneLabel(9)).toBe("Survive or Scale Checkpoint");
    expect(getSprintMilestoneLabel(12)).toBe("Demo Day Verdict");
    expect(getDemoDayCountdown(4)).toBe("8 sprints to Demo Day");
    expect(getDemoDayCountdown(11)).toBe("Demo Day is next");
    expect(getDemoDayCountdown(12)).toBe("Demo Day Verdict");
  });

  it("returns copy-only next action hints", () => {
    expect(getSprintNextActionHint(1)).toContain("first market signal");
    expect(getSprintNextActionHint(8)).toContain("Protect runway");
    expect(getSprintNextActionHint(11)).toContain("Demo Day");
    expect(getSprintNextActionHint(12, { status: "completed" })).toContain("career record");
  });

  it("detects demo day and names final verdicts", () => {
    expect(isDemoDayStep(11)).toBe(false);
    expect(isDemoDayStep(12)).toBe(true);
    expect(getDemoDayLabel()).toBe("Demo Day");
    expect(getFinalVerdictLabel()).toBe("Demo Day Verdict");
  });

  it("preserves monthly financial language", () => {
    expect(formatFinancialPeriod()).toBe("monthly");
    expect(formatFinancialMetricLabel("Burn")).toBe("Monthly Burn");
    expect(formatFinancialMetricLabel("MRR")).toBe("MRR");
    expect(formatFinancialMetricLabel("Runway")).toBe("Runway");
    expect(formatFinancialMetricLabel("Salary")).toBe("Salary/mo");
  });
});
