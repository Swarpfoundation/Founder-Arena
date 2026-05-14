import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Regression tests for upsert idempotency in recordUsage and
 * createOrUpdateLeaderboardEntry.
 *
 * These verify that:
 * - the correct Prisma compound-unique key names are used (generated from
 *   @@unique directives in schema.prisma)
 * - update clauses INCREMENT rather than overwrite (usage) or REPLACE
 *   (leaderboard)
 * - create clauses carry the full identity fields
 */

vi.mock("@/lib/db", () => ({
  db: {
    usageLedger: {
      upsert: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    leaderboardEntry: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { recordUsage, getUsageForPeriod } from "@/lib/billing/usage";
import { createOrUpdateLeaderboardEntry } from "@/lib/game/leaderboard";
import { db } from "@/lib/db";

const mockedDb = db as unknown as {
  usageLedger: {
    upsert: ReturnType<typeof vi.fn>;
    aggregate: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  leaderboardEntry: {
    upsert: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};

// ---------------------------------------------------------------------------
// recordUsage
// ---------------------------------------------------------------------------
describe("recordUsage — upsert idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedDb.usageLedger.upsert.mockResolvedValue({});
  });

  it("calls upsert (not create) so a second call increments instead of duplicating", async () => {
    await recordUsage("u1", "vcReview");
    expect(mockedDb.usageLedger.upsert).toHaveBeenCalledTimes(1);
  });

  it("WHERE key is the compound unique name from schema: userId_actionType_periodStart_periodEnd", async () => {
    await recordUsage("u1", "vcReview");
    const call = mockedDb.usageLedger.upsert.mock.calls[0][0] as {
      where: Record<string, unknown>;
    };
    expect(call.where.userId_actionType_periodStart_periodEnd).toBeDefined();
    expect(call.where.userId_actionType_periodStart_periodEnd).toMatchObject({
      userId: "u1",
      actionType: "vcReview",
    });
  });

  it("UPDATE clause uses count: { increment } not count: <value>", async () => {
    await recordUsage("u1", "monthlySimulation", 3);
    const call = mockedDb.usageLedger.upsert.mock.calls[0][0] as {
      update: Record<string, unknown>;
    };
    expect((call.update.count as { increment: number }).increment).toBe(3);
  });

  it("CREATE clause carries userId, actionType, and initial count", async () => {
    await recordUsage("u1", "startupCreate", 1);
    const call = mockedDb.usageLedger.upsert.mock.calls[0][0] as {
      create: Record<string, unknown>;
    };
    expect(call.create.userId).toBe("u1");
    expect(call.create.actionType).toBe("startupCreate");
    expect(call.create.count).toBe(1);
  });

  it("periodStart and periodEnd are first-day-of-month boundaries", async () => {
    await recordUsage("u1", "aiAnalysis");
    const call = mockedDb.usageLedger.upsert.mock.calls[0][0] as {
      create: { periodStart: Date; periodEnd: Date };
    };
    const start = call.create.periodStart;
    const end = call.create.periodEnd;
    // start is the 1st of the current month
    expect(start.getDate()).toBe(1);
    // end is the 1st of the NEXT month
    expect(end > start).toBe(true);
    const nextMonthFirst = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    expect(end.getTime()).toBe(nextMonthFirst.getTime());
  });
});

// ---------------------------------------------------------------------------
// createOrUpdateLeaderboardEntry
// ---------------------------------------------------------------------------
describe("createOrUpdateLeaderboardEntry — upsert idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedDb.leaderboardEntry.upsert.mockResolvedValue({ id: "entry-1" });
  });

  it("calls upsert so a second finalization updates rather than duplicates", async () => {
    await createOrUpdateLeaderboardEntry("s1", "u1", 1000, 5_000_000, 50_000, 12, "completed");
    expect(mockedDb.leaderboardEntry.upsert).toHaveBeenCalledTimes(1);
  });

  it("WHERE key is the compound unique name: startupId_category_season", async () => {
    await createOrUpdateLeaderboardEntry("s1", "u1", 1000, 5_000_000, 50_000, 12, "completed");
    const call = mockedDb.leaderboardEntry.upsert.mock.calls[0][0] as {
      where: Record<string, unknown>;
    };
    expect(call.where.startupId_category_season).toBeDefined();
    expect(call.where.startupId_category_season).toMatchObject({
      startupId: "s1",
      category: "overall",
      season: "beta-season-1",
    });
  });

  it("UPDATE clause overwrites score with new value (not increments)", async () => {
    await createOrUpdateLeaderboardEntry("s1", "u1", 2500, 12_000_000, 120_000, 18, "acquired");
    const call = mockedDb.leaderboardEntry.upsert.mock.calls[0][0] as {
      update: Record<string, unknown>;
    };
    expect(call.update.score).toBe(2500);
    expect(call.update.valuation).toBe(12_000_000);
    expect(call.update.outcome).toBe("acquired");
  });

  it("CREATE clause includes all identity fields", async () => {
    await createOrUpdateLeaderboardEntry("s2", "u2", 500, 1_000_000, 5_000, 6, "dead", "saas", "season-2");
    const call = mockedDb.leaderboardEntry.upsert.mock.calls[0][0] as {
      create: Record<string, unknown>;
    };
    expect(call.create.startupId).toBe("s2");
    expect(call.create.userId).toBe("u2");
    expect(call.create.category).toBe("saas");
    expect(call.create.season).toBe("season-2");
  });
});
