import type { RivalStartup, RivalRunComparison, RivalRunEntry } from "./types";

// ─── Generate final player-vs-rivals comparison ───────────────────────────────

export function generateRivalComparison(
  rivals: RivalStartup[],
  playerValuation: number,
  playerRevenue: number,
  playerOutcome: string
): RivalRunComparison {
  const entries: RivalRunEntry[] = rivals.map((r) => {
    const playerWon = playerValuation > r.valuationEstimate;
    const summary = buildRivalSummary(r, playerWon, playerOutcome);
    return {
      id: r.id,
      name: r.name,
      founderName: r.founder.name,
      archetype: r.founder.archetype,
      finalValuation: r.valuationEstimate,
      finalRevenue: r.revenueEstimate,
      finalOutcome: inferRivalOutcome(r),
      relationship: r.relationshipToPlayer,
      rivalryScore: r.rivalryScore,
      summary,
      playerWon,
    };
  });

  const overallSummary = buildOverallSummary(entries, playerOutcome);

  return {
    playerValuation,
    playerRevenue,
    playerOutcome,
    rivals: entries,
    overallSummary,
  };
}

// ─── Infer rival's simulated final outcome ────────────────────────────────────

function inferRivalOutcome(rival: RivalStartup): string {
  if (rival.isDefeated) return "DEFEATED";
  if (rival.fundingStatus === "acquired") return "ACQUIRED";
  if (rival.risk > 80) return "HIGH_RISK_FAILURE";
  if (rival.valuationEstimate > 5000000) return "BREAKOUT";
  if (rival.traction > 65) return "SERIES_A_READY";
  if (rival.revenueEstimate > 30000) return "SEED_STAGE_GROWTH";
  return "EARLY_STAGE";
}

// ─── Build per-rival summary text ────────────────────────────────────────────

function buildRivalSummary(
  rival: RivalStartup,
  playerWon: boolean,
  playerOutcome: string
): string {
  const founderName = rival.founder.name;

  if (rival.isDefeated) {
    return `${rival.name} collapsed under competitive pressure. ${founderName} will be back.`;
  }

  if (playerWon) {
    switch (rival.founder.archetype) {
      case "copycat":
        return `You outpaced ${rival.name}. ${founderName}'s positioning mirror never had your depth of product. They're still chasing your last move.`;
      case "hype_founder":
        return `${founderName} ran out of narrative fuel. ${rival.name}'s hype machine couldn't survive contact with real metrics.`;
      case "enterprise_killer":
        return `Your customer relationships held. ${rival.name}'s enterprise push lost momentum when you locked in key accounts early.`;
      case "technical_genius":
        return `${founderName} built faster, but you built better. ${rival.name}'s product lead didn't translate to market share.`;
      case "predator_vc_backed":
        return `${rival.name} burned capital faster than they built trust. ${founderName}'s investors grew cautious as your metrics improved.`;
      case "community_builder":
        return `${founderName} built a loyal following, but yours had real revenue underneath it. You won the growth race.`;
      case "regulatory_operator":
        return `${rival.name} played it safe. You moved faster and established market position before their compliance advantage mattered.`;
      case "chaos_founder":
        return `${founderName}'s chaotic energy built press but destroyed trust. You executed while they generated controversy.`;
    }
  }

  // Player lost to rival
  switch (rival.founder.archetype) {
    case "copycat":
      return `${rival.name} copied your best moves before you could defend them. ${founderName} is still in market. Expect to see them again.`;
    case "hype_founder":
      return `${founderName} owned the narrative and investor attention this run. ${rival.name} moves fast in the next cycle.`;
    case "enterprise_killer":
      return `${rival.name} locked enterprise accounts you needed. ${founderName}'s sales engine proved too strong this time.`;
    case "technical_genius":
      return `${founderName} out-shipped you. ${rival.name}'s product velocity set the pace — and you couldn't catch it.`;
    case "predator_vc_backed":
      return `${rival.name} had the capital to absorb your best moves and keep going. ${founderName} remains your nemesis.`;
    case "community_builder":
      return `${founderName} built a community that protected them. ${rival.name}'s loyalty moat proved resilient.`;
    case "regulatory_operator":
      return `${rival.name}'s compliance positioning locked key enterprise accounts. ${founderName} played the long game and won.`;
    case "chaos_founder":
      return `${founderName}'s unpredictability kept you reacting instead of building. ${rival.name} disrupted the narrative at critical moments.`;
  }

  return `${rival.name} (${founderName}) remains in the market. Your paths will likely cross again.`;
}

// ─── Build run-level summary ──────────────────────────────────────────────────

function buildOverallSummary(
  entries: RivalRunEntry[],
  playerOutcome: string
): string {
  const defeated = entries.filter((e) => e.playerWon);
  const nemeses = entries.filter((e) => !e.playerWon && e.rivalryScore > 40);
  const highRivalry = entries.reduce((max, e) => Math.max(max, e.rivalryScore), 0);
  const topNemesis = entries.find((e) => e.rivalryScore === highRivalry);

  if (playerOutcome === "BREAKOUT" || playerOutcome === "SERIES_A_READY") {
    if (defeated.length === entries.length) {
      return "You outlasted every rival in this arena. The market validated your execution. Season record: clean sweep.";
    }
    return `Strong outcome despite active competition. ${defeated.length} rival${defeated.length !== 1 ? "s" : ""} fell behind your trajectory.`;
  }

  if (playerOutcome === "dead" || playerOutcome === "ZOMBIE") {
    if (topNemesis) {
      return `${topNemesis.name} held the arena after you exited. ${topNemesis.founderName} remains your nemesis going into the next run.`;
    }
    return "You exited early. The rivals are still standing. The arena doesn't forget.";
  }

  if (nemeses.length > 0 && topNemesis) {
    return `${topNemesis.name} outpaced you this run. ${topNemesis.founderName} is your nemesis — rivalry score ${topNemesis.rivalryScore}. Expect them again.`;
  }

  if (defeated.length > 0) {
    return `You beat ${defeated.map((e) => e.name).join(", ")} on the key metrics. ${
      entries.length - defeated.length > 0 ? "Some rivals are still building in the shadows." : "Arena cleared this season."
    }`;
  }

  return "The rivals are watching. The competitive balance is unresolved. Next run carries this forward.";
}
