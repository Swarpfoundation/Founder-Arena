"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Radio,
  Flame,
  ShieldAlert,
  TrendingUp,
  Users,
  MessageSquare,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Globe,
} from "lucide-react";
import {
  SocialStateData,
  SocialActionAvailability,
  ArenaFeedItem,
  FeedItemSeverity,
  PerformSocialActionResult,
} from "@/lib/social/types";
import { performSocialAction } from "@/lib/actions/social";
import { cn } from "@/lib/utils";
import { RewardPopup } from "@/components/game/RewardPopup";
import { EventRevealPanel } from "@/components/game/EventRevealPanel";
import { EventImpactBanner } from "@/components/game/EventImpactBanner";
import { buildSocialPresentation } from "@/lib/gamefeel/critical-events";
import { getRunStepLabel, getShortRunStepLabel } from "@/lib/game-time/time-scale";

interface Props {
  startupId: string;
  initialState: SocialStateData;
  currentMonth: number;
  availableActions: SocialActionAvailability[];
  startupName: string;
  startupStatus: string;
  productProgress: number;
  revenue: number;
  investorScore: number;
  riskScore: number;
  sector: string;
}

// ─── Metric bar ───────────────────────────────────────────────────────────────

function MetricBar({
  label,
  value,
  color = "cyan",
  icon,
}: {
  label: string;
  value: number;
  color?: "cyan" | "violet" | "emerald" | "rose" | "amber";
  icon?: React.ReactNode;
}) {
  const colorMap = {
    cyan: "bg-cyan-400",
    violet: "bg-violet-400",
    emerald: "bg-emerald-400",
    rose: "bg-rose-400",
    amber: "bg-amber-400",
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-white/40">{icon}</span>}
          <span className="text-[10px] text-white/40 font-bold tracking-wider uppercase">
            {label}
          </span>
        </div>
        <span className="text-[10px] font-black text-white">{value}</span>
      </div>
      <div className="h-1 bg-white/5 overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", colorMap[color])}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

// ─── Feed item ────────────────────────────────────────────────────────────────

function FeedItemRow({ item }: { item: ArenaFeedItem }) {
  const severityConfig: Record<
    FeedItemSeverity,
    { border: string; dot: string; label: string }
  > = {
    positive: {
      border: "border-emerald-500/20",
      dot: "bg-emerald-400",
      label: "text-emerald-400",
    },
    neutral: {
      border: "border-white/10",
      dot: "bg-white/30",
      label: "text-white/40",
    },
    warning: {
      border: "border-amber-500/20",
      dot: "bg-amber-400",
      label: "text-amber-400",
    },
    critical: {
      border: "border-rose-500/30",
      dot: "bg-rose-400",
      label: "text-rose-400",
    },
  };
  const cfg = severityConfig[item.severity];

  const categoryIcon: Record<string, React.ReactNode> = {
    post: <MessageSquare className="w-3 h-3" />,
    reaction: <Users className="w-3 h-3" />,
    press: <Radio className="w-3 h-3" />,
    viral: <Flame className="w-3 h-3" />,
    crisis: <AlertTriangle className="w-3 h-3" />,
    infrastructure: <AlertTriangle className="w-3 h-3" />,
    operations: <Radio className="w-3 h-3" />,
    rival: <Zap className="w-3 h-3" />,
    milestone: <CheckCircle2 className="w-3 h-3" />,
  };

  return (
    <div className={cn("p-3 border bg-white/[0.02] hud-corner", cfg.border)}>
      <div className="flex items-start gap-3">
        <div className="mt-1 shrink-0">
          <div className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn("text-[9px] font-bold uppercase tracking-wider", cfg.label)}>
              {item.category}
            </span>
            <span className="text-[9px] text-white/20">
              {categoryIcon[item.category]}
            </span>
            <span className="text-[9px] text-white/20 ml-auto shrink-0">
              {getShortRunStepLabel(item.month)}
            </span>
          </div>
          <p className="text-xs font-bold text-white/80 mb-0.5">{item.title}</p>
          <p className="text-[11px] text-white/50 leading-relaxed">{item.body}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Action card ──────────────────────────────────────────────────────────────

function ActionCard({
  availability,
  onSelect,
  isSelected,
  isPending,
}: {
  availability: SocialActionAvailability;
  onSelect: () => void;
  isSelected: boolean;
  isPending: boolean;
}) {
  const { action, available, reason, backfireWarning } = availability;
  const riskColor = {
    low: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    high: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  }[action.riskLevel];

  return (
    <div
      className={cn(
        "p-4 border hud-corner transition-all duration-150",
        available && !isPending
          ? isSelected
            ? "border-cyan-400/50 bg-cyan-500/10 cursor-pointer"
            : "border-white/10 bg-white/[0.02] hover:border-cyan-500/30 hover:bg-white/[0.04] cursor-pointer"
          : "border-white/5 bg-white/[0.01] opacity-50 cursor-not-allowed"
      )}
      onClick={available && !isPending ? onSelect : undefined}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-black text-white uppercase tracking-wide">
          {action.title}
        </p>
        <span
          className={cn(
            "shrink-0 text-[9px] font-bold px-1.5 py-0.5 border uppercase tracking-wider",
            riskColor
          )}
        >
          {action.riskLevel}
        </span>
      </div>
      <p className="text-[11px] text-white/50 leading-relaxed mb-3">
        {action.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-cyan-400/60 font-bold tracking-wider">
          {action.channelLabel}
        </span>
        <span className="text-[10px] text-white/40 font-bold">
          {action.cost > 0 ? `$${action.cost.toLocaleString()}` : "FREE"}
        </span>
      </div>
      {!available && reason && (
        <p className="mt-2 text-[10px] text-rose-400/70 font-bold">{reason}</p>
      )}
      {available && backfireWarning && (
        <div className="mt-2 flex items-start gap-1.5 border border-amber-500/20 bg-amber-500/5 px-2 py-1.5">
          <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-amber-400/80">{backfireWarning}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────

export function SocialClient({
  startupId,
  initialState,
  currentMonth,
  availableActions,
  startupStatus,
}: Props) {
  const [state, setState] = useState<SocialStateData>(initialState);
  const [actions] = useState<SocialActionAvailability[]>(availableActions);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<PerformSocialActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const metrics = state.metrics;
  const isReadOnly = !["funded", "active"].includes(startupStatus);
  const alreadyActedThisMonth = state.lastActionMonth >= currentMonth + 1;

  function handleSelect(actionId: string) {
    setSelectedActionId((prev) => (prev === actionId ? null : actionId));
  }

  function handleConfirm() {
    if (!selectedActionId || isPending) return;
    startTransition(async () => {
      try {
        const result = await performSocialAction(startupId, selectedActionId);
        setState((prev) => ({
          ...prev,
          metrics: result.updatedMetrics,
          feedItems: [...prev.feedItems, ...result.newFeedItems].slice(-100),
          actionsTaken: [
            ...prev.actionsTaken,
            {
              month: currentMonth + 1,
              actionId: selectedActionId,
              postId: result.post.id,
              effects: result.appliedEffects,
              didBackfire: result.didBackfire,
            },
          ],
          lastActionMonth: currentMonth + 1,
        }));
        setLastResult(result);
        setSelectedActionId(null);
        if (result.didBackfire) {
          toast.error("Post backfired — brand risk increased.");
        } else {
          toast.success("Social action posted to the arena.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed.");
      }
    });
  }

  const feedSorted = [...state.feedItems].sort((a, b) => b.month - a.month);
  const brandCrisisWarning = metrics.brandRisk > 70
    ? buildSocialPresentation({
        startupId,
        didBackfire: true,
        brandRiskDelta: metrics.brandRisk,
        trustDelta: metrics.trust < 50 ? metrics.trust - 50 : undefined,
      })
    : null;
  const lastSocialPresentation = lastResult
    ? buildSocialPresentation({
        startupId,
        didBackfire: lastResult.didBackfire,
        hypeDelta: lastResult.appliedEffects.hypeDelta,
        trustDelta: lastResult.appliedEffects.trustDelta,
        brandRiskDelta: lastResult.appliedEffects.brandRiskDelta,
        viralMomentumDelta: lastResult.appliedEffects.viralMomentumDelta,
      })
    : null;

  return (
    <div className="space-y-5">
      {brandCrisisWarning && !lastResult && (
        <EventImpactBanner
          event={{
            ...brandCrisisWarning,
            title: "Brand Risk Critical",
            subtitle: "The public narrative is close to crisis. Damage control should happen before another high-risk post.",
            primaryCta: { label: "Damage Control", href: `/startup/${startupId}/social` },
          }}
        />
      )}

      {/* ── Social Metrics Panel ─────────────────────────────────────────── */}
      <div className="game-card p-5 hud-corner">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-black text-white tracking-wider uppercase">
            Social Metrics
          </h2>
          <span className="ml-auto text-[10px] text-white/30 font-bold tracking-wider">
            {metrics.followers.toLocaleString()} FOLLOWERS
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <MetricBar
            label="Hype"
            value={metrics.hype}
            color="violet"
            icon={<Flame className="w-3 h-3" />}
          />
          <MetricBar
            label="Trust"
            value={metrics.trust}
            color="emerald"
            icon={<CheckCircle2 className="w-3 h-3" />}
          />
          <MetricBar
            label="Sentiment"
            value={metrics.sentiment}
            color="cyan"
            icon={<TrendingUp className="w-3 h-3" />}
          />
          <MetricBar
            label="Brand Risk"
            value={metrics.brandRisk}
            color="rose"
            icon={<ShieldAlert className="w-3 h-3" />}
          />
          <MetricBar
            label="Viral Momentum"
            value={metrics.viralMomentum}
            color="amber"
            icon={<Flame className="w-3 h-3" />}
          />
          <MetricBar
            label="Founder Reputation"
            value={metrics.founderReputation}
            color="violet"
            icon={<Users className="w-3 h-3" />}
          />
          <MetricBar
            label="Community Strength"
            value={metrics.communityStrength}
            color="emerald"
            icon={<Users className="w-3 h-3" />}
          />
        </div>

        {/* Balance warnings */}
        {metrics.hype > 70 && metrics.trust < 35 && (
          <div className="mt-4 flex items-center gap-2 border border-amber-500/30 bg-amber-500/5 px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-[11px] text-amber-400">
              High hype with low trust. Brand risk is compounding each sprint.
            </p>
          </div>
        )}
        {metrics.brandRisk > 70 && (
          <div className="mt-4 flex items-center gap-2 border border-rose-500/30 bg-rose-500/5 px-3 py-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <p className="text-[11px] text-rose-400">
              Brand risk critical. A Crisis Response post is available and
              recommended.
            </p>
          </div>
        )}
      </div>

      {/* ── Sprint Actions ───────────────────────────────────────────────── */}
      {!isReadOnly && (
        <div className="game-card p-5 hud-corner">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-black text-white tracking-wider uppercase">
              Sprint Media Action
            </h2>
            <span className="ml-auto text-[10px] text-white/30 font-bold tracking-wider">
              1 PER SPRINT
            </span>
          </div>
          <p className="text-[11px] text-white/40 mb-4">
            Choose one action each sprint. Effects are applied immediately and
            persist into the next simulation.
          </p>

          {alreadyActedThisMonth ? (
            <div className="flex items-center gap-3 border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-400 font-bold">
                Social action taken for {getRunStepLabel(state.lastActionMonth)}. Results
                are in the feed below.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {actions.map((av) => (
                  <ActionCard
                    key={av.action.id}
                    availability={av}
                    onSelect={() => handleSelect(av.action.id)}
                    isSelected={selectedActionId === av.action.id}
                    isPending={isPending}
                  />
                ))}
              </div>

              {selectedActionId && (
                <div className="flex items-center justify-between border border-cyan-500/30 bg-cyan-500/5 px-4 py-3">
                  <div>
                    <p className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                      {actions.find((a) => a.action.id === selectedActionId)
                        ?.action.title ?? ""}
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      Confirm to post. Effects apply immediately.
                    </p>
                  </div>
                  <button
                    onClick={handleConfirm}
                    disabled={isPending}
                    className={cn(
                      "px-5 py-2.5 text-xs font-black tracking-wider uppercase border transition-all",
                      isPending
                        ? "border-white/10 text-white/30 cursor-not-allowed"
                        : "border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 cursor-pointer"
                    )}
                  >
                    {isPending ? "POSTING…" : "CONFIRM POST"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Last Result ──────────────────────────────────────────────────── */}
      {lastResult && (
        <div className="space-y-3">
          {lastSocialPresentation && (
            <EventRevealPanel event={lastSocialPresentation} dismissible />
          )}
          <RewardPopup
            title={lastResult.didBackfire ? "Brand Crisis Triggered" : "Arena Post Live"}
            description={lastResult.didBackfire ? "The market punished the move. Brand risk is now part of the run." : "The feed reacted. Social pressure has been converted into game state."}
            accent={lastResult.didBackfire ? "rose" : "emerald"}
            ctaLabel="Review Feed"
            ctaHref={`/startup/${startupId}/social`}
          />
          <div
            className={cn(
              "p-4 hud-corner border",
              lastResult.didBackfire
                ? "border-rose-500/30 bg-rose-500/5"
                : "border-emerald-500/20 bg-emerald-500/5"
            )}
          >
          <div className="flex items-center gap-2 mb-3">
            {lastResult.didBackfire ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <p
              className={cn(
                "text-xs font-black uppercase tracking-wider",
                lastResult.didBackfire ? "text-rose-400" : "text-emerald-400"
              )}
            >
              {lastResult.didBackfire ? "Post backfired" : "Post live"}
            </p>
          </div>
          <p className="text-[11px] text-white/60 italic mb-3">
            &ldquo;{lastResult.post.content}&rdquo;
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries({
              Hype: lastResult.appliedEffects.hypeDelta,
              Trust: lastResult.appliedEffects.trustDelta,
              "Brand Risk": lastResult.appliedEffects.brandRiskDelta,
              Momentum: lastResult.appliedEffects.viralMomentumDelta,
            })
              .filter(([, v]) => v && v !== 0)
              .map(([label, delta]) => (
                <div key={label} className="text-center">
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">
                    {label}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-black",
                      (delta ?? 0) > 0 ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {(delta ?? 0) > 0 ? "+" : ""}
                    {delta}
                  </p>
                </div>
              ))}
          </div>
        </div>
        </div>
      )}

      {/* ── Arena Feed ───────────────────────────────────────────────────── */}
      <div className="game-card p-5 hud-corner">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-black text-white tracking-wider uppercase">
            Arena Feed
          </h2>
          <span className="ml-auto text-[10px] text-white/30 font-bold">
            {feedSorted.length} ENTRIES
          </span>
        </div>
        {feedSorted.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-cyan-400/50 text-[10px] uppercase tracking-[0.32em] font-black mb-1">
              Arena Feed Dormant
            </p>
            <p className="text-white/45 text-sm">
              No public signal has hit the feed this sprint. Take a social action to create hype, trust, backlash, or a rival response.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {feedSorted.slice(0, 20).map((item) => (
              <FeedItemRow key={item.id} item={item} />
            ))}
            {feedSorted.length > 20 && (
              <p className="text-[10px] text-white/20 text-center pt-2">
                +{feedSorted.length - 20} older entries
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Read-only notice ─────────────────────────────────────────────── */}
      {isReadOnly && (
        <div className="game-card p-4 hud-corner border-white/5">
          <p className="text-xs text-white/30 text-center font-bold uppercase tracking-wider">
            Social actions are locked — startup simulation is complete.
          </p>
        </div>
      )}
    </div>
  );
}
