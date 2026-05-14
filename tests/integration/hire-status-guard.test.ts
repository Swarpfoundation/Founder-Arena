import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Integration tests for hireEmployeeAction startup status guard.
 *
 * Verifies that dead / completed / draft startups cannot hire employees.
 * The funded / active check was added in the first hardening pass; this
 * file is the regression guard.
 */

const TEST_USER = { id: "user-1", email: "u@test", name: "U" };

function makeStartup(status: string) {
  return {
    id: "startup-1",
    userId: "user-1",
    region: "united states",
    sector: "AI / ML",
    status,
    cash: 800_000,
    monthlyBurn: 8_000,
    revenue: 0,
    workSetup: "small_office",
    employees: [],
    simulationMonths: [],
  };
}

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

let mockStartup: ReturnType<typeof makeStartup>;

const writes = { employees: [] as Array<Record<string, unknown>> };

vi.mock("@/lib/db", () => {
  const fakeTx = {
    employee: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        writes.employees.push(data);
        return { id: "emp-1", ...data };
      }),
      findMany: vi.fn(async () => []),
    },
    startup: {
      findUnique: vi.fn(async () => ({ workSetup: "small_office" })),
      update: vi.fn(async () => ({})),
    },
  };
  return {
    db: {
      startup: { findUnique: vi.fn(async () => mockStartup) },
      $transaction: vi.fn(async (fn: (tx: typeof fakeTx) => Promise<unknown>) => fn(fakeTx)),
    },
  };
});

import { hireEmployeeAction } from "@/lib/actions/team";
import { generateCandidateAtIndex } from "@/lib/team/candidates";

describe("hireEmployeeAction — startup status guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writes.employees = [];
  });

  it("allows hiring for a funded startup", async () => {
    mockStartup = makeStartup("funded");
    const cand = generateCandidateAtIndex("startup-1", 1, "AI / ML", 0)!;
    await expect(hireEmployeeAction("startup-1", cand.id)).resolves.toMatchObject({ success: true });
  });

  it("allows hiring for an active startup", async () => {
    mockStartup = makeStartup("active");
    const cand = generateCandidateAtIndex("startup-1", 1, "AI / ML", 0)!;
    await expect(hireEmployeeAction("startup-1", cand.id)).resolves.toMatchObject({ success: true });
  });

  it("blocks hiring for a dead startup", async () => {
    mockStartup = makeStartup("dead");
    const cand = generateCandidateAtIndex("startup-1", 1, "AI / ML", 0)!;
    await expect(hireEmployeeAction("startup-1", cand.id)).rejects.toThrow(/not in operating phase/);
    expect(writes.employees).toHaveLength(0);
  });

  it("blocks hiring for a completed startup", async () => {
    mockStartup = makeStartup("completed");
    const cand = generateCandidateAtIndex("startup-1", 1, "AI / ML", 0)!;
    await expect(hireEmployeeAction("startup-1", cand.id)).rejects.toThrow(/not in operating phase/);
    expect(writes.employees).toHaveLength(0);
  });

  it("blocks hiring for a draft startup", async () => {
    mockStartup = makeStartup("draft");
    const cand = generateCandidateAtIndex("startup-1", 1, "AI / ML", 0)!;
    await expect(hireEmployeeAction("startup-1", cand.id)).rejects.toThrow(/not in operating phase/);
    expect(writes.employees).toHaveLength(0);
  });
});
