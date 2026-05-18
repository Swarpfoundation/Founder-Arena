"use server";

import { headers } from "next/headers";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth-helpers";
import {
  REFERRAL_COOKIE_NAME,
  normalizeReferralCode,
} from "@/lib/growth/referral-rules";
import {
  attributeReferralByCode,
  getReferralDashboard,
} from "@/lib/growth/referrals";
import { getWeeklySubmissionStatus } from "@/lib/growth/submission-limits";

async function getAppBaseUrl(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
}

export async function captureReferralFromCookie() {
  const user = await requireCurrentUser();
  const cookieStore = await cookies();
  const code = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
  if (!code) return { applied: false, reason: "No referral code present." };
  return attributeReferralByCode({
    referredUserId: user.id,
    code: normalizeReferralCode(code),
  });
}

export async function getReferralDashboardAction() {
  const user = await requireCurrentUser();
  const baseUrl = await getAppBaseUrl();
  return getReferralDashboard(user.id, baseUrl);
}

export async function getWeeklySubmissionStatusAction() {
  const user = await requireCurrentUser();
  return getWeeklySubmissionStatus(user.id);
}

export async function claimReferralCodeAction(code: string) {
  const user = await requireCurrentUser();
  const result = await attributeReferralByCode({
    referredUserId: user.id,
    code: normalizeReferralCode(code),
  });
  revalidatePath("/referrals");
  revalidatePath("/dashboard");
  return result;
}
