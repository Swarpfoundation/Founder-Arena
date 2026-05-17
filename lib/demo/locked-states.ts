// ─── Locked State Copy ────────────────────────────────────────────────────────
// Used by startup sub-pages to show consistent, helpful locked messages.

export interface LockedStateInfo {
  label: string;
  headline: string;
  description: string;
  flavor: string;
  unlockCondition: string;
  nextAction: string;
  nextActionHref: (startupId: string) => string;
}

export const LOCKED_STATES: Record<string, LockedStateInfo> = {
  social: {
    label: "ARENA FEED // LOCKED",
    headline: "Social Pressure Starts After Funding",
    description:
      "Your startup's social presence — hype, trust, community, viral moments — goes live once you're funded and operating.",
    flavor:
      "Social pressure turns attention into growth — or backlash. Every post, every reaction, every crisis feeds the Arena Feed.",
    unlockCondition: "Unlocks when: startup is funded and operating.",
    nextAction: "GO TO PITCH",
    nextActionHref: (id) => `/startup/${id}/pitch`,
  },
  rivals: {
    label: "RIVALS // LOCKED",
    headline: "Rival Founders Emerge Once You're Operating",
    description:
      "Rival startups are generated based on your sector, metrics, and strategy. They react to your moves, copy your wins, and exploit your weak spots.",
    flavor:
      "Rivals react to your launches, callouts, and weak spots. Defeat them in the arena or get outpaced.",
    unlockCondition: "Unlocks when: startup is funded and operating.",
    nextAction: "GO TO PITCH",
    nextActionHref: (id) => `/startup/${id}/pitch`,
  },
  strategy: {
    label: "STRATEGY // LOCKED",
    headline: "Your Strategy Emerges From Your Decisions",
    description:
      "The strategy stack builds automatically as you run sprints, manage crises, hire, and respond to boardroom pressure. No menu — just your pattern of play.",
    flavor:
      "Strategy emerges from your decisions, not a menu choice. Run sprints to reveal your founder archetype.",
    unlockCondition: "Unlocks when: startup is funded and operating.",
    nextAction: "GO TO PITCH",
    nextActionHref: (id) => `/startup/${id}/pitch`,
  },
  boardroom: {
    label: "BOARDROOM // LOCKED",
    headline: "Investor Pressure Events Fire During Your Run",
    description:
      "When runway drops, revenue misses, rivals overtake, or brand risk spikes — the board calls an emergency meeting. Your response determines investor confidence.",
    flavor:
      "Boardroom pressure tests whether investors still trust you. Choose your response carefully — effects are permanent.",
    unlockCondition: "Fires automatically when: metrics hit crisis thresholds (usually Week 2+).",
    nextAction: "RUN A SPRINT",
    nextActionHref: (id) => `/startup/${id}/operate`,
  },
  documentary: {
    label: "FOUNDER DOCUMENTARY // LOCKED",
    headline: "Your Documentary Generates When the Run Ends",
    description:
      "When your startup completes its 12-week accelerator run — or dies — Founder Arena generates a documentary: narrative arc, key moments, rival battles, boardroom drama, and final outcome.",
    flavor:
      "Every finished run becomes a founder documentary and career legacy. Finish the run to unlock it.",
    unlockCondition: "Unlocks when: startup run is completed or dead.",
    nextAction: "BACK TO OVERVIEW",
    nextActionHref: (id) => `/startup/${id}`,
  },
};

// ─── Run checklist step definitions ──────────────────────────────────────────

export interface DemoChecklistStep {
  id: string;
  label: string;
  description: string;
  href: (startupId?: string) => string;
  requiresStartup: boolean;
  requiresStatus?: string[]; // startup statuses that make it available
}

export const DEMO_CHECKLIST_STEPS: DemoChecklistStep[] = [
  {
    id: "create",
    label: "Create a Startup",
    description: "Pick a sector, name it, describe the problem and solution.",
    href: () => "/startup/new",
    requiresStartup: false,
  },
  {
    id: "pitch",
    label: "Submit Pitch to AI VCs",
    description: "AI investors evaluate your idea on uniqueness, market fit, and execution.",
    href: (id) => `/startup/${id ?? "new"}/pitch`,
    requiresStartup: true,
    requiresStatus: ["seed", "funded", "active"],
  },
  {
    id: "run_month",
    label: "Run First Month",
    description: "Simulate your startup's operations. Watch cash, revenue, and risk move.",
    href: (id) => `/startup/${id ?? "new"}/operate`,
    requiresStartup: true,
    requiresStatus: ["funded", "active"],
  },
  {
    id: "social",
    label: "View Arena Feed",
    description: "See the social pressure — hype spikes, trust drops, viral moments.",
    href: (id) => `/startup/${id ?? "new"}/social`,
    requiresStartup: true,
    requiresStatus: ["funded", "active", "completed", "dead"],
  },
  {
    id: "rivals",
    label: "Check Your Rivals",
    description: "Meet the rival founders in your sector. Track rivalry scores.",
    href: (id) => `/startup/${id ?? "new"}/rivals`,
    requiresStartup: true,
    requiresStatus: ["funded", "active", "completed", "dead"],
  },
  {
    id: "strategy",
    label: "View Strategy Stack",
    description: "See your founder archetype emerging from your decisions.",
    href: (id) => `/startup/${id ?? "new"}/strategy`,
    requiresStartup: true,
    requiresStatus: ["funded", "active", "completed", "dead"],
  },
  {
    id: "boardroom",
    label: "Survive a Boardroom Event",
    description: "When metrics hit crisis thresholds, the board demands answers.",
    href: (id) => `/startup/${id ?? "new"}/boardroom`,
    requiresStartup: true,
    requiresStatus: ["funded", "active", "completed", "dead"],
  },
  {
    id: "finish",
    label: "Finish the 12-Month Run",
    description: "Complete or survive to finalization. Your outcome is locked in.",
    href: (id) => `/startup/${id ?? "new"}/operate`,
    requiresStartup: true,
    requiresStatus: ["funded", "active"],
  },
  {
    id: "documentary",
    label: "View Founder Documentary",
    description: "The full narrative of your run — moments, rivals, boardroom drama.",
    href: (id) => `/startup/${id ?? "new"}/documentary`,
    requiresStartup: true,
    requiresStatus: ["completed", "dead"],
  },
  {
    id: "career",
    label: "View Career Legacy",
    description: "See how this run updated your founder rank, title, and lifetime stats.",
    href: () => "/career",
    requiresStartup: false,
  },
  {
    id: "leaderboard",
    label: "Check Arena Leaderboard",
    description: "See where your run ranks in Beta Season 1 — globally and by sector.",
    href: () => "/leaderboard",
    requiresStartup: false,
  },
];
