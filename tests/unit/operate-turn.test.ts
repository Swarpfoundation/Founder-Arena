import { describe, expect, it } from "vitest";
import { DECISION_CATALOG } from "@/lib/simulation/decisions";
import {
  buildResolutionStages,
  getActionCardPresentation,
  getEndSprintConsolePresentation,
  getLockedDecisionReason,
  getThreatRadarItems,
} from "@/lib/game/operate-turn";

describe("operate turn presentation helpers", () => {
  it("maps decisions into action cards without changing decision values", () => {
    const productFocus = DECISION_CATALOG.find((decision) => decision.id === "product_focus")!;
    const card = getActionCardPresentation(productFocus, { selected: true });

    expect(card).toMatchObject({
      id: "product_focus",
      selected: true,
      accent: "cyan",
      costLabel: "-$5K",
      burnLabel: "+$5K /mo burn",
    });
    expect(card.tags).toContain("Product");
    expect(card.effectPreview).toContain("+18 Product");
    expect(productFocus.productDelta).toBe(18);
  });

  it("returns locked reasons for gated or unaffordable decisions", () => {
    const enterprise = DECISION_CATALOG.find((decision) => decision.id === "enterprise_push")!;
    expect(getLockedDecisionReason(enterprise, { cash: 100_000, productProgress: 20, month: 4 })).toContain("50% product");
    expect(getLockedDecisionReason(enterprise, { cash: 100_000, productProgress: 60, month: 1 })).toContain("first sprint");
    expect(getLockedDecisionReason(enterprise, { cash: 1_000, productProgress: 60, month: 4 })).toContain("$20K cash");
  });

  it("prioritizes top threat radar items without invasive tracking", () => {
    const threats = getThreatRadarItems({
      startupId: "startup_1",
      cash: 50_000,
      monthlyBurn: 25_000,
      revenue: 0,
      riskScore: 81,
      investorScore: 24,
      currentMonth: 10,
      monthlyEvent: { title: "Market shock", severity: "critical" },
      openInfrastructureEvent: { title: "Bill shock", severity: "moderate" },
      nextMoves: [{ id: "move_1", title: "Repair GTM", urgency: "high", whyItMatters: "Sales motion is weak." }],
    });

    expect(threats).toHaveLength(5);
    expect(threats[0].severity).toBe("critical");
    expect(threats.map((threat) => threat.id)).toContain("runway-critical");
    const keys = threats.flatMap((threat) => Object.keys(threat));
    expect(keys).not.toContain("ipAddress");
    expect(keys).not.toContain("deviceId");
  });

  it("disables the end sprint console until a valid action is armed", () => {
    expect(getEndSprintConsolePresentation({
      selectedCount: 0,
      eventResolved: true,
      pending: false,
      currentWeek: 3,
      runwayMonths: 8,
      hasMonthlyEvent: false,
    })).toMatchObject({ canRun: false, label: "Select Action" });

    expect(getEndSprintConsolePresentation({
      selectedCount: 2,
      eventResolved: true,
      pending: false,
      currentWeek: 3,
      runwayMonths: 2,
      hasMonthlyEvent: true,
    })).toMatchObject({ canRun: true, label: "End Sprint", warning: expect.stringContaining("Runway") });
  });

  it("builds debrief stages from existing recap data", () => {
    const stages = buildResolutionStages({
      recap: {
        deltas: [
          { id: "cash", label: "Cash", before: 100, after: 80, delta: -20, direction: "down", isGood: false, format: "money" },
          { id: "product", label: "Product", before: 20, after: 30, delta: 10, direction: "up", isGood: true, format: "percent" },
        ],
        highlights: [{ label: "Rival Move", text: "Rival copied your launch.", tone: "violet" }],
        nextAction: { label: "Check Rivals", href: "/startup/1/rivals" },
      },
    });

    expect(stages.map((stage) => stage.id)).toEqual([
      "action-executed",
      "financial-movement",
      "traction-movement",
      "incident-scan",
      "next-objective",
    ]);
  });

  it("maps final outcomes into final verdict debrief stage copy", () => {
    const stages = buildResolutionStages({ recap: null, finalOutcome: "shutdown" });
    expect(stages.at(-1)).toMatchObject({
      id: "next-objective",
      label: "Final Verdict Ready",
      tone: "rose",
    });
  });
});
