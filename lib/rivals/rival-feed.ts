import type { ArenaFeedItem } from "@/lib/social/types";
import type { RivalMove } from "./types";

let _feedSeq = 0;
function feedId(): string { return `rival-feed-${Date.now()}-${++_feedSeq}`; }

// ─── Convert rival moves to Arena Feed items ──────────────────────────────────

export function generateRivalFeedItems(moves: RivalMove[]): ArenaFeedItem[] {
  return moves.map((move) => ({
    id: feedId(),
    month: move.month,
    category: move.feedCategory as ArenaFeedItem["category"],
    title: move.title,
    body: move.description,
    severity: move.severity,
    source: "rival" as ArenaFeedItem["source"],
  }));
}

// ─── Counter-action confirmation feed item ───────────────────────────────────

export function generateCounterActionFeedItem(
  month: number,
  actionTitle: string,
  rivalName: string,
  outcome: "positive" | "neutral" | "warning"
): ArenaFeedItem {
  const BODIES: Record<string, string> = {
    counter_positioning_thread:
      `Your counter-narrative thread ran. The framing around ${rivalName}'s move has shifted.`,
    accelerate_beta:
      `You accelerated the beta timeline. ${rivalName}'s copycat advantage narrowed.`,
    customer_proof_campaign:
      `Customer proof campaign live. ${rivalName}'s poaching attempts are meeting resistance.`,
    enterprise_discount_offensive:
      `Enterprise discount launched. You're taking ground back from ${rivalName}.`,
    quiet_execution:
      `You stepped back from the noise. Brand risk reduced. Product focus increased.`,
    founder_debate:
      `You entered the public debate. The industry is watching. ${rivalName} responded.`,
  };

  const body = BODIES[actionTitle] ??
    `You countered ${rivalName}'s recent move. The competitive balance shifted.`;

  return {
    id: feedId(),
    month,
    category: "rival",
    title: `Counter-move: ${actionTitle.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
    body,
    severity: outcome,
    source: "founder",
  };
}
