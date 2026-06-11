import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserOrDevDemoUser } from "@/lib/auth-helpers";
import { buildSafeDeckGenerationJobView, getDeckGenerationJobForUser } from "@/lib/deck-review/generation-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const user = await getCurrentUserOrDevDemoUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view generated decks." }, { status: 401 });
  }

  const { jobId } = await context.params;
  const result = await getDeckGenerationJobForUser({ jobId, user });
  if (!result.ok) {
    return NextResponse.json({ error: "Generated deck job not found." }, { status: 404 });
  }

  return NextResponse.json({ job: buildSafeDeckGenerationJobView(result.job) });
}
