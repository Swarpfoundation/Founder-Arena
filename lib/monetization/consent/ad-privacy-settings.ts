import type { AdPersonalizationMode, ConsentRegion, ConsentStatus } from "./types";

export const AD_PRIVACY_SETTINGS_VERSION = "ad-privacy-settings-v0.1" as const;
export const AD_PRIVACY_AUDIT_VERSION = "ad-consent-audit-v0.1" as const;
export const AD_PRIVACY_AUDIT_ACTION_TYPE = "adPrivacyAudit";

export type AdPrivacyUpdatedBy = "user" | "system" | "future_cmp";

export type AdConsentAuditAction =
  | "settings_viewed"
  | "mock_offers_disabled"
  | "mock_offers_enabled"
  | "future_real_ads_revoked"
  | "future_real_ads_preference_recorded"
  | "consent_reset"
  | "cmp_future_placeholder";

export interface AdPrivacySettings {
  version: typeof AD_PRIVACY_SETTINGS_VERSION;
  userId?: string;
  profileId?: string;
  mockRewardOffersDisabled: boolean;
  rewardedAdsOptOut: boolean;
  realAdsDisabled: true;
  consentStatus: ConsentStatus;
  personalizationMode: AdPersonalizationMode;
  region: ConsentRegion;
  lastUpdatedAt: string;
  updatedBy: AdPrivacyUpdatedBy;
}

export interface AdConsentAuditEntry {
  version: typeof AD_PRIVACY_AUDIT_VERSION;
  id: string;
  userId?: string;
  profileId?: string;
  action: AdConsentAuditAction;
  previousStatus: ConsentStatus;
  nextStatus: ConsentStatus;
  previousPersonalizationMode: AdPersonalizationMode;
  nextPersonalizationMode: AdPersonalizationMode;
  region: ConsentRegion;
  source: "mock_settings" | "future_cmp" | "system_default";
  reason: string;
  consentVersion: string;
  createdAt: string;
  revokedAt?: string;
  metadataSafe?: Record<string, string | number | boolean>;
}

export function getDefaultAdPrivacySettings(input?: {
  userId?: string;
  profileId?: string;
  now?: Date | string;
}): AdPrivacySettings {
  return {
    version: AD_PRIVACY_SETTINGS_VERSION,
    userId: input?.userId,
    profileId: input?.profileId,
    mockRewardOffersDisabled: false,
    rewardedAdsOptOut: false,
    realAdsDisabled: true,
    consentStatus: "unknown",
    personalizationMode: "unknown",
    region: "unknown",
    lastUpdatedAt: toIso(input?.now ?? new Date()),
    updatedBy: "system",
  };
}

export function normalizeAdPrivacySettings(value: unknown, fallback?: {
  userId?: string;
  profileId?: string;
  now?: Date | string;
}): AdPrivacySettings {
  const defaultSettings = getDefaultAdPrivacySettings(fallback);
  const record = getSettingsRecord(value);
  if (!record || record.version !== AD_PRIVACY_SETTINGS_VERSION) {
    return defaultSettings;
  }

  return {
    version: AD_PRIVACY_SETTINGS_VERSION,
    userId: typeof record.userId === "string" ? record.userId : fallback?.userId,
    profileId: typeof record.profileId === "string" ? record.profileId : fallback?.profileId,
    mockRewardOffersDisabled: record.mockRewardOffersDisabled === true,
    rewardedAdsOptOut: record.rewardedAdsOptOut === true,
    realAdsDisabled: true,
    consentStatus: isConsentStatus(record.consentStatus) ? record.consentStatus : "unknown",
    personalizationMode: isPersonalizationMode(record.personalizationMode) ? record.personalizationMode : "unknown",
    region: isConsentRegion(record.region) ? record.region : "unknown",
    lastUpdatedAt: typeof record.lastUpdatedAt === "string" ? record.lastUpdatedAt : defaultSettings.lastUpdatedAt,
    updatedBy:
      record.updatedBy === "user" || record.updatedBy === "system" || record.updatedBy === "future_cmp"
        ? record.updatedBy
        : "system",
  };
}

export function updateMockRewardPreference(input: {
  existing: AdPrivacySettings;
  disabled: boolean;
  now?: Date | string;
}): AdPrivacySettings {
  return {
    ...input.existing,
    mockRewardOffersDisabled: input.disabled,
    rewardedAdsOptOut: input.disabled,
    realAdsDisabled: true,
    lastUpdatedAt: toIso(input.now ?? new Date()),
    updatedBy: "user",
  };
}

export function revokeFutureRealAds(input: {
  existing: AdPrivacySettings;
  now?: Date | string;
}): AdPrivacySettings {
  return {
    ...input.existing,
    realAdsDisabled: true,
    consentStatus: "revoked",
    personalizationMode: "denied",
    lastUpdatedAt: toIso(input.now ?? new Date()),
    updatedBy: "user",
  };
}

export function resetAdPrivacySettings(input: {
  existing: AdPrivacySettings;
  now?: Date | string;
}): AdPrivacySettings {
  return {
    ...getDefaultAdPrivacySettings({
      userId: input.existing.userId,
      profileId: input.existing.profileId,
      now: input.now,
    }),
    updatedBy: "user",
  };
}

export function createAdConsentAuditEntry(input: {
  id: string;
  userId?: string;
  profileId?: string;
  action: AdConsentAuditAction;
  previous: AdPrivacySettings;
  next: AdPrivacySettings;
  reason: string;
  now?: Date | string;
  metadataSafe?: Record<string, unknown>;
}): AdConsentAuditEntry {
  return {
    version: AD_PRIVACY_AUDIT_VERSION,
    id: input.id,
    userId: input.userId,
    profileId: input.profileId,
    action: input.action,
    previousStatus: input.previous.consentStatus,
    nextStatus: input.next.consentStatus,
    previousPersonalizationMode: input.previous.personalizationMode,
    nextPersonalizationMode: input.next.personalizationMode,
    region: input.next.region,
    source: "mock_settings",
    reason: input.reason,
    consentVersion: input.next.version,
    createdAt: toIso(input.now ?? new Date()),
    revokedAt: input.action === "future_real_ads_revoked" ? toIso(input.now ?? new Date()) : undefined,
    metadataSafe: sanitizeAuditMetadata(input.metadataSafe),
  };
}

export function normalizeAdConsentAuditEntry(value: unknown): AdConsentAuditEntry | null {
  const record = getAuditRecord(value);
  if (!record || record.version !== AD_PRIVACY_AUDIT_VERSION) return null;
  if (typeof record.id !== "string" || !isAuditAction(record.action)) return null;

  return {
    version: AD_PRIVACY_AUDIT_VERSION,
    id: record.id,
    userId: typeof record.userId === "string" ? record.userId : undefined,
    profileId: typeof record.profileId === "string" ? record.profileId : undefined,
    action: record.action,
    previousStatus: isConsentStatus(record.previousStatus) ? record.previousStatus : "unknown",
    nextStatus: isConsentStatus(record.nextStatus) ? record.nextStatus : "unknown",
    previousPersonalizationMode: isPersonalizationMode(record.previousPersonalizationMode)
      ? record.previousPersonalizationMode
      : "unknown",
    nextPersonalizationMode: isPersonalizationMode(record.nextPersonalizationMode)
      ? record.nextPersonalizationMode
      : "unknown",
    region: isConsentRegion(record.region) ? record.region : "unknown",
    source:
      record.source === "mock_settings" || record.source === "future_cmp" || record.source === "system_default"
        ? record.source
        : "mock_settings",
    reason: typeof record.reason === "string" ? record.reason : "Ad privacy setting changed.",
    consentVersion: typeof record.consentVersion === "string" ? record.consentVersion : AD_PRIVACY_SETTINGS_VERSION,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
    revokedAt: typeof record.revokedAt === "string" ? record.revokedAt : undefined,
    metadataSafe: sanitizeAuditMetadata(record.metadataSafe),
  };
}

export function canShowMockRewardOffers(settings: AdPrivacySettings): boolean {
  return !settings.mockRewardOffersDisabled && !settings.rewardedAdsOptOut;
}

export function sanitizeAuditMetadata(value: unknown): Record<string, string | number | boolean> | undefined {
  if (!isRecord(value)) return undefined;
  const allowedKeys = new Set(["surface", "mode", "provider", "placement", "source", "planId"]);
  const metadata: Record<string, string | number | boolean> = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (!allowedKeys.has(key)) continue;
    if (typeof rawValue === "string" || typeof rawValue === "number" || typeof rawValue === "boolean") {
      metadata[key] = rawValue;
    }
  }
  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function getSettingsRecord(value: unknown): Record<string, unknown> | null {
  if (isRecord(value) && isRecord(value.settings)) return value.settings;
  return isRecord(value) ? value : null;
}

function getAuditRecord(value: unknown): Record<string, unknown> | null {
  if (isRecord(value) && isRecord(value.auditEntry)) return value.auditEntry;
  return isRecord(value) ? value : null;
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

function isAuditAction(value: unknown): value is AdConsentAuditAction {
  return (
    value === "settings_viewed" ||
    value === "mock_offers_disabled" ||
    value === "mock_offers_enabled" ||
    value === "future_real_ads_revoked" ||
    value === "future_real_ads_preference_recorded" ||
    value === "consent_reset" ||
    value === "cmp_future_placeholder"
  );
}
