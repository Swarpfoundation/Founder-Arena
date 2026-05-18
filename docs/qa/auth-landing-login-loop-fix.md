# Auth Landing Login Loop Fix QA

This checklist verifies the auth-aware landing and login redirect fix.

## Logged Out

1. Open `/`.
2. Confirm landing shows `LOGIN`.
3. Click `LOGIN`.
4. Complete OAuth.
5. Confirm user lands on `/dashboard`.

## Logged In

1. Open `/`.
2. Confirm landing shows `CONTINUE FOUNDER ARENA` and `OPEN DASHBOARD`, not `LOGIN`.
3. Open `/login`.
4. Confirm it redirects to `/dashboard` or a sanitized internal callback.

## Referral

1. Open `/r/testcode`.
2. Confirm referral cookie is set.
3. Confirm route redirects to `/login?callbackUrl=/dashboard`.
4. Complete OAuth and confirm user lands on `/dashboard`.

## Logout

1. Log out from GameNav or profile.
2. Confirm redirect returns to `/`.
3. Confirm `/` shows logged-out CTA again.

## Admin

1. Non-admin visits `/admin/private-beta`.
2. Confirm access denied.
3. Configured admin visits `/admin/private-beta`.
4. Confirm dashboard loads.

## Public Pages

Confirm these remain public:

- `/demo`
- `/leaderboard`
- `/market`
- `/graveyard`
- `/how-to-play`
- `/s/[slug]`
- `/f/[slug]`
- `/r/[code]`

## Callback Sanitization

Confirm bad callback URLs fall back to `/dashboard`:

- `https://evil.com`
- `//evil.com`
- `/login`
- `/api/auth/signin`
