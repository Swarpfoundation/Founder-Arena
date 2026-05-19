# VC Review Verdict Chamber

Phase 23B turns the VC review page into a game scene without changing review logic, DeepSeek behavior, scoring thresholds, guardrails, or term-sheet math.

## Design Goal

The review page should feel like the player is entering an investor verdict room, not reading a SaaS report. The player should immediately understand:

- the final verdict,
- whether deterministic guardrails changed the model recommendation,
- which score dimensions carried or sank the pitch,
- what evidence the panel believed,
- what concerns remain,
- whether a term sheet is unlocked, conditional, or denied,
- how to improve the next submission.

## Scene Structure

The page now presents the review as `VC Review Chamber`.

Primary beats:

- `VerdictStamp`: large ACCEPTED / CONDITIONAL / REJECTED stamp with score and confidence.
- `InvestorPanel`: fictional investor seats mapped to Problem, Solution, Market, Team, and Business dimensions.
- `ScoreDossierPanel`: tactical dossier cards for dimension scores, evidence, and concerns.
- `VerdictRationalePanel`: decision-specific explanation blocks.
- `RedFlagsPanel`: red flags and review quality flags.
- `TermSheetVault`: locked/unlocked term sheet presentation based on existing term-sheet state.
- `FounderCoachingPanel`: existing coaching notes presented as post-verdict guidance.
- `BetaFeedbackForm`: still available as `Flag this verdict for beta QA`.

No real investors, firm names, or likenesses are used. The panel roles are deterministic fictional roles:

- Market Partner
- Product Partner
- Operator Partner
- Risk Partner
- Deal Partner

## Status Scene Behavior

Before completion, the review page uses game-native status scenes:

- `NO DOSSIER`: pitch has not entered the chamber.
- `QUEUED`: review job is waiting in the private beta queue.
- `REVIEWING`: partners are actively reviewing the dossier.
- `RETRYING`: provider recovery is in progress after a transient issue.
- `FAILED`: operational failure, explicitly not an investor rejection.
- `CANCELLED`: operations cancelled the job.

These states show provider, mode, attempts, and safe error category only. Raw prompts, provider payloads, logs, secrets, and API keys are never displayed.

## Verdict Treatments

`ACCEPTED` uses emerald/cyan treatment and unlocks the term-sheet vault when terms exist.

`CONDITIONAL` uses amber/violet treatment and emphasizes milestone requirements, missing proof, and what would change the decision.

`REJECTED` uses rose treatment, suppresses the term-sheet vault, shows the no-term-sheet reason, and points the player back to revise the pitch.

If the model recommendation differs from the final decision, `Panel Guardrail Applied` explains that the deterministic rubric adjusted the outcome and lists the existing rule reasons.

## Term Sheet Vault

The vault is display-only and follows existing review and term-sheet state:

- Accepted with terms: `TERM SHEET VAULT OPEN`.
- Accepted without terms: `TERM SHEET UNLOCKED`.
- Conditional with terms: `CONDITIONAL TERMS AVAILABLE`.
- Conditional without terms: `TERM SHEET LOCKED`.
- Rejected: `NO TERM SHEET GENERATED`.

This phase does not alter term-sheet generation or funding math.

## Review QA Feedback

The feedback entry point remains on the review page and is reframed as beta QA:

- label: `Flag this verdict for beta QA`
- feedback never changes review decisions,
- feedback does not rerun DeepSeek,
- feedback does not expose raw prompts or provider payloads.

## Logic Not Changed

Phase 23B is presentation-only. It does not change:

- DeepSeek provider behavior,
- prompt text,
- rubric thresholds,
- deterministic decision guardrails,
- VC review normalization,
- term-sheet generation,
- funding math,
- gameplay scoring,
- auth,
- referrals,
- ads.

## Future Upgrade

Phase 23C can apply the same scene-first treatment to another high-impact page:

- `Operate Turn Resolution Upgrade`: make sprint resolution feel like a turn-based crisis report.
- `Startup Creation Founder Builder`: convert startup creation from a form into character/loadout creation.
