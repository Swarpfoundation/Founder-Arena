export type CeremonyTone = "success" | "danger" | "warning" | "legendary" | "neutral";
export type CeremonyAccent = "cyan" | "violet" | "rose" | "amber" | "emerald" | "white";

export interface CeremonyProfile {
  tone: CeremonyTone;
  accent: CeremonyAccent;
  title: string;
  subtitle: string;
  label: string;
  isPositive: boolean;
}

export interface CeremonyCta {
  label: string;
  href: string;
  accent: CeremonyAccent;
}

export interface DeltaInput {
  id: string;
  label: string;
  before: number;
  after: number;
  format?: "money" | "percent" | "number" | "months";
  positiveDirection?: "up" | "down";
}

export interface StatDeltaItem extends DeltaInput {
  delta: number;
  direction: "up" | "down" | "flat";
  isGood: boolean;
}

const POSITIVE_OUTCOMES = new Set([
  "BREAKOUT",
  "ACQUISITION",
  "ACQUIHIRE",
  "ACQUIRED",
  "SERIES_A_READY",
  "SEED_READY",
  "SMALL_PROFITABLE",
  "ACQUISITION_TARGET",
]);

export function normalizeOutcome(outcome?: string | null): string {
  return (outcome ?? "UNKNOWN").trim().toUpperCase();
}

export function getOutcomeCeremony(outcome?: string | null): CeremonyProfile {
  const key = normalizeOutcome(outcome);

  if (key === "BREAKOUT") {
    return {
      tone: "legendary",
      accent: "emerald",
      title: "Breakout Achieved",
      subtitle: "The market bent toward your startup. This run enters Founder Arena lore.",
      label: "BREAKOUT",
      isPositive: true,
    };
  }

  if (key === "ACQUISITION" || key === "ACQUIHIRE" || key === "ACQUIRED") {
    return {
      tone: "success",
      accent: "amber",
      title: "Deal Closed",
      subtitle: "Strategic interest turned into an exit. The cap table survived the arena.",
      label: key === "ACQUIHIRE" ? "ACQUIHIRE" : "ACQUIRED",
      isPositive: true,
    };
  }

  if (key === "SERIES_A_READY") {
    return {
      tone: "success",
      accent: "cyan",
      title: "Series A Ready",
      subtitle: "The company has enough signal to step into the next fundraising arena.",
      label: "SERIES A READY",
      isPositive: true,
    };
  }

  if (key === "SEED_READY") {
    return {
      tone: "success",
      accent: "cyan",
      title: "Seed Ready",
      subtitle: "The run produced a fundable company with visible momentum.",
      label: "SEED READY",
      isPositive: true,
    };
  }

  if (key === "SMALL_PROFITABLE") {
    return {
      tone: "success",
      accent: "emerald",
      title: "Profitable Survivor",
      subtitle: "Not every arena win is explosive. This one is durable.",
      label: "PROFITABLE",
      isPositive: true,
    };
  }

  if (key === "ACQUISITION_TARGET") {
    return {
      tone: "warning",
      accent: "violet",
      title: "Strategic Target",
      subtitle: "The company did not dominate, but the market noticed enough to circle.",
      label: "ACQ TARGET",
      isPositive: true,
    };
  }

  if (key === "ZOMBIE") {
    return {
      tone: "warning",
      accent: "white",
      title: "Zombie Company",
      subtitle: "The startup survived the calendar, not the arena. The lesson still counts.",
      label: "ZOMBIE",
      isPositive: false,
    };
  }

  if (key === "DEAD" || key === "HIGH_RISK_FAILURE" || key === "SHUTDOWN" || key === "BANKRUPT") {
    return {
      tone: "danger",
      accent: "rose",
      title: "Startup Down",
      subtitle: "The company is gone. The founder record remembers what happened.",
      label: "DEAD",
      isPositive: false,
    };
  }

  return {
    tone: "neutral",
    accent: "cyan",
    title: "Run Complete",
    subtitle: "The arena has scored this run and added it to your founder record.",
    label: key.replace(/_/g, " "),
    isPositive: POSITIVE_OUTCOMES.has(key),
  };
}

export function buildFinalResultCtas(input: {
  startupId: string;
  publicSlug?: string | null;
  hasLeaderboardEntry?: boolean;
  isDead?: boolean;
}): CeremonyCta[] {
  const ctas: CeremonyCta[] = [
    { label: "Watch Story", href: `/startup/${input.startupId}/documentary`, accent: "cyan" },
    { label: "Career Legacy", href: "/career", accent: "amber" },
  ];

  if (input.hasLeaderboardEntry) {
    ctas.push({ label: "Arena Ranking", href: "/leaderboard?tab=overall&season=beta-season-1", accent: "violet" });
  }

  if (input.publicSlug) {
    ctas.push({ label: "Public Record", href: `/s/${input.publicSlug}`, accent: "white" });
  }

  if (input.isDead) {
    ctas.push({ label: "Graveyard", href: "/graveyard", accent: "rose" });
  }

  ctas.push({ label: "New Run", href: "/startup/new", accent: "emerald" });
  return ctas;
}

export function computeStatDeltas(items: DeltaInput[]): StatDeltaItem[] {
  return items.map((item) => {
    const delta = item.after - item.before;
    const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    const positiveDirection = item.positiveDirection ?? "up";
    const isGood =
      direction === "flat"
        ? false
        : positiveDirection === "up"
          ? delta > 0
          : delta < 0;

    return { ...item, delta, direction, isGood };
  });
}

export function formatDeltaValue(value: number, format: DeltaInput["format"] = "number"): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (format === "money") {
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
    return `${sign}$${abs.toLocaleString()}`;
  }

  if (format === "percent") return `${sign}${abs}%`;
  if (format === "months") return `${sign}${abs} mo`;
  return `${sign}${abs.toLocaleString()}`;
}

export function buildRewardKey(parts: Array<string | number | null | undefined>): string {
  return parts.filter((part) => part !== null && part !== undefined && String(part).length > 0).join(":");
}

