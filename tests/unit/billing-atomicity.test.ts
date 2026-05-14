import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Regression tests for spendToken atomic conditional decrement.
 *
 * spendToken uses updateMany with WHERE speedTokens > 0 so that two
 * concurrent requests with a balance of 1 cannot both succeed — only one
 * row matches the condition.  count === 0 is treated as failure without a
 * separate read.
 */

vi.mock("@/lib/db", () => ({
  db: {
    creditWallet: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { spendToken } from "@/lib/billing/credits";
import { db } from "@/lib/db";

const mockedDb = db as unknown as {
  creditWallet: {
    updateMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
};

describe("spendToken — atomic conditional decrement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns failure when no wallet exists (updateMany count = 0)", async () => {
    mockedDb.creditWallet.updateMany.mockResolvedValue({ count: 0 });
    const result = await spendToken("user-empty");
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("returns failure when balance is already zero (updateMany count = 0)", async () => {
    mockedDb.creditWallet.updateMany.mockResolvedValue({ count: 0 });
    const result = await spendToken("user-zero-balance");
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("returns success and remaining count when balance is positive", async () => {
    mockedDb.creditWallet.updateMany.mockResolvedValue({ count: 1 });
    mockedDb.creditWallet.findUnique.mockResolvedValue({ speedTokens: 4 });
    const result = await spendToken("user-rich");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("WHERE clause uses speedTokens > 0 to guard against negative balance", async () => {
    mockedDb.creditWallet.updateMany.mockResolvedValue({ count: 1 });
    mockedDb.creditWallet.findUnique.mockResolvedValue({ speedTokens: 0 });
    await spendToken("user-guard-check");
    const callArg = mockedDb.creditWallet.updateMany.mock.calls[0][0] as {
      where: { speedTokens: unknown };
    };
    expect(callArg.where.speedTokens).toEqual({ gt: 0 });
  });

  it("does not call findUnique when updateMany returns count 0 (short-circuit)", async () => {
    mockedDb.creditWallet.updateMany.mockResolvedValue({ count: 0 });
    await spendToken("user-no-read");
    expect(mockedDb.creditWallet.findUnique).not.toHaveBeenCalled();
  });

  it("decrement data includes tokensUsed increment", async () => {
    mockedDb.creditWallet.updateMany.mockResolvedValue({ count: 1 });
    mockedDb.creditWallet.findUnique.mockResolvedValue({ speedTokens: 2 });
    await spendToken("user-data-check");
    const callArg = mockedDb.creditWallet.updateMany.mock.calls[0][0] as {
      data: { speedTokens: unknown; tokensUsed: unknown };
    };
    expect(callArg.data.speedTokens).toEqual({ decrement: 1 });
    expect(callArg.data.tokensUsed).toEqual({ increment: 1 });
  });
});
