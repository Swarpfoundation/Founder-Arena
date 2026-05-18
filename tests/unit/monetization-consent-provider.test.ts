import { describe, expect, it } from "vitest";
import {
  evaluateConsentForRewardedAds,
  adConsentStateFromSettings,
  canUseMockRewardedAds,
  createAdConsentAuditEntry,
  getDefaultAdPrivacySettings,
  getDefaultAdConsentState,
  normalizeAdConsentAuditEntry,
  parseAdConsentState,
  recordMockConsentPreference,
  resetAdPrivacySettings,
  revokeAdConsent,
  revokeFutureRealAds,
  serializeAdConsentState,
  updateMockRewardPreference,
} from "@/lib/monetization/consent";
import {
  buildRewardedAdSafeContext,
  containsForbiddenRewardedAdContextFields,
  getRewardedAdProvider,
} from "@/lib/monetization/rewarded-ads";

describe("ad consent manager", () => {
  it("blocks real rewarded providers by default", () => {
    const consent = getDefaultAdConsentState({ userId: "user-1", now: "2026-05-17T12:00:00.000Z" });
    const decision = evaluateConsentForRewardedAds(consent);

    expect(decision.canRequestAds).toBe(false);
    expect(decision.canRequestPersonalizedAds).toBe(false);
    expect(decision.requiresLegalReview).toBe(true);
    expect(decision.reason).toContain("blocked by default");
  });

  it("allows mock provider conceptually without real ad consent", () => {
    const consent = getDefaultAdConsentState();
    const decision = evaluateConsentForRewardedAds(consent);
    const provider = getRewardedAdProvider("mock");

    expect(provider.getStatus({ consentDecision: decision, runtime: "server", mockMode: true })).toBe("available");
  });

  it("revoked consent blocks real providers", () => {
    const consent = revokeAdConsent({
      existing: getDefaultAdConsentState(),
      now: "2026-05-17T12:00:00.000Z",
    });
    const decision = evaluateConsentForRewardedAds(consent);

    expect(consent.status).toBe("revoked");
    expect(decision.canRequestAds).toBe(false);
    expect(decision.reason).toContain("revoked");
  });

  it("EEA/UK/Switzerland requires CMP before real ads", () => {
    const consent = {
      ...getDefaultAdConsentState(),
      region: "eea_uk_ch" as const,
    };
    const decision = evaluateConsentForRewardedAds(consent);

    expect(decision.canRequestAds).toBe(false);
    expect(decision.requiresCmp).toBe(true);
    expect(decision.reason).toContain("CMP");
  });

  it("serializes and parses mock settings preferences", () => {
    const consent = recordMockConsentPreference({
      existing: getDefaultAdConsentState({ userId: "u1" }),
      personalizationMode: "non_personalized",
      now: "2026-05-17T12:00:00.000Z",
    });
    const parsed = parseAdConsentState(serializeAdConsentState(consent));

    expect(parsed.status).toBe("granted_non_personalized");
    expect(parsed.personalizationMode).toBe("non_personalized");
    expect(parsed.source).toBe("mock_settings");
  });
});

describe("persistent ad privacy settings model", () => {
  it("defaults to real ads disabled and mock offers visible", () => {
    const settings = getDefaultAdPrivacySettings({ userId: "user-1", now: "2026-05-17T12:00:00.000Z" });
    const consent = adConsentStateFromSettings(settings);
    const decision = evaluateConsentForRewardedAds(consent);

    expect(settings.realAdsDisabled).toBe(true);
    expect(settings.mockRewardOffersDisabled).toBe(false);
    expect(canUseMockRewardedAds(consent, settings)).toBe(true);
    expect(decision.canRequestAds).toBe(false);
  });

  it("persisted mock-off blocks mock reward offers", () => {
    const settings = updateMockRewardPreference({
      existing: getDefaultAdPrivacySettings({ userId: "user-1" }),
      disabled: true,
      now: "2026-05-17T12:00:00.000Z",
    });

    expect(settings.mockRewardOffersDisabled).toBe(true);
    expect(settings.rewardedAdsOptOut).toBe(true);
    expect(canUseMockRewardedAds(adConsentStateFromSettings(settings), settings)).toBe(false);
  });

  it("persisted mock-on allows mock offers when otherwise eligible", () => {
    const disabled = updateMockRewardPreference({
      existing: getDefaultAdPrivacySettings({ userId: "user-1" }),
      disabled: true,
    });
    const enabled = updateMockRewardPreference({ existing: disabled, disabled: false });

    expect(enabled.mockRewardOffersDisabled).toBe(false);
    expect(enabled.rewardedAdsOptOut).toBe(false);
    expect(canUseMockRewardedAds(adConsentStateFromSettings(enabled), enabled)).toBe(true);
  });

  it("revocation blocks real provider while keeping realAdsDisabled true", () => {
    const revoked = revokeFutureRealAds({
      existing: getDefaultAdPrivacySettings({ userId: "user-1" }),
      now: "2026-05-17T12:00:00.000Z",
    });
    const decision = evaluateConsentForRewardedAds(adConsentStateFromSettings(revoked));

    expect(revoked.realAdsDisabled).toBe(true);
    expect(revoked.consentStatus).toBe("revoked");
    expect(decision.canRequestAds).toBe(false);
  });

  it("reset returns safe defaults", () => {
    const revoked = revokeFutureRealAds({ existing: getDefaultAdPrivacySettings({ userId: "user-1" }) });
    const reset = resetAdPrivacySettings({ existing: revoked, now: "2026-05-17T12:00:00.000Z" });

    expect(reset.realAdsDisabled).toBe(true);
    expect(reset.consentStatus).toBe("unknown");
    expect(reset.mockRewardOffersDisabled).toBe(false);
  });

  it("creates safe audit entries without private metadata", () => {
    const previous = getDefaultAdPrivacySettings({ userId: "user-1" });
    const next = updateMockRewardPreference({ existing: previous, disabled: true });
    const entry = createAdConsentAuditEntry({
      id: "audit-1",
      userId: "user-1",
      action: "mock_offers_disabled",
      previous,
      next,
      reason: "User disabled mock rewards.",
      now: "2026-05-17T12:00:00.000Z",
      metadataSafe: {
        surface: "settings_ads",
        provider: "mock",
        email: "founder@example.com",
        pitchText: "secret pitch",
        cash: 100000,
      },
    });
    const normalized = normalizeAdConsentAuditEntry({ auditEntry: entry });

    expect(normalized?.metadataSafe).toEqual({ surface: "settings_ads", provider: "mock" });
    expect(JSON.stringify(entry)).not.toContain("founder@example.com");
    expect(JSON.stringify(entry)).not.toContain("secret pitch");
  });
});

describe("rewarded ad provider adapters", () => {
  it("mock provider completes without server-side provider verification", () => {
    const consentDecision = evaluateConsentForRewardedAds(getDefaultAdConsentState());
    const provider = getRewardedAdProvider("mock");
    const request = {
      placement: "review_queue_acceleration" as const,
      rewardType: "review_queue_accelerator" as const,
      ledgerEntryId: "ledger-1",
      reviewId: "review-1",
      consentDecision,
      mockMode: true,
    };

    expect(provider.start(request)).toMatchObject({
      provider: "mock",
      status: "pending_verification",
      verificationRequired: false,
    });
    expect(provider.complete(request)).toMatchObject({
      provider: "mock",
      status: "completed",
      verificationRequired: false,
    });
  });

  it("future Google GPT provider is disabled", () => {
    const consentDecision = evaluateConsentForRewardedAds(getDefaultAdConsentState());
    const provider = getRewardedAdProvider("google_gpt_web_future");

    expect(provider.getStatus({ consentDecision, runtime: "server", mockMode: false })).toBe("disabled");
    expect(provider.start({
      placement: "review_queue_acceleration",
      rewardType: "review_queue_accelerator",
      ledgerEntryId: "ledger-1",
      consentDecision,
      mockMode: false,
    })).toMatchObject({
      status: "failed",
      verificationRequired: true,
      errorCode: "provider_disabled_phase_18c",
    });
  });

  it("future AdMob providers are unsupported in the web runtime", () => {
    const consentDecision = evaluateConsentForRewardedAds(getDefaultAdConsentState());

    expect(getRewardedAdProvider("admob_ios_future").getStatus({ consentDecision, runtime: "server", mockMode: false })).toBe("unsupported");
    expect(getRewardedAdProvider("admob_android_future").getStatus({ consentDecision, runtime: "server", mockMode: false })).toBe("unsupported");
  });
});

describe("rewarded ad data minimization", () => {
  it("builds a safe context without private startup or founder fields", () => {
    const context = buildRewardedAdSafeContext({
      placement: "review_queue_acceleration",
      rewardType: "review_queue_accelerator",
      ledgerEntryId: "ledger-1",
      provider: "mock",
      routeContext: "/startup/private-id/pitch?unsafe=<>",
      startup: {
        startupName: "Private Startup",
        pitchText: "secret pitch",
        financialPlan: "secret plan",
        cash: 100000,
        investorScore: 90,
      },
      user: {
        email: "founder@example.com",
        name: "Private Founder",
      },
    });

    expect(context).toEqual({
      placement: "review_queue_acceleration",
      rewardType: "review_queue_accelerator",
      ledgerEntryId: "ledger-1",
      provider: "mock",
      routeContext: "/startup/private-id/pitchunsafe",
      appMode: "mock",
    });
    expect(containsForbiddenRewardedAdContextFields({ ...context })).toBe(false);
    expect(JSON.stringify(context)).not.toContain("secret");
    expect(JSON.stringify(context)).not.toContain("founder@example.com");
  });
});
