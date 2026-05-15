import { SocialAction } from "./types";

export const SOCIAL_ACTION_CATALOG: SocialAction[] = [
  // ── 1. Founder X Thread ─────────────────────────────────────────────────
  {
    id: "founder_x_thread",
    title: "Founder X Thread",
    description:
      "Share a raw, unfiltered builder thread on X. Builds founder credibility and hype but shallow with no follow-through.",
    channel: "x",
    channelLabel: "X / Twitter",
    cost: 1000,
    effects: {
      followersDelta: 200,
      hypeDelta: 8,
      founderReputationDelta: 4,
      sentimentDelta: 5,
    },
    riskLevel: "low",
    backfireCondition: {
      condition: "high_hype_low_trust",
      threshold: 30, // fires when trust < 30 AND hype already > 60
      backfireEffects: {
        brandRiskDelta: 12,
        trustDelta: -5,
        sentimentDelta: -10,
      },
      warningText:
        "High hype with low trust turns threads into noise. Expect cynical replies.",
    },
    tags: ["hype", "founder", "awareness"],
  },

  // ── 2. Product Demo TikTok ───────────────────────────────────────────────
  {
    id: "product_demo_tiktok",
    title: "Product Demo TikTok",
    description:
      "Film a real product walkthrough. High reach, high variance — it can go viral or expose rough edges.",
    channel: "tiktok",
    channelLabel: "TikTok",
    cost: 2000,
    requiredProductProgress: 30,
    effects: {
      followersDelta: 600,
      viralMomentumDelta: 15,
      hypeDelta: 10,
      userGrowthDelta: 300,
      revenueDelta: 2000,
    },
    riskLevel: "medium",
    backfireCondition: {
      condition: "low_product_progress",
      threshold: 50, // fires when product < 50
      backfireEffects: {
        brandRiskDelta: 10,
        trustDelta: -8,
        sentimentDelta: -15,
        riskDelta: 3,
      },
      warningText:
        "Demo with < 50% product progress risks exposing bugs and unfinished flows to thousands.",
    },
    tags: ["viral", "demo", "tiktok", "growth"],
  },

  // ── 3. Instagram Behind-the-Scenes ──────────────────────────────────────
  {
    id: "instagram_bts",
    title: "Instagram Behind-the-Scenes",
    description:
      "Post team moments, workspace, and candid culture shots. Builds trust and community without hype pressure.",
    channel: "instagram",
    channelLabel: "Instagram",
    cost: 1500,
    effects: {
      followersDelta: 150,
      trustDelta: 8,
      communityStrengthDelta: 6,
      sentimentDelta: 8,
      moraleDelta: 3,
    },
    riskLevel: "low",
    tags: ["trust", "culture", "community"],
  },

  // ── 4. Launch Announcement ───────────────────────────────────────────────
  {
    id: "launch_announcement",
    title: "Launch Announcement",
    description:
      "Go live across all channels. Maximum reach. Fires up hype and user growth — but the product needs to hold.",
    channel: ["x", "instagram", "tiktok"],
    channelLabel: "X / Instagram / TikTok",
    cost: 5000,
    requiredProductProgress: 50,
    effects: {
      followersDelta: 1200,
      hypeDelta: 20,
      viralMomentumDelta: 18,
      userGrowthDelta: 800,
      revenueDelta: 8000,
      founderReputationDelta: 6,
    },
    riskLevel: "high",
    backfireCondition: {
      condition: "low_product_progress",
      threshold: 70, // fires when product < 70
      backfireEffects: {
        brandRiskDelta: 22,
        trustDelta: -15,
        sentimentDelta: -20,
        riskDelta: 5,
        revenueDelta: -3000,
      },
      warningText:
        "Launching with < 70% product progress often causes public backlash. Users will talk.",
    },
    tags: ["launch", "multi-channel", "hype", "milestone"],
  },

  // ── 5. Founder Transparency Post ─────────────────────────────────────────
  {
    id: "founder_transparency_post",
    title: "Founder Transparency Post",
    description:
      "Share honest metrics, hard lessons, or a raw progress update. Builds deep trust. Slightly deflates hype.",
    channel: ["x", "founder_blog"],
    channelLabel: "X / Blog",
    cost: 500,
    effects: {
      trustDelta: 12,
      founderReputationDelta: 6,
      hypeDelta: -3,
      brandRiskDelta: -6,
      sentimentDelta: 6,
      investorDelta: 3,
    },
    riskLevel: "low",
    tags: ["trust", "transparency", "investor", "founder"],
  },

  // ── 6. Influencer Collaboration ──────────────────────────────────────────
  {
    id: "influencer_collab",
    title: "Influencer Collaboration",
    description:
      "Partner with a creator for a sponsored feature. Big reach, big variance. Their audience isn't yours yet.",
    channel: ["tiktok", "instagram"],
    channelLabel: "TikTok / Instagram",
    cost: 8000,
    effects: {
      followersDelta: 1800,
      viralMomentumDelta: 22,
      hypeDelta: 16,
      brandRiskDelta: 8,
      userGrowthDelta: 500,
    },
    riskLevel: "high",
    backfireCondition: {
      condition: "low_trust",
      threshold: 35,
      backfireEffects: {
        brandRiskDelta: 14,
        trustDelta: -10,
        sentimentDelta: -12,
      },
      warningText:
        "Influencer reach with low trust often generates cynicism, not conversions.",
    },
    tags: ["viral", "influencer", "reach", "risk"],
  },

  // ── 7. Crisis Response ───────────────────────────────────────────────────
  {
    id: "crisis_response",
    title: "Crisis Response Post",
    description:
      "Address the issue head-on. Reduces brand risk and signals accountability. Damage isn't erased — it's contained.",
    channel: "x",
    channelLabel: "X / Twitter",
    cost: 0,
    requiredBrandRiskAbove: 40,
    effects: {
      brandRiskDelta: -22,
      trustDelta: 10,
      hypeDelta: -5,
      founderReputationDelta: 4,
      sentimentDelta: 8,
      riskDelta: -4,
    },
    riskLevel: "medium",
    tags: ["crisis", "damage-control", "trust"],
  },

  // ── 8. Customer Testimonial Campaign ─────────────────────────────────────
  {
    id: "customer_testimonial",
    title: "Customer Testimonial Campaign",
    description:
      "Feature real users talking about real results. Converts browsers, builds social proof, raises trust.",
    channel: ["x", "instagram"],
    channelLabel: "X / Instagram",
    cost: 3000,
    requiredMinRevenue: 5000,
    effects: {
      trustDelta: 10,
      communityStrengthDelta: 8,
      founderReputationDelta: 4,
      revenueDelta: 4000,
      userGrowthDelta: 200,
      sentimentDelta: 10,
    },
    riskLevel: "low",
    tags: ["trust", "conversion", "social-proof"],
  },

  // ── 9. Investor Update Post ──────────────────────────────────────────────
  {
    id: "investor_update",
    title: "Investor Update Post",
    description:
      "Share metrics and traction with a public or semi-public investor audience. Credibility only holds if the numbers do.",
    channel: ["linkedin", "x"],
    channelLabel: "LinkedIn / X",
    cost: 500,
    effects: {
      investorDelta: 6,
      founderReputationDelta: 5,
      trustDelta: 4,
    },
    riskLevel: "medium",
    backfireCondition: {
      condition: "low_trust",
      threshold: 40,
      backfireEffects: {
        brandRiskDelta: 8,
        investorDelta: -3,
        sentimentDelta: -8,
      },
      warningText:
        "Investor updates with weak metrics attract scrutiny and raise concerns about your judgment.",
    },
    tags: ["investor", "credibility", "traction"],
  },

  // ── 10. Competitor Callout ───────────────────────────────────────────────
  {
    id: "competitor_callout",
    title: "Competitor Callout",
    description:
      "Call out a competitor's weakness publicly. Hype spikes fast. So does brand risk and rival attention.",
    channel: "x",
    channelLabel: "X / Twitter",
    cost: 1000,
    effects: {
      hypeDelta: 15,
      viralMomentumDelta: 12,
      followersDelta: 400,
      brandRiskDelta: 16,
      sentimentDelta: -5,
    },
    riskLevel: "high",
    backfireCondition: {
      condition: "high_brand_risk",
      threshold: 50,
      backfireEffects: {
        brandRiskDelta: 12,
        trustDelta: -8,
        riskDelta: 5,
      },
      warningText:
        "With existing brand risk above 50, a callout is gasoline. Rivals and press will respond.",
    },
    tags: ["competitive", "hype", "risk", "viral"],
  },
];

export function getSocialActionById(id: string): SocialAction | undefined {
  return SOCIAL_ACTION_CATALOG.find((a) => a.id === id);
}
