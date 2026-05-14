"use client";

import { useState } from "react";
import { generateMarketSnapshotAction } from "@/lib/actions/market-data";
import { GameCard } from "@/components/game/GameCard";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

export function GenerateSnapshotForm() {
  const [mode, setMode] = useState<string>("static");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    signalsUsed?: number;
    scenarioKey?: string;
    error?: string;
  } | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setResult(null);
    try {
      const res = await generateMarketSnapshotAction(mode as "static" | "seeded" | "external");
      setResult({
        success: res.success,
        signalsUsed: res.signalsUsed,
        scenarioKey: res.scenarioKey,
      });
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Failed to generate snapshot",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <GameCard glow="violet">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw className="w-5 h-5 text-violet-400" />
        <h3 className="font-bold">Generate Market Snapshot</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Admin only. Generate a new market snapshot from available data sources.
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          disabled={loading}
        >
          <option value="static">Static Adapter (no API keys)</option>
          <option value="seeded">Seeded Scenarios (reset to Phase 6)</option>
          <option value="external">External Providers (if configured)</option>
          <option value="hybrid">Hybrid — external + static fallback</option>
        </select>
        <Button onClick={handleGenerate} disabled={loading} size="sm">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Generate
        </Button>
      </div>

      {result && (
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            result.success
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          )}
        >
          {result.success ? (
            <>
              Snapshot generated successfully. Scenario: {result.scenarioKey}. Signals used: {result.signalsUsed}.
              Refresh the page to see updates.
            </>
          ) : (
            <>{result.error}</>
          )}
        </div>
      )}
    </GameCard>
  );
}

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}
