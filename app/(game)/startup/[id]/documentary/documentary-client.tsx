"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Film,
  ChevronRight,
  Copy,
  Check,
  Trophy,
  TrendingUp,
  DollarSign,
  Calendar,
  Zap,
  Star,
  Target,
  Users,
  ArrowUpRight,
  BookOpen,
  Shield,
  AlertTriangle,
  Activity,
  Swords,
  Radio,
  Award,
} from "lucide-react";
import type { DocumentaryPageData } from "@/lib/actions/documentary";
import type {
  FounderDocumentaryChapter,
  DocumentaryTimelineMoment,
  ChapterCategory,
  DocumentaryTone,
} from "@/lib/documentary/types";
import { RewardPopup } from "@/components/game/RewardPopup";
import { getFinalVerdictLabel, getShortRunStepLabel } from "@/lib/game-time/time-scale";

// ─── Accent maps ──────────────────────────────────────────────────────────────

const TONE_ACCENT: Record<DocumentaryTone, string> = {
  triumphant: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  underdog: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  legendary: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  chaotic: "text-pink-400 border-pink-400/30 bg-pink-400/10",
  gritty: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  tragic: "text-rose-400 border-rose-400/30 bg-rose-400/10",
  cautionary: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  satirical: "text-violet-400 border-violet-400/30 bg-violet-400/10",
};

const TONE_LABELS: Record<DocumentaryTone, string> = {
  triumphant: "TRIUMPHANT",
  underdog: "UNDERDOG",
  legendary: "LEGENDARY",
  chaotic: "CHAOTIC",
  gritty: "GRITTY",
  tragic: "TRAGIC",
  cautionary: "CAUTIONARY",
  satirical: "SATIRICAL",
};

const GENRE_LABELS: Record<string, string> = {
  founder_memoir: "FOUNDER MEMOIR",
  arena_highlight: "ARENA HIGHLIGHT",
  startup_true_crime: "TRUE CRIME",
  investor_case_study: "CASE STUDY",
  comeback_story: "COMEBACK STORY",
  cautionary_tale: "CAUTIONARY TALE",
};

const CHAPTER_ICON: Record<ChapterCategory, React.ReactNode> = {
  origin: <BookOpen className="w-4 h-4" />,
  funding: <TrendingUp className="w-4 h-4" />,
  strategy: <Target className="w-4 h-4" />,
  social: <Radio className="w-4 h-4" />,
  rival: <Swords className="w-4 h-4" />,
  verdict: <Activity className="w-4 h-4" />,
};

const CHAPTER_ACCENT: Record<ChapterCategory, string> = {
  origin: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
  funding: "text-violet-400 border-violet-500/20 bg-violet-500/5",
  strategy: "text-amber-400 border-amber-500/20 bg-amber-500/5",
  social: "text-pink-400 border-pink-500/20 bg-pink-500/5",
  rival: "text-rose-400 border-rose-500/20 bg-rose-500/5",
  verdict: "text-white border-white/10 bg-white/5",
};

const TIMELINE_IMPACT_ACCENT: Record<string, string> = {
  positive: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
  negative: "border-rose-400/40 bg-rose-400/10 text-rose-400",
  mixed: "border-amber-400/40 bg-amber-400/10 text-amber-400",
  neutral: "border-white/10 bg-white/5 text-white/40",
};

const OUTCOME_ACCENT: Record<string, string> = {
  BREAKOUT: "border-emerald-400/50 bg-emerald-400/10 text-emerald-400",
  SERIES_A_READY: "border-cyan-400/50 bg-cyan-400/10 text-cyan-400",
  ACQUISITION: "border-amber-400/50 bg-amber-400/10 text-amber-400",
  ACQUIHIRE: "border-amber-400/50 bg-amber-400/10 text-amber-400",
  ACQUISITION_TARGET: "border-violet-400/50 bg-violet-400/10 text-violet-400",
  SEED_READY: "border-cyan-400/30 bg-cyan-400/5 text-cyan-400/80",
  SMALL_PROFITABLE: "border-emerald-400/30 bg-emerald-400/5 text-emerald-400/80",
  ZOMBIE: "border-white/20 bg-white/5 text-white/40",
  HIGH_RISK_FAILURE: "border-rose-400/50 bg-rose-400/10 text-rose-400",
  DEAD: "border-rose-400/50 bg-rose-400/10 text-rose-400",
};

const OUTCOME_LABELS: Record<string, string> = {
  BREAKOUT: "BREAKOUT",
  SERIES_A_READY: "SERIES A READY",
  ACQUISITION: "ACQUIRED",
  ACQUIHIRE: "ACQUIHIRED",
  ACQUISITION_TARGET: "ACQ TARGET",
  SEED_READY: "SEED READY",
  SMALL_PROFITABLE: "PROFITABLE",
  ZOMBIE: "ZOMBIE",
  HIGH_RISK_FAILURE: "DEAD",
  DEAD: "DEAD",
};

function fmtVal(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroSection({ data }: { data: DocumentaryPageData }) {
  const { documentary } = data;
  const toneClass = TONE_ACCENT[documentary.tone] ?? "text-white/60 border-white/20 bg-white/5";
  const outcomeClass = OUTCOME_ACCENT[documentary.outcome] ?? "border-white/20 bg-white/5 text-white/60";

  return (
    <div className="space-y-4">
      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${toneClass}`}>
          <Film className="w-3 h-3" />
          {TONE_LABELS[documentary.tone]}
        </span>
        <span className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-white/40">
          {GENRE_LABELS[documentary.genre] ?? documentary.genre.toUpperCase()}
        </span>
        <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${outcomeClass}`}>
          {OUTCOME_LABELS[documentary.outcome] ?? documentary.outcome}
        </span>
      </div>

      {/* Tagline */}
      <p className="text-white/60 text-sm leading-relaxed font-medium">
        &ldquo;{documentary.tagline}&rdquo;
      </p>

      {/* Hero stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <StatTile label="SCORE" value={documentary.heroStats.finalScore.toLocaleString()} icon={<Trophy className="w-3.5 h-3.5 text-amber-400" />} />
        <StatTile label="VALUATION" value={fmtVal(documentary.heroStats.finalValuation)} icon={<TrendingUp className="w-3.5 h-3.5 text-violet-400" />} />
        <StatTile label="REVENUE" value={fmtVal(documentary.heroStats.finalRevenue)} icon={<DollarSign className="w-3.5 h-3.5 text-emerald-400" />} />
        <StatTile label="WEEKS" value={String(documentary.heroStats.monthsSurvived)} icon={<Calendar className="w-3.5 h-3.5 text-cyan-400" />} />
        {documentary.heroStats.dominantPlaystyle && (
          <StatTile label="STRATEGY" value={documentary.heroStats.dominantPlaystyle} icon={<Zap className="w-3.5 h-3.5 text-amber-400" />} />
        )}
        {documentary.heroStats.strongestRival && (
          <StatTile label="RIVAL" value={documentary.heroStats.strongestRival} icon={<Swords className="w-3.5 h-3.5 text-rose-400" />} />
        )}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="game-card p-3 hud-corner">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[9px] text-white/40 font-bold tracking-wider uppercase">{label}</span>
      </div>
      <p className="text-sm font-black text-white truncate">{value}</p>
    </div>
  );
}

function ChapterCards({ chapters }: { chapters: FounderDocumentaryChapter[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-white/40" />
        <h2 className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Story Chapters</h2>
      </div>
      <div className="space-y-3">
        {chapters.map((ch) => {
          const accent = CHAPTER_ACCENT[ch.category] ?? "text-white/60 border-white/10 bg-white/5";
          const icon = CHAPTER_ICON[ch.category];
          return (
            <div key={ch.id} className={`border p-4 hud-corner ${accent}`}>
              <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-xs font-bold tracking-wider uppercase">{ch.title}</span>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">{ch.body}</p>
              {ch.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {ch.tags.map((t) => (
                    <span key={t} className="text-[9px] text-white/30 border border-white/10 px-1.5 py-0.5 uppercase tracking-wider">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Timeline({ moments }: { moments: DocumentaryTimelineMoment[] }) {
  if (moments.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-white/40" />
        <h2 className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Timeline</h2>
      </div>
      <div className="relative pl-4">
        <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10" />
        <div className="space-y-3">
          {moments.map((m) => {
            const impactClass = TIMELINE_IMPACT_ACCENT[m.impact] ?? "border-white/10 bg-white/5 text-white/40";
            return (
              <div key={m.id} className="relative pl-4">
                <div className="absolute -left-[17px] top-3 w-2 h-2 border border-white/20 bg-black" />
                <div className="game-card p-3 hud-corner">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <span className="text-xs font-bold text-white">{m.title}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 border uppercase tracking-wider ${impactClass}`}>
                        {m.impact}
                      </span>
                      <span className="text-[9px] text-white/30 font-bold">{getShortRunStepLabel(m.month)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{m.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ShareCardPanel({ data }: { data: DocumentaryPageData }) {
  const [copied, setCopied] = useState(false);
  const { shareCard } = data.documentary;
  const outcomeClass = OUTCOME_ACCENT[data.documentary.outcome] ?? "border-white/20 bg-white/5 text-white/60";

  async function copyShareText() {
    try {
      await navigator.clipboard.writeText(shareCard.shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select a hidden textarea
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ArrowUpRight className="w-4 h-4 text-white/40" />
        <h2 className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Share This Run</h2>
      </div>

      {/* Screenshot card */}
      <div className="border border-white/10 bg-black/60 p-5 hud-corner space-y-3 relative overflow-hidden">
        {/* Corner decorators */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/30" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/30" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold tracking-[0.3em] text-cyan-400/60 uppercase">FOUNDER ARENA</span>
          <span className={`text-[9px] font-bold px-2 py-0.5 border uppercase tracking-wider ${outcomeClass}`}>
            {shareCard.outcomeLabel}
          </span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-black text-white leading-tight">{shareCard.startupName}</h3>
          <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
            {shareCard.sector} · {shareCard.founderTitle}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 border-t border-b border-white/10 py-2">
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider">Score</p>
            <p className="text-sm font-black text-white">{shareCard.finalScore.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider">Valuation</p>
            <p className="text-sm font-black text-white">{fmtVal(shareCard.finalValuation)}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider">Founder Weeks</p>
            <p className="text-sm font-black text-white">{shareCard.monthsSurvived}</p>
          </div>
        </div>

        {/* Strategy + badge */}
        <div className="flex items-center justify-between gap-2">
          {shareCard.dominantPlaystyle && (
            <span className="text-[10px] text-amber-400 font-bold border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 uppercase tracking-wider">
              {shareCard.dominantPlaystyle}
            </span>
          )}
          {shareCard.badgeLine && (
            <span className="text-[10px] text-cyan-400/60 font-bold tracking-wider">{shareCard.badgeLine}</span>
          )}
        </div>

        {/* Quote */}
        <p className="text-xs text-white/50 italic border-l border-white/20 pl-3">
          &ldquo;{shareCard.quote}&rdquo;
        </p>
      </div>

      {/* Copy button */}
      <button
        onClick={copyShareText}
        className="flex items-center gap-2 px-4 py-2.5 border border-cyan-400/30 bg-cyan-400/10 text-cyan-400 text-xs font-bold tracking-wider uppercase hover:bg-cyan-400/20 transition-all cursor-pointer"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            COPIED
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            COPY SHARE TEXT
          </>
        )}
      </button>

      {/* Share text preview */}
      <pre className="text-[10px] text-white/30 bg-white/5 border border-white/10 p-3 font-mono whitespace-pre-wrap leading-relaxed">
        {shareCard.shareText}
      </pre>
    </div>
  );
}

function CareerImpactPanel({ data }: { data: DocumentaryPageData }) {
  const career = data.documentary.careerImpactSummary;
  if (!career) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-amber-400" />
        <h2 className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Career Impact</h2>
      </div>
      <div className="border border-amber-500/20 bg-amber-500/5 p-4 hud-corner">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Reputation</p>
            <p className="text-lg font-black text-amber-400">{career.newReputationScore}<span className="text-xs text-white/40">/100</span></p>
            {career.reputationDelta !== 0 && (
              <p className={`text-[10px] font-bold ${career.reputationDelta > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {career.reputationDelta > 0 ? "+" : ""}{career.reputationDelta}
              </p>
            )}
          </div>
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Rank</p>
            <p className="text-sm font-black text-white uppercase">{career.newRank}</p>
            {career.rankAdvanced && (
              <p className="text-[10px] font-bold text-emerald-400">ADVANCED</p>
            )}
          </div>
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Title</p>
            <p className="text-sm font-black text-white">{career.newTitle}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Badges</p>
            <p className="text-sm font-black text-white">{career.badgeCount}</p>
          </div>
        </div>
        <Link
          href="/career"
          className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors font-bold tracking-wider uppercase"
        >
          View full career legacy <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function RivalHighlightPanel({ data }: { data: DocumentaryPageData }) {
  const rival = data.documentary.rivalSummary;
  if (!rival) return null;

  const won = rival.defeated === rival.totalRivals;
  const accent = won ? "border-rose-500/20 bg-rose-500/5" : "border-rose-500/30 bg-rose-500/10";

  return (
    <div className={`border p-4 hud-corner ${accent}`}>
      <div className="flex items-center gap-2 mb-3">
        <Swords className="w-4 h-4 text-rose-400" />
        <h3 className="text-xs font-bold text-rose-400 tracking-wider uppercase">Rival Report</h3>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Faced</p>
          <p className="text-lg font-black text-white">{rival.totalRivals}</p>
        </div>
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Defeated</p>
          <p className="text-lg font-black text-emerald-400">{rival.defeated}</p>
        </div>
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Win Rate</p>
          <p className="text-lg font-black text-white">
            {rival.totalRivals > 0 ? Math.round((rival.defeated / rival.totalRivals) * 100) : 0}%
          </p>
        </div>
      </div>
      {rival.strongestRivalName && (
        <p className="text-xs text-white/60 mb-1">
          Strongest rival: <span className="text-white font-bold">{rival.strongestRivalName}</span>
          {rival.strongestRivalArchetype && (
            <span className="text-white/30"> · {rival.strongestRivalArchetype.replace(/_/g, " ")}</span>
          )}
        </p>
      )}
      <p className="text-xs text-white/40">{rival.overallOutcome}</p>
      {rival.topMoment && (
        <p className="text-[10px] text-rose-400/60 mt-2 border-l border-rose-400/20 pl-2">
          Key moment: {rival.topMoment}
        </p>
      )}
    </div>
  );
}

function SocialHighlightPanel({ data }: { data: DocumentaryPageData }) {
  const social = data.documentary.socialSummary;
  if (!social) return null;

  return (
    <div className="border border-pink-500/20 bg-pink-500/5 p-4 hud-corner">
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-4 h-4 text-pink-400" />
        <h3 className="text-xs font-bold text-pink-400 tracking-wider uppercase">Social Report</h3>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Followers</p>
          <p className="text-sm font-black text-white">{social.followers.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Hype</p>
          <p className="text-sm font-black text-pink-400">{social.finalHype}</p>
        </div>
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Trust</p>
          <p className="text-sm font-black text-cyan-400">{social.finalTrust}</p>
        </div>
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Brand Risk</p>
          <p className={`text-sm font-black ${social.finalBrandRisk >= 60 ? "text-rose-400" : "text-white"}`}>
            {social.finalBrandRisk}
          </p>
        </div>
      </div>
      <p className="text-xs text-white/60">{social.narrative}</p>
      {social.topMoment && (
        <p className="text-[10px] text-pink-400/60 mt-2 border-l border-pink-400/20 pl-2">
          Top moment: {social.topMoment}
        </p>
      )}
    </div>
  );
}

function StrategyPanel({ data }: { data: DocumentaryPageData }) {
  const strategy = data.documentary.strategySummary;
  if (!strategy || !strategy.dominantPlaystyle) return null;

  return (
    <div className="border border-amber-500/20 bg-amber-500/5 p-4 hud-corner">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs font-bold text-amber-400 tracking-wider uppercase">Strategy Archetype</h3>
        <span className="ml-auto text-[10px] text-amber-400 border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-bold uppercase tracking-wider">
          {strategy.dominantPlaystyle.replace(/_/g, " ")}
        </span>
      </div>
      <p className="text-sm text-white/80 leading-relaxed mb-3">{strategy.finalRunNarrative}</p>
      {strategy.strengths.length > 0 && (
        <div className="mb-2">
          <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5">Strengths</p>
          <div className="space-y-1">
            {strategy.strengths.slice(0, 2).map((s, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <Shield className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-white/60">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {strategy.weaknesses.length > 0 && (
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5">Tradeoffs</p>
          <div className="space-y-1">
            {strategy.weaknesses.slice(0, 2).map((w, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-white/60">{w}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FinalVerdictPanel({ data }: { data: DocumentaryPageData }) {
  const { finalVerdict, outcome } = data.documentary;
  const isWin = ["BREAKOUT", "SERIES_A_READY", "ACQUISITION", "ACQUIHIRE", "ACQUISITION_TARGET", "SEED_READY", "SMALL_PROFITABLE"].includes(outcome);
  const accent = isWin
    ? "border-emerald-500/30 bg-emerald-500/5"
    : outcome === "ZOMBIE"
    ? "border-white/10 bg-white/5"
    : "border-rose-500/20 bg-rose-500/5";
  const textColor = isWin ? "text-emerald-400" : outcome === "ZOMBIE" ? "text-white/40" : "text-rose-400";

  return (
    <div className={`border p-4 hud-corner ${accent}`}>
      <div className="flex items-center gap-2 mb-3">
        <Award className={`w-4 h-4 ${textColor}`} />
        <h3 className={`text-xs font-bold tracking-wider uppercase ${textColor}`}>{getFinalVerdictLabel()}</h3>
      </div>
      <p className="text-sm text-white/80 leading-relaxed">{finalVerdict}</p>
    </div>
  );
}

function CTAPanel({ data, startupId }: { data: DocumentaryPageData; startupId: string }) {
  const isDead = data.startup.status === "dead";
  const publicSlug = data.startup.publicSlug;

  return (
    <div className="flex flex-wrap gap-3">
      <Link href={`/startup/${startupId}`}>
        <div className="flex items-center gap-2 px-4 py-2.5 border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20 transition-all text-xs font-bold tracking-wider uppercase cursor-pointer">
          <Activity className="w-3.5 h-3.5" />
          STARTUP PROFILE
        </div>
      </Link>
      <Link href="/startup/new">
        <div className="flex items-center gap-2 px-4 py-2.5 border border-cyan-400/30 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 transition-all text-xs font-bold tracking-wider uppercase cursor-pointer relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-cyan-400" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-cyan-400" />
          <Zap className="w-3.5 h-3.5" />
          NEW RUN
        </div>
      </Link>
      <Link href="/career">
        <div className="flex items-center gap-2 px-4 py-2.5 border border-amber-400/20 bg-amber-400/5 text-amber-400 hover:bg-amber-400/10 transition-all text-xs font-bold tracking-wider uppercase cursor-pointer">
          <Star className="w-3.5 h-3.5" />
          CAREER LEGACY
        </div>
      </Link>
      {isDead && (
        <Link href="/graveyard">
          <div className="flex items-center gap-2 px-4 py-2.5 border border-rose-400/20 bg-rose-400/5 text-rose-400/60 hover:text-rose-400 hover:border-rose-400/40 transition-all text-xs font-bold tracking-wider uppercase cursor-pointer">
            <Users className="w-3.5 h-3.5" />
            GRAVEYARD
          </div>
        </Link>
      )}
      {publicSlug && (
        <Link href={`/s/${publicSlug}`} target="_blank">
          <div className="flex items-center gap-2 px-4 py-2.5 border border-white/10 bg-white/5 text-white/40 hover:text-white hover:border-white/20 transition-all text-xs font-bold tracking-wider uppercase cursor-pointer">
            <ArrowUpRight className="w-3.5 h-3.5" />
            PUBLIC RECORD
          </div>
        </Link>
      )}
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export function DocumentaryClient({
  data,
  startupId,
}: {
  data: DocumentaryPageData;
  startupId: string;
}) {
  return (
    <div className="space-y-6">
      <RewardPopup
        title="Founder Documentary Generated"
        description="The run has been converted into a shareable story: verdict, timeline, rivals, social pressure, and career impact."
        accent="violet"
        ctaLabel="Share This Run"
        ctaHref={`/startup/${startupId}/documentary`}
      />

      {/* Hero */}
      <HeroSection data={data} />

      {/* Chapters */}
      <ChapterCards chapters={data.documentary.chapters} />

      {/* Timeline */}
      <Timeline moments={data.documentary.timeline} />

      {/* Final Verdict */}
      <FinalVerdictPanel data={data} />

      {/* Strategy */}
      <StrategyPanel data={data} />

      {/* Rival + Social row */}
      {(data.documentary.rivalSummary || data.documentary.socialSummary) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.documentary.rivalSummary && <RivalHighlightPanel data={data} />}
          {data.documentary.socialSummary && <SocialHighlightPanel data={data} />}
        </div>
      )}

      {/* Career impact */}
      <CareerImpactPanel data={data} />

      {/* Share card */}
      <ShareCardPanel data={data} />

      {/* CTAs */}
      <CTAPanel data={data} startupId={startupId} />
    </div>
  );
}
