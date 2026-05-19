import { describe, expect, it, vi, afterEach } from "vitest";

const demoUser = {
  id: "demo-user",
  email: "demo@founderarena.local",
  name: "Demo Founder",
};

async function loadAuthHelpers(demoMode: boolean, existingDemoUser: unknown = null) {
  vi.resetModules();
  process.env.DEMO_MODE_ENABLED = demoMode ? "true" : "false";

  const auth = vi.fn(async () => null);
  const findUnique = vi.fn(async () => existingDemoUser);
  const create = vi.fn(async () => demoUser);
  const redirect = vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  });

  vi.doMock("@/lib/auth", () => ({ auth }));
  vi.doMock("@/lib/db", () => ({
    db: {
      user: {
        findUnique,
        create,
      },
    },
  }));
  vi.doMock("next/navigation", () => ({ redirect }));

  const helpers = await import("@/lib/auth-helpers");
  return { helpers, auth, findUnique, create, redirect };
}

afterEach(() => {
  vi.doUnmock("@/lib/auth");
  vi.doUnmock("@/lib/db");
  vi.doUnmock("next/navigation");
  vi.resetModules();
  delete process.env.DEMO_MODE_ENABLED;
});

describe("auth helpers demo-mode fallback", () => {
  it("requireCurrentUser returns the dev demo user when demo mode is enabled", async () => {
    const { helpers, findUnique, create } = await loadAuthHelpers(true);

    const user = await helpers.requireCurrentUser();

    expect(user).toEqual(demoUser);
    expect(findUnique).toHaveBeenCalledWith({ where: { email: "demo@founderarena.local" } });
    expect(create).toHaveBeenCalledWith({
      data: {
        email: "demo@founderarena.local",
        name: "Demo Founder",
      },
    });
  });

  it("requireCurrentUser still rejects anonymous users when demo mode is disabled", async () => {
    const { helpers } = await loadAuthHelpers(false);

    await expect(helpers.requireCurrentUser()).rejects.toThrow("Unauthorized");
  });

  it("requireAuthRedirect does not redirect in local demo mode", async () => {
    const { helpers, redirect } = await loadAuthHelpers(true, demoUser);

    const user = await helpers.requireAuthRedirect("/dashboard");

    expect(user).toEqual(demoUser);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("requireAuthRedirect preserves protected redirects when demo mode is disabled", async () => {
    const { helpers } = await loadAuthHelpers(false);

    await expect(helpers.requireAuthRedirect("/dashboard")).rejects.toThrow(
      "redirect:/login?callbackUrl=%2Fdashboard"
    );
  });
});
