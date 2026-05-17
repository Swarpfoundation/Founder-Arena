export const DEMO_USER_EMAIL = "demo@founderarena.local";
export const DEMO_USER_NAME = "Demo Founder";
export const DEMO_FOUNDER_PUBLIC_SLUG = "demo-founder-arena";
export const DEMO_SEASON = "beta-season-1";

export type DemoScenarioKind = "active" | "midRun" | "finalized" | "dead";

export interface DemoScenarioDefinition {
  id: string;
  kind: DemoScenarioKind;
  label: string;
  startupName: string;
  purpose: string;
  defaultRoute: string;
  publicSlug?: string;
}

export const DEMO_SCENARIOS: DemoScenarioDefinition[] = [
  {
    id: "demo-active-month-one",
    kind: "active",
    label: "Active Week 1",
    startupName: "SignalForge AI",
    purpose: "Show Deployment Bay, pitch funding, Week 1 briefing, and operate loop.",
    defaultRoute: "/startup/demo-active-month-one",
  },
  {
    id: "demo-mid-run",
    kind: "midRun",
    label: "Mid-Run Pressure",
    startupName: "AtlasOps Cloud",
    purpose: "Show social feed, rival attacks, strategy stack, boardroom pressure, and sprint history.",
    defaultRoute: "/startup/demo-mid-run/operate",
  },
  {
    id: "demo-finalized-breakout",
    kind: "finalized",
    label: "Finalized Breakout",
    startupName: "CivicGraph",
    purpose: "Show final ceremony, documentary, career legacy, public share, and leaderboard entry.",
    defaultRoute: "/startup/demo-finalized-breakout/documentary",
    publicSlug: "demo-civicgraph-breakout",
  },
  {
    id: "demo-dead-run",
    kind: "dead",
    label: "Failed Run Contrast",
    startupName: "FablePay",
    purpose: "Show death/failure contrast without pretending every run wins.",
    defaultRoute: "/startup/demo-dead-run/documentary",
    publicSlug: "demo-fablepay-dead",
  },
];

export interface DemoScenarioPresence {
  id: string;
  kind: DemoScenarioKind;
  label: string;
  startupName: string;
  purpose: string;
  exists: boolean;
  status?: string | null;
  finalOutcome?: string | null;
  months?: number;
  publicSlug?: string | null;
  protectedRoute: string;
  publicRoute?: string;
}

export interface DemoShowcaseState {
  seedDetected: boolean;
  databaseUnavailable: boolean;
  scenarios: DemoScenarioPresence[];
  founderProfileExists: boolean;
  founderPublicRoute: string;
  leaderboardRoute: string;
}

export interface DemoShowcaseLink {
  key: string;
  label: string;
  description: string;
  href: string;
  available: boolean;
  setupHint?: string;
}

export interface PresenterChecklistStep {
  id: string;
  label: string;
  route: string;
  estimatedTime: string;
  whatToSay: string;
  doNotClaim?: string;
}

export function getDemoScenarioIds(): string[] {
  return DEMO_SCENARIOS.map((scenario) => scenario.id);
}

export function getDemoScenario(kind: DemoScenarioKind): DemoScenarioDefinition {
  const scenario = DEMO_SCENARIOS.find((item) => item.kind === kind);
  if (!scenario) {
    throw new Error(`Unknown demo scenario kind: ${kind}`);
  }
  return scenario;
}

export function getDemoPublicSlugs(): string[] {
  return DEMO_SCENARIOS.flatMap((scenario) =>
    scenario.publicSlug ? [scenario.publicSlug] : []
  );
}

export function buildEmptyDemoShowcaseState(databaseUnavailable = false): DemoShowcaseState {
  return {
    seedDetected: false,
    databaseUnavailable,
    scenarios: DEMO_SCENARIOS.map((scenario) => ({
      ...scenario,
      exists: false,
      publicSlug: scenario.publicSlug ?? null,
      protectedRoute: scenario.defaultRoute,
      publicRoute: scenario.publicSlug ? `/s/${scenario.publicSlug}` : undefined,
    })),
    founderProfileExists: false,
    founderPublicRoute: `/f/${DEMO_FOUNDER_PUBLIC_SLUG}`,
    leaderboardRoute: "/leaderboard",
  };
}

export function buildDemoShowcaseLinks(state: DemoShowcaseState): DemoShowcaseLink[] {
  const active = state.scenarios.find((scenario) => scenario.kind === "active");
  const midRun = state.scenarios.find((scenario) => scenario.kind === "midRun");
  const finalized = state.scenarios.find((scenario) => scenario.kind === "finalized");

  return [
    {
      key: "active",
      label: "Open Active Demo Startup",
      description: "Week 1 route for the playable early-run path.",
      href: active?.exists ? active.protectedRoute : "/startup/new",
      available: Boolean(active?.exists),
      setupHint: "Seed demo data, or start a fresh run.",
    },
    {
      key: "mid-run",
      label: "Open Mid-Run Demo Startup",
      description: "Pressure-state run with social, rivals, strategy, boardroom, and history.",
      href: midRun?.exists ? midRun.protectedRoute : "/startup/new",
      available: Boolean(midRun?.exists),
      setupHint: "Seed demo data to enable the mid-run showcase.",
    },
    {
      key: "finalized-story",
      label: "Open Finalized Demo Story",
      description: "Public-safe final result for documentary/share and outcome ceremony.",
      href: finalized?.exists
        ? finalized.publicRoute ?? finalized.protectedRoute
        : "/leaderboard",
      available: Boolean(finalized?.exists),
      setupHint: "Seed demo data to enable the public finalist story.",
    },
    {
      key: "career",
      label: "View Demo Career",
      description: "Public-safe founder profile and legacy record for the demo user.",
      href: state.founderProfileExists ? state.founderPublicRoute : "/career",
      available: state.founderProfileExists,
      setupHint: "Seed demo data to enable the public demo founder profile.",
    },
    {
      key: "leaderboard",
      label: "View Arena Leaderboard",
      description: "Season rankings with seeded entries when demo data exists.",
      href: state.leaderboardRoute,
      available: true,
    },
    {
      key: "fresh-run",
      label: "Start Fresh Run",
      description: "Fallback path for an empty database or live presenter run.",
      href: "/startup/new",
      available: true,
    },
  ];
}

export function buildPresenterChecklist(): PresenterChecklistStep[] {
  return [
    {
      id: "home",
      label: "Start at home or demo",
      route: "/demo",
      estimatedTime: "0:00",
      whatToSay: "Founder Arena is a startup roguelike: every run becomes a story, career record, and arena ranking.",
    },
    {
      id: "deployment-bay",
      label: "Open Deployment Bay",
      route: "/startup/new",
      estimatedTime: "0:20",
      whatToSay: "This is where a new venture gets deployed into the arena, not just created as a form record.",
    },
    {
      id: "active-startup",
      label: "Open active demo startup",
      route: getDemoScenario("active").defaultRoute,
      estimatedTime: "0:45",
      whatToSay: "Week 1 gives the player a guided first playable decision without auto-running the sim.",
    },
    {
      id: "operate",
      label: "Run or show Week 1",
      route: `${getDemoScenario("active").defaultRoute}/operate`,
      estimatedTime: "1:15",
      whatToSay: "The simulation is deterministic; the UI explains what changed after the sprint.",
    },
    {
      id: "social",
      label: "Show Social / Arena Feed",
      route: `${getDemoScenario("midRun").defaultRoute.replace("/operate", "")}/social`,
      estimatedTime: "1:45",
      whatToSay: "Attention is a game system: hype can create growth, backlash, and rival pressure.",
      doNotClaim: "Do not claim real social media posting.",
    },
    {
      id: "rivals",
      label: "Show Rivals",
      route: `${getDemoScenario("midRun").defaultRoute.replace("/operate", "")}/rivals`,
      estimatedTime: "2:10",
      whatToSay: "Rivals create asynchronous arena pressure and can be defeated or outlasted.",
      doNotClaim: "Do not claim live multiplayer.",
    },
    {
      id: "strategy",
      label: "Show Strategy",
      route: `${getDemoScenario("midRun").defaultRoute.replace("/operate", "")}/strategy`,
      estimatedTime: "2:35",
      whatToSay: "The strategy stack emerges from actions instead of a setup wizard.",
    },
    {
      id: "boardroom",
      label: "Show Boardroom",
      route: `${getDemoScenario("midRun").defaultRoute.replace("/operate", "")}/boardroom`,
      estimatedTime: "3:00",
      whatToSay: "Investor pressure becomes a playable crisis surface when the company drifts off plan.",
    },
    {
      id: "documentary",
      label: "Show Final Documentary",
      route: `/s/${getDemoScenario("finalized").publicSlug}`,
      estimatedTime: "3:40",
      whatToSay: "A completed run becomes a shareable founder story and final result.",
      doNotClaim: "Do not claim real player traction from seeded demo data.",
    },
    {
      id: "career",
      label: "Show Career Legacy",
      route: `/f/${DEMO_FOUNDER_PUBLIC_SLUG}`,
      estimatedTime: "4:20",
      whatToSay: "Runs accumulate into founder legacy, ranks, achievements, and replay motivation.",
    },
    {
      id: "leaderboard",
      label: "Show Arena Leaderboard",
      route: "/leaderboard",
      estimatedTime: "5:00",
      whatToSay: "Season rankings make the roguelike loop competitive and replayable.",
    },
  ];
}
