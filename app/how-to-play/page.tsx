import Link from "next/link";
import { GameCard } from "@/components/game/GameCard";
import { SectionHeader } from "@/components/game/SectionHeader";
import {
  Rocket,
  Target,
  BrainCircuit,
  Calendar,
  TrendingUp,
  Trophy,
  Lightbulb,
  ArrowLeft,
} from "lucide-react";
import {
  GrowthPhaseUnlockedIcon,
  GrowthSeriesAIcon,
  OutcomeDeadIcon,
} from "@/components/assets";

export const metadata = {
  title: "How to Play — Founder Arena",
  description: "Learn the game loop, mechanics, and strategies to build a successful startup in Founder Arena.",
};

export default function HowToPlayPage() {
  return (
    <div>
      <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 md:px-8">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white text-glow-cyan">
            How to Play
          </h1>
          <p className="text-white/40 mt-2 max-w-xl mx-auto">
            Founder Arena is an AI-powered startup simulation. Learn the rules, master the loop, and build something that survives.
          </p>
        </div>

        {/* What is Founder Arena */}
        <section className="mb-12">
          <SectionHeader title="What Is Founder Arena?" accent="cyan" />
          <GameCard>
            <p className="text-sm text-white/90 leading-relaxed mb-4">
              Founder Arena is a single-player simulation game where you act as a startup founder. You create a company,
              pitch it to AI venture capitalists, negotiate term sheets, hire a team, and navigate 12 Founder Weeks of volatile
              markets — all powered by deterministic game math and AI-generated narrative.
            </p>
            <p className="text-sm text-white/90 leading-relaxed">
              The game does not hand out free wins. Your startup can die. The AI VCs can reject you. Markets can turn
              against your sector. Success requires strategic decisions, capital discipline, and a bit of luck.
            </p>
          </GameCard>
        </section>

        {/* Game Loop */}
        <section className="mb-12">
          <SectionHeader title="The Game Loop" accent="violet" />
          <div className="grid gap-4 md:grid-cols-2">
            <StepCard
              icon={<GrowthPhaseUnlockedIcon className="w-5 h-5 text-cyan-400" size={20} />}
              title="1. Create & Pitch"
              description="Define your startup idea, choose a sector and region, then build a pitch deck. You can start from scratch or use a template."
            />
            <StepCard
              icon={<BrainCircuit className="w-5 h-5 text-violet-400" />}
              title="2. AI VC Review"
              description="Submit your pitch to AI investors. They score your problem, solution, market, team, and business model. A 6-persona committee votes."
            />
            <StepCard
              icon={<GrowthSeriesAIcon className="w-5 h-5 text-emerald-400" size={20} />}
              title="3. Fund & Build"
              description="If investable, receive a term sheet. Negotiate valuation, equity, board seats, and liquidation preference. Close your round."
            />
            <StepCard
              icon={<Calendar className="w-5 h-5 text-amber-400" />}
              title="4. Operate & Survive"
              description="Make 1-3 sprint decisions across 12 Founder Weeks. Hire team members, react to market events, and manage cash, burn, and runway."
            />
          </div>
        </section>

        {/* How AI VC Works */}
        <section className="mb-12">
          <SectionHeader title="How AI VC Works" accent="cyan" />
          <GameCard>
            <div className="space-y-4 text-sm text-white/90 leading-relaxed">
              <p>
                The AI VC system analyzes your pitch deck using structured scoring across five dimensions:
                <strong> Problem</strong>, <strong>Solution</strong>, <strong>Market</strong>,{" "}
                <strong>Team</strong>, and <strong>Business Model</strong>. Each is scored 0-100.
              </p>
              <p>
                After the base review, a <strong>6-persona investment committee</strong> evaluates your startup
                from different angles: Generalist, Technical, Fintech, Growth, CFO, and Skeptic. Their combined
                support level determines how favorable the terms will be.
              </p>
              <p>
                The AI never invents fake success. If your pitch is weak, you will get rejected or receive a{" "}
                <em>revise</em> decision. You can always iterate and resubmit — but each submission costs a turn
                and burns runway.
              </p>
              <div className="bg-white/5 border border-white/5 bg-white/5 p-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-1">
                  Pro Tip
                </div>
                <p>
                  Use the <strong>suggested pitch draft</strong> to get a solid baseline, then customize it with
                  specific numbers, real competitor names, and a narrow go-to-market plan.
                </p>
              </div>
            </div>
          </GameCard>
        </section>

        {/* Funding Negotiation */}
        <section className="mb-12">
          <SectionHeader title="How Funding Negotiation Works" accent="violet" />
          <GameCard>
            <div className="space-y-4 text-sm text-white/90 leading-relaxed">
              <p>
                If your AI review score is strong enough, the system generates a <strong>term sheet</strong> with
                proposed investment amount, equity percentage, valuation, board seats, and liquidation preference.
              </p>
              <p>
                You have three options:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">Accept</span>
                  <span>Close the round, receive cash, and unlock operations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">Counter</span>
                  <span>Propose different terms. High-scoring startups get more flexibility. The VC may accept, revise, or reject your counter.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">Reject</span>
                  <span>Walk away. You can try fundraising again later, but you will burn cash waiting.</span>
                </li>
              </ul>
              <p>
                <strong>Equity dilution</strong> matters. Selling 25% now and 20% later leaves you with 60% ownership.
                Fight for higher valuation and lower equity in early rounds.
              </p>
            </div>
          </GameCard>
        </section>

        {/* Sprint Simulation */}
        <section className="mb-12">
          <SectionHeader title="How Sprint Simulation Works" accent="cyan" />
          <GameCard>
            <div className="space-y-4 text-sm text-white/90 leading-relaxed">
              <p>
                After funding, you enter <strong>12 Founder Weeks of operation</strong>. Each sprint, you select 1-3 decisions
                from a catalog of options: hire engineers, launch beta, cut costs, improve security, push marketing, etc.
              </p>
              <p>
                Each decision has costs and benefits:
              </p>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Cash cost</strong> — immediate spend</li>
                <li>• <strong>Burn delta</strong> — ongoing monthly cost or savings</li>
                <li>• <strong>Product delta</strong> — progress toward launch</li>
                <li>• <strong>Revenue delta</strong> — new income</li>
                <li>• <strong>Investor delta</strong> — confidence boost or drop</li>
                <li>• <strong>Risk delta</strong> — compliance/security exposure</li>
              </ul>
              <p>
                Your <strong>team</strong> adds passive effects. Engineers boost product progress. Sales reps boost
                revenue. Compliance officers reduce risk. Office setup affects morale and productivity.
              </p>
              <div className="bg-white/5 border border-white/5 bg-white/5 p-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-1">
                  Pro Tip
                </div>
                <p>
                  Do not hire too fast. Payroll is the biggest burn driver. Aim for 6+ months of runway at all times.
                </p>
              </div>
            </div>
          </GameCard>
        </section>

        {/* Markets */}
        <section className="mb-12">
          <SectionHeader title="How Markets Affect Startups" accent="violet" />
          <GameCard>
            <div className="space-y-4 text-sm text-white/90 leading-relaxed">
              <p>
                Every sprint, a <strong>market snapshot</strong> determines macro conditions. 12 scenarios rotate
                through the accelerator run: AI booms, recessions, crypto winters, regulatory crackdowns, supply chain crises, etc.
              </p>
              <p>
                Your startup&apos;s <strong>sector and region</strong> determine how exposed you are to each macro factor.
                A fintech startup suffers more during regulatory crackdowns. An AI startup thrives during AI booms but
                faces higher energy costs.
              </p>
              <p>
                Market conditions modify your sprint results via:
              </p>
              <ul className="space-y-1 ml-4">
                <li>• Revenue multipliers (+/- up to 25%)</li>
                <li>• Burn multipliers (+/- up to 10%)</li>
                <li>• Valuation multipliers (+/- up to 20%)</li>
                <li>• Investor score shifts</li>
                <li>• Risk score shifts</li>
              </ul>
              <p>
                You cannot control the market, but you can <strong>adapt your decisions</strong>. In a recession,
                cut costs and focus on revenue. In an AI boom, double down on product and hiring.
              </p>
            </div>
          </GameCard>
        </section>

        {/* Leaderboard Scoring */}
        <section className="mb-12">
          <SectionHeader title="How Leaderboard Scoring Works" accent="cyan" />
          <GameCard>
            <div className="space-y-4 text-sm text-white/90 leading-relaxed">
              <p>
                Your <strong>leaderboard score</strong> is calculated at the end of your run based on:
              </p>
              <ul className="space-y-1 ml-4">
                <li>• Final valuation</li>
                <li>• Final revenue</li>
                <li>• Founder Weeks survived</li>
                <li>• Capital efficiency (revenue / burn)</li>
                <li>• Market difficulty bonus</li>
              </ul>
              <p>
                Your <strong>outcome</strong> applies a multiplier:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {[
                  { outcome: "BREAKOUT", mult: "3.0x", color: "text-emerald-400" },
                  { outcome: "SERIES_A_READY", mult: "2.5x", color: "text-cyan-400" },
                  { outcome: "ACQUISITION_TARGET", mult: "2.0x", color: "text-violet-400" },
                  { outcome: "SEED_READY", mult: "1.8x", color: "text-blue-400" },
                  { outcome: "SMALL_PROFITABLE", mult: "1.5x", color: "text-amber-400" },
                  { outcome: "ZOMBIE", mult: "0.5x", color: "text-slate-400" },
                  { outcome: "DEAD", mult: "0x", color: "text-rose-400" },
                ].map((o) => (
                  <div key={o.outcome} className="bg-white/5 border border-white/5 bg-white/5 px-3 py-2">
                    <div className={`text-xs font-bold ${o.color}`}>{o.outcome}</div>
                    <div className="text-xs text-white/40">{o.mult}</div>
                  </div>
                ))}
              </div>
              <p>
                Surviving in a <strong>difficult market</strong> earns a bonus. Dying in an easy market hurts more.
                The scoring rewards founders who perform well under pressure.
              </p>
            </div>
          </GameCard>
        </section>

        {/* Why Startups Die */}
        <section className="mb-12">
          <SectionHeader title="Why Startups Die" accent="rose" />
          <GameCard glow="rose">
            <div className="space-y-3 text-sm text-white/90 leading-relaxed">
              <p>Startups in Founder Arena can die for several reasons:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <OutcomeDeadIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" size={16} />
                  <span>
                    <strong>Cash death</strong> — Cash hits zero and revenue is below burn. Runway is gone.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <OutcomeDeadIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" size={16} />
                  <span>
                    <strong>Runway death</strong> — Projected runway drops to 0 months. You cannot make payroll.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <OutcomeDeadIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" size={16} />
                  <span>
                    <strong>Risk death</strong> — Risk score hits 95. Regulatory, security, or operational failures
                    shut you down.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <OutcomeDeadIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" size={16} />
                  <span>
                    <strong>Investor abandonment</strong> — Investor score drops to 10 or below while cash is tight.
                    No one will fund you.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <OutcomeDeadIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" size={16} />
                  <span>
                    <strong>Product death</strong> — After Week 9, product progress is below 20% and revenue is
                    under $5,000. You have no traction.
                  </span>
                </li>
              </ul>
            </div>
          </GameCard>
        </section>

        {/* Tips */}
        <section className="mb-12">
          <SectionHeader title="Tips for Better Outcomes" accent="emerald" />
          <div className="grid gap-4 md:grid-cols-2">
            <TipCard
              icon={<Lightbulb className="w-5 h-5 text-amber-400" />}
              title="Start Narrow"
              description="Pick a small, well-defined customer segment. Broad targets dilute focus and increase CAC."
            />
            <TipCard
              icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
              title="Watch Burn Like a Hawk"
              description="Hiring is tempting but expensive. Each employee adds permanent burn. Only hire when runway is comfortable."
            />
            <TipCard
              icon={<Target className="w-5 h-5 text-cyan-400" />}
              title="Match Ask to Use of Funds"
              description="Investors check if your funding ask matches your spending plan. Mismatches reduce trust scores."
            />
            <TipCard
              icon={<Trophy className="w-5 h-5 text-violet-400" />}
              title="Adapt to Markets"
              description="Check the Market Intelligence page before each sprint. Tailor decisions to the current macro scenario."
            />
          </div>
        </section>

        {/* CTA */}
        <div className="text-center pb-8">
          <Link href="/startup/new">
            <div className="relative inline-flex items-center gap-2 px-8 py-4 border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all cursor-pointer">
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400" />
              <Rocket className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-bold text-sm tracking-wider uppercase">START YOUR FIRST STARTUP</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StepCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <GameCard className="h-full">
      <div className="mb-3 p-2 rounded-lg bg-white/5 w-fit">{icon}</div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed">{description}</p>
    </GameCard>
  );
}

function TipCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <GameCard className="h-full">
      <div className="mb-3 p-2 rounded-lg bg-white/5 w-fit">{icon}</div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed">{description}</p>
    </GameCard>
  );
}
