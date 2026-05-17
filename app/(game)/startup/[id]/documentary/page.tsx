import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDocumentaryData } from "@/lib/actions/documentary";
import { DocumentaryClient } from "./documentary-client";

export const dynamic = "force-dynamic";

export default async function DocumentaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getDocumentaryData(id);
  } catch {
    notFound();
  }

  if (!data.isFinalized) {
    return (
      <div className="max-w-4xl mx-auto pt-24 pb-12 px-4 md:px-8 space-y-5">
        <div className="flex items-center gap-3">
          <Link href={`/startup/${id}`}>
            <div className="w-10 h-10 game-card flex items-center justify-center text-cyan-400">
              <ArrowLeft className="w-5 h-5" />
            </div>
          </Link>
          <div>
            <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">
              FOUNDER DOCUMENTARY
            </p>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {data.startup.name}
            </h1>
          </div>
        </div>
        <div className="game-card p-8 hud-corner space-y-4">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-1">
              Unlocks at Run End
            </p>
            <h2 className="text-lg font-black text-white">Your Documentary Generates When the Run Ends</h2>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">
            When your startup completes its 12-month run — or dies — Founder Arena generates
            a documentary: narrative arc, key moments, rival battles, boardroom drama, and
            final outcome. Every detail is pulled from your actual decisions.
          </p>
          <p className="text-violet-400/70 text-xs italic">
            &ldquo;Every finished run becomes a founder documentary and career legacy.&rdquo;
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link href={`/startup/${id}/operate`}>
              <div className="inline-block px-5 py-2.5 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold tracking-wider uppercase cursor-pointer hover:bg-cyan-500/20 transition-colors">
                CONTINUE RUN
              </div>
            </Link>
            <Link href={`/startup/${id}`} className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Back to overview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pt-24 pb-12 px-4 md:px-8 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/startup/${id}`}>
          <div className="w-10 h-10 game-card flex items-center justify-center text-cyan-400">
            <ArrowLeft className="w-5 h-5" />
          </div>
        </Link>
        <div>
          <p className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">
            FOUNDER DOCUMENTARY // {data.startup.sector}
          </p>
          <h1 className="text-2xl font-black text-white tracking-tight text-glow-cyan">
            {data.documentary.title}
          </h1>
        </div>
      </div>

      <DocumentaryClient data={data} startupId={id} />
    </div>
  );
}
