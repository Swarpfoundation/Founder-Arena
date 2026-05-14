/**
 * Founder Arena — Office & Workspace Costs
 */

import { OfficeCost } from "./types";

export const OFFICE_COSTS: OfficeCost[] = [
  {
    type: "remote",
    label: "Remote First",
    monthlyCost: 0,
    moraleModifier: -0.05,
    productivityModifier: 0.95,
    description: "Zero office cost. Slightly lower morale and productivity. Good hiring flexibility.",
  },
  {
    type: "coworking",
    label: "Coworking Space",
    monthlyCost: 3000,
    moraleModifier: 0.05,
    productivityModifier: 1.05,
    description: "Moderate cost. Boosts morale and productivity with networking opportunities.",
  },
  {
    type: "small_office",
    label: "Small Office",
    monthlyCost: 8000,
    moraleModifier: 0.1,
    productivityModifier: 1.1,
    description: "Higher cost. Stronger productivity and team cohesion.",
  },
  {
    type: "premium_office",
    label: "Premium Office",
    monthlyCost: 20000,
    moraleModifier: 0.15,
    productivityModifier: 1.15,
    description: "Very high cost. Sends strong investor signal but dangerous burn.",
  },
];

export function getOfficeCost(type: string): OfficeCost {
  return OFFICE_COSTS.find((o) => o.type === type) ?? OFFICE_COSTS[0];
}
