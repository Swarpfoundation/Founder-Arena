import { NextRequest, NextResponse } from "next/server";
import { getFounderArenaAuthContext } from "@/lib/auth-context";
import { buildSafeDeckGenerationJobView, getDeckGenerationJobForUser } from "@/lib/deck-review/generation-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const authContext = await getFounderArenaAuthContext(request);
  if (!authContext) {
    return NextResponse.json({ error: "Sign in to view generated decks." }, { status: 401 });
  }
  const user = authContext.user;

  const { jobId } = await context.params;
  const result = await getDeckGenerationJobForUser({ jobId, user });
  if (!result.ok) {
    return NextResponse.json({ error: "Generated deck job not found." }, { status: 404 });
  }

  return NextResponse.json({ job: buildSafeDeckGenerationJobView(result.job) });
}
