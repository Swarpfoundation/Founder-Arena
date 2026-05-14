import { describe, it, expect } from "vitest";
import {
  generateShareText,
  generateTwitterShareUrl,
  generateLinkedInShareUrl,
} from "@/lib/social/share-text";

describe("generateShareText", () => {
  it("generates startup success text with real metrics", () => {
    const text = generateShareText({
      type: "startup_success",
      name: "AcmeAI",
      monthsSurvived: 12,
      valuation: 7_400_000,
      outcome: "BREAKOUT",
    });
    expect(text).toContain("AcmeAI");
    expect(text).toContain("12 months");
    expect(text).toContain("$7.4M");
    expect(text).toContain("BREAKOUT");
    expect(text.length).toBeLessThanOrEqual(280);
  });

  it("generates startup death text with death reason", () => {
    const text = generateShareText({
      type: "startup_death",
      name: "FailFast",
      monthsSurvived: 8,
      deathReason: "Ran out of cash",
    });
    expect(text).toContain("FailFast");
    expect(text).toContain("died in month 8");
    expect(text).toContain("ran out of cash");
    expect(text.length).toBeLessThanOrEqual(280);
  });

  it("generates leaderboard rank text", () => {
    const text = generateShareText({
      type: "leaderboard_rank",
      rank: 12,
      category: "fintech",
      startupName: "PayFlow",
      score: 4500,
    });
    expect(text).toContain("#12");
    expect(text).toContain("fintech");
    expect(text).toContain("PayFlow");
    expect(text).toContain("4,500");
    expect(text.length).toBeLessThanOrEqual(280);
  });

  it("generates achievement text", () => {
    const text = generateShareText({
      type: "achievement",
      title: "Breakout Startup",
      description: "Reach BREAKOUT outcome",
    });
    expect(text).toContain("Breakout Startup");
    expect(text).toContain("Reach BREAKOUT outcome");
    expect(text.length).toBeLessThanOrEqual(280);
  });

  it("generates founder profile text", () => {
    const text = generateShareText({
      type: "founder_profile",
      name: "Alice",
      level: 5,
      bestScore: 12000,
      totalStartups: 8,
    });
    expect(text).toContain("Level 5");
    expect(text).toContain("12,000");
    expect(text).toContain("8 ventures");
    expect(text.length).toBeLessThanOrEqual(280);
  });

  it("appends base URL when provided", () => {
    const text = generateShareText(
      { type: "achievement", title: "Test", description: "Desc" },
      "https://example.com/founders/alice"
    );
    expect(text).toContain("https://example.com/founders/alice");
  });

  it("truncates text over 280 chars", () => {
    const longName = "A".repeat(300);
    const text = generateShareText({
      type: "startup_success",
      name: longName,
      monthsSurvived: 12,
      valuation: 1_000_000,
      outcome: "BREAKOUT",
    });
    expect(text.length).toBeLessThanOrEqual(280);
    expect(text.endsWith("...")).toBe(true);
  });
});

describe("generateTwitterShareUrl", () => {
  it("returns a valid Twitter intent URL", () => {
    const url = generateTwitterShareUrl("Hello world");
    expect(url).toContain("https://twitter.com/intent/tweet");
    expect(url).toContain("text=Hello+world");
  });
});

describe("generateLinkedInShareUrl", () => {
  it("returns a valid LinkedIn share URL", () => {
    const url = generateLinkedInShareUrl("https://example.com", "Title", "Summary");
    expect(url).toContain("https://www.linkedin.com/sharing/share-offsite/");
    expect(url).toContain(encodeURIComponent("https://example.com"));
    expect(url).toContain(encodeURIComponent("Title"));
    expect(url).toContain(encodeURIComponent("Summary"));
  });
});
