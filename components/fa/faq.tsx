"use client";

import { ChevronDown } from "lucide-react";
import { Reveal, SectionHeading } from "./primitives";

const FAQS = [
  {
    q: "What exactly is Founder Arena?",
    a: "Founder Arena is a tactical startup roguelike. You build a company, pitch investors, negotiate funding, hire a team, manage burn, survive market events, and try to reach Demo Day.",
  },
  {
    q: "Can I play it on this website?",
    a: "No. The public website is the information hub for the game. Founder Arena is being developed as a native mobile experience for iOS and Android.",
  },
  {
    q: "When will the mobile apps be available?",
    a: "A public release date and store listings have not been announced. Mobile beta details will be published here when they are ready.",
  },
  {
    q: "Does AI decide whether I win?",
    a: "No. AI explains investor-style feedback and coaching. Cash, burn, valuation, scoring, and final outcomes are controlled by deterministic game systems.",
  },
  {
    q: "Do paid plans improve my outcome?",
    a: "No. Paid options may provide convenience or additional review capacity, but they do not improve valuation, cash, survival, scores, or leaderboard outcomes.",
  },
  {
    q: "Do I need startup experience?",
    a: "No. The game introduces concepts such as runway, dilution, fundraising, and operating tradeoffs through the decisions you make during a run.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="relative w-full overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <SectionHeading
          label="Questions, answered"
          title={<>Before you <span className="text-gradient-cyan">enter the arena.</span></>}
        />

        <Reveal delay={0.1}>
          <div className="mt-12 divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {FAQS.map((item, index) => (
              <details key={item.q} className="group" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 font-display text-base font-medium text-white transition-colors hover:text-cyan-soft sm:text-lg">
                  {item.q}
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="max-w-2xl pb-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
