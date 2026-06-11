import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserOrDevDemoUser } from "@/lib/auth-helpers";
import { buildSafeDeckReviewJobView, getDeckReviewJobForUser } from "@/lib/deck-review/service";

export const dynamic = "force-dynamic";

/**
 * GET /api/vc-review-jobs/:jobId
 *
 * Owner (or configured admin) only. Returns the safe job view: status,
 * selected firms, error category, and — only once completed — the firm
 * reviews and aggregate decision. Never returns deck text, storage paths,
 * notes, prompts, or raw model output.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const user = await getCurrentUserOrDevDemoUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view review jobs." }, { status: 401 });
  }

  const { jobId } = await context.params;
  const result = await getDeckReviewJobForUser({ jobId, user });
  if (!result.ok) {
    return NextResponse.json({ error: "Review job not found." }, { status: 404 });
  }

  return NextResponse.json({ job: buildSafeDeckReviewJobView(result.job) });
}
