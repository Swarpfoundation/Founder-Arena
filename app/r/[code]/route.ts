import { NextRequest, NextResponse } from "next/server";
import { REFERRAL_COOKIE_NAME, normalizeReferralCode } from "@/lib/growth/referral-rules";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = normalizeReferralCode(code);
  const response = NextResponse.redirect(new URL("/login?callbackUrl=/dashboard", _request.url));
  if (normalized) {
    response.cookies.set(REFERRAL_COOKIE_NAME, normalized, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return response;
}
