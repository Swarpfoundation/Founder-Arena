import { describe, it, expect } from "vitest";
import {
  generateCandidateAtIndex,
  generateCandidates,
  getCanonicalCandidateValues,
  CANDIDATE_POOL_SIZE,
} from "@/lib/team/candidates";
import { calculateEmployeeCost } from "@/lib/economy/cost-engine";
import {
  getRoleImpacts,
  isAllowedRole,
  isAllowedSeniority,
} from "@/lib/economy/salary-bands";

/**
 * Security-relevant tests: server-side hire path must always recompute
 * cost and impacts from the canonical sources, never trust client.
 */

describe("getCanonicalCandidateValues", () => {
  it("matches the cost engine for a known role/seniority/region", () => {
    const region = "united states";
    const role = "Full-stack Engineer";
    const seniority = "mid" as const;

    const cost = calculateEmployeeCost(role, seniority, region);
    const canonical = getCanonicalCandidateValues({ role, seniority, skill: "" }, region);

    expect(canonical.salary).toBe(cost.monthlyBurn);
    expect(canonical.allInAnnual).toBe(cost.allInAnnual);
    expect(canonical.monthlyBurn).toBe(cost.monthlyBurn);
  });

  it("matches the salary-bands impact data scaled by seniority", () => {
    const canonical = getCanonicalCandidateValues(
      { role: "AI Engineer", seniority: "senior", skill: "ai" },
      "united states"
    );
    const expected = getRoleImpacts("AI Engineer", "senior");
    expect(canonical.productImpact).toBe(expected.productImpact);
    expect(canonical.revenueImpact).toBe(expected.revenueImpact);
    expect(canonical.investorImpact).toBe(expected.investorImpact);
    expect(canonical.riskImpact).toBe(expected.riskImpact);
  });

  it("rejects an unknown role", () => {
    expect(() =>
      getCanonicalCandidateValues({ role: "Wizard", seniority: "mid", skill: "magic" }, "united states")
    ).toThrow(/Unknown role/);
  });

  it("rejects an unknown seniority", () => {
    expect(() =>
      // @ts-expect-error intentional bad seniority
      getCanonicalCandidateValues({ role: "CTO", seniority: "supreme", skill: "leadership" }, "united states")
    ).toThrow(/Unknown seniority/);
  });

  it("returns lower salary for lower-cost regions", () => {
    const us = getCanonicalCandidateValues(
      { role: "Backend Engineer", seniority: "mid", skill: "engineering" },
      "united states"
    );
    const india = getCanonicalCandidateValues(
      { role: "Backend Engineer", seniority: "mid", skill: "engineering" },
      "india"
    );
    expect(india.salary).toBeLessThan(us.salary);
  });
});

describe("isAllowedRole / isAllowedSeniority", () => {
  it("accepts every role in the salary bands table", () => {
    expect(isAllowedRole("CTO")).toBe(true);
    expect(isAllowedRole("AI Engineer")).toBe(true);
    expect(isAllowedRole("Customer Support")).toBe(true);
  });

  it("rejects unknown roles", () => {
    expect(isAllowedRole("Beanbag Architect")).toBe(false);
    expect(isAllowedRole("")).toBe(false);
  });

  it("accepts all four seniority levels", () => {
    expect(isAllowedSeniority("junior")).toBe(true);
    expect(isAllowedSeniority("mid")).toBe(true);
    expect(isAllowedSeniority("senior")).toBe(true);
    expect(isAllowedSeniority("lead")).toBe(true);
  });

  it("rejects unknown seniorities", () => {
    expect(isAllowedSeniority("supreme")).toBe(false);
    expect(isAllowedSeniority("intern")).toBe(false);
  });
});

describe("generateCandidateAtIndex", () => {
  it("produces the same candidate as generateCandidates at the same index", () => {
    const all = generateCandidates("s1", 3, "AI / ML");
    for (let i = 0; i < CANDIDATE_POOL_SIZE; i++) {
      const c = generateCandidateAtIndex("s1", 3, "AI / ML", i);
      expect(c).not.toBeNull();
      expect(c!.id).toBe(all[i].id);
      expect(c!.name).toBe(all[i].name);
      expect(c!.role).toBe(all[i].role);
      expect(c!.seniority).toBe(all[i].seniority);
    }
  });

  it("returns null for out-of-range indices", () => {
    expect(generateCandidateAtIndex("s1", 3, "SaaS", -1)).toBeNull();
    expect(generateCandidateAtIndex("s1", 3, "SaaS", CANDIDATE_POOL_SIZE)).toBeNull();
  });
});
