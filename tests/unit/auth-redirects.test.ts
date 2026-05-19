import { describe, expect, it } from "vitest";
import { getLandingCtaState, sanitizeAuthCallbackUrl } from "@/lib/auth-redirects";

describe("auth redirect helpers", () => {
  it("falls back to dashboard for empty callback values", () => {
    expect(sanitizeAuthCallbackUrl(undefined)).toBe("/dashboard");
    expect(sanitizeAuthCallbackUrl(null)).toBe("/dashboard");
    expect(sanitizeAuthCallbackUrl("")).toBe("/dashboard");
  });

  it("allows internal app paths", () => {
    expect(sanitizeAuthCallbackUrl("/dashboard")).toBe("/dashboard");
    expect(sanitizeAuthCallbackUrl("/startup/abc")).toBe("/startup/abc");
  });

  it("rejects external, protocol-relative, login, and api callback paths", () => {
    expect(sanitizeAuthCallbackUrl("https://evil.com")).toBe("/dashboard");
    expect(sanitizeAuthCallbackUrl("//evil.com")).toBe("/dashboard");
    expect(sanitizeAuthCallbackUrl("/login")).toBe("/dashboard");
    expect(sanitizeAuthCallbackUrl("/login?callbackUrl=/dashboard")).toBe("/dashboard");
    expect(sanitizeAuthCallbackUrl("/api/auth/signin")).toBe("/dashboard");
  });

  it("returns logged-out landing CTA state", () => {
    expect(getLandingCtaState(false)).toMatchObject({
      primaryHref: "/startup/new",
      primaryLabel: "START NEW RUN",
      secondaryHref: "/login",
      secondaryLabel: "LOGIN",
    });
  });

  it("returns authenticated landing CTA state", () => {
    expect(getLandingCtaState(true)).toMatchObject({
      primaryHref: "/dashboard",
      primaryLabel: "CONTINUE FOUNDER ARENA",
      secondaryHref: "/startup/new",
      secondaryLabel: "DEPLOY NEW RUN",
    });
  });
});
