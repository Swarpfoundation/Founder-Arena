import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  AD_PRIVACY_AUDIT_ACTION_TYPE,
  createAdConsentAuditEntry,
  getDefaultAdPrivacySettings,
  normalizeAdConsentAuditEntry,
  normalizeAdPrivacySettings,
  resetAdPrivacySettings,
  revokeFutureRealAds,
  updateMockRewardPreference,
  type AdConsentAuditAction,
  type AdConsentAuditEntry,
  type AdPrivacySettings,
} from "./ad-privacy-settings";

export interface AdPrivacyState {
  settings: AdPrivacySettings;
  auditEntries: AdConsentAuditEntry[];
  persistence: "server" | "default";
}

export async function getAdPrivacyStateForUser(userId: string, options?: { take?: number }): Promise<AdPrivacyState> {
  const rows = await db.queuedAction.findMany({
    where: {
      userId,
      actionType: AD_PRIVACY_AUDIT_ACTION_TYPE,
      status: "completed",
    },
    orderBy: { queuedAt: "desc" },
    take: Math.max(options?.take ?? 8, 1),
    select: {
      result: true,
      payload: true,
    },
  });

  const latest = rows[0];
  const settings = latest
    ? normalizeAdPrivacySettings(latest.result, { userId })
    : getDefaultAdPrivacySettings({ userId });
  const auditEntries = rows
    .map((row) => normalizeAdConsentAuditEntry(row.payload))
    .filter((entry): entry is AdConsentAuditEntry => !!entry);

  return {
    settings,
    auditEntries,
    persistence: latest ? "server" : "default",
  };
}

export async function writeAdPrivacySettingsChange(input: {
  userId: string;
  action: AdConsentAuditAction;
  previous: AdPrivacySettings;
  next: AdPrivacySettings;
  reason: string;
  metadataSafe?: Record<string, unknown>;
}): Promise<{ settings: AdPrivacySettings; auditEntry: AdConsentAuditEntry }> {
  const auditEntry = createAdConsentAuditEntry({
    id: randomUUID(),
    userId: input.userId,
    action: input.action,
    previous: input.previous,
    next: input.next,
    reason: input.reason,
    metadataSafe: input.metadataSafe,
  });

  await db.queuedAction.create({
    data: {
      userId: input.userId,
      actionType: AD_PRIVACY_AUDIT_ACTION_TYPE,
      status: "completed",
      payload: { auditEntry } as unknown as Prisma.InputJsonValue,
      result: { settings: input.next } as unknown as Prisma.InputJsonValue,
      processedAt: new Date(),
    },
  });

  return { settings: input.next, auditEntry };
}

export async function setMockRewardOffersDisabledForUser(userId: string, disabled: boolean) {
  const state = await getAdPrivacyStateForUser(userId);
  const next = updateMockRewardPreference({ existing: state.settings, disabled });
  return writeAdPrivacySettingsChange({
    userId,
    action: disabled ? "mock_offers_disabled" : "mock_offers_enabled",
    previous: state.settings,
    next,
    reason: disabled
      ? "User disabled optional mock rewarded review offers."
      : "User enabled optional mock rewarded review offers.",
    metadataSafe: { surface: "settings_ads", provider: "mock" },
  });
}

export async function revokeFutureAdConsentForUser(userId: string) {
  const state = await getAdPrivacyStateForUser(userId);
  const next = revokeFutureRealAds({ existing: state.settings });
  return writeAdPrivacySettingsChange({
    userId,
    action: "future_real_ads_revoked",
    previous: state.settings,
    next,
    reason: "User revoked any future real rewarded ad consent placeholder.",
    metadataSafe: { surface: "settings_ads", mode: "future_real_ads" },
  });
}

export async function resetAdPrivacySettingsForUser(userId: string) {
  const state = await getAdPrivacyStateForUser(userId);
  const next = resetAdPrivacySettings({ existing: state.settings });
  return writeAdPrivacySettingsChange({
    userId,
    action: "consent_reset",
    previous: state.settings,
    next,
    reason: "User reset ad privacy settings to safe defaults.",
    metadataSafe: { surface: "settings_ads" },
  });
}

export async function recordAdSettingsViewedForUser(userId: string) {
  const state = await getAdPrivacyStateForUser(userId);
  return writeAdPrivacySettingsChange({
    userId,
    action: "settings_viewed",
    previous: state.settings,
    next: state.settings,
    reason: "User viewed Ad Privacy / Rewards Settings.",
    metadataSafe: { surface: "settings_ads" },
  });
}
