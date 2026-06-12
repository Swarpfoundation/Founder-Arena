import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken } from "@/lib/mobile-auth/core";
import { revokeMobileBearerToken, validateMobileBearerToken } from "@/lib/mobile-auth/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Valid mobile bearer token required." }, { status: 401 });
  }

  const user = await validateMobileBearerToken(token);
  if (!user) {
    return NextResponse.json({ error: "Valid mobile bearer token required." }, { status: 401 });
  }

  await revokeMobileBearerToken(token);
  return NextResponse.json({ ok: true });
}
