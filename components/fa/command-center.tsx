"use client";

import * as React from "react";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { Reveal, SectionHeading, CountUp } from "./primitives";
import {
  Building2,
  TrendingUp,
  Wallet,
  Flame,
  Users,
  Gauge,
  Target,
  AlertTriangle,
  ArrowUpRight,
  Bell,
} from "lucide-react";

const KPI = [
  { icon: TrendingUp, label: "Valuation", value: 48.2, prefix: "$", suffix: "M", decimals: 1, delta: "+12.4%", good: true },
  { icon: Wallet, label: "Runway", value: 11.2, suffix: " mo", decimals: 1, delta: "stable", good: true },
  { icon: TrendingUp, label: "MRR", value: 182, prefix: "$", suffix: "K", decimals: 0, delta: "+14% MoM", good: true },
  { icon: Flame, label: "Burn", value: 214, prefix: "$", suffix: "K/mo", decimals: 0, delta: "+3%", good: false },
];

const MISSIONS = [
  { title: "Close Series A — $12M", progress: 62, days: "Day 4 / 7", active: true },
  { title: "Hit $200K MRR", progress: 91, days: "On track" },
  { title: "Hire Head of Sales", progress: 40, days: "3 candidates" },
];

const FEED = [
  { icon: AlertTriangle, tone: "amber", title: "Competitor launched v2", time: "2m ago", action: "Respond" },
  { icon: Users, tone: "cyan", title: "Senior eng requested a raise", time: "1h ago", action: "Review" },
  { icon: Flame, tone: "rose", title: "Runway dropped below 9 months", time: "3h ago", action: "Plan" },
];

const CHART_POINTS = [8, 10, 9, 14, 18, 16, 22, 28, 26, 34, 42, 48];

export function CommandCenter() {
  const chartRef = useRef<HTMLDivElement>(null);
  const inView = useInView(chartRef, { once: true, margin: "-80px" });

  const data = CHART_POINTS;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 100;
  const h = 40;
  const step = w / (data.length - 1);
  const norm = (v: number) => h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${norm(v)}`).join(" ");
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;

  return (
    <section id="dashboard" className="relative w-full overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/4 h-[50vh] w-[70vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.10),transparent_70%)] blur-2xl" />
      </div>

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          label="The Command Center"
          title={
            <>
              Every founder needs a <span className="text-gradient-cyan">cockpit.</span>
            </>
          }
          description="The in-game operating system tracks every signal — valuation, runway, burn, team velocity, and the crises that arrive unannounced. Decide fast, or the market decides for you."
        />

        <Reveal delay={0.1}>
          <div className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-[#070b12] shadow-[0_60px_120px_-50px_rgba(0,0,0,0.9)]">
            {/* Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan to-cyan-deep text-[#031016] shadow-[0_0_20px_rgba(0,212,255,0.45)]">
                  <Building2 className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div className="leading-tight">
                  <div className="font-display text-base font-semibold">Nimbus AI</div>
                  <div className="text-[0.6rem] uppercase tracking-wider text-cyan-soft/70">Series A · Day 142</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[0.62rem] text-muted-foreground sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  All systems nominal
                </div>
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-cyan-soft">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-400" />
                </div>
              </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 gap-px bg-white/[0.04] sm:grid-cols-4">
              {KPI.map((k) => (
                <div key={k.label} className="bg-[#070b12] p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <k.icon className="h-4 w-4 text-cyan-soft" />
                    <span
                      className={cn(
                        "text-[0.58rem] font-semibold",
                        k.good ? "text-emerald-300" : "text-amber-300"
                      )}
                    >
                      {k.delta}
                    </span>
                  </div>
                  <div className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                    {k.prefix}
                    <CountUp to={k.value} decimals={k.decimals} duration={2} />
                    {k.suffix}
                  </div>
                  <div className="mt-0.5 text-[0.58rem] uppercase tracking-wider text-muted-foreground">{k.label}</div>
                </div>
              ))}
            </div>

            {/* Main area */}
            <div className="grid grid-cols-1 gap-px bg-white/[0.04] lg:grid-cols-[1.6fr_1fr]">
              {/* Chart */}
              <div ref={chartRef} className="bg-[#070b12] p-5 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">Valuation trajectory</div>
                    <div className="mt-1 font-display text-3xl font-semibold text-glow">
                      $<CountUp to={48.2} decimals={1} duration={2.2} />M
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[0.62rem] font-semibold text-emerald-300">
                    <ArrowUpRight className="h-3 w-3" /> +12.4% this week
                  </div>
                </div>

                <div className="relative mt-5 h-40 sm:h-52">
                  <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                    <defs>
                      <linearGradient id="ccStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0091b8" />
                        <stop offset="100%" stopColor="#80e6ff" />
                      </linearGradient>
                      <linearGradient id="ccArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[8, 16, 24, 32].map((y) => (
                      <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.15" />
                    ))}
                    <motion.path
                      d={area}
                      fill="url(#ccArea)"
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 1 } : {}}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      style={{ clipPath: "inset(0 100% 0 0)" }}
                    />
                    <motion.path
                      d={area}
                      fill="none"
                      stroke="url(#ccStroke)"
                      strokeWidth="0.9"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      initial={{ pathLength: 0 }}
                      animate={inView ? { pathLength: 1 } : {}}
                      transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                    />
                    {/* milestone dots */}
                    {data.map((_, i) => (
                      <motion.circle
                        key={i}
                        cx={i * step}
                        cy={norm(data[i])}
                        r="0.9"
                        fill="#80e6ff"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={inView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.6 + i * 0.08 }}
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                  </svg>
                </div>
                <div className="mt-2 flex justify-between text-[0.55rem] uppercase tracking-wider text-muted-foreground">
                  <span>Wk 1</span>
                  <span>Wk 6</span>
                  <span>Wk 12</span>
                  <span>Today</span>
                </div>
              </div>

              {/* Missions + Feed */}
              <div className="bg-[#070b12] p-5 sm:p-7">
                <div className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-wider text-cyan-soft">
                  <Target className="h-3.5 w-3.5" /> Mission board
                </div>
                <div className="mt-3 space-y-2.5">
                  {MISSIONS.map((m, i) => (
                    <div
                      key={m.title}
                      className={cn(
                        "rounded-xl border p-3",
                        m.active ? "border-cyan/25 bg-cyan/[0.05]" : "border-white/[0.06] bg-white/[0.02]"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium text-white/90">{m.title}</span>
                        <span className="shrink-0 text-[0.58rem] text-muted-foreground">{m.days}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${m.progress}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.1, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                          className={cn(
                            "h-full rounded-full",
                            m.active ? "bg-gradient-to-r from-cyan-deep to-cyan" : "bg-white/20"
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-wider text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" /> Crisis feed
                </div>
                <div className="mt-3 space-y-2">
                  {FEED.map((f) => (
                    <div
                      key={f.title}
                      className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5"
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          f.tone === "amber" && "bg-amber-400/10 text-amber-300",
                          f.tone === "cyan" && "bg-cyan/10 text-cyan",
                          f.tone === "rose" && "bg-rose-400/10 text-rose-300"
                        )}
                      >
                        <f.icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[0.7rem] font-medium text-white/90">{f.title}</div>
                        <div className="text-[0.55rem] text-muted-foreground">{f.time}</div>
                      </div>
                      <span className="shrink-0 rounded-md bg-white/5 px-2 py-1 text-[0.55rem] font-medium text-cyan-soft">
                        {f.action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom stat strip */}
            <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
              {[
                { icon: Users, label: "Team", value: "12", note: "+3 this month" },
                { icon: Gauge, label: "Velocity", value: "84", note: "Top 8%" },
                { icon: Target, label: "NPS", value: "64", note: "Excellent" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 bg-[#070b12] p-4 sm:p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-cyan-soft">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-display text-lg font-semibold">{s.value}</div>
                    <div className="text-[0.55rem] uppercase tracking-wider text-muted-foreground">
                      {s.label} · {s.note}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
