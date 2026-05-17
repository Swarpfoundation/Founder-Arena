# Demo Reliability Checklist

Use this before A16Z Speedrun, investor calls, and public beta reviewer walkthroughs.

## Preflight

1. Start the local database.
2. Run `npm run demo:seed`.
3. Run `npm run typecheck`.
4. Run `npm test`.
5. Run `npm run lint`.
6. Run `npm run build`.
7. Open `/demo` and confirm the status reads `Demo Data Online`.

## Presenter Route

1. `/demo` — presenter mode, deterministic showcase links, do-not-claim framing.
2. `/startup/new` — Deployment Bay.
3. `/startup/demo-active-month-one` — funded early startup.
4. `/startup/demo-active-month-one/operate` — Week 1 loop.
5. `/startup/demo-mid-run/social` — social pressure.
6. `/startup/demo-mid-run/rivals` — rival pressure.
7. `/startup/demo-mid-run/strategy` — strategy stack.
8. `/startup/demo-mid-run/boardroom` — investor pressure.
9. `/s/demo-civicgraph-breakout` — public-safe finalized story.
10. `/f/demo-founder-arena` — public-safe career legacy.
11. `/leaderboard` — arena season ranking.

## Empty State Fallback

If seeded protected startup routes are unavailable:

- Use `/startup/new` for first-run creation.
- Use `/s/demo-civicgraph-breakout` for public-safe final result once seeded.
- Use `/f/demo-founder-arena` for public-safe career legacy once seeded.
- Use `/leaderboard` for public season context.
- Do not mutate or reset data from the browser.

## Public/Privacy Check

- Public startup pages must not expose user email.
- Public founder pages must not expose OAuth provider IDs.
- Public demo links should use `/s/[slug]`, `/f/[slug]`, and `/leaderboard` for share-safe presentation.
- Protected startup routes remain owner/session gated.

## Do Not Claim

- Do not claim real social media posting.
- Do not claim live multiplayer.
- Do not claim real investor matching.
- Do not claim AI/LLM-generated documentary if deterministic templates are used.
- Do not claim real infra-cost burn model yet.
- Do not claim mobile apps shipped unless verified.
- Do not claim seeded demo data is real player traction.

## Future Economy Note

Realistic infrastructure, deployment, database, storage, bandwidth, egress, LLM API, and GPU burn costs belong in a later economy research phase. Do not demo them as implemented until that phase ships.
