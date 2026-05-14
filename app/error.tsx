"use client";

import Link from "next/link";
import { GameCard } from "@/components/game/GameCard";
import { Gamepad2, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-4">
      <GameCard className="text-center space-y-4 max-w-md">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rose-500/10">
          <Gamepad2 className="w-6 h-6 text-rose-400" />
        </div>
        <h1 className="text-2xl font-bold">Something Went Wrong</h1>
        <p className="text-muted-foreground">
          An unexpected error occurred. Don&apos;t worry — your startup data is safe.
        </p>
        {process.env.NODE_ENV !== "production" && error.message && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
            {error.message}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Back to Arena
          </Link>
        </div>
      </GameCard>
    </main>
  );
}
