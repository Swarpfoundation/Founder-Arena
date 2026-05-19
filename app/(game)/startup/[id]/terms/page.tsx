"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  acceptTermSheetAction,
  getOrCreateTermSheet,
  rejectTermSheetAction,
  submitCounterOfferAction,
} from "@/lib/actions/terms";
import { PageReveal } from "@/components/game/PageReveal";
import { StartupRunHud } from "@/components/game/StartupRunHud";
import {
  ClauseRiskGrid,
  DealBoard,
  DealStamp,
  FounderControlMeter,
  NegotiationConsole,
  RunwayInjectionPanel,
  TermSheetStatusScene,
} from "@/components/game/TermSheetNegotiation";
import {
  getClauseRiskCards,
  getFounderControlRisk,
  getNegotiationCtas,
  getTermSheetStatusPresentation,
} from "@/lib/game/term-sheet-scene";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type LoadedTermSheet = Awaited<ReturnType<typeof getOrCreateTermSheet>>;

export default function TermsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [startupId, setStartupId] = useState<string>("");
  const [termSheet, setTermSheet] = useState<LoadedTermSheet | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [showCounter, setShowCounter] = useState(false);
  const [counterError, setCounterError] = useState<string>("");
  const [counterResult, setCounterResult] = useState<{ outcome: string; message: string } | null>(null);

  useEffect(() => {
    params.then((p) => {
      setStartupId(p.id);
      loadTermSheet(p.id);
    });
  }, [params]);

  async function loadTermSheet(id: string) {
    try {
      const ts = await getOrCreateTermSheet(id);
      setTermSheet(ts);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to load term sheet");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    setActionPending(true);
    setError("");
    try {
      await acceptTermSheetAction(startupId);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError("Failed to accept term sheet");
      setActionPending(false);
    }
  }

  async function handleReject() {
    setActionPending(true);
    setError("");
    try {
      await rejectTermSheetAction(startupId);
      router.push(`/startup/${startupId}`);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError("Failed to reject term sheet");
      setActionPending(false);
    }
  }

  async function handleCounter(formData: FormData) {
    setCounterError("");
    setCounterResult(null);
    setActionPending(true);

    try {
      const data = {
        requestedInvestmentAmount: Number(formData.get("requestedInvestmentAmount")),
        offeredEquityPercent: Number(formData.get("offeredEquityPercent")),
        founderSalaryCap: Number(formData.get("founderSalaryCap")),
        boardSeatAccepted: formData.get("boardSeatAccepted") === "on",
        boardObserverAccepted: formData.get("boardObserverAccepted") === "on",
        notes: String(formData.get("notes")),
      };

      const result = await submitCounterOfferAction(startupId, data);
      setCounterResult(result);
      setShowCounter(false);
      await loadTermSheet(startupId);
    } catch (e) {
      if (e instanceof Error) setCounterError(e.message);
      else setCounterError("Failed to submit counter offer");
    } finally {
      setActionPending(false);
    }
  }

  const presentation = getTermSheetStatusPresentation({ termSheet, error });
  const ctas = getNegotiationCtas({ startupId, status: presentation.status });

  if (loading) {
    return (
      <PageReveal className="mx-auto max-w-5xl px-4 pb-12 pt-24 md:px-8">
        <section className="border border-cyan-500/20 bg-cyan-500/[0.045] p-6 text-cyan-300 hud-corner">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Negotiation Table</p>
          <h1 className="mt-1 text-2xl font-black uppercase tracking-wider text-white">Loading Term Sheet...</h1>
        </section>
      </PageReveal>
    );
  }

  if (!termSheet) {
    return (
      <PageReveal className="mx-auto max-w-5xl px-4 pb-12 pt-24 md:px-8">
        <section className="relative overflow-hidden border border-rose-500/20 bg-black/35 p-5 hud-corner md:p-6">
          <div className="space-y-5">
            <Link href={startupId ? `/startup/${startupId}` : "/dashboard"} className="inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Startup
            </Link>
            <TermSheetStatusScene presentation={presentation} ctas={ctas} />
          </div>
        </section>
      </PageReveal>
    );
  }

  const controlRisk = getFounderControlRisk({
    equityPercent: termSheet.proposedEquity,
    boardSeat: termSheet.boardSeat,
    liquidationPreference: termSheet.liquidationPreference,
  });
  const clauses = getClauseRiskCards(termSheet);

  return (
    <PageReveal className="mx-auto max-w-7xl px-4 pb-12 pt-24 md:px-8">
      <section className="relative overflow-hidden border border-amber-500/20 bg-black/35 p-5 hud-corner md:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/45 to-transparent" />
        <div className="relative z-10 space-y-6">
          <Link href={`/startup/${startupId}`} className="inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Startup
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-amber-400/50">Term Sheet Negotiation</p>
              <h1 className="text-3xl font-black tracking-tight text-white text-glow-cyan md:text-5xl">Capital vs Control</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/48">
                This is survival capital. It extends runway, but equity, governance, and clause risk shape the rest of the run.
              </p>
            </div>
            <div className="border border-white/10 bg-white/[0.035] px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/35">Deal Status</p>
              <p className="text-sm font-black uppercase tracking-wider text-white">{presentation.label}</p>
            </div>
          </div>

          <StartupRunHud
            startupId={startupId}
            status={termSheet.status === "accepted" ? "funded" : "pitching"}
          />

          <DealStamp
            presentation={presentation}
            amount={termSheet.proposedAmount}
            equity={termSheet.proposedEquity}
          />

          {error && (
            <div className="border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 hud-corner">
              {error}
            </div>
          )}

          {counterResult && (
            <div className={cn(
              "border p-4 text-sm hud-corner",
              counterResult.outcome === "reject_counter"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            )}>
              <p className="font-black uppercase tracking-wider">{counterResult.outcome.replace("_", " ")}</p>
              <p className="mt-1 text-white/65">{counterResult.message}</p>
            </div>
          )}

          <DealBoard termSheet={termSheet} />
          <FounderControlMeter risk={controlRisk} />
          <RunwayInjectionPanel termSheet={termSheet} />
          <ClauseRiskGrid clauses={clauses} />

          <NegotiationConsole
            status={presentation.status}
            ctas={ctas}
            actionPending={actionPending}
            showCounter={showCounter}
            onAccept={handleAccept}
            onReject={handleReject}
            onToggleCounter={() => setShowCounter((value) => !value)}
          />

          {showCounter && (
            <section className="border border-amber-500/20 bg-amber-500/[0.045] p-5 text-amber-300 hud-corner">
              <p className="text-[10px] font-black uppercase tracking-[0.32em] opacity-70">Counter Offer Console</p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-wider text-white">Propose Revised Terms</h2>
              <form action={handleCounter} className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <CounterInput
                    id="requestedInvestmentAmount"
                    label="Investment Amount ($)"
                    defaultValue={termSheet.proposedAmount}
                    min={25000}
                    max={10000000}
                  />
                  <CounterInput
                    id="offeredEquityPercent"
                    label="Equity (%)"
                    defaultValue={Number(termSheet.proposedEquity)}
                    min={0.1}
                    max={49}
                    step={0.1}
                  />
                  <CounterInput
                    id="founderSalaryCap"
                    label="Salary Cap ($/year)"
                    defaultValue={termSheet.founderSalaryCap ?? 100000}
                    min={0}
                    max={500000}
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-white/65">
                    <input type="checkbox" name="boardSeatAccepted" defaultChecked={termSheet.boardSeat} />
                    Accept board seat
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white/65">
                    <input type="checkbox" name="boardObserverAccepted" defaultChecked={termSheet.boardObserver} />
                    Accept board observer
                  </label>
                </div>
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-xs font-black uppercase tracking-wider text-white/55">Notes</label>
                  <textarea id="notes" name="notes" rows={3} placeholder="Why are you proposing these terms?" maxLength={1000} className="min-h-[88px] w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-400/50 focus:outline-none" />
                </div>
                {counterError && <p className="border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{counterError}</p>}
                <button type="submit" disabled={actionPending} className="border border-amber-500/35 bg-amber-500/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-200 hover:bg-amber-500/25 disabled:opacity-50">
                  {actionPending ? "Submitting..." : "Submit Counter"}
                </button>
              </form>
            </section>
          )}
        </div>
      </section>
    </PageReveal>
  );
}

function CounterInput({
  id,
  label,
  defaultValue,
  min,
  max,
  step,
}: {
  id: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-black uppercase tracking-wider text-white/55">{label}</label>
      <input
        id={id}
        name={id}
        type="number"
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue}
        className="h-10 w-full border border-white/10 bg-black/20 px-3 text-sm text-white focus:border-amber-400/50 focus:outline-none"
      />
    </div>
  );
}
