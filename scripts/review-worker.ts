import { db } from "@/lib/db";
import { processNextAIReviewJob } from "@/lib/ai-review/worker";
import { checkAIReviewDeploymentEnv, formatAIReviewEnvCheckReport } from "@/lib/ai-review/env-check";

const once = process.argv.includes("--once");
const pollMs = Number.parseInt(process.env.AI_REVIEW_WORKER_POLL_MS ?? "5000", 10);
let shuttingDown = false;

process.on("SIGINT", () => {
  shuttingDown = true;
});
process.on("SIGTERM", () => {
  shuttingDown = true;
});

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const envReport = checkAIReviewDeploymentEnv(process.env);
  console.log(formatAIReviewEnvCheckReport(envReport));
  if (!envReport.ok) {
    throw new Error("AI review worker environment check failed.");
  }

  do {
    const result = await processNextAIReviewJob();
    console.log(JSON.stringify({ at: new Date().toISOString(), ...result }));
    if (once) break;
    if (!result.processed) await sleep(Number.isFinite(pollMs) ? pollMs : 5000);
  } while (!shuttingDown);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
