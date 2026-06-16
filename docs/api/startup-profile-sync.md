# Startup Profile Sync API

Backend-26A aligns the backend startup API with the richer native iOS
`StartupProfile`. The backend stores a private structured profile snapshot on
each startup and returns only owner/admin-safe fields.

## Auth

Startup profile sync requires either:

- Browser Auth.js session.
- Mobile bearer token from `/api/mobile-auth/exchange`.

Users can only create, list, and read their own startups. Configured admins may
read safe startup views. Unauthenticated API clients receive JSON `401`.

## Stored Profile Fields

`POST /api/startups` accepts:

- `name`
- `sector`
- `region`
- `oneLinePitch`
- `description` or `summary`
- `problem`
- `solution`
- `targetCustomer`
- `market`
- `businessModel` or `monetizationModel`
- `unfairAdvantage`
- `websiteUrl` or `websiteURL`
- `city`
- `country` or `countryName`
- `countryCode`
- `socialLinks`: array of `{ platform, url }`
- `stage`: `idea`, `prototype`, `mvp`, `launched`, `revenue`, `scaling`
- `realLifeStartup`
- `fundingGoal`
- `fundingAsk`
- `tractionSummary`
- `revenueSummary`
- `teamSummary`
- `roadmapSummary`

The backend also keeps existing startup columns such as `sector`, `region`,
`stage`, `targetMarket`, `problem`, `solution`, `monetizationModel`, and
`fundingAsk` for compatibility with current web/game systems.

## Validation

- `websiteUrl`, `websiteURL`, and social URLs must start with `http://` or
  `https://`.
- `countryCode` must be a two-letter ISO-style code and is normalized to
  uppercase.
- `socialLinks` is capped at 8 entries.
- String fields are length bounded and markup brackets are stripped from core
  startup fields.
- `fundingAsk` remains bounded to `$25,000-$10,000,000`.
- Unknown mobile sectors map to the existing safe `Other` fallback.
- Country/region aliases map into the existing backend region list.

## Create Startup

`POST /api/startups`

```json
{
  "name": "VaultPay",
  "sector": "FinTech",
  "oneLinePitch": "Compliance-aware wallet infrastructure for marketplaces.",
  "description": "Wallet infrastructure for marketplaces that may hold customer funds before payouts.",
  "problem": "Marketplace operators need a clearer custody and payout authorization path.",
  "solution": "VaultPay maps fund custody assumptions, KYC ownership, and payout operations.",
  "targetCustomer": "marketplace operators",
  "market": "B2B marketplaces in regulated payment flows",
  "businessModel": "SaaS plus transaction usage fees",
  "websiteURL": "https://vaultpay.example",
  "city": "London",
  "countryName": "United Kingdom",
  "countryCode": "GB",
  "socialLinks": [{ "platform": "github", "url": "https://github.com/example/vaultpay" }],
  "stage": "prototype",
  "realLifeStartup": true,
  "fundingGoal": "$1.5M seed",
  "fundingAsk": 1500000,
  "tractionSummary": "Three design partners",
  "revenueSummary": "Pre-revenue",
  "teamSummary": "Payments operator and infrastructure engineer",
  "roadmapSummary": "Pilot custody-model review before launch"
}
```

Response:

```json
{
  "startup": {
    "id": "clx_startup_id",
    "name": "VaultPay",
    "sector": "Fintech",
    "region": "Europe",
    "founderStyle": null,
    "currentMonth": 0,
    "status": "draft",
    "fundingStage": "prototype",
    "country": "United Kingdom",
    "countryCode": "GB",
    "city": "London",
    "stage": "prototype",
    "cash": 0,
    "monthlyBurn": 0,
    "valuation": 0,
    "profile": {
      "companyName": "VaultPay",
      "oneLinePitch": "Compliance-aware wallet infrastructure for marketplaces.",
      "description": "Wallet infrastructure for marketplaces that may hold customer funds before payouts.",
      "problem": "Marketplace operators need a clearer custody and payout authorization path.",
      "solution": "VaultPay maps fund custody assumptions, KYC ownership, and payout operations.",
      "targetCustomer": "marketplace operators",
      "market": "B2B marketplaces in regulated payment flows",
      "businessModel": "SaaS plus transaction usage fees",
      "websiteUrl": "https://vaultpay.example",
      "city": "London",
      "country": "United Kingdom",
      "countryCode": "GB",
      "socialLinks": [{ "platform": "github", "url": "https://github.com/example/vaultpay" }],
      "currentStage": "prototype",
      "realLifeStartup": true,
      "fundingGoal": "$1.5M seed",
      "tractionSummary": "Three design partners",
      "revenueSummary": "Pre-revenue",
      "teamSummary": "Payments operator and infrastructure engineer",
      "roadmapSummary": "Pilot custody-model review before launch"
    },
    "createdAt": "2026-06-16T10:00:00.000Z",
    "updatedAt": "2026-06-16T10:00:00.000Z"
  }
}
```

## Read Startup

`GET /api/startups`

Returns up to 100 of the authenticated user's startups with the same safe
startup view shape.

`GET /api/startups/:startupId`

Returns one safe startup view for the owner/admin. Other users receive `404`.

## Review And Mission Context

When a deck generation or VC review job is created with `startupId`, the backend
builds review context from the stored startup profile. Explicit
`startupProfile` or `profile.*` fields in the request can override the stored
snapshot for that job only.

The stored context is private and helps the AI review/missions pipeline see:

- location/country/city
- website/product/social signals
- stage
- problem/solution
- target customer
- market/business model
- traction/revenue/team/roadmap summaries

## Privacy

Startup safe views do not include:

- `ownerId` / `userId`
- deck storage keys
- raw PDF text
- manual pitch text
- prompts
- raw provider output
- API keys/secrets
- private logo storage keys
- private review payloads

Logo upload and authenticated logo serving are deferred. Production should use
object storage for uploaded PDFs/logos; local `private-uploads/` remains private
and should be backed by a persistent disk only for private beta use.

## iOS Sync Expectations

Recommended iOS flow:

1. Authenticate with mobile bearer token.
2. `GET /api/startups`.
3. If no backend startup matches the local run, `POST /api/startups` with the
   local `StartupProfile`.
4. Cache returned backend `startup.id`.
5. Use that `startupId` for deck generation and VC review jobs.
6. Hydrate local profile fields from `startup.profile` when cross-device sync is
   enabled.

`PATCH /api/startups/:startupId` is not implemented in Backend-26A. Profile
updates can be added in a later sync phase with the same validation rules.
