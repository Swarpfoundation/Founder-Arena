import type {
  DocumentaryEngineInput,
  DocumentaryTone,
  DocumentaryGenre,
  FounderDocumentary,
  FounderDocumentaryChapter,
  ChapterCategory,
  DocumentaryHeroStats,
  DocumentaryRivalSummary,
  DocumentarySocialSummary,
  DocumentaryStrategySummary,
  DocumentaryCareerImpactSummary,
} from "./types";
import { buildTimeline } from "./documentary-timeline";
import { buildShareCard } from "./documentary-share-card";

// ─── Deterministic hash ───────────────────────────────────────────────────────

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash;
}

function pickFrom<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// ─── Outcome helpers ──────────────────────────────────────────────────────────

export const WIN_OUTCOMES = new Set([
  "BREAKOUT",
  "SERIES_A_READY",
  "ACQUISITION_TARGET",
  "ACQUISITION",
  "ACQUIHIRE",
  "SMALL_PROFITABLE",
  "SEED_READY",
]);

export const DEAD_OUTCOMES = new Set(["HIGH_RISK_FAILURE", "DEAD"]);

// ─── Playstyle display names ──────────────────────────────────────────────────

export const PLAYSTYLE_DISPLAY: Record<string, string> = {
  product_led: "Product-Led",
  enterprise_sales: "Enterprise Closer",
  regulated_operator: "Regulated Operator",
  technical_builder: "Technical Builder",
  hype_machine: "Hype Machine",
  cockroach: "Cockroach",
  community_led: "Community-Led",
  rival_killer: "Rival Killer",
  capital_blitzscaler: "Capital Blitzscaler",
  trust_builder: "Trust Builder",
};

export function displayPlaystyle(key: string | null): string | null {
  if (!key) return null;
  return PLAYSTYLE_DISPLAY[key] ?? key;
}

// ─── Tone selection ───────────────────────────────────────────────────────────

export function selectTone(
  outcome: string,
  monthsSurvived: number,
  finalScore: number,
  playstyle: string | null,
  anyRivalDefeated: boolean,
  noRivalsDefeated: boolean,
  riskScore: number | null
): DocumentaryTone {
  if (outcome === "BREAKOUT") return finalScore >= 700 ? "triumphant" : "underdog";
  if (outcome === "ACQUISITION" || outcome === "ACQUIHIRE") return "legendary";
  if (outcome === "SERIES_A_READY") return "triumphant";
  if (DEAD_OUTCOMES.has(outcome) || outcome === "DEAD") {
    if (noRivalsDefeated && anyRivalDefeated === false) return "tragic";
    if ((riskScore ?? 0) >= 85) return "cautionary";
    if (monthsSurvived >= 9) return "gritty";
    return "cautionary";
  }
  if (playstyle === "hype_machine") return "chaotic";
  if (playstyle === "regulated_operator") return "satirical";
  if (monthsSurvived >= 10) return "gritty";
  return "cautionary";
}

// ─── Genre selection ──────────────────────────────────────────────────────────

export function selectGenre(
  outcome: string,
  hasRivals: boolean,
  monthsSurvived: number
): DocumentaryGenre {
  if (outcome === "BREAKOUT" || outcome === "SERIES_A_READY") {
    return hasRivals ? "arena_highlight" : "founder_memoir";
  }
  if (outcome === "ACQUISITION" || outcome === "ACQUIHIRE") return "investor_case_study";
  if (DEAD_OUTCOMES.has(outcome) || outcome === "DEAD") {
    return monthsSurvived >= 9 ? "founder_memoir" : "startup_true_crime";
  }
  if (hasRivals && WIN_OUTCOMES.has(outcome)) return "comeback_story";
  return "cautionary_tale";
}

// ─── Title pools ──────────────────────────────────────────────────────────────

const TITLE_POOLS: Record<string, string[]> = {
  BREAKOUT: [
    "The {months}-Month Breakout",
    "How {name} Took the Arena",
    "From Pitch Deck to Power Move",
    "Built Different, Scaled Faster",
  ],
  SERIES_A_READY: [
    "Series A Territory",
    "The {name} Thesis Proved",
    "Ready for the Next Round",
    "Institutional Grade",
  ],
  ACQUISITION: [
    "The Exit Before the Storm",
    "Bought Before Breakout",
    "The Deal That Ended the Fight",
  ],
  ACQUIHIRE: [
    "The Talent Was the Asset",
    "The Exit on the Table",
    "Acquihired: Talent Wins",
  ],
  ACQUISITION_TARGET: [
    "A Price Was Discussed",
    "The {sector} Acquisition Target",
    "Exit Conversations",
  ],
  HIGH_RISK_FAILURE: [
    "The Runway Went Dark",
    "Maximum Exposure",
    "When the Risk Score Peaked",
    "Death by Risk",
  ],
  DEAD: [
    "The Runway Went Dark",
    "A Beautiful Deck, A Brutal Burn",
    "Death by Month {months}",
    "Lessons from the Graveyard",
    "The {sector} Experiment That Wasn't",
  ],
  ZOMBIE: [
    "Neither Dead Nor Growing",
    "The Long Crawl",
    "Alive, Just Not Winning",
  ],
  SEED_READY: [
    "The Seed Story",
    "Early and Promising",
    "{name}: Ready to Raise",
  ],
  SMALL_PROFITABLE: [
    "Small, Profitable, and Standing",
    "The {sector} Cockroach",
    "Sustainable Before Scaling",
  ],
  DEFAULT: [
    "The {name} Run",
    "{name}: A Founder Story",
    "The {sector} Play",
  ],
};

export function buildTitle(
  outcome: string,
  startupName: string,
  sector: string,
  monthsSurvived: number,
  seed: number
): string {
  const pool = TITLE_POOLS[outcome] ?? TITLE_POOLS.DEFAULT;
  const template = pickFrom(pool, seed);
  return template
    .replace("{name}", startupName)
    .replace("{sector}", sector)
    .replace("{months}", String(monthsSurvived));
}

// ─── Taglines ─────────────────────────────────────────────────────────────────

const TAGLINE_POOLS: Record<DocumentaryTone, string[]> = {
  triumphant: [
    "The execution matched the ambition.",
    "Built for this. Proved it.",
    "The market gave a signal. The team amplified it.",
  ],
  underdog: [
    "Nobody gave it a chance. The numbers disagreed.",
    "Outgunned. Not outbuilt.",
    "Small team. Bigger result.",
  ],
  legendary: [
    "The exit was earned.",
    "Some runs end at the right price.",
    "The acquirer saw what the market hadn't priced yet.",
  ],
  chaotic: [
    "Hype got us in the room. Product got us out.",
    "Loud, fast, and not entirely wrong.",
    "The narrative was ahead of the metrics. Until it wasn't.",
  ],
  gritty: [
    "It wasn't pretty. It was real.",
    "Every month was a decision.",
    "No shortcuts. Just months.",
  ],
  tragic: [
    "The rival arrived. The runway didn't last.",
    "The right product in the wrong fight.",
    "The arena has survivors. This was not one.",
  ],
  cautionary: [
    "The signals were there early.",
    "Risk was priced incorrectly from the start.",
    "Some lessons only come from the graveyard.",
  ],
  satirical: [
    "Compliance was the moat. Until it wasn't enough.",
    "Slow was the speed. Clean was the cost.",
    "Regulators respected us. The market wasn't sure.",
  ],
};

export function buildTagline(tone: DocumentaryTone, seed: number): string {
  const pool = TAGLINE_POOLS[tone];
  return pickFrom(pool, seed + 3);
}

// ─── Chapter builders ─────────────────────────────────────────────────────────

function chapter(
  id: string,
  title: string,
  body: string,
  category: ChapterCategory,
  tags: string[]
): FounderDocumentaryChapter {
  return { id, title, body, category, tags };
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "..." : s;
}

function buildOriginChapter(input: DocumentaryEngineInput): FounderDocumentaryChapter {
  const { startup } = input;
  const problem = truncate(startup.problem, 120);
  const solution = truncate(startup.solution, 120);

  const capitalLine =
    startup.fundingRounds.length === 0
      ? "The team entered the arena without external capital."
      : `Funding ask: $${startup.fundingAsk.toLocaleString()}.`;

  const body =
    `${startup.name} launched in the ${startup.sector} sector, targeting ${startup.region}. ` +
    `The founding thesis: ${problem} ` +
    `Proposed answer: ${solution} ` +
    capitalLine;

  return chapter("origin", "Founding", body, "origin", [startup.sector, startup.region]);
}

function buildFundingChapter(input: DocumentaryEngineInput): FounderDocumentaryChapter {
  const { startup } = input;
  const rounds = startup.fundingRounds;
  const lastMonth = startup.simulationMonths[startup.simulationMonths.length - 1];
  const finalInvestorScore = lastMonth?.investorScoreAfter ?? null;
  const investorLine = finalInvestorScore !== null
    ? ` Investor confidence ended at ${finalInvestorScore}/100.`
    : "";

  let body: string;
  if (rounds.length === 0) {
    body =
      `${startup.name} operated without external funding. ` +
      `Every decision was made against available cash.${investorLine} ` +
      (startup.status === "dead"
        ? "Runway constraints shaped every move."
        : "Profitability was the only available exit from capital risk.");
  } else {
    const total = rounds.reduce((sum, r) => sum + r.amountRaised, 0);
    const equity = rounds.reduce((sum, r) => sum + r.equitySold, 0);
    const roundNames = rounds.map((r) => r.roundType).join(", ");
    body =
      `${rounds.length === 1 ? "One funding round" : `${rounds.length} funding rounds`} closed: ${roundNames}. ` +
      `Total raised: $${total.toLocaleString()}. ` +
      `${equity.toFixed(1)}% equity sold.${investorLine} ` +
      (startup.status === "dead"
        ? "The capital extended the runway but didn't change the outcome."
        : "The capital gave the team room to execute.");
  }

  return chapter(
    "funding",
    rounds.length === 0 ? "Bootstrapped" : "The Capital Stack",
    body,
    "funding",
    ["funding", rounds.length === 0 ? "bootstrapped" : "funded"]
  );
}

function buildStrategyChapter(input: DocumentaryEngineInput): FounderDocumentaryChapter | null {
  const archetype = input.startup.aiAnalysis?.strategyArchetype as {
    dominantPlaystyle?: string | null;
    finalRunNarrative?: string;
  } | null;

  if (!archetype?.dominantPlaystyle) return null;

  const name = displayPlaystyle(archetype.dominantPlaystyle) ?? archetype.dominantPlaystyle;
  const narrative = archetype.finalRunNarrative ?? `This was a ${name} run.`;

  return chapter(
    "strategy",
    `The ${name} Play`,
    narrative,
    "strategy",
    [archetype.dominantPlaystyle, "strategy"]
  );
}

function buildSocialChapter(input: DocumentaryEngineInput): FounderDocumentaryChapter | null {
  const { socialState } = input;
  if (!socialState || socialState.actionsTaken.length === 0) return null;

  const { hype, trust, brandRisk, followers, feedItems, actionsTaken } = socialState;
  const totalActions = actionsTaken.length;

  const topItem = [...feedItems]
    .filter((fi) => fi.category === "viral" || fi.severity === "critical" || fi.severity === "positive")
    .sort((a, b) => {
      const w: Record<string, number> = { critical: 3, positive: 2, warning: 1, neutral: 0 };
      return (w[b.severity] ?? 0) - (w[a.severity] ?? 0);
    })[0];

  const hypeLabel = hype >= 70 ? "high-hype" : hype >= 40 ? "building hype" : "low-hype";
  const trustLabel = trust >= 70 ? "high-trust" : trust >= 40 ? "moderate trust" : "fragile trust";
  const riskLabel =
    brandRisk >= 60 ? "significant brand risk" : brandRisk >= 30 ? "managed brand risk" : "clean brand profile";

  let body =
    `${input.startup.name} built ${followers.toLocaleString()} followers across ${totalActions} social action${totalActions !== 1 ? "s" : ""}. ` +
    `Final social profile: ${hypeLabel}, ${trustLabel}, ${riskLabel}.`;

  if (topItem) {
    body += ` Key moment: "${topItem.title}" — ${truncate(topItem.body, 100)}`;
  }

  return chapter("social", "Public Arena", body, "social", [
    "social",
    hype >= 70 ? "viral" : "organic",
  ]);
}

function buildRivalChapter(input: DocumentaryEngineInput): FounderDocumentaryChapter | null {
  const rivals = input.socialState?.rivalProfiles ?? [];
  if (rivals.length === 0) return null;

  const moves = input.socialState?.rivalMoveHistory ?? [];
  const strongestRival = rivals.reduce((top, r) =>
    r.rivalryScore > top.rivalryScore ? r : top, rivals[0]
  );
  const defeated = rivals.filter((r) => r.isDefeated);

  const outcomeText =
    defeated.length === rivals.length
      ? `All ${rivals.length} rival${rivals.length !== 1 ? "s" : ""} fell behind.`
      : defeated.length > 0
      ? `${defeated.length} of ${rivals.length} rivals defeated.`
      : `${rivals.length} rival${rivals.length !== 1 ? "s" : ""} remained standing at exit.`;

  const topMove = [...moves]
    .filter((m) => m.severity === "critical" || m.severity === "warning")
    .sort((a, b) => {
      const w: Record<string, number> = { critical: 3, warning: 2, neutral: 0 };
      return (w[b.severity] ?? 0) - (w[a.severity] ?? 0);
    })[0];

  let body =
    `The arena wasn't empty. ${rivals.length} rival${rivals.length !== 1 ? "s" : ""} operated in the same sector. ` +
    `${strongestRival.name} (${strongestRival.founder.archetype.replace(/_/g, " ")}) led with rivalry score ${strongestRival.rivalryScore}. ` +
    outcomeText;

  if (topMove) {
    body += ` Critical move: ${topMove.title}.`;
  }

  return chapter("rival", "The Competition", body, "rival", ["rival", "competition"]);
}

function buildVerdictChapter(input: DocumentaryEngineInput): FounderDocumentaryChapter {
  const { startup } = input;
  const outcome = startup.finalOutcome ?? "unknown";
  const score = startup.finalScore ?? 0;
  const months = startup.simulationMonths.length;
  const summary = startup.finalSummary ?? startup.deathReason ?? "";

  let body: string;
  if (outcome === "BREAKOUT") {
    body = `${startup.name} reached breakout. ${months} months of execution. Final score: ${score}. ${summary || "The market validated the thesis."}`;
  } else if (outcome === "SERIES_A_READY") {
    body = `${startup.name} hit Series A territory in ${months} months. Score: ${score}. ${summary || "The metrics spoke clearly."}`;
  } else if (outcome === "ACQUISITION" || outcome === "ACQUIHIRE") {
    const verb = outcome === "ACQUIHIRE" ? "acquired for the team" : "acquired";
    body = `${startup.name} was ${verb}. ${months} months translated into an exit. Score: ${score}. ${summary || "The deal was the right outcome at the right time."}`;
  } else if (DEAD_OUTCOMES.has(outcome) || outcome === "DEAD") {
    const reason = startup.deathReason ?? (summary || "The runway ran out.");
    body = `${startup.name} died at month ${months}. Score: ${score}. ${reason}`;
  } else if (outcome === "ZOMBIE") {
    body = `${startup.name} survived ${months} months without a clear trajectory. Score: ${score}. Alive — but not winning.`;
  } else if (outcome === "SMALL_PROFITABLE") {
    body = `${startup.name} reached small-scale profitability in ${months} months. Score: ${score}. Not every run needs to be a breakout.`;
  } else if (outcome === "SEED_READY") {
    body = `${startup.name} proved the concept in ${months} months. Score: ${score}. Seed-stage validation complete.`;
  } else if (outcome === "ACQUISITION_TARGET") {
    body = `${startup.name} became an acquisition target. ${months} months attracted outside interest. Score: ${score}.`;
  } else {
    body = `${startup.name} completed ${months} months with outcome: ${outcome}. Score: ${score}. ${summary}`;
  }

  return chapter("verdict", "Final Verdict", body.trim(), "verdict", [outcome.toLowerCase(), "final"]);
}

// ─── Summary builders ─────────────────────────────────────────────────────────

function buildRivalSummary(input: DocumentaryEngineInput): DocumentaryRivalSummary | null {
  const rivals = input.socialState?.rivalProfiles ?? [];
  if (rivals.length === 0) return null;

  const moves = input.socialState?.rivalMoveHistory ?? [];
  const defeated = rivals.filter((r) => r.isDefeated).length;
  const strongest = rivals.reduce((top, r) => r.rivalryScore > top.rivalryScore ? r : top, rivals[0]);
  const topMove = [...moves].filter((m) => m.severity === "critical").sort((a, b) => b.month - a.month)[0];

  const overallOutcome =
    defeated === rivals.length
      ? `Cleared all ${rivals.length} rival${rivals.length !== 1 ? "s" : ""}.`
      : defeated === 0
      ? `Lost ground to ${rivals.length} rival${rivals.length !== 1 ? "s" : ""}.`
      : `Mixed result: ${defeated}/${rivals.length} rivals defeated.`;

  return {
    totalRivals: rivals.length,
    defeated,
    strongestRivalName: strongest.name,
    strongestRivalArchetype: strongest.founder.archetype,
    overallOutcome,
    topMoment: topMove?.title ?? null,
  };
}

function buildSocialSummary(input: DocumentaryEngineInput): DocumentarySocialSummary | null {
  const ss = input.socialState;
  if (!ss || ss.actionsTaken.length === 0) return null;

  const topFeedItem = [...ss.feedItems]
    .filter((fi) => fi.severity === "critical" || fi.category === "viral")
    .sort((a, b) => {
      const w: Record<string, number> = { critical: 3, positive: 2, warning: 1, neutral: 0 };
      return (w[b.severity] ?? 0) - (w[a.severity] ?? 0);
    })[0];

  const narrative =
    ss.hype >= 70 && ss.trust >= 60
      ? "The public profile was strong: high hype backed by trust."
      : ss.hype >= 70 && ss.trust < 40
      ? "High hype masked low trust. The audience was watching — not buying."
      : ss.brandRisk >= 60
      ? "Brand risk ran high. Public narrative was volatile."
      : ss.trust >= 65
      ? "Trust was the anchor. The audience grew slowly but stayed."
      : "The social profile was moderate. Brand awareness built over time.";

  return {
    finalHype: ss.hype,
    finalTrust: ss.trust,
    finalBrandRisk: ss.brandRisk,
    followers: ss.followers,
    totalActions: ss.actionsTaken.length,
    topMoment: topFeedItem?.title ?? null,
    narrative,
  };
}

function buildStrategySummary(input: DocumentaryEngineInput): DocumentaryStrategySummary | null {
  const archetype = input.startup.aiAnalysis?.strategyArchetype as {
    dominantPlaystyle?: string | null;
    secondaryPlaystyle?: string | null;
    finalRunNarrative?: string;
    strengths?: string[];
    weaknesses?: string[];
  } | null;

  if (!archetype?.dominantPlaystyle) return null;

  return {
    dominantPlaystyle: archetype.dominantPlaystyle,
    secondaryPlaystyle: archetype.secondaryPlaystyle ?? null,
    finalRunNarrative:
      archetype.finalRunNarrative ?? `${displayPlaystyle(archetype.dominantPlaystyle)} run.`,
    strengths: archetype.strengths ?? [],
    weaknesses: archetype.weaknesses ?? [],
  };
}

function buildCareerImpactSummary(input: DocumentaryEngineInput): DocumentaryCareerImpactSummary | null {
  const { career } = input;
  if (!career) return null;

  return {
    reputationDelta: career.reputationDelta,
    newReputationScore: career.reputationScore,
    rankAdvanced: career.rankAdvanced,
    newRank: career.founderRank,
    titleChanged: career.titleChanged,
    newTitle: career.founderTitle,
    badgeCount: career.badgeCount,
  };
}

function buildFinalVerdict(input: DocumentaryEngineInput): string {
  const outcome = input.startup.finalOutcome ?? "unknown";
  const months = input.startup.simulationMonths.length;
  const score = input.startup.finalScore ?? 0;
  const archetype = input.startup.aiAnalysis?.strategyArchetype as {
    dominantPlaystyle?: string | null;
  } | null;
  const strategyLine = archetype?.dominantPlaystyle
    ? ` Strategy: ${displayPlaystyle(archetype.dominantPlaystyle)}.`
    : "";

  if (outcome === "BREAKOUT") return `${months} months, ${score} points. A breakout run.${strategyLine} The arena remembers this one.`;
  if (outcome === "SERIES_A_READY") return `${months} months, ${score} points. Institutional grade.${strategyLine} Series A ready.`;
  if (outcome === "ACQUISITION" || outcome === "ACQUIHIRE") return `${months} months, ${score} points. Exited.${strategyLine} The deal was the result.`;
  if (DEAD_OUTCOMES.has(outcome) || outcome === "DEAD") {
    const reason = input.startup.deathReason ?? "The runway ran out.";
    return `${months} months. Dead. ${reason}${strategyLine}`;
  }
  if (outcome === "SMALL_PROFITABLE") return `${months} months, ${score} points. Small and profitable.${strategyLine}`;
  if (outcome === "SEED_READY") return `${months} months, ${score} points. Seed-ready.${strategyLine} Early traction proved the thesis.`;
  return `${months} months, ${score} points. Outcome: ${outcome}.${strategyLine}`;
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

function buildTags(
  input: DocumentaryEngineInput,
  tone: DocumentaryTone,
  genre: DocumentaryGenre
): string[] {
  const tags = new Set([
    input.startup.sector.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    tone,
    genre,
  ]);
  const outcome = input.startup.finalOutcome;
  if (outcome) tags.add(outcome.toLowerCase().replace(/_/g, "-"));
  const archetype = input.startup.aiAnalysis?.strategyArchetype as {
    dominantPlaystyle?: string | null;
  } | null;
  if (archetype?.dominantPlaystyle) tags.add(archetype.dominantPlaystyle.replace(/_/g, "-"));
  if ((input.socialState?.rivalProfiles?.length ?? 0) > 0) tags.add("rivalry");
  if ((input.socialState?.actionsTaken?.length ?? 0) > 0) tags.add("social");
  return [...tags];
}

// ─── Primary generator ────────────────────────────────────────────────────────

export function generateDocumentary(input: DocumentaryEngineInput): FounderDocumentary {
  const { startup } = input;
  const outcome = startup.finalOutcome ?? "unknown";
  const months = startup.simulationMonths.length;
  const finalScore = startup.finalScore ?? 0;
  const seed = djb2(startup.id);

  const archetype = startup.aiAnalysis?.strategyArchetype as {
    dominantPlaystyle?: string | null;
  } | null;
  const dominantPlaystyle = archetype?.dominantPlaystyle ?? null;

  const rivals = input.socialState?.rivalProfiles ?? [];
  const anyRivalDefeated = rivals.some((r) => r.isDefeated);
  const noRivalsDefeated = rivals.length > 0 && !anyRivalDefeated;
  const strongestRival = rivals.length > 0
    ? rivals.reduce((top, r) => r.rivalryScore > top.rivalryScore ? r : top, rivals[0])
    : null;

  const tone = selectTone(outcome, months, finalScore, dominantPlaystyle, anyRivalDefeated, noRivalsDefeated, startup.riskScore);
  const genre = selectGenre(outcome, rivals.length > 0, months);
  const title = buildTitle(outcome, startup.name, startup.sector, months, seed);
  const tagline = buildTagline(tone, seed);

  // Chapters (always: origin, funding, verdict; optional: strategy, social, rival)
  const chapters: FounderDocumentaryChapter[] = [
    buildOriginChapter(input),
    buildFundingChapter(input),
  ];
  const strategyChapter = buildStrategyChapter(input);
  if (strategyChapter) chapters.push(strategyChapter);
  const socialChapter = buildSocialChapter(input);
  if (socialChapter) chapters.push(socialChapter);
  const rivalChapter = buildRivalChapter(input);
  if (rivalChapter) chapters.push(rivalChapter);
  chapters.push(buildVerdictChapter(input));

  // Summaries
  const rivalSummary = buildRivalSummary(input);
  const socialSummary = buildSocialSummary(input);
  const strategySummary = buildStrategySummary(input);
  const careerImpactSummary = buildCareerImpactSummary(input);

  // Hero stats
  const heroStats: DocumentaryHeroStats = {
    finalScore,
    finalValuation: startup.valuation,
    finalRevenue: startup.revenue,
    monthsSurvived: months,
    finalOutcome: outcome,
    dominantPlaystyle: displayPlaystyle(dominantPlaystyle),
    strongestRival: strongestRival?.name ?? null,
    reputationDelta: input.career?.reputationDelta ?? null,
  };

  // Timeline
  const timeline = buildTimeline(input);

  // Share card
  const shareCard = buildShareCard({
    startup,
    title,
    tagline,
    tone,
    outcome,
    months,
    dominantPlaystyle,
    founderTitle: input.career?.founderTitle ?? "Founder",
    newBadges: [],
    reputationDelta: input.career?.reputationDelta ?? null,
  });

  return {
    startupId: startup.id,
    outcome,
    title,
    tagline,
    genre,
    tone,
    chapters,
    timeline,
    heroStats,
    rivalSummary,
    socialSummary,
    strategySummary,
    careerImpactSummary,
    finalVerdict: buildFinalVerdict(input),
    shareCard,
    tags: buildTags(input, tone, genre),
  };
}
