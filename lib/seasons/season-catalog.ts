import type {
  ArenaSeason,
  SeasonChallenge,
  SeasonChallengeProgress,
  ChallengeRequirement,
} from "./types";

// ─── Beta Season 1 ────────────────────────────────────────────────────────────

const BETA_CHALLENGES: SeasonChallenge[] = [
  {
    id: "product_led_breakout",
    title: "Product-Led Breakout",
    description: "Reach 80%+ product progress and achieve BREAKOUT or SERIES_A_READY outcome.",
    category: "product",
    requirement: { type: "min_product_progress", value: 80 },
    reward: "+200 bonus score",
    badge: "⚡ Product Architect",
  },
  {
    id: "cockroach_survival",
    title: "Cockroach Survival",
    description: "Survive all 12 Founder Weeks without dying. No matter what the market throws at you.",
    category: "survival",
    requirement: { type: "min_survival_months", value: 12 },
    reward: "+150 bonus score",
    badge: "🪳 Cockroach",
  },
  {
    id: "rival_killer",
    title: "Rival Killer",
    description: "Defeat at least 2 rival founders during a single run.",
    category: "rivalry",
    requirement: { type: "min_rivals_defeated", value: 2 },
    reward: "+100 bonus score",
    badge: "⚔️ Arena Predator",
  },
  {
    id: "boardroom_survivor",
    title: "Boardroom Survivor",
    description: "Face and resolve 3 or more boardroom pressure events in a single run.",
    category: "boardroom",
    requirement: { type: "boardroom_events_resolved", value: 3 },
    reward: "+120 bonus score",
    badge: "🎭 Board Whisperer",
  },
  {
    id: "trust_moat",
    title: "Trust Moat",
    description: "Finish with social trust of 75 or higher.",
    category: "community",
    requirement: { type: "min_social_trust", value: 75 },
    reward: "+80 bonus score",
    badge: "🛡️ Trust Builder",
  },
];

export const BETA_SEASON_1: ArenaSeason = {
  slug: "beta-season-1",
  name: "Beta Season 1",
  tagline: "The First Founders. The First Blood.",
  status: "active",
  startDate: "2026-01-01",
  endDate: null,
  challenges: BETA_CHALLENGES,
  lore: "The arena opened its gates. No rules, no mercy. Only the metrics survive.",
};

// ─── Season Lookup ────────────────────────────────────────────────────────────

const ALL_SEASONS: ArenaSeason[] = [BETA_SEASON_1];

export function getCurrentSeason(): ArenaSeason {
  return BETA_SEASON_1;
}

export function getSeasonBySlug(slug: string): ArenaSeason | undefined {
  return ALL_SEASONS.find((s) => s.slug === slug);
}

// ─── Challenge Progress Calculation ──────────────────────────────────────────

export interface ChallengeProgressInput {
  productProgress: number;
  survivalMonths: number;
  rivalsDefeated: number;
  boardroomEventsResolved: number;
  socialTrust: number;
  revenue: number;
  score: number;
  outcome: string | null;
}

function getCurrentValue(req: ChallengeRequirement, input: ChallengeProgressInput): number {
  switch (req.type) {
    case "min_product_progress": return input.productProgress;
    case "min_survival_months": return input.survivalMonths;
    case "min_rivals_defeated": return input.rivalsDefeated;
    case "boardroom_events_resolved": return input.boardroomEventsResolved;
    case "min_social_trust": return input.socialTrust;
    case "min_revenue": return input.revenue;
    case "min_score": return input.score;
    case "outcome_equals": return input.outcome === req.value ? 1 : 0;
  }
}

function getTarget(req: ChallengeRequirement): number {
  if (req.type === "outcome_equals") return 1;
  return req.value;
}

export function calculateChallengeProgress(
  challenges: SeasonChallenge[],
  input: ChallengeProgressInput
): SeasonChallengeProgress[] {
  return challenges.map((challenge) => {
    const current = getCurrentValue(challenge.requirement, input);
    const target = getTarget(challenge.requirement);
    const completed = current >= target;
    const pct = Math.min(100, Math.round((current / Math.max(target, 1)) * 100));
    return { challenge, current, target, completed, pct };
  });
}
