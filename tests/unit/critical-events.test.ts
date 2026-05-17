import { describe, expect, it } from "vitest";
import {
  buildBoardroomPresentation,
  buildCriticalEventKey,
  buildDeathWarningPresentations,
  buildRivalMovePresentation,
  buildSocialPresentation,
  normalizeCriticalSeverity,
} from "@/lib/gamefeel/critical-events";

describe("critical event presentation helpers", () => {
  it("normalizes mixed severity vocabularies", () => {
    expect(normalizeCriticalSeverity("critical")).toBe("critical");
    expect(normalizeCriticalSeverity("moderate")).toBe("high");
    expect(normalizeCriticalSeverity("warning")).toBe("high");
    expect(normalizeCriticalSeverity("minor")).toBe("low");
  });

  it("maps boardroom critical events to board summons presentation", () => {
    const event = buildBoardroomPresentation({
      startupId: "s1",
      event: {
        id: "b1",
        title: "Runway Trial",
        concern: "The board wants a cash plan.",
        pressureType: "runway_crisis",
        severity: "critical",
      },
      boardConfidence: 42,
      investorPatience: 31,
      founderControl: 76,
    });

    expect(event).toMatchObject({
      type: "boardroom",
      severity: "critical",
      eyebrow: "Board Summons",
      accent: "rose",
    });
    expect(event?.primaryCta?.href).toBe("/startup/s1/boardroom");
    expect(event?.affectedStats?.map((stat) => stat.label)).toContain("Board");
  });

  it("handles missing rival move safely", () => {
    expect(buildRivalMovePresentation({ startupId: "s1", move: null })).toBeNull();
  });

  it("maps rival warning moves to rival presentation", () => {
    const event = buildRivalMovePresentation({
      startupId: "s1",
      move: {
        id: "r1",
        rivalName: "NovaStack",
        title: "NovaStack poached attention",
        description: "Their founder dragged your launch into the feed.",
        type: "poach_attention",
        severity: "warning",
        month: 4,
      },
    });

    expect(event?.type).toBe("rival");
    expect(event?.severity).toBe("high");
    expect(event?.secondaryCta?.label).toBe("Counter");
  });

  it("maps social crisis and viral moments distinctly", () => {
    const crisis = buildSocialPresentation({ startupId: "s1", didBackfire: true, brandRiskDelta: 12 });
    const viral = buildSocialPresentation({ startupId: "s1", viralMomentumDelta: 18, hypeDelta: 8 });

    expect(crisis).toMatchObject({ type: "danger", severity: "critical", eyebrow: "Brand Crisis" });
    expect(viral).toMatchObject({ type: "viral", severity: "high", eyebrow: "Viral Spike" });
  });

  it("builds critical death warnings from existing stats only", () => {
    const warnings = buildDeathWarningPresentations({
      startupId: "s1",
      cash: 50_000,
      monthlyBurn: 40_000,
      riskScore: 90,
      investorScore: 20,
      revenue: 0,
      currentMonth: 7,
    });

    expect(warnings.map((warning) => warning.title)).toEqual([
      "Runway Critical",
      "Risk Score Near Failure Threshold",
      "Investor Patience Is Running Out",
      "Revenue Is Still Zero",
    ]);
  });

  it("builds stable display keys without empty segments", () => {
    expect(buildCriticalEventKey(["critical", undefined, "s1", null, 4])).toBe("critical:s1:4");
  });
});
