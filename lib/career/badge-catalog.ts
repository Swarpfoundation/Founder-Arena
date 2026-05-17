import type { BadgeRarity } from "./types";

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  rarity: BadgeRarity;
  requirement: string; // human-readable unlock condition
}

export const BADGE_CATALOG: BadgeDef[] = [
  // ── Core milestones ──────────────────────────────────────────────────────
  {
    id: "first_run_completed",
    title: "First Run Completed",
    description: "Completed your first funded startup run.",
    icon: "✓",
    category: "milestone",
    rarity: "common",
    requirement: "Complete 1 startup run",
  },
  {
    id: "first_death",
    title: "Startup Graveyard",
    description: "Your first startup ran out of runway. The best founders fail first.",
    icon: "☠",
    category: "milestone",
    rarity: "common",
    requirement: "Experience 1 startup death",
  },
  {
    id: "iron_will",
    title: "Iron Will",
    description: "Survived the full 12 Founder Weeks and lived to tell the story.",
    icon: "⚡",
    category: "milestone",
    rarity: "common",
    requirement: "Survive a full 12-week accelerator run",
  },
  {
    id: "serial_founder",
    title: "Serial Founder",
    description: "5 runs complete. You're building pattern recognition now.",
    icon: "∞",
    category: "milestone",
    rarity: "rare",
    requirement: "Complete 5 startup runs",
  },
  // ── Outcomes ────────────────────────────────────────────────────────────
  {
    id: "first_acquisition",
    title: "First Exit",
    description: "Secured your first acquisition offer and exited successfully.",
    icon: "💰",
    category: "outcome",
    rarity: "rare",
    requirement: "Reach ACQUISITION_TARGET outcome",
  },
  {
    id: "first_breakout",
    title: "Breakout Moment",
    description: "Revenue exploded and capital efficiency proved the model.",
    icon: "🚀",
    category: "outcome",
    rarity: "rare",
    requirement: "Reach BREAKOUT outcome",
  },
  {
    id: "exit_artist",
    title: "Exit Artist",
    description: "Twice the exit, twice the proof. You know how to build to acquire.",
    icon: "🎯",
    category: "outcome",
    rarity: "legendary",
    requirement: "Achieve 2 acquisitions across career",
  },
  // ── Playstyle mastery ────────────────────────────────────────────────────
  {
    id: "cockroach_founder",
    title: "Cockroach Founder",
    description: "Survived on fumes. Twice. The market can't kill you.",
    icon: "🪳",
    category: "playstyle",
    rarity: "rare",
    requirement: "Reach cockroach dominant playstyle in 2+ runs",
  },
  {
    id: "product_led_master",
    title: "Product Builder",
    description: "Product-led growth, validated twice. PMF is your religion.",
    icon: "⚙",
    category: "playstyle",
    rarity: "common",
    requirement: "Reach product_led dominant playstyle in 2+ runs",
  },
  {
    id: "hype_machine_master",
    title: "Hype Machine",
    description: "You've gone viral twice. The narrative is your weapon.",
    icon: "⚡",
    category: "playstyle",
    rarity: "common",
    requirement: "Reach hype_machine dominant playstyle in 2+ runs",
  },
  {
    id: "rival_killer",
    title: "Rival Killer",
    description: "5+ rival defeats. You don't build around competition — you eliminate it.",
    icon: "⚔",
    category: "rivals",
    rarity: "rare",
    requirement: "Defeat 5+ rivals across career",
  },
  {
    id: "enterprise_closer",
    title: "Enterprise Closer",
    description: "Enterprise motion activated, revenue proven. B2B is your domain.",
    icon: "💼",
    category: "playstyle",
    rarity: "rare",
    requirement: "Reach enterprise_sales dominant + SEED_READY or better outcome",
  },
  {
    id: "technical_moat",
    title: "Technical Moat Builder",
    description: "Engineering-led, three times over. Your product is your moat.",
    icon: "🔧",
    category: "playstyle",
    rarity: "common",
    requirement: "Reach technical_builder dominant playstyle in 3+ runs",
  },
  {
    id: "regulated_operator",
    title: "Regulated Operator",
    description: "Compliance is your competitive advantage. Twice proven.",
    icon: "🛡",
    category: "playstyle",
    rarity: "common",
    requirement: "Reach regulated_operator dominant playstyle in 2+ runs",
  },
  // ── Prestige ─────────────────────────────────────────────────────────────
  {
    id: "arena_legend",
    title: "Arena Legend",
    description: "3 breakouts. You're not building startups — you're printing legends.",
    icon: "★",
    category: "prestige",
    rarity: "legendary",
    requirement: "Reach Arena Legend rank (3+ breakouts or 2+ acquisitions + 10+ completed)",
  },
];

export function getBadgeDef(id: string): BadgeDef | undefined {
  return BADGE_CATALOG.find((b) => b.id === id);
}
