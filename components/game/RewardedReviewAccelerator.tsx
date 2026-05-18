"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Film, TimerReset, X, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import {
  cancelMockRewardedReviewAdAction,
  completeMockRewardedReviewAdAction,
  startMockRewardedReviewAdAction,
  type RewardedReviewAccelerationOffer,
} from "@/lib/actions/rewarded-review-acceleration";
import { MOCK_REWARD_OFFERS_DISABLED_STORAGE_KEY } from "@/lib/monetization/consent";
import { cn } from "@/lib/utils";

function formatWait(seconds: number) {
  if (seconds <= 0) return "ready now";
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

interface RewardedReviewAcceleratorProps {
  startupId: string;
  offer: RewardedReviewAccelerationOffer;
  onRefresh?: () => Promise<void> | void;
}

export function RewardedReviewAccelerator({
  startupId,
  offer,
  onRefresh,
}: RewardedReviewAcceleratorProps) {
  const [isPending, startTransition] = useTransition();
  const [activeLedger, setActiveLedger] = useState<{ reviewId: string; ledgerEntryId: string } | null>(null);
  const [countdown, setCountdown] = useState(offer.mockCountdownSeconds);
  const [modalOpen, setModalOpen] = useState(false);
  const [localMockOffersDisabled, setLocalMockOffersDisabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = offer.eligibility.rewardPreview;
  const beforeWait = preview ? formatWait(preview.beforeWaitSeconds) : formatWait(offer.eligibility.currentWaitSeconds);
  const afterWait = preview ? formatWait(preview.afterWaitSeconds) : null;

  const dailyUsageLabel = useMemo(
    () => `${offer.eligibility.dailyRewardsUsed}/${offer.eligibility.dailyRewardLimit} today`,
    [offer.eligibility.dailyRewardLimit, offer.eligibility.dailyRewardsUsed]
  );
  const reviewUsageLabel = useMemo(
    () => `${offer.eligibility.reviewAcceleratorsUsed}/${offer.eligibility.reviewAcceleratorLimit} for this review`,
    [offer.eligibility.reviewAcceleratorLimit, offer.eligibility.reviewAcceleratorsUsed]
  );

  useEffect(() => {
    setLocalMockOffersDisabled(window.localStorage.getItem(MOCK_REWARD_OFFERS_DISABLED_STORAGE_KEY) === "true");
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    setCountdown(offer.mockCountdownSeconds);
    const timer = window.setInterval(() => {
      setCountdown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [modalOpen, offer.mockCountdownSeconds]);

  async function refresh() {
    await onRefresh?.();
  }

  function handleStart() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await startMockRewardedReviewAdAction(startupId);
        if (!result.ledgerEntryId) throw new Error("Mock reward session could not be created.");
        setActiveLedger({ reviewId: result.reviewId, ledgerEntryId: result.ledgerEntryId });
        setModalOpen(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not start mock reward.");
      }
    });
  }

  function handleComplete() {
    if (!activeLedger) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await completeMockRewardedReviewAdAction(
          activeLedger.reviewId,
          activeLedger.ledgerEntryId,
          startupId
        );
        setModalOpen(false);
        setMessage(
          result.changed
            ? `Queue accelerated. New estimated wait: ${formatWait(Math.max(0, Math.ceil((new Date(result.afterReadyAt).getTime() - Date.now()) / 1000)))}.`
            : "Reward already applied. Queue timing is unchanged."
        );
        setActiveLedger(null);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not complete mock reward.");
      }
    });
  }

  function handleCancel() {
    if (!activeLedger) {
      setModalOpen(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await cancelMockRewardedReviewAdAction(activeLedger.reviewId, activeLedger.ledgerEntryId, startupId);
        setModalOpen(false);
        setActiveLedger(null);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not cancel mock reward.");
      }
    });
  }

  if (offer.mockRewardOffersDisabled || localMockOffersDisabled) {
    return (
      <div className="relative overflow-hidden border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-white/40" />
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
            Mock reward offers hidden
          </p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/50">
          Mock reward offers are disabled in Ad Privacy settings. Your normal review timer continues.
        </p>
        <a href="/settings/ads" className="mt-3 inline-block text-xs font-bold uppercase tracking-wider text-cyan-300 hover:text-cyan-200">
          Open Ad Privacy Settings
        </a>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden border border-cyan-500/20 bg-cyan-500/[0.06] p-4">
      <div className="absolute left-0 top-0 h-full w-1 bg-cyan-400/70" />
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-cyan-300" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300/80">
              Optional Mock Reward
            </p>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Review Queue Accelerator
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/55">
              Watch a rewarded sponsor video to reduce this review wait from{" "}
              <span className="font-bold text-white">{beforeWait}</span>
              {afterWait ? (
                <>
                  {" "}to <span className="font-bold text-cyan-200">{afterWait}</span>.
                </>
              ) : null}{" "}
              Ads are optional. Skipping does not block your review.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
            <span className="border border-white/10 bg-white/[0.03] px-2 py-1">{dailyUsageLabel}</span>
            <span className="border border-white/10 bg-white/[0.03] px-2 py-1">{reviewUsageLabel}</span>
            <span className="border border-white/10 bg-white/[0.03] px-2 py-1">Mock provider only</span>
          </div>
          {!offer.eligibility.eligible && (
            <p className="text-xs text-amber-300/80">{offer.eligibility.reason}</p>
          )}
          {message && (
            <p className="flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </p>
          )}
          {error && <p className="text-xs text-rose-300">{error}</p>}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
          <button
            type="button"
            disabled={!offer.eligibility.eligible || isPending}
            onClick={handleStart}
            className={cn(
              "inline-flex items-center justify-center gap-2 border px-4 py-2 text-xs font-black uppercase tracking-wider transition-all",
              offer.eligibility.eligible
                ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20"
                : "cursor-not-allowed border-white/10 bg-white/[0.03] text-white/25"
            )}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <TimerReset className="h-4 w-4" />}
            Watch Mock Video
          </button>
          <button
            type="button"
            onClick={() => setMessage("Continuing on the normal review timer.")}
            className="inline-flex items-center justify-center gap-2 border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/45 hover:text-white"
          >
            Continue Without Ad
          </button>
        </div>
      </div>

      {modalOpen && activeLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-cyan-500/30 bg-[#0a0f1e] p-5 shadow-[0_0_40px_rgba(34,211,238,0.16)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300/70">
                  Mock rewarded sponsor video
                </p>
                <h3 className="mt-1 text-lg font-black uppercase tracking-wide text-white">
                  Queue Acceleration
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="border border-white/10 p-2 text-white/45 hover:text-white"
                aria-label="Cancel mock sponsor video"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4 border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-cyan-200">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Mock mode, no tracking</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                This is a simulated rewarded ad placeholder. No ad network, real sponsor,
                tracking pixel, or provider verification is running in this phase.
              </p>
            </div>
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between text-xs text-white/45">
                <span>Completion gate</span>
                <span>{countdown > 0 ? `${countdown}s` : "ready"}</span>
              </div>
              <div className="h-2 border border-cyan-500/20 bg-white/[0.04]">
                <div
                  className="h-full bg-cyan-400 transition-all"
                  style={{
                    width: `${Math.round(((offer.mockCountdownSeconds - countdown) / offer.mockCountdownSeconds) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={countdown > 0 || isPending}
                onClick={handleComplete}
                className={cn(
                  "flex-1 border px-4 py-2 text-xs font-black uppercase tracking-wider",
                  countdown <= 0
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
                    : "cursor-not-allowed border-white/10 bg-white/[0.03] text-white/25"
                )}
              >
                Complete Mock Reward
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/45 hover:text-white"
              >
                Cancel
              </button>
            </div>
            {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
