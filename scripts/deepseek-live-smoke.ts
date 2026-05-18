import { getAIReviewRuntimeConfig } from "@/lib/ai-review/config";
import { DeepSeekAIReviewProvider } from "@/lib/ai-review/providers/deepseek";
import type { AIReviewInput } from "@/lib/ai-review/types";

const syntheticInput: AIReviewInput = {
  startupId: "smoke-synthetic-startup",
  startupName: "OpsLedger Smoke Test",
  sector: "B2B SaaS",
  region: "United States",
  stage: "idea",
  classification: "workflow_automation",
  fundingAsk: 750000,
  monetizationModel: "Seat-based SaaS for operations teams",
  pitchDeck: {
    problem:
      "Small logistics teams reconcile freight invoices manually across email, spreadsheets, and carrier portals, causing late disputes and missed overcharge recovery.",
    solution:
      "A lightweight invoice review workspace that imports carrier PDFs, flags mismatches against shipment records, and routes disputes to operators with audit trails.",
    marketSize:
      "Initial wedge is US freight brokers and regional shippers with 10-200 operations staff; expansion path includes audit firms and managed logistics providers.",
    product:
      "Private beta prototype covers invoice import, variance detection, dispute queue, and weekly savings reports.",
    businessModel:
      "Monthly SaaS subscription by operations seat plus usage tier for invoice volume, with a paid pilot path for teams above 1,000 invoices per month.",
    goToMarket:
      "Start with founder-led sales into freight broker operations leaders, use dispute recovery case studies, and partner with two logistics consultants.",
    competition:
      "Incumbents are broad TMS suites and manual audit services; wedge is faster setup and focused invoice discrepancy workflow.",
    team:
      "Founder previously led operations at a regional freight brokerage and has a part-time full-stack engineer for the pilot.",
    financialPlan:
      "Use funds for two engineers, one implementation lead, security review, and six months of founder-led pilot sales.",
    ask:
      "$750k seed to reach 12 paid pilots, SOC2 readiness work, and enough product depth for self-serve onboarding.",
    useOfFunds:
      "65% engineering and product, 20% customer implementation, 10% security/compliance, 5% operating buffer.",
  },
};

async function main() {
  const baseConfig = getAIReviewRuntimeConfig(process.env);
  const provider = new DeepSeekAIReviewProvider({
    ...baseConfig,
    enabled: true,
    provider: "deepseek",
    mode: "direct",
    fallbackToMock: false,
  });
  const validation = provider.validateConfig();
  if (!validation.ok) {
    throw new Error(validation.message ?? "DeepSeek provider is not configured.");
  }

  const review = await provider.generateReview(syntheticInput);
  console.log(
    JSON.stringify(
      {
        ok: true,
        provider: review.providerMetadata.provider,
        model: review.providerMetadata.model,
        durationMs: review.providerMetadata.durationMs,
        decision: review.reviewQuality.finalDecision,
        modelRecommendation: review.reviewQuality.modelRecommendation,
        overallScore: review.overallScore,
        qualityFlags: review.reviewQuality.qualityFlags,
        usagePresent: Boolean(review.providerMetadata.usage?.totalTokens),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "DeepSeek live smoke failed.");
  process.exitCode = 1;
});
