import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { updateMobileStartupForUser } from "@/lib/startups/mobile-api";

vi.mock("@/lib/db", () => ({
  db: {
    startup: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const startupRecord = {
  id: "startup-1",
  userId: "user-1",
  name: "VaultPay",
  tagline: "Wallet infrastructure",
  description: "Wallet infrastructure for marketplace operators",
  sector: "Fintech",
  region: "Europe",
  stage: "idea",
  targetMarket: "marketplace operators",
  monetizationModel: "Subscription",
  status: "draft",
  problem: "Marketplace operators need a clear way to manage payout and custody risk.",
  solution: "VaultPay maps payment operations into a compliance-aware workflow.",
  unfairAdvantage: "Payments founder-market fit",
  fundingAsk: 500_000,
  cash: 0,
  monthlyBurn: 0,
  valuation: 0,
  profile: {
    companyName: "VaultPay",
    city: "London",
    country: "United Kingdom",
    problem: "Marketplaces need a custody path.",
    solution: "VaultPay maps custody responsibilities before launch.",
    logoUploadKey: "private/logo.png",
  },
  createdAt: new Date("2026-06-12T10:00:00.000Z"),
  updatedAt: new Date("2026-06-12T10:00:00.000Z"),
};

const mockedDb = db as unknown as {
  startup: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

describe("mobile startup PATCH API helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedDb.startup.findUnique.mockResolvedValue(startupRecord);
    mockedDb.startup.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...startupRecord,
      ...data,
      userId: undefined,
      updatedAt: new Date("2026-06-12T11:00:00.000Z"),
      _count: { simulationMonths: 0 },
    }));
  });

  it("allows the owner to patch safe profile fields", async () => {
    const result = await updateMobileStartupForUser({
      userId: "user-1",
      startupId: "startup-1",
      body: {
        city: "Berlin",
        countryCode: "de",
        problem: "Marketplaces need clearer custody and payout responsibility before launch.",
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(mockedDb.startup.update).toHaveBeenCalledOnce();
    expect(result.startup.city).toBe("Berlin");
    expect(result.startup.countryCode).toBe("DE");
    expect(JSON.stringify(result.startup)).not.toContain("private/logo.png");
    expect(JSON.stringify(result.startup)).not.toContain("user-1");
  });

  it("allows admin access without changing safe response shape", async () => {
    const result = await updateMobileStartupForUser({
      userId: "admin-1",
      startupId: "startup-1",
      isAdmin: true,
      body: { stage: "mvp" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.startup.stage).toBe("mvp");
    expect(JSON.stringify(result.startup)).not.toContain("userId");
  });

  it("does not let another user patch the startup", async () => {
    const result = await updateMobileStartupForUser({
      userId: "user-2",
      startupId: "startup-1",
      body: { city: "Paris" },
    });

    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(mockedDb.startup.update).not.toHaveBeenCalled();
  });

  it("rejects forbidden and invalid fields before updating", async () => {
    const result = await updateMobileStartupForUser({
      userId: "user-1",
      startupId: "startup-1",
      body: {
        cash: 99_000_000,
      },
    });

    expect(result).toMatchObject({
      ok: false,
      status: 400,
      errorCategory: "forbidden_field",
    });
    expect(mockedDb.startup.findUnique).not.toHaveBeenCalled();
    expect(mockedDb.startup.update).not.toHaveBeenCalled();
  });
});
