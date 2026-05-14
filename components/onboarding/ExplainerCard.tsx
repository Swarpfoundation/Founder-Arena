"use client";

import { useState } from "react";
import { GameCard } from "@/components/game/GameCard";
import { HelpCircle, X } from "lucide-react";

export interface ExplainerDef {
  term: string;
  short: string;
  detail: string;
}

export const EXPLAINERS: ExplainerDef[] = [
  {
    term: "Runway",
    short: "Months until you run out of cash.",
    detail: "Runway = Cash ÷ Monthly Burn. If your burn exceeds revenue, runway shrinks. Aim for 6+ months. Death occurs at 0 runway.",
  },
  {
    term: "Burn",
    short: "Monthly cash spent on operations and payroll.",
    detail: "Burn includes salaries, office costs, marketing spend, and other operating expenses. Lower burn extends runway but may slow growth.",
  },
  {
    term: "Valuation",
    short: "Estimated worth of your startup.",
    detail: "Valuation is influenced by revenue, growth, investor confidence, and market conditions. Higher valuation means less dilution for the same funding amount.",
  },
  {
    term: "Investor Score",
    short: "How attractive VCs find your startup (0-100).",
    detail: "Driven by traction, team quality, market size, and narrative. If it drops below 10 while cash is tight, investors may pull term sheets.",
  },
  {
    term: "Risk Score",
    short: "Combined operational and market risk (0-100).",
    detail: "High risk comes from compliance gaps, security issues, market downturns, and reckless spending. If risk hits 95, the startup dies.",
  },
  {
    term: "Market Difficulty",
    short: "How hostile the macro environment is.",
    detail: "Derived from interest rates, geopolitical risk, consumer spending, and sector-specific headwinds. Higher difficulty reduces revenue and valuation multipliers.",
  },
  {
    term: "Product Progress",
    short: "How complete your product is (0-100%).",
    detail: "Build product through engineering hires and product-focus decisions. You need 40+ to launch beta and 50+ for enterprise push. Below 20 after month 9 is dangerous.",
  },
  {
    term: "Final Score",
    short: "Your leaderboard score at the end of the run.",
    detail: "Based on valuation, revenue, months survived, capital efficiency, and market difficulty bonus. Outcome multipliers apply: BREAKOUT = 3x, SERIES_A_READY = 2.5x, etc.",
  },
  {
    term: "Equity Dilution",
    short: "How much ownership you give up in a funding round.",
    detail: "If you sell 20% equity for $1M, you keep 80%. Subsequent rounds dilute you further. Negotiate for lower equity and higher valuation to retain control.",
  },
  {
    term: "Term Sheet",
    short: "The formal offer from an investor.",
    detail: "Includes investment amount, equity percentage, valuation, board seats, liquidation preference, and founder salary cap. You can accept, reject, or counter.",
  },
];

export function ExplainerTooltip({ term }: { term: string }) {
  const def = EXPLAINERS.find((e) => e.term.toLowerCase() === term.toLowerCase());
  if (!def) return <span>{term}</span>;

  return (
    <span className="group relative inline-block">
      <span className="border-b border-dotted border-muted-foreground/40 cursor-help">{term}</span>
      <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 z-50">
        <GameCard variant="solid" className="p-3 text-xs">
          <div className="font-semibold text-foreground mb-1">{def.term}</div>
          <p className="text-muted-foreground">{def.detail}</p>
        </GameCard>
      </span>
    </span>
  );
}

export function ExplainerButton({ term }: { term: string }) {
  const [open, setOpen] = useState(false);
  const def = EXPLAINERS.find((e) => e.term.toLowerCase() === term.toLowerCase());
  if (!def) return null;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        <HelpCircle className="w-3 h-3" />
        What is {def.term}?
      </button>
      {open && (
        <GameCard variant="solid" className="absolute left-0 top-full mt-2 w-72 z-50 p-3">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-sm text-foreground">{def.term}</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{def.detail}</p>
        </GameCard>
      )}
    </span>
  );
}

export function ExplainerHint({ term }: { term: string }) {
  const def = EXPLAINERS.find((e) => e.term.toLowerCase() === term.toLowerCase());
  if (!def) return null;

  return (
    <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
      <HelpCircle className="w-3 h-3 shrink-0 mt-0.5" />
      {def.short}
    </p>
  );
}
