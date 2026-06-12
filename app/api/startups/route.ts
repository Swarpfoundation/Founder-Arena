import { NextRequest, NextResponse } from "next/server";
import { getFounderArenaAuthContext } from "@/lib/auth-context";
import { createMobileStartup, listMobileStartups } from "@/lib/startups/mobile-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authContext = await getFounderArenaAuthContext(request);
  if (!authContext) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const startups = await listMobileStartups(authContext.user.id);
  return NextResponse.json({ startups });
}

export async function POST(request: NextRequest) {
  const authContext = await getFounderArenaAuthContext(request);
  if (!authContext) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const result = await createMobileStartup({
    userId: authContext.user.id,
    body,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, details: result.details ?? [] },
      { status: result.status }
    );
  }

  return NextResponse.json({ startup: result.startup }, { status: 201 });
}
