import type { ConsentDecision } from "@/lib/monetization/consent";
import type { AdRewardType, RewardedAdPlacement } from "@/lib/rewards/rewarded-review-acceleration";

export type RewardedAdProviderId =
  | "mock"
  | "google_gpt_web_future"
  | "admob_ios_future"
  | "admob_android_future";

export type RewardedAdProviderStatus =
  | "available"
  | "unavailable"
  | "consent_required"
  | "no_inventory"
  | "disabled"
  | "unsupported";

export type RewardedAdResultStatus = "completed" | "cancelled" | "failed" | "pending_verification";

export interface RewardedAdRequest {
  placement: RewardedAdPlacement;
  rewardType: AdRewardType;
  ledgerEntryId: string;
  startupId?: string;
  reviewId?: string;
  consentDecision: ConsentDecision;
  mockMode: boolean;
}

export interface RewardedAdResult {
  status: RewardedAdResultStatus;
  provider: RewardedAdProviderId;
  providerTransactionId?: string;
  verificationRequired: boolean;
  errorCode?: string;
}

export interface RewardedAdProviderContext {
  consentDecision: ConsentDecision;
  runtime: "web" | "ios" | "android" | "server";
  mockMode: boolean;
}

export interface RewardedAdProviderAdapter {
  id: RewardedAdProviderId;
  getStatus(context: RewardedAdProviderContext): RewardedAdProviderStatus;
  start(request: RewardedAdRequest): RewardedAdResult;
  complete(request: RewardedAdRequest, result?: RewardedAdResult): RewardedAdResult;
  cancel(request: RewardedAdRequest): RewardedAdResult;
}

export const MockRewardedAdProvider: RewardedAdProviderAdapter = {
  id: "mock",
  getStatus() {
    return "available";
  },
  start(request) {
    return {
      status: "pending_verification",
      provider: request.mockMode ? "mock" : "mock",
      providerTransactionId: `mock:${request.ledgerEntryId}`,
      verificationRequired: false,
    };
  },
  complete(request) {
    return {
      status: "completed",
      provider: "mock",
      providerTransactionId: `mock:${request.ledgerEntryId}`,
      verificationRequired: false,
    };
  },
  cancel(request) {
    return {
      status: "cancelled",
      provider: "mock",
      providerTransactionId: `mock:${request.ledgerEntryId}`,
      verificationRequired: false,
    };
  },
};

export const GoogleGPTWebRewardedProvider: RewardedAdProviderAdapter = {
  id: "google_gpt_web_future",
  getStatus() {
    return "disabled";
  },
  start() {
    return {
      status: "failed",
      provider: "google_gpt_web_future",
      verificationRequired: true,
      errorCode: "provider_disabled_phase_18c",
    };
  },
  complete() {
    return {
      status: "failed",
      provider: "google_gpt_web_future",
      verificationRequired: true,
      errorCode: "provider_disabled_phase_18c",
    };
  },
  cancel() {
    return {
      status: "cancelled",
      provider: "google_gpt_web_future",
      verificationRequired: true,
    };
  },
};

export const AdMobIosFutureProvider: RewardedAdProviderAdapter = {
  id: "admob_ios_future",
  getStatus() {
    return "unsupported";
  },
  start() {
    return {
      status: "failed",
      provider: "admob_ios_future",
      verificationRequired: true,
      errorCode: "unsupported_web_runtime",
    };
  },
  complete() {
    return {
      status: "failed",
      provider: "admob_ios_future",
      verificationRequired: true,
      errorCode: "unsupported_web_runtime",
    };
  },
  cancel() {
    return {
      status: "cancelled",
      provider: "admob_ios_future",
      verificationRequired: true,
    };
  },
};

export const AdMobAndroidFutureProvider: RewardedAdProviderAdapter = {
  id: "admob_android_future",
  getStatus() {
    return "unsupported";
  },
  start() {
    return {
      status: "failed",
      provider: "admob_android_future",
      verificationRequired: true,
      errorCode: "unsupported_web_runtime",
    };
  },
  complete() {
    return {
      status: "failed",
      provider: "admob_android_future",
      verificationRequired: true,
      errorCode: "unsupported_web_runtime",
    };
  },
  cancel() {
    return {
      status: "cancelled",
      provider: "admob_android_future",
      verificationRequired: true,
    };
  },
};

export function getRewardedAdProvider(providerId: RewardedAdProviderId): RewardedAdProviderAdapter {
  switch (providerId) {
    case "mock":
      return MockRewardedAdProvider;
    case "google_gpt_web_future":
      return GoogleGPTWebRewardedProvider;
    case "admob_ios_future":
      return AdMobIosFutureProvider;
    case "admob_android_future":
      return AdMobAndroidFutureProvider;
    default:
      return MockRewardedAdProvider;
  }
}
