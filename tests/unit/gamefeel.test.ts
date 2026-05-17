import { describe, expect, it } from "vitest";
import {
  buildFinalResultCtas,
  buildRewardKey,
  computeStatDeltas,
  getOutcomeCeremony,
} from "@/lib/gamefeel/ceremony";

describe("gamefeel ceremony helpers", () => {
  it("maps breakout to legendary ceremony", () => {
    const profile = getOutcomeCeremony("BREAKOUT");
    expect(profile.tone).toBe("legendary");
    expect(profile.accent).toBe("emerald");
    expect(profile.isPositive).toBe(true);
  });

  it("maps death to danger ceremony", () => {
    const profile = getOutcomeCeremony("DEAD");
    expect(profile.tone).toBe("danger");
    expect(profile.accent).toBe("rose");
    expect(profile.isPositive).toBe(false);
  });

  it("builds final result CTAs with story, career, leaderboard, public record, and replay", () => {
    const ctas = buildFinalResultCtas({
      startupId: "startup-1",
      publicSlug: "acme-123",
      hasLeaderboardEntry: true,
      isDead: false,
    });
    expect(ctas.map((c) => c.href)).toContain("/startup/startup-1/documentary");
    expect(ctas.map((c) => c.href)).toContain("/career");
    expect(ctas.map((c) => c.href)).toContain("/leaderboard?tab=overall&season=beta-season-1");
    expect(ctas.map((c) => c.href)).toContain("/s/acme-123");
    expect(ctas.map((c) => c.href)).toContain("/startup/new");
  });

  it("computes good and bad stat deltas by preferred direction", () => {
    const deltas = computeStatDeltas([
      { id: "revenue", label: "Revenue", before: 100, after: 150, positiveDirection: "up" },
      { id: "risk", label: "Risk", before: 60, after: 40, positiveDirection: "down" },
      { id: "burn", label: "Burn", before: 10, after: 15, positiveDirection: "down" },
    ]);

    expect(deltas[0]).toMatchObject({ delta: 50, direction: "up", isGood: true });
    expect(deltas[1]).toMatchObject({ delta: -20, direction: "down", isGood: true });
    expect(deltas[2]).toMatchObject({ delta: 5, direction: "up", isGood: false });
  });

  it("builds stable reward keys without empty segments", () => {
    expect(buildRewardKey(["badge", undefined, "first_pitch", null, 2])).toBe("badge:first_pitch:2");
  });
});

