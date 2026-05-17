# Founder Arena Demo Data Setup

Phase 14D adds a deterministic local/demo showcase dataset for presenter reliability. The data is fictional, fixed-ID, and safe to recreate.

## Commands

```bash
npm run demo:seed
npm run demo:reset
npm run demo:reseed
```

- `demo:seed` recreates the fixed showcase records.
- `demo:reset` deletes only the fixed showcase records.
- `demo:reseed` is the presenter-friendly reset + seed path.

The script refuses production environments and never runs during build or deployment. It does not expose a browser mutation route.

## Seeded Scenarios

- `demo-active-month-one` — funded early startup for Week 1 guidance and operate-loop demo.
- `demo-mid-run` — active pressure-state startup with social feed, rival moves, strategy signals, boardroom history, employees, and sprint simulation history.
- `demo-finalized-breakout` — completed BREAKOUT run with public slug `demo-civicgraph-breakout`, leaderboard entries, and career legacy.
- `demo-dead-run` — failed run with public slug `demo-fablepay-dead` for death/failure contrast.

The demo founder profile uses public slug `demo-founder-arena`.

## Route Order

30 seconds:

1. `/demo`
2. `/startup/new`
3. `/startup/demo-active-month-one`
4. `/s/demo-civicgraph-breakout`
5. `/leaderboard`

3 minutes:

1. `/demo`
2. `/startup/new`
3. `/startup/demo-active-month-one/operate`
4. `/startup/demo-mid-run/social`
5. `/startup/demo-mid-run/rivals`
6. `/startup/demo-mid-run/strategy`
7. `/startup/demo-mid-run/boardroom`
8. `/s/demo-civicgraph-breakout`
9. `/f/demo-founder-arena`
10. `/leaderboard`

5 minutes:

Follow the presenter checklist on `/demo`.

## Empty Data Recovery

If `/demo` reports no seed data:

1. Confirm the local database is running.
2. Run `npm run demo:seed`.
3. Refresh `/demo`.
4. If protected startup routes require auth, sign in as the demo/local user or use public-safe routes `/s/demo-civicgraph-breakout`, `/f/demo-founder-arena`, and `/leaderboard`.

## Production Note

Do not run demo seed scripts in production. The script includes an environment guard, but operationally this data is intended for local development, staged demos, or disposable preview databases only.

## Do Not Claim

- Do not claim real social media posting.
- Do not claim live multiplayer.
- Do not claim real investor matching.
- Do not claim AI/LLM-generated documentary if deterministic templates are used.
- Do not claim real infra-cost burn model yet.
- Do not claim mobile apps shipped unless verified.
- Do not claim seeded demo data is real player traction.
