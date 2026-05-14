import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed demo user only in development/demo mode
  const demoMode = process.env.DEMO_MODE_ENABLED === "true";
  if (demoMode || process.env.NODE_ENV !== "production") {
    const demoEmail = "demo@founderarena.local";
    await prisma.user.upsert({
      where: { email: demoEmail },
      update: {},
      create: {
        email: demoEmail,
        name: "Demo Founder",
      },
    });
    console.log("Seeded demo user.");
  } else {
    console.log("Skipping demo user seed (production mode).");
  }

  // Seed market snapshots using Phase 6 scenario library
  const { seedMarketSnapshotsV1 } = await import("../lib/market/snapshot-service");
  await seedMarketSnapshotsV1();

  console.log("Seeded market snapshots.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
