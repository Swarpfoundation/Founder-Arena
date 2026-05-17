import { describe, it, expect } from "vitest";
import {
  LOCKED_STATES,
  DEMO_CHECKLIST_STEPS,
} from "@/lib/demo/locked-states";
import {
  buildDemoShowcaseLinks,
  buildEmptyDemoShowcaseState,
  buildPresenterChecklist,
  DEMO_FOUNDER_PUBLIC_SLUG,
  DEMO_SCENARIOS,
  getDemoPublicSlugs,
  getDemoScenarioIds,
} from "@/lib/demo/showcase-data";

// ─── LOCKED_STATES ────────────────────────────────────────────────────────────

describe("LOCKED_STATES", () => {
  const EXPECTED_KEYS = ["social", "rivals", "strategy", "boardroom", "documentary"];

  it("has all required keys", () => {
    for (const key of EXPECTED_KEYS) {
      expect(LOCKED_STATES[key], `Missing key: ${key}`).toBeDefined();
    }
  });

  it("each entry has required fields", () => {
    for (const [key, state] of Object.entries(LOCKED_STATES)) {
      expect(state.label, `${key}.label missing`).toBeTruthy();
      expect(state.headline, `${key}.headline missing`).toBeTruthy();
      expect(state.description, `${key}.description missing`).toBeTruthy();
      expect(state.flavor, `${key}.flavor missing`).toBeTruthy();
      expect(state.unlockCondition, `${key}.unlockCondition missing`).toBeTruthy();
      expect(state.nextAction, `${key}.nextAction missing`).toBeTruthy();
      expect(typeof state.nextActionHref, `${key}.nextActionHref not a function`).toBe("function");
    }
  });

  it("nextActionHref returns a string with the startup id", () => {
    const state = LOCKED_STATES.social;
    const href = state.nextActionHref("test-id-123");
    expect(href).toContain("test-id-123");
  });

  it("social nextActionHref points to pitch", () => {
    expect(LOCKED_STATES.social.nextActionHref("abc")).toBe("/startup/abc/pitch");
  });

  it("rivals nextActionHref points to pitch", () => {
    expect(LOCKED_STATES.rivals.nextActionHref("abc")).toBe("/startup/abc/pitch");
  });

  it("strategy nextActionHref points to pitch", () => {
    expect(LOCKED_STATES.strategy.nextActionHref("abc")).toBe("/startup/abc/pitch");
  });

  it("boardroom nextActionHref points to operate", () => {
    expect(LOCKED_STATES.boardroom.nextActionHref("abc")).toBe("/startup/abc/operate");
  });

  it("documentary nextActionHref points to startup overview", () => {
    expect(LOCKED_STATES.documentary.nextActionHref("abc")).toBe("/startup/abc");
  });

  it("flavor copy does not reference external APIs or real services", () => {
    for (const state of Object.values(LOCKED_STATES)) {
      expect(state.flavor.toLowerCase()).not.toContain("twitter");
      expect(state.flavor.toLowerCase()).not.toContain("linkedin");
      expect(state.flavor.toLowerCase()).not.toContain("instagram");
    }
  });

  it("no locked state exposes internal IDs or private fields", () => {
    for (const state of Object.values(LOCKED_STATES)) {
      expect(state.label).not.toContain("undefined");
      expect(state.headline).not.toContain("null");
      expect(state.description).not.toContain("[object");
    }
  });
});

// ─── DEMO_CHECKLIST_STEPS ─────────────────────────────────────────────────────

describe("DEMO_CHECKLIST_STEPS", () => {
  it("has exactly 11 steps", () => {
    expect(DEMO_CHECKLIST_STEPS).toHaveLength(11);
  });

  it("each step has required fields", () => {
    for (const step of DEMO_CHECKLIST_STEPS) {
      expect(step.id, "step.id missing").toBeTruthy();
      expect(step.label, "step.label missing").toBeTruthy();
      expect(step.description, "step.description missing").toBeTruthy();
      expect(typeof step.href, "step.href not a function").toBe("function");
      expect(typeof step.requiresStartup).toBe("boolean");
    }
  });

  it("step IDs are unique", () => {
    const ids = DEMO_CHECKLIST_STEPS.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("href() without startup id returns a valid-looking path", () => {
    for (const step of DEMO_CHECKLIST_STEPS) {
      const href = step.href();
      expect(href).toBeTruthy();
      expect(href).toMatch(/^\//);
    }
  });

  it("steps requiring a startup return path with id when provided", () => {
    const startupSteps = DEMO_CHECKLIST_STEPS.filter((s) => s.requiresStartup);
    for (const step of startupSteps) {
      const href = step.href("test-startup-id");
      expect(href).toContain("test-startup-id");
    }
  });

  it("non-startup steps return global paths (dashboard, career, leaderboard)", () => {
    const globalSteps = DEMO_CHECKLIST_STEPS.filter((s) => !s.requiresStartup);
    for (const step of globalSteps) {
      const href = step.href();
      expect(href).not.toContain("undefined");
    }
  });

  it("first step is create (no startup required)", () => {
    expect(DEMO_CHECKLIST_STEPS[0].id).toBe("create");
    expect(DEMO_CHECKLIST_STEPS[0].requiresStartup).toBe(false);
  });

  it("last step is leaderboard (global)", () => {
    const last = DEMO_CHECKLIST_STEPS[DEMO_CHECKLIST_STEPS.length - 1];
    expect(last.id).toBe("leaderboard");
    expect(last.requiresStartup).toBe(false);
  });

  it("career and leaderboard steps are present", () => {
    const ids = DEMO_CHECKLIST_STEPS.map((s) => s.id);
    expect(ids).toContain("career");
    expect(ids).toContain("leaderboard");
  });

  it("all funded-required steps have requiresStatus array", () => {
    const fundedSteps = DEMO_CHECKLIST_STEPS.filter((s) => s.requiresStartup && s.id !== "create");
    for (const step of fundedSteps) {
      if (step.requiresStatus) {
        expect(Array.isArray(step.requiresStatus)).toBe(true);
        expect(step.requiresStatus.length).toBeGreaterThan(0);
      }
    }
  });
});

// ─── DEMO SHOWCASE DATA ──────────────────────────────────────────────────────

describe("demo showcase data", () => {
  it("defines active, mid-run, finalized, and dead scenarios with deterministic IDs", () => {
    expect(DEMO_SCENARIOS.map((scenario) => scenario.kind)).toEqual([
      "active",
      "midRun",
      "finalized",
      "dead",
    ]);

    expect(getDemoScenarioIds()).toEqual([
      "demo-active-month-one",
      "demo-mid-run",
      "demo-finalized-breakout",
      "demo-dead-run",
    ]);
  });

  it("has public slugs only for finalized public-safe scenarios", () => {
    expect(getDemoPublicSlugs()).toEqual([
      "demo-civicgraph-breakout",
      "demo-fablepay-dead",
    ]);
  });

  it("builds fallback links when no seeded data exists", () => {
    const state = buildEmptyDemoShowcaseState();
    const links = buildDemoShowcaseLinks(state);

    expect(state.seedDetected).toBe(false);
    expect(links.find((link) => link.key === "active")?.href).toBe("/startup/new");
    expect(links.find((link) => link.key === "mid-run")?.available).toBe(false);
    expect(links.find((link) => link.key === "leaderboard")?.href).toBe("/leaderboard");
  });

  it("builds seeded showcase links without private pitch fields", () => {
    const state = buildEmptyDemoShowcaseState();
    const seededState = {
      ...state,
      seedDetected: true,
      founderProfileExists: true,
      scenarios: state.scenarios.map((scenario) => ({
        ...scenario,
        exists: true,
        status: scenario.kind === "dead" ? "dead" : scenario.kind === "finalized" ? "completed" : "active",
        finalOutcome: scenario.kind === "finalized" ? "BREAKOUT" : scenario.kind === "dead" ? "DEAD" : null,
      })),
    };

    const links = buildDemoShowcaseLinks(seededState);
    const hrefs = links.map((link) => link.href);

    expect(hrefs).toContain("/startup/demo-active-month-one");
    expect(hrefs).toContain("/startup/demo-mid-run/operate");
    expect(hrefs).toContain("/s/demo-civicgraph-breakout");
    expect(hrefs).toContain(`/f/${DEMO_FOUNDER_PUBLIC_SLUG}`);
    expect(JSON.stringify(links).toLowerCase()).not.toContain("pitchdeck");
    expect(JSON.stringify(links).toLowerCase()).not.toContain("problem");
    expect(JSON.stringify(links).toLowerCase()).not.toContain("solution");
  });

  it("presenter checklist includes required route steps and guardrails", () => {
    const checklist = buildPresenterChecklist();
    const ids = checklist.map((step) => step.id);

    expect(ids).toEqual([
      "home",
      "deployment-bay",
      "active-startup",
      "operate",
      "social",
      "rivals",
      "strategy",
      "boardroom",
      "documentary",
      "career",
      "leaderboard",
    ]);
    expect(checklist.every((step) => step.route.startsWith("/"))).toBe(true);
    expect(checklist.some((step) => step.doNotClaim?.includes("real social media"))).toBe(true);
    expect(checklist.some((step) => step.doNotClaim?.includes("live multiplayer"))).toBe(true);
  });
});
