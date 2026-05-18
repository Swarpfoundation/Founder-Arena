"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth-helpers";
import {
  getAdPrivacyStateForUser,
  recordAdSettingsViewedForUser,
  resetAdPrivacySettingsForUser,
  revokeFutureAdConsentForUser,
  setMockRewardOffersDisabledForUser,
} from "@/lib/monetization/consent/ad-privacy-store";

export async function getAdPrivacySettingsAction() {
  const user = await requireCurrentUser();
  return getAdPrivacyStateForUser(user.id);
}

export async function updateMockRewardOfferPreferenceAction(disabled: boolean) {
  const user = await requireCurrentUser();
  const result = await setMockRewardOffersDisabledForUser(user.id, disabled);
  revalidatePath("/settings/ads");
  return result;
}

export async function revokeFutureAdConsentAction() {
  const user = await requireCurrentUser();
  const result = await revokeFutureAdConsentForUser(user.id);
  revalidatePath("/settings/ads");
  return result;
}

export async function resetAdPrivacySettingsAction() {
  const user = await requireCurrentUser();
  const result = await resetAdPrivacySettingsForUser(user.id);
  revalidatePath("/settings/ads");
  return result;
}

export async function recordAdSettingsViewedAction() {
  const user = await requireCurrentUser();
  const result = await recordAdSettingsViewedForUser(user.id);
  revalidatePath("/settings/ads");
  return result;
}
