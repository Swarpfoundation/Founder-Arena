import {
  SocialAction,
  SocialActionEffects,
  SocialContext,
  SocialMetrics,
} from "./types";

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

// ─── Apply a social action to the current metrics ────────────────────────────

export function applyActionToMetrics(
  metrics: SocialMetrics,
  action: SocialAction,
  ctx: SocialContext
): { updatedMetrics: SocialMetrics; appliedEffects: SocialActionEffects; didBackfire: boolean } {
  let effects: SocialActionEffects = { ...action.effects };
  let didBackfire = false;

  // Check backfire conditions
  if (action.backfireCondition) {
    const { condition, threshold, backfireEffects } = action.backfireCondition;
    let fires = false;
    switch (condition) {
      case "low_product_progress":
        fires = ctx.productProgress < threshold;
        break;
      case "low_trust":
        fires = metrics.trust < threshold;
        break;
      case "high_brand_risk":
        fires = metrics.brandRisk >= threshold;
        break;
      case "high_hype_low_trust":
        // fires when trust is below threshold AND hype is already elevated
        fires = metrics.trust < threshold && metrics.hype > 60;
        break;
    }
    if (fires) {
      effects = mergeEffects(effects, backfireEffects);
      didBackfire = true;
    }
  }

  const updated = applyEffectsToMetrics(metrics, effects);
  return { updatedMetrics: updated, appliedEffects: effects, didBackfire };
}

function mergeEffects(
  base: SocialActionEffects,
  extra: SocialActionEffects
): SocialActionEffects {
  return {
    followersDelta: (base.followersDelta ?? 0) + (extra.followersDelta ?? 0),
    hypeDelta: (base.hypeDelta ?? 0) + (extra.hypeDelta ?? 0),
    trustDelta: (base.trustDelta ?? 0) + (extra.trustDelta ?? 0),
    sentimentDelta: (base.sentimentDelta ?? 0) + (extra.sentimentDelta ?? 0),
    brandRiskDelta: (base.brandRiskDelta ?? 0) + (extra.brandRiskDelta ?? 0),
    viralMomentumDelta:
      (base.viralMomentumDelta ?? 0) + (extra.viralMomentumDelta ?? 0),
    founderReputationDelta:
      (base.founderReputationDelta ?? 0) + (extra.founderReputationDelta ?? 0),
    communityStrengthDelta:
      (base.communityStrengthDelta ?? 0) + (extra.communityStrengthDelta ?? 0),
    revenueDelta: (base.revenueDelta ?? 0) + (extra.revenueDelta ?? 0),
    investorDelta: (base.investorDelta ?? 0) + (extra.investorDelta ?? 0),
    riskDelta: (base.riskDelta ?? 0) + (extra.riskDelta ?? 0),
    userGrowthDelta:
      (base.userGrowthDelta ?? 0) + (extra.userGrowthDelta ?? 0),
    valuationDelta: (base.valuationDelta ?? 0) + (extra.valuationDelta ?? 0),
    moraleDelta: (base.moraleDelta ?? 0) + (extra.moraleDelta ?? 0),
  };
}

function applyEffectsToMetrics(
  m: SocialMetrics,
  e: SocialActionEffects
): SocialMetrics {
  return {
    followers: Math.max(0, m.followers + (e.followersDelta ?? 0)),
    hype: clamp(m.hype + (e.hypeDelta ?? 0)),
    trust: clamp(m.trust + (e.trustDelta ?? 0)),
    sentiment: clamp(m.sentiment + (e.sentimentDelta ?? 0)),
    brandRisk: clamp(m.brandRisk + (e.brandRiskDelta ?? 0)),
    viralMomentum: clamp(m.viralMomentum + (e.viralMomentumDelta ?? 0)),
    founderReputation: clamp(m.founderReputation + (e.founderReputationDelta ?? 0)),
    communityStrength: clamp(m.communityStrength + (e.communityStrengthDelta ?? 0)),
  };
}

// ─── Monthly passive decay ────────────────────────────────────────────────────

export function applyMonthlyDecay(metrics: SocialMetrics): SocialMetrics {
  // Hype fades quickly without reinforcement.
  const hype = clamp(metrics.hype * 0.85);
  // Viral momentum collapses fast.
  const viralMomentum = clamp(metrics.viralMomentum * 0.65);
  // Brand risk slowly heals.
  const brandRisk = clamp(Math.max(0, metrics.brandRisk - 4));
  // Trust is stable but drifts slightly toward centre without positive actions.
  const trust = clamp(metrics.trust - 1);
  // Sentiment drifts toward 50.
  const sentiment = clamp(
    metrics.sentiment + (metrics.sentiment > 50 ? -2 : metrics.sentiment < 50 ? 2 : 0)
  );
  // Community strength decays slowly.
  const communityStrength = clamp(metrics.communityStrength - 1);
  // Founder reputation is sticky — minimal decay.
  const founderReputation = metrics.founderReputation;
  // Followers never decrease organically.
  const followers = metrics.followers;

  return {
    followers,
    hype,
    trust,
    sentiment,
    brandRisk,
    viralMomentum,
    founderReputation,
    communityStrength,
  };
}

// ─── Passive brand-risk escalation rule ──────────────────────────────────────
// Called each month BEFORE decay — catches situations where no action was taken
// but underlying tension means the risk still compounds.

export function applyPassiveBrandRiskRules(
  metrics: SocialMetrics
): SocialMetrics {
  let { brandRisk } = metrics;

  // High hype + low trust is a ticking clock.
  if (metrics.hype > 70 && metrics.trust < 35) {
    brandRisk = clamp(brandRisk + 6);
  }

  return { ...metrics, brandRisk };
}

// ─── Derive simulation modifiers from current social state ───────────────────
// Returns conservative deltas applied to the monthly simulation result.
// All values are intentionally modest to avoid breaking existing game balance.

export interface SocialSimModifiers {
  revenueDelta: number;
  investorDelta: number;
  riskDelta: number;
  userGrowthDelta: number;
  valuationDelta: number;
}

export function deriveSocialSimModifiers(
  metrics: SocialMetrics
): SocialSimModifiers {
  let revenueDelta = 0;
  let investorDelta = 0;
  let riskDelta = 0;
  let userGrowthDelta = 0;
  let valuationDelta = 0;

  // Viral momentum drives top-of-funnel.
  if (metrics.viralMomentum > 40) {
    revenueDelta += 2500;
    userGrowthDelta += 400;
  }
  if (metrics.viralMomentum > 70) {
    revenueDelta += 2000;
    userGrowthDelta += 300;
    valuationDelta += 50000;
  }

  // Trust softens risk.
  if (metrics.trust > 70) {
    riskDelta -= 3;
  }

  // High hype + reasonable trust: investor and revenue bump.
  if (metrics.hype > 60 && metrics.trust > 50) {
    investorDelta += 2;
    revenueDelta += 1500;
  }

  // Brand risk worsens operating risk.
  if (metrics.brandRisk > 60) {
    riskDelta += 5;
  }
  if (metrics.brandRisk > 80) {
    riskDelta += 5;
    investorDelta -= 3;
  }

  // Founder reputation boosts investor confidence.
  if (metrics.founderReputation > 60) {
    investorDelta += 3;
  }

  // Community strength generates organic revenue.
  if (metrics.communityStrength > 50) {
    revenueDelta += 2000;
    userGrowthDelta += 150;
  }

  // Follower base contributes a modest multiplier.
  if (metrics.followers > 5000) {
    revenueDelta += 1000;
  }

  return { revenueDelta, investorDelta, riskDelta, userGrowthDelta, valuationDelta };
}

// ─── Check availability of an action ────────────────────────────────────────

export function checkActionAvailability(
  action: SocialAction,
  metrics: SocialMetrics,
  ctx: SocialContext,
  lastActionMonth: number
): { available: boolean; reason?: string; backfireWarning?: string } {
  // 1-per-month gate
  if (lastActionMonth >= ctx.month) {
    return {
      available: false,
      reason: `Already used a social action this sprint (Week ${ctx.month}).`,
    };
  }

  // Status gate
  if (action.requiredStatus && !action.requiredStatus.includes(ctx.status)) {
    return {
      available: false,
      reason: `Requires startup to be ${action.requiredStatus.join(" or ")}.`,
    };
  }

  // Product progress gate
  if (
    action.requiredProductProgress !== undefined &&
    ctx.productProgress < action.requiredProductProgress
  ) {
    return {
      available: false,
      reason: `Requires ${action.requiredProductProgress}% product progress (currently ${ctx.productProgress}%).`,
    };
  }

  // Revenue gate
  if (
    action.requiredMinRevenue !== undefined &&
    ctx.revenue < action.requiredMinRevenue
  ) {
    return {
      available: false,
      reason: `Requires $${action.requiredMinRevenue.toLocaleString()} monthly revenue.`,
    };
  }

  // Follower gate
  if (
    action.requiredMinFollowers !== undefined &&
    metrics.followers < action.requiredMinFollowers
  ) {
    return {
      available: false,
      reason: `Requires ${action.requiredMinFollowers.toLocaleString()} followers.`,
    };
  }

  // Brand risk gates
  if (
    action.requiredBrandRiskAbove !== undefined &&
    metrics.brandRisk < action.requiredBrandRiskAbove
  ) {
    return {
      available: false,
      reason: `Only available when brand risk is ${action.requiredBrandRiskAbove}+ (currently ${metrics.brandRisk}).`,
    };
  }
  if (
    action.requiredBrandRiskBelow !== undefined &&
    metrics.brandRisk >= action.requiredBrandRiskBelow
  ) {
    return {
      available: false,
      reason: `Not available when brand risk is ${action.requiredBrandRiskBelow}+ (currently ${metrics.brandRisk}).`,
    };
  }

  // Detect backfire warning (action is available but risky)
  let backfireWarning: string | undefined;
  if (action.backfireCondition) {
    const { condition, threshold, warningText } = action.backfireCondition;
    let wouldFire = false;
    switch (condition) {
      case "low_product_progress":
        wouldFire = ctx.productProgress < threshold;
        break;
      case "low_trust":
        wouldFire = metrics.trust < threshold;
        break;
      case "high_brand_risk":
        wouldFire = metrics.brandRisk >= threshold;
        break;
      case "high_hype_low_trust":
        wouldFire = metrics.trust < threshold && metrics.hype > 60;
        break;
    }
    if (wouldFire) {
      backfireWarning = warningText;
    }
  }

  return { available: true, backfireWarning };
}
