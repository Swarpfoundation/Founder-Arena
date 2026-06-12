import { NextRequest, NextResponse } from "next/server";
import { getFounderArenaAuthContext } from "@/lib/auth-context";
import { getMobileStartupForUser } from "@/lib/startups/mobile-api";

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
