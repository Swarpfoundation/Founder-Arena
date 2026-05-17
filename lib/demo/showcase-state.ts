import { db } from "@/lib/db";
import {
  buildEmptyDemoShowcaseState,
  DEMO_FOUNDER_PUBLIC_SLUG,
  DEMO_SCENARIOS,
  type DemoShowcaseState,
} from "./showcase-data";

export async function getDemoShowcaseState(): Promise<DemoShowcaseState> {
  try {
    const [startups, founderProfile] = await Promise.all([
      db.startup.findMany({
        where: { id: { in: DEMO_SCENARIOS.map((scenario) => scenario.id) } },
        select: {
          id: true,
          status: true,
          finalOutcome: true,
          publicSlug: true,
          simulationMonths: {
            orderBy: { monthNumber: "desc" },
            take: 1,
            select: { monthNumber: true },
          },
        },
      }),
      db.founderProfile.findUnique({
        where: { publicSlug: DEMO_FOUNDER_PUBLIC_SLUG },
        select: { id: true },
      }),
    ]);

    const startupById = new Map(startups.map((startup) => [startup.id, startup]));
    const scenarios = DEMO_SCENARIOS.map((scenario) => {
      const startup = startupById.get(scenario.id);
      const publicSlug = startup?.publicSlug ?? scenario.publicSlug ?? null;
      return {
        ...scenario,
        exists: Boolean(startup),
        status: startup?.status ?? null,
        finalOutcome: startup?.finalOutcome ?? null,
        months: startup?.simulationMonths[0]?.monthNumber ?? 0,
        publicSlug,
        protectedRoute: scenario.defaultRoute,
        publicRoute: publicSlug ? `/s/${publicSlug}` : undefined,
      };
    });

    return {
      seedDetected: scenarios.some((scenario) => scenario.exists),
      databaseUnavailable: false,
      scenarios,
      founderProfileExists: Boolean(founderProfile),
      founderPublicRoute: `/f/${DEMO_FOUNDER_PUBLIC_SLUG}`,
      leaderboardRoute: "/leaderboard",
    };
  } catch {
    return buildEmptyDemoShowcaseState(true);
  }
}
