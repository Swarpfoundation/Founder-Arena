import { NextRequest, NextResponse } from "next/server";
import { exchangeMobileCodeForToken } from "@/lib/mobile-auth/service";

export const dynamic = "force-dynamic";

function getClientIp(request: NextRequest): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? null;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const code = typeof payload.code === "string" ? payload.code.trim() : "";
  const state = typeof payload.state === "string" ? payload.state.trim() : "";
  const codeVerifier = typeof payload.code_verifier === "string" ? payload.code_verifier.trim() : null;

  if (!code || !state) {
    return NextResponse.json({ error: "code and state are required." }, { status: 400 });
  }

  const result = await exchangeMobileCodeForToken({
    code,
    state,
    codeVerifier,
    deviceName: payload.deviceName,
    appVersion: payload.appVersion,
    userAgent: request.headers.get("user-agent"),
    ipAddress: getClientIp(request),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    accessToken: result.accessToken,
    tokenType: "Bearer",
    expiresAt: result.expiresAt.toISOString(),
    user: result.user,
  });
}
