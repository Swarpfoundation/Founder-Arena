# Founder Arena — Web Demo Script

## 30-Second Pitch

> "Founder Arena is a startup roguelike. You create a startup, pitch it to AI VCs,
> raise funding, build a team, and run 12 Founder Weeks of compounding crises. Social media
> pressure, rival founders, boardroom conflicts, and strategy archetypes all emerge
> from your actual decisions — not predetermined scripts. Every run ends with a
> documentary and a permanent entry in your founder career record. Compete on
> seasonal leaderboards. Replay with different strategies."

---

## 3-Minute Demo Flow

### Step 1 — Open the demo page (30 sec)

Go to: `/demo`

Walk the viewer through:
- The 30-second pitch copy
- The 12-step core loop visual
- The 6 live systems grid
- Point out: "all deterministic, no external APIs for simulation"

### Step 2 — Show a completed run (60 sec)

If you have a completed run, go to: `/startup/[id]`

Show:
- Final Result panel with Run Legacy block (3 checkmarks)
- Strategy block or Documentary link
- Action bar: OPERATE / RIVALS / ARENA / STRATEGY / BOARDROOM / STORY / BOARD

If no completed run available, go to: `/leaderboard`
- Show the season banner
- Show the podium cards
- Point out: outcome badge, sector, score
- Click through to a completed run

### Step 3 — Walk the active loop (60 sec)

If you have an active startup, go to: `/startup/[id]/operate`

Show the sprint simulation:
- Show cash, burn, revenue
- Point to the next action prompt
- Run one sprint if time allows
- After running: show the Arena Feed tab

Then: `/startup/[id]/rivals`
- Show rival cards and rivalry scores
- "These rivals were auto-generated based on the sector and metrics"

### Step 4 — Show end-state richness (30 sec)

Go to `/startup/[id]/documentary` (requires completed run)
- Walk through the narrative arc
- Show boardroom events in the timeline
- Show rival outcomes

Then briefly: `/career`
- Show founder title + rank
- Point to run history if available

---

## 5-Minute Demo Flow

All of the 3-minute flow, plus:

### Additional step: Boardroom battle

Go to: `/startup/[id]/boardroom`
- If an event is open: walk through the response options
- Show projected effects per option
- Explain: "This fires automatically when metrics hit thresholds — runway, revenue, brand risk"

### Additional step: Strategy stack

Go to: `/startup/[id]/strategy`
- Show the founder archetype
- Explain it emerged from decisions, not menu choices

### Additional step: Season challenges

Go to: `/leaderboard`
- Show the Season Challenges sidebar
- Walk through: cockroach survival, boardroom survivor, trust moat
- Point to Arena Feed

---

## Feature Callout Order

Best order for investor demos:

1. **Simulation engine** — deterministic, reproducible, no random drift
2. **Boardroom battles** — most dramatic, immediately graspable
3. **Rival founders** — shows reactive AI behavior
4. **Strategy stack** — shows emergent gameplay (not scripted)
5. **Arena Feed** — shows social pressure loop
6. **Founder Documentary** — shows run permanence and shareability
7. **Career Legacy** — shows multi-run progression
8. **Leaderboard / Seasons** — shows competitive layer

---

## What to Show First

- Start with `/demo` — it front-loads all context.
- Then show a completed run (outcome badge, leaderboard entry).
- Then show one active run in-progress.
- Do not start with startup creation unless the viewer wants the full onboarding experience.

---

## What NOT to Show Too Early

- Billing page — irrelevant for product demo
- Graveyard — fine to mention, but not lead with it
- Profile / Operative page — low signal
- Market Intel — useful context but not a wow moment
- Startup creation flow — leads with form UX, not game UX

---

## How to Explain Deterministic Systems

> "Nothing in the simulation is random. Given the same startup, same decisions, same
> month, you get the same outcome. This means runs are reproducible, debuggable, and
> fair for competitive leaderboards."

Avoid saying "AI decides" for simulation outcomes — it's a rules engine, not LLM.

AI is used for:
- Pitch evaluation (VC reviews)
- Idea analysis (strengths/risks)
- Founder coaching (end-of-run)

AI is NOT used for:
- Sprint simulation results
- Boardroom events or effects
- Rival generation or behavior
- Strategy archetype calculation
- Documentary narrative structure

---

## How to Explain Why This Is Not a Spreadsheet

> "A spreadsheet shows you numbers. Founder Arena makes you feel the consequences.
> When your runway drops to 2 months, the board calls an emergency meeting. When
> your viral post backfires, trust drops and a rival capitalizes on it. When you hire
> fast and burn hard, your strategy archetype shifts to Growth Hacker. The numbers
> are connected to narrative and pressure — not just cells in a table."

---

## Known Limitations for Demo Honesty

- Runs take time: a full 12-week accelerator run requires multiple operate clicks.
- Boardroom events require hitting crisis thresholds — they don't fire on demand.
- Rival generation happens in the background during sprint simulation.
- Documentary only generates after the run is finalized (completed or dead).
- Leaderboard only shows entries from completed runs.
- No mobile-optimized layout (web is desktop-first currently).

---

## Do Not Claim

- Do not claim real social media posting. Arena Feed is fully simulated.
- Do not claim live multiplayer. Competition is asynchronous (leaderboard-based).
- Do not claim real investor matching. VC reviews are AI simulations.
- Do not claim AI-generated documentaries in the LLM film sense — it uses AI coaching + structured narrative templates.
- Do not claim real payments are live unless billing is explicitly confirmed.
- Do not claim real infrastructure, deployment, database, bandwidth, LLM, or GPU burn modeling yet.
- Do not claim iOS app is shipped unless confirmed.
- Do not claim user counts or traction metrics unless you have verified data.
