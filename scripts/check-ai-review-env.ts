import { checkAIReviewDeploymentEnv, formatAIReviewEnvCheckReport } from "@/lib/ai-review/env-check";

const report = checkAIReviewDeploymentEnv(process.env);
console.log(formatAIReviewEnvCheckReport(report));

if (!report.ok) {
  process.exitCode = 1;
}
