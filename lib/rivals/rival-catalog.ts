import type { RivalArchetype, RivalFounderProfile, RivalMoveType } from "./types";

// ─── Deterministic seed hash ──────────────────────────────────────────────────

export function rivalSeed(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33 + str.charCodeAt(i)) & 0x7fffffff;
  return h;
}

export function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

// ─── Founder name pools ───────────────────────────────────────────────────────

const FIRST_NAMES = [
  "Maya", "Jordan", "Alex", "Priya", "Marcus", "Sofia", "Ethan", "Layla",
  "Noah", "Zara", "Kai", "Elena", "Darius", "Nadia", "Oscar", "Lena",
  "Ravi", "Chloe", "Tariq", "Mia", "Felix", "Aisha", "Luca", "Yara",
];

const LAST_NAMES = [
  "Chen", "Patel", "Rivera", "Kim", "Okafor", "Nowak", "Shah", "Müller",
  "Tanaka", "Brooks", "Singh", "Reyes", "Andersen", "Nakamura", "Costa",
  "Johansson", "Williams", "Hassan", "Petrov", "Mbeki", "Kowalski", "Ruiz",
];

// ─── Startup name pools ───────────────────────────────────────────────────────

const NAME_PREFIX = [
  "Nova", "Atlas", "Forge", "Apex", "Nexus", "Prism", "Flux", "Veil",
  "Echo", "Shift", "Arc", "Pulse", "Core", "Helix", "Grid", "Span",
  "Volt", "Edge", "Peak", "Root", "Warp", "Mesh", "Loop", "Spark",
];

const NAME_SUFFIX = [
  "Stack", "Flow", "Labs", "Works", "AI", "HQ", "Base", "Hub",
  "Tech", "Systems", "IO", "Cloud", "App", "Dev", "Net", "Scale",
  "Logic", "Ops", "Core", "Link", "Data", "Build", "Run", "Go",
];

export function generateRivalStartupName(seed: number): string {
  return pick(NAME_PREFIX, seed) + pick(NAME_SUFFIX, seed + 7);
}

export function generateRivalFounderName(seed: number): string {
  return `${pick(FIRST_NAMES, seed)} ${pick(LAST_NAMES, seed + 3)}`;
}

// ─── Archetype definitions ────────────────────────────────────────────────────

export interface ArchetypeDefinition {
  archetype: RivalArchetype;
  personality: string;
  catchphrases: string[];
  aggression: [number, number];        // [min, max]
  ethics: [number, number];
  mediaSkill: [number, number];
  fundraisingSkill: [number, number];
  productSkill: [number, number];
  salesSkill: [number, number];
  preferredMoves: RivalMoveType[];
  startingHype: [number, number];
  startingTrust: [number, number];
  startingProductProgress: [number, number];
  fundingStatus: "bootstrapped" | "seed" | "series_a";
}

export const ARCHETYPE_DEFINITIONS: Record<RivalArchetype, ArchetypeDefinition> = {
  copycat: {
    archetype: "copycat",
    personality: "Fast follower who mirrors successful positioning and ships quickly. Low vision, high execution.",
    catchphrases: [
      "We saw the gap. We filled it.",
      "First to market means nothing. Best to market wins.",
      "Imitation is the highest form of optimization.",
    ],
    aggression: [40, 65],
    ethics: [30, 60],
    mediaSkill: [60, 80],
    fundraisingSkill: [40, 60],
    productSkill: [50, 70],
    salesSkill: [55, 75],
    preferredMoves: ["copy_positioning", "ship_feature", "viral_campaign", "poach_attention", "customer_poach"],
    startingHype: [25, 45],
    startingTrust: [35, 55],
    startingProductProgress: [20, 45],
    fundingStatus: "bootstrapped",
  },

  hype_founder: {
    archetype: "hype_founder",
    personality: "Masters social narratives and investor perception. Product is an afterthought until Series A.",
    catchphrases: [
      "We're not a startup. We're a movement.",
      "The story is the product.",
      "Capital follows attention. Attention follows us.",
    ],
    aggression: [55, 85],
    ethics: [25, 55],
    mediaSkill: [75, 95],
    fundraisingSkill: [65, 85],
    productSkill: [20, 45],
    salesSkill: [50, 70],
    preferredMoves: ["viral_campaign", "raise_round", "founder_callout", "acquisition_rumor", "poach_attention"],
    startingHype: [55, 80],
    startingTrust: [25, 45],
    startingProductProgress: [10, 30],
    fundingStatus: "seed",
  },

  enterprise_killer: {
    archetype: "enterprise_killer",
    personality: "Targets B2B customers with aggressive pricing and direct sales. Slow and methodical.",
    catchphrases: [
      "Your enterprise customers are our next customers.",
      "We don't sell software. We solve contracts.",
      "Procurement cycle is a feature, not a bug.",
    ],
    aggression: [45, 70],
    ethics: [50, 80],
    mediaSkill: [30, 55],
    fundraisingSkill: [50, 75],
    productSkill: [55, 75],
    salesSkill: [75, 95],
    preferredMoves: ["enterprise_push", "price_war", "customer_poach", "partnership_announcement", "compliance_win"],
    startingHype: [15, 35],
    startingTrust: [45, 65],
    startingProductProgress: [40, 65],
    fundingStatus: "seed",
  },

  technical_genius: {
    archetype: "technical_genius",
    personality: "Ships product faster than anyone. Terrible at sales and brand. Can force a product race.",
    catchphrases: [
      "We shipped v2 while you were writing your roadmap.",
      "Architecture is strategy.",
      "The code doesn't lie. The deck does.",
    ],
    aggression: [30, 55],
    ethics: [60, 85],
    mediaSkill: [15, 40],
    fundraisingSkill: [25, 50],
    productSkill: [80, 99],
    salesSkill: [20, 40],
    preferredMoves: ["ship_feature", "launch_beta", "compliance_win", "security_fumble", "market_narrative_shift"],
    startingHype: [20, 40],
    startingTrust: [50, 70],
    startingProductProgress: [45, 75],
    fundingStatus: "bootstrapped",
  },

  predator_vc_backed: {
    archetype: "predator_vc_backed",
    personality: "Flush with capital. Moves aggressively on market share and talent. Will compare you unfavorably to investors.",
    catchphrases: [
      "We have 18 months of runway to take your market.",
      "Capital efficiency is a poverty mindset.",
      "Your investors are watching us.",
    ],
    aggression: [65, 90],
    ethics: [25, 50],
    mediaSkill: [55, 75],
    fundraisingSkill: [80, 99],
    productSkill: [45, 65],
    salesSkill: [60, 80],
    preferredMoves: ["raise_round", "team_poach_attempt", "poach_attention", "acquisition_rumor", "founder_callout", "price_war"],
    startingHype: [45, 70],
    startingTrust: [30, 55],
    startingProductProgress: [30, 55],
    fundingStatus: "series_a",
  },

  community_builder: {
    archetype: "community_builder",
    personality: "Builds moats through loyalty, user community, and brand narrative. Slow but sticky.",
    catchphrases: [
      "Our users don't just use the product. They defend it.",
      "Community is the only moat that compounds.",
      "The brand is the product.",
    ],
    aggression: [20, 45],
    ethics: [65, 90],
    mediaSkill: [60, 80],
    fundraisingSkill: [35, 60],
    productSkill: [45, 65],
    salesSkill: [50, 70],
    preferredMoves: ["viral_campaign", "partnership_announcement", "launch_beta", "market_narrative_shift", "ship_feature"],
    startingHype: [30, 55],
    startingTrust: [55, 80],
    startingProductProgress: [30, 55],
    fundingStatus: "bootstrapped",
  },

  regulatory_operator: {
    archetype: "regulatory_operator",
    personality: "Wins by navigating compliance better than anyone. Low hype, high institutional trust.",
    catchphrases: [
      "Regulation isn't a moat. It's a sword.",
      "We asked for permission. You'll ask for forgiveness.",
      "The audit is a feature, not a bug.",
    ],
    aggression: [30, 55],
    ethics: [75, 99],
    mediaSkill: [20, 45],
    fundraisingSkill: [45, 70],
    productSkill: [50, 70],
    salesSkill: [55, 75],
    preferredMoves: ["compliance_win", "enterprise_push", "partnership_announcement", "market_narrative_shift", "raise_round"],
    startingHype: [15, 30],
    startingTrust: [60, 80],
    startingProductProgress: [45, 70],
    fundingStatus: "seed",
  },

  chaos_founder: {
    archetype: "chaos_founder",
    personality: "Unpredictable. Makes bold moves with no regard for consequences. High variance, high press attention.",
    catchphrases: [
      "Disruption isn't a strategy. It's a personality.",
      "They said we couldn't. We did it anyway.",
      "Rules are just suggestions with PR risk.",
    ],
    aggression: [75, 99],
    ethics: [10, 40],
    mediaSkill: [65, 90],
    fundraisingSkill: [50, 75],
    productSkill: [35, 65],
    salesSkill: [45, 70],
    preferredMoves: ["founder_callout", "viral_campaign", "acquisition_rumor", "market_narrative_shift", "price_war", "security_fumble"],
    startingHype: [50, 80],
    startingTrust: [20, 40],
    startingProductProgress: [20, 50],
    fundingStatus: "seed",
  },
};

// ─── Move content pools (deterministic descriptions) ─────────────────────────

export const MOVE_CONTENT: Record<string, { titles: string[]; bodies: string[] }> = {
  launch_beta: {
    titles: [
      "{rival} launched a private beta",
      "{rival} opened beta to 500 users",
      "{rival}'s beta is live",
    ],
    bodies: [
      "{founderName} just announced a beta launch targeting your exact customer segment. Early signals look real.",
      "{rival} went live with a beta. Waitlist is growing. They're building social proof fast.",
      "{founderName} opened doors on {rival}'s beta. Some of your prospects are asking about it.",
    ],
  },
  raise_round: {
    titles: [
      "{rival} closed a funding round",
      "{rival} raised a seed extension",
      "{founderName} announced new backing",
    ],
    bodies: [
      "{rival} just closed a round. Their runway extends past yours. Investor attention will shift.",
      "{founderName} secured new funding. Expect them to accelerate hiring and marketing spend.",
      "{rival} has fresh capital. Your shared investors are comparing deal terms.",
    ],
  },
  ship_feature: {
    titles: [
      "{rival} shipped a major feature",
      "{rival} updated their product",
      "{founderName} posted a product update",
    ],
    bodies: [
      "{rival} just shipped a feature your users have been requesting. Watch churn signals.",
      "{founderName} posted a changelog. Their product velocity is accelerating.",
      "{rival} pushed a major update publicly. Tech press picked it up as a 'gap closer.'",
    ],
  },
  copy_positioning: {
    titles: [
      "{rival} copied your messaging",
      "{rival}'s new landing page looks familiar",
      "{founderName} adopted your narrative",
    ],
    bodies: [
      "{rival}'s new homepage uses almost identical language to yours. They're targeting the same ICP.",
      "{founderName} rewrote {rival}'s positioning. It reads like they screen-scraped your pitch deck.",
      "{rival} launched a campaign using your exact value props. Prospects may be confused.",
    ],
  },
  poach_attention: {
    titles: [
      "{rival} captured the news cycle",
      "{founderName} went viral",
      "{rival} dominated tech press today",
    ],
    bodies: [
      "{rival} made a splashy announcement that buried your recent launch in the news cycle.",
      "{founderName} dropped a viral post that's pulling attention from your traction story.",
      "{rival} ran a stunt that's getting more press than your product update. Noise is their strategy.",
    ],
  },
  price_war: {
    titles: [
      "{rival} cut prices",
      "{founderName} launched a price war",
      "{rival} offered free tier to your customers",
    ],
    bodies: [
      "{rival} slashed pricing and sent an email to anyone who's ever signed up to a competing tool. Some of your customers responded.",
      "{founderName} announced a 'competitor migration offer' — direct discount targeting your users.",
      "{rival} is burning capital on pricing. Short-term pain for you, long-term pain for them.",
    ],
  },
  enterprise_push: {
    titles: [
      "{rival} is targeting enterprise accounts",
      "{founderName} announced enterprise tier",
      "{rival} signed a major B2B deal",
    ],
    bodies: [
      "{rival} announced enterprise features and SOC 2. They're moving upmarket into your territory.",
      "{founderName} posted about closing a 6-figure enterprise deal. Your shared prospects noticed.",
      "{rival} is running a direct outbound campaign against enterprise accounts in your sector.",
    ],
  },
  viral_campaign: {
    titles: [
      "{rival} went viral",
      "{founderName}'s post is everywhere",
      "{rival} landed a viral moment",
    ],
    bodies: [
      "{rival}'s campaign spread fast. They're picking up followers and inbound while your feed is quiet.",
      "{founderName} ran a creator campaign that flooded the zone. Mindshare is a zero-sum game this week.",
      "{rival}'s viral moment is driving their waitlist past 10K. Investors are watching.",
    ],
  },
  founder_callout: {
    titles: [
      "{founderName} called you out",
      "{rival} attacked your product publicly",
      "{founderName} mocked your progress on X",
    ],
    bodies: [
      "{founderName} posted a thread questioning your launch timeline. Comments are mixed but attention is real.",
      "{rival}'s founder called your approach 'vapor' in a Twitter thread. Your community is responding.",
      "{founderName} posted a comparison that makes your product look unfinished. Press is picking it up.",
    ],
  },
  security_fumble: {
    titles: [
      "{rival} had a security incident",
      "{founderName} disclosed a data issue",
      "{rival}'s customers are angry",
    ],
    bodies: [
      "{rival} disclosed a security incident. Their users are frustrated. Some are asking about alternatives.",
      "{founderName} posted a late breach disclosure. Trust is collapsing. Opportunity to absorb unhappy customers.",
      "{rival}'s downtime and incident report are driving angry posts from their users. Your inbox is open.",
    ],
  },
  compliance_win: {
    titles: [
      "{rival} achieved SOC 2 compliance",
      "{founderName} announced regulatory approval",
      "{rival} cleared a compliance milestone",
    ],
    bodies: [
      "{rival} posted their SOC 2 Type II cert. Enterprise prospects may deprioritize you until you match it.",
      "{founderName} announced a regulatory win that unlocks a vertical you're both targeting.",
      "{rival}'s compliance posture just improved. Procurement cycles will favor them in regulated sectors.",
    ],
  },
  partnership_announcement: {
    titles: [
      "{rival} announced a major partnership",
      "{founderName} signed a distribution deal",
      "{rival} joined a major platform ecosystem",
    ],
    bodies: [
      "{rival} announced a distribution partnership that puts their product in front of your customers.",
      "{founderName} signed a co-sell agreement with a major platform actor. Indirect pipeline threat.",
      "{rival}'s ecosystem partnership gives them credibility you'll need to actively counter.",
    ],
  },
  customer_poach: {
    titles: [
      "{rival} is poaching your customers",
      "{founderName} launched a migration campaign",
      "{rival} is targeting your user base",
    ],
    bodies: [
      "{rival} ran an outbound campaign targeting users who fit your profile. Some responded.",
      "{founderName} posted a direct migration offer for users 'frustrated with alternatives.' That's you.",
      "{rival}'s support team is responding in forums where your users post complaints. Proactive and targeted.",
    ],
  },
  market_narrative_shift: {
    titles: [
      "{rival} is reframing the market",
      "{founderName} published a category essay",
      "{rival} is defining the narrative",
    ],
    bodies: [
      "{founderName} published a long essay redefining what your category is for. Investors are citing it.",
      "{rival} launched a thought leadership campaign that positions them as the definitive solution.",
      "{rival}'s narrative is taking hold in analyst reports. You're being referenced as a follower.",
    ],
  },
};

// ─── Relationship escalation thresholds ──────────────────────────────────────

export function rivalryScoreToRelationship(
  score: number,
  isDefeated: boolean
): import("./types").RivalRelationship {
  if (isDefeated) return "defeated";
  if (score >= 80) return "feared";
  if (score >= 60) return "hostile";
  if (score >= 40) return "tense";
  if (score <= 5)  return "friendly";
  if (score <= 15) return "respected";
  return "neutral";
}

// ─── Build a founder profile from seed ───────────────────────────────────────

function statFromRange(range: [number, number], seed: number): number {
  const [min, max] = range;
  return min + (Math.abs(seed) % (max - min + 1));
}

export function buildFounderProfile(
  archetype: RivalArchetype,
  seed: number
): RivalFounderProfile {
  const def = ARCHETYPE_DEFINITIONS[archetype];
  return {
    id: `founder-${archetype}-${seed & 0xffff}`,
    name: generateRivalFounderName(seed),
    personality: def.personality,
    archetype,
    aggression: statFromRange(def.aggression, seed + 1),
    ethics: statFromRange(def.ethics, seed + 2),
    mediaSkill: statFromRange(def.mediaSkill, seed + 3),
    fundraisingSkill: statFromRange(def.fundraisingSkill, seed + 4),
    productSkill: statFromRange(def.productSkill, seed + 5),
    salesSkill: statFromRange(def.salesSkill, seed + 6),
    catchphrase: pick(def.catchphrases, seed + 7),
  };
}
