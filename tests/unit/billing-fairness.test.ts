import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Fairness rule: paid plans must NOT gate score-affecting mechanics.
 * Free users must be able to access the growth phase if their startup earns it.
 */

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { checkGrowthAccess } from "@/lib/billing/entitlements";
import { db } from "@/lib/db";

const mockedDb = db as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
};

describe("checkGrowthAccess (fairness)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("free user can access growth phase", async () => {
    mockedDb.user.findUnique.mockResolvedValue({ plan: "free" });
    const r = await checkGrowthAccess("user-free");
    expect(r.allowed).toBe(true);
    expect(r.reason).toBeUndefined();
  });

  it("pro user can access growth phase", async () => {
    mockedDb.user.findUnique.mockResolvedValue({ plan: "pro" });
    const r = await checkGrowthAccess("user-pro");
    expect(r.allowed).toBe(true);
  });

  it("max user can access growth phase", async () => {
    mockedDb.user.findUnique.mockResolvedValue({ plan: "max" });
    const r = await checkGrowthAccess("user-max");
    expect(r.allowed).toBe(true);
  });

  it("user with no plan record still allowed (defaults to free)", async () => {
    mockedDb.user.findUnique.mockResolvedValue(null);
    const r = await checkGrowthAccess("ghost");
    expect(r.allowed).toBe(true);
  });
});
