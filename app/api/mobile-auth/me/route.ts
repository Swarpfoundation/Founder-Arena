import { NextRequest, NextResponse } from "next/server";
import { getFounderArenaAuthContext } from "@/lib/auth-context";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authContext = await getFounderArenaAuthContext(request);
  if (!authContext || authContext.authType !== "mobile") {
    return NextResponse.json({ error: "Valid mobile bearer token required." }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: authContext.user.id,
      email: authContext.user.email ?? null,
      name: authContext.user.name ?? null,
    },
    authType: "mobile",
  });
}
