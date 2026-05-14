/**
 * Founder Arena — Realistic Salary Bands (annual all-in USD)
 *
 * These are baseline US-market all-in costs.
 * Region multipliers and overhead are applied separately.
 */

import { SalaryBand } from "./types";

export const SALARY_BANDS: SalaryBand[] = [
  {
    role: "CTO",
    junior: 140000, mid: 220000, senior: 320000, lead: 420000,
    skill: "leadership",
    productImpact: 15, revenueImpact: 0, riskImpact: -3, investorImpact: 5,
  },
  {
    role: "Full-stack Engineer",
    junior: 90000, mid: 140000, senior: 210000, lead: 280000,
    skill: "engineering",
    productImpact: 12, revenueImpact: 0, riskImpact: -1, investorImpact: 2,
  },
  {
    role: "Backend Engineer",
    junior: 100000, mid: 150000, senior: 230000, lead: 300000,
    skill: "engineering",
    productImpact: 10, revenueImpact: 0, riskImpact: -1, investorImpact: 2,
  },
  {
    role: "Frontend Engineer",
    junior: 85000, mid: 130000, senior: 190000, lead: 260000,
    skill: "engineering",
    productImpact: 10, revenueImpact: 0, riskImpact: -1, investorImpact: 2,
  },
  {
    role: "AI Engineer",
    junior: 140000, mid: 220000, senior: 330000, lead: 420000,
    skill: "ai",
    productImpact: 14, revenueImpact: 2, riskImpact: -1, investorImpact: 4,
  },
  {
    role: "Blockchain Engineer",
    junior: 130000, mid: 210000, senior: 320000, lead: 400000,
    skill: "blockchain",
    productImpact: 12, revenueImpact: 1, riskImpact: -1, investorImpact: 3,
  },
  {
    role: "Security Engineer",
    junior: 120000, mid: 190000, senior: 290000, lead: 380000,
    skill: "security",
    productImpact: 5, revenueImpact: 0, riskImpact: -6, investorImpact: 3,
  },
  {
    role: "Product Designer",
    junior: 80000, mid: 125000, senior: 180000, lead: 240000,
    skill: "design",
    productImpact: 9, revenueImpact: 2, riskImpact: 0, investorImpact: 1,
  },
  {
    role: "Sales Lead",
    junior: 90000, mid: 150000, senior: 250000, lead: 350000,
    skill: "sales",
    productImpact: 0, revenueImpact: 15, riskImpact: 2, investorImpact: 4,
  },
  {
    role: "Marketing Manager",
    junior: 70000, mid: 110000, senior: 160000, lead: 220000,
    skill: "marketing",
    productImpact: 2, revenueImpact: 10, riskImpact: 1, investorImpact: 3,
  },
  {
    role: "Compliance Advisor",
    junior: 100000, mid: 170000, senior: 260000, lead: 340000,
    skill: "compliance",
    productImpact: 1, revenueImpact: 0, riskImpact: -8, investorImpact: 2,
  },
  {
    role: "Finance/Ops Manager",
    junior: 90000, mid: 140000, senior: 200000, lead: 270000,
    skill: "finance",
    productImpact: 0, revenueImpact: 3, riskImpact: -4, investorImpact: 4,
  },
  {
    role: "Customer Support",
    junior: 45000, mid: 70000, senior: 100000, lead: 130000,
    skill: "support",
    productImpact: 2, revenueImpact: 4, riskImpact: -1, investorImpact: 1,
  },
  {
    role: "Product Manager",
    junior: 85000, mid: 135000, senior: 200000, lead: 280000,
    skill: "product",
    productImpact: 8, revenueImpact: 3, riskImpact: -1, investorImpact: 2,
  },
  {
    role: "Domain Advisor",
    junior: 100000, mid: 160000, senior: 240000, lead: 320000,
    skill: "domain",
    productImpact: 5, revenueImpact: 2, riskImpact: -2, investorImpact: 3,
  },
  {
    role: "Data Engineer",
    junior: 100000, mid: 155000, senior: 230000, lead: 300000,
    skill: "data",
    productImpact: 8, revenueImpact: 1, riskImpact: -1, investorImpact: 2,
  },
];

export function getSalaryBand(role: string): SalaryBand | undefined {
  return SALARY_BANDS.find((b) => b.role === role);
}

export function getAllRoles(): string[] {
  return SALARY_BANDS.map((b) => b.role);
}

export function getSkillForRole(role: string): string {
  return getSalaryBand(role)?.skill ?? "general";
}

export const ALLOWED_SENIORITIES = ["junior", "mid", "senior", "lead"] as const;
export type AllowedSeniority = (typeof ALLOWED_SENIORITIES)[number];

export function isAllowedSeniority(value: string): value is AllowedSeniority {
  return (ALLOWED_SENIORITIES as readonly string[]).includes(value);
}

export function isAllowedRole(value: string): boolean {
  return SALARY_BANDS.some((b) => b.role === value);
}

/**
 * Canonical, deterministic seniority-scaled impacts for a role.
 *
 * `salary-bands.ts` is the SINGLE SOURCE OF TRUTH for an employee's
 * gameplay impact. The candidate generator may use these for display,
 * but the hire action MUST read from here and never trust client values.
 */
export function getRoleImpacts(role: string, seniority: AllowedSeniority): {
  productImpact: number;
  revenueImpact: number;
  riskImpact: number;
  investorImpact: number;
  moraleImpact: number;
} {
  const band = getSalaryBand(role);
  const mult =
    seniority === "junior" ? 0.7 :
    seniority === "mid" ? 1.0 :
    seniority === "senior" ? 1.3 :
    1.6; // lead

  if (!band) {
    return {
      productImpact: 0,
      revenueImpact: 0,
      riskImpact: 0,
      investorImpact: 0,
      moraleImpact: Math.round(5 * mult),
    };
  }

  return {
    productImpact: Math.round(band.productImpact * mult),
    revenueImpact: Math.round(band.revenueImpact * mult),
    // riskImpact is bounded to integers but not seniority-scaled — risk
    // reduction from a senior compliance hire shouldn't double over a junior.
    riskImpact: band.riskImpact,
    investorImpact: Math.round(band.investorImpact * mult),
    moraleImpact: Math.round(5 * mult),
  };
}
