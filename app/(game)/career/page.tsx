import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCareerRecord } from "@/lib/actions/career";
import { CareerClient } from "./career-client";
import { EventImpactBanner } from "@/components/game/EventImpactBanner";
import { getRouteSprintAtmosphere } from "@/lib/game-time/route-atmosphere";

export const dynamic = "force-dynamic";

export default async function CareerPage() {
  const data = await getCareerRecord();

  return (
    <div className="max-w-6xl mx-auto pt-24 pb-12 px-4 md:px-8 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <div className="w-10 h-10 game-card flex items-center justify-center text-cyan-400">
            <ArrowLeft className="w-5 h-5" />
          </div>
        </Link>
        <div>
          <p className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">
            FOUNDER LEGACY // Career Record
          </p>
          <h1 className="text-2xl font-black text-white tracking-tight text-glow-cyan">
            {data.founderTitle.toUpperCase()}
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-bold px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-wider">
            LVL {data.level}
          </span>
          {data.totalStartups === 0 && (
            <Link href="/startup/new">
              <span className="text-[10px] font-bold px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 uppercase tracking-wider cursor-pointer hover:bg-cyan-500/20 transition-colors">
                DEPLOY FIRST STARTUP
              </span>
            </Link>
          )}
        </div>
      </div>

      <EventImpactBanner event={getRouteSprintAtmosphere("career")} />

      <CareerClient data={data} />
    </div>
  );
}
