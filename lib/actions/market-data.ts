"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  generateAndActivateMarketSnapshot,
  previewMarketSnapshot,
  getAvailableProviderModes,
  getProviderStatus,
} from "@/lib/market-data/service";
import { isAdminEmail, getAdminErrorMessage } from "@/lib/market-data/admin";
import { ProviderMode } from "@/lib/market-data/types";

export async function getMarketDataProviderStatus() {
  return getAvailableProviderModes();
}

export async function getMarketDataProviderFullStatus() {
  const user = await requireCurrentUser();
  if (!isAdminEmail(user.email)) {
    throw new Error(getAdminErrorMessage());
  }

  const status = getProviderStatus();
  const modes = getAvailableProviderModes();

  return {
    providers: status,
    modes,
    env: {
      fallback: process.env.MARKET_DATA_EXTERNAL_FALLBACK ?? "static",
      providerMode: process.env.MARKET_DATA_PROVIDER_MODE ?? "static",
    },
  };
}

export async function getMarketDataFullStatus() {
  const user = await requireCurrentUser();
  if (!isAdminEmail(user.email)) {
    throw new Error(getAdminErrorMessage());
  }

  return {
    providers: getProviderStatus(),
    modes: getAvailableProviderModes(),
  };
}

export async function previewMarketSnapshotAction(mode: ProviderMode) {
  const user = await requireCurrentUser();

  if (!isAdminEmail(user.email)) {
    throw new Error(getAdminErrorMessage());
  }

  const rateLimitError = await checkRateLimit(user.id, "aiAnalysis");
  if (rateLimitError) {
    throw new Error(rateLimitError);
  }

  return previewMarketSnapshot(mode);
}

export async function generateMarketSnapshotAction(mode: ProviderMode) {
  const user = await requireCurrentUser();

  if (!isAdminEmail(user.email)) {
    throw new Error(getAdminErrorMessage());
  }

  const rateLimitError = await checkRateLimit(user.id, "aiAnalysis");
  if (rateLimitError) {
    throw new Error(rateLimitError);
  }

  const result = await generateAndActivateMarketSnapshot(mode);

  revalidatePath("/market");

  return result;
}
