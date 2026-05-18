import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle, BrainCircuit, Cloud, Database, ReceiptText, Server, ShieldCheck, Zap } from "lucide-react";
import { getStartupById } from "@/lib/actions/startup";
import { db } from "@/lib/db";
import { GameCard } from "@/components/game/GameCard";
import { SectionHeader } from "@/components/game/SectionHeader";
import { StartupRunHud } from "@/components/game/StartupRunHud";
import { PageReveal } from "@/components/game/PageReveal";
import { EventImpactBanner } from "@/components/game/EventImpactBanner";
import { EventRevealPanel } from "@/components/game/EventRevealPanel";
import { resolveInfrastructureEventAction, selectInfrastructureStackAction } from "@/lib/actions/infrastructure";
import {
  buildInfrastructureEventPresentation,
  buildInfrastructurePreviewInputForStartup,
  calculateRuntimeInfrastructureBurn,
  getAIUsageTierDefinition,
  getInfrastructureStack,
  getInfrastructureStackOptions,
  getOpenInfrastructureEvent,
  groupInfrastructureEventsByWeek,
  parseInfrastructureState,
  syncCloudCreditBalancesFromOffers,
} from "@/lib/infrastructure";
import { getRunStepLabel } from "@/lib/game-time/time-scale";
import type { InfrastructureBurnEstimate, InfrastructureStack } from "@/lib/infrastructure/types";
import type { LiveInfrastructureEventRecord } from "@/lib/infrastructure";
import type { CriticalEventPresentation } from "@/lib/gamefeel/critical-events";
import type { CeremonyAccent } from "@/lib/gamefeel/ceremony";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

function riskAccent(value: number): string {
  if (value >= 70) return "text-rose-400 bg-rose-500/10 border-rose-500/25";
  if (value >= 45) return "text-amber-400 bg-amber-500/10 border-amber-500/25";
  return "text-emerald-400 bg-emerald-500/10 border-emerald-500/25";
}

function ratingAccent(value: number): string {
  if (value >= 75) return "bg-emerald-400";
  if (value >= 50) return "bg-cyan-400";
  return "bg-amber-400";
}

function BarMetric({
  label,
  value,
  mode = "rating",
}: {
  label: string;
  value: number;
  mode?: "rating" | "risk";
}) {
  const accent = mode === "risk" ? (value >= 70 ? "bg-rose-400" : value >= 45 ? "bg-amber-400" : "bg-emerald-400") : ratingAccent(value);
  return (
    <div className="border border-white/8 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">{label}</span>
        <span className="text-xs font-black text-white">{value}/100</span>
      </div>
      <div className="h-1.5 bg-white/10">
        <div className={cn("h-full", accent)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function CostRow({ label, value, accent = "cyan" }: { label: string; value: number; accent?: CeremonyAccent }) {
  const color =
    accent === "rose" ? "text-rose-400" :
    accent === "amber" ? "text-amber-400" :
    accent === "emerald" ? "text-emerald-400" :
    accent === "violet" ? "text-violet-400" :
    "text-cyan-400";

  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2 last:border-0">
      <span className="text-xs font-bold uppercase tracking-wider text-white/40">{label}</span>
      <span className={cn("text-sm font-black", color)}>{formatCurrency(value)}/mo</span>
    </div>
  );
}

function buildEventPresentation(event: { id: string; title: string; severity: string; warningCopy: string; tags: string[] }): CriticalEventPresentation {
  const type =
    event.tags.includes("ai") ? "warning" :
    event.tags.includes("enterprise") ? "boardroom" :
    event.tags.includes("credits") ? "acquisition" :
    event.severity === "critical" ? "danger" :
    "neutral";
  const accent: CeremonyAccent =
    event.severity === "critical" || event.severity === "high" ? "rose" :
    event.severity === "medium" ? "amber" :
    "cyan";

  return {
    type,
    severity: event.severity as CriticalEventPresentation["severity"],
    eyebrow: "Future Infra Event",
    title: event.title,
    subtitle: event.warningCopy,
    accent,
    affectedStats: [],
    displayKey: `infra-event:${event.id}`,
  };
}

function StackSummary({ stack, recommendedStackTitle }: { stack: InfrastructureStack; recommendedStackTitle: string }) {
  return (
    <GameCard glow="cyan" className="hud-corner">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center border border-cyan-400/25 bg-cyan-500/10 text-cyan-400">
          <Server className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/60">Selected Stack</p>
          <h2 className="text-xl font-black uppercase tracking-tight text-white">{stack.title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-white/50">{stack.description}</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-white/35">Recommended: {recommendedStackTitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {stack.tags.map((tag) => (
          <span key={tag} className="border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-cyan-300">
            {tag}
          </span>
        ))}
      </div>
    </GameCard>
  );
}

function BurnBreakdown({ estimate }: { estimate: InfrastructureBurnEstimate }) {
  return (
    <GameCard glow="violet" className="hud-corner">
      <SectionHeader title="Monthly Infra Burn" subtitle="Runtime gameplay estimate applied through live Monthly Burn." accent="violet" className="mb-4" />
      <div>
        <CostRow label="Fixed Stack Cost" value={estimate.fixedMonthlyCost} />
        <CostRow label="Usage Variable Cost" value={estimate.variableMonthlyCost} />
        <CostRow label="AI/API Cost Exposure" value={estimate.aiMonthlyCost} accent={estimate.aiMonthlyCost > 0 ? "amber" : "cyan"} />
        <CostRow label="Compliance Overhead" value={estimate.complianceMonthlyCost} accent={estimate.complianceMonthlyCost > 0 ? "violet" : "cyan"} />
        <CostRow label="Gross Infra Burn" value={estimate.grossMonthlyInfraBurn} accent="rose" />
        <CostRow label="Cloud Credits Applied" value={estimate.cloudCreditsApplied} accent="emerald" />
      </div>
      <div className="mt-4 border border-emerald-500/20 bg-emerald-500/10 p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Effective Preview Burn</p>
        <p className="text-2xl font-black text-white">{formatCurrency(estimate.effectiveMonthlyInfraBurn)}/mo</p>
      </div>
    </GameCard>
  );
}

function StackAlternatives({
  startupId,
  selectedStackId,
  options,
}: {
  startupId: string;
  selectedStackId: string;
  options: ReturnType<typeof getInfrastructureStackOptions>;
}) {
  return (
    <GameCard glow="cyan" className="hud-corner">
      <SectionHeader title="Stack Alternatives" subtitle="Server-validated choices. Switching is warning-only in v0.1." accent="cyan" className="mb-4" />
      <div className="grid gap-3 lg:grid-cols-2">
        {options.slice(0, 8).map((option) => {
          const stack = getInfrastructureStack(option.stackId);
          if (!stack) return null;
          const selected = option.stackId === selectedStackId;
          return (
            <div
              key={option.stackId}
              className={cn(
                "border p-3",
                selected ? "border-cyan-400/35 bg-cyan-500/10" : option.allowed ? "border-white/10 bg-white/[0.03]" : "border-white/5 bg-white/[0.015] opacity-65"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-tight text-white">{stack.title}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">
                    {formatCurrency(stack.defaultMonthlyCost)}/mo base // trust {stack.investorTrust}/100
                  </p>
                </div>
                <span className={cn("border px-2 py-1 text-[9px] font-black uppercase tracking-wider", selected ? "border-cyan-400/30 text-cyan-300" : option.allowed ? "border-emerald-400/25 text-emerald-300" : "border-rose-400/20 text-rose-300")}>
                  {selected ? "Selected" : option.allowed ? "Available" : "Locked"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wider">
                <span className="border border-white/8 bg-white/[0.03] px-2 py-1 text-white/45">Scale {stack.scalability}</span>
                <span className="border border-white/8 bg-white/[0.03] px-2 py-1 text-white/45">Security {stack.security}</span>
                <span className="border border-white/8 bg-white/[0.03] px-2 py-1 text-white/45">Risk {stack.outageRisk}</span>
              </div>
              {option.lockedReason && <p className="mt-3 text-xs leading-relaxed text-rose-200/65">{option.lockedReason}</p>}
              {option.warnings[0] && <p className="mt-3 text-xs leading-relaxed text-amber-200/65">{option.warnings[0]}</p>}
              <form action={selectInfrastructureStackAction} className="mt-3">
                <input type="hidden" name="startupId" value={startupId} />
                <input type="hidden" name="stackId" value={option.stackId} />
                <button
                  type="submit"
                  disabled={!option.allowed || selected}
                  className={cn(
                    "w-full border px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors",
                    selected
                      ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-300"
                      : option.allowed
                        ? "border-white/15 bg-white/[0.04] text-white/70 hover:border-cyan-400/35 hover:bg-cyan-500/10 hover:text-cyan-200"
                        : "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/25"
                  )}
                >
                  {selected ? "Current Stack" : option.allowed ? "Select Stack" : "Locked"}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </GameCard>
  );
}

function formatEffect(effect: LiveInfrastructureEventRecord["responseOptions"][number]["effect"]): string {
  const parts: string[] = [];
  if (effect.cashDelta) parts.push(`Cash ${effect.cashDelta > 0 ? "+" : ""}${formatCurrency(effect.cashDelta)}`);
  if (effect.productDelta) parts.push(`Product ${effect.productDelta > 0 ? "+" : ""}${effect.productDelta}`);
  if (effect.investorDelta) parts.push(`Investor ${effect.investorDelta > 0 ? "+" : ""}${effect.investorDelta}`);
  if (effect.riskDelta) parts.push(`Risk ${effect.riskDelta > 0 ? "+" : ""}${effect.riskDelta}`);
  return parts.join(" | ") || "No direct stat effect";
}

function OpenInfrastructureEventPanel({ startupId, event }: { startupId: string; event: LiveInfrastructureEventRecord }) {
  const accent = event.severity === "critical" ? "rose" : event.severity === "moderate" ? "amber" : "cyan";
  return (
    <GameCard glow={accent} className="hud-corner">
      <SectionHeader title="Open Infra Event" subtitle={`${event.title} // ${getRunStepLabel(event.week)} // Resolve before this risk compounds`} accent={accent} className="mb-4" />
      <div className="border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={cn(
            "border px-2 py-1 text-[10px] font-black uppercase tracking-wider",
            event.severity === "critical" ? "border-rose-500/25 bg-rose-500/10 text-rose-300" :
            event.severity === "moderate" ? "border-amber-500/25 bg-amber-500/10 text-amber-300" :
            "border-cyan-500/25 bg-cyan-500/10 text-cyan-300"
          )}>
            {event.severity}
          </span>
          <span className="border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white/45">
            {event.type.replace(/_/g, " ")}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-white/65">{event.triggerReason}</p>
        <p className="mt-2 text-xs leading-relaxed text-white/40">
          Infra events are warning-first. Resolve them to manage burn, risk, investor confidence, and product momentum before they become boardroom or brand pressure.
        </p>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {event.responseOptions.map((response) => (
          <form key={response.id} action={resolveInfrastructureEventAction} className="border border-white/10 bg-white/[0.025] p-3">
            <input type="hidden" name="startupId" value={startupId} />
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="responseId" value={response.id} />
            <p className="text-sm font-black uppercase tracking-tight text-white">{response.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/45">{response.description}</p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-cyan-300/80">{formatEffect(response.effect)}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-white/35">{response.counterplay}</p>
            <button type="submit" className="mt-3 w-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20">
              Resolve Response
            </button>
          </form>
        ))}
      </div>
    </GameCard>
  );
}

function InfrastructureEventHistory({ events }: { events: LiveInfrastructureEventRecord[] }) {
  if (events.length === 0) return null;
  const groups = groupInfrastructureEventsByWeek(events);
  return (
    <GameCard glow="violet" className="hud-corner">
      <SectionHeader title="Infra Event Timeline" subtitle="Grouped by Founder Week. These moments can now surface in Arena Feed and Story context." accent="violet" className="mb-4" />
      <div className="space-y-4">
        {groups.slice(0, 6).map((group) => (
          <div key={group.week} className="border border-white/8 bg-white/[0.02] p-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-violet-300/70">{getRunStepLabel(group.week)}</p>
            <div className="space-y-2">
              {group.events.map((event) => (
                <div key={event.id} className="border border-white/8 bg-white/[0.03] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-wider text-white">{event.title}</p>
                    <span className={cn("border px-2 py-1 text-[9px] font-black uppercase tracking-wider", event.resolved ? "border-emerald-500/20 text-emerald-300" : "border-amber-500/20 text-amber-300")}>
                      {event.resolved ? "Resolved" : "Open"}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">{event.type.replace(/_/g, " ")}</p>
                  {event.selectedResponseId && <p className="mt-2 text-[10px] uppercase tracking-wider text-cyan-300/70">Response: {event.selectedResponseId.replace(/_/g, " ")}</p>}
                  {event.effectsSummary && <p className="mt-2 text-xs text-white/45">{event.effectsSummary}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GameCard>
  );
}

export default async function InfrastructurePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let startup;
  try {
    startup = await getStartupById(id);
  } catch {
    notFound();
  }

  const cloudCreditOffers = await db.growthOffer.findMany({
    where: {
      startupId: id,
      offerType: "cloud_credits",
      status: { in: ["proposed", "accepted"] },
    },
    orderBy: { createdAt: "desc" },
  });

  const currentStep =
    startup.status === "completed" || startup.status === "dead"
      ? Math.max(1, Math.min(12, startup.simulationMonths.length || 12))
      : Math.max(1, Math.min(12, startup.simulationMonths.length + 1));
  const previewInput = buildInfrastructurePreviewInputForStartup({
    startup: {
      id: startup.id,
      sector: startup.sector,
      stage: startup.stage,
      status: startup.status,
      monetizationModel: startup.monetizationModel,
      description: startup.description,
      problem: startup.problem,
      solution: startup.solution,
      productProgress: startup.productProgress,
      revenue: startup.revenue,
      riskScore: startup.riskScore,
      simulationMonths: startup.simulationMonths,
    },
    cloudCreditOffers: cloudCreditOffers.map((offer) => ({
      id: offer.id,
      amount: offer.amount,
      status: offer.status,
      sourceOfferId: offer.id,
    })),
    currentSprint: currentStep,
  });
  const infrastructureState = syncCloudCreditBalancesFromOffers(
    parseInfrastructureState(startup.aiAnalysis),
    previewInput.cloudCreditOffers ?? [],
    currentStep,
    startup.id
  );
  const stackOptions = getInfrastructureStackOptions(previewInput);
  const runtimeInfraBurn = calculateRuntimeInfrastructureBurn(previewInput, {
    selectedStackId: infrastructureState.selectedStackId,
    creditBalances: infrastructureState.creditBalances,
  });
  const preview = runtimeInfraBurn.preview;
  const stack = getInfrastructureStack(runtimeInfraBurn.sourceStackId);
  const recommendedStack = getInfrastructureStack(preview.recommendedStackId);
  if (!stack) notFound();
  const aiTier = getAIUsageTierDefinition(preview.aiUsageTier);
  const openInfraEvent = getOpenInfrastructureEvent(infrastructureState);
  const alternateStacks = stackOptions
    .filter((option) => option.allowed && option.stackId !== runtimeInfraBurn.sourceStackId)
    .slice(0, 3)
    .map((option) => getInfrastructureStack(option.stackId))
    .filter(Boolean) as InfrastructureStack[];

  return (
    <PageReveal>
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-24 md:px-8">
        <div className="mb-6">
          <Link href={`/startup/${id}`} className="inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Startup
          </Link>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.35em] text-cyan-400/60">Infrastructure Strategy</p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">Infra Stack Console</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/45">
              Founder Arena models infrastructure as gameplay archetypes, not exact cloud invoices. Your selected stack now affects live Monthly Burn, while cloud credits only offset infrastructure costs.
            </p>
          </div>
          <div className="border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-right">
            <p className="text-[9px] font-black uppercase tracking-wider text-amber-400">Runtime Active</p>
            <p className="text-xs font-bold text-white">Applied to Monthly Burn</p>
          </div>
        </div>

        <StartupRunHud
          startupId={id}
          status={startup.status}
          finalOutcome={startup.finalOutcome}
          currentStep={currentStep}
          hasTeam={startup.employees.some((employee) => employee.status === "active")}
          className="mb-8"
        />

        {openInfraEvent && (
          <div className="mb-8 space-y-4">
            {(openInfraEvent.severity === "critical" || ["cloud_credits_expiring", "llm_token_bill_shock", "prototype_outgrown", "compliance_infrastructure_upgrade"].includes(openInfraEvent.type)) && (
              <EventRevealPanel event={buildInfrastructureEventPresentation({ startupId: id, event: openInfraEvent })} sessionGuard>
                <p className="border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-white/50">
                  This is presentation only: the event is recoverable, response effects remain bounded, and no death or scoring thresholds change.
                </p>
              </EventRevealPanel>
            )}
            <OpenInfrastructureEventPanel startupId={id} event={openInfraEvent} />
          </div>
        )}

        <div className="mb-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <StackSummary stack={stack} recommendedStackTitle={recommendedStack?.title ?? preview.recommendedStackId} />
          <GameCard glow="amber" className="hud-corner">
            <SectionHeader title="Fit Reason" subtitle={`${getRunStepLabel(currentStep)} // model ${preview.burnEstimate.version}`} accent="amber" className="mb-4" />
            <p className="text-sm leading-relaxed text-white/65">{preview.stackFitReason}</p>
            {infrastructureState.selectedStackId && infrastructureState.selectedStackId !== preview.recommendedStackId && (
              <p className="mt-3 border border-cyan-500/20 bg-cyan-500/10 p-2 text-xs leading-relaxed text-cyan-100/70">
                Player-selected stack overrides the deterministic recommendation for live infrastructure burn.
              </p>
            )}
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-white/35">Alternate Stacks</p>
              <div className="flex flex-wrap gap-2">
                {alternateStacks.map((alternate) => (
                  <span key={alternate.id} className="border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/50">
                    {alternate.title}
                  </span>
                ))}
              </div>
            </div>
          </GameCard>
        </div>

        <div className="mb-8">
          <StackAlternatives startupId={id} selectedStackId={runtimeInfraBurn.sourceStackId} options={stackOptions} />
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <BurnBreakdown
            estimate={{
              ...runtimeInfraBurn.selectedBurnEstimate,
              grossMonthlyInfraBurn: runtimeInfraBurn.grossInfraBurn,
              cloudCreditsApplied: runtimeInfraBurn.creditsApplied,
              effectiveMonthlyInfraBurn: runtimeInfraBurn.runtimeMonthlyInfraBurn,
              aiMonthlyCost: runtimeInfraBurn.aiApiBurn,
              complianceMonthlyCost: runtimeInfraBurn.complianceBurn,
            }}
          />
          <GameCard glow="rose" className="hud-corner">
            <SectionHeader title="Risk Matrix" subtitle="Preview-only risk signals for future infra events." accent="rose" className="mb-4" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Reliability", runtimeInfraBurn.riskModifiersPreview.reliabilityRisk],
                ["Scaling", runtimeInfraBurn.riskModifiersPreview.scalingRisk],
                ["Security", runtimeInfraBurn.riskModifiersPreview.securityRisk],
                ["Bill Shock", runtimeInfraBurn.riskModifiersPreview.billShockRisk],
                ["Outage", runtimeInfraBurn.riskModifiersPreview.outageRisk],
                ["Lock-In", stack.lockInRisk],
              ].map(([label, value]) => (
                <div key={label} className={cn("border px-3 py-2", riskAccent(Number(value)))}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
                    <span className="text-sm font-black">{value}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </GameCard>
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <GameCard glow="cyan" className="hud-corner">
            <SectionHeader title="Stack Trade-Offs" subtitle="Ratings are gameplay balance attributes, not provider promises." accent="cyan" className="mb-4" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Reliability", stack.reliability],
                ["Scalability", stack.scalability],
                ["Security", stack.security],
                ["Dev Speed", stack.devSpeed],
                ["Complexity", stack.complexity],
                ["Investor Trust", stack.investorTrust],
                ["AI Readiness", stack.aiReadiness],
                ["Compliance", stack.complianceReadiness],
              ].map(([label, value]) => (
                <BarMetric key={label} label={String(label)} value={Number(value)} />
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {preview.tradeoffs.map((tradeoff) => (
                <p key={tradeoff} className="border border-white/5 bg-white/[0.02] p-2 text-xs leading-relaxed text-white/45">
                  {tradeoff}
                </p>
              ))}
            </div>
          </GameCard>

          <GameCard glow="violet" className="hud-corner">
            <SectionHeader title="AI Usage Exposure" subtitle="Generalized token/API tier. No live model pricing." accent="violet" className="mb-4" />
            <div className="flex items-start gap-3 border border-violet-500/20 bg-violet-500/10 p-3">
              <BrainCircuit className="mt-0.5 h-5 w-5 text-violet-400" />
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-white">{aiTier?.title ?? preview.aiUsageTier}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/55">{aiTier?.description ?? "AI tier unavailable."}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="border border-white/8 bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">AI Requests / User</p>
                <p className="text-xl font-black text-white">{preview.usageProfile.aiRequestsPerUser}</p>
              </div>
              <div className="border border-white/8 bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Avg Input</p>
                <p className="text-xl font-black text-white">{preview.usageProfile.avgInputTokens}</p>
              </div>
              <div className="border border-white/8 bg-white/[0.03] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Avg Output</p>
                <p className="text-xl font-black text-white">{preview.usageProfile.avgOutputTokens}</p>
              </div>
            </div>
          </GameCard>
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <GameCard glow="emerald" className="hud-corner">
            <SectionHeader title="Cloud Credits Lifecycle" subtitle="Credits reduce infrastructure burn only, then deplete or expire." accent="emerald" className="mb-4" />
            {(runtimeInfraBurn.creditBalances ?? infrastructureState.creditBalances).length > 0 ? (
              <div className="space-y-3">
                {(runtimeInfraBurn.creditBalances ?? infrastructureState.creditBalances).map((credit) => (
                  <div key={credit.id} className="border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black uppercase tracking-wider text-white">{credit.sourceOfferId ?? credit.id}</span>
                      <span className="text-sm font-black text-emerald-400">{formatCurrency(credit.remainingAmount)} left</span>
                    </div>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-emerald-200/50">
                      Status {credit.status} | expires {getRunStepLabel(credit.expiresAtSprint)} | applied {formatCurrency(credit.totalApplied)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-white/8 bg-white/[0.03] p-4">
                <Cloud className="mb-2 h-5 w-5 text-emerald-400" />
                <p className="text-sm font-bold text-white">No cloud credits detected.</p>
                <p className="mt-1 text-xs leading-relaxed text-white/45">Accept Cloud Credits from Growth Offers to create a finite infrastructure credit balance.</p>
              </div>
            )}
            <p className="mt-3 text-[10px] uppercase tracking-wider text-white/35">
              Applied this sprint estimate: {formatCurrency(runtimeInfraBurn.creditsApplied)} against infrastructure burn only. Simulation persists depletion idempotently.
            </p>
          </GameCard>

          <GameCard glow="amber" className="hud-corner">
            <SectionHeader title="Preview Inputs" subtitle="Derived from existing startup state; no state is mutated." accent="amber" className="mb-4" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Users", preview.usageProfile.users.toLocaleString(), <Zap key="users" className="h-4 w-4" />],
                ["MAU", preview.usageProfile.monthlyActiveUsers.toLocaleString(), <ReceiptText key="mau" className="h-4 w-4" />],
                ["Data Transfer", `${preview.usageProfile.dataTransferGb} GB`, <Cloud key="transfer" className="h-4 w-4" />],
                ["DB Storage", `${preview.usageProfile.dbStorageGb} GB`, <Database key="db" className="h-4 w-4" />],
                ["Compliance", preview.usageProfile.complianceLevel, <ShieldCheck key="compliance" className="h-4 w-4" />],
                ["Volatility", preview.usageProfile.trafficVolatility, <AlertTriangle key="vol" className="h-4 w-4" />],
              ].map(([label, value, icon]) => (
                <div key={String(label)} className="border border-white/8 bg-white/[0.03] p-3">
                  <div className="mb-1 flex items-center gap-2 text-cyan-400">{icon}</div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">{label}</p>
                  <p className="text-sm font-black uppercase tracking-wider text-white">{value}</p>
                </div>
              ))}
            </div>
          </GameCard>
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <EventImpactBanner
            event={{
              type: "strategy",
              severity: "medium",
              eyebrow: "Strategy Hook",
              title: "Infra Responses Can Signal Playstyle",
              subtitle: "Optimization, compliance, and cost-control responses can emit small strategy signals when resolved.",
              accent: "violet",
              primaryCta: { label: "View Strategy", href: `/startup/${id}/strategy` },
            }}
          />
          <EventImpactBanner
            event={{
              type: "boardroom",
              severity: openInfraEvent?.severity === "critical" ? "high" : "medium",
              eyebrow: "Boardroom Awareness",
              title: "Infrastructure Risk Can Become Investor Pressure",
              subtitle: "Unresolved critical infra risk is visible context for future board pressure, but Phase 16G adds no boardroom triggers.",
              accent: openInfraEvent?.severity === "critical" ? "amber" : "cyan",
              primaryCta: { label: "View Boardroom", href: `/startup/${id}/boardroom` },
            }}
          />
          <EventImpactBanner
            event={{
              type: "viral",
              severity: "medium",
              eyebrow: "Social Awareness",
              title: "Arena Feed Tracks Infra Incidents",
              subtitle: "Triggers and resolutions now appear in the Arena Feed using safe, generic infrastructure language.",
              accent: "emerald",
              primaryCta: { label: "View Arena Feed", href: `/startup/${id}/social` },
            }}
          />
        </div>

        {preview.warnings.length > 0 && (
          <GameCard glow="rose" className="mb-8 hud-corner">
            <SectionHeader title="Warnings" subtitle="Credit cliffs, selected-stack trade-offs, and future infra event risks." accent="rose" className="mb-4" />
            <div className="space-y-2">
              {Array.from(new Set([
                ...preview.warnings.filter((warning) => {
                  const lower = warning.toLowerCase();
                  return !lower.includes("preview only") && !lower.includes("preview mode");
                }),
                ...runtimeInfraBurn.warnings,
              ])).map((warning) => (
                <p key={warning} className="border border-rose-500/15 bg-rose-500/8 p-2 text-xs leading-relaxed text-rose-100/70">
                  {warning}
                </p>
              ))}
            </div>
          </GameCard>
        )}

        <div className="mb-8">
          <SectionHeader title="Infra Event Risk Catalog" subtitle="Live events are conservative and warning-first; these are the modeled risk families." accent="rose" className="mb-4" />
          <div className="grid gap-3 lg:grid-cols-2">
            {preview.futureEventsPreview.map((event) => (
              <EventImpactBanner key={event.id} event={buildEventPresentation(event)} />
            ))}
          </div>
        </div>

        <GameCard glow="cyan" className="hud-corner">
          <SectionHeader title="Runtime Safety Notice" subtitle="Stack selection, credits, and infra events are runtime-active." accent="cyan" className="mb-4" />
          <p className="text-sm leading-relaxed text-white/55">
            Infrastructure burn is included in live Monthly Burn through the existing burn path. Stack selection and cloud credit depletion are deterministic gameplay systems, not exact provider billing.
            Infra events are warning-first response moments and do not change death thresholds, scoring formulas, funding math, career math, leaderboard formulas, or provider integrations.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/startup/${id}/operate`} className="border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20">
              Return to Operate
            </Link>
            <Link href={`/startup/${id}/growth`} className="border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-violet-300 hover:bg-violet-500/20">
              Check Growth Offers
            </Link>
          </div>
        </GameCard>

        <div className="mt-8">
          <InfrastructureEventHistory events={infrastructureState.infraEventHistory} />
        </div>
      </div>
    </PageReveal>
  );
}
