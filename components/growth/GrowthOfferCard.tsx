"use client";

import { useState } from "react";
import { StrategicOffer } from "@/lib/growth/types";
import { GameCard } from "@/components/game/GameCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resolveGrowthOfferAction } from "@/lib/actions/growth";
import {
  Loader2,
  Percent,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { getActorIcon } from "@/lib/assets";
import { MetricCashIcon, MetricValuationIcon } from "@/components/assets";

interface GrowthOfferCardProps {
  offer: StrategicOffer;
  startupId: string;
  onResolved: () => void;
}

const OFFER_TYPE_LABELS: Record<string, string> = {
  strategic_investment: "Strategic Investment",
  acquisition: "Acquisition",
  partnership: "Partnership",
  distribution_deal: "Distribution Deal",
  cloud_credits: "Cloud Credits",
  api_partnership: "API Partnership",
  platform_integration: "Platform Integration",
  acquihire: "Acquihire",
};

export function GrowthOfferCard({ offer, startupId, onResolved }: GrowthOfferCardProps) {
  const [pending, setPending] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [result, setResult] = useState<{ narrative: string; success: boolean } | null>(null);

  async function handleAction(action: "accept" | "reject" | "counter" | "defer") {
    setPending(true);
    try {
      const res = await resolveGrowthOfferAction(startupId, offer.offerId, action);
      setResult({ narrative: res.narrative, success: res.success });
      setResolved(true);
      onResolved();
    } catch (e) {
      setResult({ narrative: e instanceof Error ? e.message : "Failed", success: false });
    } finally {
      setPending(false);
    }
  }

  if (resolved && result) {
    return (
      <GameCard
        glow={result.success ? "emerald" : "rose"}
        className={cn("border", result.success ? "border-emerald-500/20" : "border-rose-500/20")}
      >
        <div className="flex items-start gap-3">
          {result.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className={cn("text-sm", result.success ? "text-emerald-300" : "text-rose-300")}>
              {result.narrative}
            </p>
          </div>
        </div>
      </GameCard>
    );
  }

  const isAcquisition = offer.offerType === "acquisition" || offer.offerType === "acquihire";

  return (
    <GameCard glow="violet" className="border border-violet-500/20">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-violet-400 uppercase tracking-wider font-semibold mb-0.5">
            {OFFER_TYPE_LABELS[offer.offerType] ?? offer.offerType}
          </div>
          <h3 className="font-bold text-foreground">{offer.headline}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            {(() => {
              const ActorIcon = getActorIcon(offer.actorId);
              return <ActorIcon className="w-3 h-3 text-violet-400" size={12} />;
            })()}
            From {offer.actorName} • Fit score: {offer.fitScore}/100
          </p>
        </div>
        {isAcquisition && (
          <div className="px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
            Acquisition
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {offer.amount !== null && (
          <div className="rounded-lg border border-white/5 bg-white/5 p-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Amount</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1">
              <MetricCashIcon className="w-3.5 h-3.5 text-cyan-400" size={14} />
              ${offer.amount.toLocaleString()}
            </div>
          </div>
        )}
        {offer.equityPercent !== null && (
          <div className="rounded-lg border border-white/5 bg-white/5 p-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Equity</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-violet-400" />
              {offer.equityPercent}%
            </div>
          </div>
        )}
        {offer.acquisitionPrice !== null && (
          <div className="rounded-lg border border-white/5 bg-white/5 p-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Acquisition</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1">
              <MetricCashIcon className="w-3.5 h-3.5 text-rose-400" size={14} />
              ${offer.acquisitionPrice.toLocaleString()}
            </div>
          </div>
        )}
        {offer.valuation !== null && (
          <div className="rounded-lg border border-white/5 bg-white/5 p-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Valuation</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1">
              <MetricValuationIcon className="w-3.5 h-3.5 text-emerald-400" size={14} />
              ${offer.valuation.toLocaleString()}
            </div>
          </div>
        )}
        <div className="rounded-lg border border-white/5 bg-white/5 p-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Expires</div>
          <div className="text-sm font-medium text-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            {offer.expiresInMonths} mo
          </div>
        </div>
      </div>

      {offer.terms.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Terms</div>
          <ul className="space-y-1">
            {offer.terms.map((t, i) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        {offer.benefits.length > 0 && (
          <div>
            <div className="text-xs text-emerald-400 uppercase tracking-wider mb-1">Benefits</div>
            <ul className="space-y-1">
              {offer.benefits.slice(0, 3).map((b, i) => (
                <li key={i} className="text-xs text-foreground/70 flex items-start gap-1.5">
                  <MetricValuationIcon className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" size={12} />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}
        {offer.risks.length > 0 && (
          <div>
            <div className="text-xs text-rose-400 uppercase tracking-wider mb-1">Risks</div>
            <ul className="space-y-1">
              {offer.risks.slice(0, 3).map((r, i) => (
                <li key={i} className="text-xs text-foreground/70 flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {offer.conditions.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Conditions</div>
          <ul className="space-y-1">
            {offer.conditions.map((c, i) => (
              <li key={i} className="text-xs text-foreground/70 flex items-start gap-1.5">
                <Shield className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => handleAction("accept")}
          disabled={pending}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
        >
          {pending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
          Accept
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleAction("counter")} disabled={pending}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Counter
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleAction("defer")} disabled={pending}>
          <Clock className="w-3.5 h-3.5 mr-1" />
          Defer
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleAction("reject")} disabled={pending} className="border-rose-500/20 hover:bg-rose-500/10 text-rose-400">
          <XCircle className="w-3.5 h-3.5 mr-1" />
          Reject
        </Button>
      </div>
    </GameCard>
  );
}
