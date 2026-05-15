import type {
  RivalStartup,
  RivalMove,
  RivalMoveType,
  RivalEventEffect,
  RivalMoveContext,
  ApplyRivalMovesResult,
} from "./types";
import {
  rivalSeed,
  pick,
  ARCHETYPE_DEFINITIONS,
  MOVE_CONTENT,
  rivalryScoreToRelationship,
} from "./rival-catalog";
import { generateRivalFeedItems } from "./rival-feed";

// ─── Clamp helper ─────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

// ─── Move probability table ───────────────────────────────────────────────────
// Each archetype has a probability weight per move type (0 = never).

function buildMoveWeights(
  rival: RivalStartup,
  ctx: RivalMoveContext
): Partial<Record<RivalMoveType, number>> {
  const def = ARCHETYPE_DEFINITIONS[rival.founder.archetype];
  const base: Partial<Record<RivalMoveType, number>> = {};

  for (const m of def.preferredMoves) {
    base[m] = 3; // preferred moves get 3× weight
  }

  // Conditional boosts based on player state
  if (ctx.playerProductProgress < 50 && !base.copy_positioning) base.copy_positioning = 1;
  if (ctx.playerHype > 60) { base.poach_attention = (base.poach_attention ?? 0) + 2; }
  if (ctx.playerRevenue > 10000) { base.customer_poach = (base.customer_poach ?? 0) + 1; }
  if (ctx.playerBrandRisk > 50) { base.founder_callout = (base.founder_callout ?? 0) + 2; }
  if (ctx.playerTrust < 40) { base.market_narrative_shift = (base.market_narrative_shift ?? 0) + 1; }

  // Rival self-development: if behind on product, likely to ship
  if (rival.productProgress < 40) { base.ship_feature = (base.ship_feature ?? 0) + 2; }
  if (rival.hype < 30) { base.viral_campaign = (base.viral_campaign ?? 0) + 1; }

  // Fundraising is tied to skill
  if (rival.founder.fundraisingSkill > 65 && ctx.month % 3 === 0) {
    base.raise_round = (base.raise_round ?? 0) + 2;
  }

  // Social trigger: player ran a competitor callout → rival retaliates
  if (ctx.lastPlayerSocialActionId === "competitor_callout") {
    base.founder_callout = (base.founder_callout ?? 0) + 4;
    base.poach_attention = (base.poach_attention ?? 0) + 2;
  }

  // Social trigger: player had a viral launch → copycat or poach
  if (ctx.lastPlayerSocialActionId === "launch_announcement") {
    base.copy_positioning = (base.copy_positioning ?? 0) + 2;
    base.poach_attention = (base.poach_attention ?? 0) + 2;
  }

  // Social trigger: product demo → rival ship response
  if (ctx.lastPlayerSocialActionId === "product_demo_tiktok") {
    base.ship_feature = (base.ship_feature ?? 0) + 2;
  }

  // Rival makes mistakes: security_fumble only when rival has low ethics & high product
  if (rival.founder.ethics < 40 && rival.productProgress > 60) {
    base.security_fumble = 1; // occasional accidental mistake
  }

  return base;
}

// ─── Weighted random selection using seed ────────────────────────────────────

function selectMove(
  weights: Partial<Record<RivalMoveType, number>>,
  seed: number
): RivalMoveType | null {
  const entries = Object.entries(weights) as [RivalMoveType, number][];
  if (entries.length === 0) return null;

  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total === 0) return null;

  const target = (Math.abs(seed) % total) + 1;
  let cumulative = 0;
  for (const [move, weight] of entries) {
    cumulative += weight;
    if (target <= cumulative) return move;
  }
  return entries[entries.length - 1][0];
}

// ─── Compute player effects for a given move ─────────────────────────────────

function computePlayerEffects(
  moveType: RivalMoveType,
  rival: RivalStartup,
  ctx: RivalMoveContext
): RivalEventEffect {
  const aggFactor = rival.founder.aggression / 100;

  // Defense multipliers
  const trustDefense = ctx.playerTrust > 60 ? 0.7 : 1.0;
  const revenueDefense = ctx.playerRevenue > 20000 ? 0.5 : 1.0;
  const brandRiskAmplifier = ctx.playerBrandRisk > 50 ? 1.3 : 1.0;

  const apply = (base: number, defenseMultiplier = 1.0): number =>
    Math.round(base * aggFactor * defenseMultiplier * brandRiskAmplifier);

  switch (moveType) {
    case "launch_beta":
      return { userGrowthDelta: -apply(80), socialHypeDelta: -apply(4, trustDefense) };

    case "raise_round":
      return {
        investorScoreDelta: -apply(3, revenueDefense),
        socialHypeDelta: -apply(3, trustDefense),
        brandRiskDelta: apply(3),
      };

    case "ship_feature":
      return {
        userGrowthDelta: -apply(60),
        revenueDelta: -apply(1200, revenueDefense),
      };

    case "copy_positioning":
      return {
        socialHypeDelta: -apply(5, trustDefense),
        brandRiskDelta: apply(4),
        userGrowthDelta: -apply(50),
      };

    case "poach_attention":
      return {
        socialHypeDelta: -apply(6, trustDefense),
        brandRiskDelta: apply(3),
      };

    case "price_war":
      return {
        revenueDelta: -apply(2000, revenueDefense),
        userGrowthDelta: -apply(100, revenueDefense),
        investorScoreDelta: -apply(2, revenueDefense),
      };

    case "enterprise_push":
      return {
        revenueDelta: -apply(1500, revenueDefense),
        investorScoreDelta: -apply(2, revenueDefense),
      };

    case "viral_campaign":
      return {
        socialHypeDelta: -apply(7, trustDefense),
        userGrowthDelta: -apply(120),
      };

    case "founder_callout":
      return {
        socialTrustDelta: -apply(5, trustDefense),
        brandRiskDelta: apply(8, brandRiskAmplifier > 1 ? 1.5 : 1.0),
        socialHypeDelta: -apply(3, trustDefense),
      };

    case "security_fumble":
      // Rival hurts themselves; player benefits
      return {
        revenueDelta: apply(1500),
        userGrowthDelta: apply(80),
        socialTrustDelta: apply(3),
      };

    case "compliance_win":
      return {
        investorScoreDelta: -apply(2, revenueDefense),
      };

    case "partnership_announcement":
      return {
        investorScoreDelta: -apply(2, revenueDefense),
        socialHypeDelta: -apply(3, trustDefense),
      };

    case "customer_poach":
      return {
        revenueDelta: -apply(1800, revenueDefense),
        userGrowthDelta: -apply(80),
      };

    case "market_narrative_shift":
      return {
        socialTrustDelta: -apply(4, trustDefense),
        brandRiskDelta: apply(4),
        investorScoreDelta: -apply(1, revenueDefense),
      };

    default:
      return {};
  }
}

// ─── Compute rival's own internal stat changes ────────────────────────────────

function computeRivalEffects(moveType: RivalMoveType): RivalEventEffect {
  switch (moveType) {
    case "launch_beta":         return { rivalTractionDelta: 8, rivalHypeDelta: 6 };
    case "raise_round":         return { rivalTractionDelta: 5, rivalHypeDelta: 8 };
    case "ship_feature":        return { rivalTractionDelta: 10 };
    case "copy_positioning":    return { rivalTractionDelta: 5, rivalHypeDelta: 3 };
    case "poach_attention":     return { rivalHypeDelta: 10 };
    case "price_war":           return { rivalTractionDelta: 6, rivalHypeDelta: 2 };
    case "enterprise_push":     return { rivalTractionDelta: 8 };
    case "viral_campaign":      return { rivalHypeDelta: 15, rivalTractionDelta: 4 };
    case "founder_callout":     return { rivalHypeDelta: 8 };
    case "security_fumble":     return { rivalTractionDelta: -12, rivalHypeDelta: -8 };
    case "compliance_win":      return { rivalTractionDelta: 7 };
    case "partnership_announcement": return { rivalTractionDelta: 9, rivalHypeDelta: 6 };
    case "customer_poach":      return { rivalTractionDelta: 10 };
    case "market_narrative_shift": return { rivalHypeDelta: 7, rivalTractionDelta: 3 };
    default: return {};
  }
}

// ─── Move severity classification ─────────────────────────────────────────────

function moveSeverity(
  moveType: RivalMoveType,
  playerEffects: RivalEventEffect
): "positive" | "neutral" | "warning" | "critical" {
  if (moveType === "security_fumble") return "positive";
  const negativeImpact = Math.abs(playerEffects.revenueDelta ?? 0) / 1000 +
    Math.abs(playerEffects.investorScoreDelta ?? 0) * 2 +
    Math.abs(playerEffects.brandRiskDelta ?? 0) +
    Math.abs(playerEffects.socialTrustDelta ?? 0) * 2;
  if (negativeImpact > 12) return "critical";
  if (negativeImpact > 5)  return "warning";
  if (negativeImpact > 0)  return "neutral";
  return "positive";
}

// ─── Build move description text ──────────────────────────────────────────────

let _moveSeq = 0;
function moveId(): string { return `move-${Date.now()}-${++_moveSeq}`; }

function buildMoveText(
  moveType: RivalMoveType,
  rival: RivalStartup,
  seed: number
): { title: string; description: string } {
  const pool = MOVE_CONTENT[moveType];
  if (!pool) {
    return {
      title: `${rival.name} made a move`,
      description: `${rival.founder.name} made a strategic play in month ${rival.latestMoveMonth}.`,
    };
  }
  const rawTitle = pick(pool.titles, seed);
  const rawBody = pick(pool.bodies, seed + 1);
  const replace = (s: string) =>
    s.replace(/\{rival\}/g, rival.name)
     .replace(/\{founderName\}/g, rival.founder.name);
  return { title: replace(rawTitle), description: replace(rawBody) };
}

// ─── Check if rival makes a move this month ──────────────────────────────────
// Each rival has a ~60% chance per month, weighted by aggression.

function shouldMakeMove(rival: RivalStartup, month: number, seed: number): boolean {
  if (rival.isDefeated) return false;
  if (rival.latestMoveMonth === month) return false; // already moved this month

  // Aggression-gated probability: 40% base + up to 35% from aggression
  const probability = 40 + Math.floor(rival.founder.aggression * 0.35);
  return (Math.abs(seed) % 100) < probability;
}

// ─── Apply rival monthly stat changes ────────────────────────────────────────

function applyRivalEffectsToSelf(rival: RivalStartup, effects: RivalEventEffect): RivalStartup {
  return {
    ...rival,
    traction: clamp(rival.traction + (effects.rivalTractionDelta ?? 0)),
    hype: clamp(rival.hype + (effects.rivalHypeDelta ?? 0)),
    productProgress: clamp(rival.productProgress + 2), // organic monthly progress
  };
}

// ─── Passive monthly rivalry decay ───────────────────────────────────────────

function applyRivalDecay(rival: RivalStartup): RivalStartup {
  return {
    ...rival,
    hype: clamp(rival.hype * 0.9),
    rivalryScore: Math.max(0, rival.rivalryScore - 2), // rivalry cools if ignored
    relationshipToPlayer: rivalryScoreToRelationship(
      Math.max(0, rival.rivalryScore - 2),
      rival.isDefeated
    ),
  };
}

// ─── Aggregated monthly rivaleffect totals ────────────────────────────────────

function accumulateEffects(moves: RivalMove[]): RivalEventEffect {
  const acc: RivalEventEffect = {};
  for (const m of moves) {
    for (const [k, v] of Object.entries(m.playerEffects) as [keyof RivalEventEffect, number][]) {
      if (typeof v === "number") {
        (acc[k] as number) = ((acc[k] ?? 0) as number) + v;
      }
    }
  }
  return acc;
}

// ─── Main: apply all rival monthly moves ─────────────────────────────────────

export function applyRivalMoves(
  rivals: RivalStartup[],
  month: number,
  ctx: Omit<RivalMoveContext, "rival" | "month">
): ApplyRivalMovesResult {
  const moves: RivalMove[] = [];
  const updatedRivals: RivalStartup[] = [];

  for (const rival of rivals) {
    const moveSeed = rivalSeed(`${rival.id}-${month}`);

    if (!shouldMakeMove(rival, month, moveSeed)) {
      updatedRivals.push(applyRivalDecay(rival));
      continue;
    }

    const fullCtx: RivalMoveContext = { rival, month, ...ctx };
    const weights = buildMoveWeights(rival, fullCtx);
    const moveType = selectMove(weights, moveSeed + 13);

    if (!moveType) {
      updatedRivals.push(applyRivalDecay(rival));
      continue;
    }

    const playerEffects = computePlayerEffects(moveType, rival, fullCtx);
    const rivalEffects = computeRivalEffects(moveType);
    const severity = moveSeverity(moveType, playerEffects);
    const { title, description } = buildMoveText(moveType, rival, moveSeed + 7);

    // Rivalry score increases on aggressive moves
    const aggressiveMoves: RivalMoveType[] = [
      "founder_callout", "copy_positioning", "price_war", "customer_poach", "poach_attention",
    ];
    const rivalryIncrease = aggressiveMoves.includes(moveType) ? 8 : 3;

    const move: RivalMove = {
      id: moveId(),
      rivalId: rival.id,
      rivalName: rival.name,
      month,
      type: moveType,
      title,
      description,
      playerEffects,
      rivalEffects,
      severity,
      feedCategory: moveType === "security_fumble" ? "reaction" : "rival",
      tags: [rival.founder.archetype, moveType],
      targetedPlayerActionId: ctx.lastPlayerSocialActionId,
    };

    moves.push(move);

    const updatedRival = applyRivalEffectsToSelf(rival, rivalEffects);
    const newRivalryScore = clamp(updatedRival.rivalryScore + rivalryIncrease);

    updatedRivals.push({
      ...updatedRival,
      rivalryScore: newRivalryScore,
      relationshipToPlayer: rivalryScoreToRelationship(newRivalryScore, updatedRival.isDefeated),
      latestMoveMonth: month,
      latestMoveType: moveType,
      latestMoveTitle: title,
    });
  }

  const feedItems = generateRivalFeedItems(moves);
  const playerEffects = accumulateEffects(moves);

  return { rivalMoves: moves, updatedRivals, newFeedItems: feedItems, playerEffects };
}

// ─── Check counter-action availability for the player ────────────────────────

export function checkCounterActionAvailability(
  action: import("./types").RivalCounterAction,
  rivals: RivalStartup[],
  playerRevenue: number,
  playerProductProgress: number,
  playerTrust: number,
  playerCash: number
): { available: boolean; reason?: string; targetedRivalId?: string } {
  if (playerCash < action.cost) {
    return { available: false, reason: `Requires $${action.cost.toLocaleString()} cash.` };
  }
  if (action.requiredMinRevenue && playerRevenue < action.requiredMinRevenue) {
    return { available: false, reason: `Requires $${action.requiredMinRevenue.toLocaleString()}/mo revenue.` };
  }
  if (action.requiredMinProductProgress && playerProductProgress < action.requiredMinProductProgress) {
    return { available: false, reason: `Requires ${action.requiredMinProductProgress}% product progress.` };
  }
  if (action.requiredMinTrust && playerTrust < action.requiredMinTrust) {
    return { available: false, reason: `Requires trust score of ${action.requiredMinTrust}+.` };
  }

  // Find a rival that matches the archetype requirement and rivalryScore gate
  let targetedRivalId: string | undefined;
  if (action.countersArchetypes || action.requiredMinRivalryScore) {
    const target = rivals.find((r) => {
      if (r.isDefeated) return false;
      const archetypeMatch = !action.countersArchetypes || action.countersArchetypes.includes(r.founder.archetype);
      const rivalryMatch = !action.requiredMinRivalryScore || r.rivalryScore >= action.requiredMinRivalryScore;
      return archetypeMatch && rivalryMatch;
    });
    if (!target) {
      const reason = action.requiredMinRivalryScore
        ? `No rival has reached hostility level ${action.requiredMinRivalryScore} yet.`
        : "No matching rival to counter.";
      return { available: false, reason };
    }
    targetedRivalId = target.id;
  }

  return { available: true, targetedRivalId };
}
