"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createStartupAction } from "@/lib/actions/startup";
import { createStartupSchema, REGIONS, SECTORS, type Region, type Sector } from "@/lib/validations";
import { getFundingAskGuidance, STARTUP_TEMPLATES, type StartupTemplate } from "@/lib/onboarding/startup-templates";
import { ExplainerHint } from "@/components/onboarding/ExplainerCard";
import { EventRevealPanel } from "@/components/game/EventRevealPanel";
import { PageReveal } from "@/components/game/PageReveal";
import {
  ArchetypeCard,
  BuilderStatusStrip,
  BuilderStepRail,
  BuildPreviewPanel,
  DeploymentCTA,
  MarketSelectCard,
} from "@/components/game/FounderBuilder";
import {
  buildDeploymentPreview,
  getArchetypePresentation,
  getBuilderSteps,
  getRegionCardPresentation,
  getSectorCardPresentation,
  type BuilderStepId,
} from "@/lib/game/founder-builder";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CreateStartupFormValues = Partial<Omit<z.infer<typeof createStartupSchema>, "fundingAsk">> & {
  fundingAsk?: number | string;
};

const REQUIRED_FIELDS: Array<keyof CreateStartupFormValues> = [
  "name",
  "description",
  "sector",
  "region",
  "targetMarket",
  "problem",
  "solution",
  "monetizationModel",
  "unfairAdvantage",
  "fundingAsk",
];

export default function CreateStartupPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [formValues, setFormValues] = useState<CreateStartupFormValues>({});

  const selectedTemplate = STARTUP_TEMPLATES.find((template) => template.id === selectedTemplateId);
  const selectedSector = formValues.sector ?? "";
  const selectedRegion = formValues.region ?? "";
  const completedFieldCount = REQUIRED_FIELDS.filter((field) => {
    const value = formValues[field];
    return typeof value === "number" ? value > 0 : Boolean(String(value ?? "").trim());
  }).length;
  const activeStep = getActiveStep({
    selectedTemplateId,
    selectedSector,
    selectedRegion,
    completedFieldCount,
  });
  const preview = buildDeploymentPreview({
    selectedTemplate,
    sector: selectedSector,
    region: selectedRegion,
    fundingAsk: formValues.fundingAsk,
    requiredFieldCount: REQUIRED_FIELDS.length,
    completedFieldCount,
  });
  const sectorCards = useMemo(() => SECTORS.map(getSectorCardPresentation), []);
  const regionCards = useMemo(() => REGIONS.map(getRegionCardPresentation), []);

  function setField<K extends keyof CreateStartupFormValues>(field: K, value: CreateStartupFormValues[K]) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field as string]) return prev;
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  }

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
    setErrors({});
    setGlobalError("");
  }

  function clearTemplate() {
    setSelectedTemplateId(undefined);
    setFormValues({});
    setErrors({});
    setGlobalError("");
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
        setGlobalError("Deployment blocked. Complete the highlighted founder brief fields.");
      } else if (error instanceof Error) {
        setGlobalError(error.message);
      } else {
        setGlobalError("Something went wrong. Please try again.");
      }
      setPending(false);
    }
  }

  return (
    <PageReveal className="mx-auto max-w-7xl px-4 pb-12 pt-24 md:px-8">
      <section className="relative overflow-hidden border border-cyan-500/20 bg-black/35 p-5 hud-corner md:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent" />
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400/50">Private Beta Build</p>
              <h1 className="text-3xl font-black tracking-tight text-white text-glow-cyan md:text-5xl">Founder Builder</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/48">
                Configure the startup run before it enters the arena. Pick an archetype, choose market conditions, write the founder brief, then deploy toward the investor chamber.
              </p>
            </div>
            <div className="border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-amber-300">
              <p className="text-[9px] font-black uppercase tracking-[0.28em] opacity-70">Run Format</p>
              <p className="text-sm font-black uppercase tracking-wider text-white">12 Founder Weeks To Demo Day</p>
            </div>
          </div>

          <BuilderStepRail steps={getBuilderSteps()} activeStep={activeStep} />

          <EventRevealPanel
            event={{
              type: "strategy",
              severity: "medium",
              eyebrow: "Deployment Bay",
              title: "Every Run Starts As A Founder Build",
              subtitle: "Archetypes are launch presets, not guaranteed wins. The arena will judge execution through VC review, funding terms, sprint pressure, rivals, boardroom events, infrastructure burn, and final legacy.",
              accent: "cyan",
              primaryCta: { label: "Choose Archetype", href: "#archetype" },
              secondaryCta: { label: "View Demo Path", href: "/demo" },
              affectedStats: [
                { label: "Run Length", value: "12 WEEKS", accent: "amber" },
                { label: "First Gate", value: "VC REVIEW", accent: "violet" },
                { label: "Outcome", value: "STORY + RANK", accent: "emerald" },
              ],
              displayKey: "founder-builder",
            }}
          />

          <BuilderStatusStrip
            runSeed={selectedTemplate?.id ?? "custom"}
            region={selectedRegion || "select region"}
            marketRisk={selectedSector ? preview.riskTags[0] : "select sector"}
            investorInterest={selectedTemplate ? "template signal" : selectedSector ? "sector signal" : "awaiting market"}
          />

          {globalError && (
            <div className="border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 hud-corner">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-300/70">Deployment Blocked</p>
              <p className="mt-1">{globalError}</p>
            </div>
          )}

          <form action={handleSubmit}>
            <input type="hidden" name="sector" value={selectedSector} />
            <input type="hidden" name="region" value={selectedRegion} />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 space-y-6">
                <section id="archetype" className="space-y-4 border border-cyan-500/15 bg-cyan-500/[0.03] p-5 hud-corner">
                  <BuilderSectionHeader
                    eyebrow="Choose Archetype"
                    title="Startup Build Presets"
                    subtitle="Select a tactical starting point or run a custom founder build."
                  />
                  <div className="grid gap-3 xl:grid-cols-2">
                    {STARTUP_TEMPLATES.map((template) => (
                      <ArchetypeCard
                        key={template.id}
                        archetype={getArchetypePresentation(template)}
                        selected={selectedTemplateId === template.id}
                        onSelect={() => applyTemplate(template)}
                      />
                    ))}
                  </div>
                  {selectedTemplateId && (
                    <button type="button" onClick={clearTemplate} className="border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/60 transition-all hover:bg-white/10">
                      Clear Template
                    </button>
                  )}
                </section>

                <section id="market" className="space-y-4 border border-violet-500/15 bg-violet-500/[0.03] p-5 hud-corner">
                  <BuilderSectionHeader
                    eyebrow="Select Market"
                    title="Sector + Region"
                    subtitle="These cards fill the same required sector and region fields, with risk flavor shown for the player."
                  />
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/35">Sector</p>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {sectorCards.map((card) => (
                        <MarketSelectCard
                          key={card.id}
                          card={card}
                          selected={selectedSector === card.id}
                          onSelect={() => setField("sector", card.id as Sector)}
                        />
                      ))}
                    </div>
                    {errors.sector && <FieldError message={errors.sector} />}
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/35">Region</p>
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {regionCards.map((card) => (
                        <MarketSelectCard
                          key={card.id}
                          card={card}
                          selected={selectedRegion === card.id}
                          onSelect={() => setField("region", card.id as Region)}
                        />
                      ))}
                    </div>
                    {errors.region && <FieldError message={errors.region} />}
                  </div>
                </section>

                <section id="brief" className="space-y-4 border border-white/10 bg-white/[0.02] p-5 hud-corner">
                  <BuilderSectionHeader
                    eyebrow="Founder Brief"
                    title="Name The Mission"
                    subtitle="This is the run identity that appears across the pitch, review chamber, operations command, story, and career record."
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      id="name"
                      name="name"
                      label="Startup Name"
                      placeholder="Acme Inc"
                      value={formValues.name ?? ""}
                      onChange={(value) => setField("name", value)}
                      error={errors.name}
                    />
                    <TextField
                      id="targetMarket"
                      name="targetMarket"
                      label="Target Customer"
                      placeholder="SMBs in logistics"
                      value={formValues.targetMarket ?? ""}
                      onChange={(value) => setField("targetMarket", value)}
                      error={errors.targetMarket}
                      hint="Be specific: job title, company size, and industry."
                    />
                  </div>
                  <TextField
                    id="description"
                    name="description"
                    label="One-line Mission"
                    placeholder="We help X do Y via Z"
                    value={formValues.description ?? ""}
                    onChange={(value) => setField("description", value)}
                    error={errors.description}
                    hint="Example: AI-powered compliance copilot for fintech teams."
                  />
                </section>

                <section id="pitch" className="space-y-4 border border-white/10 bg-white/[0.02] p-5 hud-corner">
                  <BuilderSectionHeader
                    eyebrow="Pitch Core"
                    title="Investor Dossier Seed"
                    subtitle="These required fields preserve the existing validation path and become the foundation for pitch generation."
                  />
                  <TextareaField
                    id="problem"
                    name="problem"
                    label="Problem"
                    placeholder="Describe the painful problem your customer faces..."
                    value={formValues.problem ?? ""}
                    onChange={(value) => setField("problem", value)}
                    error={errors.problem}
                    hint="Name the exact customer, the exact pain, and what they do today instead."
                  />
                  <TextareaField
                    id="solution"
                    name="solution"
                    label="Solution"
                    placeholder="How does your product solve it differently?"
                    value={formValues.solution ?? ""}
                    onChange={(value) => setField("solution", value)}
                    error={errors.solution}
                    hint="Include one concrete use case and why it is meaningfully better."
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      id="monetizationModel"
                      name="monetizationModel"
                      label="Business Model"
                      placeholder="SaaS subscription, transaction fees, etc."
                      value={formValues.monetizationModel ?? ""}
                      onChange={(value) => setField("monetizationModel", value)}
                      error={errors.monetizationModel}
                      hint="Example: $300/seat/month SaaS + usage credits for enterprise."
                    />
                    <TextField
                      id="fundingAsk"
                      name="fundingAsk"
                      type="number"
                      label="Funding Ask (USD)"
                      placeholder="500000"
                      min={25000}
                      max={10000000}
                      value={formValues.fundingAsk ?? ""}
                      onChange={(value) => setField("fundingAsk", value)}
                      error={errors.fundingAsk}
                      hint={selectedSector ? getFundingAskGuidance(selectedSector) : "Set the first ask before the VC review gate."}
                    />
                  </div>
                  <TextareaField
                    id="unfairAdvantage"
                    name="unfairAdvantage"
                    label="Founder Background / Unfair Advantage"
                    placeholder="What makes you uniquely positioned to win?"
                    value={formValues.unfairAdvantage ?? ""}
                    onChange={(value) => setField("unfairAdvantage", value)}
                    error={errors.unfairAdvantage}
                    hint="Example: Former VP Engineering at Stripe with 3 fintech patents."
                    rows={3}
                  />
                  <ExplainerHint term="Equity Dilution" />
                </section>

                <DeploymentCTA pending={pending} onAbort={() => router.push("/dashboard")} />
              </div>

              <aside className="space-y-4">
                <BuildPreviewPanel preview={preview} />
              </aside>
            </div>
          </form>
        </div>
      </section>
    </PageReveal>
  );
}

function getActiveStep(input: {
  selectedTemplateId?: string;
  selectedSector: string;
  selectedRegion: string;
  completedFieldCount: number;
}): BuilderStepId {
  if (!input.selectedTemplateId && input.completedFieldCount < 3) return "archetype";
  if (!input.selectedSector || !input.selectedRegion) return "market";
  if (input.completedFieldCount < 5) return "brief";
  if (input.completedFieldCount < REQUIRED_FIELDS.length) return "pitch";
  return "deploy";
}

function BuilderSectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-400/60">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-black uppercase tracking-wider text-white">{title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-white/45">{subtitle}</p>
    </div>
  );
}

function TextField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  type = "text",
  min,
  max,
}: {
  id: string;
  name: string;
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  hint?: string;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-white/60">{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        min={min}
        max={max}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "flex h-10 w-full border bg-black/20 px-3 py-1 text-sm text-white placeholder:text-white/30 focus:outline-none",
          error ? "border-rose-500/50 focus:border-rose-400/70" : "border-white/10 focus:border-cyan-400/50"
        )}
      />
      {hint && <p className="text-xs text-white/40">{hint}</p>}
      {error && <FieldError message={error} />}
    </div>
  );
}

function TextareaField({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  rows = 4,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-white/60">{label}</label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "flex min-h-[96px] w-full border bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none",
          error ? "border-rose-500/50 focus:border-rose-400/70" : "border-white/10 focus:border-cyan-400/50"
        )}
      />
      {hint && <p className="text-xs text-white/40">{hint}</p>}
      {error && <FieldError message={error} />}
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-xs font-bold text-rose-300">
      {message}
    </p>
  );
}
