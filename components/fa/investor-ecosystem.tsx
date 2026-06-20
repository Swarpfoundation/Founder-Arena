"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { Reveal, SectionHeading, CountUp } from "./primitives";
import { Sparkles, Check, X, Eye, FileSignature } from "lucide-react";

const INVESTORS = [
  { name: "Maya Chen", type: "Angel", check: "$250K", thesis: "Bets on founders first, ideas second.", color: "#00d4ff" },
  { name: "Atlas Ventures", type: "Seed VC", check: "$2M", thesis: "Product-market fit — or pass.", color: "#36e0c8" },
  { name: "Northpoint Capital", type: "Series A", check: "$12M", thesis: "Repeatable GTM and a real org.", color: "#7c8cff" },
  { name: "Helix Growth", type: "Growth", check: "$30M", thesis: "Unit economics and a path to IPO.", color: "#ff6a3d" },
  { name: "Quartz Strategic", type: "Strategic", check: "$10M", thesis: "Distribution, distribution, distribution.", color: "#ffd166" },
  { name: "The AI Investor", type: "Always-on", check: "Any", thesis: "Scores you 24/7. Never gets tired.", color: "#80e6ff", ai: true },
];

const FACTORS = [
  { label: "Market", value: 9.2, note: "$72B TAM · 38% CAGR" },
  { label: "Team", value: 8.7, note: "2x founders, exits in space" },
  { label: "Product", value: 8.4, note: "Differentiated, shipping fast" },
  { label: "Traction", value: 7.9, note: "$182K MRR · 14% MoM" },
  { label: "Moat", value: 6.8, note: "Data network effects emerging" },
];

const REACTIONS = [
  { name: "Atlas Ventures", action: "Term sheet sent", icon: FileSignature, tone: "good" },
  { name: "Northpoint", action: "Requesting follow-up", icon: Eye, tone: "neutral" },
  { name: "Helix Growth", action: "Pass — too early", icon: X, tone: "bad" },
  { name: "Quartz Strategic", action: "Following the round", icon: Check, tone: "neutral" },
];

function VerdictLine() {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const full =
    "“Strong market timing and a sharp, complementary team. Tighten the moat narrative around data network effects and you are fundable at the proposed terms.”";
  const [text, setText] = useState("");

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setText(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [inView]);

  return <p ref={ref} className="text-sm leading-relaxed text-white/85">{text}<span className="cursor-blink">▋</span></p>;
}

export function InvestorEcosystem() {
  return (
    <section id="investors" className="relative w-full overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-1/3 h-[40vh] w-[40vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,140,255,0.10),transparent_70%)] blur-2xl" />
      </div>

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          label="The Investor Ecosystem"
          title={
            <>
              Pitch investors who <span className="text-gradient-cyan">actually have opinions.</span>
            </>
          }
          description="Six archetypes of capital — from scrappy angels to growth funds to a tireless AI investor that reviews your deck in seconds and tells you the truth."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
          {/* Left: investor grid */}
          <Reveal>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {INVESTORS.map((inv, i) => (
                <motion.div
                  key={inv.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "card-glow group rounded-2xl p-4",
                    inv.ai && "border-gradient"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-[0.7rem] font-bold text-[#031016]"
                        style={{ background: `linear-gradient(135deg, ${inv.color}, ${inv.color}99)` }}
                      >
                        {inv.name.charAt(0)}
                      </div>
                      <div className="leading-tight">
                        <div className="text-sm font-semibold">{inv.name}</div>
                        <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">{inv.type}</div>
                      </div>
                    </div>
                    {inv.ai ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan/15 px-2 py-0.5 text-[0.55rem] font-semibold text-cyan">
                        <Sparkles className="h-3 w-3" /> AI
                      </span>
                    ) : (
                      <span className="text-[0.62rem] font-semibold text-cyan-soft">{inv.check}</span>
                    )}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{inv.thesis}</p>
                </motion.div>
              ))}
            </div>
          </Reveal>

          {/* Right: AI review panel */}
          <Reveal delay={0.1}>
            <div className="card-glow relative overflow-hidden rounded-3xl p-6 sm:p-8">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan/15 blur-3xl" />

              <div className="relative flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan/20 bg-cyan/[0.05] px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-cyan-soft">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan" />
                    </span>
                    AI Reviewing
                  </div>
                  <div className="mt-2 font-display text-xl font-semibold">Nimbus AI · Series A Pitch</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-4xl font-semibold text-glow">
                    <CountUp to={8.6} decimals={1} duration={2.2} />
                  </div>
                  <div className="text-[0.55rem] uppercase tracking-wider text-muted-foreground">Composite</div>
                </div>
              </div>

              {/* Factor bars */}
              <div className="relative mt-6 space-y-3">
                {FACTORS.map((f, i) => (
                  <div key={f.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-white/85">{f.label}</span>
                      <span className="text-muted-foreground">{f.note}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(f.value / 10) * 100}%` }}
                          viewport={{ once: true, margin: "-60px" }}
                          transition={{ duration: 1.1, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-deep to-cyan"
                        />
                      </div>
                      <span className="w-8 text-right font-display text-sm font-semibold text-cyan-soft">
                        {f.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Verdict */}
              <div className="relative mt-6 rounded-2xl border border-cyan/15 bg-cyan/[0.04] p-4">
                <div className="mb-2 flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-wider text-cyan">
                  <Sparkles className="h-3.5 w-3.5" /> AI Verdict
                </div>
                <VerdictLine />
              </div>

              {/* Investor reactions */}
              <div className="relative mt-5 grid grid-cols-2 gap-2">
                {REACTIONS.map((rx, i) => (
                  <motion.div
                    key={rx.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 1.0 + i * 0.15 }}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2.5",
                      rx.tone === "good"
                        ? "border-emerald-400/20 bg-emerald-400/[0.06]"
                        : rx.tone === "bad"
                          ? "border-rose-400/20 bg-rose-400/[0.05]"
                          : "border-white/[0.06] bg-white/[0.02]"
                    )}
                  >
                    <rx.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        rx.tone === "good" ? "text-emerald-300" : rx.tone === "bad" ? "text-rose-300" : "text-cyan-soft"
                      )}
                    />
                    <div className="min-w-0 leading-tight">
                      <div className="truncate text-[0.7rem] font-semibold">{rx.name}</div>
                      <div className="truncate text-[0.58rem] text-muted-foreground">{rx.action}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
