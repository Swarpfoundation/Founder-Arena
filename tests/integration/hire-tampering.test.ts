import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Integration test for hireEmployeeAction.
 *
 * Verifies that the Phase 26A fix is actually wired through the action
 * layer: the server ignores client-supplied salary/impacts and persists
 * canonical (cost-engine + salary-bands) values.
 */

// Track DB writes
const writes = {
  employees: [] as Array<Record<string, unknown>>,
  startupUpdates: [] as Array<Record<string, unknown>>,
};

const TEST_USER = { id: "user-1", email: "u@test", name: "U" };
const TEST_STARTUP = {
  id: "startup-1",
  userId: "user-1",
  region: "united states",
  sector: "AI / ML",
  status: "funded",
  cash: 800_000,
  monthlyBurn: 8000, // small_office only
  revenue: 0,
  workSetup: "small_office",
  employees: [],
  simulationMonths: [],
};

vi.mock("@/lib/auth-helpers", () => ({
  requireCurrentUser: vi.fn(async () => TEST_USER),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => null),
}));

vi.mock("@/lib/game/founder-progression", () => ({
  getOrCreateFounderProfile: vi.fn(async () => ({ id: "profile-1" })),
}));

vi.mock("@/lib/game/achievements", () => ({
  evaluateAchievementsForHire: vi.fn(async () => []),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => {
  const fakeTx = {
    employee: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        writes.employees.push(data);
        return { id: `emp-${writes.employees.length}`, ...data };
      }),
      findMany: vi.fn(async () =>
        writes.employees
          .filter((e) => e.status === "active")
          .map((e) => ({ salary: e.salary as number }))
      ),
    },
    startup: {
      findUnique: vi.fn(async () => ({ workSetup: TEST_STARTUP.workSetup })),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        writes.startupUpdates.push(data);
        return data;
      }),
    },
  };

  return {
    db: {
      startup: {
        findUnique: vi.fn(async () => TEST_STARTUP),
      },
      $transaction: vi.fn(async (fn: (tx: typeof fakeTx) => Promise<unknown>) => {
        return fn(fakeTx);
      }),
    },
  };
});

import { hireEmployeeAction } from "@/lib/actions/team";

describe("hireEmployeeAction (Phase 26A regression)", () => {
  beforeEach(() => {
    writes.employees = [];
    writes.startupUpdates = [];
  });

  it("ignores client-supplied salary=1 and persists cost-engine value", async () => {
    // Discover a real candidate id for month 1
    const { generateCandidateAtIndex, getCanonicalCandidateValues } = await import(
      "@/lib/team/candidates"
    );
    const cand = generateCandidateAtIndex(TEST_STARTUP.id, 1, TEST_STARTUP.sector, 0);
    expect(cand).not.toBeNull();
    const expected = getCanonicalCandidateValues(cand!, TEST_STARTUP.region);

    // Tampered payload: client tries salary=1 and absurd impacts
    await hireEmployeeAction(TEST_STARTUP.id, {
      id: cand!.id,
      // @ts-expect-error tampering test
      salary: 1,
      productImpact: 999,
      revenueImpact: 999,
      riskImpact: -99,
      investorImpact: 99,
    });

    expect(writes.employees).toHaveLength(1);
    const persisted = writes.employees[0];
    expect(persisted.salary).toBe(expected.salary);
    expect(persisted.salary).not.toBe(1);

    const effects = persisted.effectJson as Record<string, number>;
    expect(effects.productImpact).toBe(expected.productImpact);
    expect(effects.productImpact).not.toBe(999);
    expect(effects.revenueImpact).toBe(expected.revenueImpact);
    expect(effects.investorImpact).toBe(expected.investorImpact);
  });

  it("rejects unknown candidate id format", async () => {
    await expect(
      hireEmployeeAction(TEST_STARTUP.id, { id: "not-a-real-id" })
    ).rejects.toThrow(/Invalid candidate/);
    expect(writes.employees).toHaveLength(0);
  });

  it("rejects out-of-range candidate index", async () => {
    await expect(
      hireEmployeeAction(TEST_STARTUP.id, { id: "cand-1-99" })
    ).rejects.toThrow(/not in pool/);
    expect(writes.employees).toHaveLength(0);
  });

  it("rejects candidate from a stale month", async () => {
    // The stub startup has no simulationMonths, so currentMonth=0, expectedMonth=1
    await expect(
      hireEmployeeAction(TEST_STARTUP.id, { id: "cand-7-0" })
    ).rejects.toThrow(/no longer available/);
  });

  it("recomputes startup base burn after a successful hire", async () => {
    const { generateCandidateAtIndex, getCanonicalCandidateValues } = await import(
      "@/lib/team/candidates"
    );
    const cand = generateCandidateAtIndex(TEST_STARTUP.id, 1, TEST_STARTUP.sector, 0);
    const expected = getCanonicalCandidateValues(cand!, TEST_STARTUP.region);

    await hireEmployeeAction(TEST_STARTUP.id, { id: cand!.id });

    // recomputeStartupBaseBurn should have written a new monthlyBurn
    expect(writes.startupUpdates.length).toBeGreaterThan(0);
    const last = writes.startupUpdates[writes.startupUpdates.length - 1];
    expect(last.monthlyBurn).toBe(expected.salary + 8000); // payroll + small_office
    expect(last.officeMonthlyCost).toBe(8000);
  });
});
