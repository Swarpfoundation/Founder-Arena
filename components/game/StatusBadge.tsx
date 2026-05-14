"use client";

import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; classes: string; dot: string }> = {
  active: { label: "ACTIVE", classes: "border-emerald-400/30 text-emerald-400 bg-emerald-400/10", dot: "bg-emerald-400" },
  dead: { label: "DEAD", classes: "border-rose-400/30 text-rose-400 bg-rose-400/10", dot: "bg-rose-400" },
  completed: { label: "COMPLETED", classes: "border-cyan-400/30 text-cyan-400 bg-cyan-400/10", dot: "bg-cyan-400" },
  proposed: { label: "PROPOSED", classes: "border-amber-400/30 text-amber-400 bg-amber-400/10", dot: "bg-amber-400" },
  countered: { label: "COUNTERED", classes: "border-violet-400/30 text-violet-400 bg-violet-400/10", dot: "bg-violet-400" },
  accepted: { label: "ACCEPTED", classes: "border-emerald-400/30 text-emerald-400 bg-emerald-400/10", dot: "bg-emerald-400" },
  rejected: { label: "REJECTED", classes: "border-rose-400/30 text-rose-400 bg-rose-400/10", dot: "bg-rose-400" },
  expired: { label: "EXPIRED", classes: "border-white/10 text-white/40 bg-white/5", dot: "bg-white/40" },
  funded: { label: "FUNDED", classes: "border-cyan-400/30 text-cyan-400 bg-cyan-400/10", dot: "bg-cyan-400" },
  pitched: { label: "PITCHED", classes: "border-cyan-400/30 text-cyan-400 bg-cyan-400/10", dot: "bg-cyan-400" },
  operating: { label: "OPERATING", classes: "border-emerald-400/30 text-emerald-400 bg-emerald-400/10", dot: "bg-emerald-400" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = statusMap[status.toLowerCase()] ?? {
    label: status.toUpperCase(),
    classes: "border-white/10 text-white/40 bg-white/5",
    dot: "bg-white/40",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-bold tracking-wider",
        s.classes,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
