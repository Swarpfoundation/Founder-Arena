import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Integration tests for fireEmployeeAction startup status guard.
 *
 * Verifies that dead / completed / acquired / draft startups cannot have
 * employees fired (which would incorrectly mutate game economics).
 */

const TEST_USER = { id: "user-1", email: "u@test", name: "U" };
const ACTIVE_EMPLOYEE = { id: "emp-1", status: "active", notes: null };

function makeStartup(status: string) {
  return {
    id: "startup-1",
    userId: "user-1",
    status,
    employees: [ACTIVE_EMPLOYEE],
    simulationMonths: [],
  };
}

vi.mock("@/lib/auth-helpers", () => ({
  requireCurrentUser: vi.fn(async () => TEST_USER),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

let mockStartup: ReturnType<typeof makeStartup>;

vi.mock("@/lib/db", () => {
  const fakeTx = {
    employee: {
      update: vi.fn(async () => ({})),
      findMany: vi.fn(async () => []),
    },
    startup: {
      findUnique: vi.fn(async () => ({ workSetup: "remote" })),
      update: vi.fn(async () => ({})),
    },
  };
  return {
    db: {
      startup: {
        findUnique: vi.fn(async () => mockStartup),
      },
      $transaction: vi.fn(async (fn: (tx: typeof fakeTx) => Promise<unknown>) => fn(fakeTx)),
    },
  };
});

import { fireEmployeeAction } from "@/lib/actions/team";

describe("fireEmployeeAction — startup status guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows firing from a funded startup", async () => {
    mockStartup = makeStartup("funded");
    await expect(fireEmployeeAction("startup-1", "emp-1")).resolves.toMatchObject({ success: true });
  });

  it("allows firing from an active startup", async () => {
    mockStartup = makeStartup("active");
    await expect(fireEmployeeAction("startup-1", "emp-1")).resolves.toMatchObject({ success: true });
  });

  it("blocks firing from a dead startup", async () => {
    mockStartup = makeStartup("dead");
    await expect(fireEmployeeAction("startup-1", "emp-1")).rejects.toThrow(/not in operating phase/);
  });

  it("blocks firing from a completed startup", async () => {
    mockStartup = makeStartup("completed");
    await expect(fireEmployeeAction("startup-1", "emp-1")).rejects.toThrow(/not in operating phase/);
  });

  it("blocks firing from a draft startup", async () => {
    mockStartup = makeStartup("draft");
    await expect(fireEmployeeAction("startup-1", "emp-1")).rejects.toThrow(/not in operating phase/);
  });
});
