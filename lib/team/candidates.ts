import { Candidate } from "./types";
import { calculateEmployeeCost } from "@/lib/economy/cost-engine";
import {
  getRoleImpacts,
  getSkillForRole,
  isAllowedSeniority,
  isAllowedRole,
  type AllowedSeniority,
} from "@/lib/economy/salary-bands";

const FIRST_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery",
  "Sam", "Jamie", "Dakota", "Reese", "Skyler", "Rowan", "Emerson", "Finley",
  "Sage", "River", "Phoenix", "Eden", "Kai", "Remi", "Hayden", "Charlie",
];

const LAST_NAMES = [
  "Chen", "Patel", "Kim", "Singh", "Gupta", "Rodriguez", "Silva", "Kowalski",
  "Nakamura", "Ivanov", "Müller", "Rossi", "Dubois", "O'Brien", "Jansen",
  "Andersson", "Popov", "Fischer", "Lombardi", "Santos", "Weber", "Liu",
];

const ROLES: Array<{
  role: string;
  baseSalary: number;
  productImpact: number;
  revenueImpact: number;
  riskImpact: number;
  investorImpact: number;
  skill: string;
}> = [
  { role: "CTO", baseSalary: 25000, productImpact: 15, revenueImpact: 0, riskImpact: -3, investorImpact: 5, skill: "leadership" },
  { role: "Full-stack Engineer", baseSalary: 16000, productImpact: 12, revenueImpact: 0, riskImpact: -1, investorImpact: 2, skill: "engineering" },
  { role: "Backend Engineer", baseSalary: 15000, productImpact: 10, revenueImpact: 0, riskImpact: -1, investorImpact: 2, skill: "engineering" },
  { role: "Frontend Engineer", baseSalary: 14000, productImpact: 10, revenueImpact: 0, riskImpact: -1, investorImpact: 2, skill: "engineering" },
  { role: "Product Designer", baseSalary: 13000, productImpact: 9, revenueImpact: 2, riskImpact: 0, investorImpact: 1, skill: "design" },
  { role: "Sales Lead", baseSalary: 18000, productImpact: 0, revenueImpact: 15, riskImpact: 2, investorImpact: 4, skill: "sales" },
  { role: "Marketing Manager", baseSalary: 14000, productImpact: 2, revenueImpact: 10, riskImpact: 1, investorImpact: 3, skill: "marketing" },
  { role: "Compliance Advisor", baseSalary: 12000, productImpact: 1, revenueImpact: 0, riskImpact: -8, investorImpact: 2, skill: "compliance" },
  { role: "Security Engineer", baseSalary: 17000, productImpact: 5, revenueImpact: 0, riskImpact: -6, investorImpact: 3, skill: "security" },
  { role: "AI Engineer", baseSalary: 20000, productImpact: 14, revenueImpact: 2, riskImpact: -1, investorImpact: 4, skill: "ai" },
  { role: "Customer Support", baseSalary: 8000, productImpact: 2, revenueImpact: 4, riskImpact: -1, investorImpact: 1, skill: "support" },
  { role: "Finance/Ops Manager", baseSalary: 15000, productImpact: 0, revenueImpact: 3, riskImpact: -4, investorImpact: 4, skill: "finance" },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickFromSeed<T>(seed: string, arr: T[]): T {
  const hash = hashString(seed);
  return arr[hash % arr.length];
}

function salaryForSeniority(base: number, seniority: string): number {
  switch (seniority) {
    case "junior": return Math.round(base * 0.6);
    case "mid": return base;
    case "senior": return Math.round(base * 1.4);
    case "lead": return Math.round(base * 1.8);
    default: return base;
  }
}

export const CANDIDATE_POOL_SIZE = 5;

export function generateCandidates(startupId: string, month: number, sector: string): Candidate[] {
  const candidates: Candidate[] = [];
  for (let i = 0; i < CANDIDATE_POOL_SIZE; i++) {
    const c = generateCandidateAtIndex(startupId, month, sector, i);
    if (c) candidates.push(c);
  }
  return candidates;
}

/**
 * Deterministic candidate generation by index.
 *
 * Identity (id, name, role, seniority, skill, bio) is derived from the seed.
 * The dollar `salary` and gameplay impacts produced here are placeholder
 * values — the cost engine and salary-bands are the authoritative numbers.
 * Callers should ALWAYS overlay the cost-engine values via
 * `enrichCandidateWithCanonicalCost` or `getCanonicalCandidate` before
 * displaying or persisting anything that affects the economy.
 */
export function generateCandidateAtIndex(
  startupId: string,
  month: number,
  sector: string,
  i: number
): Candidate | null {
  if (i < 0 || i >= CANDIDATE_POOL_SIZE) return null;

  const seed = `${startupId}-${month}-${i}`;
  const roleDef = pickFromSeed(seed + "role", ROLES);

  const seniorities: Array<Candidate["seniority"]> = ["junior", "mid", "senior", "lead"];
  const seniority = pickFromSeed(seed + "sen", seniorities);

  const firstName = pickFromSeed(seed + "fn", FIRST_NAMES);
  const lastName = pickFromSeed(seed + "ln", LAST_NAMES);

  const salary = salaryForSeniority(roleDef.baseSalary, seniority);

  // Sector-specific salary modifiers (display-only; cost engine recomputes)
  let finalSalary = salary;
  if (sector === "AI / ML" && roleDef.skill === "ai") finalSalary = Math.round(salary * 1.2);
  if (sector === "Fintech" && roleDef.skill === "compliance") finalSalary = Math.round(salary * 1.15);
  if (sector === "Healthtech" && roleDef.skill === "security") finalSalary = Math.round(salary * 1.1);

  const seniorityMultiplier = seniority === "junior" ? 0.7 : seniority === "mid" ? 1.0 : seniority === "senior" ? 1.3 : 1.6;

  return {
    id: `cand-${month}-${i}`,
    name: `${firstName} ${lastName}`,
    role: roleDef.role,
    seniority,
    salary: finalSalary,
    skill: roleDef.skill,
    moraleImpact: Math.round(5 * seniorityMultiplier),
    burnImpact: finalSalary,
    productImpact: Math.round(roleDef.productImpact * seniorityMultiplier),
    revenueImpact: Math.round(roleDef.revenueImpact * seniorityMultiplier),
    riskImpact: roleDef.riskImpact,
    investorImpact: Math.round(roleDef.investorImpact * seniorityMultiplier),
    bio: `${firstName} is a ${seniority} ${roleDef.role.toLowerCase()} with expertise in ${roleDef.skill}.`,
    warning: seniority === "lead" ? "Premium hire — high salary but strong impact." : undefined,
  };
}

/**
 * Authoritative cost+impacts for a generated candidate.
 *
 * Use this in BOTH the display path (`getTeamState` enrichment) and the
 * server-side hire path so the user always sees and pays the same numbers.
 *
 * `region` comes from the startup row, never from the client.
 */
export function getCanonicalCandidateValues(
  candidate: Pick<Candidate, "role" | "seniority" | "skill">,
  region: string
): {
  salary: number;        // monthly burn (cost-engine all-in / 12)
  allInAnnual: number;
  monthlyBurn: number;
  moraleImpact: number;
  burnImpact: number;
  productImpact: number;
  revenueImpact: number;
  riskImpact: number;
  investorImpact: number;
  skill: string;
} {
  if (!isAllowedRole(candidate.role)) {
    throw new Error(`Unknown role: ${candidate.role}`);
  }
  if (!isAllowedSeniority(candidate.seniority)) {
    throw new Error(`Unknown seniority: ${candidate.seniority}`);
  }

  const seniority: AllowedSeniority = candidate.seniority;
  const cost = calculateEmployeeCost(candidate.role, seniority, region);
  const impacts = getRoleImpacts(candidate.role, seniority);

  return {
    salary: cost.monthlyBurn,
    allInAnnual: cost.allInAnnual,
    monthlyBurn: cost.monthlyBurn,
    moraleImpact: impacts.moraleImpact,
    burnImpact: cost.monthlyBurn,
    productImpact: impacts.productImpact,
    revenueImpact: impacts.revenueImpact,
    riskImpact: impacts.riskImpact,
    investorImpact: impacts.investorImpact,
    skill: getSkillForRole(candidate.role),
  };
}
