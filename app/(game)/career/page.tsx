import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCareerRecord } from "@/lib/actions/career";
import { CareerClient } from "./career-client";
import { EventImpactBanner } from "@/components/game/EventImpactBanner";
import { getRouteSprintAtmosphere } from "@/lib/game-time/route-atmosphere";
import { GameScene } from "@/components/game/GameScene";

export const dynamic = "force-dynamic";

export default async function CareerPage() {
  const data = await getCareerRecord();

  return (
    <GameScene
      eyebrow="Founder Legacy"
      title="Legacy Archive"
      subtitle="Your founder career record across every run, rival, exit, shutdown, badge, and hard-earned identity shift."
      accent="amber"
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard" className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black uppercase tracking-wider text-white/50 hover:bg-white/10">
            <ArrowLeft className="h-3.5 w-3.5" />
            Command Deck
          </Link>
          <Link href="/startup/new" className="inline-flex items-center gap-2 border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20">
            Start New Run
          </Link>
        </div>
      }
    >
      <EventImpactBanner event={getRouteSprintAtmosphere("career")} />
      <CareerClient data={data} />
    </GameScene>
  );
}
