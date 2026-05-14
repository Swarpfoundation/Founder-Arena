export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  cashCost: number;
  burnDelta: number;
  productDelta: number;
  revenueDelta: number;
  investorDelta: number;
  marketDelta: number;
  riskDelta: number;
  minProductProgress?: number;
  sectorBoost?: Record<string, number>; // multiplier for specific sectors
}

export const DECISION_CATALOG: DecisionOption[] = [
  {
    id: "hire_engineer",
    label: "Hire Engineering Contractor",
    description: "Bring on a senior engineer to accelerate product development.",
    cashCost: 15000,
    burnDelta: 15000,
    productDelta: 12,
    revenueDelta: 0,
    investorDelta: 3,
    marketDelta: 0,
    riskDelta: -2,
    sectorBoost: { "AI / ML": 1.2, SaaS: 1.1 },
  },
  {
    id: "hire_sales",
    label: "Hire Sales Contractor",
    description: "Add a sales rep to drive early revenue.",
    cashCost: 12000,
    burnDelta: 12000,
    productDelta: 0,
    revenueDelta: 8000,
    investorDelta: 4,
    marketDelta: 2,
    riskDelta: 0,
    sectorBoost: { Fintech: 1.15, "E-commerce": 1.2 },
  },
  {
    id: "hire_compliance",
    label: "Hire Compliance Advisor",
    description: "Reduce regulatory risk with expert guidance.",
    cashCost: 8000,
    burnDelta: 8000,
    productDelta: 3,
    revenueDelta: 0,
    investorDelta: 2,
    marketDelta: 0,
    riskDelta: -8,
    sectorBoost: { Fintech: 1.3, Healthtech: 1.25 },
  },
  {
    id: "product_focus",
    label: "Increase Product Focus",
    description: "Double down on core features. Slower burn, faster progress.",
    cashCost: 5000,
    burnDelta: 5000,
    productDelta: 18,
    revenueDelta: 0,
    investorDelta: 2,
    marketDelta: 0,
    riskDelta: -1,
  },
  {
    id: "launch_beta",
    label: "Launch Beta",
    description: "Release beta to early users. Requires solid product foundation.",
    cashCost: 10000,
    burnDelta: 5000,
    productDelta: 8,
    revenueDelta: 3000,
    investorDelta: 6,
    marketDelta: 5,
    riskDelta: 3,
    minProductProgress: 40,
    sectorBoost: { Consumer: 1.3, SaaS: 1.2 },
  },
  {
    id: "marketing_spend",
    label: "Spend on Marketing",
    description: "Run ads and content campaigns to grow awareness.",
    cashCost: 18000,
    burnDelta: 18000,
    productDelta: 0,
    revenueDelta: 12000,
    investorDelta: 3,
    marketDelta: 4,
    riskDelta: 2,
    sectorBoost: { "E-commerce": 1.25, Consumer: 1.2 },
  },
  {
    id: "cut_costs",
    label: "Cut Costs",
    description: "Tighten spending. Reduces burn but may slow growth.",
    cashCost: 0,
    burnDelta: -10000,
    productDelta: -4,
    revenueDelta: -2000,
    investorDelta: -3,
    marketDelta: -2,
    riskDelta: -1,
  },
  {
    id: "improve_security",
    label: "Improve Security",
    description: "Invest in security audits and infrastructure.",
    cashCost: 10000,
    burnDelta: 8000,
    productDelta: 5,
    revenueDelta: 0,
    investorDelta: 4,
    marketDelta: 0,
    riskDelta: -6,
    sectorBoost: { Fintech: 1.3, "AI / ML": 1.1 },
  },
  {
    id: "customer_interviews",
    label: "Customer Interviews",
    description: "Talk to 50 potential customers. Low cost, high insight.",
    cashCost: 2000,
    burnDelta: 2000,
    productDelta: 6,
    revenueDelta: 1000,
    investorDelta: 2,
    marketDelta: 3,
    riskDelta: -3,
  },
  {
    id: "enterprise_push",
    label: "Enterprise Sales Push",
    description: "Target enterprise clients. High reward, long cycle.",
    cashCost: 20000,
    burnDelta: 15000,
    productDelta: 2,
    revenueDelta: 25000,
    investorDelta: 5,
    marketDelta: 3,
    riskDelta: 4,
    minProductProgress: 50,
    sectorBoost: { Enterprise: 1.3, SaaS: 1.2 },
  },
  {
    id: "delay_launch",
    label: "Delay Launch for Quality",
    description: "Polish the product before release. Safer but slower.",
    cashCost: 3000,
    burnDelta: 3000,
    productDelta: 10,
    revenueDelta: -1000,
    investorDelta: 1,
    marketDelta: -1,
    riskDelta: -4,
  },
  {
    id: "fundraising_prep",
    label: "Fundraising Preparation",
    description: "Prepare deck and metrics for next round.",
    cashCost: 5000,
    burnDelta: 5000,
    productDelta: 0,
    revenueDelta: 0,
    investorDelta: 8,
    marketDelta: 0,
    riskDelta: -2,
  },
];

export function getDecisionById(id: string): DecisionOption | undefined {
  return DECISION_CATALOG.find((d) => d.id === id);
}

export function getAvailableDecisions(
  cash: number,
  productProgress: number,
  sector: string,
  month: number
): DecisionOption[] {
  return DECISION_CATALOG.filter((d) => {
    // Must afford it, unless it's cost cutting
    if (d.cashCost > cash && d.id !== "cut_costs") return false;
    // Product progress gate
    if (d.minProductProgress && productProgress < d.minProductProgress) return false;
    // Month 1: no launch or enterprise push
    if (month <= 1 && (d.id === "launch_beta" || d.id === "enterprise_push")) return false;
    return true;
  }).map((d) => {
    // Apply sector boost if any
    const boost = d.sectorBoost?.[sector] ?? 1.0;
    if (boost === 1.0) return d;
    return {
      ...d,
      productDelta: Math.round(d.productDelta * boost),
      revenueDelta: Math.round(d.revenueDelta * boost),
      investorDelta: Math.round(d.investorDelta * boost),
    };
  });
}

export function validateDecisionSelection(
  decisionIds: string[],
  cash: number,
  productProgress: number,
  sector: string,
  month: number
): { valid: boolean; error?: string } {
  if (decisionIds.length === 0) {
    return { valid: false, error: "Select at least one action" };
  }
  if (decisionIds.length > 3) {
    return { valid: false, error: "Select at most 3 actions" };
  }

  const available = getAvailableDecisions(cash, productProgress, sector, month);
  const availableIds = new Set(available.map((d) => d.id));

  for (const id of decisionIds) {
    if (!availableIds.has(id)) {
      return { valid: false, error: `Action "${id}" is not available` };
    }
  }

  const totalCost = decisionIds.reduce((sum, id) => {
    const d = getDecisionById(id);
    return sum + (d?.cashCost ?? 0);
  }, 0);

  if (totalCost > cash) {
    return { valid: false, error: "Total cost exceeds available cash" };
  }

  return { valid: true };
}
