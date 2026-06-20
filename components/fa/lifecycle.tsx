"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Reveal, SectionHeading, CountUp } from "./primitives";
import { Rocket, Sprout, TrendingUp, Building2, Crown, Flag } from "lucide-react";

const ROUNDS = [
  {
    key: "preseed",
    icon: Sprout,
    name: "Pre-Seed",
    raise: "$500K",
    val: 4,
    dilution: 12,
    founder: 88,
    staff: 0,
    investors: 12,
    desc: "Validate the thesis. Ship the MVP. Find your first ten users who can’t live without it.",
    milestone: "First paying customer",
  },
  {
    key: "seed",
    icon: Rocket,
    name: "Seed",
    raise: "$3M",
    val: 14,
    dilution: 18,
    founder: 70,
    staff: 5,
    investors: 25,
    desc: "Prove product-market fit. Build the wedge. Turn usage into revenue and revenue into a story.",
    milestone: "$100K ARR",
  },
  {
    key: "a",
    icon: TrendingUp,
    name: "Series A",
    raise: "$12M",
    val: 48,
    dilution: 22,
    founder: 58,
    staff: 12,
    investors: 30,
    desc: "Scale the engine. Hire the leadership team. Build a repeatable, profitable go-to-market motion.",
    milestone: "$1M ARR",
  },
  {
    key: "b",
    icon: Building2,
    name: "Series B",
    raise: "$30M",
    val: 180,
    dilution: 16,
    founder: 50,
    staff: 18,
    investors: 32,
    desc: "Expand into new markets and segments. Build the org, the playbook, and the moat around it.",
    milestone: "$10M ARR",
  },
  {
    key: "c",
    icon: Crown,
    name: "Series C",
    raise: "$60M",
    val: 520,
    dilution: 12,
    founder: 45,
    staff: 22,
    investors: 33,
    desc: "Win the category. Pre-IPO discipline, unit economics, and the operational maturity of a public company.",
    milestone: "$50M ARR",
  },
  {
    key: "ipo",
    icon: Flag,
    name: "IPO",
    raise: "$240M",
    val: 1400,
    dilution: 18,
    founder: 40,
    staff: 23,
    investors: 37,
    desc: "Ring the bell. Quarterly earnings, public scrutiny, and the title every founder secretly wants.",
    milestone: "Public listing",
  },
];

export function Lifecycle() {
  const [active, setActive] = React.useState(2); // start at Series A
  const r = ROUNDS[active];

  return (
    <section id="lifecycle" className="relative w-full overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-1/4 top-1/4 h-[40vh] w-[40vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.10),transparent_70%)] blur-2xl" />
      </div>

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          label="The Funding Lifecycle"
          title={
            <>
              Every round <span className="text-gradient-cyan">reshapes</span> who owns the future.
            </>
          }
          description="Pre-seed to IPO. Raise capital, negotiate dilution, and protect your cap table — or watch control slip away one signature at a time."
        />

        {/* Round selector */}
        <Reveal delay={0.1}>
          <div className="mt-12 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
            {ROUNDS.map((round, i) => {
              const isActive = i === active;
              return (
                <button
                  key={round.key}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "group relative flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center transition-all duration-300",
                    isActive
                      ? "border-cyan/40 bg-cyan/[0.07] shadow-[0_0_30px_-8px_rgba(0,212,255,0.4)]"
                      : "border-white/[0.06] bg-white/[0.015] hover:border-cyan/20 hover:bg-white/[0.03]"
                  )}
                  aria-pressed={isActive}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                      isActive
                        ? "bg-cyan text-[#031016]"
                        : "bg-white/5 text-cyan-soft group-hover:bg-cyan/10"
                    )}
                  >
                    <round.icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <span
                    className={cn(
                      "text-[0.7rem] font-semibold sm:text-sm",
                      isActive ? "text-white" : "text-muted-foreground"
                    )}
                  >
                    {round.name}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Detail panel */}
        <Reveal delay={0.15}>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left: round details */}
            <AnimatePresence mode="wait">
              <motion.div
                key={r.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="card-glow rounded-3xl p-6 sm:p-8"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan text-[#031016] shadow-[0_0_24px_rgba(0,212,255,0.45)]">
                    <r.icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="text-[0.62rem] uppercase tracking-[0.2em] text-cyan-soft">Round</div>
                    <div className="font-display text-2xl font-semibold">{r.name}</div>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {r.desc}
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <Stat label="Raise" value={r.raise} />
                  <Stat label="Post-money" value={`$${r.val >= 1000 ? `${(r.val / 1000).toFixed(1)}B` : `${r.val}M`}`} />
                  <Stat label="Dilution" value={`${r.dilution}%`} accent />
                </div>

                <div className="mt-5 flex items-center gap-2 rounded-2xl border border-cyan/15 bg-cyan/[0.05] px-4 py-3">
                  <Flag className="h-4 w-4 text-cyan" />
                  <span className="text-sm text-white/80">
                    <span className="text-muted-foreground">Milestone to unlock: </span>
                    <span className="font-semibold text-white">{r.milestone}</span>
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Right: cap table */}
            <div className="card-glow rounded-3xl p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Cap table</div>
                  <div className="font-display text-lg font-semibold">Ownership after {r.name}</div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[0.62rem] text-muted-foreground">
                  Live preview
                </div>
              </div>

              {/* Stacked bar */}
              <div className="mt-6">
                <div className="flex h-12 w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                  <motion.div
                    key={`f-${r.key}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${r.founder}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center bg-gradient-to-r from-cyan-deep to-cyan text-[0.6rem] font-semibold text-[#031016]"
                  >
                    {r.founder >= 10 ? `${r.founder}%` : ""}
                  </motion.div>
                  <motion.div
                    key={`s-${r.key}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${r.staff}%` }}
                    transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center bg-[#36e0c8] text-[0.6rem] font-semibold text-[#031016]"
                  >
                    {r.staff >= 8 ? `${r.staff}%` : ""}
                  </motion.div>
                  <motion.div
                    key={`i-${r.key}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${r.investors}%` }}
                    transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center bg-[#7c8cff]/70 text-[0.6rem] font-semibold text-white"
                  >
                    {r.investors >= 10 ? `${r.investors}%` : ""}
                  </motion.div>
                </div>

                {/* Legend */}
                <div className="mt-4 space-y-2">
                  <LegendRow color="from-cyan-deep to-cyan" label="Founders" value={r.founder} />
                  <LegendRow color="bg-[#36e0c8]" label="Employee option pool" value={r.staff} />
                  <LegendRow color="bg-[#7c8cff]/70" label="Investors" value={r.investors} />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">Founder control</div>
                <div className="mt-1.5 flex items-end justify-between">
                  <span className="font-display text-2xl font-semibold text-glow">
                    <CountUp key={r.key} to={r.founder} duration={0.8} />%
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      r.founder >= 50 ? "text-emerald-300" : r.founder >= 40 ? "text-amber-300" : "text-rose-300"
                    )}
                  >
                    {r.founder >= 50 ? "Majority retained" : r.founder >= 40 ? "Board control at risk" : "Control slipping"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 text-center">
      <div className={cn("font-display text-lg font-semibold sm:text-xl", accent && "text-cyan")}>{value}</div>
      <div className="mt-0.5 text-[0.55rem] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={cn("h-3 w-3 rounded-sm bg-gradient-to-r", color)} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-semibold text-white">{value}%</span>
    </div>
  );
}
