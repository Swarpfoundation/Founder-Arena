"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Flame,
  Wallet,
  Target,
  Zap,
  ChevronRight,
  CircleDot,
  CheckCircle2,
  Building2,
  Rocket,
  Presentation,
  Trophy,
} from "lucide-react";
import { CountUp } from "./primitives";

/* ============================================================
   Shared status bar
   ============================================================ */
function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-5 pt-3 pb-1 text-[0.62rem] font-medium",
        dark ? "text-white/80" : "text-white/80"
      )}
    >
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <span className="inline-block h-2.5 w-3.5 rounded-[2px] bg-white/70" />
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-white/70" />
        <span className="inline-block h-2.5 w-4 rounded-[2px] border border-white/40">
          <span className="block h-full w-2/3 rounded-[1px] bg-white/80" />
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   Mini sparkline (valuation chart)
   ============================================================ */
export function Sparkline({
  className,
  color = "#00d4ff",
  points,
}: {
  className?: string;
  color?: string;
  points?: number[];
}) {
  const data = points ?? [12, 16, 14, 22, 28, 26, 38, 44, 52, 60, 58, 74];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 100;
  const h = 36;
  const step = w / (data.length - 1);
  const norm = (v: number) => h - ((v - min) / (max - min || 1)) * h;
  const d = data
    .map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${norm(v)}`)
    .join(" ");
  const area = `${d} L ${w} ${h} L 0 ${h} Z`;
  const id = React.useId();
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("h-full w-full", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ============================================================
   DASHBOARD SCREEN (Hero + Command Center)
   ============================================================ */
export function DashboardScreen() {
  return (
    <div className="flex h-full flex-col bg-[#06090f] text-white">
      <StatusBar />
      {/* App header */}
      <div className="flex items-center justify-between px-5 pt-2 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan to-cyan-deep text-[#031016] shadow-[0_0_18px_rgba(0,212,255,0.5)]">
            <Building2 className="h-4 w-4" strokeWidth={2.4} />
          </div>
          <div className="leading-tight">
            <div className="text-[0.82rem] font-semibold">Nimbus AI</div>
            <div className="text-[0.58rem] uppercase tracking-wider text-cyan-soft/70">Series A · Day 142</div>
          </div>
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[0.6rem] font-semibold text-cyan-soft">
          FA
        </div>
      </div>

      {/* Valuation card */}
      <div className="px-4">
        <div className="relative overflow-hidden rounded-2xl border border-cyan/15 bg-gradient-to-b from-[#0a1822] to-[#070d15] p-3.5">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan/20 blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">Valuation</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[0.55rem] font-semibold text-emerald-300">
              <TrendingUp className="h-2.5 w-2.5" /> +12.4%
            </span>
          </div>
          <div className="mt-1 font-display text-2xl font-semibold tracking-tight text-glow">
            $<CountUp to={48.2} decimals={1} duration={2.2} />M
          </div>
          <div className="mt-2 h-9">
            <Sparkline />
          </div>
          <div className="mt-1 flex justify-between text-[0.55rem] text-muted-foreground">
            <span>Day 1</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-2.5">
        {[
          { icon: Wallet, label: "Runway", value: "11.2", unit: "mo" },
          { icon: TrendingUp, label: "MRR", value: "$182", unit: "K" },
          { icon: Flame, label: "Burn", value: "$214", unit: "K" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
            <m.icon className="h-3.5 w-3.5 text-cyan-soft" />
            <div className="mt-1.5 text-[0.78rem] font-semibold">
              {m.value}
              <span className="text-[0.6rem] text-muted-foreground">{m.unit}</span>
            </div>
            <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Active mission */}
      <div className="px-4 pt-2.5">
        <div className="rounded-2xl border border-cyan/15 bg-cyan/[0.04] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-cyan" />
              <span className="text-[0.62rem] font-semibold uppercase tracking-wider text-cyan-soft">Active Mission</span>
            </div>
            <span className="text-[0.55rem] text-muted-foreground">Day 4 / 7</span>
          </div>
          <div className="mt-1 text-[0.78rem] font-medium leading-snug">Close Series A — $12M round</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "62%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-deep to-cyan"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[0.55rem]">
            <span className="text-muted-foreground">3 investors reviewing</span>
            <span className="font-semibold text-cyan-soft">62%</span>
          </div>
        </div>
      </div>

      {/* Team + quick actions */}
      <div className="flex items-center justify-between px-4 pt-2.5">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {["#00d4ff", "#36e0c8", "#7c8cff", "#ff6a3d"].map((c, i) => (
              <div
                key={i}
                className="h-5 w-5 rounded-full border border-[#06090f]"
                style={{ background: `linear-gradient(135deg, ${c}, ${c}55)` }}
              />
            ))}
            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-[#06090f] bg-white/10 text-[0.5rem] font-semibold">
              +8
            </div>
          </div>
          <span className="text-[0.55rem] text-muted-foreground">12 hires</span>
        </div>
        <div className="flex items-center gap-1 text-[0.55rem] font-medium text-cyan-soft">
          <Zap className="h-3 w-3" /> Team velocity 84
        </div>
      </div>

      <div className="mt-auto px-4 pb-4 pt-3">
        {/* Tab bar */}
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          {[
            { icon: Building2, active: true },
            { icon: Rocket, active: false },
            { icon: Presentation, active: false },
            { icon: Wallet, active: false },
            { icon: Trophy, active: false },
          ].map((t, i) => (
            <div
              key={i}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg",
                t.active ? "bg-cyan/15 text-cyan" : "text-muted-foreground"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PITCH REVIEW SCREEN (AI investor review)
   ============================================================ */
export function PitchReviewScreen() {
  const scores = [
    { label: "Market", value: 9.2 },
    { label: "Team", value: 8.7 },
    { label: "Product", value: 8.4 },
    { label: "Traction", value: 7.9 },
    { label: "Moat", value: 6.8 },
  ];
  return (
    <div className="flex h-full flex-col bg-[#06090f] text-white">
      <StatusBar />
      <div className="px-5 pt-2 pb-3">
        <div className="text-[0.6rem] uppercase tracking-[0.18em] text-cyan-soft/70">AI Investor Review</div>
        <div className="text-[0.95rem] font-semibold leading-tight">Your pitch is being analyzed</div>
      </div>

      {/* Live analysis card */}
      <div className="mx-4 rounded-2xl border border-cyan/15 bg-gradient-to-b from-[#0a1822] to-[#070d15] p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-cyan/15 text-cyan">
              <span className="absolute inset-0 animate-ping rounded-full bg-cyan/20" />
              <CircleDot className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-[0.72rem] font-semibold">Atlas Ventures</div>
              <div className="text-[0.55rem] text-muted-foreground">Lead · $6M check</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-lg font-semibold text-glow">
              <CountUp to={8.6} decimals={1} duration={2} />
            </div>
            <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground">Score</div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {scores.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="w-14 text-[0.58rem] text-muted-foreground">{s.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(s.value / 10) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-deep to-cyan"
                />
              </div>
              <span className="w-7 text-right text-[0.58rem] font-semibold text-cyan-soft">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Verdict */}
      <div className="mx-4 mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
          <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-emerald-300">Verdict</span>
        </div>
        <p className="mt-1 text-[0.7rem] leading-snug text-white/80">
          “Strong market timing and a sharp team. Tighten your moat narrative on data network effects and you&apos;re fundable.”
        </p>
      </div>

      {/* Term sheet teaser */}
      <div className="mx-4 mt-3 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div>
          <div className="text-[0.62rem] font-semibold">Term sheet offered</div>
          <div className="text-[0.55rem] text-muted-foreground">$6M @ $48M post · 12.5% board</div>
        </div>
        <ChevronRight className="h-4 w-4 text-cyan-soft" />
      </div>

      <div className="mt-auto px-4 pb-4 pt-3">
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-cyan/15 py-2.5 text-[0.7rem] font-semibold text-cyan">
          <Zap className="h-3.5 w-3.5" /> Accept &amp; close round
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DECK BUILDER SCREEN
   ============================================================ */
export function DeckBuilderScreen() {
  const slides = [
    { t: "Problem", ok: true },
    { t: "Solution", ok: true },
    { t: "Market", ok: true },
    { t: "Product", ok: true },
    { t: "Traction", ok: false },
    { t: "Team", ok: true },
    { t: "Ask", ok: false },
  ];
  return (
    <div className="flex h-full flex-col bg-[#06090f] text-white">
      <StatusBar />
      <div className="flex items-center justify-between px-5 pt-2 pb-3">
        <div>
          <div className="text-[0.6rem] uppercase tracking-[0.18em] text-cyan-soft/70">Deck Builder</div>
          <div className="text-[0.92rem] font-semibold">Series A Deck</div>
        </div>
        <div className="rounded-full bg-cyan/15 px-2 py-0.5 text-[0.55rem] font-semibold text-cyan">5 / 7</div>
      </div>

      <div className="mx-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-[#0b1a24] to-[#06101a] text-[0.6rem] text-cyan-soft">
          <div className="text-center">
            <Presentation className="mx-auto h-5 w-5 text-cyan" />
            <div className="mt-1 text-[0.6rem] font-semibold text-white">Market Slide</div>
            <div className="text-[0.5rem] text-muted-foreground">$72B TAM · 38% CAGR</div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[0.55rem]">
          <span className="text-muted-foreground">Slide 3 of 7</span>
          <span className="font-semibold text-emerald-300">Strong</span>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 px-4">
        {slides.map((s, i) => (
          <div
            key={s.t}
            className={cn(
              "flex items-center justify-between rounded-xl border px-3 py-2 text-[0.66rem]",
              s.ok
                ? "border-white/[0.06] bg-white/[0.02]"
                : "border-amber-400/20 bg-amber-400/[0.05]"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-[0.5rem] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-medium">{s.t}</span>
            </div>
            {s.ok ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            ) : (
              <span className="text-[0.5rem] font-semibold text-amber-300">Needs work</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto px-4 pb-4 pt-3">
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-cyan/15 py-2.5 text-[0.7rem] font-semibold text-cyan">
          <Zap className="h-3.5 w-3.5" /> Pitch to investors
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LIFECYCLE / COMPETE SCREEN
   ============================================================ */
export function ArenaScreen() {
  const rivals = [
    { name: "Nimbus AI", you: true, val: 48.2 },
    { name: "Vertex Labs", val: 41.0 },
    { name: "Halo OS", val: 33.7 },
    { name: "Quanta", val: 27.5 },
  ];
  return (
    <div className="flex h-full flex-col bg-[#06090f] text-white">
      <StatusBar />
      <div className="px-5 pt-2 pb-3">
        <div className="text-[0.6rem] uppercase tracking-[0.18em] text-cyan-soft/70">Founder Arena · Season 4</div>
        <div className="text-[0.95rem] font-semibold">Global Leaderboard</div>
      </div>

      <div className="mx-4 rounded-2xl border border-cyan/15 bg-gradient-to-b from-[#0a1822] to-[#070d15] p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-cyan" />
            <span className="text-[0.66rem] font-semibold">Rank #1 this week</span>
          </div>
          <span className="text-[0.55rem] text-emerald-300">▲ 2</span>
        </div>
        <div className="mt-2 flex items-end gap-1.5">
          {rivals.map((r, i) => (
            <div key={r.name} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-end justify-center" style={{ height: 56 }}>
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${(r.val / 50) * 56}px` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "w-3 rounded-t",
                    r.you ? "bg-gradient-to-t from-cyan-deep to-cyan" : "bg-white/15"
                  )}
                />
              </div>
              <span className="text-[0.5rem] text-muted-foreground truncate w-full text-center">{r.name.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-1.5 px-4">
        {rivals.map((r, i) => (
          <div
            key={r.name}
            className={cn(
              "flex items-center justify-between rounded-xl border px-3 py-2",
              r.you ? "border-cyan/25 bg-cyan/[0.06]" : "border-white/[0.06] bg-white/[0.02]"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-[0.6rem] font-semibold text-muted-foreground">#{i + 1}</span>
              <span className="text-[0.66rem] font-medium">{r.name}</span>
              {r.you && <span className="rounded-full bg-cyan/20 px-1.5 py-0.5 text-[0.45rem] font-semibold text-cyan">YOU</span>}
            </div>
            <span className="text-[0.62rem] font-semibold text-cyan-soft">${r.val}M</span>
          </div>
        ))}
      </div>

      <div className="mt-auto px-4 pb-4 pt-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between text-[0.6rem]">
            <span className="text-muted-foreground">Next crisis in</span>
            <span className="font-semibold text-amber-300">2d 14h</span>
          </div>
          <div className="mt-1.5 text-[0.66rem] font-medium">A competitor just launched. Respond?</div>
        </div>
      </div>
    </div>
  );
}
