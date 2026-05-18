"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCcw, ShieldCheck, ToggleLeft, ToggleRight, XCircle } from "lucide-react";
import {
  resetAdPrivacySettingsAction,
  revokeFutureAdConsentAction,
  updateMockRewardOfferPreferenceAction,
} from "@/lib/actions/ad-privacy-settings";
import type { AdPrivacySettings } from "@/lib/monetization/consent";
import { MOCK_REWARD_OFFERS_DISABLED_STORAGE_KEY } from "@/lib/monetization/consent";

export function AdPrivacySettingsClient({ initialSettings }: { initialSettings: AdPrivacySettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(
      MOCK_REWARD_OFFERS_DISABLED_STORAGE_KEY,
      settings.mockRewardOffersDisabled ? "true" : "false"
    );
  }, [settings.mockRewardOffersDisabled]);

  useEffect(() => {
    const localDisabled = window.localStorage.getItem(MOCK_REWARD_OFFERS_DISABLED_STORAGE_KEY) === "true";
    if (localDisabled && !initialSettings.mockRewardOffersDisabled) {
      setMessage("This browser had mock offers hidden locally. Server settings now control this page.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updatePreference(disabled: boolean) {
    setIsPending(true);
    setMessage(null);
    try {
      const result = await updateMockRewardOfferPreferenceAction(disabled);
      setSettings(result.settings);
      setMessage(disabled ? "Mock reward offers disabled." : "Mock reward offers enabled.");
    } finally {
      setIsPending(false);
    }
  }

  async function revokeFutureAds() {
    setIsPending(true);
    setMessage(null);
    try {
      const result = await revokeFutureAdConsentAction();
      setSettings(result.settings);
      setMessage("Future real-ad consent placeholder revoked. Real providers remain disabled.");
    } finally {
      setIsPending(false);
    }
  }

  async function resetSettings() {
    setIsPending(true);
    setMessage(null);
    try {
      const result = await resetAdPrivacySettingsAction();
      setSettings(result.settings);
      setMessage("Ad privacy settings reset to safe defaults.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="border border-cyan-500/20 bg-cyan-500/[0.06] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300/70">
              Local mock preference
            </p>
          </div>
          <h2 className="text-lg font-black uppercase tracking-wide text-white">Mock Reward Offers</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
            This server-side preference hides optional mock rewarded review accelerators for your account.
            It does not affect Pro/Max ad-free status, reward caps, reward ledgers, or future legal consent.
          </p>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => updatePreference(!settings.mockRewardOffersDisabled)}
          className="inline-flex shrink-0 items-center gap-2 border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-200 hover:bg-cyan-400/20"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : settings.mockRewardOffersDisabled ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
          {settings.mockRewardOffersDisabled ? "Enable" : "Hide"}
        </button>
      </div>
      <div className="mt-4 border border-white/10 bg-white/[0.03] p-3 text-xs text-white/50">
        Current account setting:{" "}
        <span className={settings.mockRewardOffersDisabled ? "font-bold text-amber-300" : "font-bold text-emerald-300"}>
          {settings.mockRewardOffersDisabled ? "Mock reward offers hidden" : "Mock reward offers visible"}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={revokeFutureAds}
          className="inline-flex items-center gap-2 border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-rose-200 hover:bg-rose-400/20"
        >
          <XCircle className="h-4 w-4" />
          Revoke Future Real Ads
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={resetSettings}
          className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/55 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Safe Defaults
        </button>
      </div>
      {message && <p className="mt-3 text-xs text-cyan-200">{message}</p>}
    </div>
  );
}
