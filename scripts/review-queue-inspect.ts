import { db } from "@/lib/db";
import { AI_REVIEW_ACTION_TYPE, summarizeAIReviewJob } from "@/lib/ai-review/review-queue";

async function main() {
  const actions = await db.queuedAction.findMany({
    where: { actionType: AI_REVIEW_ACTION_TYPE },
    orderBy: { queuedAt: "desc" },
    take: 100,
    select: {
      id: true,
      startupId: true,
      status: true,
      queuedAt: true,
      processedAt: true,
      payload: true,
      error: true,
    },
  });

  const counts = new Map<string, number>();
  const summaries = actions
    .map((action) => summarizeAIReviewJob(action))
    .filter((summary): summary is NonNullable<typeof summary> => !!summary);

  for (const summary of summaries) {
    counts.set(summary.status, (counts.get(summary.status) ?? 0) + 1);
  }

  console.log("AI review queue summary");
  for (const status of ["queued", "running", "retrying", "completed", "failed", "cancelled"]) {
    console.log(`${status}: ${counts.get(status) ?? 0}`);
  }

  console.log("\nRecent jobs");
  for (const summary of summaries.slice(0, 10)) {
    console.log(
      JSON.stringify({
        id: summary.id,
        startupId: summary.startupId,
        status: summary.status,
        provider: summary.provider,
        mode: summary.mode,
        attempts: summary.attempts,
        maxAttempts: summary.maxAttempts,
        queuedAt: summary.queuedAt.toISOString(),
        processedAt: summary.processedAt?.toISOString() ?? null,
        hasError: !!summary.lastError,
        reviewId: summary.reviewId,
      })
    );
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Queue inspection failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
