import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRivalState } from "@/lib/actions/rivals";
import { RivalsClient } from "./rivals-client";

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
        <div className="game-card p-8 text-center hud-corner">
          <p className="text-white/40 text-sm uppercase tracking-wider font-bold mb-2">
            RIVALS LOCKED
          </p>
          <p className="text-white/60 text-sm">
            Rival startups emerge once your startup is funded and operating.
          </p>
          <Link href={`/startup/${id}/pitch`}>
            <div className="mt-6 inline-block px-6 py-3 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold tracking-wider uppercase cursor-pointer hover:bg-cyan-500/20 transition-colors">
              GO TO PITCH
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pt-24 pb-12 px-4 md:px-8 space-y-5">
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
            Month {data.currentMonth}
          </span>
        </div>
      </div>

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
    </div>
  );
}
