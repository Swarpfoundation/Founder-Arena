import { describe, it, expect, vi, beforeEach } from "vitest";
import { recomputeStartupBaseBurn } from "@/lib/economy/recompute-burn";

/**
 * Unit tests for the burn invariant helper.
 *
 * The helper is the single source of truth for `startup.monthlyBurn`.
 * Invariant: monthlyBurn = sum(active employee salaries) + office.monthlyCost.
 */

interface FakeDb {
  startup: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  employee: {
    findMany: ReturnType<typeof vi.fn>;
  };
}

function makeFakeDb(opts: {
  workSetup: string;
  activeEmployeeSalaries: number[];
}): FakeDb & { _updates: Array<Record<string, unknown>> } {
  const updates: Array<Record<string, unknown>> = [];
  return {
    startup: {
      findUnique: vi.fn(async () => ({ workSetup: opts.workSetup })),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data);
        return data;
      }),
    },
    employee: {
      findMany: vi.fn(async () =>
        opts.activeEmployeeSalaries.map((salary) => ({ salary }))
      ),
    },
    _updates: updates,
  };
}

describe("recomputeStartupBaseBurn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses office cost when there are no employees (post-funding init)", async () => {
    const db = makeFakeDb({ workSetup: "small_office", activeEmployeeSalaries: [] });
    const res = await recomputeStartupBaseBurn(db as never, "startup-1");
    expect(res.payrollMonthly).toBe(0);
    // small_office is $8K/mo per lib/economy/office-costs.ts
    expect(res.officeMonthly).toBe(8000);
    expect(res.baseBurn).toBe(8000);
    expect(db._updates[0]).toMatchObject({
      monthlyBurn: 8000,
      officeMonthlyCost: 8000,
    });
  });

  it("payroll = sum of active salaries + office", async () => {
    const db = makeFakeDb({
      workSetup: "coworking",
      activeEmployeeSalaries: [10000, 15000, 25000],
    });
    const res = await recomputeStartupBaseBurn(db as never, "startup-1");
    expect(res.payrollMonthly).toBe(50000);
    // coworking is $3K/mo
    expect(res.officeMonthly).toBe(3000);
    expect(res.baseBurn).toBe(53000);
  });

  it("remote office contributes zero", async () => {
    const db = makeFakeDb({
      workSetup: "remote",
      activeEmployeeSalaries: [12000],
    });
    const res = await recomputeStartupBaseBurn(db as never, "startup-1");
    expect(res.officeMonthly).toBe(0);
    expect(res.baseBurn).toBe(12000);
  });

  it("premium_office contributes $20K/mo", async () => {
    const db = makeFakeDb({
      workSetup: "premium_office",
      activeEmployeeSalaries: [20000, 20000],
    });
    const res = await recomputeStartupBaseBurn(db as never, "startup-1");
    expect(res.officeMonthly).toBe(20000);
    expect(res.baseBurn).toBe(60000);
  });

  it("unknown workSetup falls back to first office option (remote=$0)", async () => {
    const db = makeFakeDb({
      workSetup: "lunar-base",
      activeEmployeeSalaries: [],
    });
    const res = await recomputeStartupBaseBurn(db as never, "startup-1");
    expect(res.officeMonthly).toBe(0);
    expect(res.baseBurn).toBe(0);
  });

  it("throws if startup is missing", async () => {
    const db: FakeDb = {
      startup: {
        findUnique: vi.fn(async () => null),
        update: vi.fn(),
      },
      employee: { findMany: vi.fn(async () => []) },
    };
    await expect(
      recomputeStartupBaseBurn(db as never, "ghost")
    ).rejects.toThrow(/not found/i);
  });
});
