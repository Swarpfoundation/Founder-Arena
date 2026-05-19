# Startup Creation Founder Builder

Phase 23D turns `/startup/new` from a long startup form into a game-native Founder Builder / Deployment Bay. It is a visual and onboarding phase only.

## Design Goal

Startup creation should feel like configuring a roguelike run:

- choose an archetype,
- choose market conditions,
- write the founder brief,
- seed the investor dossier,
- preview risk and opportunity,
- deploy into the arena.

The underlying startup data shape and server action are unchanged.

## Builder Steps

The step rail uses five visible stages:

1. Archetype
2. Market
3. Founder Brief
4. Pitch Core
5. Deploy

The rail is presentation-only. It does not change validation or submission behavior.

## Archetype Cards

Existing `STARTUP_TEMPLATES` are reskinned as build archetypes. Each archetype card shows:

- build name,
- tactical fantasy,
- sector,
- region,
- funding ask,
- difficulty,
- best-for copy,
- risk tags.

Selecting an archetype still fills the same existing fields:

- name,
- description,
- sector,
- region,
- target customer,
- problem,
- solution,
- monetization model,
- unfair advantage,
- funding ask.

No new backend classification was added.

## Market Selection

Sector and region are now selected through tactical cards rather than dropdown-first UI. The cards populate hidden `sector` and `region` form fields with the same existing enum values.

Each card shows display-only opportunity and risk copy. This copy does not change simulation math, startup classification, or market exposure logic.

## Founder Brief

The Founder Brief section preserves:

- startup name,
- one-line mission/description,
- target customer.

Field names and validation remain the same.

## Pitch Core

The Pitch Core section preserves:

- problem,
- solution,
- business model,
- unfair advantage,
- funding ask.

The same `createStartupSchema` validation still runs client-side before calling `createStartupAction`, and the server action validates again.

## Deployment Preview

The preview panel summarizes:

- selected run seed,
- sector,
- region,
- funding ask,
- readiness,
- first objective,
- Launch Signal phase,
- risk tags.

The preview is display-only and does not persist new data.

## Deployment CTA

The final section is now `Deployment Ceremony`.

The submit button reads `Deploy Into Arena`; it still calls the existing `createStartupAction` and preserves the existing redirect to the created startup.

No artificial delay or new backend workflow was added.

## Validation Behavior

Validation errors remain visible beside their fields and also produce a top-level `Deployment Blocked` panel.

Required fields were not removed:

- name,
- description,
- sector,
- region,
- targetMarket,
- problem,
- solution,
- monetizationModel,
- unfairAdvantage,
- fundingAsk.

## Logic Not Changed

Phase 23D does not change:

- Prisma schema,
- startup creation server action behavior,
- startup validation rules,
- sector/region enums,
- startup classification,
- pitch scoring,
- DeepSeek review flow,
- weekly submission limits,
- referrals,
- billing,
- ads,
- infrastructure,
- leaderboard,
- career,
- admin systems.

## Known Limitations

- This is still a single-page form underneath the scene treatment.
- There is no saved draft state before deploy.
- The deploy ceremony is a styled submit state, not a new transition route.

## Next Recommended Scene Upgrade

Good follow-up candidates:

- Terms Negotiation Scene,
- Team Hiring Scene,
- Market / Season Scene.
