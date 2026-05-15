import type { RivalStartup, RivalArchetype, GenerateRivalsContext } from "./types";
import {
  rivalSeed,
  pick,
  generateRivalStartupName,
  buildFounderProfile,
  ARCHETYPE_DEFINITIONS,
  rivalryScoreToRelationship,
} from "./rival-catalog";

// ─── Sector → preferred archetype affinity ───────────────────────────────────

const SECTOR_ARCHETYPE_AFFINITY: Record<string, RivalArchetype[]> = {
  "SaaS":         ["copycat", "enterprise_killer", "predator_vc_backed", "technical_genius"],
  "AI":           ["technical_genius", "hype_founder", "predator_vc_backed", "copycat"],
  "FinTech":      ["regulatory_operator", "enterprise_killer", "predator_vc_backed", "community_builder"],
  "HealthTech":   ["regulatory_operator", "technical_genius", "enterprise_killer", "community_builder"],
  "Consumer":     ["hype_founder", "community_builder", "copycat", "chaos_founder"],
  "EdTech":       ["community_builder", "hype_founder", "copycat", "regulatory_operator"],
  "Marketplace":  ["predator_vc_backed", "community_builder", "hype_founder", "copycat"],
  "Gaming":       ["hype_founder", "community_builder", "chaos_founder", "copycat"],
  "Logistics":    ["enterprise_killer", "technical_genius", "regulatory_operator", "predator_vc_backed"],
  "Climate":      ["regulatory_operator", "community_builder", "technical_genius", "enterprise_killer"],
  "Defense":      ["regulatory_operator", "technical_genius", "enterprise_killer", "predator_vc_backed"],
  "Web3":         ["chaos_founder", "hype_founder", "community_builder", "predator_vc_backed"],
  "Hardware":     ["technical_genius", "enterprise_killer", "regulatory_operator", "predator_vc_backed"],
  "Enterprise":   ["enterprise_killer", "regulatory_operator", "predator_vc_backed", "technical_genius"],
};

const ALL_ARCHETYPES: RivalArchetype[] = [
  "copycat", "hype_founder", "enterprise_killer", "technical_genius",
  "predator_vc_backed", "community_builder", "regulatory_operator", "chaos_founder",
];

function archetypesForSector(sector: string): RivalArchetype[] {
  return SECTOR_ARCHETYPE_AFFINITY[sector] ?? ALL_ARCHETYPES;
}

// ─── Choose 2–3 distinct archetypes for this run ─────────────────────────────

function selectArchetypes(
  sector: string,
  seed: number,
  count: number
): RivalArchetype[] {
  const pool = archetypesForSector(sector);
  const selected: RivalArchetype[] = [];

  // First rival: aligned with player's sector
  selected.push(pool[Math.abs(seed) % pool.length]);

  // Second rival: contrasting archetype (not already selected)
  const contrastPool = ALL_ARCHETYPES.filter((a) => a !== selected[0]);
  selected.push(contrastPool[Math.abs(seed + 17) % contrastPool.length]);

  // Third rival (if count === 3): another from sector pool, not already chosen
  if (count === 3) {
    const remainingPool = pool.filter((a) => !selected.includes(a));
    const fallback = ALL_ARCHETYPES.filter((a) => !selected.includes(a));
    const thirdPool = remainingPool.length > 0 ? remainingPool : fallback;
    selected.push(thirdPool[Math.abs(seed + 31) % thirdPool.length]);
  }

  return selected;
}

// ─── Build a rival startup snapshot ──────────────────────────────────────────

function buildRivalStartup(
  archetype: RivalArchetype,
  seed: number,
  ctx: GenerateRivalsContext,
  index: number
): RivalStartup {
  const def = ARCHETYPE_DEFINITIONS[archetype];
  const name = generateRivalStartupName(seed + index * 100);
  const founder = buildFounderProfile(archetype, seed + index * 200);

  // Starting stats seeded from archetype ranges
  function fromRange(range: [number, number], extra: number): number {
    const [min, max] = range;
    return Math.min(99, Math.max(0, min + (Math.abs(seed + extra) % (max - min + 1))));
  }

  const productProgress = fromRange(def.startingProductProgress, index * 10 + 1);
  const hype = fromRange(def.startingHype, index * 10 + 2);
  const trust = fromRange(def.startingTrust, index * 10 + 3);

  // Scale rival difficulty modestly above player (avoids pushover rivals)
  const difficultyBoost = Math.min(15, Math.floor(ctx.investorScore / 10));
  const traction = Math.min(80, 15 + difficultyBoost + (Math.abs(seed + 4) % 25));
  const revenueEstimate = Math.max(0,
    ctx.revenue > 0
      ? Math.floor(ctx.revenue * (0.4 + (Math.abs(seed + 5) % 80) / 100))
      : Math.abs(seed + 5) % 8000
  );

  const valuationEstimate = 200000 + (Math.abs(seed + 6) % 800000);
  const cashEstimate = 50000 + (Math.abs(seed + 7) % 350000);
  const risk = Math.min(70, 10 + (Math.abs(seed + 8) % 40));
  const investorHeat = def.fundingStatus === "series_a" ? 65 + (Math.abs(seed + 9) % 25) : 25 + (Math.abs(seed + 9) % 40);
  const mediaPresence = fromRange(def.mediaSkill, index * 10 + 10);

  const narrativeTags = buildNarrativeTags(archetype, seed);

  const id = `rival-${ctx.startupId.slice(-8)}-${index}-${seed & 0xffff}`;

  return {
    id,
    name,
    founder,
    sector: ctx.sector,
    stage: def.fundingStatus === "series_a" ? "growth" : def.fundingStatus === "seed" ? "seed" : "bootstrapped",
    fundingStatus: def.fundingStatus,
    cashEstimate,
    valuationEstimate,
    productProgress,
    traction,
    revenueEstimate,
    hype,
    trust,
    risk,
    investorHeat,
    mediaPresence,
    relationshipToPlayer: "neutral",
    rivalryScore: 0,
    activeNarrativeTags: narrativeTags,
    isDefeated: false,
    monthGenerated: ctx.currentMonth,
  };
}

function buildNarrativeTags(archetype: RivalArchetype, seed: number): string[] {
  const tagsByArchetype: Record<RivalArchetype, string[]> = {
    copycat:               ["fast-follower", "positioning-mirror"],
    hype_founder:          ["media-darling", "narrative-heavy"],
    enterprise_killer:     ["b2b-focused", "direct-sales"],
    technical_genius:      ["product-led", "high-velocity"],
    predator_vc_backed:    ["well-capitalized", "aggressive-expansion"],
    community_builder:     ["community-moat", "word-of-mouth"],
    regulatory_operator:   ["compliance-first", "institutional-trust"],
    chaos_founder:         ["unpredictable", "high-media-risk"],
  };
  const pool = tagsByArchetype[archetype];
  // pick 1-2 tags
  const count = 1 + (Math.abs(seed) % 2);
  return pool.slice(0, count);
}

// ─── Public: generate rivals for a startup run ───────────────────────────────

export function generateRivals(ctx: GenerateRivalsContext): RivalStartup[] {
  const s = rivalSeed(ctx.startupId + ctx.sector);

  // 2 rivals for early stage, 3 for funded/active
  const count = ctx.stage === "idea" || ctx.stage === "draft" ? 2 : 3;

  const archetypes = selectArchetypes(ctx.sector, s, count);

  return archetypes.map((archetype, i) =>
    buildRivalStartup(archetype, rivalSeed(`${ctx.startupId}-${archetype}-${i}`), ctx, i)
  );
}
