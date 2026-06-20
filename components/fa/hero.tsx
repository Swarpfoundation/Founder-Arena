"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ParticleField,
  StoreButtons,
  PhoneFrame,
  CountUp,
} from "./primitives";
import { DashboardScreen } from "./phone-screens";
import { LogoLockup } from "./logo";
import { BadgeCheck, ChevronDown, ShieldCheck, Smartphone } from "lucide-react";

export function Hero() {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const phoneY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const phoneRotate = useTransform(scrollYProgress, [0, 1], [0, -6]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const glowScale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);

  return (
    <section
      id="top"
      ref={ref}
      className="relative min-h-[100svh] w-full overflow-hidden pt-28 sm:pt-32"
    >
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-field grid-field-fade opacity-70" />
        <motion.div
          style={{ scale: glowScale }}
          className="absolute left-1/2 top-[-10%] h-[70vh] w-[80vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.22),rgba(0,212,255,0.05)_40%,transparent_70%)] blur-2xl"
        />
        <ParticleField className="opacity-70" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#05070b] to-transparent" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8">
        {/* ---------------- Left: copy ---------------- */}
        <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative z-10 flex flex-col items-start">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <LogoLockup className="h-9 sm:h-10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-cyan/20 bg-cyan/[0.04] px-3.5 py-1.5 text-[0.72rem] font-medium uppercase tracking-[0.22em] text-cyan-soft"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan" />
            </span>
            The Founder Simulation
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 font-display text-[2.7rem] font-semibold leading-[0.98] tracking-[-0.03em] sm:text-6xl lg:text-[4.6rem]"
          >
            <span className="text-gradient">Build the next</span>
            <br />
            <span className="text-gradient-cyan text-glow">billion-dollar</span>{" "}
            <span className="text-gradient">company.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Founder Arena is a mobile startup roguelike where you start with an
            idea, ship products, pitch investors, manage runway, survive crises,
            and fight your way to Demo Day.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 w-full"
          >
            <StoreButtons size="lg" />
          </motion.div>

          {/* Product status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-cyan-soft" />
              <span>Native mobile focus</span>
            </div>
            <div className="hidden h-4 w-px bg-white/10 sm:block" />
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-cyan-soft" />
              <span>Deterministic game outcomes</span>
            </div>
            <div className="hidden h-4 w-px bg-white/10 sm:block" />
            <div className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-cyan-soft" />
              <span>Private beta planned</span>
            </div>
          </motion.div>
        </motion.div>

        {/* ---------------- Right: phone + floating cards ---------------- */}
        <motion.div
          style={{ y: phoneY, rotate: phoneRotate }}
          className="relative mx-auto flex w-full max-w-md items-center justify-center lg:mx-0"
        >
          {/* Floating metric cards */}
          <FloatingCard
            className="-left-2 top-10 sm:-left-8"
            delay={0.6}
            float={7}
            label="Valuation"
            value={<><span className="text-cyan">$</span><CountUp to={48.2} decimals={1} duration={2.2} />M</>}
            delta="+12.4%"
          />
          <FloatingCard
            className="-right-1 top-28 sm:-right-6"
            delay={0.85}
            float={9}
            label="AI Investor Score"
            value={<><CountUp to={8.6} decimals={1} duration={2} /><span className="text-muted-foreground">/10</span></>}
            accent
          />
          <FloatingCard
            className="-left-1 bottom-24 sm:-left-10"
            delay={1.0}
            float={8}
            label="Runway"
            value={<><CountUp to={11.2} decimals={1} duration={2} /> <span className="text-muted-foreground text-base">mo</span></>}
          />
          <FloatingCard
            className="-right-2 bottom-12 sm:-right-8"
            delay={1.15}
            float={6}
            label="Round"
            value={<span className="text-emerald-300">Series A · Closed</span>}
            icon
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="animate-float-soft"
          >
            <PhoneFrame>
              <DashboardScreen />
            </PhoneFrame>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.a
        href="#premise"
        aria-label="Scroll to explore"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground sm:flex"
      >
        <span className="text-[0.62rem] uppercase tracking-[0.3em]">Scroll</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </motion.a>
    </section>
  );
}

function FloatingCard({
  className,
  label,
  value,
  delta,
  delay,
  float = 7,
  accent = false,
  icon = false,
}: {
  className?: string;
  label: string;
  value: React.ReactNode;
  delta?: string;
  delay?: number;
  float?: number;
  accent?: boolean;
  icon?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn("absolute z-20 hidden sm:block", className)}
      style={{ animation: `float-soft ${float}s ease-in-out infinite` }}
    >
      <div
        className={cn(
          "min-w-[120px] rounded-2xl border p-3 backdrop-blur-md",
          accent
            ? "border-cyan/30 bg-cyan/[0.08]"
            : "border-white/10 bg-[#0a1018]/80"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
          {delta && (
            <span className="rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[0.5rem] font-semibold text-emerald-300">
              {delta}
            </span>
          )}
          {icon && <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />}
        </div>
        <div className="mt-1 font-display text-lg font-semibold tracking-tight">{value}</div>
      </div>
    </motion.div>
  );
}
