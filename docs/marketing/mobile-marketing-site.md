# Mobile Marketing Website Pivot

Founder Arena's public website is now positioned as a marketing and information site for the native mobile game.

## Product Direction

- Founder Arena is planned as an iOS and Android game.
- The public website is not the primary playable web game.
- The website should explain the game, platform plans, beta status, and core fantasy.
- Public CTAs should point to mobile beta/platform information, not web-game startup creation or web login.

## Homepage Behavior

The `/` route now renders a marketing page with:

- mobile-game positioning
- iOS and Android platform sections
- game-loop explanation
- feature summaries
- FAQ
- no visible web-game login/start-run CTA

The homepage no longer reads session state and no longer renders different CTAs for authenticated users.

## What Was Intentionally Left In Code

Existing web app routes, admin routes, auth, DeepSeek review infrastructure, referral systems, and game-scene components were not removed in this pivot. They remain in the repository so internal/private-beta tooling is not broken.

Future cleanup can decide whether to:

- redirect old public game routes to `/`
- replace `/demo`, `/market`, `/leaderboard`, `/s/[slug]`, and `/f/[slug]` with marketing-safe pages
- keep admin/private-beta routes available behind auth
- remove or archive web gameplay code once the native apps are authoritative

## Safety Rules

This pivot did not change:

- gameplay math
- funding/scoring/death formulas
- DeepSeek provider behavior
- auth provider configuration
- referral rewards
- billing behavior
- ad behavior
- database schema

## Known Limitations

- Old web-game routes still exist and can be reached directly if someone knows the URL.
- The website does not yet include a real app-store waitlist or mobile beta signup backend.
- No App Store or Google Play listing links exist yet.
- Public share pages still use game-result presentation from the earlier web direction.
