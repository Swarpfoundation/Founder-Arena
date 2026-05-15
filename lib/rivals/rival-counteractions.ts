import type { RivalCounterAction } from "./types";

export const RIVAL_COUNTER_ACTIONS: RivalCounterAction[] = [
  // ── 1. Counter-Positioning Thread ──────────────────────────────────────────
  {
    id: "counter_positioning_thread",
    title: "Counter-Positioning Thread",
    description:
      "Post a direct response to the rival narrative. Clarify your differentiation, reclaim your ICP, and signal to investors you're aware and controlled.",
    cost: 1500,
    effects: {
      socialTrustDelta: 8,
      socialHypeDelta: 5,
      brandRiskDelta: -6,
      socialSentimentDelta: 6,
      rivalryScoreReduction: 5,
    },
    riskLevel: "low",
    tags: ["narrative", "trust", "brand-defense"],
  },

  // ── 2. Accelerate Beta ─────────────────────────────────────────────────────
  {
    id: "accelerate_beta",
    title: "Accelerate Beta",
    description:
      "Compress the product timeline to stay ahead of copycat pressure. Increases burn, adds risk, but closes the product gap before a rival can steal your positioning.",
    cost: 8000,
    effects: {
      productProgressDelta: 12,
      riskScoreDelta: 4,
      socialHypeDelta: 6,
      rivalHypeReduction: 8,
      rivalTractionReduction: 6,
    },
    riskLevel: "high",
    requiredMinProductProgress: 30,
    countersArchetypes: ["copycat", "technical_genius"],
    tags: ["product", "competitive", "velocity"],
  },

  // ── 3. Customer Proof Campaign ─────────────────────────────────────────────
  {
    id: "customer_proof_campaign",
    title: "Customer Proof Campaign",
    description:
      "Feature real users publicly. Converts prospects sitting on the fence, defends against customer poaching, and signals you have traction even rivals can't dispute.",
    cost: 3500,
    effects: {
      socialTrustDelta: 10,
      socialSentimentDelta: 8,
      revenueDelta: 3000,
      userGrowthDelta: 150,
      rivalTractionReduction: 5,
    },
    riskLevel: "low",
    requiredMinRevenue: 5000,
    countersArchetypes: ["enterprise_killer", "copycat", "predator_vc_backed"],
    tags: ["trust", "conversion", "customer-defense"],
  },

  // ── 4. Enterprise Discount Offensive ──────────────────────────────────────
  {
    id: "enterprise_discount_offensive",
    title: "Enterprise Discount Offensive",
    description:
      "Cut deal terms to lock in enterprise accounts before the rival closes them. Short-term revenue hit, but blocks a competitive beachhead. High-burn play.",
    cost: 5000,
    effects: {
      revenueDelta: 4000,
      userGrowthDelta: 80,
      investorScoreDelta: -2,
      rivalTractionReduction: 8,
    },
    riskLevel: "medium",
    requiredMinRevenue: 10000,
    countersArchetypes: ["enterprise_killer", "predator_vc_backed"],
    tags: ["revenue", "enterprise", "competitive-pricing"],
  },

  // ── 5. Quiet Execution ─────────────────────────────────────────────────────
  {
    id: "quiet_execution",
    title: "Quiet Execution",
    description:
      "Disengage from the noise. Focus entirely on product and customer delivery. Reduces brand risk and drains the rival's narrative fuel by refusing to engage.",
    cost: 0,
    effects: {
      brandRiskDelta: -10,
      socialHypeDelta: -3,
      productProgressDelta: 6,
      rivalryScoreReduction: 8,
    },
    riskLevel: "low",
    tags: ["brand-defense", "product", "patience"],
  },

  // ── 6. Founder Debate ─────────────────────────────────────────────────────
  {
    id: "founder_debate",
    title: "Founder Debate / Public Response",
    description:
      "Enter the public arena directly. Challenge the rival's narrative with a visible response. High-risk: backfires with low trust. High-reward: can shift the narrative completely.",
    cost: 2000,
    effects: {
      socialHypeDelta: 12,
      brandRiskDelta: 8,
      socialTrustDelta: -4,
      rivalryScoreReduction: 10,
      rivalHypeReduction: 10,
    },
    riskLevel: "high",
    requiredMinTrust: 40,
    requiredMinRivalryScore: 30,
    tags: ["hype", "high-risk", "narrative-battle"],
  },
];

export function getCounterActionById(id: string): RivalCounterAction | undefined {
  return RIVAL_COUNTER_ACTIONS.find((a) => a.id === id);
}
