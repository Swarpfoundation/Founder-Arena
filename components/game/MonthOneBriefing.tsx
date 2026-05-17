"use client";

import Link from "next/link";
import { EventRevealPanel } from "@/components/game/EventRevealPanel";
import { buildFirstRunAction } from "@/lib/gamefeel/first-run";
import { getRunPhaseLabel, getRunStepLabel, getShortRunStepLabel } from "@/lib/game-time/time-scale";

export function MonthOneBriefing({
  startupId,
  status,
  monthsRun,
  teamSize,
  className,
}: {
  startupId: string;
  status: string;
  monthsRun: number;
  teamSize: number;
  className?: string;
}) {
  if (!["funded", "active"].includes(status) || monthsRun > 0) return null;

  const action = buildFirstRunAction({
    startupId,
    status,
    hasPitch: true,
    hasReview: true,
    hasFunding: true,
    monthsRun,
    teamSize,
  });

  return (
    <EventRevealPanel
      className={className}
      event={{
        type: "breakout",
        severity: "high",
        eyebrow: `${getRunStepLabel(1)} Briefing`,
        title: "First Arena Test Ready",
        subtitle:
          "Week 1 decides your first signal: product, revenue, trust, or survival. Choose a sprint decision, run the sprint, then inspect what the market, rivals, investors, and social channels did to your company.",
        accent: "cyan",
        primaryCta: { label: action.label, href: action.href },
        secondaryCta: { label: teamSize === 0 ? "Open Team" : "View Arena Systems", href: teamSize === 0 ? `/startup/${startupId}/team` : `/startup/${startupId}/social` },
        affectedStats: [
          { label: "Phase", value: getRunPhaseLabel(1).toUpperCase(), accent: "cyan" },
          { label: "Week", value: getShortRunStepLabel(1), accent: "amber" },
          { label: "Team", value: teamSize > 0 ? `${teamSize} ACTIVE` : "EMPTY", accent: teamSize > 0 ? "emerald" : "rose" },
          { label: "Loop", value: "DECIDE → RECAP", accent: "violet" },
        ],
        displayKey: `month-one:${startupId}`,
      }}
    >
      <div className="grid gap-2 md:grid-cols-3">
        {[
          { label: "Choose", text: "Pick up to three operating decisions." },
          { label: "Run", text: "Resolve the sprint and read the delta recap." },
          { label: "Inspect", text: "Check Social, Rivals, Strategy, and Boardroom signals." },
        ].map((item) => (
          <div key={item.label} className="border border-white/10 bg-white/[0.03] p-3">
            <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-cyan-400">{item.label}</p>
            <p className="text-xs leading-relaxed text-white/55">{item.text}</p>
          </div>
        ))}
      </div>
      <Link href={`/startup/${startupId}/social`} className="inline-flex text-[10px] font-black uppercase tracking-wider text-white/35 hover:text-cyan-300">
        View Arena systems after the first recap
      </Link>
    </EventRevealPanel>
  );
}
