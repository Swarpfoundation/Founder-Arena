import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserOrDevDemoUser } from "@/lib/auth-helpers";
import { evaluatePrivateBetaAdminAccess } from "@/lib/admin/private-beta-dashboard";
import {
  buildSafeDeckReviewJobView,
  getDeckReviewJobForUser,
  runDeckReviewJob,
} from "@/lib/deck-review/service";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/vc-review-jobs/:jobId/run
 *
 * Synchronously (re)runs the AI review for a job that is stuck in
 * `reviewing` or failed with a retryable provider error. Local/dev tool and
 * admin recovery path:
 * - development: job owner may run it
 * - production: configured admin only
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const user = await getCurrentUserOrDevDemoUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to run review jobs." }, { status: 401 });
  }

  const { jobId } = await context.params;
  const result = await getDeckReviewJobForUser({ jobId, user });
  if (!result.ok) {
    return NextResponse.json({ error: "Review job not found." }, { status: 404 });
  }

  const isDev = process.env.NODE_ENV !== "production";
  const admin = evaluatePrivateBetaAdminAccess(user);
  if (!isDev && !admin.allowed) {
    return NextResponse.json({ error: "Manual job execution is admin-only in production." }, { status: 403 });
  }

  await runDeckReviewJob(jobId);

  const fresh = await db.vcDeckReviewJob.findUnique({ where: { id: jobId } });
  if (!fresh) {
    return NextResponse.json({ error: "Review job not found." }, { status: 404 });
  }
  return NextResponse.json({ job: buildSafeDeckReviewJobView(fresh) });
}
