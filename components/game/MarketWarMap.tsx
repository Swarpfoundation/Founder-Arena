import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, AlertTriangle, BarChart3, Binary, Building2, Flame, Globe, Radio, Shield, ShoppingCart, Signal, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSectorIcon } from "@/lib/assets";
import type {
  MacroFactorPresentation,
  MarketScenarioPresentation,
  MarketTone,
  SeasonCommandPresentation,
  SectorHeatPresentation,
  StartupMarketContextPresentation,
} from "@/lib/game/market-scene";

const TONE_CLASS: Record<MarketTone, string> = {
  cyan: "border-cyan-500/25 bg-cyan-500/[0.055] text-cyan-300",
  violet: "border-violet-500/25 bg-violet-500/[0.055] text-violet-300",
  rose: "border-rose-500/30 bg-rose-500/[0.065] text-rose-300",
  amber: "border-amber-500/25 bg-amber-500/[0.06] text-amber-300",
  emerald: "border-emerald-500/25 bg-emerald-500/[0.055] text-emerald-300",
  white: "border-white/10 bg-white/[0.035] text-white/55",
};

const MACRO_ICON: Record<string, ReactNode> = {
  vcClimate: <Activity className="h-4 w-4" />,
  inflationPressure: <BarChart3 className="h-4 w-4" />,
  geopoliticalRisk: <Globe className="h-4 w-4" />,
  consumerSpending: <ShoppingCart className="h-4 w-4" />,
  enterpriseSpending: <Building2 className="h-4 w-4" />,
  aiDemand: <Binary className="h-4 w-4" />,
  cryptoSentiment: <Zap className="h-4 w-4" />,
  regulationPressure: <Shield className="h-4 w-4" />,
  supplyChainPressure: <Signal className="h-4 w-4" />,
  energyPrices: <Flame className="h-4 w-4" />,
};

export function MacroRadarPanel({ factors }: { factors: MacroFactorPresentation[] }) {
  return (
    <section className="space-y-3">
      <PanelHeader icon={<Radio className="h-4 w-4" />} title="Macro Radar" subtitle="Tactical gauges for the current arena climate" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {factors.map((factor) => {
          const width = Math.min(100, Math.abs(factor.value));
          return (
            <article key={factor.key} className={cn("border p-3 hud-corner", TONE_CLASS[factor.tone])}>
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider opacity-75">
                  {MACRO_ICON[factor.key]}
                  {factor.label}
                </p>
                <span className="text-[9px] font-black uppercase tracking-wider opacity-70">{factor.status}</span>
              </div>
              <p className="mt-2 text-2xl font-black text-white">{factor.value > 0 ? "+" : ""}{factor.value}</p>
              <div className="mt-2 h-1.5 overflow-hidden border border-white/10 bg-black/35">
                <div className="h-full bg-current" style={{ width: `${width}%` }} />
              </div>
              <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-white/45">{factor.explanation}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function SectorHeatMap({ sectors }: { sectors: SectorHeatPresentation[] }) {
  return (
    <section className="space-y-3">
      <PanelHeader icon={<Flame className="h-4 w-4" />} title="Sector Heat Map" subtitle="Momentum, pressure, and founder-readiness by sector" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {sectors.map((sector) => (
          <SectorHeatCard key={sector.sector} sector={sector} />
        ))}
      </div>
    </section>
  );
}

export function SectorHeatCard({ sector }: { sector: SectorHeatPresentation }) {
  const SectorIcon = getSectorIcon(sector.sector);
  return (
    <article className={cn("border p-4 hud-corner", TONE_CLASS[sector.tone])}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider opacity-70">{sector.label}</p>
          <h3 className="mt-1 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <SectorIcon className="h-4 w-4" size={16} />
            {sector.sector}
          </h3>
        </div>
        <span className="text-[10px] font-black text-white">{sector.trendValue.toFixed(2)}x</span>
      </div>
      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-white/52">{sector.summary}</p>
      <div className="mt-3 space-y-2">
        <TagRow label="Opportunity" values={sector.opportunities} tone="emerald" />
        <TagRow label="Risk" values={sector.risks} tone="rose" />
      </div>
    </article>
  );
}

export function ScenarioDossier({
  scenario,
  event,
  sourceMode,
  confidence,
}: {
  scenario: MarketScenarioPresentation;
  event?: { name?: string | null; description?: string | null; severity?: number | null } | null;
  sourceMode: string;
  confidence?: number;
}) {
  return (
    <section className={cn("border p-5 hud-corner", TONE_CLASS[scenario.tone])}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Scenario Dossier</p>
          <h2 className="mt-1 text-2xl font-black uppercase tracking-wider text-white">{scenario.label}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/58">{scenario.summary}</p>
        </div>
        <div className="grid gap-2 text-right">
          <span className="border border-current/25 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider">{scenario.direction}</span>
          <span className="text-[10px] font-black uppercase tracking-wider opacity-65">Source: {sourceMode}</span>
          {confidence !== undefined && <span className="text-[10px] font-black uppercase tracking-wider opacity-65">Confidence: {confidence}%</span>}
        </div>
      </div>
      {event?.name && (
        <div className="mt-4 border border-current/20 bg-black/20 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-black uppercase tracking-wider text-white">{event.name}</p>
            {event.severity !== undefined && <span className="ml-auto text-[10px] font-black uppercase tracking-wider opacity-70">Severity {event.severity}/100</span>}
          </div>
          {event.description && <p className="mt-2 text-sm leading-relaxed text-white/55">{event.description}</p>}
        </div>
      )}
    </section>
  );
}

export function SeasonCommandPanel({ season }: { season: SeasonCommandPresentation }) {
  return (
    <section className={cn("border p-5 hud-corner", TONE_CLASS[season.tone])}>
      <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Season Command</p>
      <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-white">{season.name}</h2>
      <p className="mt-1 text-sm italic text-white/55">{season.tagline}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniMetric label="Status" value={season.status} />
        <MiniMetric label="Challenges" value={String(season.challengeCount)} />
        <MiniMetric label="Entries" value={String(season.totalEntries)} />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-white/48">{season.summary}</p>
      <Link href="/leaderboard" className="mt-4 inline-flex items-center gap-2 border border-current/25 bg-black/20 px-3 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-white/10">
        <Trophy className="h-3.5 w-3.5" />
        Arena Leaderboard
      </Link>
    </section>
  );
}

export function MarketOpportunityFeed({ items }: { items: Array<{ label: string; detail: string; tone: MarketTone }> }) {
  return (
    <section className="space-y-3">
      <PanelHeader icon={<Signal className="h-4 w-4" />} title="Opportunity / Threat Feed" subtitle="What matters before the next sprint" />
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={`${item.label}-${item.detail}`} className={cn("border p-3 hud-corner", TONE_CLASS[item.tone])}>
            <p className="text-xs font-black uppercase tracking-wider text-white">{item.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StartupMarketContext({ context }: { context: StartupMarketContextPresentation | null }) {
  if (!context) {
    return (
      <section className="border border-white/10 bg-white/[0.03] p-5 text-white/55 hud-corner">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/35">Startup Context</p>
        <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-white">No Active Operation</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/50">Deploy a startup to see sector-specific market pressure here.</p>
        <Link href="/startup/new" className="mt-4 inline-flex border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20">
          Deploy Startup
        </Link>
      </section>
    );
  }
  return (
    <section className={cn("border p-5 hud-corner", TONE_CLASS[context.tone])}>
      <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Active Startup Context</p>
      <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-white">{context.name}</h2>
      <p className="mt-1 text-xs font-black uppercase tracking-wider opacity-70">{context.sector} · {context.pressure}</p>
      <p className="mt-3 text-sm leading-relaxed text-white/55">{context.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {context.ctas.map((cta) => (
          <Link key={cta.href} href={cta.href} className={cn("border px-3 py-2 text-xs font-black uppercase tracking-wider hover:bg-white/10", TONE_CLASS[cta.tone])}>
            {cta.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function TagRow({ label, values, tone }: { label: string; values: string[]; tone: MarketTone }) {
  return (
    <div>
      <p className="mb-1 text-[8px] font-black uppercase tracking-wider text-white/30">{label}</p>
      <div className="flex flex-wrap gap-1">
        {values.map((value) => (
          <span key={value} className={cn("border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider", TONE_CLASS[tone])}>
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function PanelHeader({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-white">
          <span className="text-cyan-300">{icon}</span>
          {title}
        </h2>
        <p className="mt-1 text-xs text-white/38">{subtitle}</p>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/25 to-transparent md:max-w-xs" />
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/20 px-2 py-1.5">
      <p className="text-[8px] font-black uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-0.5 truncate text-[11px] font-black uppercase tracking-wider text-white">{value}</p>
    </div>
  );
}
