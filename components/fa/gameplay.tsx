"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Reveal, SectionHeading, PhoneFrame, TiltCard } from "./primitives";
import {
  DashboardScreen,
  PitchReviewScreen,
  DeckBuilderScreen,
  ArenaScreen,
} from "./phone-screens";
import {
  Building2,
  Boxes,
  Target,
  AlertTriangle,
  Users,
  Globe2,
  LayoutDashboard,
  Presentation,
  Trophy,
  Sparkles,
} from "lucide-react";

const TABS = [
  {
    key: "dashboard",
    icon: LayoutDashboard,
    label: "Command Center",
    title: "Run the company like a real operator.",
    desc: "Every metric a founder watches, live. Runway, burn, MRR, team velocity, and valuation — updating with every decision you make.",
    points: ["Live financial dashboard", "Team velocity & morale", "Mission progress tracking"],
    Screen: DashboardScreen,
  },
  {
    key: "pitch",
    icon: Sparkles,
    label: "AI Investor Review",
    title: "Pitch investors that think like VCs.",
    desc: "AI investors score your deck on market, team, product, traction, and moat — then hand you a verdict and a term sheet. Or a pass.",
    points: ["Five-factor AI scoring", "Negotiate term sheets", "Multiple investor archetypes"],
    Screen: PitchReviewScreen,
  },
  {
    key: "deck",
    icon: Presentation,
    label: "Deck Builder",
    title: "Assemble a deck slide by slide.",
    desc: "Each slide gets graded in real time. Strong decks open bigger checks. Weak ones get you ghosted. Build the story investors actually fund.",
    points: ["Slide-by-slide grading", "Smart narrative coaching", "Investor-specific variants"],
    Screen: DeckBuilderScreen,
  },
  {
    key: "arena",
    icon: Trophy,
    label: "Global Arena",
    title: "Face rival founders.",
    desc: "Climb the leaderboard, survive market pressure, and out-ship, out-raise, and out-last rival companies across each run.",
    points: ["Seasonal leaderboards", "Weekly crisis events", "Global founder rankings"],
    Screen: ArenaScreen,
  },
];

const FEATURES = [
  {
    icon: Building2,
    title: "Company Creation",
    desc: "Name it, niche it, pick a thesis. Your founding decisions echo for ninety in-game days.",
  },
  {
    icon: Boxes,
    title: "Product Builder",
    desc: "Ship features, chase metrics, and balance speed against quality. Every release moves the numbers.",
  },
  {
    icon: Target,
    title: "Mission System",
    desc: "Time-boxed objectives with real rewards. Close a round, hit ARR, hire your first VP.",
  },
  {
    icon: AlertTriangle,
    title: "Crisis Events",
    desc: "A competitor launches. A co-founder quits. Cash runs low. Respond in 60 seconds — or eat the consequences.",
  },
  {
    icon: Users,
    title: "Hiring Engine",
    desc: "Recruit engineers, sellers, operators. Build culture, manage burn, and keep velocity high.",
  },
  {
    icon: Globe2,
    title: "Global Competition",
    desc: "Leaderboards, rival founders, and changing market pressure turn every run into a different contest.",
  },
];

export function Gameplay() {
  const [active, setActive] = React.useState(0);
  const tab = TABS[active];
  const Screen = tab.Screen;

  return (
    <section id="gameplay" className="relative w-full overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-field grid-field-fade opacity-30" />
      </div>

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          label="Inside the Arena"
          title={
            <>
              A founder operating system, <span className="text-gradient-cyan">disguised as a game.</span>
            </>
          }
          description="Six interconnected systems simulate the full lifecycle of building a company. None of them are optional. All of them are unforgiving."
        />

        {/* Tabbed showcase */}
        <div className="mt-14 grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
          {/* Left: phone */}
          <div className="order-2 flex justify-center lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.key}
                initial={{ opacity: 0, scale: 0.94, rotateY: -8 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.94, rotateY: 8 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="animate-float-soft"
              >
                <PhoneFrame>
                  <Screen />
                </PhoneFrame>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: tabs + content */}
          <div className="order-1 lg:order-2">
            {/* Tab buttons */}
            <div className="flex flex-wrap gap-2">
              {TABS.map((t, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActive(i)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-all sm:text-sm",
                      isActive
                        ? "border-cyan/40 bg-cyan/[0.08] text-white shadow-[0_0_24px_-8px_rgba(0,212,255,0.5)]"
                        : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:text-white"
                    )}
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mt-7"
              >
                <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                  {tab.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{tab.desc}</p>
                <ul className="mt-6 space-y-3">
                  {tab.points.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-sm text-white/85">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan/15 text-cyan">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Feature grid */}
        <div className="mt-20">
          <Reveal>
            <div className="mb-8 flex items-center gap-3">
              <span className="text-[0.62rem] uppercase tracking-[0.2em] text-cyan-soft">Core systems</span>
              <span className="h-px flex-1 bg-gradient-to-r from-cyan/30 to-transparent" />
            </div>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={0.06 * i}>
                <TiltCard className="h-full">
                  <div className="card-glow group h-full rounded-2xl p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/[0.06] text-cyan transition-all group-hover:bg-cyan group-hover:text-[#031016]">
                      <f.icon className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <h4 className="mt-4 font-display text-lg font-semibold">{f.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-cyan-soft opacity-0 transition-opacity group-hover:opacity-100">
                      Explore system
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
