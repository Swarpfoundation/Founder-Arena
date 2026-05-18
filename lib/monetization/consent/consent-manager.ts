import type {
  AdConsentState,
  AdPersonalizationMode,
  ConsentDecision,
  ConsentRegion,
  ConsentStatus,
} from "./types";
import { canShowMockRewardOffers, type AdPrivacySettings } from "./ad-privacy-settings";

export const AD_CONSENT_VERSION = "ad-consent-v0.1" as const;
export const MOCK_REWARD_OFFERS_DISABLED_STORAGE_KEY = "founder-arena.mock-reward-offers-disabled";

export function getDefaultAdConsentState(input?: {
  userId?: string;
  profileId?: string;
  now?: Date | string;
}): AdConsentState {
  return {
    version: AD_CONSENT_VERSION,
    userId: input?.userId,
    profileId: input?.profileId,
    region: "unknown",
    status: "unknown",
    personalizationMode: "unknown",
    tcfStringPresent: false,
    lastUpdatedAt: toIso(input?.now ?? new Date()),
    source: "system_default",
  };
}

export function adConsentStateFromSettings(settings: AdPrivacySettings): AdConsentState {
  return {
    version: AD_CONSENT_VERSION,
    userId: settings.userId,
    profileId: settings.profileId,
    region: settings.region,
    status: settings.consentStatus,
    personalizationMode: settings.personalizationMode,
    tcfStringPresent: false,
    revokedAt: settings.consentStatus === "revoked" ? settings.lastUpdatedAt : undefined,
    lastUpdatedAt: settings.lastUpdatedAt,
    source: settings.updatedBy === "future_cmp" ? "future_cmp" : "mock_settings",
  };
}

export function evaluateConsentForRewardedAds(consentState: AdConsentState): ConsentDecision {
  if (consentState.status === "revoked") {
    return {
      status: consentState.status,
      personalizationMode: "denied",
      reason: "Ad consent has been revoked. Real ad providers must remain disabled.",
      canRequestAds: false,
      canRequestPersonalizedAds: false,
      requiresCmp: isCmpRegion(consentState.region),
      requiresLegalReview: true,
    };
  }

  if (consentState.status === "denied") {
    return {
      status: consentState.status,
      personalizationMode: "denied",
      reason: "Ad consent is denied. Mock rewards may run, but real providers must not request personalized ads.",
      canRequestAds: false,
      canRequestPersonalizedAds: false,
      requiresCmp: isCmpRegion(consentState.region),
      requiresLegalReview: true,
    };
  }

  if (consentState.region === "eea_uk_ch") {
    return {
      status:
        consentState.status === "granted_personalized" || consentState.status === "granted_non_personalized"
          ? consentState.status
          : "required_not_requested",
      personalizationMode: consentState.personalizationMode,
      reason: "EEA/UK/Switzerland real ads require a Google-certified CMP / IAB TCF implementation and legal review.",
      canRequestAds: false,
      canRequestPersonalizedAds: false,
      requiresCmp: true,
      requiresLegalReview: true,
    };
  }

  if (consentState.status === "granted_personalized" || consentState.status === "granted_non_personalized") {
    return {
      status: consentState.status,
      personalizationMode: consentState.personalizationMode,
      reason: "Consent is recorded, but real providers remain disabled until Phase 18D+ legal/provider verification.",
      canRequestAds: false,
      canRequestPersonalizedAds: false,
      requiresCmp: false,
      requiresLegalReview: true,
    };
  }

  if (consentState.status === "not_required") {
    return {
      status: consentState.status,
      personalizationMode: consentState.personalizationMode,
      reason: "Consent is marked not required, but real ad providers are still disabled pending legal/provider review.",
      canRequestAds: false,
      canRequestPersonalizedAds: false,
      requiresCmp: false,
      requiresLegalReview: true,
    };
  }

  return {
    status: consentState.status,
    personalizationMode: consentState.personalizationMode,
    reason: "Consent state is unknown. Real ad providers are blocked by default.",
    canRequestAds: false,
    canRequestPersonalizedAds: false,
    requiresCmp: isCmpRegion(consentState.region),
    requiresLegalReview: true,
  };
}

export function canUseMockRewardedAds(_consentState: AdConsentState, settings?: AdPrivacySettings): boolean {
  return settings ? canShowMockRewardOffers(settings) : true;
}

export function canUseRealRewardedAds(consentState: AdConsentState): boolean {
  return evaluateConsentForRewardedAds(consentState).canRequestAds;
}

export function recordMockConsentPreference(input: {
  existing?: AdConsentState;
  userId?: string;
  profileId?: string;
  region?: ConsentRegion;
  personalizationMode?: AdPersonalizationMode;
  now?: Date | string;
}): AdConsentState {
  const base = input.existing ?? getDefaultAdConsentState(input);
  const personalizationMode = input.personalizationMode ?? "denied";
  const status: ConsentStatus =
    personalizationMode === "personalized"
      ? "granted_personalized"
      : personalizationMode === "non_personalized"
        ? "granted_non_personalized"
        : "denied";

  return {
    ...base,
    userId: input.userId ?? base.userId,
    profileId: input.profileId ?? base.profileId,
    region: input.region ?? base.region,
    status,
    personalizationMode,
    tcfStringPresent: false,
    cmpProvider: "mock_settings",
    consentedAt: status.startsWith("granted") ? toIso(input.now ?? new Date()) : base.consentedAt,
    revokedAt: undefined,
    lastUpdatedAt: toIso(input.now ?? new Date()),
    source: "mock_settings",
  };
}

export function revokeAdConsent(input: {
  existing?: AdConsentState;
  userId?: string;
  profileId?: string;
  now?: Date | string;
}): AdConsentState {
  const base = input.existing ?? getDefaultAdConsentState(input);
  return {
    ...base,
    userId: input.userId ?? base.userId,
    profileId: input.profileId ?? base.profileId,
    status: "revoked",
    personalizationMode: "denied",
    revokedAt: toIso(input.now ?? new Date()),
    lastUpdatedAt: toIso(input.now ?? new Date()),
    source: "mock_settings",
  };
}

export function getConsentDisclosureCopy(region: ConsentRegion, status: ConsentStatus): string {
  if (region === "eea_uk_ch") {
    return "Real rewarded ads for EEA, UK, or Switzerland users require a certified CMP / TCF consent flow before any provider can load.";
  }
  if (status === "revoked") {
    return "Ad consent is revoked. Mock rewards may remain available because they do not call external ad providers.";
  }
  if (status === "denied") {
    return "Ad personalization is denied. Real personalized ads remain blocked.";
  }
  return "Real rewarded ads are disabled until consent, legal review, and provider verification are implemented.";
}

export function serializeAdConsentState(state: AdConsentState): string {
  return JSON.stringify(state);
}

export function parseAdConsentState(value: unknown): AdConsentState {
  if (typeof value === "string") {
    try {
      return normalizeConsentState(JSON.parse(value));
    } catch {
      return getDefaultAdConsentState();
    }
  }
  return normalizeConsentState(value);
}

function normalizeConsentState(value: unknown): AdConsentState {
  if (!isRecord(value) || value.version !== AD_CONSENT_VERSION) {
    return getDefaultAdConsentState();
  }

  return {
    version: AD_CONSENT_VERSION,
    userId: typeof value.userId === "string" ? value.userId : undefined,
    profileId: typeof value.profileId === "string" ? value.profileId : undefined,
    region: isConsentRegion(value.region) ? value.region : "unknown",
    status: isConsentStatus(value.status) ? value.status : "unknown",
    personalizationMode: isPersonalizationMode(value.personalizationMode)
      ? value.personalizationMode
      : "unknown",
    cmpProvider: typeof value.cmpProvider === "string" ? value.cmpProvider : undefined,
    tcfStringPresent: value.tcfStringPresent === true,
    consentedAt: typeof value.consentedAt === "string" ? value.consentedAt : undefined,
    revokedAt: typeof value.revokedAt === "string" ? value.revokedAt : undefined,
    lastUpdatedAt: typeof value.lastUpdatedAt === "string" ? value.lastUpdatedAt : new Date().toISOString(),
    source:
      value.source === "mock_settings" || value.source === "future_cmp" || value.source === "system_default"
        ? value.source
        : "system_default",
  };
}

function isCmpRegion(region: ConsentRegion): boolean {
  return region === "eea_uk_ch";
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isConsentRegion(value: unknown): value is ConsentRegion {
  return value === "unknown" || value === "eea_uk_ch" || value === "us" || value === "other";
}

function isConsentStatus(value: unknown): value is ConsentStatus {
  return (
    value === "unknown" ||
    value === "not_required" ||
    value === "required_not_requested" ||
    value === "granted_personalized" ||
    value === "granted_non_personalized" ||
    value === "denied" ||
    value === "revoked"
  );
}

function isPersonalizationMode(value: unknown): value is AdPersonalizationMode {
  return value === "unknown" || value === "denied" || value === "non_personalized" || value === "personalized";
}
