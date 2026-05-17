import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBoardroomState } from "@/lib/actions/boardroom";
import { BoardroomClient } from "./boardroom-client";

export const dynamic = "force-dynamic";

export default async function BoardroomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getBoardroomState(id);
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
              Boardroom // Locked
            </p>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {data.startupName}
            </h1>
          </div>
        </div>
        <div className="game-card p-8 text-center hud-corner">
          <p className="text-white/40 text-sm uppercase tracking-wider font-bold mb-2">
            BOARDROOM LOCKED
          </p>
          <p className="text-white/60 text-sm">
            Boardroom pressure events activate once your startup is funded and operating.
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
      <div className="flex items-center gap-3">
        <Link href={`/startup/${id}`}>
          <div className="w-10 h-10 game-card flex items-center justify-center text-cyan-400">
            <ArrowLeft className="w-5 h-5" />
          </div>
        </Link>
        <div>
          <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">
            BOARDROOM // {data.startupName}
          </p>
          <h1 className="text-2xl font-black text-white tracking-tight text-glow-cyan">
            BOARDROOM BATTLES
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-bold px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-wider">
            Month {data.currentMonth}
          </span>
          {data.boardroomState.currentOpenEvent && (
            <span className="text-[10px] font-bold px-3 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-400 uppercase tracking-wider animate-pulse">
              ACTION REQUIRED
            </span>
          )}
        </div>
      </div>

      <BoardroomClient
        startupId={id}
        data={data}
      />
    </div>
  );
}
