import type { ArenaFeedPublicItem, LeaderboardEntryDisplay } from "./types";

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

// ─── Narrative Templates ──────────────────────────────────────────────────────

const NEW_ENTRY_LINES = [
  "just entered the arena.",
  "dropped into the leaderboard.",
  "completed their run and claimed a rank.",
  "survived and hit the board.",
  "finished strong. Watch this one.",
];

const TOP3_LINES = [
  "is dominating the arena.",
  "holds the top of the board. Untouchable for now.",
  "leads the season. Everyone else is chasing.",
  "set the bar. Who dares challenge?",
];

const OUTCOME_LINES: Record<string, string[]> = {
  BREAKOUT: [
    "achieved BREAKOUT. The market noticed.",
    "broke out. One of the rare ones.",
    "hit BREAKOUT status. Legendary run.",
  ],
  SERIES_A_READY: [
    "is Series A ready. Investors are watching.",
    "reached Series A readiness. Solid execution.",
    "hit Series A territory. Clean metrics, clean exit.",
  ],
  ACQUISITION_TARGET: [
    "became an acquisition target. Not bad for a sim.",
    "got acquired (in spirit). Value unlocked.",
    "showed enough traction to warrant a buyout.",
  ],
  SMALL_PROFITABLE: [
    "built something small and profitable. Respect.",
    "chose profitability over growth. Rare discipline.",
    "stayed lean and made money. Cockroach energy.",
  ],
  SEED_READY: [
    "is seed-ready. A solid first run.",
    "showed enough to raise a seed. Progress made.",
  ],
};

const SURVIVAL_LINES = [
  "survived all 12 months. The cockroach lives.",
  "went the distance — 12 months of pure survival.",
  "made it to month 12. Endurance is a skill.",
];

// ─── Generator ────────────────────────────────────────────────────────────────

export function generatePublicArenaFeed(
  entries: LeaderboardEntryDisplay[],
  maxItems: number = 12
): ArenaFeedPublicItem[] {
  const items: ArenaFeedPublicItem[] = [];
  const topEntries = entries.slice(0, 20);

  for (const entry of topEntries) {
    if (items.length >= maxItems) break;

    const seed = djb2(`${entry.startupId}:${entry.rank}:${entry.score}`);
    const ts = new Date(2026, 0, 1, 0, 0, 0, seed % 86400000).toISOString();

    let category: ArenaFeedPublicItem["category"] = "new_entry";
    let title = "";
    let body = "";

    if (entry.rank <= 3) {
      category = "leaderboard_move";
      const line = pickFrom(TOP3_LINES, seed);
      title = `#${entry.rank} — ${entry.startupName}`;
      body = `${entry.founderName}'s ${entry.startupName} ${line} Score: ${entry.score.toLocaleString()}.`;
    } else if (entry.outcome && OUTCOME_LINES[entry.outcome]) {
      category = "outcome_achieved";
      const line = pickFrom(OUTCOME_LINES[entry.outcome], seed);
      title = `${entry.startupName} — ${entry.outcome.replace(/_/g, " ")}`;
      body = `${entry.founderName}'s ${entry.startupName} ${line} ${entry.sector} sector. Rank #${entry.rank}.`;
    } else if (entry.survivalMonths >= 12) {
      category = "season_milestone";
      const line = pickFrom(SURVIVAL_LINES, seed);
      title = `${entry.startupName} — Full Run`;
      body = `${entry.founderName}'s ${entry.startupName} ${line} Rank #${entry.rank}. Score: ${entry.score.toLocaleString()}.`;
    } else {
      const line = pickFrom(NEW_ENTRY_LINES, seed);
      title = `${entry.startupName} enters the board`;
      body = `${entry.founderName}'s ${entry.startupName} ${line} ${entry.sector}. Rank #${entry.rank}. Score: ${entry.score.toLocaleString()}.`;
    }

    items.push({
      id: `arena_feed_${entry.startupId}_${entry.rank}`,
      category,
      title,
      body,
      startupName: entry.startupName,
      founderName: entry.founderName,
      sector: entry.sector,
      outcome: entry.outcome,
      score: entry.score,
      rank: entry.rank,
      generatedAt: ts,
    });
  }

  return items;
}
