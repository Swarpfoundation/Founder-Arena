"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { Reveal, SectionLabel } from "./primitives";
import { Users, Wallet, Package, TerminalSquare } from "lucide-react";

const VERBS = ["Build", "Ship", "Pitch", "Raise", "Hire", "Scale", "Survive", "Win", "Fail", "Retry"];

function Typewriter({
  lines,
  className,
}: {
  lines: { text: string; className?: string }[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!inView) return;
    const full = lines.map((l) => l.text).join("\n");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [inView, lines]);

  // map shown chars back to styled spans
  let consumed = 0;
  const segments: { text: string; className?: string }[] = [];
  for (const line of lines) {
    const remaining = shown.length - consumed;
    if (remaining <= 0) break;
    const slice = line.text.slice(0, remaining);
    segments.push({ text: slice, className: line.className });
    consumed += line.text.length + 1; // +1 for newline
    if (remaining < line.text.length) break;
  }

  return (
    <div ref={ref} className={cn("font-mono text-[0.78rem] leading-relaxed sm:text-sm", className)}>
      {segments.map((s, i) => (
        <div key={i} className={s.className}>
          {s.text}
          {i === segments.length - 1 && <span className="cursor-blink">▋</span>}
        </div>
      ))}
    </div>
  );
}

export function Premise() {
  return (
    <section id="premise" className="relative w-full overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[50vh] w-[60vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.10),transparent_70%)] blur-2xl" />
      </div>

      <div className="mx-auto max-w-5xl px-5 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <SectionLabel>The Premise</SectionLabel>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mt-6 font-display text-5xl font-semibold leading-[0.98] tracking-tight sm:text-7xl lg:text-[5.5rem]">
              <span className="text-gradient">Start with</span>
              <br />
              <span className="text-gradient-cyan text-glow">nothing.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              No co-founder. No capital. No product. Just an idea, a laptop, and
              12 founder weeks to make it real. Every decision is yours — and every
              decision has a price.
            </p>
          </Reveal>
        </div>

        {/* Constraint cards */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: Users, label: "No co-founder", note: "Solo. You wear every hat." },
            { icon: Wallet, label: "No capital", note: "$0 in the bank. $0 runway." },
            { icon: Package, label: "No product", note: "Only a pitch and a prototype." },
          ].map((c, i) => (
            <Reveal key={c.label} delay={0.1 * i}>
              <div className="card-glow group h-full rounded-2xl p-5">
                <c.icon className="h-5 w-5 text-cyan-soft" strokeWidth={1.6} />
                <div className="mt-3 flex items-center gap-2">
                  <span className="font-display text-lg font-semibold">{c.label}</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{c.note}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Day 1 terminal */}
        <Reveal delay={0.1}>
          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[#070b12] shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </div>
              <div className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
                <TerminalSquare className="h-3.5 w-3.5" />
                founder@arena ~ day 1
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <Typewriter
                lines={[
                  { text: "$ founder init nimbus-ai", className: "text-cyan-soft" },
                  { text: "› initializing company…          ✓", className: "text-muted-foreground" },
                  { text: "› capital: $0                    ⚠", className: "text-muted-foreground" },
                  { text: "› runway: 0 days                 ⚠", className: "text-amber-300" },
                  { text: "› team: just you                 ◌", className: "text-muted-foreground" },
                  { text: "› mission unlocked: ship MVP in 14 days", className: "text-cyan" },
                  { text: "› the clock starts now.", className: "text-white" },
                ]}
              />
            </div>
          </div>
        </Reveal>
      </div>

      {/* Verb marquee */}
      <div className="relative mt-20 flex w-full overflow-hidden border-y border-white/5 py-5 mask-fade-x">
        <div className="flex shrink-0 animate-marquee items-center gap-10 pr-10">
          {[...VERBS, ...VERBS].map((v, i) => (
            <span
              key={i}
              className={cn(
                "font-display text-3xl font-semibold tracking-tight sm:text-4xl",
                v === "Fail" || v === "Retry"
                  ? "text-muted-foreground/40"
                  : "text-white/70"
              )}
            >
              {v}
              <span className="ml-10 text-cyan/30">/</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
