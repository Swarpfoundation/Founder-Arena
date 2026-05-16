import type { FounderPlaystyle, StrategySynergy } from "./types";

// ─── Playstyle display metadata ───────────────────────────────────────────────

export interface PlaystyleMeta {
  title: string;
  description: string;
  icon: string;
  color: string;   // accent name for tailwind classes
  strengths: string[];
  tradeoffs: string[];
}

export const PLAYSTYLE_META: Record<FounderPlaystyle, PlaystyleMeta> = {
  product_led: {
    title: "Product-Led Growth",
    description: "Ship quality, let the product speak for itself. PMF over hype.",
    icon: "⚙",
    color: "cyan",
    strengths: ["Strong PMF signal", "Lower CAC", "Sustainable growth loops"],
    tradeoffs: ["Slower short-term revenue", "Weaker without sales motion"],
  },
  enterprise_sales: {
    title: "Enterprise Sales Machine",
    description: "Direct sales, enterprise wedge, and recurring contracts.",
    icon: "💼",
    color: "violet",
    strengths: ["Predictable revenue", "High ACV", "Investor credibility"],
    tradeoffs: ["Higher burn", "Slow product velocity", "Long sales cycles"],
  },
  regulated_operator: {
    title: "Regulated Operator",
    description: "Win through compliance, trust, and regulatory moats.",
    icon: "🛡",
    color: "violet",
    strengths: ["Risk resilience", "Institutional trust", "Compliance moat"],
    tradeoffs: ["Slow viral growth", "Higher compliance costs"],
  },
  technical_builder: {
    title: "Technical Moat Builder",
    description: "Engineering-first. Outship and outscale technically.",
    icon: "🔧",
    color: "cyan",
    strengths: ["Product velocity", "Technical credibility", "Security edge"],
    tradeoffs: ["Weak marketing", "Revenue often delayed"],
  },
  hype_machine: {
    title: "Hype Machine",
    description: "Narrative-first. Dominate the press cycle and social feeds.",
    icon: "⚡",
    color: "amber",
    strengths: ["Viral growth spikes", "Investor attention", "User acquisition"],
    tradeoffs: ["Brand risk rises fast", "Higher rival retaliation", "Backfire if product is weak"],
  },
  cockroach: {
    title: "Cockroach Founder",
    description: "Default alive. Low burn, long runway, brutal survivability.",
    icon: "🪳",
    color: "rose",
    strengths: ["Capital efficiency", "Runway extension", "Survive anything"],
    tradeoffs: ["Slower growth", "Lower valuation ceiling", "Morale risk"],
  },
  community_led: {
    title: "Community-Led Growth",
    description: "Build loyalty before revenue. Users become advocates.",
    icon: "🤝",
    color: "emerald",
    strengths: ["Brand shield", "Trust moat", "Low CAC via word-of-mouth"],
    tradeoffs: ["Slower enterprise revenue", "Slower fundraising momentum"],
  },
  rival_killer: {
    title: "Rival Killer",
    description: "Competitive aggression. Win the market by defeating rivals.",
    icon: "⚔",
    color: "rose",
    strengths: ["Counter-actions stronger", "Arena reputation", "Investor confidence"],
    tradeoffs: ["Higher rivalryScore", "More retaliation", "Brand risk if trust is weak"],
  },
  capital_blitzscaler: {
    title: "Capital Blitzscaler",
    description: "Raise fast, grow fast, dominate via capital density.",
    icon: "💰",
    color: "amber",
    strengths: ["Fast valuation growth", "Investor momentum", "Market capture speed"],
    tradeoffs: ["High dilution", "Rising burn", "Board pressure risk"],
  },
  trust_builder: {
    title: "Trust & Transparency Founder",
    description: "Earn loyalty through honesty. Trust compounds over time.",
    icon: "✦",
    color: "emerald",
    strengths: ["Backlash resistance", "Long-term community", "Investor confidence"],
    tradeoffs: ["Slower hype cycles", "Less viral reach"],
  },
};

// ─── Synergy catalog ──────────────────────────────────────────────────────────

export const SYNERGY_CATALOG: StrategySynergy[] = [
  {
    id: "pmf_sprint",
    title: "PMF Sprint",
    playstyle: "product_led",
    description: "Product actions compound. Every build cycle is stronger.",
    unlockLevel: "active",
    effects: { productProgressDelta: 3, riskScoreDelta: -1 },
    tradeoffs: ["Revenue slower if sales motion ignored"],
  },
  {
    id: "launch_readiness",
    title: "Launch Readiness",
    playstyle: "product_led",
    description: "Launch backfire risk reduced when product is polished.",
    unlockLevel: "dominant",
    effects: { brandRiskDelta: -4, productProgressDelta: 2 },
    tradeoffs: [],
  },
  {
    id: "enterprise_wedge",
    title: "Enterprise Wedge",
    playstyle: "enterprise_sales",
    description: "Revenue gains compound when trust and compliance are high.",
    unlockLevel: "active",
    effects: { revenueDelta: 1500, investorScoreDelta: 1 },
    tradeoffs: ["Higher burn rate"],
  },
  {
    id: "procurement_credibility",
    title: "Procurement Credibility",
    playstyle: "enterprise_sales",
    description: "Enterprise traction builds investor confidence faster.",
    unlockLevel: "dominant",
    effects: { investorScoreDelta: 2, revenueDelta: 2000 },
    tradeoffs: [],
  },
  {
    id: "trust_moat",
    title: "Trust Moat",
    playstyle: "regulated_operator",
    description: "Risk events hit less hard. Compliance is your shield.",
    unlockLevel: "active",
    effects: { riskScoreDelta: -2, brandRiskDelta: -3 },
    tradeoffs: [],
  },
  {
    id: "regulated_advantage",
    title: "Regulated Advantage",
    playstyle: "regulated_operator",
    description: "Investor confidence improves in high-regulation markets.",
    unlockLevel: "dominant",
    effects: { investorScoreDelta: 2, riskScoreDelta: -2 },
    tradeoffs: [],
  },
  {
    id: "technical_edge",
    title: "Technical Edge",
    playstyle: "technical_builder",
    description: "Product progress and risk reduction improve together.",
    unlockLevel: "active",
    effects: { productProgressDelta: 2, riskScoreDelta: -1 },
    tradeoffs: ["Weak revenue without sales focus"],
  },
  {
    id: "scaling_advantage",
    title: "Scaling Advantage",
    playstyle: "technical_builder",
    description: "Viral/social spikes create less operational risk.",
    unlockLevel: "dominant",
    effects: { productProgressDelta: 3, riskScoreDelta: -2 },
    tradeoffs: [],
  },
  {
    id: "viral_loop",
    title: "Viral Loop",
    playstyle: "hype_machine",
    description: "User growth and valuation spike when hype momentum is high.",
    unlockLevel: "active",
    effects: { userGrowthDelta: 120, socialHypeDelta: 4, valuationDelta: 5000 },
    tradeoffs: ["Brand risk +3 per month", "Rival attention increases"],
  },
  {
    id: "narrative_dominance",
    title: "Narrative Dominance",
    playstyle: "hype_machine",
    description: "Rival attention attacks can be turned into hype.",
    unlockLevel: "dominant",
    effects: { userGrowthDelta: 80, valuationDelta: 8000, brandRiskDelta: 2 },
    tradeoffs: ["Rivals retaliate more frequently"],
  },
  {
    id: "runway_discipline",
    title: "Runway Discipline",
    playstyle: "cockroach",
    description: "Burn reductions are stronger. Default alive mode activated.",
    unlockLevel: "active",
    effects: { burnDelta: -2000, riskScoreDelta: -1 },
    tradeoffs: ["Valuation growth capped"],
  },
  {
    id: "survive_another_month",
    title: "Survive Another Month",
    playstyle: "cockroach",
    description: "Death-risk softened when runway is critically low.",
    unlockLevel: "dominant",
    effects: { burnDelta: -3000, riskScoreDelta: -2 },
    tradeoffs: ["Growth velocity reduced"],
  },
  {
    id: "community_flywheel",
    title: "Community Flywheel",
    playstyle: "community_led",
    description: "Trust converts into user growth. Community is your moat.",
    unlockLevel: "active",
    effects: { userGrowthDelta: 80, socialTrustDelta: 3 },
    tradeoffs: ["Slower enterprise revenue"],
  },
  {
    id: "brand_shield_community",
    title: "Brand Shield",
    playstyle: "community_led",
    description: "Rival attacks and backlash hurt less when community is strong.",
    unlockLevel: "dominant",
    effects: { userGrowthDelta: 60, brandRiskDelta: -5 },
    tradeoffs: [],
  },
  {
    id: "arena_predator",
    title: "Arena Predator",
    playstyle: "rival_killer",
    description: "Counter-actions become stronger. Rival attacks can backfire.",
    unlockLevel: "active",
    effects: { investorScoreDelta: 1, riskScoreDelta: -1 },
    tradeoffs: ["Rivalry scores rise faster"],
  },
  {
    id: "competitive_clarity",
    title: "Competitive Clarity",
    playstyle: "rival_killer",
    description: "Investor score improves when player beats a rival move.",
    unlockLevel: "dominant",
    effects: { investorScoreDelta: 2, valuationDelta: 5000 },
    tradeoffs: ["Rivals retaliate harder at high rivalry"],
  },
  {
    id: "capital_momentum",
    title: "Capital Momentum",
    playstyle: "capital_blitzscaler",
    description: "Valuation and investor score compound faster when fundraising.",
    unlockLevel: "active",
    effects: { investorScoreDelta: 2, valuationDelta: 10000 },
    tradeoffs: ["Higher burn rate", "Board pressure risk"],
  },
  {
    id: "boardroom_leverage",
    title: "Boardroom Leverage",
    playstyle: "capital_blitzscaler",
    description: "Capital density creates better future term sheets.",
    unlockLevel: "dominant",
    effects: { investorScoreDelta: 3, valuationDelta: 15000 },
    tradeoffs: ["Dilution compounds"],
  },
  {
    id: "brand_shield_trust",
    title: "Brand Shield",
    playstyle: "trust_builder",
    description: "Rival attacks and backlash hurt less. Trust is your armor.",
    unlockLevel: "active",
    effects: { socialTrustDelta: 4, brandRiskDelta: -4 },
    tradeoffs: ["Slower hype build"],
  },
  {
    id: "transparency_credibility",
    title: "Transparency Credibility",
    playstyle: "trust_builder",
    description: "Long-term trust converts to investor and community confidence.",
    unlockLevel: "dominant",
    effects: { socialTrustDelta: 5, investorScoreDelta: 1, brandRiskDelta: -5 },
    tradeoffs: [],
  },
];

export function getSynergiesForPlaystyle(playstyle: FounderPlaystyle): StrategySynergy[] {
  return SYNERGY_CATALOG.filter((s) => s.playstyle === playstyle);
}

// ─── Signal maps: action → playstyle weight ───────────────────────────────────

export interface SignalMapping {
  playstyle: FounderPlaystyle;
  weight: number;
  reason: string;
}

export const DECISION_SIGNAL_MAP: Record<string, SignalMapping[]> = {
  product_focus: [
    { playstyle: "product_led", weight: 10, reason: "Product Focus signals product-led discipline" },
  ],
  launch_beta: [
    { playstyle: "product_led", weight: 8, reason: "Launching beta demonstrates product-led confidence" },
    { playstyle: "hype_machine", weight: 6, reason: "Beta launch generates market attention" },
  ],
  customer_interviews: [
    { playstyle: "product_led", weight: 8, reason: "Customer interviews are core product-led practice" },
    { playstyle: "community_led", weight: 6, reason: "Customer interviews build community connection" },
  ],
  delay_launch: [
    { playstyle: "product_led", weight: 8, reason: "Delaying for quality shows product-led discipline" },
  ],
  hire_engineer: [
    { playstyle: "technical_builder", weight: 8, reason: "Engineering contractor hire strengthens technical moat" },
  ],
  hire_compliance: [
    { playstyle: "regulated_operator", weight: 10, reason: "Compliance advisor hire is core regulated operator move" },
  ],
  hire_sales: [
    { playstyle: "enterprise_sales", weight: 8, reason: "Sales contractor signals enterprise focus" },
  ],
  enterprise_push: [
    { playstyle: "enterprise_sales", weight: 12, reason: "Enterprise sales push is the core enterprise move" },
  ],
  improve_security: [
    { playstyle: "regulated_operator", weight: 8, reason: "Security investment signals regulated operator discipline" },
    { playstyle: "technical_builder", weight: 6, reason: "Security engineering strengthens technical moat" },
  ],
  marketing_spend: [
    { playstyle: "hype_machine", weight: 8, reason: "Marketing spend signals hype-machine approach" },
  ],
  cut_costs: [
    { playstyle: "cockroach", weight: 10, reason: "Cutting costs is the cockroach founder's core play" },
  ],
  fundraising_prep: [
    { playstyle: "capital_blitzscaler", weight: 8, reason: "Fundraising prep signals capital blitzscaling strategy" },
  ],
};

export const ROLE_SIGNAL_MAP: Record<string, SignalMapping[]> = {
  "CTO": [
    { playstyle: "technical_builder", weight: 12, reason: "CTO hire anchors technical moat strategy" },
  ],
  "Full-stack Engineer": [
    { playstyle: "technical_builder", weight: 8, reason: "Full-stack engineer strengthens technical moat" },
  ],
  "Backend Engineer": [
    { playstyle: "technical_builder", weight: 8, reason: "Backend engineer strengthens technical moat" },
  ],
  "Frontend Engineer": [
    { playstyle: "technical_builder", weight: 6, reason: "Frontend engineer supports product-led development" },
    { playstyle: "product_led", weight: 4, reason: "Frontend focus signals product experience priority" },
  ],
  "Product Designer": [
    { playstyle: "product_led", weight: 9, reason: "Product designer hire signals product-led focus" },
  ],
  "Sales Lead": [
    { playstyle: "enterprise_sales", weight: 12, reason: "Sales lead hire is core enterprise sales signal" },
  ],
  "Marketing Manager": [
    { playstyle: "hype_machine", weight: 10, reason: "Marketing manager hire signals hype-machine strategy" },
  ],
  "Compliance Advisor": [
    { playstyle: "regulated_operator", weight: 12, reason: "Compliance advisor is core regulated operator signal" },
  ],
  "Security Engineer": [
    { playstyle: "regulated_operator", weight: 8, reason: "Security engineering supports regulated operator strategy" },
    { playstyle: "technical_builder", weight: 6, reason: "Security engineer strengthens technical moat" },
  ],
  "AI Engineer": [
    { playstyle: "technical_builder", weight: 12, reason: "AI engineer hire is strong technical moat signal" },
  ],
  "Customer Support": [
    { playstyle: "community_led", weight: 10, reason: "Customer support hire signals community-led focus" },
  ],
  "Finance/Ops Manager": [
    { playstyle: "cockroach", weight: 8, reason: "Finance/ops manager signals cockroach discipline" },
    { playstyle: "regulated_operator", weight: 4, reason: "Finance ops supports regulated operations" },
  ],
};

export const SOCIAL_SIGNAL_MAP: Record<string, SignalMapping[]> = {
  founder_x_thread: [
    { playstyle: "hype_machine", weight: 8, reason: "Founder X thread is a hype-machine tactic" },
  ],
  product_demo_tiktok: [
    { playstyle: "hype_machine", weight: 8, reason: "TikTok demo signals hype-machine approach" },
    { playstyle: "product_led", weight: 5, reason: "Product demo shows product-led confidence" },
  ],
  instagram_bts: [
    { playstyle: "community_led", weight: 8, reason: "Behind-the-scenes content builds community" },
    { playstyle: "trust_builder", weight: 6, reason: "BTS content builds authentic trust" },
  ],
  launch_announcement: [
    { playstyle: "hype_machine", weight: 10, reason: "Launch announcement is hype-machine signature" },
    { playstyle: "product_led", weight: 6, reason: "Launch signals product-led readiness" },
  ],
  founder_transparency_post: [
    { playstyle: "trust_builder", weight: 10, reason: "Transparency post is the trust builder's core move" },
    { playstyle: "community_led", weight: 6, reason: "Transparency builds community loyalty" },
  ],
  influencer_collab: [
    { playstyle: "hype_machine", weight: 10, reason: "Influencer collab signals hype-machine strategy" },
  ],
  crisis_response: [
    { playstyle: "trust_builder", weight: 8, reason: "Crisis response signals trust-builder values" },
    { playstyle: "regulated_operator", weight: 6, reason: "Crisis response signals operational maturity" },
  ],
  customer_testimonial: [
    { playstyle: "community_led", weight: 10, reason: "Customer testimonials are core community-led content" },
    { playstyle: "enterprise_sales", weight: 5, reason: "Testimonials support enterprise sales credibility" },
  ],
  investor_update: [
    { playstyle: "capital_blitzscaler", weight: 8, reason: "Investor update signals capital blitzscaler discipline" },
  ],
  competitor_callout: [
    { playstyle: "rival_killer", weight: 12, reason: "Competitor callout is the rival killer's signature move" },
    { playstyle: "hype_machine", weight: 5, reason: "Callout generates attention" },
  ],
};

export const COUNTER_SIGNAL_MAP: Record<string, SignalMapping[]> = {
  counter_positioning_thread: [
    { playstyle: "rival_killer", weight: 10, reason: "Counter-positioning is a rival killer move" },
    { playstyle: "trust_builder", weight: 5, reason: "Positioning thread builds credibility" },
  ],
  accelerate_beta: [
    { playstyle: "product_led", weight: 10, reason: "Accelerating beta signals product-led competitive response" },
    { playstyle: "rival_killer", weight: 6, reason: "Accelerating product counters rival pressure" },
  ],
  customer_proof_campaign: [
    { playstyle: "community_led", weight: 8, reason: "Customer proof campaign builds community loyalty" },
    { playstyle: "rival_killer", weight: 6, reason: "Social proof counters rival narrative attacks" },
  ],
  enterprise_discount_offensive: [
    { playstyle: "enterprise_sales", weight: 10, reason: "Enterprise discount is a direct sales counter-play" },
    { playstyle: "rival_killer", weight: 6, reason: "Aggressive pricing counters rival customer poaching" },
  ],
  quiet_execution: [
    { playstyle: "cockroach", weight: 10, reason: "Quiet execution is the cockroach's low-burn response" },
  ],
  founder_debate: [
    { playstyle: "rival_killer", weight: 12, reason: "Founder debate is the rival killer's most aggressive move" },
    { playstyle: "hype_machine", weight: 6, reason: "Public debate generates significant hype" },
  ],
};

export const MISSION_SIGNAL_MAP: Record<string, SignalMapping[]> = {
  engineering: [{ playstyle: "technical_builder", weight: 10, reason: "Engineering mission strengthens technical moat" }],
  product:     [{ playstyle: "product_led", weight: 10, reason: "Product mission signals product-led discipline" }],
  compliance:  [{ playstyle: "regulated_operator", weight: 12, reason: "Compliance mission is core regulated operator signal" }],
  security:    [
    { playstyle: "regulated_operator", weight: 8, reason: "Security mission supports regulated operator strategy" },
    { playstyle: "technical_builder", weight: 6, reason: "Security mission strengthens technical moat" },
  ],
  sales:       [{ playstyle: "enterprise_sales", weight: 10, reason: "Sales mission signals enterprise sales machine strategy" }],
  marketing:   [{ playstyle: "hype_machine", weight: 8, reason: "Marketing mission signals hype-machine approach" }],
  customer:    [{ playstyle: "community_led", weight: 10, reason: "Customer mission signals community-led approach" }],
  infrastructure: [{ playstyle: "technical_builder", weight: 8, reason: "Infrastructure mission builds technical moat" }],
  ai:          [{ playstyle: "technical_builder", weight: 10, reason: "AI mission is a strong technical moat signal" }],
};
