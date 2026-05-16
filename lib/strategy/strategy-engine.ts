import type {
  FounderPlaystyle,
  StrategyLevel,
  StrategySignal,
  StrategyStack,
  StrategySynergy,
  StrategyState,
  ComputeStrategyContext,
} from "./types";
import { PLAYSTYLE_META, SYNERGY_CATALOG, getSynergiesForPlaystyle } from "./strategy-catalog";

// ─── Progress thresholds ──────────────────────────────────────────────────────
//   0–24   dormant
//  25–49   emerging
//  50–74   active
//  75–100  dominant

export function computeLevel(progress: number): StrategyLevel {
  if (progress >= 75) return "dominant";
  if (progress >= 50) return "active";
  if (progress >= 25) return "emerging";
  return "dormant";
}

export function computeStackProgress(
  playstyle: FounderPlaystyle,
  signals: StrategySignal[]
): number {
  const total = signals
    .filter((s) => s.playstyle === playstyle)
    .reduce((sum, s) => sum + s.weight, 0);
  return Math.min(100, total);
}

// ─── Synergy activation ───────────────────────────────────────────────────────

function getActiveSynergies(
  playstyle: FounderPlaystyle,
  level: StrategyLevel
): StrategySynergy[] {
  if (level === "dormant" || level === "emerging") return [];
  return getSynergiesForPlaystyle(playstyle).filter((s) => {
    if (s.unlockLevel === "active" && (level === "active" || level === "dominant")) return true;
    if (s.unlockLevel === "dominant" && level === "dominant") return true;
    return false;
  });
}

// ─── Full strategy state ──────────────────────────────────────────────────────

const ALL_PLAYSTYLES: FounderPlaystyle[] = [
  "product_led",
  "enterprise_sales",
  "regulated_operator",
  "technical_builder",
  "hype_machine",
  "cockroach",
  "community_led",
  "rival_killer",
  "capital_blitzscaler",
  "trust_builder",
];

export function computeStrategyState(
  signals: StrategySignal[],
  ctx: ComputeStrategyContext
): StrategyState {
  // Build stacks
  const stacks: StrategyStack[] = ALL_PLAYSTYLES.map((playstyle) => {
    const meta = PLAYSTYLE_META[playstyle];
    const progress = computeStackProgress(playstyle, signals);
    const level = computeLevel(progress);
    const active = level === "active" || level === "dominant";
    const allSynergies = getSynergiesForPlaystyle(playstyle);
    const activeSynergies = getActiveSynergies(playstyle, level);
    const recentSignals = signals
      .filter((s) => s.playstyle === playstyle)
      .slice(-5)
      .reverse();

    return {
      playstyle,
      title: meta.title,
      description: meta.description,
      progress,
      level,
      active,
      synergies: allSynergies,
      activeSynergies,
      recentSignals,
      strengths: meta.strengths,
      tradeoffs: meta.tradeoffs,
    };
  });

  // Sort by progress descending
  stacks.sort((a, b) => b.progress - a.progress);

  // Dominant = highest progress at ≥50
  const dominantStack = stacks.find((s) => s.level === "active" || s.level === "dominant") ?? null;
  const dominantPlaystyle = dominantStack?.playstyle ?? null;

  // Secondary = other stacks at ≥25 (up to 2)
  const secondaryPlaystyles: FounderPlaystyle[] = stacks
    .filter((s) => s.playstyle !== dominantPlaystyle && (s.level === "emerging" || s.level === "active" || s.level === "dominant"))
    .slice(0, 2)
    .map((s) => s.playstyle);

  // Active synergies from all active/dominant stacks
  const activeSynergies = stacks
    .filter((s) => s.active)
    .flatMap((s) => s.activeSynergies);

  const warnings = computeWarnings(stacks, signals, ctx);
  const recommendations = computeRecommendations(stacks, signals, ctx);

  return {
    dominantPlaystyle,
    secondaryPlaystyles,
    stacks,
    activeSynergies,
    warnings,
    recommendations,
    totalSignals: signals.length,
  };
}

// ─── Warnings ─────────────────────────────────────────────────────────────────

function computeWarnings(
  stacks: StrategyStack[],
  signals: StrategySignal[],
  ctx: ComputeStrategyContext
): string[] {
  const warnings: string[] = [];

  const getStack = (p: FounderPlaystyle) => stacks.find((s) => s.playstyle === p);

  const hypeProg    = getStack("hype_machine")?.progress ?? 0;
  const cockProg    = getStack("cockroach")?.progress ?? 0;
  const capitalProg = getStack("capital_blitzscaler")?.progress ?? 0;
  const rivalProg   = getStack("rival_killer")?.progress ?? 0;
  const productProg = getStack("product_led")?.progress ?? 0;

  // Hype outpacing product
  if (hypeProg >= 50 && ctx.productProgress < 50) {
    warnings.push(
      "Hype is outpacing product. Backlash risk rising — strengthen product before next announcement."
    );
  }

  // Hype + high brand risk
  if (hypeProg >= 50 && ctx.brandRisk > 60) {
    warnings.push(
      "Brand risk critical. Hype without trust is dangerous — consider a transparency post or crisis response."
    );
  }

  // Conflicting: Cockroach + Hype Machine
  if (cockProg >= 25 && hypeProg >= 25) {
    warnings.push(
      "Conflicting strategies: Cockroach and Hype Machine pull in opposite directions."
    );
  }

  // Conflicting: Cockroach + Capital Blitzscaler
  if (cockProg >= 25 && capitalProg >= 25) {
    warnings.push(
      "Conflicting strategies: Cockroach Founder and Capital Blitzscaler cannot coexist effectively."
    );
  }

  // Rival Killer + high rivalry
  if (rivalProg >= 50 && ctx.rivalryMaxScore > 60) {
    warnings.push(
      "Rival Killer strategy has escalated rivalry. Rivals are retaliating harder — watch for aggressive moves."
    );
  }

  // Rival Killer + low trust
  if (rivalProg >= 50 && ctx.socialTrust < 35) {
    warnings.push(
      "Rival Killer approach with low trust: public attacks may backfire without credibility to back them up."
    );
  }

  // Low product + launch heavy
  const launchSignals = signals.filter(
    (s) => s.tags.includes("launch_announcement") || s.tags.includes("launch_beta")
  );
  if (launchSignals.length >= 2 && ctx.productProgress < 60) {
    warnings.push(
      "Multiple launch actions with low product progress. Continued launches risk eroding credibility."
    );
  }

  // Hype Machine dominant + no product_led support
  if (hypeProg >= 75 && productProg < 25) {
    warnings.push(
      "Dominant Hype Machine with no product-led foundation. Rivals will exploit the product gap."
    );
  }

  return warnings;
}

// ─── Recommendations ──────────────────────────────────────────────────────────

function computeRecommendations(
  stacks: StrategyStack[],
  _signals: StrategySignal[],
  ctx: ComputeStrategyContext
): string[] {
  const recs: string[] = [];

  const getStack = (p: FounderPlaystyle) => stacks.find((s) => s.playstyle === p);

  const dominantStack = stacks.find((s) => s.level === "dominant" || s.level === "active") ?? null;
  const dominantProg  = dominantStack?.progress ?? 0;
  const dom           = dominantStack?.playstyle;

  // Progress toward next synergy
  if (dom === "product_led" && dominantProg >= 40 && dominantProg < 50) {
    recs.push('One more product/customer action unlocks "PMF Sprint" — product progress will improve each month.');
  }
  if (dom === "hype_machine" && dominantProg >= 40 && dominantProg < 50) {
    recs.push('A competitor callout or launch announcement will unlock "Viral Loop" — user growth spikes become possible.');
  }
  if (dom === "regulated_operator" && dominantProg >= 40 && dominantProg < 50) {
    recs.push('One more compliance or security action unlocks "Trust Moat" — risk events will hurt less.');
  }
  if (dom === "cockroach" && dominantProg >= 40 && dominantProg < 50) {
    recs.push('Another cost-cutting action unlocks "Runway Discipline" — burn reductions become stronger.');
  }
  if (dom === "rival_killer" && dominantProg >= 40 && dominantProg < 50) {
    recs.push('One more counter-action or competitor callout unlocks "Arena Predator" — your counter-actions become stronger.');
  }
  if (dom === "community_led" && dominantProg >= 40 && dominantProg < 50) {
    recs.push('A customer testimonial campaign or transparency post will unlock "Community Flywheel" — trust converts to user growth.');
  }

  // Context-based recommendations
  if (ctx.brandRisk > 50 && !recs.some((r) => r.includes("transparency"))) {
    recs.push("High brand risk: a Founder Transparency Post would reduce brand risk and build trust simultaneously.");
  }
  if (ctx.productProgress < 40 && !recs.some((r) => r.includes("product"))) {
    recs.push("Product progress is low: Product Focus or Customer Interviews will strengthen your foundation.");
  }

  // Enterprise + low revenue
  const enterpriseProg = getStack("enterprise_sales")?.progress ?? 0;
  if (enterpriseProg >= 25 && ctx.revenue < 15000) {
    recs.push(
      "Enterprise Sales is emerging — an Enterprise Sales Push or Customer Testimonial Campaign would accelerate revenue."
    );
  }

  // Technical builder + no CTO
  const techProg = getStack("technical_builder")?.progress ?? 0;
  if (techProg >= 25 && ctx.productProgress < 60) {
    recs.push(
      "Technical Moat strategy is emerging — a CTO or AI Engineer hire would accelerate product velocity."
    );
  }

  // Rival killer recommendations
  const rivalProg = getStack("rival_killer")?.progress ?? 0;
  if (rivalProg >= 25 && ctx.rivalryMaxScore > 30) {
    recs.push(
      "Rival Killer strategy active — a Counter-Positioning Thread or Customer Proof Campaign would strengthen your position."
    );
  }

  return recs.slice(0, 4);
}
