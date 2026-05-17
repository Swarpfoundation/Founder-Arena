import Link from "next/link";
import {
  Zap,
  Users,
  Swords,
  BarChart3,
  Briefcase,
  Trophy,
  Film,
  ChevronRight,
  CheckCircle2,
  Circle,
  Crosshair,
  Shield,
  TrendingUp,
  AlertTriangle,
  Database,
  ExternalLink,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_CHECKLIST_STEPS } from "@/lib/demo/locked-states";
import {
  buildDemoShowcaseLinks,
  buildPresenterChecklist,
} from "@/lib/demo/showcase-data";
import { getDemoShowcaseState } from "@/lib/demo/showcase-state";

export const dynamic = "force-dynamic";

// ─── Corner Borders (HUD style) ───────────────────────────────────────────────

const CornerBorders = () => (
  <>
    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/40 pointer-events-none" />
    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/40 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500/40 pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/40 pointer-events-none" />
  </>
);

// ─── Core Loop Steps ──────────────────────────────────────────────────────────

const LOOP_STEPS = [
  { n: "01", label: "Create Startup", color: "cyan" },
  { n: "02", label: "Pitch to AI VCs", color: "cyan" },
  { n: "03", label: "Raise Funding", color: "violet" },
  { n: "04", label: "Build Team", color: "violet" },
  { n: "05", label: "Run Sprint Sims", color: "amber" },
  { n: "06", label: "Social Pressure", color: "pink" },
  { n: "07", label: "Battle Rivals", color: "rose" },
  { n: "08", label: "Strategy Stack", color: "amber" },
  { n: "09", label: "Boardroom Drama", color: "orange" },
  { n: "10", label: "Finish Run", color: "emerald" },
  { n: "11", label: "Documentary", color: "cyan" },
  { n: "12", label: "Career + Rankings", color: "violet" },
];

const stepColor: Record<string, string> = {
  cyan: "border-cyan-500/40 text-cyan-400 bg-cyan-500/5",
  violet: "border-violet-500/40 text-violet-400 bg-violet-500/5",
  amber: "border-amber-500/40 text-amber-400 bg-amber-500/5",
  pink: "border-pink-500/40 text-pink-400 bg-pink-500/5",
  rose: "border-rose-500/40 text-rose-400 bg-rose-500/5",
  orange: "border-orange-500/40 text-orange-400 bg-orange-500/5",
  emerald: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5",
};

// ─── Systems Grid ─────────────────────────────────────────────────────────────

const SYSTEMS = [
  {
    icon: Zap,
    color: "cyan",
    name: "Arena Feed",
    tagline: "Social pressure turns attention into growth — or backlash.",
    description:
      "Post content, trigger viral moments, manage hype and trust. Every social action ripples through your metrics.",
    href: "/leaderboard",
    badge: "LIVE",
  },
  {
    icon: Swords,
    color: "rose",
    name: "Rival Founders",
    tagline: "Rivals react to your launches, callouts, and weak spots.",
    description:
      "Sector-matched AI rivals monitor your moves, escalate rivalry scores, and can be defeated or outlasted.",
    href: "/leaderboard",
    badge: "LIVE",
  },
  {
    icon: BarChart3,
    color: "amber",
    name: "Strategy Stack",
    tagline: "Strategy emerges from your decisions, not a menu choice.",
    description:
      "Your founder archetype — Growth Hacker, Capital Efficient, Technical Founder — is computed from how you play.",
    href: "/leaderboard",
    badge: "LIVE",
  },
  {
    icon: Briefcase,
    color: "orange",
    name: "Boardroom Battles",
    tagline: "Boardroom pressure tests whether investors still trust you.",
    description:
      "When runway drops or revenue misses targets, the board fires. Choose your response — effects are permanent.",
    href: "/leaderboard",
    badge: "LIVE",
  },
  {
    icon: Film,
    color: "violet",
    name: "Founder Documentary",
    tagline: "Every finished run becomes a shareable founder story.",
    description:
      "Finalized runs generate a documentary: narrative arc, key moments, rival victories, boardroom drama, final score.",
    href: "/leaderboard",
    badge: "LIVE",
  },
  {
    icon: Trophy,
    color: "cyan",
    name: "Arena Seasons",
    tagline: "Compete on seasonal leaderboards. Earn your place.",
    description:
      "Completed runs enter Beta Season 1. Categories: Overall, Revenue, Valuation, Survival, Sector, Playstyle.",
    href: "/leaderboard",
    badge: "LIVE",
  },
];

const systemAccents: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  cyan: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    text: "text-cyan-400",
    badge: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
  },
  rose: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    text: "text-rose-400",
    badge: "border-rose-500/40 bg-rose-500/10 text-rose-400",
  },
  amber: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    text: "text-amber-400",
    badge: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  },
  orange: {
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
    text: "text-orange-400",
    badge: "border-orange-500/40 bg-orange-500/10 text-orange-400",
  },
  violet: {
    border: "border-violet-500/30",
    bg: "bg-violet-500/5",
    text: "text-violet-400",
    badge: "border-violet-500/40 bg-violet-500/10 text-violet-400",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DemoPage() {
  const showcase = await getDemoShowcaseState();
  const showcaseLinks = buildDemoShowcaseLinks(showcase);
  const presenterChecklist = buildPresenterChecklist();

  return (
    <div className="max-w-6xl mx-auto pt-24 pb-16 px-4 md:px-8 space-y-16">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-[10px] tracking-[0.5em] text-cyan-400/50 uppercase">
          Investor Demo — Beta Season 1
        </div>

        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            The Startup Simulator
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400">
              Built for Founders.
            </span>
          </h1>
          <p className="mt-4 text-lg text-white/50 max-w-2xl leading-relaxed">
            Run a 12-week accelerator startup through funding, hiring, market crises, rival
            battles, boardroom pressure, and social dynamics — then watch it become a
            documentary and career legacy. Fully deterministic. No spreadsheets.
          </p>
        </div>

        {/* 30-second pitch */}
        <div className="relative border border-cyan-500/20 bg-cyan-500/5 p-6 max-w-2xl">
          <CornerBorders />
          <div className="text-[10px] tracking-[0.4em] text-cyan-400/50 uppercase mb-3">
            30-Second Pitch
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Founder Arena is a roguelike startup simulation game. You create a startup, pitch
            it to AI VCs, raise funding, build a team, and run sprint simulations through
            12 Founder Weeks of compounding crises. Social media pressure, rival founders, boardroom
            conflicts, and strategy archetypes emerge from your decisions — not predetermined
            scripts. Every run ends with a documentary and a permanent entry in your founder
            career record. Compete on seasonal leaderboards. Replay with different strategies.
          </p>
        </div>

        {/* Primary CTAs */}
        <div className="flex flex-wrap gap-3">
          <Link href="/startup/new">
            <div className="flex items-center gap-2 px-6 py-3 border-2 border-cyan-400/60 bg-cyan-500/10 text-cyan-400 font-bold tracking-wider text-sm hover:bg-cyan-500/20 hover:border-cyan-400 transition-all cursor-pointer">
              <Crosshair className="w-4 h-4" />
              START NEW RUN
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
          <Link href="/leaderboard">
            <div className="flex items-center gap-2 px-6 py-3 border border-violet-500/40 bg-violet-500/5 text-violet-400 font-bold tracking-wider text-sm hover:bg-violet-500/10 transition-all cursor-pointer">
              <Trophy className="w-4 h-4" />
              VIEW ARENA LEADERBOARD
            </div>
          </Link>
          <Link href="/career">
            <div className="flex items-center gap-2 px-6 py-3 border border-amber-500/30 bg-amber-500/5 text-amber-400 font-bold tracking-wider text-sm hover:bg-amber-500/10 transition-all cursor-pointer">
              <Shield className="w-4 h-4" />
              VIEW CAREER LEGACY
            </div>
          </Link>
        </div>
      </section>

      {/* ── Seeded Showcase Path ────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-white/30 uppercase">
              Presenter Mode // Deterministic Showcase
            </div>
            <p className="mt-2 text-sm text-white/45 max-w-2xl">
              Local demo data is optional. When seeded, this route links directly into active,
              mid-run, finalized, career, and leaderboard views without mutating data from the browser.
            </p>
          </div>
          <div
            className={cn(
              "shrink-0 flex items-center gap-2 border px-3 py-2 text-[10px] font-black tracking-widest uppercase",
              showcase.seedDetected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-400"
            )}
          >
            {showcase.seedDetected ? <CheckCircle2 className="w-4 h-4" /> : <Database className="w-4 h-4" />}
            {showcase.seedDetected ? "Demo Data Online" : "No Seed Detected"}
          </div>
        </div>

        {showcase.databaseUnavailable && (
          <div className="relative mb-4 border border-rose-500/30 bg-rose-500/10 p-4">
            <CornerBorders />
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <div className="text-sm font-black text-rose-300 uppercase tracking-wider">
                  Demo database unavailable
                </div>
                <p className="text-xs text-white/45 mt-1">
                  The route is still safe to show, but seeded showcase links are disabled until the local database is reachable.
                </p>
              </div>
            </div>
          </div>
        )}

        {!showcase.seedDetected && (
          <div className="relative mb-4 border border-amber-500/25 bg-amber-500/5 p-4">
            <CornerBorders />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Local setup command
                </div>
                <p className="text-xs text-white/40 mt-1">
                  Seed deterministic fictional demo runs from the terminal. No browser reset controls are exposed.
                </p>
              </div>
              <div className="flex items-center gap-2 border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-cyan-300">
                <Terminal className="w-4 h-4 text-white/30" />
                npm run demo:seed
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {showcaseLinks.map((link) => (
            <Link key={link.key} href={link.href}>
              <div
                className={cn(
                  "relative h-full border p-4 transition-all cursor-pointer group",
                  link.available
                    ? "border-cyan-500/25 bg-cyan-500/5 hover:border-cyan-400/50"
                    : "border-white/10 bg-white/[0.02] hover:border-amber-500/30"
                )}
              >
                <CornerBorders />
                <div className="flex items-center justify-between gap-2">
                  <div className={cn("text-xs font-black uppercase tracking-wider", link.available ? "text-cyan-300" : "text-white/50")}>
                    {link.label}
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-cyan-300 transition-colors" />
                </div>
                <p className="mt-2 text-xs text-white/40 leading-relaxed">{link.description}</p>
                {!link.available && link.setupHint && (
                  <p className="mt-3 text-[11px] text-amber-300/70">{link.setupHint}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Core Loop ───────────────────────────────────────────────────── */}
      <section>
        <div className="text-[10px] tracking-[0.4em] text-white/30 uppercase mb-6">
          The Founder Loop // 12 Steps
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {LOOP_STEPS.map((step, i) => (
            <div
              key={step.n}
              className={cn(
                "relative border p-3 text-center",
                stepColor[step.color]
              )}
            >
              <div className="text-[10px] font-black tracking-widest opacity-50 mb-1">
                {step.n}
              </div>
              <div className="text-xs font-bold leading-tight">{step.label}</div>
              {i < LOOP_STEPS.length - 1 && (
                <div className="absolute -right-px top-1/2 -translate-y-1/2 w-px h-4 bg-white/10 hidden md:block" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-white/20 italic">
          Each step feeds into the next. One bad sprint can spiral into boardroom drama. One viral moment can unlock a new rival.
        </div>
      </section>

      {/* ── Systems Grid ────────────────────────────────────────────────── */}
      <section>
        <div className="text-[10px] tracking-[0.4em] text-white/30 uppercase mb-6">
          Live Systems // All Playable Now
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SYSTEMS.map((sys) => {
            const accent = systemAccents[sys.color] ?? systemAccents.cyan;
            const Icon = sys.icon;
            return (
              <div
                key={sys.name}
                className={cn(
                  "relative border p-5 space-y-3 group",
                  accent.border,
                  accent.bg
                )}
              >
                <CornerBorders />
                <div className="flex items-center justify-between">
                  <div className={cn("flex items-center gap-2", accent.text)}>
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-black tracking-wider uppercase">{sys.name}</span>
                  </div>
                  <span className={cn("text-[9px] font-bold tracking-widest border px-1.5 py-0.5", accent.badge)}>
                    {sys.badge}
                  </span>
                </div>
                <p className={cn("text-xs font-semibold italic", accent.text)}>{sys.tagline}</p>
                <p className="text-xs text-white/50 leading-relaxed">{sys.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Run Checklist ───────────────────────────────────────────────── */}
      <section>
        <div className="text-[10px] tracking-[0.4em] text-white/30 uppercase mb-6">
          Demo Run Checklist // See Every System
        </div>
        <div className="relative border border-white/10 p-6">
          <CornerBorders />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_CHECKLIST_STEPS.map((step, i) => (
              <Link key={step.id} href={step.href()}>
                <div className="flex items-start gap-3 p-3 border border-white/5 hover:border-cyan-500/20 hover:bg-cyan-500/5 transition-all cursor-pointer group">
                  <div className="mt-0.5 shrink-0">
                    <Circle className="w-4 h-4 text-white/20 group-hover:text-cyan-400/50 transition-colors" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/30 font-bold tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">
                        {step.label}
                      </span>
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">{step.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 text-xs text-white/20 italic">
            Start from the top. Each step links to the relevant route. Some steps unlock after funding — follow the flow.
          </div>
        </div>
      </section>

      {/* ── Presenter Checklist ─────────────────────────────────────────── */}
      <section>
        <div className="text-[10px] tracking-[0.4em] text-white/30 uppercase mb-6">
          Presenter Checklist // 5-Minute Route Order
        </div>
        <div className="relative border border-violet-500/20 bg-violet-500/5 p-6">
          <CornerBorders />
          <div className="space-y-3">
            {presenterChecklist.map((step, index) => (
              <Link key={step.id} href={step.route}>
                <div className="grid grid-cols-[44px_1fr] md:grid-cols-[44px_160px_1fr] gap-3 p-3 border border-white/5 hover:border-violet-400/30 hover:bg-violet-500/10 transition-all group">
                  <div className="text-[10px] font-black text-violet-300/70 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white/70 group-hover:text-white uppercase tracking-wider">
                      {step.label}
                    </div>
                    <div className="text-[10px] text-violet-300/50 mt-1">{step.estimatedTime}</div>
                  </div>
                  <div>
                    <p className="text-xs text-white/45 leading-relaxed">{step.whatToSay}</p>
                    {step.doNotClaim && (
                      <p className="text-[11px] text-amber-300/70 mt-1">{step.doNotClaim}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Traction / Status ───────────────────────────────────────────── */}
      <section>
        <div className="text-[10px] tracking-[0.4em] text-white/30 uppercase mb-6">
          Status // Beta Season 1
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              label: "Simulation Engine",
              value: "Deterministic",
              note: "Reproducible runs. No randomness drift.",
              color: "emerald",
            },
            {
              label: "AI Dependency",
              value: "Pitch + Coaching Only",
              note: "Simulation runs without LLM calls. AI used for idea analysis and founder coaching.",
              color: "cyan",
            },
            {
              label: "Systems Live",
              value: "7 Systems",
              note: "Social, Rivals, Strategy, Boardroom, Career, Documentary, Seasons.",
              color: "violet",
            },
            {
              label: "Leaderboard",
              value: "Beta Season 1",
              note: "Global + sector + playstyle + revenue + valuation + survival categories.",
              color: "amber",
            },
            {
              label: "Run Length",
              value: "12 Founder Weeks",
              note: "Each run is self-contained. Replay with different strategy anytime.",
              color: "cyan",
            },
            {
              label: "Multiplayer",
              value: "Async Arena",
              note: "Compete on leaderboards against completed runs. Not real-time.",
              color: "white",
            },
          ].map((item) => {
            const colors: Record<string, { border: string; text: string }> = {
              emerald: { border: "border-emerald-500/30", text: "text-emerald-400" },
              cyan: { border: "border-cyan-500/30", text: "text-cyan-400" },
              violet: { border: "border-violet-500/30", text: "text-violet-400" },
              amber: { border: "border-amber-500/30", text: "text-amber-400" },
              white: { border: "border-white/10", text: "text-white/60" },
            };
            const c = colors[item.color] ?? colors.white;
            return (
              <div key={item.label} className={cn("relative border p-4", c.border)}>
                <CornerBorders />
                <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{item.label}</div>
                <div className={cn("text-base font-black", c.text)}>{item.value}</div>
                <div className="text-xs text-white/30 mt-1 leading-relaxed">{item.note}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── What This Is Not ────────────────────────────────────────────── */}
      <section>
        <div className="text-[10px] tracking-[0.4em] text-white/30 uppercase mb-4">
          Transparency // What This Is Not
        </div>
        <div className="relative border border-white/10 p-5">
          <CornerBorders />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "Not a real social media poster. All Arena Feed content is simulated.",
              "Not live multiplayer. Leaderboard competition is asynchronous.",
              "Not a real investor matching platform. VC reviews are AI simulations.",
              "Not a real company formation tool. This is a game.",
              "Not subscription-gated. Current beta is full-access for demo purposes.",
              "Documentaries are generated by AI coaching + structured templates — not full LLM films.",
              "Not a real infrastructure-cost model yet. Provider burn modeling is a future economy phase.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs text-white/40">
                <span className="mt-0.5 shrink-0 text-white/20">—</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTAs ─────────────────────────────────────────────────── */}
      <section className="border-t border-white/5 pt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-cyan-400/40 uppercase mb-1">Ready to run</div>
            <p className="text-sm text-white/50">Start a new run. Experience the full loop in under 10 minutes.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/startup/new">
              <div className="flex items-center gap-2 px-5 py-2.5 border border-cyan-400/50 text-cyan-400 text-sm font-bold tracking-wider hover:bg-cyan-500/10 transition-all cursor-pointer">
                <Crosshair className="w-4 h-4" />
                START RUN
              </div>
            </Link>
            <Link href="/leaderboard">
              <div className="flex items-center gap-2 px-5 py-2.5 border border-white/10 text-white/50 text-sm font-bold tracking-wider hover:border-white/30 hover:text-white/70 transition-all cursor-pointer">
                <TrendingUp className="w-4 h-4" />
                LEADERBOARD
              </div>
            </Link>
            <Link href="/dashboard">
              <div className="flex items-center gap-2 px-5 py-2.5 border border-white/10 text-white/50 text-sm font-bold tracking-wider hover:border-white/30 hover:text-white/70 transition-all cursor-pointer">
                <Users className="w-4 h-4" />
                DASHBOARD
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
