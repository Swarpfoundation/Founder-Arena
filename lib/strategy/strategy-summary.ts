import type {
  FounderPlaystyle,
  StrategySignal,
  StrategyState,
  FounderArchetypeSummary,
} from "./types";
import { PLAYSTYLE_META } from "./strategy-catalog";

// ─── Archetype narrative table ────────────────────────────────────────────────

const ARCHETYPE_NARRATIVES: Record<FounderPlaystyle, {
  won: string;
  lost: string;
}> = {
  product_led: {
    won:  "You played as a Product-Led Founder: relentless shipping and customer obsession drove sustainable growth.",
    lost: "You played as a Product-Led Founder, but the product alone wasn't enough to survive the full run.",
  },
  enterprise_sales: {
    won:  "You built an Enterprise Sales Machine: direct deals, long cycles, but the revenue held the company together.",
    lost: "You ran an Enterprise Sales playbook — the burn was high and the cycles long. The runway didn't hold.",
  },
  regulated_operator: {
    won:  "You played as a Regulated Operator: slower growth, but the trust moat and compliance edge proved durable.",
    lost: "You operated as a Regulated Founder, but compliance alone couldn't outpace the headwinds.",
  },
  technical_builder: {
    won:  "You built a Technical Moat: engineering speed and security became your competitive edge.",
    lost: "You focused on the technical moat, but the product and revenue didn't compound fast enough.",
  },
  hype_machine: {
    won:  "You ran as a Hype Machine: viral reach drove valuation, and the brand survived the brand risk pressure.",
    lost: "You became a Hype Machine — the hype grew, but brand risk and rival retaliation eventually caught up.",
  },
  cockroach: {
    won:  "You played Cockroach Mode: low burn, brutal survival instincts, and default-alive discipline carried the run.",
    lost: "You survived as a Cockroach Founder — frugal and resilient — but the market demanded more aggression.",
  },
  community_led: {
    won:  "You built Community-Led Growth: trust converted to loyalty, and loyalty converted to a durable business.",
    lost: "You built community first, but enterprise revenue and investor momentum didn't materialize fast enough.",
  },
  rival_killer: {
    won:  "You became a Rival Killer: aggressive counter-plays and public confrontations defined your arena reputation.",
    lost: "You played as a Rival Killer, but the rivalryScore escalated beyond what the brand could withstand.",
  },
  capital_blitzscaler: {
    won:  "You blitzscaled with capital: fundraising momentum compounded into a dominant valuation position.",
    lost: "You chased capital blitzscaling, but the burn and board pressure eroded the company's foundation.",
  },
  trust_builder: {
    won:  "You played Trust & Transparency: slow but compounding credibility gave you an armor others couldn't buy.",
    lost: "You built trust and transparency, but the growth was too slow to outpace competitive and market pressure.",
  },
};

// ─── Generator ────────────────────────────────────────────────────────────────

export function generateArchetypeSummary(
  signals: StrategySignal[],
  state: StrategyState,
  gameCtx: {
    productProgress: number;
    revenue: number;
    outcome?: string;
    finalScore?: number;
  }
): FounderArchetypeSummary {
  const dominant = state.dominantPlaystyle;
  const secondary = state.secondaryPlaystyles[0] ?? null;

  const dominated = dominant !== null;
  const isWin = !!gameCtx.outcome && !["HIGH_RISK_FAILURE", "DEAD"].includes(gameCtx.outcome);

  const title = dominated
    ? PLAYSTYLE_META[dominant].title
    : "Undetermined Archetype";

  const description = dominated
    ? PLAYSTYLE_META[dominant].description
    : "Your strategy is still taking shape. Keep making choices to unlock a founder archetype.";

  const strongestSynergy = state.activeSynergies[0]?.title ?? null;
  const weakestArea = findWeakestArea(state, signals);

  const strengths = dominated
    ? PLAYSTYLE_META[dominant].strengths
    : ["Flexible — no dominant strategy locked in yet"];

  const weaknesses = dominated
    ? PLAYSTYLE_META[dominant].tradeoffs
    : ["No dominant strategy detected"];

  let finalRunNarrative: string;
  if (!dominated) {
    finalRunNarrative =
      "You played a generalist run with no dominant archetype. Every playstyle stayed dormant.";
  } else {
    const narrativeSet = ARCHETYPE_NARRATIVES[dominant];
    finalRunNarrative = isWin ? narrativeSet.won : narrativeSet.lost;
    if (secondary) {
      finalRunNarrative += ` Secondary: ${PLAYSTYLE_META[secondary].title}.`;
    }
    if (strongestSynergy) {
      finalRunNarrative += ` Strongest synergy: ${strongestSynergy}.`;
    }
    if (weakestArea) {
      finalRunNarrative += ` Biggest gap: ${weakestArea}.`;
    }
  }

  return {
    title,
    description,
    dominantPlaystyle: dominant,
    secondaryPlaystyle: secondary,
    strengths,
    weaknesses,
    finalRunNarrative,
  };
}

function findWeakestArea(
  state: StrategyState,
  signals: StrategySignal[]
): string | null {
  if (signals.length === 0) return null;

  // The weakest area is the playstyle with the lowest progress among those
  // the player at least somewhat engaged with (progress ≥ 10 but not dominant).
  const candidates = state.stacks.filter(
    (s) =>
      s.playstyle !== state.dominantPlaystyle &&
      s.progress >= 10 &&
      s.progress < 50
  );
  if (candidates.length === 0) return null;
  const weakest = candidates.reduce((a, b) => (a.progress < b.progress ? a : b));
  return weakest.title;
}
