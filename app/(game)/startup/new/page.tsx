"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStartupAction } from "@/lib/actions/startup";
import { createStartupSchema, SECTORS, REGIONS } from "@/lib/validations";
import { getFundingAskGuidance, StartupTemplate } from "@/lib/onboarding/startup-templates";
import { StartupTemplatePicker } from "@/components/onboarding/StartupTemplatePicker";
import { ExplainerHint } from "@/components/onboarding/ExplainerCard";

import { z } from "zod";

export const dynamic = "force-dynamic";

export default function CreateStartupPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);

  const [formValues, setFormValues] = useState<Partial<z.infer<typeof createStartupSchema>>>({});

  function applyTemplate(template: StartupTemplate) {
    setSelectedTemplateId(template.id);
    setFormValues({
      name: template.name,
      description: template.description,
      sector: template.sector,
      region: template.region,
      targetMarket: template.targetCustomer,
      problem: template.problem,
      solution: template.solution,
      monetizationModel: template.monetizationModel,
      unfairAdvantage: template.unfairAdvantage,
      fundingAsk: template.fundingAsk,
    });
  }

  function clearTemplate() {
    setSelectedTemplateId(undefined);
    setFormValues({});
  }

  async function handleSubmit(formData: FormData) {
    setErrors({});
    setGlobalError("");
    setPending(true);

    try {
      const data = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        sector: formData.get("sector") as string,
        region: formData.get("region") as string,
        targetMarket: formData.get("targetMarket") as string,
        problem: formData.get("problem") as string,
        solution: formData.get("solution") as string,
        monetizationModel: formData.get("monetizationModel") as string,
        unfairAdvantage: formData.get("unfairAdvantage") as string,
        fundingAsk: Number(formData.get("fundingAsk")),
      };

      const validated = createStartupSchema.parse(data);
      await createStartupAction(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((e) => {
          const path = e.path[0] as string;
          if (!fieldErrors[path]) fieldErrors[path] = e.message;
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        setGlobalError(error.message);
      } else {
        setGlobalError("Something went wrong. Please try again.");
      }
      setPending(false);
    }
  }

  const selectedSector = formValues.sector ?? "";

  return (
    <div className="max-w-2xl mx-auto pt-24 pb-12 px-4 md:px-8">
      <p className="text-[10px] tracking-[0.4em] text-cyan-400/40 mb-2">DEPLOYMENT BAY</p>
      <h1 className="text-3xl md:text-4xl font-black text-white text-glow-cyan tracking-tight mb-2">NEW UNIT</h1>
      <p className="text-white/40 mb-8">
        Define your idea and get an AI analysis. Start from a template or build from scratch.
      </p>

      {globalError && (
        <div className="mb-6 border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          {globalError}
        </div>
      )}

      <form action={handleSubmit}>
        <div className="space-y-6">
          {/* Template Picker */}
          <StartupTemplatePicker
            onSelect={applyTemplate}
            selectedId={selectedTemplateId}
          />

          {selectedTemplateId && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={clearTemplate} className="relative inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[10px] font-bold tracking-wider text-white/60 uppercase">
                Clear template
              </button>
            </div>
          )}

          <div className="border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-4">
              <div className="text-sm font-semibold tracking-wider text-white uppercase">Basics</div>
              <div className="text-xs text-white/40 mt-0.5">The core identity of your startup.</div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-bold tracking-wider text-white/60 uppercase">Startup Name</label>
                <input
                  id="name"
                  name="name"
                  placeholder="Acme Inc"
                  defaultValue={formValues.name ?? ""}
                  className="flex h-9 w-full border border-white/10 bg-transparent px-3 py-1 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
                />
                {errors.name && <p className="text-sm text-rose-400">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-xs font-bold tracking-wider text-white/60 uppercase">One-line Description</label>
                <input
                  id="description"
                  name="description"
                  placeholder="We help X do Y via Z"
                  defaultValue={formValues.description ?? ""}
                  className="flex h-9 w-full border border-white/10 bg-transparent px-3 py-1 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
                />
                <p className="text-xs text-white/40">
                  Example: &quot;AI-powered compliance copilot for fintech teams.&quot;
                </p>
                {errors.description && <p className="text-sm text-rose-400">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="sector" className="text-xs font-bold tracking-wider text-white/60 uppercase">Sector</label>
                  <select
                    id="sector"
                    name="sector"
                    className="flex h-9 w-full border border-white/10 bg-transparent px-3 py-1 text-sm text-white focus:outline-none focus:border-cyan-400/50"
                    defaultValue={formValues.sector ?? ""}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, sector: e.target.value }));
                    }}
                  >
                    <option value="">Select sector</option>
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.sector && <p className="text-sm text-rose-400">{errors.sector}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="region" className="text-xs font-bold tracking-wider text-white/60 uppercase">Region</label>
                  <select
                    id="region"
                    name="region"
                    className="flex h-9 w-full border border-white/10 bg-transparent px-3 py-1 text-sm text-white focus:outline-none focus:border-cyan-400/50"
                    defaultValue={formValues.region ?? ""}
                  >
                    <option value="">Select region</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {errors.region && <p className="text-sm text-rose-400">{errors.region}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="targetMarket" className="text-xs font-bold tracking-wider text-white/60 uppercase">Target Customer</label>
                <input
                  id="targetMarket"
                  name="targetMarket"
                  placeholder="SMBs in logistics"
                  defaultValue={formValues.targetMarket ?? ""}
                  className="flex h-9 w-full border border-white/10 bg-transparent px-3 py-1 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
                />
                <p className="text-xs text-white/40">
                  Be specific: job title, company size, and industry.
                </p>
                {errors.targetMarket && <p className="text-sm text-rose-400">{errors.targetMarket}</p>}
              </div>
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-4">
              <div className="text-sm font-semibold tracking-wider text-white uppercase">Idea</div>
              <div className="text-xs text-white/40 mt-0.5">What problem are you solving and how?</div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="problem" className="text-xs font-bold tracking-wider text-white/60 uppercase">Problem</label>
                <textarea
                  id="problem"
                  name="problem"
                  rows={4}
                  placeholder="Describe the painful problem your customer faces..."
                  defaultValue={formValues.problem ?? ""}
                  className="flex min-h-[80px] w-full border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
                />
                <p className="text-xs text-white/40">
                  Tip: Name the exact customer, the exact pain, and what they do today instead.
                </p>
                {errors.problem && <p className="text-sm text-rose-400">{errors.problem}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="solution" className="text-xs font-bold tracking-wider text-white/60 uppercase">Solution</label>
                <textarea
                  id="solution"
                  name="solution"
                  rows={4}
                  placeholder="How does your product solve it differently?"
                  defaultValue={formValues.solution ?? ""}
                  className="flex min-h-[80px] w-full border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
                />
                <p className="text-xs text-white/40">
                  Tip: Include one concrete use case and why it is 10x better.
                </p>
                {errors.solution && <p className="text-sm text-rose-400">{errors.solution}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="monetizationModel" className="text-xs font-bold tracking-wider text-white/60 uppercase">Business Model</label>
                <input
                  id="monetizationModel"
                  name="monetizationModel"
                  placeholder="SaaS subscription, transaction fees, etc."
                  defaultValue={formValues.monetizationModel ?? ""}
                  className="flex h-9 w-full border border-white/10 bg-transparent px-3 py-1 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
                />
                <p className="text-xs text-white/40">
                  Example: &quot;$300/seat/month SaaS + usage credits for enterprise.&quot;
                </p>
                {errors.monetizationModel && <p className="text-sm text-rose-400">{errors.monetizationModel}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="unfairAdvantage" className="text-xs font-bold tracking-wider text-white/60 uppercase">Founder Background / Unfair Advantage</label>
                <textarea
                  id="unfairAdvantage"
                  name="unfairAdvantage"
                  rows={3}
                  placeholder="What makes you uniquely positioned to win?"
                  defaultValue={formValues.unfairAdvantage ?? ""}
                  className="flex min-h-[60px] w-full border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
                />
                <p className="text-xs text-white/40">
                  Example: &quot;Former VP Engineering at Stripe with 3 fintech patents.&quot;
                </p>
                {errors.unfairAdvantage && <p className="text-sm text-rose-400">{errors.unfairAdvantage}</p>}
              </div>
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-4">
              <div className="text-sm font-semibold tracking-wider text-white uppercase">Funding</div>
              <div className="text-xs text-white/40 mt-0.5">How much are you raising?</div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fundingAsk" className="text-xs font-bold tracking-wider text-white/60 uppercase">Funding Ask (USD)</label>
                <input
                  id="fundingAsk"
                  name="fundingAsk"
                  type="number"
                  min={25000}
                  max={10000000}
                  placeholder="500000"
                  defaultValue={formValues.fundingAsk ?? ""}
                  className="flex h-9 w-full border border-white/10 bg-transparent px-3 py-1 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
                />
                <ExplainerHint term="Equity Dilution" />
                {selectedSector && (
                  <p className="text-xs text-cyan-400">
                    {getFundingAskGuidance(selectedSector)}
                  </p>
                )}
                {errors.fundingAsk && <p className="text-sm text-rose-400">{errors.fundingAsk}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={pending} className="relative inline-flex items-center gap-2 px-6 py-3 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all disabled:opacity-50">
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400" />
              <span className="text-cyan-400 font-bold text-xs tracking-wider uppercase">{pending ? "Analyzing..." : "DEPLOY UNIT"}</span>
            </button>
            <button type="button" onClick={() => router.push("/dashboard")} disabled={pending} className="relative inline-flex items-center gap-2 px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50">
              <span className="text-white/60 font-bold text-xs tracking-wider uppercase">ABORT</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
