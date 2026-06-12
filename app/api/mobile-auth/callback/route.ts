import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { appendCodeToMobileRedirect } from "@/lib/mobile-auth/core";
import { consumeMobileAuthAttempt, createMobileExchangeCode } from "@/lib/mobile-auth/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Mobile auth session was not established." }, { status: 401 });
  }

  const attemptId = request.nextUrl.searchParams.get("attempt")?.trim() ?? "";
  const state = request.nextUrl.searchParams.get("state")?.trim() ?? "";
  if (!attemptId || !state) {
    return NextResponse.json({ error: "Invalid mobile auth callback." }, { status: 400 });
  }

  const attempt = await consumeMobileAuthAttempt({ attemptId, state });
  if (!attempt) {
    return NextResponse.json({ error: "Mobile auth attempt expired or was already used." }, { status: 400 });
  }

  const { code } = await createMobileExchangeCode({
    userId: session.user.id,
    redirectUri: attempt.redirectUri,
    state,
    codeChallenge: attempt.codeChallenge,
    codeChallengeMethod: attempt.codeChallengeMethod,
  });

  return NextResponse.redirect(appendCodeToMobileRedirect({
    redirectUri: attempt.redirectUri,
    code,
    state,
  }));
}
