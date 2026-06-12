# Founder Arena Mobile Auth Token Exchange

This contract lets native iOS authenticate through the backend without storing
Google/GitHub OAuth client secrets in the app.

The backend remains the only system that knows OAuth provider secrets. iOS uses
`ASWebAuthenticationSession`, receives a short-lived one-time code through the
custom URL scheme, then exchanges that code for a backend-issued bearer token.

## Flow

1. iOS generates a cryptographically random `state`.
2. iOS optionally generates a PKCE verifier/challenge pair.
3. iOS opens:

```text
https://api.founderarena.xyz/api/mobile-auth/start?provider=google&redirect_uri=founderarena://auth-callback&state=<state>&code_challenge=<challenge>&code_challenge_method=S256
```

4. Backend validates the provider, redirect URI, state, and optional PKCE
   challenge, stores a short-lived auth attempt, then redirects into the
   existing Auth.js provider flow.
5. After Google/GitHub login succeeds, Auth.js returns to:

```text
https://api.founderarena.xyz/api/mobile-auth/callback?attempt=<attemptId>&state=<state>
```

6. Backend validates the authenticated browser session and auth attempt, creates
   a short-lived one-time code, then redirects to:

```text
founderarena://auth-callback?code=<one-time-code>&state=<state>
```

7. iOS verifies `state`, then exchanges the code:

```http
POST /api/mobile-auth/exchange
Content-Type: application/json

{
  "code": "<one-time-code>",
  "state": "<state>",
  "code_verifier": "<optional-pkce-verifier>",
  "deviceName": "Gorkhmaz's iPhone",
  "appVersion": "1.0"
}
```

8. Backend returns the bearer token once:

```json
{
  "accessToken": "server-issued-token",
  "tokenType": "Bearer",
  "expiresAt": "2026-07-12T12:00:00.000Z",
  "user": {
    "id": "user_id",
    "email": "founder@example.com",
    "name": "Founder"
  }
}
```

9. iOS stores `accessToken` in Keychain and sends:

```http
Authorization: Bearer <accessToken>
```

## Endpoints

### `GET /api/mobile-auth/start`

Query fields:

- `provider`: `google` or `github`.
- `redirect_uri`: must exactly match `MOBILE_AUTH_ALLOWED_REDIRECT_URIS`.
- `state`: iOS-generated random value, 32-256 characters.
- `code_challenge`: optional S256 PKCE challenge, 43-128 characters.
- `code_challenge_method`: optional, only `S256` is accepted.

Returns:

- `302` into Auth.js provider sign-in.
- `400` for invalid provider, state, redirect URI, or PKCE challenge.
- `403` if `MOBILE_AUTH_ENABLED=false`.

### `GET /api/mobile-auth/callback`

Internal backend callback after Auth.js login. Requires a valid browser session.
It consumes the auth attempt and redirects to the approved app URL scheme with a
one-time code.

### `POST /api/mobile-auth/exchange`

Consumes the one-time code and returns the bearer token once.

Security behavior:

- One-time code expires after `MOBILE_AUTH_CODE_TTL_SECONDS`, default 300.
- Code is single-use.
- Code and state are stored hashed.
- If PKCE was supplied at start, exchange requires a valid verifier.
- Bearer token is stored hashed server-side.

### `GET /api/mobile-auth/me`

Bearer-token-only endpoint for iOS session validation.

Response:

```json
{
  "user": {
    "id": "user_id",
    "email": "founder@example.com",
    "name": "Founder"
  },
  "authType": "mobile"
}
```

### `POST /api/mobile-auth/logout`

Revokes the current bearer token.

## Protected API Usage

The AI deck review routes accept either:

- browser Auth.js session cookies, or
- `Authorization: Bearer <mobile-token>`.

Middleware behavior:

- `/api/mobile-auth/*` is allowed through middleware so route handlers can
  validate auth attempts, codes, and bearer tokens.
- Protected `/api/*` requests with `Authorization: Bearer <token>` are allowed
  through middleware so route handlers can validate the token and enforce owner
  checks.
- Protected API requests without browser session or bearer token return JSON
  `401` instead of being redirected to `/login`.
- Browser pages keep the existing `/login` redirect behavior.

This applies to:

- `GET /api/startups`
- `POST /api/startups`
- `GET /api/startups/:startupId`
- `POST /api/deck-generation-jobs`
- `GET /api/deck-generation-jobs/:jobId`
- `POST /api/vc-review-jobs`
- `GET /api/vc-review-jobs/:jobId`
- `GET /api/vc-review-jobs/:jobId/missions`
- `POST /api/vc-review-jobs/:jobId/run`

Public routes remain public:

- `GET /api/health`
- `GET /api/vc-review-firms`

## Startup API for iOS

The VC review endpoints require a backend `startupId`. Native clients should
create or reuse a backend startup before submitting a deck review.

### `GET /api/startups`

Bearer token or browser session required. Returns only the current user's
startups with safe fields:

```json
{
  "startups": [
    {
      "id": "clx_startup_id",
      "name": "VaultPay",
      "sector": "Fintech",
      "region": "Europe",
      "founderStyle": null,
      "currentMonth": 0,
      "status": "draft",
      "fundingStage": "idea",
      "cash": 0,
      "monthlyBurn": 0,
      "valuation": 0,
      "createdAt": "2026-06-12T10:00:00.000Z",
      "updatedAt": "2026-06-12T10:00:00.000Z"
    }
  ]
}
```

### `POST /api/startups`

Bearer token or browser session required.

```json
{
  "name": "VaultPay",
  "sector": "FinTech",
  "country": "UK",
  "founderStyle": "Technical",
  "targetCustomer": "marketplace operators"
}
```

The route creates a normal backend draft startup and returns the same safe
startup shape. It does not expose difficulty, raw AI analysis, private review
data, or owner identifiers.

## Render Environment Variables

```text
MOBILE_AUTH_ENABLED=true
MOBILE_AUTH_ALLOWED_REDIRECT_URIS=founderarena://auth-callback
MOBILE_AUTH_CODE_TTL_SECONDS=300
MOBILE_AUTH_TOKEN_TTL_DAYS=30
```

Existing required auth variables still apply:

```text
AUTH_SECRET
AUTH_URL=https://api.founderarena.xyz
NEXTAUTH_URL=https://api.founderarena.xyz
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
AUTH_GITHUB_ID
AUTH_GITHUB_SECRET
```

## iOS Security Expectations

- Use `ASWebAuthenticationSession`, not an embedded WebView.
- Never store OAuth provider secrets in iOS.
- Never scrape Auth.js cookies.
- Verify returned `state` before exchanging the code.
- Prefer PKCE.
- Store the bearer token in Keychain.
- Remove the Keychain token after `/api/mobile-auth/logout`.

## Known Limitations

- This phase does not add refresh tokens. iOS should restart login when the
  bearer token expires.
- Token expiry defaults to 30 days.
- OAuth consent and provider setup still happen in Google/GitHub dashboards.
