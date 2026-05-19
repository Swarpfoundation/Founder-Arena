# Pitch Deck Console / Investor Dossier

Phase 23G turns `/startup/[id]/pitch` into an Investor Dossier Console. The goal is to make pitch preparation feel like a tactical fundraising scene instead of a long SaaS form.

## Design Goal

The player should understand that each pitch section affects how the VC chamber reads the startup:

- missing sections are visible before submission
- weak sections are called out without changing validation
- the funding ask and use of funds are treated as a risk profile
- submission remains a serious launch action into the VC Review Chamber

## Dossier Readiness Meter

The readiness meter is display-only. It summarizes:

- required sections complete
- weak sections
- missing sections
- an investor-readiness score

This score does not affect DeepSeek, VC scoring, review guardrails, funding, or term-sheet logic.

## Section Grid / Evidence Board

Pitch sections are shown as dossier cards:

- Problem
- Solution
- Market
- Product
- Business Model
- Go-To-Market
- Competition
- Team
- Financial Plan
- Funding Ask
- Use Of Funds

Each card shows whether the section is empty, weak, adequate, or strong, plus the short “VC cares because…” guidance.

## Active Section Editor

The page uses one active editor at a time. All other pitch fields are preserved as hidden form inputs so the existing save action still receives the complete pitch payload.

Existing validation rules remain authoritative:

- same fields
- same minimum lengths
- same maximum lengths
- same save action
- same review submit action

## Funding Ask Console

The funding panel highlights:

- funding ask
- use-of-funds detail
- whether the ask appears missing, unsupported, high-scrutiny, or clear

This is explanatory only and does not block submission beyond existing validation.

## Submission Gate

The submission panel preserves and displays existing private-beta controls:

- Free weekly submission count
- submission credits
- Pro/Max bypass
- speed-token bypass
- cooldown status
- review status link

Credits are still consumed only by the existing successful submit path.

## Review Status Integration

The scene links back to the VC Review Chamber:

- saved dossier ready for review
- verdict ready when a review exists
- safe job-style states are supported by presentation helpers

The page does not expose provider logs, prompts, or raw DeepSeek output.

## Logic Not Changed

This phase did not change:

- pitch schema
- required pitch fields
- validation limits
- save action behavior
- review submission behavior
- DeepSeek provider, prompt, queue, or rubric
- weekly submission limits
- referral credits
- term-sheet generation
- gameplay math
- database schema

## Known Limitations

- Readiness is based on field length and simple heuristics, not real VC analysis.
- The active editor is single-section rather than a full drag-and-drop deck.
- Active AI review job status is represented by helper support, but the pitch page itself still relies on the review page for live queue details.

## Recommended Next Upgrade

Market / Season Scene should be upgraded next so market context, public market page, and season pressure match the rest of the game-native flow.
