# A16Z Speedrun Demo Path

## 30-Second Demo Path

Start at `/demo` when presenter data is seeded. Start at `/` when introducing the product from scratch.

Recommended setup:

```bash
npm run demo:seed
```

Recommended narration:

"Founder Arena is a startup roguelike. You deploy a startup into the arena, pitch investors, close funding, survive 12 Founder Weeks of sprint pressure, and every run becomes a story, career record, and arena ranking."

Time-scale note: Founder Arena uses weekly/sprint gameplay pacing while preserving monthly financial accounting for burn, MRR, salaries, and runway.

Phase note: Runs are framed as Launch Signal, Market Proof, Survive or Scale, and Demo Day Runway. Use the sprint phase banner to explain that pressure rises as Demo Day approaches.

Click path:

1. `/demo` — show deterministic showcase links and the 30-second loop.
2. `/startup/new` — show Startup Deployment Bay and template presets.
3. `/startup/demo-active-month-one` — show the Week 1 playable path if seeded locally.
4. `/s/demo-civicgraph-breakout` — show the public-safe completed run if seeded locally.
5. `/leaderboard` — show arena ranking and season context.

## 3-Minute Demo Path

1. Open `/demo` and use the presenter mode panel to confirm seeded data is online.
2. Open `/startup/new` and select a template.
3. Open `/startup/demo-active-month-one` and show Week 1 Briefing.
4. Open `/startup/demo-active-month-one/operate` and explain the first decision loop.
5. Open `/startup/demo-mid-run/social`, `/rivals`, `/strategy`, and `/boardroom` to show connected systems.
6. Open `/s/demo-civicgraph-breakout` for the public-safe final story.
7. Open `/f/demo-founder-arena` for career legacy.
8. Open `/leaderboard` for arena ranking.

## 5-Minute Demo Path

1. `/demo` — presenter checklist, seeded status, and loop framing.
2. `/startup/new` — Deployment Bay and templates.
3. `/startup/demo-active-month-one` — funded Week 1 setup.
4. `/startup/demo-active-month-one/operate` — operating loop and recap framing.
5. `/startup/demo-mid-run/social` — Arena Feed, viral/crisis pressure.
6. `/startup/demo-mid-run/rivals` — rival attack pressure.
7. `/startup/demo-mid-run/strategy` — strategy stack and synergy framing.
8. `/startup/demo-mid-run/boardroom` — board summons and investor pressure.
9. `/s/demo-civicgraph-breakout` — public-safe final result.
10. `/f/demo-founder-arena` — founder career.
11. `/leaderboard` — season ranking.

## First-Run Flow

Player-facing path:

1. Deploy startup in the Deployment Bay.
2. Build pitch in the Pitch Deck Console.
3. Submit to VC Review Chamber.
4. Review terms in Term Sheet Negotiation.
5. Enter Week 1.
6. Choose sprint operating decisions.
7. Read StatDeltaRecap.
8. Inspect Social, Rivals, Strategy, and Boardroom signals.
9. Continue until the run completes or dies.
10. View Story, Career, and Arena.

## Recommended Investor Demo Order

1. Home loop and positioning.
2. Deployment Bay template selection.
3. VC Review Chamber.
4. Term Sheet Negotiation.
5. Week 1 Briefing and operate screen.
6. Critical event presentation: boardroom, rival, or social if available.
7. Final outcome ceremony if seeded data exists.
8. Documentary, Career, Leaderboard.

## Screens To Show

- `/`
- `/demo`
- `/startup/new`
- `/startup/[id]/pitch`
- `/startup/[id]/review`
- `/startup/[id]/terms`
- `/startup/[id]/operate`
- `/startup/[id]/social`
- `/startup/[id]/rivals`
- `/startup/[id]/strategy`
- `/startup/[id]/boardroom`
- `/startup/[id]/documentary`
- `/career`
- `/leaderboard`

## Screens To Avoid Too Early

- Billing and pricing unless asked.
- Market admin/snapshot tools.
- Graveyard before the viewer understands a run.
- Raw profile/settings pages.
- Any empty final-result screen without seeded data.

## Manual Demo Setup

If no seeded completed run exists:

- Run `npm run demo:seed` locally when safe.
- Start with `/demo` and `/startup/new`.
- Create a new startup from a template.
- Submit pitch and show review/terms.
- Fund the startup.
- Show Week 1 Briefing and run one sprint.
- Use `/leaderboard` and `/career` as system previews, but state that rankings populate from completed runs.

Do not fake a completed run in the UI.

## Demo Data Commands

```bash
npm run demo:seed
npm run demo:reset
npm run demo:reseed
```

`demo:seed` and `demo:reseed` recreate only fixed fictional showcase records. `demo:reset` removes only those fixed showcase records and requires the explicit confirmation flag embedded in the script.

## Do Not Claim

- Do not claim real social media posting.
- Do not claim real investor matching.
- Do not claim live multiplayer.
- Do not claim AI/LLM-generated documentary if the current output is deterministic templates plus stored analysis.
- Do not claim a real infrastructure-cost burn model yet.
- Do not claim mobile apps shipped unless verified.
- Do not claim real user counts, revenue, or traction without verified data.
- Do not claim seeded demo data is real player traction.
- Do not claim payments are production-live unless the environment is confirmed.

## Future Economy Note

Real-world infrastructure, deployment, database, storage, bandwidth, egress, LLM API, and GPU cost burn should be researched and implemented later as an economy phase. Candidate providers include Render, Vercel, Replit, AWS, Google Cloud, and LLM/GPU providers. This is not part of the first-run visual/demo polish phase.
