"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStartupAction } from "@/lib/actions/startup";
import { createStartupSchema, SECTORS, REGIONS, type Sector, type Region } from "@/lib/validations";
import { getFundingAskGuidance, STARTUP_TEMPLATES, StartupTemplate } from "@/lib/onboarding/startup-templates";
import { StartupTemplatePicker } from "@/components/onboarding/StartupTemplatePicker";
import { ExplainerHint } from "@/components/onboarding/ExplainerCard";
import { EventRevealPanel } from "@/components/game/EventRevealPanel";
import { PageReveal } from "@/components/game/PageReveal";
import { cn } from "@/lib/utils";
import { Crosshair, Radio, ShieldAlert, Sparkles, Target, Zap } from "lucide-react";

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
      sector: template.sector as Sector,
      region: template.region as Region,
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
  const selectedRegion = formValues.region ?? "";
  const selectedTemplate = STARTUP_TEMPLATES.find((template) => template.id === selectedTemplateId);
  const sectorRisk = selectedSector === "Fintech" || selectedSector === "Healthtech"
    ? "High Regulation"
    : selectedSector === "AI / ML" || selectedSector === "Consumer"
      ? "Narrative Volatility"
      : "Competitive Market";
  const investorInterest = selectedTemplate ? "Template Signal" : selectedSector ? "Sector Signal" : "Awaiting Market";

  return (
    <PageReveal className="max-w-5xl mx-auto pt-24 pb-12 px-4 md:px-8">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.4em] text-cyan-400/40 mb-2">Startup Deployment Bay</p>
        <h1 className="text-3xl md:text-5xl font-black text-white text-glow-cyan tracking-tight mb-2">Deploy Into The Arena</h1>
        <p className="max-w-2xl text-white/45">
          Choose the market, shape the mission, and launch a 12-week accelerator run. After deployment: pitch investors, close funding, then survive Week 1.
        </p>
      </div>

      <EventRevealPanel
        className="mb-6"
        event={{
          type: "strategy",
          severity: "medium",
          eyebrow: "Founder Brief",
          title: "Every Run Starts As A Venture Deployment",
          subtitle: "Templates are launch presets, not guaranteed wins. The arena will judge execution through funding, sprint pressure, rivals, social response, boardroom events, and final legacy.",
          accent: "cyan",
          primaryCta: { label: "Choose Template", href: "#templates" },
          secondaryCta: { label: "View Demo Path", href: "/demo" },
          affectedStats: [
            { label: "Run Length", value: "12 MO", accent: "amber" },
            { label: "First Gate", value: "VC REVIEW", accent: "violet" },
            { label: "Outcome", value: "STORY + RANK", accent: "emerald" },
          ],
          displayKey: "deployment-bay",
        }}
      />

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {[
          { label: "Run Seed", value: selectedTemplate?.id ?? "custom", icon: Crosshair, tone: "cyan" },
          { label: "Arena Conditions", value: selectedRegion || "select region", icon: Radio, tone: "violet" },
          { label: "Market Risk", value: selectedSector ? sectorRisk : "select sector", icon: ShieldAlert, tone: "rose" },
          { label: "Investor Interest", value: investorInterest, icon: Sparkles, tone: "amber" },
        ].map((item) => {
          const Icon = item.icon;
          const toneClass = {
            cyan: "border-cyan-500/25 bg-cyan-500/5 text-cyan-400",
            violet: "border-violet-500/25 bg-violet-500/5 text-violet-400",
            rose: "border-rose-500/25 bg-rose-500/5 text-rose-400",
            amber: "border-amber-500/25 bg-amber-500/5 text-amber-400",
          }[item.tone];
          return (
            <div key={item.label} className={cn("border p-3 hud-corner", toneClass)}>
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <p className="text-[9px] font-black uppercase tracking-wider opacity-70">{item.label}</p>
              </div>
              <p className="truncate text-xs font-black uppercase tracking-wider text-white">{item.value}</p>
            </div>
          );
        })}
      </div>

      {globalError && (
        <div className="mb-6 border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          {globalError}
        </div>
      )}

      <form action={handleSubmit} key={selectedTemplateId ?? "custom"}>
        <div className="space-y-6">
          {/* Template Picker */}
          <div id="templates" className="border border-cyan-500/15 bg-cyan-500/[0.03] p-5 hud-corner">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-400/60">Choose Startup Archetype</p>
                <h2 className="text-lg font-black uppercase tracking-wider text-white">Deployment Presets</h2>
                <p className="text-xs text-white/45">Pick a tactical starting point or build a custom venture brief.</p>
              </div>
            </div>
            <StartupTemplatePicker
              onSelect={applyTemplate}
              selectedId={selectedTemplateId}
            />
          </div>

          {selectedTemplateId && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={clearTemplate} className="relative inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[10px] font-bold tracking-wider text-white/60 uppercase">
                Clear template
              </button>
            </div>
          )}

          <div className="border border-white/10 bg-white/[0.02] p-5 hud-corner">
            <div className="mb-4">
              <div className="text-[10px] font-black tracking-[0.3em] text-cyan-400/60 uppercase">Choose Market</div>
              <div className="text-sm font-black tracking-wider text-white uppercase">Name / Sector / Region</div>
              <div className="text-xs text-white/40 mt-0.5">This sets the first arena context. Rivals, market pressure, and investor framing key off this brief.</div>
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
                      setFormValues((prev) => ({ ...prev, sector: e.target.value as Sector }));
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

          <div className="border border-white/10 bg-white/[0.02] p-5 hud-corner">
            <div className="mb-4">
              <div className="text-[10px] font-black tracking-[0.3em] text-violet-400/60 uppercase">Name / Mission</div>
              <div className="text-sm font-black tracking-wider text-white uppercase">Problem / Solution / Moat</div>
              <div className="text-xs text-white/40 mt-0.5">The investor chamber will judge clarity, market pain, differentiation, and execution risk.</div>
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

          <div className="border border-white/10 bg-white/[0.02] p-5 hud-corner">
            <div className="mb-4">
              <div className="text-[10px] font-black tracking-[0.3em] text-amber-400/60 uppercase">Funding Gate</div>
              <div className="text-sm font-black tracking-wider text-white uppercase">Initial Ask</div>
              <div className="text-xs text-white/40 mt-0.5">The ask influences the pitch ritual and term-sheet negotiation. Bigger rounds raise the stakes.</div>
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

          <div className="border border-cyan-500/20 bg-cyan-500/5 p-5 hud-corner">
            <div className="mb-4 flex items-start gap-3">
              <Zap className="mt-0.5 h-5 w-5 text-cyan-400" />
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-white">Deploy Into Arena</p>
                <p className="text-xs text-white/45">Next stop: Pitch Deck Console. Every run becomes a founder story, career record, and arena ranking.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
            <button type="submit" disabled={pending} className="relative inline-flex items-center gap-2 px-6 py-3 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all disabled:opacity-50">
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400" />
              <span className="text-cyan-400 font-bold text-xs tracking-wider uppercase">{pending ? "Deploying..." : "DEPLOY INTO ARENA"}</span>
            </button>
            <button type="button" onClick={() => router.push("/dashboard")} disabled={pending} className="relative inline-flex items-center gap-2 px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50">
              <span className="text-white/60 font-bold text-xs tracking-wider uppercase">ABORT</span>
            </button>
            </div>
          </div>
        </div>
      </form>
    </PageReveal>
  );
}
