"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Crosshair, ChevronRight, Film, Radio, ShieldAlert, Swords, Trophy, Zap } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getLandingCtaState } from "@/lib/auth-redirects";

const LOOP = ["Deploy", "Pitch", "Fund", "Sprint", "Survive", "Demo Day"];

const SYSTEMS = [
  { label: "Social", icon: Radio, color: "text-cyan-400" },
  { label: "Rivals", icon: Swords, color: "text-rose-400" },
  { label: "Strategy", icon: Zap, color: "text-amber-400" },
  { label: "Boardroom", icon: ShieldAlert, color: "text-violet-400" },
  { label: "Story", icon: Film, color: "text-emerald-400" },
  { label: "Seasons", icon: Trophy, color: "text-cyan-400" },
];

export function HomeLandingClient({ isAuthenticated, displayName }: { isAuthenticated: boolean; displayName?: string | null }) {
  const reduced = useReducedMotion();
  const cta = getLandingCtaState(isAuthenticated);
  const secondaryLinks = isAuthenticated
    ? [
        { href: "/career", label: "Career" },
        { href: "/leaderboard", label: "Arena" },
        { href: "/demo", label: "Demo" },
      ]
    : [
        { href: "/demo", label: "Demo" },
        { href: "/how-to-play", label: "How To Play" },
        { href: "/leaderboard", label: "Arena" },
      ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05050a] px-4 py-8">
      <div className="absolute inset-0 opacity-25">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0,240,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,240,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }} />
      </div>

      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
            }}
            animate={reduced ? undefined : {
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col">
        <header className="flex items-center justify-between border-b border-cyan-500/15 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Founder Arena" width={36} height={36} priority />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-cyan-400/50">Founder Arena</p>
              <p className="text-xs font-black uppercase tracking-wider text-white/70">Private Beta Build</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300">
              Season 1 Live
            </span>
            <span className="border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-cyan-300">
              12 Founder Weeks
            </span>
          </div>
        </header>

        <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="text-center lg:text-left">
            <motion.div
              className="mb-6 inline-flex items-center gap-2 border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300 hud-corner"
              initial={reduced ? false : { opacity: 0, y: -12 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Crosshair className="h-3.5 w-3.5" />
              Tactical Startup Roguelike
            </motion.div>

            <motion.div
              className="mb-6"
              initial={reduced ? false : { opacity: 0, scale: 0.96 }}
              animate={reduced ? undefined : { opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 170, damping: 18 }}
            >
              <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-normal sm:text-6xl md:text-8xl lg:text-9xl">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-violet-300 to-cyan-300 text-glow-cyan">
                  Founder
                </span>
                <span className="block tracking-[0.1em] text-white sm:tracking-[0.18em]" style={{ textShadow: "0 0 52px rgba(0,240,255,0.35)" }}>
                  Arena
                </span>
              </h1>
            </motion.div>

            <motion.p
              className="mx-auto max-w-2xl text-base leading-relaxed text-white/55 md:text-lg lg:mx-0"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              Enter a cyber-fintech war room. Deploy a startup, face AI investors,
              survive 12 Founder Weeks, and turn every run into a Demo Day verdict.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row lg:justify-start"
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
            >
              <Link href={cta.primaryHref}>
                <motion.button
                  className="group relative w-full overflow-hidden px-8 py-5 sm:w-auto"
                  whileHover={reduced ? undefined : { scale: 1.04 }}
                  whileTap={reduced ? undefined : { scale: 0.97 }}
                >
                  <div className="absolute inset-0 border-2 border-cyan-400/60 bg-cyan-400/10" />
                  <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-cyan-400/15 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute top-0 left-0 h-4 w-4 border-l-2 border-t-2 border-cyan-300" />
                  <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-cyan-300" />
                  <span className="relative flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                    <Crosshair className="h-5 w-5" />
                    {isAuthenticated ? "Press Start" : "Start New Run"}
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="relative mt-1 block text-[9px] font-black uppercase tracking-[0.28em] text-cyan-200/45">
                    {cta.primaryLabel}
                  </span>
                </motion.button>
              </Link>

              <Link href={cta.secondaryHref}>
                <motion.button
                  className="group relative w-full overflow-hidden px-8 py-5 sm:w-auto"
                  whileHover={reduced ? undefined : { scale: 1.04 }}
                  whileTap={reduced ? undefined : { scale: 0.97 }}
                >
                  <div className="absolute inset-0 border border-white/20 bg-white/[0.03]" />
                  <span className="relative flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white/62 transition-colors group-hover:text-white">
                    {cta.secondaryLabel}
                  </span>
                </motion.button>
              </Link>
            </motion.div>

            {isAuthenticated && (
              <motion.p
                className="mt-4 text-xs uppercase tracking-[0.25em] text-emerald-300/55"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                Session active{displayName ? ` · ${displayName}` : ""}
              </motion.p>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
              {secondaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/42 transition-colors hover:border-cyan-500/30 hover:text-cyan-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <motion.div
              className="border border-violet-500/20 bg-violet-500/[0.06] p-5 hud-corner"
              initial={reduced ? false : { opacity: 0, x: 18 }}
              animate={reduced ? undefined : { opacity: 1, x: 0 }}
              transition={{ delay: 0.22 }}
            >
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-violet-300/65">
                Run Loop
              </p>
              <div className="space-y-2">
                {LOOP.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 border border-white/10 bg-black/24 p-2">
                    <span className="flex h-6 w-6 items-center justify-center border border-cyan-500/25 bg-cyan-500/10 text-[10px] font-black text-cyan-300">
                      {index + 1}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-white/70">{step}</span>
                    {index === LOOP.length - 1 && <Trophy className="ml-auto h-4 w-4 text-amber-300" />}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="grid grid-cols-2 gap-2"
              initial={reduced ? false : { opacity: 0, x: 18 }}
              animate={reduced ? undefined : { opacity: 1, x: 0 }}
              transition={{ delay: 0.32 }}
            >
              {SYSTEMS.map((system) => {
                const Icon = system.icon;
                return (
                  <div key={system.label} className="border border-white/10 bg-white/[0.025] p-3 hud-corner">
                    <Icon className={`mb-2 h-4 w-4 ${system.color}`} />
                    <p className="text-[10px] font-black uppercase tracking-wider text-white/55">{system.label}</p>
                  </div>
                );
              })}
            </motion.div>

            <motion.div
              className="border border-cyan-500/20 bg-cyan-500/[0.05] p-4 hud-corner"
              initial={reduced ? false : { opacity: 0, x: 18 }}
              animate={reduced ? undefined : { opacity: 1, x: 0 }}
              transition={{ delay: 0.42 }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-300/60">Arena Status</p>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                DeepSeek VC reviews, rival founders, board pressure, infrastructure burn,
                referrals, and documentary endings are live for private beta.
              </p>
            </motion.div>
          </aside>
        </main>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
    </div>
  );
}
