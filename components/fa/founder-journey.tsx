"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { Reveal, SectionLabel } from "./primitives";
import { Lightbulb, Hammer, Megaphone, Banknote, UserPlus, Globe2, Trophy } from "lucide-react";

const STAGES = [
  {
    key: "idea",
    icon: Lightbulb,
    title: "Idea",
    tag: "The spark",
    desc: "You see a gap no one else sees. No code, no users, no money — only conviction and a name.",
    metric: "Conviction",
    val: 0,
  },
  {
    key: "build",
    icon: Hammer,
    title: "Build",
    tag: "Ship the MVP",
    desc: "Fourteen days. Cut every corner that isn't the user. Launch rough, listen fast, iterate.",
    metric: "Day 14 · MVP live",
    val: 0.1,
  },
  {
    key: "pitch",
    icon: Megaphone,
    title: "Pitch",
    tag: "Enter the arena",
    desc: "Three minutes to make an investor believe. Build the deck, read the room, handle the hard questions.",
    metric: "12 pitches · 4 term sheets",
    val: 0.8,
  },
  {
    key: "raise",
    icon: Banknote,
    title: "Raise",
    tag: "Close the round",
    desc: "Term sheets, valuations, dilution, pro-ratas. Every signature reshapes who owns the future.",
    metric: "$5M Seed closed",
    val: 5,
  },
  {
    key: "hire",
    icon: UserPlus,
    title: "Hire",
    tag: "Build the team",
    desc: "Your first ten hires define the company. Culture, velocity, and the org chart you'll regret or thank.",
    metric: "12 hires · 84 velocity",
    val: 18,
  },
  {
    key: "scale",
    icon: Globe2,
    title: "Scale",
    tag: "Go global",
    desc: "New markets, new crises, new competitors. Burn rate climbs, runway shrinks, the stakes get real.",
    metric: "$48M Series A",
    val: 48,
  },
  {
    key: "exit",
    icon: Trophy,
    title: "Exit",
    tag: "Become legendary",
    desc: "Acquisition. Unicorn. IPO. The arena remembers founders who cross the line — and those who don't.",
    metric: "$120M+ outcome",
    val: 120,
  },
];

export function FounderJourney() {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);
  const dotRef = React.useRef<SVGCircleElement>(null);
  const glowRef = React.useRef<SVGCircleElement>(null);

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });

  const clipWidth = useTransform(scrollYProgress, [0.04, 0.96], [0, 100]);

  const [stage, setStage] = React.useState(0);
  const [valDisplay, setValDisplay] = React.useState(0);

  const stageProgress = STAGES.map((_, i) => i / (STAGES.length - 1));
  const valPoints = STAGES.map((s) => s.val);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    // stage index
    const idx = Math.min(
      STAGES.length - 1,
      Math.max(0, Math.floor(p * STAGES.length))
    );
    setStage(idx);

    // interpolated valuation
    const t = Math.max(0, Math.min(1, p));
    let v = 0;
    for (let i = 0; i < stageProgress.length - 1; i++) {
      if (t >= stageProgress[i] && t <= stageProgress[i + 1]) {
        const localT = (t - stageProgress[i]) / (stageProgress[i + 1] - stageProgress[i]);
        v = valPoints[i] + (valPoints[i + 1] - valPoints[i]) * localT;
        break;
      }
      if (t > stageProgress[stageProgress.length - 1]) v = valPoints[valPoints.length - 1];
    }
    setValDisplay(v);

    // dot along path
    const path = pathRef.current;
    if (path) {
      const len = path.getTotalLength();
      const clamped = Math.max(0, Math.min(1, (t - 0.04) / 0.92));
      const pt = path.getPointAtLength(len * clamped);
      if (dotRef.current) {
        dotRef.current.setAttribute("cx", String(pt.x));
        dotRef.current.setAttribute("cy", String(pt.y));
      }
      if (glowRef.current) {
        glowRef.current.setAttribute("cx", String(pt.x));
        glowRef.current.setAttribute("cy", String(pt.y));
      }
    }
  });

  const current = STAGES[stage];

  return (
    <section id="journey" className="relative w-full overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-field grid-field-fade opacity-40" />
      </div>

      {/* Intro */}
      <div className="mx-auto max-w-5xl px-5 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <SectionLabel>The Founder Journey</SectionLabel>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mt-6 font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl lg:text-[3.6rem]">
              <span className="text-gradient">From zero to legendary,</span>
              <br className="hidden sm:block" />{" "}
              <span className="text-gradient-cyan">one decision at a time.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Scroll through a single founder&apos;s arc. Watch the valuation climb,
              the runway tighten, and the stakes compound with every stage.
            </p>
          </Reveal>
        </div>
      </div>

      {/* Sticky storytelling */}
      <div ref={scrollRef} className="relative mt-16 h-[560vh]">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:px-8">
            {/* Chart */}
            <div className="order-2 lg:order-1">
              <div className="card-glow rounded-3xl p-5 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                      Valuation growth
                    </div>
                    <div className="mt-1 font-display text-3xl font-semibold text-glow sm:text-4xl">
                      ${valDisplay < 1 ? valDisplay.toFixed(1) : Math.round(valDisplay)}M
                    </div>
                  </div>
                  <div className="rounded-full border border-cyan/20 bg-cyan/[0.05] px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-wider text-cyan-soft">
                    Stage {stage + 1} / {STAGES.length}
                  </div>
                </div>

                <div className="relative mt-5 h-44 w-full sm:h-56">
                  <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                    <defs>
                      <linearGradient id="curveStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0091b8" />
                        <stop offset="60%" stopColor="#00d4ff" />
                        <stop offset="100%" stopColor="#80e6ff" />
                      </linearGradient>
                      <linearGradient id="curveArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                      </linearGradient>
                      <clipPath id="growClip">
                        <motion.rect x="0" y="0" height="60" style={{ width: clipWidth }} />
                      </clipPath>
                    </defs>

                    {/* gridlines */}
                    {[12, 24, 36, 48].map((y) => (
                      <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />
                    ))}
                    {/* x stage markers */}
                    {STAGES.map((_, i) => (
                      <line
                        key={i}
                        x1={(i / (STAGES.length - 1)) * 100}
                        y1="0"
                        x2={(i / (STAGES.length - 1)) * 100}
                        y2="60"
                        stroke="rgba(255,255,255,0.03)"
                        strokeWidth="0.2"
                      />
                    ))}

                    <g clipPath="url(#growClip)">
                      <path
                        ref={pathRef}
                        d="M 2 58 C 22 57, 30 55, 40 50 S 58 38, 70 26 S 90 8, 98 3"
                        fill="none"
                        stroke="url(#curveStroke)"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      <path
                        d="M 2 58 C 22 57, 30 55, 40 50 S 58 38, 70 26 S 90 8, 98 3 L 98 60 L 2 60 Z"
                        fill="url(#curveArea)"
                      />
                    </g>

                    {/* moving dot */}
                    <circle
                      ref={dotRef}
                      r="1.6"
                      cx="2"
                      cy="58"
                      fill="#80e6ff"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      ref={glowRef}
                      r="3.2"
                      cx="2"
                      cy="58"
                      fill="#00d4ff"
                      opacity="0.25"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>

                  {/* x labels */}
                  <div className="mt-2 flex justify-between text-[0.55rem] uppercase tracking-wider text-muted-foreground">
                    {STAGES.map((s, i) => (
                      <span
                        key={s.key}
                        className={cn(
                          "transition-colors",
                          i === stage ? "text-cyan-soft" : "text-muted-foreground/50"
                        )}
                      >
                        {s.title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stage detail */}
            <div className="order-1 lg:order-2">
              <div className="relative">
                {/* stages list */}
                <div className="space-y-2.5">
                  {STAGES.map((s, i) => {
                    const active = i === stage;
                    const passed = i < stage;
                    return (
                      <div
                        key={s.key}
                        className={cn(
                          "relative flex items-start gap-3 rounded-2xl border p-3 transition-all duration-500 sm:p-3.5",
                          active
                            ? "border-cyan/30 bg-cyan/[0.06]"
                            : passed
                              ? "border-white/[0.06] bg-white/[0.015]"
                              : "border-white/[0.04] bg-transparent opacity-50"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
                            active
                              ? "bg-cyan text-[#031016] shadow-[0_0_20px_rgba(0,212,255,0.5)]"
                              : passed
                                ? "bg-cyan/15 text-cyan-soft"
                                : "bg-white/5 text-muted-foreground"
                          )}
                        >
                          <s.icon className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-display text-sm font-semibold sm:text-base",
                                active ? "text-white" : "text-white/80"
                              )}
                            >
                              {s.title}
                            </span>
                            <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                              {s.tag}
                            </span>
                          </div>
                          {active && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm"
                            >
                              {s.desc}
                            </motion.p>
                          )}
                          {active && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-cyan/10 px-2 py-0.5 text-[0.6rem] font-semibold text-cyan"
                            >
                              <s.icon className="h-3 w-3" />
                              {s.metric}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current stage echo for mobile readability */}
      <div className="mx-auto mt-4 max-w-5xl px-5 lg:hidden">
        <div className="rounded-2xl border border-cyan/20 bg-cyan/[0.05] p-4 text-center">
          <div className="text-[0.6rem] uppercase tracking-[0.2em] text-cyan-soft">{current.tag}</div>
          <div className="mt-1 font-display text-lg font-semibold">{current.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{current.desc}</p>
        </div>
      </div>
    </section>
  );
}
