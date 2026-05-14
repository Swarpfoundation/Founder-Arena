"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getOrCreateTermSheet, submitCounterOfferAction, acceptTermSheetAction, rejectTermSheetAction } from "@/lib/actions/terms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "@/components/game/GameCard";
import { ArrowRight, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TermsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [startupId, setStartupId] = useState<string>("");
  const [termSheet, setTermSheet] = useState<Awaited<ReturnType<typeof getOrCreateTermSheet>> | null>(null);
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 md:px-8 max-w-3xl">
        <p className="text-white/40">Loading term sheet...</p>
      </div>
    );
  }

  if (error && !termSheet) {
    return (
      <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 md:px-8 max-w-3xl">
        <div className="mb-6">
          <Link href={`/startup/${startupId}`} className="text-sm text-white/40 hover:text-white">
            ← Back to Startup
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Term Sheet Unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/startup/${startupId}/review`}>
              <Button>View VC Review</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!termSheet) return null;

  const statusVariant =
    termSheet.status === "accepted"
      ? "success"
      : termSheet.status === "rejected"
      ? "destructive"
      : termSheet.status === "countered"
      ? "warning"
      : "default";

  const isActive = termSheet.status === "proposed" || termSheet.status === "countered";

  return (
    <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 md:px-8 max-w-3xl">
      <div className="mb-6">
        <Link href={`/startup/${startupId}`} className="text-sm text-white/40 hover:text-white">
          ← Back to Startup
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Term Sheet</h1>
        <Badge variant={statusVariant} className="capitalize">
          {termSheet.status}
        </Badge>
      </div>

      {/* Guided CTA */}
      {termSheet.status === "proposed" && (
        <GameCard glow="cyan" className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Next Step</span>
              </div>
              <p className="text-xs text-white/40">
                Review the terms carefully. Check equity dilution, valuation, and board control before deciding.
              </p>
            </div>
            <Link href="/how-to-play" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors shrink-0">
              Learn about term sheets →
            </Link>
          </div>
        </GameCard>
      )}
      {termSheet.status === "accepted" && (
        <GameCard glow="emerald" className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-white/90">Funding closed. Time to operate your company.</p>
            </div>
            <Link href={`/startup/${startupId}/operate`}>
              <Button className="gap-2 shrink-0">
                Operate Company
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </GameCard>
      )}

      {error && (
        <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {counterResult && (
        <div className={`mb-6 rounded-md border p-4 text-sm ${counterResult.outcome === "reject_counter" ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-green-500/50 bg-green-500/10 text-green-700"}`}>
          <p className="font-medium capitalize">{counterResult.outcome.replace("_", " ")}</p>
          <p>{counterResult.message}</p>
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Investment Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-white/40">Investment Amount</span>
              <span className="font-medium">${Number(termSheet.proposedAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-white/40">Equity</span>
              <span className="font-medium">{Number(termSheet.proposedEquity)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-white/40">Pre-Money Valuation</span>
              <span className="font-medium">${Number(termSheet.preMoneyValuation).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-white/40">Post-Money Valuation</span>
              <span className="font-medium">${Number(termSheet.postMoneyValuation).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-white/40">Liquidation Preference</span>
              <span className="font-medium">{Number(termSheet.liquidationPreference)}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-white/40">Board Seat</span>
              <span className="font-medium">{termSheet.boardSeat ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-white/40">Board Observer</span>
              <span className="font-medium">{termSheet.boardObserver ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-white/40">Pro-Rata Rights</span>
              <span className="font-medium">{termSheet.proRataRights ? "Yes" : "No"}</span>
            </div>
            {termSheet.founderSalaryCap && (
              <div className="flex justify-between">
                <span className="text-sm text-white/40">Founder Salary Cap</span>
                <span className="font-medium">${Number(termSheet.founderSalaryCap).toLocaleString()}/year</span>
              </div>
            )}
            {termSheet.expiresAt && (
              <div className="flex justify-between">
                <span className="text-sm text-white/40">Expires</span>
                <span className="font-medium">{new Date(termSheet.expiresAt).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {(termSheet.milestoneRequirements || termSheet.investorNotes) && (
          <Card>
            <CardHeader>
              <CardTitle>Conditions & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {termSheet.milestoneRequirements && (
                <div>
                  <h4 className="text-sm font-medium text-white/40 mb-1">Milestones</h4>
                  <p className="text-sm whitespace-pre-wrap">{termSheet.milestoneRequirements}</p>
                </div>
              )}
              {termSheet.investorNotes && (
                <div>
                  <h4 className="text-sm font-medium text-white/40 mb-1">Investor Notes</h4>
                  <p className="text-sm">{termSheet.investorNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isActive && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button onClick={handleAccept} disabled={actionPending}>
                {actionPending ? "Processing..." : "Accept Terms"}
              </Button>
              <Button variant="outline" onClick={() => setShowCounter(!showCounter)} disabled={actionPending}>
                {showCounter ? "Cancel Counter" : "Counter Offer"}
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={actionPending}>
                Reject
              </Button>
            </div>

            {showCounter && (
              <Card>
                <CardHeader>
                  <CardTitle>Counter Offer</CardTitle>
                  <CardDescription>Propose revised terms to the investor.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={handleCounter} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="requestedInvestmentAmount">Investment Amount ($)</Label>
                        <Input id="requestedInvestmentAmount" name="requestedInvestmentAmount" type="number" min={25000} max={10000000} defaultValue={termSheet.proposedAmount} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="offeredEquityPercent">Equity (%)</Label>
                        <Input id="offeredEquityPercent" name="offeredEquityPercent" type="number" min={0.1} max={49} step={0.1} defaultValue={Number(termSheet.proposedEquity)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="founderSalaryCap">Salary Cap ($/year)</Label>
                        <Input id="founderSalaryCap" name="founderSalaryCap" type="number" min={0} max={500000} defaultValue={termSheet.founderSalaryCap ?? 100000} />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="boardSeatAccepted" defaultChecked={termSheet.boardSeat} />
                        Accept board seat
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="boardObserverAccepted" defaultChecked={termSheet.boardObserver} />
                        Accept board observer
                      </label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" name="notes" rows={3} placeholder="Why are you proposing these terms?" maxLength={1000} />
                    </div>
                    {counterError && <p className="text-sm text-destructive">{counterError}</p>}
                    <Button type="submit" disabled={actionPending}>
                      {actionPending ? "Submitting..." : "Submit Counter"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!isActive && (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-white/40">
                This term sheet has been {termSheet.status}. No further actions are available.
              </p>
              <div className="mt-4 flex gap-2">
                <Link href={`/startup/${startupId}`}>
                  <Button variant="outline">Back to Profile</Button>
                </Link>
                {termSheet.status === "accepted" && (
                  <Link href={`/startup/${startupId}/operate`}>
                    <Button>Operate Company</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
