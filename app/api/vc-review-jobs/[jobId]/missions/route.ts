import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserOrDevDemoUser } from "@/lib/auth-helpers";
import { buildSafeDeckReviewJobView, getDeckReviewJobForUser } from "@/lib/deck-review/service";

export const dynamic = "force-dynamic";

/**
 * GET /api/vc-review-jobs/:jobId/missions
 *
 * Owner/admin only. Returns simulated investor due-diligence missions and
 * roadmap summary. Never returns deck text, private profile data, prompts, or
 * raw provider output.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const user = await getCurrentUserOrDevDemoUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view investor missions." }, { status: 401 });
  }

  const { jobId } = await context.params;
  const result = await getDeckReviewJobForUser({ jobId, user });
  if (!result.ok) {
    return NextResponse.json({ error: "Review job not found." }, { status: 404 });
  }

  const safeJob = buildSafeDeckReviewJobView(result.job);
  return NextResponse.json({
    jobId: safeJob.jobId,
    startupId: safeJob.startupId,
    missionGenerationStatus: safeJob.missionGenerationStatus,
    missionCount: safeJob.missionCount,
    missionGenerationErrorCategory: safeJob.missionGenerationErrorCategory,
    missionGenerationSafeErrorMessage: safeJob.missionGenerationSafeErrorMessage,
    missions: safeJob.missions,
    roadmapSummary: safeJob.roadmapSummary,
  });
}
