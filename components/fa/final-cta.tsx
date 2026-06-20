"use client";

import { Check } from "lucide-react";
import { LogoLockup } from "./logo";
import { ParticleField, Reveal, StoreButtons } from "./primitives";

export function FinalCta() {
  return (
    <section id="platforms" className="relative w-full overflow-hidden py-28 sm:py-40">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-field grid-field-fade opacity-50" />
        <div className="absolute left-1/2 top-1/2 h-[80vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.20),rgba(0,212,255,0.04)_40%,transparent_70%)] blur-2xl" />
        <ParticleField className="opacity-80" />
      </div>

      <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
        <Reveal>
          <div className="flex justify-center"><LogoLockup className="h-12 sm:h-14" /></div>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="mt-8 font-display text-5xl font-semibold leading-[0.98] tracking-tight sm:text-7xl lg:text-[5.5rem]">
            <span className="text-gradient">The arena is</span><br />
            <span className="text-gradient-cyan text-glow">going mobile.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Founder Arena is in development as a native mobile game for iOS and Android. Store listings and a public release date will be announced when they are ready.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-10 flex justify-center"><StoreButtons size="lg" /></div>
        </Reveal>
        <Reveal delay={0.26}>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-cyan" /> iOS planned</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-cyan" /> Android planned</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-cyan" /> Private beta planned</span>
          </div>
          <p className="mx-auto mt-5 max-w-lg text-xs leading-relaxed text-muted-foreground/70">
            These are development-status links, not download buttons. No public store listing is available yet.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
