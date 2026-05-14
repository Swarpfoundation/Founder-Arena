import { db } from "@/lib/db";

/**
 * DB Smoke Test Script
 *
 * Verifies database connectivity and critical data state.
 *
 * Usage:
 *   npx tsx scripts/db-smoke.ts
 */

async function main() {
  console.log("\n🗄️  Founder Arena DB Smoke Tests\n");

  let exitCode = 0;

  // 1. Prisma connection
  try {
    const userCount = await db.user.count();
    console.log(`  ✅ Prisma connected (users: ${userCount})`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ❌ Prisma connection failed: ${msg}`);
    exitCode = 1;
  }

  // 2. Market snapshots
  try {
    const snapshotCount = await db.marketSnapshot.count();
    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentSnapshot = await db.marketSnapshot.findFirst({
      where: { month },
      select: { id: true, isActive: true, scenarioKey: true },
    });

    if (snapshotCount > 0) {
      console.log(`  ✅ Market snapshots exist (total: ${snapshotCount})`);
    } else {
      console.log(`  ⚠️  No market snapshots found — seed with: npm run db:seed`);
    }

    if (currentSnapshot) {
      console.log(`  ✅ Current-month snapshot: ${currentSnapshot.scenarioKey} (active: ${currentSnapshot.isActive})`);
    } else {
      console.log(`  ⚠️  No snapshot for current month — fallback to seeded scenarios will be used`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ❌ Market snapshot check failed: ${msg}`);
    exitCode = 1;
  }

  // 3. Latest data run
  try {
    const latestRun = await db.marketDataRun.findFirst({
      orderBy: { createdAt: "desc" },
      select: { mode: true, status: true, createdAt: true },
    });
    if (latestRun) {
      console.log(`  ✅ Latest data run: ${latestRun.mode} / ${latestRun.status} (${latestRun.createdAt.toISOString()})`);
    } else {
      console.log(`  ℹ️  No market data runs yet`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  ❌ Data run check failed: ${msg}`);
    exitCode = 1;
  }

  // 4. Demo mode safety
  const demoEnabled = process.env.DEMO_MODE_ENABLED === "true";
  const isProduction = process.env.NODE_ENV === "production";
  if (demoEnabled && isProduction) {
    console.log(`  🚨 WARNING: DEMO_MODE_ENABLED is true in production!`);
    exitCode = 1;
  } else if (demoEnabled) {
    console.log(`  ℹ️  Demo mode enabled (development only)`);
  } else {
    console.log(`  ✅ Demo mode disabled`);
  }

  // 5. Critical env vars
  const authSecret = process.env.AUTH_SECRET;
  const authUrl = process.env.AUTH_URL;
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.log(`  ❌ DATABASE_URL is missing`);
    exitCode = 1;
  } else {
    console.log(`  ✅ DATABASE_URL is set`);
  }

  if (!authSecret || authSecret.length < 16) {
    console.log(`  ❌ AUTH_SECRET is missing or too short`);
    exitCode = 1;
  } else {
    console.log(`  ✅ AUTH_SECRET is set`);
  }

  if (!authUrl) {
    console.log(`  ⚠️  AUTH_URL is missing`);
  } else {
    console.log(`  ✅ AUTH_URL is set (${authUrl})`);
  }

  console.log("");
  if (exitCode === 0) {
    console.log("✅ All DB smoke tests passed\n");
  } else {
    console.log("❌ Some DB smoke tests failed\n");
  }

  await db.$disconnect();
  process.exit(exitCode);
}

main();
