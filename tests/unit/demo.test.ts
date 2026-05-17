import { describe, it, expect } from "vitest";
import {
  LOCKED_STATES,
  DEMO_CHECKLIST_STEPS,
} from "@/lib/demo/locked-states";

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
