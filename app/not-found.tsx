import Link from "next/link";
import { GameCard } from "@/components/game/GameCard";
import { Gamepad2 } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-4">
      <GameCard className="text-center space-y-4 max-w-md">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
          <Gamepad2 className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground">
          This startup, route, or result doesn&apos;t exist. Maybe it pivoted?
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Back to Arena
        </Link>
      </GameCard>
    </main>
  );
}
