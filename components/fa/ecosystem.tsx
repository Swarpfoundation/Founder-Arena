"use client";

import { BrainCircuit, Gauge, Scale, Trophy } from "lucide-react";
import { Reveal, SectionHeading } from "./primitives";

const PRINCIPLES = [
  {
    icon: BrainCircuit,
    title: "AI explains",
    text: "Investor personas critique pitches, surface red flags, and coach your next move.",
  },
  {
    icon: Scale,
    title: "Systems decide",
    text: "Deterministic rules control the economy, simulation state, scoring, and outcomes.",
  },
  {
    icon: Gauge,
    title: "Pressure creates stories",
    text: "Runway, rivals, board expectations, infrastructure, and market events force tradeoffs.",
  },
  {
    icon: Trophy,
    title: "Every run has an ending",
    text: "Break out, get acquired, stall, or shut down, then carry the lessons into the next company.",
  },
];

const SAMPLE_EVENTS = [
  "A rival launches before your release",
  "Runway falls below six months",
  "An investor asks for more ownership",
  "Infrastructure costs spike",
  "A key hire receives a competing offer",
  "Demo Day moves one week earlier",
];

export function Ecosystem() {
  return (
    <section id="ecosystem" className="relative w-full overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[50vh] w-[70vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.10),transparent_70%)] blur-2xl" />
      </div>

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          label="Fair by design"
          title={<>A hard game with <span className="text-gradient-cyan">legible rules.</span></>}
          description="Founder Arena uses AI for analysis and narrative, never to secretly rewrite the simulation. Your choices meet the same rules on every run."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((principle, index) => (
            <Reveal key={principle.title} delay={index * 0.07}>
              <article className="card-glow h-full rounded-2xl p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/[0.06] text-cyan">
                  <principle.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{principle.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{principle.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="relative mt-16 flex w-full overflow-hidden border-y border-white/5 py-4 mask-fade-x" aria-label="Example in-game events">
        <div className="flex shrink-0 animate-marquee items-center gap-3 pr-3">
          {[...SAMPLE_EVENTS, ...SAMPLE_EVENTS].map((event, index) => (
            <span key={`${event}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
              Simulation event: {event}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
