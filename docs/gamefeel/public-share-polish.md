# Public Share Polish / Viral Result Pages

Phase 23J turns the public share routes into game-result posters:

- `/s/[slug]` becomes a Startup Result Poster.
- `/f/[slug]` becomes a Founder Legacy Card.

The goal is to make shared Founder Arena links feel like public game achievements while preserving strict privacy boundaries.

## Startup Result Poster

The startup share page now emphasizes:

- Founder Arena public run branding.
- Large Demo Day verdict stamp.
- Startup name and tagline.
- Sector.
- Final score.
- Final valuation.
- Final revenue.
- Founder Weeks survived.
- Team size, base setup, product progress, and funding raised when already public-safe.
- Biggest public-safe crisis, key lesson, or death reason when available.
- Founder profile link when available.
- Leaderboard score when available.
- Start Your Own Run and Arena Leaderboard CTAs.

It does not expose pitch decks, financial plans, private VC review text, raw AI/provider payloads, admin data, referral ledgers, ad ledgers, or account details.

## Founder Legacy Card

The founder share page now emphasizes:

- Founder Arena public legacy branding.
- Founder display name.
- Level.
- Public founder stamp.
- Ventures created.
- Completed and dead runs.
- Best score.
- Best valuation.
- Public badge highlights.
- Public run archive.
- Top leaderboard scores.
- Start Your Own Run and Arena Leaderboard CTAs.

The page remains a public-safe profile view. It does not expose email, auth identity, private startup pitches, unpublished active runs, admin notes, or private gameplay ledgers.

## Public Data Whitelist

`lib/game/public-share.ts` builds a display whitelist from the already-safe public loaders:

- `buildPublicStartupShareData`
- `buildPublicFounderShareData`
- `getOutcomeStampPresentation`
- `getPublicShareMetadata`
- `sanitizePublicShareText`

These helpers intentionally return only the fields needed for the poster/card UI. Tests assert that forbidden private values are not copied into the public presentation object.

## Share Text / Copy Link

The pages include safe share text and an existing clipboard copy action. No real social posting API was added.

The share copy uses public-safe result fields only:

- startup/founder display name
- outcome stamp
- score
- valuation
- Founder Weeks survived
- public CTA language

## Metadata

Both public routes now use safe metadata generated from the public share whitelist:

- page title
- description
- Open Graph title/description
- Twitter summary card metadata

No dynamic image generation, external API calls, or social SDKs were added.

## Excluded Private Data

The public share layer must not expose:

- pitch text
- financial plan
- raw AI review text
- full VC review output
- raw DeepSeek/provider payloads
- admin notes
- beta feedback
- user email
- auth/session identifiers
- referral/reward ledgers
- ad ledgers
- private active/draft startups

## Logic Not Changed

This phase does not change:

- public slug generation
- public route access rules
- startup finalization
- documentary generation
- career formulas
- leaderboard scoring
- referral behavior
- auth
- ads
- DeepSeek
- infrastructure
- admin systems
- database schema

## Known Limitations

- No generated OG image files were added.
- No platform-specific social posting integration was added.
- Founder public cards rely on the current public profile payload and do not yet show a richer playstyle/sector mastery model.
- Browser visual QA was not added in this phase.

## Future Roadmap

- Generated share images for startup outcomes.
- Social platform deep links.
- Richer public founder legacy cards.
- Viral challenge cards such as “Beat this founder’s score.”
- Browser visual QA pass across desktop/mobile share layouts.
