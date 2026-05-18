export type ConsentRegion = "unknown" | "eea_uk_ch" | "us" | "other";

export type AdPersonalizationMode =
  | "unknown"
  | "denied"
  | "non_personalized"
  | "personalized";

export type ConsentStatus =
  | "unknown"
  | "not_required"
  | "required_not_requested"
  | "granted_personalized"
  | "granted_non_personalized"
  | "denied"
  | "revoked";

export type ConsentSource = "mock_settings" | "future_cmp" | "system_default";

export interface AdConsentState {
  version: "ad-consent-v0.1";
  userId?: string;
  profileId?: string;
  region: ConsentRegion;
  status: ConsentStatus;
  personalizationMode: AdPersonalizationMode;
  cmpProvider?: string;
  tcfStringPresent: boolean;
  consentedAt?: string;
  revokedAt?: string;
  lastUpdatedAt: string;
  source: ConsentSource;
}

export interface ConsentDecision {
  status: ConsentStatus;
  personalizationMode: AdPersonalizationMode;
  reason: string;
  canRequestAds: boolean;
  canRequestPersonalizedAds: boolean;
  requiresCmp: boolean;
  requiresLegalReview: boolean;
}
