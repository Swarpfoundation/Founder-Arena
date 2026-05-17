import { describe, expect, it } from "vitest";
import { getRouteSprintAtmosphere } from "@/lib/game-time/route-atmosphere";

describe("route sprint atmosphere", () => {
  it("returns phase-aware social copy", () => {
    const event = getRouteSprintAtmosphere("social", 4);
    expect(event.eyebrow).toBe("Sprint Media Pressure");
    expect(event.subtitle).toContain("Week 4");
    expect(event.subtitle).toContain("Market Proof");
    expect(event.subtitle).toContain("Demo Day");
  });

  it("maps route keys to appropriate event tones", () => {
    expect(getRouteSprintAtmosphere("rivals", 8).type).toBe("rival");
    expect(getRouteSprintAtmosphere("boardroom", 8).type).toBe("boardroom");
    expect(getRouteSprintAtmosphere("strategy", 8).type).toBe("strategy");
    expect(getRouteSprintAtmosphere("leaderboard").type).toBe("leaderboard");
  });

  it("uses stronger pressure near Demo Day", () => {
    const event = getRouteSprintAtmosphere("boardroom", 11);
    expect(event.severity).toBe("high");
    expect(event.subtitle).toContain("Demo Day Runway");
    expect(event.affectedStats?.some((stat) => stat.value === "Demo Day Runway")).toBe(true);
  });
});
