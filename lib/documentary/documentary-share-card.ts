import type { DocumentaryShareCard, DocumentaryTone } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OUTCOME_LABELS: Record<string, string> = {
  BREAKOUT: "BREAKOUT",
  SERIES_A_READY: "SERIES A READY",
  ACQUISITION: "ACQUIRED",
  ACQUIHIRE: "ACQUIHIRED",
  ACQUISITION_TARGET: "ACQUISITION TARGET",
  SEED_READY: "SEED READY",
  SMALL_PROFITABLE: "PROFITABLE",
  ZOMBIE: "ZOMBIE",
  HIGH_RISK_FAILURE: "DEAD",
  DEAD: "DEAD",
};

const PLAYSTYLE_DISPLAY: Record<string, string> = {
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

function fmtValuation(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

// ─── Share text ───────────────────────────────────────────────────────────────

function buildShareText(
  startupName: string,
  sector: string,
  region: string,
  outcome: string,
  finalScore: number,
  finalValuation: number,
  months: number,
  playstyle: string | null,
  tagline: string
): string {
  const outcomeLabel = OUTCOME_LABELS[outcome] ?? outcome;
  const playstyleLabel = playstyle ? (PLAYSTYLE_DISPLAY[playstyle] ?? playstyle) : null;
  const valStr = fmtValuation(finalValuation);

  const lines: string[] = [
    `FOUNDER ARENA // RUN COMPLETE`,
    ``,
    `${startupName} — ${sector} | ${region}`,
    `Outcome: ${outcomeLabel}`,
    `Score: ${finalScore.toLocaleString()} | Valuation: ${valStr} | ${months} Founder Weeks`,
    ...(playstyleLabel ? [`Strategy: ${playstyleLabel}`] : []),
    ``,
    `"${tagline}"`,
  ];

  return lines.join("\n");
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export interface ShareCardInput {
  startup: {
    id: string;
    name: string;
    sector: string;
    region: string;
    revenue: number;
    valuation: number;
    finalScore: number | null;
    finalOutcome: string | null;
    simulationMonths: Array<{ monthNumber: number }>;
  };
  title: string;
  tagline: string;
  tone: DocumentaryTone;
  outcome: string;
  months: number;
  dominantPlaystyle: string | null;
  founderTitle: string;
  newBadges: string[];
  reputationDelta: number | null;
}

export function buildShareCard(input: ShareCardInput): DocumentaryShareCard {
  const {
    startup,
    title,
    tagline,
    outcome,
    months,
    dominantPlaystyle,
    founderTitle,
    newBadges,
    reputationDelta,
  } = input;

  const finalScore = startup.finalScore ?? 0;
  const playstyleDisplay = dominantPlaystyle
    ? (PLAYSTYLE_DISPLAY[dominantPlaystyle] ?? dominantPlaystyle)
    : null;

  const badgeLine =
    newBadges.length > 0
      ? newBadges.slice(0, 3).join(" · ")
      : reputationDelta !== null && reputationDelta > 0
      ? `+${reputationDelta} reputation`
      : null;

  const shareText = buildShareText(
    startup.name,
    startup.sector,
    startup.region,
    outcome,
    finalScore,
    startup.valuation,
    months,
    dominantPlaystyle,
    tagline
  );

  return {
    title,
    subtitle: tagline,
    outcomeLabel: OUTCOME_LABELS[outcome] ?? outcome,
    founderTitle,
    startupName: startup.name,
    sector: startup.sector,
    finalScore,
    finalValuation: startup.valuation,
    finalRevenue: startup.revenue,
    monthsSurvived: months,
    dominantPlaystyle: playstyleDisplay,
    badgeLine,
    quote: tagline,
    shareText,
  };
}
