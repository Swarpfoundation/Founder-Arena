import { describe, expect, it } from "vitest";
import {
  getCandidatePrimaryImpact,
  getCandidateRiskLevel,
  getHiringGatePresentation,
  getOfficePresentation,
  getRoleImpactTags,
  getSeniorityPresentation,
  getTeamCoverage,
} from "@/lib/game/team-scene";
import { getOfficeSetup } from "@/lib/team/effects";
import type { Candidate } from "@/lib/team/types";

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: "cand-1-0",
    name: "Alex Chen",
    role: "Full-stack Engineer",
    seniority: "senior",
    salary: 18000,
    skill: "engineering",
    moraleImpact: 5,
    burnImpact: 18000,
    productImpact: 12,
    revenueImpact: 0,
    riskImpact: -1,
    investorImpact: 2,
    bio: "Alex is a senior engineer.",
    ...overrides,
  };
}

describe("team scene presentation helpers", () => {
  it("maps role impact tags for engineering and revenue roles", () => {
    expect(getRoleImpactTags("Backend Engineer").map((tag) => tag.label)).toContain("Engineering");
    expect(getRoleImpactTags("Sales Lead").map((tag) => tag.label)).toContain("Revenue");
  });

  it("maps seniority into display skill ratings", () => {
    expect(getSeniorityPresentation("lead")).toMatchObject({ label: "Lead", skillRating: 96 });
    expect(getSeniorityPresentation("junior")).toMatchObject({ label: "Junior", skillRating: 60 });
  });

  it("detects team coverage gaps and strengths", () => {
    const coverage = getTeamCoverage(["Backend Engineer", "AI Engineer", "Sales Lead"]);
    expect(coverage.find((item) => item.id === "engineering")).toMatchObject({ level: "strong" });
    expect(coverage.find((item) => item.id === "revenue")).toMatchObject({ level: "partial" });
    expect(coverage.find((item) => item.id === "compliance")).toMatchObject({ level: "missing" });
  });

  it("shows hiring locked before funding", () => {
    const gate = getHiringGatePresentation({
      startup: { status: "draft", cash: 0, monthlyBurn: 0 },
      capacity: 3,
      candidate: candidate(),
    });
    expect(gate).toMatchObject({ canHire: false, label: "Team Command Locked" });
  });

  it("shows insufficient runway when a candidate drops below the server affordability floor", () => {
    const gate = getHiringGatePresentation({
      startup: { status: "funded", cash: 10000, monthlyBurn: 9000 },
      capacity: 3,
      candidate: candidate({ runwayAfter: 1 }),
    });
    expect(gate).toMatchObject({ canHire: false, label: "Runway Too Low" });
  });

  it("preserves office setup values from the existing office constants", () => {
    const existing = getOfficeSetup("premium_office");
    const presentation = getOfficePresentation("premium_office");
    expect(presentation.monthlyCost).toBe(existing.monthlyCost);
    expect(presentation.summary).toBe(existing.description);
    expect(presentation.risk).toBe("severe");
  });

  it("handles missing candidate warning safely", () => {
    expect(getCandidateRiskLevel(candidate({ warning: undefined })).label).toBe("Clean Recruit");
    expect(getCandidateRiskLevel(candidate({ warning: "Premium hire" })).label).toBe("Warning Flag");
  });

  it("selects the strongest candidate impact without changing values", () => {
    const impact = getCandidatePrimaryImpact(candidate({ productImpact: 3, revenueImpact: 15, riskImpact: 0, investorImpact: 4 }));
    expect(impact).toMatchObject({ label: "Revenue", value: 15 });
  });
});
