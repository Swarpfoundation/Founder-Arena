"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Film,
  Gamepad2,
  Radio,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getLandingCtaState } from "@/lib/auth-redirects";

const FEATURES = [
  {
    title: "AI investor verdicts",
    body: "Pitch your startup and face a strict VC-style review chamber with evidence, red flags, milestones, and funding outcomes.",
    icon: BrainCircuit,
    tone: "cyan",
  },
  {
    title: "12 Founder Weeks",
    body: "Every run moves toward Demo Day through tactical sprint choices, market pressure, runway tension, and hard tradeoffs.",
    icon: CalendarClock,
    tone: "violet",
  },
  {
    title: "Rivals and board pressure",
    body: "Competing founders, governance problems, infrastructure incidents, and social sentiment push back while you operate.",
    icon: Swords,
    tone: "rose",
  },
  {
    title: "Shareable outcomes",
    body: "Each run can end as a breakout, acquisition target, zombie, shutdown, or documentary-style founder story.",
    icon: Film,
    tone: "amber",
  },
];

const GAME_LOOP = ["Build", "Pitch", "Raise", "Hire", "Operate", "Survive", "Demo Day"];

const PLATFORMS = [
  {
    label: "iOS",
    status: "Mobile beta planned",
    detail: "Founder Arena is moving to a native mobile-first game experience for iPhone.",
  },
  {
    label: "Android",
    status: "Mobile beta planned",
    detail: "Android support is planned for the same startup roguelike loop and founder career progression.",
  },
];

const FAQ = [
  {
    q: "Is this still a web game?",
    a: "No. The public website is now marketing and information only. The playable Founder Arena experience is planned for iOS and Android.",
  },
  {
    q: "What kind of game is Founder Arena?",
    a: "A tactical startup roguelike where you build a company, pitch investors, manage burn, hire a team, survive rivals, and chase Demo Day.",
  },
  {
    q: "Will AI decide my outcome randomly?",
    a: "No. AI explains investor-style feedback, while deterministic game systems remain authoritative for scoring, cash, burn, and outcomes.",
  },
];

const TONE_CLASS = {
  cyan: "border-cyan-500/25 bg-cyan-500/[0.055] text-cyan-300",
  violet: "border-violet-500/25 bg-violet-500/[0.055] text-violet-300",
  rose: "border-rose-500/30 bg-rose-500/[0.065] text-rose-300",
  amber: "border-amber-500/30 bg-amber-500/[0.075] text-amber-300",
  emerald: "border-emerald-500/25 bg-emerald-500/[0.055] text-emerald-300",
  white: "border-white/10 bg-white/[0.035] text-white/55",
};

export function HomeLandingClient() {
  const reduced = useReducedMotion();
  const cta = getLandingCtaState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#05050a] text-white">
      <section className="relative min-h-screen px-4">
        <div className="absolute inset-0 opacity-25">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(34,211,238,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139,92,246,0.09) 1px, transparent 1px)
              `,
              backgroundSize: "64px 64px",
            }}
          />
        </div>
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.24),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-80 bg-[radial-gradient(circle_at_50%_100%,rgba(139,92,246,0.2),transparent_60%)]" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col">
          <header className="flex items-center justify-between border-b border-white/10 py-5">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="Founder Arena" width={40} height={40} priority />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-cyan-300/70">Founder Arena</p>
                <p className="text-xs font-black uppercase tracking-wider text-white/55">Mobile game in development</p>
              </div>
            </Link>
            <nav className="hidden items-center gap-5 text-[10px] font-black uppercase tracking-[0.22em] text-white/45 md:flex">
              <a href="#game" className="hover:text-cyan-300">Game</a>
              <a href="#platforms" className="hover:text-cyan-300">Platforms</a>
              <a href="#faq" className="hover:text-cyan-300">FAQ</a>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_390px]">
            <section className="text-center lg:text-left">
              <motion.div
                className="mb-6 inline-flex items-center gap-2 border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300 hud-corner"
                initial={reduced ? false : { opacity: 0, y: -12 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <Smartphone className="h-3.5 w-3.5" />
                iOS and Android only
              </motion.div>

              <motion.h1
                className="max-w-5xl text-5xl font-black uppercase leading-[0.92] tracking-normal sm:text-6xl md:text-7xl lg:text-8xl"
                initial={reduced ? false : { opacity: 0, scale: 0.96 }}
                animate={reduced ? undefined : { opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 170, damping: 18 }}
              >
                Build a startup.
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300">
                  Survive the arena.
                </span>
              </motion.h1>

              <motion.p
                className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/62 md:text-lg lg:mx-0"
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
              >
                Founder Arena is becoming a native mobile startup roguelike for iOS and Android.
                The website is now the official information hub for the game, beta plans, and launch updates.
              </motion.p>

              <motion.div
                className="mt-8 flex flex-col gap-3 sm:flex-row lg:justify-start"
                initial={reduced ? false : { opacity: 0, y: 18 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <a
                  href={cta.primaryHref}
                  className="inline-flex items-center justify-center gap-3 border border-cyan-400/55 bg-cyan-400/12 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-cyan-200 transition-colors hover:bg-cyan-400/20"
                >
                  <Smartphone className="h-4 w-4" />
                  {cta.primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={cta.secondaryHref}
                  className="inline-flex items-center justify-center gap-3 border border-white/15 bg-white/[0.035] px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white/62 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {cta.secondaryLabel}
                </a>
              </motion.div>

              <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
                <InfoPill icon={<ShieldCheck className="h-3.5 w-3.5" />} label="No web game on public site" />
                <InfoPill icon={<BadgeCheck className="h-3.5 w-3.5" />} label="Native mobile focus" />
                <InfoPill icon={<Sparkles className="h-3.5 w-3.5" />} label="Private beta planned" />
              </div>
            </section>

            <aside className="space-y-4">
              <motion.section
                className="border border-violet-500/25 bg-violet-500/[0.06] p-5 hud-corner"
                initial={reduced ? false : { opacity: 0, x: 18 }}
                animate={reduced ? undefined : { opacity: 1, x: 0 }}
                transition={{ delay: 0.22 }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-violet-300/65">Mobile Game Loop</p>
                <div className="mt-4 space-y-2">
                  {GAME_LOOP.map((step, index) => (
                    <div key={step} className="flex items-center gap-3 border border-white/10 bg-black/25 p-2">
                      <span className="grid h-7 w-7 place-items-center border border-cyan-500/25 bg-cyan-500/10 text-[10px] font-black text-cyan-300">
                        {index + 1}
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-white/70">{step}</span>
                      {index === GAME_LOOP.length - 1 && <Trophy className="ml-auto h-4 w-4 text-amber-300" />}
                    </div>
                  ))}
                </div>
              </motion.section>

              <motion.section
                className="border border-cyan-500/20 bg-cyan-500/[0.05] p-5 hud-corner"
                initial={reduced ? false : { opacity: 0, x: 18 }}
                animate={reduced ? undefined : { opacity: 1, x: 0 }}
                transition={{ delay: 0.32 }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-300/65">Website Status</p>
                <p className="mt-2 text-sm leading-relaxed text-white/58">
                  Public web gameplay is no longer the product direction. This site explains the mobile game and keeps the brand presence live while the native apps are prepared.
                </p>
              </motion.section>
            </aside>
          </div>
        </div>
      </section>

      <section id="game" className="relative border-y border-white/10 bg-black/35 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="The Game" title="A startup roguelike built for mobile sessions" />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className={`border p-5 hud-corner ${TONE_CLASS[feature.tone as keyof typeof TONE_CLASS]}`}>
                  <Icon className="h-6 w-6" />
                  <h3 className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">{feature.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="platforms" className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Platforms" title="Founder Arena is moving to iOS and Android" />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {PLATFORMS.map((platform) => (
              <article key={platform.label} className="border border-white/10 bg-white/[0.035] p-6 hud-corner">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-300/65">{platform.status}</p>
                    <h3 className="mt-2 text-3xl font-black uppercase tracking-wider text-white">{platform.label}</h3>
                  </div>
                  <Smartphone className="h-8 w-8 text-cyan-300" />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/58">{platform.detail}</p>
                <div className="mt-5 inline-flex border border-amber-500/25 bg-amber-500/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-amber-300">
                  Store listing coming later
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] px-4 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <SectionHeader eyebrow="Why It Exists" title="The tension of building a company, compressed into a game" />
          <div className="grid gap-3">
            <ProofLine icon={<BrainCircuit className="h-4 w-4" />} text="Investor feedback is designed to be legible, strict, and actionable." />
            <ProofLine icon={<Zap className="h-4 w-4" />} text="Deterministic systems keep outcomes fair: paid plans do not improve scores or survival." />
            <ProofLine icon={<Radio className="h-4 w-4" />} text="Runs create stories through rivals, board pressure, infrastructure risk, and market shifts." />
            <ProofLine icon={<Gamepad2 className="h-4 w-4" />} text="Mobile-first UX will prioritize short, repeatable sessions and clear next moves." />
          </div>
        </div>
      </section>

      <section id="faq" className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <SectionHeader eyebrow="FAQ" title="What changed on the website" />
          <div className="mt-10 space-y-3">
            {FAQ.map((item) => (
              <article key={item.q} className="border border-white/10 bg-black/30 p-5 hud-corner">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white">{item.q}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/58">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-white/35 md:flex-row md:items-center md:justify-between">
          <p>Founder Arena - mobile startup roguelike in development.</p>
          <div className="flex flex-wrap gap-4">
            <a href="#game" className="hover:text-cyan-300">Game</a>
            <a href="#platforms" className="hover:text-cyan-300">Platforms</a>
            <a href="#faq" className="hover:text-cyan-300">FAQ</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.34em] text-cyan-300/60">{eyebrow}</p>
      <h2 className="mt-2 max-w-3xl text-3xl font-black uppercase leading-tight tracking-normal text-white md:text-5xl">{title}</h2>
    </div>
  );
}

function InfoPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white/45">
      <span className="text-cyan-300">{icon}</span>
      {label}
    </span>
  );
}

function ProofLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 border border-white/10 bg-black/25 p-4 hud-corner">
      <span className="mt-0.5 text-emerald-300">{icon}</span>
      <p className="text-sm leading-relaxed text-white/62">{text}</p>
      <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-300/70" />
    </div>
  );
}
