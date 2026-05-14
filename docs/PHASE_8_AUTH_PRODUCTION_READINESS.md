# Phase 8: Auth & Production Readiness

## Overview

This phase makes Founder Arena production-ready for real users by implementing real authentication, route protection, rate limiting, security hardening, SEO metadata, and deployment documentation.

## Auth Architecture

### Provider: Auth.js v5 (NextAuth.js beta)
- **Adapter**: PrismaAdapter with PostgreSQL
- **Session strategy**: JWT (stateless, scalable)
- **Providers**: Google OAuth, GitHub OAuth
- **Custom pages**: `/login` for sign-in, `/dashboard` for new users

### User Model
```
User
├── id (cuid)
├── email (unique)
├── name (optional)
├── image (optional)
├── accounts[] (OAuth linkage)
├── startups[]
└── founderProfile (1:1)
```

### Session Flow
1. User clicks "Sign In" on `/login`
2. Auth.js redirects to OAuth provider
3. On callback, PrismaAdapter creates/updates User + Account records
4. JWT token is issued with `user.id`
5. Session callback exposes `user.id` to client session
6. Middleware checks `req.auth` for protected routes

## Protected/Public Route Map

### Public Routes (no auth required)
| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/login` | Sign-in page |
| `/market` | Market intelligence dashboard |
| `/leaderboard` | Global leaderboard |
| `/graveyard` | Startup graveyard |
| `/s/[slug]` | Public startup result share |
| `/api/auth/*` | Auth.js API endpoints |
| `/api/market/*` | Public market data |

### Protected Routes (auth required in production)
| Route | Purpose |
|-------|---------|
| `/dashboard` | User dashboard |
| `/profile` | Founder profile |
| `/startup/new` | Create startup |
| `/startup/[id]` | Startup profile |
| `/startup/[id]/pitch` | Pitch builder |
| `/startup/[id]/review` | VC review |
| `/startup/[id]/terms` | Term sheet |
| `/startup/[id]/operate` | Operating center |
| `/startup/[id]/team` | Team management |

### Route Protection Strategy

**Middleware (`middleware.ts`)** is the primary defense:
- Checks `req.auth` from Auth.js
- Allows public paths unconditionally
- In development with `DEMO_MODE_ENABLED=true`, allows all routes
- In production, redirects unauthenticated users to `/login` with `callbackUrl`

**Server actions** have defense-in-depth via `requireCurrentUser()`:
- Every mutation action verifies the user exists
- Every query action verifies startup ownership (`startup.userId === user.id`)
- No silent demo fallback in production

## Environment Variable Guide

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/founder_arena` |
| `AUTH_SECRET` | Random 32+ char secret for JWT | Generate with `openssl rand -base64 32` |
| `AUTH_URL` | App base URL | `https://founder-arena.vercel.app` |

### OAuth Providers (at least one recommended)
| Variable | Description |
|----------|-------------|
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `AUTH_GITHUB_ID` | GitHub OAuth app ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth app secret |

### AI Providers (optional)
| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o |
| `ANTHROPIC_API_KEY` | Anthropic API key (future) |
| `KIMI_API_KEY` | Kimi API key (future) |

### Game Config (optional)
| Variable | Description | Default |
|----------|-------------|---------|
| `AI_PROVIDER` | Which AI provider to use | `openai` |
| `MARKET_DATA_MODE` | Market data source | `deterministic` |

### Development Only
| Variable | Description | Warning |
|----------|-------------|---------|
| `DEMO_MODE_ENABLED` | Allow demo user fallback | **NEVER in production** |

## Security Improvements

### Authentication
- Real OAuth with Google/GitHub
- JWT sessions with secure secret
- No credentials-based auth (reduces attack surface)
- User ID in JWT, verified on every request

### Authorization
- Middleware blocks unauthenticated access to game routes
- Server actions verify ownership on every mutation
- No client-trusted `userId` — always derived from session

### Rate Limiting
- In-memory Map-based limiter (development)
- Per-action-type limits:
  - AI actions: 5/min
  - Simulation: 10/min
  - Startup creation: 10/min
  - Team actions: 20/min
  - Reads: 100/min
- **Production recommendation**: Replace with Redis/Upstash for multi-instance deployments

### Input Validation
- Zod schemas for all forms
- Max length bounds on all text fields (500–5000 chars)
- Numeric bounds on funding asks ($25k–$10M)
- Safe enum values for sectors/regions

### Error Handling
- Structured error classes (`ActionError`, `UnauthorizedError`, etc.)
- `toUserMessage()` sanitizes errors (no stack traces in production)
- Custom `not-found.tsx` and `error.tsx` pages

## Deployment Checklist

### Pre-deployment
- [ ] Generate `AUTH_SECRET` with `openssl rand -base64 32`
- [ ] Set `AUTH_URL` to production domain
- [ ] Configure at least one OAuth provider
- [ ] Set `DEMO_MODE_ENABLED=false` (or unset)
- [ ] Verify `DATABASE_URL` points to production PostgreSQL
- [ ] Run `npm run db:migrate` on production database
- [ ] Run `npm run db:seed` to seed market snapshots
- [ ] Set up Redis/Upstash for rate limiting (recommended)

### Vercel-specific
- [ ] Add all env vars in Vercel dashboard
- [ ] Set `NODE_ENV=production`
- [ ] Configure build command: `npm run build`
- [ ] Add PostgreSQL database (Vercel Postgres, Supabase, or external)

### Render/Railway-specific
- [ ] Set up PostgreSQL service
- [ ] Configure health check on `/`
- [ ] Set `AUTH_URL` to deployed domain

## Known Limitations

1. **Rate limiting is in-memory**: Not suitable for multi-instance production. Replace with Redis adapter.
2. **No email/password auth**: Users must use OAuth. This is intentional for MVP simplicity.
3. **No password reset flow**: Not applicable without email/password auth.
4. **No account deletion**: Users cannot delete their account yet.
5. **Demo mode is all-or-nothing**: When enabled, all dev users share the same demo account.

## Next Phase Recommendations

1. **Email/password auth** (if OAuth adoption is low)
2. **Redis rate limiter** (for production scale)
3. **Email notifications** (pitch review complete, term sheet expiry)
4. **Account settings page** (delete data, export)
5. **Admin dashboard** (moderation, analytics)
6. **Payment/subscription** (premium features, remove ads)

## Files Changed

### New
- `middleware.ts` — Route protection
- `lib/auth-helpers.ts` — Safe user/session helpers
- `lib/errors.ts` — Structured error classes
- `lib/rate-limit.ts` — Rate limiting
- `app/not-found.tsx` — 404 page
- `app/error.tsx` — Error boundary
- `docs/PHASE_8_AUTH_PRODUCTION_READINESS.md` — This document

### Modified
- `lib/auth.ts` — Added JWT/session callbacks, type augmentation
- `lib/user.ts` — Deprecated old helpers, re-export new ones
- `prisma/schema.prisma` — Added Account model
- `.env.example` — Complete env documentation
- `app/layout.tsx` — Auth-aware nav with sign in/out
- `app/(auth)/login/page.tsx` — Real OAuth sign-in page
- `app/s/[slug]/page.tsx` — Dynamic OG metadata
- `lib/actions/startup.ts` — Rate limits + `requireCurrentUser`
- `lib/actions/simulation.ts` — Rate limits + `requireCurrentUser`
- `lib/actions/terms.ts` — Rate limits + `requireCurrentUser`
- `lib/actions/team.ts` — Rate limits + `requireCurrentUser`
- `lib/validations.ts` — Stricter bounds
- `README.md` — Updated setup instructions
