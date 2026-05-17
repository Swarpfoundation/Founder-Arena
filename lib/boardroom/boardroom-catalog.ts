import type {
  BoardroomEventTemplate,
  BoardroomResponseOption,
  BoardroomTriggerContext,
} from "./types";

// ─── Event Templates ──────────────────────────────────────────────────────────

export const BOARDROOM_EVENT_TEMPLATES: BoardroomEventTemplate[] = [
  // ── RUNWAY CRISIS ────────────────────────────────────────────────────────
  {
    pressureType: "runway_crisis",
    severity: "critical",
    titleTemplate: "Emergency Runway Meeting",
    concernTemplate: "We have {runway} months of runway. If this continues, we shut down.",
    boardQuestionTemplate: "What is your plan to extend runway before cash runs out?",
    contextTemplate: "{name} is burning ${burn}/mo with ${cash} in the bank — {runway} months left.",
    tags: ["cash", "survival", "emergency"],
    responseOptions: [
      {
        id: "runway_cut_burn",
        title: "Cut Burn Aggressively",
        stance: "defensive",
        description: "Reduce monthly burn by laying off non-essential roles and pausing discretionary spend.",
        projectedEffects: { burnDelta: -8000, investorScoreDelta: 5, boardConfidenceDelta: 10, riskScoreDelta: -8, founderControlDelta: -5, investorPatienceDelta: 10 },
        risk: "medium",
        recommendedForPlaystyles: ["cockroach", "technical_builder"],
      },
      {
        id: "runway_emergency_raise",
        title: "Emergency Fundraise",
        stance: "aggressive",
        description: "Go back to investors immediately with traction data and a do-or-die pitch.",
        requirements: { minInvestorScore: 35 },
        projectedEffects: { investorScoreDelta: -10, boardConfidenceDelta: 5, riskScoreDelta: 5, investorPatienceDelta: -15, founderControlDelta: -10 },
        risk: "high",
        contextNote: "High risk — desperation signals weakness. Only viable with existing investor relationships.",
        recommendedForPlaystyles: ["capital_blitzscaler"],
      },
      {
        id: "runway_pivot_revenue",
        title: "Revenue-First Pivot",
        stance: "pivot",
        description: "Halt product development. Push every resource into closing paying customers this sprint.",
        projectedEffects: { revenueDelta: 3000, burnDelta: -3000, riskScoreDelta: -5, productProgressDelta: -5, investorPatienceDelta: 5, boardConfidenceDelta: 8 },
        risk: "medium",
        recommendedForPlaystyles: ["enterprise_sales", "community_led"],
      },
      {
        id: "runway_transparent_hold",
        title: "Transparent Runway Update",
        stance: "transparent",
        description: "Share full financial picture with the board. Request 60-day hold to show traction.",
        projectedEffects: { boardConfidenceDelta: -5, founderControlDelta: 5, investorPatienceDelta: -10, riskScoreDelta: -3, investorScoreDelta: -5 },
        risk: "low",
        contextNote: "Preserves trust but doesn't solve the cash problem.",
        recommendedForPlaystyles: ["trust_builder", "regulated_operator"],
      },
    ],
  },

  // ── INVESTOR CONFLICT ─────────────────────────────────────────────────────
  {
    pressureType: "investor_conflict",
    severity: "high",
    titleTemplate: "Investor Confidence Crisis",
    concernTemplate: "Investor confidence has collapsed to {investorScore}/100. We need answers.",
    boardQuestionTemplate: "The board is losing faith. What will you do to restore investor confidence?",
    contextTemplate: "{name}'s investor score has fallen to {investorScore} in Week {month}.",
    tags: ["investors", "board", "confidence"],
    responseOptions: [
      {
        id: "investor_data_defense",
        title: "Data-Driven Defense",
        stance: "transparent",
        description: "Present a complete metrics review: leading indicators, product milestones, pipeline.",
        projectedEffects: { investorScoreDelta: 12, boardConfidenceDelta: 15, riskScoreDelta: -5, founderControlDelta: 8, investorPatienceDelta: 5 },
        risk: "low",
        recommendedForPlaystyles: ["technical_builder", "product_led", "trust_builder"],
      },
      {
        id: "investor_new_terms",
        title: "Offer Board Restructure",
        stance: "negotiate",
        description: "Propose a milestone-based board restructure. Give them more control in exchange for patience.",
        projectedEffects: { investorScoreDelta: 8, boardConfidenceDelta: 20, riskScoreDelta: 0, founderControlDelta: -15, investorPatienceDelta: 15 },
        risk: "medium",
        contextNote: "Sacrifices founder control. Consider this only if alternatives are exhausted.",
        recommendedForPlaystyles: ["regulated_operator"],
      },
      {
        id: "investor_double_down",
        title: "Double Down on Vision",
        stance: "double_down",
        description: "Restate the 3-year vision. Tell the board the short-term dip is part of the plan.",
        projectedEffects: { investorScoreDelta: -5, boardConfidenceDelta: -8, founderControlDelta: 12, riskScoreDelta: 5, investorPatienceDelta: -10 },
        risk: "high",
        contextNote: "Alienates data-driven investors. Works only if vision is genuinely compelling.",
        recommendedForPlaystyles: ["hype_machine", "capital_blitzscaler"],
      },
      {
        id: "investor_new_hire",
        title: "Hire Experienced Operator",
        stance: "defensive",
        description: "Commit to hiring a COO or VP Sales to address execution concerns.",
        requirements: { minCash: 20000 },
        projectedEffects: { investorScoreDelta: 10, boardConfidenceDelta: 12, burnDelta: 6000, founderControlDelta: -10, riskScoreDelta: -5, investorPatienceDelta: 8 },
        risk: "medium",
        recommendedForPlaystyles: ["enterprise_sales"],
      },
    ],
  },

  // ── REVENUE MISS ──────────────────────────────────────────────────────────
  {
    pressureType: "revenue_miss",
    severity: "high",
    titleTemplate: "Revenue Miss Debrief",
    concernTemplate: "Week {month} and revenue is ${revenue}. This is below every projection we made.",
    boardQuestionTemplate: "Revenue has missed targets. What is your path to first dollar — or next dollar?",
    contextTemplate: "{name} has generated ${revenue}/mo revenue by Week {month}.",
    tags: ["revenue", "monetization", "growth"],
    responseOptions: [
      {
        id: "revenue_direct_sales",
        title: "Founder-Led Sales Sprint",
        stance: "aggressive",
        description: "Founder takes 5 sales calls per week for 30 days. No distractions.",
        projectedEffects: { revenueDelta: 4000, burnDelta: 0, investorScoreDelta: 8, productProgressDelta: -3, boardConfidenceDelta: 10, founderControlDelta: 3 },
        risk: "medium",
        recommendedForPlaystyles: ["enterprise_sales", "community_led"],
      },
      {
        id: "revenue_pricing_change",
        title: "Reprice the Product",
        stance: "pivot",
        description: "Introduce a lower-tier plan or freemium to accelerate top-of-funnel.",
        projectedEffects: { revenueDelta: 2000, valuationDelta: -50000, socialHypeDelta: 5, boardConfidenceDelta: 5, riskScoreDelta: 3 },
        risk: "medium",
        recommendedForPlaystyles: ["product_led", "community_led", "hype_machine"],
      },
      {
        id: "revenue_enterprise_pivot",
        title: "Go Upmarket — Enterprise Only",
        stance: "pivot",
        description: "Stop chasing SMBs. Target 3 enterprise accounts at 10x the price.",
        requirements: { minProductProgress: 50 },
        projectedEffects: { revenueDelta: 5000, burnDelta: 2000, investorScoreDelta: 10, boardConfidenceDelta: 12, founderControlDelta: 5, riskScoreDelta: 3 },
        risk: "high",
        contextNote: "High ceiling, longer sales cycle. Requires real product.",
        recommendedForPlaystyles: ["enterprise_sales", "regulated_operator"],
      },
      {
        id: "revenue_honest_timeline",
        title: "Revise Revenue Timeline",
        stance: "transparent",
        description: "Formally revise the revenue timeline. Commit to a specific target with accountability.",
        projectedEffects: { investorScoreDelta: -5, boardConfidenceDelta: -3, founderControlDelta: 5, investorPatienceDelta: -8, riskScoreDelta: -5 },
        risk: "low",
        recommendedForPlaystyles: ["trust_builder", "technical_builder"],
      },
    ],
  },

  // ── PRODUCT DELAY ─────────────────────────────────────────────────────────
  {
    pressureType: "product_delay",
    severity: "medium",
    titleTemplate: "Product Roadmap Review",
    concernTemplate: "Product is at {productProgress}% after {month} Founder Weeks. Milestone targets were missed.",
    boardQuestionTemplate: "Why is the product behind schedule and how will you recover?",
    contextTemplate: "{name} product progress is {productProgress}% at Week {month}.",
    tags: ["product", "engineering", "milestones"],
    responseOptions: [
      {
        id: "product_scope_cut",
        title: "Cut MVP Scope",
        stance: "pivot",
        description: "Ruthlessly cut scope. Ship a smaller but complete version of the product now.",
        projectedEffects: { productProgressDelta: 15, riskScoreDelta: -5, investorScoreDelta: 5, boardConfidenceDelta: 8, burnDelta: -2000 },
        risk: "low",
        recommendedForPlaystyles: ["product_led", "technical_builder", "cockroach"],
      },
      {
        id: "product_hire_engineer",
        title: "Emergency Engineering Hire",
        stance: "aggressive",
        description: "Hire a senior engineer to accelerate the build. Burn more, move faster.",
        requirements: { minCash: 25000 },
        projectedEffects: { productProgressDelta: 10, burnDelta: 7000, riskScoreDelta: 3, investorScoreDelta: 3, boardConfidenceDelta: 5 },
        risk: "medium",
        recommendedForPlaystyles: ["capital_blitzscaler", "enterprise_sales"],
      },
      {
        id: "product_customer_codevelopment",
        title: "Co-Develop with a Design Partner",
        stance: "negotiate",
        description: "Partner with a paying customer to co-develop the product. Revenue + direction.",
        projectedEffects: { productProgressDelta: 12, revenueDelta: 2000, investorScoreDelta: 8, boardConfidenceDelta: 10, socialTrustDelta: 5 },
        risk: "medium",
        recommendedForPlaystyles: ["trust_builder", "enterprise_sales", "community_led"],
      },
      {
        id: "product_delay_accept",
        title: "Accept Delay, Protect Quality",
        stance: "transparent",
        description: "Acknowledge the delay. Commit to a new ship date. Don't compromise quality.",
        projectedEffects: { boardConfidenceDelta: -5, founderControlDelta: 8, investorPatienceDelta: -5, riskScoreDelta: -3 },
        risk: "low",
        recommendedForPlaystyles: ["technical_builder", "regulated_operator"],
      },
    ],
  },

  // ── BRAND RISK ────────────────────────────────────────────────────────────
  {
    pressureType: "brand_risk",
    severity: "high",
    titleTemplate: "Brand Risk Hearing",
    concernTemplate: "Brand risk is at {brandRisk}/100. Public incidents are threatening investor relationships.",
    boardQuestionTemplate: "The brand is under fire. What is your crisis response plan?",
    contextTemplate: "{name} has a brand risk score of {brandRisk} going into Week {month}.",
    tags: ["brand", "reputation", "crisis", "social"],
    responseOptions: [
      {
        id: "brand_public_apology",
        title: "Public Accountability Statement",
        stance: "transparent",
        description: "Issue a detailed public statement. Own the mistake completely. No spin.",
        projectedEffects: { brandRiskDelta: -20, socialTrustDelta: 10, socialHypeDelta: -5, investorScoreDelta: 5, boardConfidenceDelta: 8, riskScoreDelta: -8 },
        risk: "low",
        recommendedForPlaystyles: ["trust_builder", "community_led"],
      },
      {
        id: "brand_silence_legal",
        title: "Legal Silence Protocol",
        stance: "defensive",
        description: "Instruct legal to contain the narrative. No comment policy until resolved.",
        projectedEffects: { brandRiskDelta: -5, socialTrustDelta: -10, socialHypeDelta: -8, investorScoreDelta: -5, boardConfidenceDelta: 3, riskScoreDelta: -3 },
        risk: "medium",
        contextNote: "Buys time but destroys community trust. Use only when legal exposure is real.",
        recommendedForPlaystyles: ["regulated_operator"],
      },
      {
        id: "brand_redirect_narrative",
        title: "Redirect with Product Launch",
        stance: "aggressive",
        description: "Launch a new feature or partnership immediately to shift the narrative.",
        requirements: { minProductProgress: 40 },
        projectedEffects: { brandRiskDelta: -15, socialHypeDelta: 15, socialTrustDelta: -5, productProgressDelta: -5, investorScoreDelta: 3, boardConfidenceDelta: 5 },
        risk: "high",
        contextNote: "High upside if product can deliver. Backfires if the launch falls flat.",
        recommendedForPlaystyles: ["hype_machine", "product_led"],
      },
      {
        id: "brand_community_repair",
        title: "Community Repair Campaign",
        stance: "negotiate",
        description: "Invest in direct community outreach. Host AMAs, respond publicly, show the human side.",
        projectedEffects: { brandRiskDelta: -18, socialTrustDelta: 15, socialHypeDelta: 5, investorScoreDelta: 5, riskScoreDelta: -5 },
        risk: "low",
        recommendedForPlaystyles: ["community_led", "trust_builder"],
      },
    ],
  },

  // ── RIVAL PRESSURE ────────────────────────────────────────────────────────
  {
    pressureType: "rival_pressure",
    severity: "medium",
    titleTemplate: "Rival Pressure Review",
    concernTemplate: "A rival startup is outperforming you significantly. The board wants a response.",
    boardQuestionTemplate: "A rival is gaining ground fast. What is your competitive strategy?",
    contextTemplate: "{name} faces a rival with rivalry score {rivalryScore} in sector {sector}.",
    tags: ["competition", "rivalry", "market"],
    responseOptions: [
      {
        id: "rival_differentiate",
        title: "Sharpen Differentiation",
        stance: "double_down",
        description: "Double down on the one thing your rival can't copy. Own your unique wedge.",
        projectedEffects: { investorScoreDelta: 8, productProgressDelta: 5, socialTrustDelta: 8, boardConfidenceDelta: 10, riskScoreDelta: -3, strategySignal: "product_led" },
        risk: "low",
        recommendedForPlaystyles: ["product_led", "technical_builder", "trust_builder"],
      },
      {
        id: "rival_aggressive_counter",
        title: "Aggressive Counter-Positioning",
        stance: "aggressive",
        description: "Launch a direct comparison campaign. Make their weaknesses your strengths publicly.",
        projectedEffects: { socialHypeDelta: 15, socialTrustDelta: -5, brandRiskDelta: 8, investorScoreDelta: 5, boardConfidenceDelta: 5, strategySignal: "hype_machine" },
        risk: "high",
        contextNote: "Raises brand risk. Effective if rival has obvious weaknesses.",
        recommendedForPlaystyles: ["hype_machine", "rival_killer"],
      },
      {
        id: "rival_partnership",
        title: "Explore Rival Partnership",
        stance: "negotiate",
        description: "Open back-channel talks. Co-exist in the market or explore a merger.",
        projectedEffects: { investorScoreDelta: 10, boardConfidenceDelta: 8, riskScoreDelta: -5, founderControlDelta: -8, socialTrustDelta: 5 },
        risk: "medium",
        contextNote: "Surprising move that can neutralize rivalry or create strategic optionality.",
        recommendedForPlaystyles: ["regulated_operator", "enterprise_sales"],
      },
      {
        id: "rival_ignore_focus",
        title: "Ignore Competition, Focus on Customers",
        stance: "transparent",
        description: "Stop watching the rival. Focus entirely on customer retention and expansion.",
        projectedEffects: { revenueDelta: 2000, productProgressDelta: 5, boardConfidenceDelta: -3, founderControlDelta: 10, riskScoreDelta: -3 },
        risk: "low",
        recommendedForPlaystyles: ["cockroach", "community_led", "trust_builder"],
      },
    ],
  },

  // ── BURN RATE ─────────────────────────────────────────────────────────────
  {
    pressureType: "burn_rate",
    severity: "medium",
    titleTemplate: "Board Burn Rate Intervention",
    concernTemplate: "Monthly burn of ${burn} against ${revenue} revenue is unsustainable. The ratio is wrong.",
    boardQuestionTemplate: "Your burn-to-revenue ratio is alarming. What's the path to a healthy unit economy?",
    contextTemplate: "{name} burning ${burn}/mo vs ${revenue}/mo revenue in Week {month}.",
    tags: ["burn", "unit_economics", "finance"],
    responseOptions: [
      {
        id: "burn_rationalize",
        title: "Rationalize Cost Structure",
        stance: "defensive",
        description: "Audit every line item. Cut vendor contracts, office costs, and non-essential subscriptions.",
        projectedEffects: { burnDelta: -5000, riskScoreDelta: -5, boardConfidenceDelta: 12, investorScoreDelta: 5, investorPatienceDelta: 8 },
        risk: "low",
        recommendedForPlaystyles: ["cockroach", "technical_builder"],
      },
      {
        id: "burn_accelerate_revenue",
        title: "Accelerate Revenue Instead",
        stance: "aggressive",
        description: "Don't cut — grow faster. Triple down on the highest-margin customer segment.",
        projectedEffects: { revenueDelta: 5000, burnDelta: 1000, investorScoreDelta: 8, boardConfidenceDelta: 8, riskScoreDelta: 3 },
        risk: "high",
        contextNote: "Only viable if you have real traction signal. Betting on acceleration.",
        recommendedForPlaystyles: ["enterprise_sales", "capital_blitzscaler"],
      },
      {
        id: "burn_extend_runway_plan",
        title: "18-Month Runway Plan",
        stance: "negotiate",
        description: "Present a detailed 18-month cash plan. Show investors a clear path to profitability or next raise.",
        projectedEffects: { investorScoreDelta: 6, boardConfidenceDelta: 10, founderControlDelta: 5, investorPatienceDelta: 12, riskScoreDelta: -5 },
        risk: "low",
        recommendedForPlaystyles: ["regulated_operator", "trust_builder"],
      },
    ],
  },

  // ── COMPLIANCE RISK ───────────────────────────────────────────────────────
  {
    pressureType: "compliance_risk",
    severity: "high",
    titleTemplate: "Compliance Risk Review",
    concernTemplate: "Risk score is at {riskScore}/100. Regulatory or legal exposure could sink this company.",
    boardQuestionTemplate: "Risk exposure is critical. What immediate compliance actions will you take?",
    contextTemplate: "{name} has a risk score of {riskScore} at Week {month} in {sector}.",
    tags: ["compliance", "risk", "legal", "regulation"],
    responseOptions: [
      {
        id: "compliance_legal_review",
        title: "Commission Legal Audit",
        stance: "defensive",
        description: "Hire outside counsel to audit all compliance exposure. Pause risky features.",
        requirements: { minCash: 15000 },
        projectedEffects: { riskScoreDelta: -15, burnDelta: 4000, boardConfidenceDelta: 12, investorScoreDelta: 8, founderControlDelta: -5 },
        risk: "low",
        recommendedForPlaystyles: ["regulated_operator", "trust_builder"],
      },
      {
        id: "compliance_proactive_disclosure",
        title: "Proactive Regulatory Disclosure",
        stance: "transparent",
        description: "Get ahead of the risk by proactively disclosing to relevant regulators.",
        projectedEffects: { riskScoreDelta: -12, brandRiskDelta: -5, investorScoreDelta: 5, boardConfidenceDelta: 8, founderControlDelta: 3, socialTrustDelta: 5 },
        risk: "medium",
        contextNote: "Signals integrity. Unusual but effective in highly regulated sectors.",
        recommendedForPlaystyles: ["regulated_operator"],
      },
      {
        id: "compliance_accelerate_mitigations",
        title: "Fast-Track Risk Mitigations",
        stance: "aggressive",
        description: "Dedicate engineering sprint to removing all compliance-adjacent features.",
        projectedEffects: { riskScoreDelta: -10, productProgressDelta: -5, burnDelta: 2000, boardConfidenceDelta: 10, investorScoreDelta: 5 },
        risk: "medium",
        recommendedForPlaystyles: ["technical_builder", "product_led"],
      },
    ],
  },

  // ── FUNDRAISING PRESSURE ──────────────────────────────────────────────────
  {
    pressureType: "fundraising_pressure",
    severity: "medium",
    titleTemplate: "Fundraising Strategy Meeting",
    concernTemplate: "It's Week {month} and you haven't raised a new round. Cash position is weakening.",
    boardQuestionTemplate: "When and how are you planning your next raise?",
    contextTemplate: "{name} is in Week {month} without a new round. Runway: {runway} months.",
    tags: ["fundraising", "capital", "strategy"],
    responseOptions: [
      {
        id: "fundraising_initiate_now",
        title: "Start Raise Immediately",
        stance: "aggressive",
        description: "Begin investor outreach this week. Optimize for speed over terms.",
        requirements: { minInvestorScore: 45 },
        projectedEffects: { investorScoreDelta: 5, boardConfidenceDelta: 10, founderControlDelta: -5, burnDelta: 1000, investorPatienceDelta: 10 },
        risk: "medium",
        contextNote: "Takes 2–3 months to close. Start before you need to.",
        recommendedForPlaystyles: ["capital_blitzscaler", "enterprise_sales"],
      },
      {
        id: "fundraising_milestone_first",
        title: "Hit Milestone First",
        stance: "delay",
        description: "Set one clear milestone. Hit it. Then fundraise from a position of strength.",
        projectedEffects: { investorScoreDelta: -3, boardConfidenceDelta: -5, productProgressDelta: 8, founderControlDelta: 10, riskScoreDelta: -5, investorPatienceDelta: -8 },
        risk: "medium",
        recommendedForPlaystyles: ["product_led", "technical_builder", "trust_builder"],
      },
      {
        id: "fundraising_revenue_route",
        title: "Default to Revenue, Skip Round",
        stance: "reject",
        description: "Focus on becoming default-alive. Don't raise — grow to profitability instead.",
        projectedEffects: { revenueDelta: 3000, burnDelta: -2000, founderControlDelta: 15, boardConfidenceDelta: -8, investorPatienceDelta: -15, investorScoreDelta: -8 },
        risk: "high",
        contextNote: "Preserves equity and control but requires real revenue execution.",
        recommendedForPlaystyles: ["cockroach", "community_led"],
      },
    ],
  },
];

// ─── Template Helper ──────────────────────────────────────────────────────────

export function instantiateTemplate(
  template: BoardroomEventTemplate,
  ctx: BoardroomTriggerContext
): Omit<import("./types").BoardroomEvent, "id" | "startupId" | "resolved"> {
  const fill = (s: string) =>
    s
      .replace("{name}", ctx.startupName)
      .replace("{month}", String(ctx.month))
      .replace("{runway}", String(ctx.runwayMonths))
      .replace("{burn}", ctx.monthlyBurn.toLocaleString())
      .replace("{cash}", ctx.cash.toLocaleString())
      .replace("{revenue}", ctx.revenue.toLocaleString())
      .replace("{investorScore}", String(ctx.investorScore))
      .replace("{productProgress}", String(ctx.productProgress))
      .replace("{brandRisk}", String(ctx.brandRisk))
      .replace("{riskScore}", String(ctx.riskScore))
      .replace("{rivalryScore}", String(ctx.rivalryMaxScore))
      .replace("{sector}", ctx.sector);

  return {
    month: ctx.month,
    pressureType: template.pressureType,
    severity: template.severity,
    title: fill(template.titleTemplate),
    concern: fill(template.concernTemplate),
    boardQuestion: fill(template.boardQuestionTemplate),
    contextSummary: fill(template.contextTemplate),
    responseOptions: template.responseOptions as BoardroomResponseOption[],
    tags: template.tags,
  };
}

export function getTemplateByPressureType(
  pressureType: string
): BoardroomEventTemplate | undefined {
  return BOARDROOM_EVENT_TEMPLATES.find((t) => t.pressureType === pressureType);
}
