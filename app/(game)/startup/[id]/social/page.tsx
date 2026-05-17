import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSocialState } from "@/lib/actions/social";
import { SocialClient } from "./social-client";
import { StartupRunHud } from "@/components/game/StartupRunHud";
import { EventImpactBanner } from "@/components/game/EventImpactBanner";
import { PageReveal } from "@/components/game/PageReveal";
import { getRunStepLabel } from "@/lib/game-time/time-scale";
import { getRouteSprintAtmosphere } from "@/lib/game-time/route-atmosphere";

export const dynamic = "force-dynamic";

export default async function SocialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getSocialState(id);
  } catch {
    notFound();
  }

  if (!["funded", "active", "completed", "dead"].includes(data.startupStatus)) {
    return (
      <div className="max-w-4xl mx-auto pt-24 pb-12 px-4 md:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/startup/${id}`}>
            <div className="w-10 h-10 game-card flex items-center justify-center text-cyan-400">
              <ArrowLeft className="w-5 h-5" />
            </div>
          </Link>
          <div>
            <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">
              Arena Feed // Locked
            </p>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {data.startupName}
            </h1>
          </div>
        </div>
        <div className="game-card p-8 hud-corner space-y-4">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-1">
              Unlocks After Funding
            </p>
            <h2 className="text-lg font-black text-white">Social Pressure Starts After Funding</h2>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">
            Your startup&apos;s social presence — hype, trust, community, viral moments — goes
            live once you&apos;re funded and operating. Every action ripples through your metrics.
          </p>
          <p className="text-cyan-400/70 text-xs italic">
            &ldquo;Social pressure turns attention into growth — or backlash.&rdquo;
          </p>
          <div className="pt-2">
            <Link href={`/startup/${id}/pitch`}>
              <div className="inline-block px-6 py-3 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold tracking-wider uppercase cursor-pointer hover:bg-cyan-500/20 transition-colors">
                GO TO PITCH
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const currentStep = Math.max(1, Math.min(12, data.currentMonth || 1));

  return (
    <PageReveal className="max-w-5xl mx-auto pt-24 pb-12 px-4 md:px-8 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/startup/${id}`}>
          <div className="w-10 h-10 game-card flex items-center justify-center text-cyan-400">
            <ArrowLeft className="w-5 h-5" />
          </div>
        </Link>
        <div>
          <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">
            Arena Feed // {data.startupName}
          </p>
          <h1 className="text-2xl font-black text-white tracking-tight text-glow-cyan">
            SOCIAL LAYER
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-bold px-3 py-1 bg-violet-500/10 border border-violet-500/30 text-violet-400 uppercase tracking-wider">
            {getRunStepLabel(data.currentMonth)}
          </span>
        </div>
      </div>

      <EventImpactBanner event={getRouteSprintAtmosphere("social", currentStep)} />

      <SocialClient
        startupId={id}
        initialState={data.state}
        currentMonth={data.currentMonth}
        availableActions={data.availableActions}
        startupName={data.startupName}
        startupStatus={data.startupStatus}
        productProgress={data.productProgress}
        revenue={data.revenue}
        investorScore={data.investorScore}
        riskScore={data.riskScore}
        sector={data.sector}
      />

      <StartupRunHud
        startupId={id}
        status={data.startupStatus}
        currentStep={currentStep}
      />
    </PageReveal>
  );
}
