"use client";

import { GameCard } from "@/components/game/GameCard";
import { SectionHeader } from "@/components/game/SectionHeader";
import { cn } from "@/lib/utils";
import {
  Signal,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  Hash,
  BarChart3,
} from "lucide-react";

interface MarketSignal {
  id: string;
  source: string;
  sourceId: string;
  title: string;
  signalType: string;
  direction: string;
  severity: number;
  confidence: number;
  createdAt: Date | string;
  dataRun?: { mode: string; status: string } | null;
}

interface ProviderStatus {
  name: string;
  configured: boolean;
  available: boolean;
  envVar?: string | null;
}

interface DataRun {
  id: string;
  mode: string;
  status: string;
  startedAt: Date | string;
  completedAt?: Date | string | null;
  signalsFetched: number;
  signalsStored: number;
  error?: string | null;
  metadata?: unknown;
}

interface AdminSignalsPanelProps {
  signals: MarketSignal[];
  providers: ProviderStatus[];
  latestRun?: DataRun | null;
}

export function AdminSignalsPanel({ signals, providers, latestRun }: AdminSignalsPanelProps) {
  return (
    <div className="space-y-6 mb-8">
      {/* Provider Status */}
      <GameCard glow="emerald">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold">Provider Status</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {providers.map((p) => (
            <div
              key={p.name}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                p.available
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : p.configured
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    : "border-slate-500/30 bg-slate-500/10 text-slate-400"
              )}
            >
              {p.available ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : p.configured ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="capitalize font-medium">{p.name}</span>
              <span className="text-xs opacity-70 ml-auto">
                {p.available ? "Ready" : p.configured ? "Error" : p.envVar ? `Set ${p.envVar}` : "Not configured"}
              </span>
            </div>
          ))}
        </div>
      </GameCard>

      {/* Latest Run */}
      {latestRun && (
        <GameCard variant="subtle">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Latest Data Run</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="rounded-lg border border-white/5 bg-background/50 px-3 py-2">
              <div className="text-xs text-muted-foreground mb-1">Mode</div>
              <div className="font-medium capitalize">{latestRun.mode}</div>
            </div>
            <div className="rounded-lg border border-white/5 bg-background/50 px-3 py-2">
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <div className={cn(
                "font-medium capitalize",
                latestRun.status === "success" ? "text-emerald-400" :
                latestRun.status === "failed" ? "text-rose-400" :
                latestRun.status === "partial" ? "text-amber-400" :
                "text-slate-400"
              )}>
                {latestRun.status}
              </div>
            </div>
            <div className="rounded-lg border border-white/5 bg-background/50 px-3 py-2">
              <div className="text-xs text-muted-foreground mb-1">Signals</div>
              <div className="font-medium">{latestRun.signalsStored} / {latestRun.signalsFetched}</div>
            </div>
            <div className="rounded-lg border border-white/5 bg-background/50 px-3 py-2">
              <div className="text-xs text-muted-foreground mb-1">Duration</div>
              <div className="font-medium">
                {latestRun.completedAt
                  ? `${Math.max(1, Math.round((new Date(latestRun.completedAt).getTime() - new Date(latestRun.startedAt).getTime()) / 1000))}s`
                  : "Running"}
              </div>
            </div>
          </div>
          {latestRun.error && (
            <div className="mt-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              Error: {latestRun.error}
            </div>
          )}
          {(() => {
            const meta = latestRun.metadata as Record<string, unknown> | null;
            if (!meta || typeof meta !== "object") return null;
            return (
              <>
                {meta.fallbackUsed && (
                  <div className="mt-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                    Fallback used: {String(meta.fallbackMode ?? "static")}
                  </div>
                )}
                {meta.providerErrors && typeof meta.providerErrors === "object" && (
                  <div className="mt-2 text-xs text-slate-400">
                    {Object.entries(meta.providerErrors as Record<string, string>).map(([name, err]) => (
                      <div key={name}>{name}: {err}</div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </GameCard>
      )}

      {/* Latest Signals */}
      {signals.length > 0 && (
        <div>
          <SectionHeader
            title="Latest Market Signals"
            subtitle={`${signals.length} most recent normalized signals`}
            className="mb-4"
          />
          <div className="space-y-2">
            {signals.map((sig) => (
              <div
                key={sig.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl border border-white/5 bg-secondary/20 px-4 py-3"
              >
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      sig.direction === "positive" ? "bg-emerald-400" :
                      sig.direction === "negative" ? "bg-rose-400" :
                      "bg-slate-400"
                    )}
                  />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground w-16">
                    {sig.signalType}
                  </span>
                </div>
                <span className="text-sm flex-1 min-w-0 truncate">{sig.title}</span>
                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    {sig.severity}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {sig.confidence}%
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {sig.source}
                  </span>
                  {sig.dataRun && (
                    <span className="inline-flex items-center gap-1 capitalize">
                      <Signal className="w-3 h-3" />
                      {sig.dataRun.mode}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(sig.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
