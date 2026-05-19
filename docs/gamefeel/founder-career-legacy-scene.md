# Founder Career / Legacy Scene

Phase 23I turns the protected Career page into the Founder Legacy Archive: a game-native trophy room and career dossier for the authenticated player.

## Design Goal

The Career page should feel like a founder legacy record, not an account statistics dashboard. It keeps the same persisted career data and formulas, but reframes them as:

- Founder rank console.
- Career record board.
- Badge wall.
- Run archive.
- Playstyle mastery.
- Sector mastery.
- Rival record.
- Next challenge console.

## Legacy Hero

The hero highlights the founder title, rank, identity stamp, reputation signal, level, XP progress, and next-rank requirement.

The identity stamp is presentation-only. It is derived from existing rank, breakout, acquisition, and rival counts. It does not change founder title or rank persistence.

## Career Record Board

The record board displays lifetime career metrics:

- Runs created.
- Runs completed.
- Failed runs.
- Acquisitions.
- Breakouts.
- Best score.
- Best valuation.
- Total revenue.
- Founder weeks played.
- Survival rate.
- Best MRR.
- Full 12-week runs.

These are existing values from the career record. No scoring or reputation calculation changed.

## Badge Wall

Unlocked badges render as trophies. Locked badges render as dim archive slots with requirements.

The badge catalog and unlock rules are unchanged. This phase only changes presentation.

## Run Archive

Recent runs are shown as a founder timeline with:

- Outcome stamp.
- Sector.
- Founder weeks survived.
- Dominant playstyle when available.
- Score.
- Valuation.
- Revenue.
- Rival summary when available.

Each archived run links to its startup page. No public data exposure was added.

## Playstyle Mastery

Playstyle mastery cards summarize existing playstyle career stats:

- Times dominant.
- Times secondary.
- Completed runs.
- Failed runs.
- Best score.
- Best outcome.

This is display-only and does not change playstyle detection or strategy systems.

## Sector Mastery

Sector mastery cards summarize existing sector career stats:

- Completed runs.
- Failed runs.
- Best score.
- Best valuation.
- Best outcome.
- Breakout count.

This is display-only and does not change sector scoring or market simulation.

## Rival Legacy

The rival panel shows:

- Rivals faced.
- Rivals defeated.
- Rival losses.
- Win rate.
- Most dangerous rival when available.
- Last nemesis when available.

No rival mechanics, scoring, or persistence changed.

## Next Challenge Console

The next challenge console uses the existing career recommendation text and links to:

- Deploy a new run.
- Read the Market Map.
- View the Arena Leaderboard.

No new reward or progression mechanic was added.

## Empty State

If the player has no career record yet, the page shows `Legacy Archive Empty` with clear CTAs:

- Deploy Startup.
- Command Deck.
- How To Play.

Death still counts as founder experience, and the copy reflects that.

## Privacy

The Career page remains protected and displays only the authenticated user's career record. The redesigned page does not show user email, private pitch text, raw AI data, provider payloads, admin data, or secrets.

## Logic Not Changed

This phase does not change:

- Founder reputation calculation.
- Rank/title thresholds.
- Badge unlock rules.
- Career persistence.
- Completed-run counting.
- Leaderboard scoring.
- Startup finalization.
- Referral points.
- Gameplay math.
- Auth, ads, DeepSeek, infrastructure, admin, or schema behavior.

## Known Limitations

- Empty state does not yet deep-link to a specific active run because the current career payload does not include active-run context.
- Public founder profile polish remains separate from this protected career archive.
- Browser visual QA was not added in this phase.

## Next Recommended Upgrade

Public Share Polish is the next high-impact scene upgrade because founder/startup share pages are player-facing and still need stronger game identity.
