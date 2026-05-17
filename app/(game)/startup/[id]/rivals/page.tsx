import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRivalState } from "@/lib/actions/rivals";
import { RivalsClient } from "./rivals-client";
import { StartupRunHud } from "@/components/game/StartupRunHud";
import { EventImpactBanner } from "@/components/game/EventImpactBanner";
import { PageReveal } from "@/components/game/PageReveal";
import { getRunStepLabel } from "@/lib/game-time/time-scale";
import { getRouteSprintAtmosphere } from "@/lib/game-time/route-atmosphere";

export const dynamic = "force-dynamic";

export default async function RivalsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getRivalState(id);
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
              Rivals // Locked
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
            <h2 className="text-lg font-black text-white">Rival Founders Emerge Once You&apos;re Operating</h2>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">
            Rival startups are generated based on your sector, metrics, and strategy. They
            react to your launches, copy your wins, and exploit your weak spots. Track rivalry
            scores and defeat them before they outpace you.
          </p>
          <p className="text-rose-400/70 text-xs italic">
            &ldquo;Rivals react to your launches, callouts, and weak spots.&rdquo;
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
            RIVALS // {data.startupName}
          </p>
          <h1 className="text-2xl font-black text-white tracking-tight text-glow-cyan">
            ARENA RIVALS
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-bold px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 uppercase tracking-wider">
            {getRunStepLabel(data.currentMonth)}
          </span>
        </div>
      </div>

      <EventImpactBanner event={getRouteSprintAtmosphere("rivals", currentStep)} />

      <RivalsClient
        startupId={id}
        rivals={data.rivals}
        moveHistory={data.moveHistory}
        availableCounterActions={data.availableCounterActions}
        comparison={data.comparison}
        startupStatus={data.startupStatus}
        currentMonth={data.currentMonth}
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
