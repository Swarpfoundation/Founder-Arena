import { SimulationEvent } from "./types";

// ---------------------------------------------------------------------------
// 25+ Deterministic Simulation Events across 11 categories
// ---------------------------------------------------------------------------
// Design principles:
// - All effects are bounded and survivable
// - Critical events max 2-3 per 12-month run (enforced by selection logic)
// - Choices have trade-offs; no universally optimal choice
// - AI narrates but never controls math
// ---------------------------------------------------------------------------

export const EVENT_LIBRARY: SimulationEvent[] = [
  // ===== MARKET (3) =====
  {
    id: "market_correction",
    title: "Market Correction",
    description: "Public markets dropped 15%. Investor sentiment is tightening.",
    category: "market",
    severity: "critical",
    narrative:
      "Tech stocks are down across the board. VCs are pausing new deals and your current investors are asking tougher questions.",
    minMonth: 3,
    choices: [
      {
        id: "conserve_cash",
        label: "Conserve Cash",
        description: "Freeze non-essential spending. Hurt growth but preserve runway.",
        effects: { burnDelta: -8000, revenueDelta: -4000, investorDelta: -2, marketDelta: -2 },
      },
      {
        id: "double_down",
        label: "Double Down",
        description: "Invest through the downturn. Higher risk, potential reward.",
        effects: { cashDelta: -15000, burnDelta: 5000, revenueDelta: 8000, investorDelta: 4, riskDelta: 5 },
        minCashRequired: 15000,
      },
      {
        id: "reassure_investors",
        label: "Reassure Investors",
        description: "Host an investor update call. Costs time but protects relationships.",
        effects: { cashDelta: -3000, investorDelta: 6, marketDelta: 2, riskDelta: -2 },
        minCashRequired: 3000,
      },
    ],
    oncePerRun: true,
    weight: 3,
  },
  {
    id: "sector_boom",
    title: "Sector Boom",
    description: "Your sector is suddenly hot. Media attention and inbound interest spike.",
    category: "market",
    severity: "moderate",
    narrative:
      "A major industry report just highlighted your space. Inbound leads are up and a journalist wants to feature your startup.",
    minMonth: 2,
    choices: [
      {
        id: "capitalize",
        label: "Capitalize on Hype",
        description: "Spend on marketing to capture demand while it lasts.",
        effects: { cashDelta: -12000, burnDelta: 8000, revenueDelta: 15000, marketDelta: 5, riskDelta: 2 },
        minCashRequired: 12000,
      },
      {
        id: "stay_focused",
        label: "Stay Focused",
        description: "Ignore the noise and keep building. Lower immediate upside.",
        effects: { productDelta: 5, investorDelta: 2, marketDelta: 1, riskDelta: -1 },
      },
    ],
    oncePerRun: true,
    weight: 4,
  },
  {
    id: "supply_chain_disruption",
    title: "Supply Chain Disruption",
    description: "A key vendor raised prices or delayed delivery.",
    category: "market",
    severity: "moderate",
    narrative:
      "Your primary infrastructure provider announced a 40% price hike effective next month. Your burn will spike unless you act.",
    minMonth: 2,
    choices: [
      {
        id: "switch_vendors",
        label: "Switch Vendors",
        description: "Migrate to a cheaper alternative. Short-term pain, long-term savings.",
        effects: { cashDelta: -8000, burnDelta: -5000, productDelta: -3, riskDelta: 2 },
        minCashRequired: 8000,
      },
      {
        id: "absorb_cost",
        label: "Absorb the Cost",
        description: "Pay the higher price to avoid disruption.",
        effects: { burnDelta: 6000, riskDelta: -1 },
      },
      {
        id: "negotiate",
        label: "Negotiate Hard",
        description: "Threaten to leave. Might work, might backfire.",
        effects: { burnDelta: 2000, investorDelta: 1, riskDelta: 3 },
      },
    ],
    oncePerRun: false,
    weight: 3,
  },

  // ===== TEAM (3) =====
  {
    id: "key_resignation",
    title: "Key Employee Resignation",
    description: "A senior team member just handed in their notice.",
    category: "team",
    severity: "critical",
    narrative:
      "Your lead engineer accepted an offer at a FAANG company. Knowledge walks out the door in two weeks. The team morale is shaken.",
    minMonth: 2,
    choices: [
      {
        id: "counter_offer",
        label: "Counter-Offer",
        description: "Match the salary to keep them. Expensive but preserves velocity.",
        effects: { cashDelta: -20000, burnDelta: 8000, productDelta: 3, investorDelta: -1 },
        minCashRequired: 20000,
      },
      {
        id: "hire_replacement",
        label: "Hire Replacement Fast",
        description: "Bring in a contractor immediately. Costs cash, fills gap.",
        effects: { cashDelta: -15000, burnDelta: 5000, productDelta: -5, riskDelta: 2 },
        minCashRequired: 15000,
      },
      {
        id: "redistribute",
        label: "Redistribute Work",
        description: "Split the workload among existing team. Cheaper but slows everything.",
        effects: { productDelta: -8, revenueDelta: -3000, riskDelta: 3 },
      },
    ],
    oncePerRun: true,
    weight: 3,
  },
  {
    id: "team_conflict",
    title: "Team Conflict",
    description: "A public disagreement broke out between two co-founders.",
    category: "team",
    severity: "moderate",
    narrative:
      "A heated Slack thread went company-wide. One founder wants to pivot; the other wants to stay the course. The team is watching.",
    minMonth: 2,
    choices: [
      {
        id: "mediate",
        label: "Bring in a Mediator",
        description: "Hire an executive coach for a session. Costly but professional.",
        effects: { cashDelta: -5000, investorDelta: 1, riskDelta: -4 },
        minCashRequired: 5000,
      },
      {
        id: "pick_side",
        label: "Pick a Side Quickly",
        description: "End the debate by making a unilateral call. Fast but divisive.",
        effects: { productDelta: 4, investorDelta: -3, riskDelta: 5 },
      },
      {
        id: "team_retreat",
        label: "Offsite Team Retreat",
        description: "Get everyone out of the office for alignment. Expensive but bonding.",
        effects: { cashDelta: -10000, productDelta: 2, investorDelta: 2, riskDelta: -5 },
        minCashRequired: 10000,
      },
    ],
    oncePerRun: false,
    weight: 4,
  },
  {
    id: "burnout_wave",
    title: "Burnout Wave",
    description: "Multiple team members report exhaustion. Velocity is dropping.",
    category: "team",
    severity: "moderate",
    narrative:
      "Sprint velocity dropped 30% this week. Two engineers requested mental health days. The crunch culture is catching up.",
    minMonth: 4,
    choices: [
      {
        id: "mandatory_rest",
        label: "Mandate Time Off",
        description: "Give the team a long weekend. Slower month, healthier team.",
        effects: { productDelta: -6, revenueDelta: -2000, riskDelta: -4, investorDelta: 1 },
      },
      {
        id: "hire_support",
        label: "Hire Support Staff",
        description: "Bring in contractors to reduce load. Costs cash.",
        effects: { cashDelta: -12000, burnDelta: 8000, productDelta: 2, riskDelta: -2 },
        minCashRequired: 12000,
      },
      {
        id: "push_through",
        label: "Push Through",
        description: "Acknowledge but keep the pressure. Short-term gain, long-term risk.",
        effects: { productDelta: 4, revenueDelta: 3000, riskDelta: 7 },
      },
    ],
    oncePerRun: false,
    weight: 3,
  },

  // ===== PRODUCT (2) =====
  {
    id: "major_bug_outage",
    title: "Major Outage",
    description: "A critical bug took your product offline for hours.",
    category: "product",
    severity: "critical",
    narrative:
      "Your production database query exploded at 3am. Customers are furious on Twitter. You need to fix this and rebuild trust.",
    minMonth: 2,
    choices: [
      {
        id: "all_hands_fix",
        label: "All-Hands Fix + Customer Credit",
        description: "Dedicate the whole team and refund affected customers. Best for trust.",
        effects: { cashDelta: -10000, productDelta: 8, revenueDelta: -5000, marketDelta: -2, riskDelta: -3 },
        minCashRequired: 10000,
      },
      {
        id: "quick_patch",
        label: "Quick Patch",
        description: "Fix the bug minimally and move on. Fast but customers notice.",
        effects: { productDelta: 3, revenueDelta: -2000, marketDelta: -3, riskDelta: 2 },
      },
      {
        id: "blame_vendor",
        label: "Blame Infrastructure Vendor",
        description: "Deflect responsibility. Saves face short-term, hurts trust long-term.",
        effects: { productDelta: 1, marketDelta: -5, investorDelta: -3, riskDelta: 4 },
      },
    ],
    oncePerRun: true,
    weight: 3,
  },
  {
    id: "feature_creep_request",
    title: "Whale Customer Demand",
    description: "Your largest customer demands a custom feature or they churn.",
    category: "product",
    severity: "moderate",
    narrative:
      "Your biggest contract (30% of revenue) just sent an ultimatum: build their custom integration in 30 days or they walk.",
    minMonth: 3,
    choices: [
      {
        id: "build_custom",
        label: "Build the Custom Feature",
        description: "Dedicate engineering to the request. Keeps revenue but diverts roadmap.",
        effects: { cashDelta: -8000, productDelta: -4, revenueDelta: 5000, investorDelta: -1, marketDelta: 2 },
        minCashRequired: 8000,
      },
      {
        id: "say_no",
        label: "Say No Politely",
        description: "Stick to the product vision. Lose the customer but keep focus.",
        effects: { revenueDelta: -8000, investorDelta: 3, productDelta: 6, marketDelta: -1 },
      },
      {
        id: "partnership",
        label: "Propose a Partnership",
        description: "Co-build it as a joint venture. Creative but complex.",
        effects: { cashDelta: -4000, productDelta: 2, revenueDelta: 2000, investorDelta: 2, riskDelta: 2 },
        minCashRequired: 4000,
      },
    ],
    oncePerRun: true,
    weight: 4,
  },

  // ===== SECURITY (2) =====
  {
    id: "data_breach_scare",
    title: "Data Breach Scare",
    description: "A security researcher claims they found exposed customer data.",
    category: "security",
    severity: "critical",
    narrative:
      "A HackerOne report alleges a misconfigured S3 bucket exposed user emails. You are not sure if it was exploited. The clock is ticking.",
    minMonth: 2,
    choices: [
      {
        id: "full_audit",
        label: "Full External Audit",
        description: "Hire a top firm to investigate and report transparently. Gold standard.",
        effects: { cashDelta: -20000, riskDelta: -10, investorDelta: 4, marketDelta: 1 },
        minCashRequired: 20000,
      },
      {
        id: "internal_fix",
        label: "Fix Internally & Notify",
        description: "Patch the issue and email customers. Cheaper but less reassuring.",
        effects: { cashDelta: -5000, riskDelta: -4, marketDelta: -2, investorDelta: 1 },
        minCashRequired: 5000,
      },
      {
        id: "downplay",
        label: "Downplay Publicly",
        description: "Minimize the issue in communications. Dangerous if it leaks.",
        effects: { cashDelta: -2000, riskDelta: 8, marketDelta: -4, investorDelta: -4 },
        minCashRequired: 2000,
      },
    ],
    oncePerRun: true,
    weight: 3,
  },
  {
    id: "phishing_attempt",
    title: "Sophisticated Phishing Attempt",
    description: "A team member almost fell for a targeted phishing attack.",
    category: "security",
    severity: "minor",
    narrative:
      "Your finance lead received an email that looked exactly like your cap table platform. They clicked the link but didn't enter credentials. Barely.",
    minMonth: 1,
    choices: [
      {
        id: "security_training",
        label: "Company-Wide Security Training",
        description: "Bring in a trainer for a half-day session. Low cost, high awareness.",
        effects: { cashDelta: -3000, riskDelta: -5, productDelta: 1 },
        minCashRequired: 3000,
      },
      {
        id: "tighten_access",
        label: "Tighten Access Controls",
        description: "Enforce 2FA and reduce admin access. Some friction for team.",
        effects: { productDelta: -2, riskDelta: -3, investorDelta: 1 },
      },
      {
        id: "ignore",
        label: "Send a Slack Reminder",
        description: "Acknowledge but don't overreact. Minimal cost, minimal impact.",
        effects: { riskDelta: 2 },
      },
    ],
    oncePerRun: false,
    weight: 5,
  },

  // ===== REGULATORY (2) =====
  {
    id: "regulatory_inquiry",
    title: "Regulatory Inquiry",
    description: "A government agency sent a letter requesting information.",
    category: "regulatory",
    severity: "critical",
    narrative:
      "The FTC (or local equivalent) wants to understand your data practices. You have 30 days to respond. Non-compliance carries heavy fines.",
    minMonth: 3,
    choices: [
      {
        id: "hire_lawyer",
        label: "Hire Specialist Counsel",
        description: "Bring in a regulatory lawyer. Expensive but thorough.",
        effects: { cashDelta: -25000, riskDelta: -8, investorDelta: 2 },
        minCashRequired: 25000,
      },
      {
        id: "compliance_sprint",
        label: "Internal Compliance Sprint",
        description: "Pause feature work to document everything. Cheaper but slower.",
        effects: { productDelta: -10, riskDelta: -5, investorDelta: -1 },
      },
      {
        id: "minimal_response",
        label: "Minimal Response",
        description: "Answer only what was asked. Fast but risky if they dig deeper.",
        effects: { cashDelta: -3000, riskDelta: 5, investorDelta: -2 },
        minCashRequired: 3000,
      },
    ],
    oncePerRun: true,
    weight: 3,
  },
  {
    id: "new_compliance_rule",
    title: "New Compliance Rule",
    description: "A new law affects how you handle user data or transactions.",
    category: "regulatory",
    severity: "moderate",
    narrative:
      "A new privacy regulation passed last night. You have 90 days to comply or face fines up to 4% of revenue. Your competitors are scrambling too.",
    minMonth: 2,
    choices: [
      {
        id: "early_compliance",
        label: "Early Compliance",
        description: "Be the first to adapt. Turn it into a marketing advantage.",
        effects: { cashDelta: -12000, productDelta: 4, marketDelta: 3, investorDelta: 3, riskDelta: -4 },
        minCashRequired: 12000,
      },
      {
        id: "wait_and_see",
        label: "Wait and See",
        description: "Watch how enforcement plays out. Cheaper but risky.",
        effects: { riskDelta: 6, investorDelta: -2 },
      },
      {
        id: "lobby_exemption",
        label: "Join Industry Lobby",
        description: "Pool resources to push for small-business exemption.",
        effects: { cashDelta: -5000, riskDelta: -2, investorDelta: 1 },
        minCashRequired: 5000,
      },
    ],
    oncePerRun: false,
    weight: 4,
  },

  // ===== INVESTOR (2) =====
  {
    id: "investor_pressure",
    title: "Investor Pressure",
    description: "Your lead investor wants a faster path to profitability.",
    category: "investor",
    severity: "critical",
    narrative:
      "Your lead VC sent a pointed email: 'We need to see a clear path to cash-flow positive by Week 10 or we'll reconsider our pro-rata.'",
    minMonth: 4,
    choices: [
      {
        id: "cut_burn",
        label: "Aggressive Burn Cut",
        description: "Cut 20% of spend immediately. Painful but shows discipline.",
        effects: { burnDelta: -15000, revenueDelta: -3000, productDelta: -4, investorDelta: 6, riskDelta: -2 },
      },
      {
        id: "revenue_plan",
        label: "Present Revenue Acceleration Plan",
        description: "Hire more sales and show a plan. Costs cash, buys confidence.",
        effects: { cashDelta: -15000, burnDelta: 10000, revenueDelta: 10000, investorDelta: 3, riskDelta: 3 },
        minCashRequired: 15000,
      },
      {
        id: "push_back",
        label: "Push Back on Timeline",
        description: "Explain why the current plan is right. Risky if they disagree.",
        effects: { investorDelta: -5, productDelta: 5, riskDelta: 4 },
      },
    ],
    oncePerRun: true,
    weight: 3,
  },
  {
    id: "warm_intro",
    title: "Warm Introduction",
    description: "A well-known angel wants to introduce you to a tier-1 fund.",
    category: "investor",
    severity: "minor",
    narrative:
      "A former founder-turned-angel slid into your DMs. They love what you're building and want to intro you to their former fund.",
    minMonth: 2,
    choices: [
      {
        id: "take_meeting",
        label: "Take the Meeting",
        description: "Prepare a deck and pitch. Costs time but great opportunity.",
        effects: { cashDelta: -3000, investorDelta: 8, marketDelta: 2 },
        minCashRequired: 3000,
      },
      {
        id: "defer",
        label: "Defer Until Next Round",
        description: "Don't distract the team now. Lose the intro but stay focused.",
        effects: { productDelta: 3, investorDelta: -1 },
      },
    ],
    oncePerRun: true,
    weight: 5,
  },

  // ===== CUSTOMER (2) =====
  {
    id: "viral_complaint",
    title: "Viral Customer Complaint",
    description: "A customer's negative post is going viral on social media.",
    category: "customer",
    severity: "moderate",
    narrative:
      "A thread on X about your product's onboarding friction hit 50K views. The founder community is piling on. You need to respond.",
    minMonth: 2,
    choices: [
      {
        id: "public_apology",
        label: "Public Apology + Fix",
        description: "The founder posts a genuine apology and ships a fix. Best for brand.",
        effects: { cashDelta: -5000, productDelta: 6, marketDelta: 3, investorDelta: 2 },
        minCashRequired: 5000,
      },
      {
        id: "dm_resolve",
        label: "Resolve Privately",
        description: "Reach out to the customer directly. Less visible but less drama.",
        effects: { productDelta: 3, marketDelta: -1, riskDelta: 1 },
      },
      {
        id: "ignore_it",
        label: "Ignore It",
        description: "Let it blow over. Sometimes works, sometimes backfires.",
        effects: { marketDelta: -4, investorDelta: -2, riskDelta: 3 },
      },
    ],
    oncePerRun: false,
    weight: 4,
  },
  {
    id: "customer_churn_spike",
    title: "Churn Spike",
    description: "Your churn rate unexpectedly doubled this month.",
    category: "customer",
    severity: "moderate",
    narrative:
      "The monthly metrics are in and churn is 2x normal. Something changed. The product team thinks it's the latest update; sales thinks it's pricing.",
    minMonth: 3,
    choices: [
      {
        id: "customer_research",
        label: "Emergency Customer Research",
        description: "Call 20 churned customers personally. Time-intensive but insightful.",
        effects: { cashDelta: -3000, productDelta: 8, revenueDelta: 2000, marketDelta: 2 },
        minCashRequired: 3000,
      },
      {
        id: "discount_retention",
        label: "Retention Discount Campaign",
        description: "Offer existing customers a temporary discount. Buys time.",
        effects: { revenueDelta: -5000, marketDelta: 1, investorDelta: -1, riskDelta: 2 },
      },
      {
        id: "pricing_change",
        label: "Rollback Pricing Change",
        description: "Undo last month's pricing experiment. Admit the mistake.",
        effects: { revenueDelta: 3000, investorDelta: 1, marketDelta: 2, riskDelta: -1 },
      },
    ],
    oncePerRun: false,
    weight: 4,
  },

  // ===== COMPETITOR (2) =====
  {
    id: "competitor_funding",
    title: "Competitor Raises Big",
    description: "Your direct competitor just announced a $20M Series A.",
    category: "competitor",
    severity: "moderate",
    narrative:
      "The competitor you benchmark against just raised $20M at a $80M valuation. TechCrunch is calling them the category leader. Your team is nervous.",
    minMonth: 3,
    choices: [
      {
        id: "differentiate",
        label: "Double Down on Differentiation",
        description: "Invest in the unique features that set you apart.",
        effects: { cashDelta: -10000, productDelta: 10, marketDelta: 3, investorDelta: 2 },
        minCashRequired: 10000,
      },
      {
        id: "outspend_marketing",
        label: "Outspend on Marketing",
        description: "Fight for mindshare. Expensive and risky.",
        effects: { cashDelta: -18000, burnDelta: 12000, revenueDelta: 8000, marketDelta: 4, riskDelta: 4 },
        minCashRequired: 18000,
      },
      {
        id: "partnership_play",
        label: "Explore Acquisition Talks",
        description: "Reach out to see if they'd acquire you. High risk, high reward.",
        effects: { investorDelta: -3, marketDelta: -2, riskDelta: 5, valuationMultiplier: 1.1 },
      },
    ],
    oncePerRun: true,
    weight: 3,
  },
  {
    id: "competitor_copy",
    title: "Competitor Copies Your Feature",
    description: "A larger competitor launched a feature identical to your flagship.",
    category: "competitor",
    severity: "minor",
    narrative:
      "Your moat just shrank. The incumbent with 10x your resources shipped your killer feature — and made it free. Customers are asking why they need you.",
    minMonth: 3,
    choices: [
      {
        id: "innovate_faster",
        label: "Innovate Faster",
        description: "Announce the next feature before they catch up. Costs engineering time.",
        effects: { cashDelta: -8000, productDelta: 12, marketDelta: 2, investorDelta: 2 },
        minCashRequired: 8000,
      },
      {
        id: "niche_down",
        label: "Niche Down",
        description: "Focus on a specific segment they can't serve well. Smaller TAM, safer.",
        effects: { revenueDelta: -3000, marketDelta: 1, riskDelta: -2, investorDelta: -1 },
      },
      {
        id: "ignore_copy",
        label: "Ignore and Focus on Customers",
        description: "Your customers chose you for a reason. Double down on service.",
        effects: { productDelta: 3, marketDelta: 2, riskDelta: -1 },
      },
    ],
    oncePerRun: false,
    weight: 4,
  },

  // ===== FINANCE (2) =====
  {
    id: "tax_surprise",
    title: "Unexpected Tax Bill",
    description: "Your accountant found a tax liability you didn't budget for.",
    category: "finance",
    severity: "moderate",
    narrative:
      "The quarterly review revealed a $35K payroll tax liability from misclassified contractors. The IRS wants it in 30 days.",
    minMonth: 3,
    choices: [
      {
        id: "pay_in_full",
        label: "Pay in Full Immediately",
        description: "Clear the liability. Hurts cash but removes risk.",
        effects: { cashDelta: -35000, riskDelta: -5, investorDelta: 1 },
        minCashRequired: 35000,
      },
      {
        id: "payment_plan",
        label: "Negotiate Payment Plan",
        description: "Spread it over 6 months. Small interest, preserved runway.",
        effects: { cashDelta: -6000, burnDelta: 2000, riskDelta: -2 },
        minCashRequired: 6000,
      },
      {
        id: "reclassify_fight",
        label: "Reclassify & Dispute",
        description: "Argue they were contractors. Cheaper but risky if you lose.",
        effects: { cashDelta: -8000, riskDelta: 6, investorDelta: -2 },
        minCashRequired: 8000,
      },
    ],
    oncePerRun: true,
    weight: 3,
  },
  {
    id: "late_payment",
    title: "Enterprise Client Late Payment",
    description: "Your largest enterprise client is 60 days past due.",
    category: "finance",
    severity: "moderate",
    narrative:
      "Your $25K monthly enterprise deal is 60 days overdue. Their procurement team says 'next quarter.' Your runway just got tighter.",
    minMonth: 3,
    choices: [
      {
        id: "escalate",
        label: "Escalate to Executive Sponsor",
        description: "Go around procurement to their CFO. Might work, might burn bridge.",
        effects: { revenueDelta: 25000, marketDelta: -2, investorDelta: 1, riskDelta: 2 },
      },
      {
        id: "collections",
        label: "Send to Collections",
        description: "Hire a collections firm. You'll get 70% but lose the client.",
        effects: { revenueDelta: 17500, marketDelta: -4, riskDelta: 1 },
      },
      {
        id: "extend_terms",
        label: "Extend Payment Terms",
        description: "Be the 'nice' vendor. Keep relationship but hurt cash flow.",
        effects: { revenueDelta: -5000, investorDelta: -1, marketDelta: 2, riskDelta: -1 },
      },
    ],
    oncePerRun: false,
    weight: 4,
  },

  // ===== VIRAL (1) =====
  {
    id: "product_hunt_hit",
    title: "Viral Product Hunt Launch",
    description: "Your launch exploded. Traffic is 10x and servers are struggling.",
    category: "viral",
    severity: "moderate",
    narrative:
      "You hit #1 on Product Hunt. The site is getting 10x traffic. Sign-ups are pouring in. Your infrastructure bill just became a real problem.",
    minMonth: 2,
    choices: [
      {
        id: "scale_infrastructure",
        label: "Emergency Scale Infrastructure",
        description: "Upgrade servers immediately. Capture every lead.",
        effects: { cashDelta: -10000, burnDelta: 5000, revenueDelta: 12000, marketDelta: 5, investorDelta: 3 },
        minCashRequired: 10000,
      },
      {
        id: "waitlist_overflow",
        label: "Create a Waitlist",
        description: "Cap sign-ups and capture emails. Controlled growth.",
        effects: { revenueDelta: 4000, marketDelta: 3, productDelta: 2, investorDelta: 1 },
      },
      {
        id: "monetize_fast",
        label: "Monetize Fast",
        description: "Push paid plans to new users immediately. Aggressive but profitable.",
        effects: { revenueDelta: 15000, marketDelta: -2, investorDelta: 2, riskDelta: 3 },
      },
    ],
    oncePerRun: true,
    weight: 3,
  },

  // ===== OPERATIONAL (1) =====
  {
    id: "office_lease_decision",
    title: "Office Lease Decision",
    description: "Your landlord offered a 2-year lease at a below-market rate.",
    category: "operational",
    severity: "minor",
    narrative:
      "The building next door has a vacancy. Two years at 30% below market, but you need to commit this month. Your team is split: remote vs hybrid.",
    minMonth: 2,
    choices: [
      {
        id: "take_lease",
        label: "Take the Lease",
        description: "Lock in cheap rent. Higher burn but team cohesion.",
        effects: { cashDelta: -15000, burnDelta: 4000, productDelta: 3, investorDelta: 1, riskDelta: -1 },
        minCashRequired: 15000,
      },
      {
        id: "stay_remote",
        label: "Stay Remote",
        description: "Keep costs low. Some team members may leave for in-office jobs.",
        effects: { burnDelta: -2000, productDelta: -2, riskDelta: 2 },
      },
      {
        id: "coworking_upgrade",
        label: "Upgrade Coworking",
        description: "Compromise with a nicer coworking space. Middle ground.",
        effects: { cashDelta: -5000, burnDelta: 2000, productDelta: 1, riskDelta: -1 },
        minCashRequired: 5000,
      },
    ],
    oncePerRun: true,
    weight: 5,
  },
  {
    id: "vendor_acquired",
    title: "Key Vendor Acquired",
    description: "The startup whose API you depend on was just acquired by a big tech company.",
    category: "operational",
    severity: "moderate",
    narrative:
      "The small startup whose API powers your core workflow was just acquired by a FAANG. Their pricing page now says 'contact sales' and the rumors are bad.",
    minMonth: 3,
    choices: [
      {
        id: "build_in_house",
        label: "Build In-House Replacement",
        description: "Replace their API internally. Expensive but independent.",
        effects: { cashDelta: -15000, productDelta: 10, riskDelta: -5, investorDelta: 2 },
        minCashRequired: 15000,
      },
      {
        id: "enterprise_contract",
        label: "Sign Enterprise Contract",
        description: "Lock in a multi-year deal at a premium. Predictable but costly.",
        effects: { cashDelta: -20000, burnDelta: 3000, riskDelta: -2 },
        minCashRequired: 20000,
      },
      {
        id: "find_alternative",
        label: "Find Alternative Vendor",
        description: "Switch to a competitor's API. Some migration pain.",
        effects: { cashDelta: -5000, productDelta: -3, riskDelta: 1 },
        minCashRequired: 5000,
      },
    ],
    oncePerRun: true,
    weight: 3,
  },

  // ===== BONUS EVENTS to reach 25+ =====
  {
    id: "talent_poaching",
    title: "Talent Poaching Attempt",
    description: "A competitor is actively recruiting your top performer.",
    category: "team",
    severity: "moderate",
    narrative:
      "Your head of sales got a LinkedIn message from your competitor's CEO. The offer is 40% higher base. They're considering it.",
    minMonth: 3,
    choices: [
      {
        id: "match_offer",
        label: "Match the Offer",
        description: "Raise their comp to stay. Sets a precedent.",
        effects: { cashDelta: -15000, burnDelta: 5000, productDelta: 2, investorDelta: -1 },
        minCashRequired: 15000,
      },
      {
        id: "equity_bump",
        label: "Grant More Equity",
        description: "Offer vesting equity instead of cash. Aligns long-term.",
        effects: { investorDelta: 2, productDelta: 3, riskDelta: -1 },
      },
      {
        id: "let_go",
        label: "Let Them Go Gracefully",
        description: "Wish them well. Save cash but lose talent.",
        effects: { productDelta: -5, revenueDelta: -3000, riskDelta: 3, burnDelta: -3000 },
      },
    ],
    oncePerRun: false,
    weight: 4,
  },
  {
    id: "patent_threat",
    title: "Patent Threat",
    description: "A patent troll sent a cease-and-desist letter.",
    category: "regulatory",
    severity: "critical",
    narrative:
      "A shell company you've never heard of claims your core feature infringes their broad patent. They want a $50K license fee or they'll sue.",
    minMonth: 4,
    choices: [
      {
        id: "settle",
        label: "Settle Quickly",
        description: "Pay the fee and move on. Expensive but quiet.",
        effects: { cashDelta: -50000, riskDelta: -5, investorDelta: -2 },
        minCashRequired: 50000,
      },
      {
        id: "fight",
        label: "Fight in Court",
        description: "Challenge the patent. Expensive and public but principled.",
        effects: { cashDelta: -30000, riskDelta: 8, investorDelta: 3, marketDelta: 2 },
        minCashRequired: 30000,
      },
      {
        id: "workaround",
        label: "Engineer Around It",
        description: "Redesign the feature to avoid infringement. Slower but cheaper.",
        effects: { productDelta: -8, cashDelta: -8000, riskDelta: -2, investorDelta: 1 },
        minCashRequired: 8000,
      },
    ],
    oncePerRun: true,
    weight: 2,
  },
  {
    id: "strategic_partnership_offer",
    title: "Strategic Partnership Offer",
    description: "A larger company wants to partner for a co-marketing deal.",
    category: "investor",
    severity: "minor",
    narrative:
      "A Series C company in your ecosystem wants to co-market and share leads. No cash changes hands, but their brand could open doors.",
    minMonth: 2,
    choices: [
      {
        id: "accept_deal",
        label: "Accept the Partnership",
        description: "Commit integration resources for brand halo.",
        effects: { cashDelta: -5000, productDelta: 4, marketDelta: 4, investorDelta: 2 },
        minCashRequired: 5000,
      },
      {
        id: "negotiate_exclusive",
        label: "Negotiate Exclusivity",
        description: "Ask for an exclusive arrangement. Harder to get but more valuable.",
        effects: { cashDelta: -3000, marketDelta: 2, investorDelta: 1, riskDelta: 2 },
        minCashRequired: 3000,
      },
      {
        id: "decline",
        label: "Decline Politely",
        description: "Stay independent. No distraction, no upside.",
        effects: { productDelta: 2 },
      },
    ],
    oncePerRun: true,
    weight: 4,
  },
];

export function getEventById(id: string): SimulationEvent | undefined {
  return EVENT_LIBRARY.find((e) => e.id === id);
}
