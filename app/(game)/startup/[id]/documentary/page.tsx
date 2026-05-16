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
        <div className="game-card p-8 hud-corner text-center space-y-3">
          <p className="text-white/60 text-sm font-bold tracking-wider uppercase">
            Documentary Not Available
          </p>
          <p className="text-white/40 text-xs">
            The founder documentary is generated when a startup run is finalized.
            Complete or end your run to unlock this record.
          </p>
          <Link href={`/startup/${id}`} className="inline-flex items-center gap-1 text-cyan-400 text-xs hover:text-cyan-300 transition-colors">
            Back to startup
          </Link>
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
