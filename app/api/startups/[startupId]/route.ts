import { NextRequest, NextResponse } from "next/server";
import { getFounderArenaAuthContext } from "@/lib/auth-context";
import { getMobileStartupForUser, updateMobileStartupForUser } from "@/lib/startups/mobile-api";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ startupId: string }> }
) {
  const authContext = await getFounderArenaAuthContext(request);
  if (!authContext) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { startupId } = await context.params;
  const startup = await getMobileStartupForUser({
    userId: authContext.user.id,
    startupId,
    isAdmin: authContext.isAdmin,
  });
  if (!startup) {
    return NextResponse.json({ error: "Startup not found." }, { status: 404 });
  }

  return NextResponse.json({ startup });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ startupId: string }> }
) {
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

  const { startupId } = await context.params;
  const result = await updateMobileStartupForUser({
    userId: authContext.user.id,
    startupId,
    isAdmin: authContext.isAdmin,
    body,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        errorCategory: result.errorCategory,
        details: result.details ?? [],
      },
      { status: result.status }
    );
  }

  return NextResponse.json({ startup: result.startup });
}
