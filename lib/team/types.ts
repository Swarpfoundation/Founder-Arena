export interface Candidate {
  id: string;
  name: string;
  role: string;
  seniority: "junior" | "mid" | "senior" | "lead";
  salary: number;
  skill: string;
  moraleImpact: number;
  burnImpact: number;
  productImpact: number;
  revenueImpact: number;
  riskImpact: number;
  investorImpact: number;
  bio: string;
  warning?: string;
  // Phase 24: realistic all-in costs
  allInAnnual?: number;
  monthlyBurn?: number;
  runwayAfter?: number;
  // Phase 24: mission relevance
  missionRelevance?: "critical" | "helpful" | "neutral";
}

export interface OfficeSetup {
  type: "remote" | "coworking" | "small_office" | "premium_office";
  label: string;
  monthlyCost: number;
  moraleModifier: number;
  productivityModifier: number;
  description: string;
}

export interface TeamEffect {
  monthlyPayroll: number;
  officeCost: number;
  productivityModifier: number;
  moraleModifier: number;
  productDelta: number;
  revenueDelta: number;
  riskDelta: number;
  investorDelta: number;
  burnDelta: number;
}
