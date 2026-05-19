# Profile Scene / Founder ID

Phase 23K turns the private `/profile` page into a Founder ID / Operator Profile scene.

The page remains authenticated and private. The work is presentation-only: account, subscription, referral, career, settings, admin, and logout behavior are preserved.

## Design Goal

The profile page should feel like a private founder identity card and account cockpit, not a SaaS settings page.

The scene now focuses on:

- Founder ID hero.
- Account credentials.
- Plan / access pass.
- Referral command.
- Founder legacy link.
- Settings / privacy controls.
- Admin-only private beta ops link.
- Explicit logout / exit session control.

## Founder ID Hero

The hero displays:

- Founder display name.
- Founder title/rank.
- Private beta access stamp.
- Plan badge.
- Level.
- Masked email.

The hero is private to the authenticated user. It does not expose tokens, OAuth IDs, provider payloads, secrets, or admin internals.

## Account / Access Panel

The account panel displays safe private account information:

- Display name.
- Email.
- Account creation date.
- Number of linked auth accounts.
- Authenticated/private status.

This information is only shown on the protected `/profile` route.

## Plan / Access Panel

The plan panel displays:

- Current plan.
- Price label.
- Weekly review access.
- Remaining weekly Free reviews or paid unlimited state.
- Submission credits.
- Billing and ad privacy links.

No subscription, billing, entitlement, quota, or payment logic changed.

## Referral / Credits Panel

The referral panel displays:

- Referral code.
- Copy invite link.
- Founder Points.
- Submission credits.
- Signup count.
- No-cash-value disclaimer.

Referral points and credits remain convenience/progression only. They do not improve VC decisions, score, valuation, revenue, survival, or leaderboard placement.

## Founder Legacy Link

The legacy panel displays:

- Founder title/rank.
- Best score.
- Best valuation.
- Completed and dead runs.
- Link to the protected Career Legacy Archive.
- Public founder card link when available.

Career scoring, rank, title, badge, and finalization formulas are unchanged.

## Settings / Privacy / Logout

The settings panel links to:

- Command Deck.
- Referrals.
- Ad Privacy.
- Billing.

Logout remains a server action using the existing Auth.js `signOut({ redirectTo: "/" })` behavior. The label is presented as `Logout / Exit Session`.

## Admin-Only Panel

Admin access appears only when the existing server-side admin check passes. Non-admin users receive no admin panel or admin internals.

## Privacy Boundaries

The profile scene does not show:

- auth/session tokens
- API keys
- DeepSeek keys
- raw provider data
- private pitch text
- raw review payloads
- billing secrets
- referral abuse internals
- ad consent audit internals
- admin data to non-admins

## Logic Not Changed

This phase does not change:

- Auth.js configuration.
- Session/cookie behavior.
- Logout behavior.
- Billing/subscription behavior.
- Referral rewards.
- Weekly submission limits.
- Career formulas.
- Admin access logic.
- Ads/consent behavior.
- DeepSeek behavior.
- Database schema.
- Gameplay math.

## Known Limitations

- Provider names are summarized as linked-auth count, not detailed OAuth provider branding.
- The profile scene does not yet include editable account fields.
- Browser visual QA was not added in this phase.

## Next Recommended Phase

Browser Visual QA Pass is the strongest next step because many game-scene pages have changed and need screenshot review across desktop/mobile.
