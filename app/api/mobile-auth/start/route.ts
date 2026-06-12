import { NextRequest, NextResponse } from "next/server";
import {
  buildMobileAuthLoginUrl,
  isAllowedMobileRedirectUri,
  isMobileAuthEnabled,
  parseMobileAuthProvider,
} from "@/lib/mobile-auth/core";
import { createMobileAuthAttempt } from "@/lib/mobile-auth/service";

export const dynamic = "force-dynamic";

const PKCE_CHALLENGE_PATTERN = /^[A-Za-z0-9._~-]{43,128}$/;

export async function GET(request: NextRequest) {
  if (!isMobileAuthEnabled()) {
    return NextResponse.json({ error: "Mobile auth is disabled." }, { status: 403 });
  }

  const provider = parseMobileAuthProvider(request.nextUrl.searchParams.get("provider"));
  if (!provider) {
    return NextResponse.json({ error: "Unsupported mobile auth provider." }, { status: 400 });
  }

  const redirectUri = request.nextUrl.searchParams.get("redirect_uri")?.trim() ?? "";
  if (!redirectUri || !isAllowedMobileRedirectUri(redirectUri)) {
    return NextResponse.json({ error: "Unapproved mobile redirect URI." }, { status: 400 });
  }

  const state = request.nextUrl.searchParams.get("state")?.trim() ?? "";
  if (state.length < 32 || state.length > 256) {
    return NextResponse.json({ error: "Invalid mobile auth state." }, { status: 400 });
  }

  const codeChallenge = request.nextUrl.searchParams.get("code_challenge")?.trim() || null;
  const codeChallengeMethod = request.nextUrl.searchParams.get("code_challenge_method")?.trim() || "S256";
  if (codeChallenge && (!PKCE_CHALLENGE_PATTERN.test(codeChallenge) || codeChallengeMethod !== "S256")) {
    return NextResponse.json({ error: "Invalid mobile PKCE challenge." }, { status: 400 });
  }

  const attempt = await createMobileAuthAttempt({
    provider,
    redirectUri,
    state,
    codeChallenge,
    codeChallengeMethod: codeChallenge ? codeChallengeMethod : null,
  });

  return NextResponse.redirect(buildMobileAuthLoginUrl({
    origin: request.nextUrl.origin,
    provider,
    attemptId: attempt.id,
    state,
  }));
}
