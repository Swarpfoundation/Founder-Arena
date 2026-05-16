import type {
  DocumentaryEngineInput,
  DocumentaryTimelineMoment,
  TimelineImpact,
  TimelineSource,
} from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function moment(
  id: string,
  month: number,
  title: string,
  description: string,
  category: string,
  impact: TimelineImpact,
  source: TimelineSource,
  importance: number
): DocumentaryTimelineMoment {
  return { id, month, title, description, category, impact, source, importance };
}

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 3,
  warning: 2,
  positive: 2,
  neutral: 0,
};

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildTimeline(input: DocumentaryEngineInput): DocumentaryTimelineMoment[] {
  const { startup, socialState } = input;
  const months = startup.simulationMonths;
  const candidates: DocumentaryTimelineMoment[] = [];
  const usedIds = new Set<string>();

  function add(m: DocumentaryTimelineMoment) {
    if (!usedIds.has(m.id)) {
      usedIds.add(m.id);
      candidates.push(m);
    }
  }

  // Launch
  add(moment(
    "launch",
    1,
    `${startup.name} Launches`,
    `${startup.sector} startup ${startup.name} enters the arena in ${startup.region}. Funding ask: $${startup.fundingAsk.toLocaleString()}.`,
    "launch",
    "neutral",
    "simulation",
    30
  ));

  // Funding rounds — approximate month (use index+2 as a rough placeholder since we don't store month on FundingRound)
  startup.fundingRounds.forEach((r, i) => {
    add(moment(
      `funding-${i}`,
      i + 2,
      `${r.roundType.charAt(0).toUpperCase() + r.roundType.slice(1)} Round Closed`,
      `$${r.amountRaised.toLocaleString()} raised. ${r.equitySold.toFixed(1)}% equity sold.`,
      "funding",
      "positive",
      "funding",
      85
    ));
  });

  // Simulation month events
  let firstRevenueMonth: number | null = null;
  months.forEach((m) => {
    // Track first revenue
    if (m.revenue > 0 && firstRevenueMonth === null) {
      firstRevenueMonth = m.monthNumber;
      add(moment(
        `first-revenue-${m.monthNumber}`,
        m.monthNumber,
        "First Revenue",
        `${startup.name} generates its first $${m.revenue.toLocaleString()} in monthly revenue.`,
        "milestone",
        "positive",
        "simulation",
        65
      ));
    }

    // Product milestones
    if (m.productProgress >= 50 && m.productProgressBefore !== undefined && (m.productProgressBefore ?? 0) < 50) {
      add(moment(
        `product-50-${m.monthNumber}`,
        m.monthNumber,
        "Product Hits 50%",
        `Product progress crosses 50%. The core is functional.`,
        "milestone",
        "positive",
        "simulation",
        55
      ));
    }
    if (m.productProgress >= 80 && m.productProgressBefore !== undefined && (m.productProgressBefore ?? 0) < 80) {
      add(moment(
        `product-80-${m.monthNumber}`,
        m.monthNumber,
        "Product at 80%",
        `Product progress reaches 80%. Ready for market validation.`,
        "milestone",
        "positive",
        "simulation",
        58
      ));
    }

    // Risk spikes
    if ((m.riskScoreAfter ?? 0) >= 80 && (m.riskScoreAfter ?? 0) > (m.riskScoreBefore ?? 0) + 15) {
      add(moment(
        `risk-spike-${m.monthNumber}`,
        m.monthNumber,
        "Risk Spike",
        `Risk score reaches ${m.riskScoreAfter}. ${m.eventSummary ?? "External pressures mount."}`,
        "risk",
        "negative",
        "simulation",
        70
      ));
    }

    // Investor score collapses
    if ((m.investorScoreAfter ?? 50) <= 20 && (m.investorScoreBefore ?? 50) > 30) {
      add(moment(
        `investor-collapse-${m.monthNumber}`,
        m.monthNumber,
        "Investor Confidence Drops",
        `Investor score falls to ${m.investorScoreAfter}. Confidence in the thesis wavering.`,
        "investor",
        "negative",
        "simulation",
        68
      ));
    }

    // Named events from simulation
    if (m.eventTitle) {
      const desc = m.eventSummary ?? m.aiSummary ?? m.eventTitle;
      const isNegative = /fail|crash|crisis|risk|loss|threat|attack|down/i.test(m.eventTitle);
      add(moment(
        `event-${m.monthNumber}`,
        m.monthNumber,
        m.eventTitle,
        desc.length > 140 ? desc.slice(0, 140) + "..." : desc,
        "event",
        isNegative ? "negative" : "positive",
        "simulation",
        60
      ));
    }

    // Runway warnings
    if (m.runwayMonths <= 2 && m.runwayMonths > 0) {
      add(moment(
        `runway-warning-${m.monthNumber}`,
        m.monthNumber,
        "Runway Critical",
        `Only ${m.runwayMonths} month${m.runwayMonths !== 1 ? "s" : ""} of runway remaining. Cash: $${m.cashEnd.toLocaleString()}.`,
        "finance",
        "negative",
        "simulation",
        75
      ));
    }
  });

  // Social feed items
  if (socialState) {
    const topSocialItems = [...socialState.feedItems]
      .filter(fi => fi.severity === "critical" || fi.category === "viral" || fi.category === "milestone")
      .sort((a, b) => (SEVERITY_WEIGHT[b.severity] ?? 0) - (SEVERITY_WEIGHT[a.severity] ?? 0))
      .slice(0, 3);

    topSocialItems.forEach((fi, i) => {
      const isNeg = fi.severity === "critical" || fi.category === "crisis";
      const desc = fi.body.length > 120 ? fi.body.slice(0, 120) + "..." : fi.body;
      add(moment(
        `social-${fi.id ?? i}`,
        fi.month,
        fi.title,
        desc,
        "social",
        isNeg ? "negative" : "positive",
        "social",
        fi.severity === "critical" ? 72 : 60
      ));
    });

    // Rival moves (critical only)
    const criticalMoves = socialState.rivalMoveHistory
      .filter(m => m.severity === "critical" || m.severity === "warning")
      .sort((a, b) => (SEVERITY_WEIGHT[b.severity] ?? 0) - (SEVERITY_WEIGHT[a.severity] ?? 0))
      .slice(0, 2);

    criticalMoves.forEach((mv, i) => {
      const desc = mv.description.length > 120 ? mv.description.slice(0, 120) + "..." : mv.description;
      add(moment(
        `rival-move-${mv.id ?? i}`,
        mv.month,
        `${mv.rivalName}: ${mv.title}`,
        desc,
        "rival",
        "negative",
        "rival",
        mv.severity === "critical" ? 80 : 65
      ));
    });
  }

  // Final outcome
  const finalMonth = months.length > 0 ? months[months.length - 1].monthNumber : 1;
  const outcome = startup.finalOutcome ?? "unknown";
  const isWin = ["BREAKOUT", "SERIES_A_READY", "ACQUISITION", "ACQUIHIRE", "ACQUISITION_TARGET", "SEED_READY", "SMALL_PROFITABLE"].includes(outcome);
  add(moment(
    "final-outcome",
    finalMonth,
    outcomeDisplayName(outcome),
    startup.finalSummary ?? startup.deathReason ?? `${startup.name} ends with outcome: ${outcome}.`,
    "final",
    isWin ? "positive" : outcome === "ZOMBIE" ? "mixed" : "negative",
    "final",
    100
  ));

  // Sort by month, then filter to top 10 while always keeping launch + final
  const pinnedIds = new Set(["launch", "final-outcome"]);
  const pinned = candidates.filter(c => pinnedIds.has(c.id));
  const rest = candidates
    .filter(c => !pinnedIds.has(c.id))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 8);

  const selected = [...pinned, ...rest].sort((a, b) => a.month - b.month);

  // Deduplicate by month+category combination (keep highest importance)
  const seen = new Map<string, DocumentaryTimelineMoment>();
  for (const m of selected) {
    const key = `${m.month}-${m.category}`;
    const existing = seen.get(key);
    if (!existing || m.importance > existing.importance) {
      seen.set(key, m);
    }
  }

  return [...seen.values()].sort((a, b) => a.month - b.month).slice(0, 10);
}

function outcomeDisplayName(outcome: string): string {
  const map: Record<string, string> = {
    BREAKOUT: "Breakout",
    SERIES_A_READY: "Series A Ready",
    ACQUISITION: "Acquired",
    ACQUIHIRE: "Acquihired",
    ACQUISITION_TARGET: "Acquisition Target",
    SEED_READY: "Seed Ready",
    SMALL_PROFITABLE: "Small & Profitable",
    ZOMBIE: "Zombie Mode",
    HIGH_RISK_FAILURE: "Risk Failure",
    DEAD: "Dead",
  };
  return map[outcome] ?? outcome;
}
