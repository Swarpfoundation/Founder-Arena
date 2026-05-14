# Phase 4: Team Management

## Overview

Phase 4 adds a team management layer to the operating simulation. After funding, founders can hire employees, manage office setup, and deal with team dynamics (morale, productivity, resignation risk). Team decisions directly affect monthly burn, revenue, product progress, risk, and investor scores.

## Schema Changes

### Employee Model
- `name`, `role`, `seniority` (junior/mid/senior/lead)
- `salary`, `skill`, `morale`, `productivity`
- `status` (active/fired/resigned), `hiredAt`, `firedAt`
- `effectJson` — simulation impact modifiers (product/revenue/risk/investor)
- `notes` — bio and history

### Startup Model (added)
- `workSetup` — remote/coworking/small_office/premium_office
- `officeMonthlyCost` — derived from workSetup
- `teamMorale`, `teamProductivity` — cached aggregates

Migration: `20260502194000_phase4_team_management`

## Core Modules

### `lib/team/types.ts`
Type definitions for `Candidate`, `OfficeSetup`, `EmployeeStatus`, `TeamEffect`, `EmployeeEffect`.

### `lib/team/candidates.ts`
Deterministic candidate generator seeded from `startupId + month + sector`. Produces 5 candidates per month with varying roles, seniorities, salaries, and impact profiles.

### `lib/team/effects.ts`
Pure functions for team simulation math:
- `calculateTeamMonthlyCost` — payroll + office
- `calculateTeamProductivity` — 0.7–1.5x based on skill, seniority, office, morale
- `calculateTeamMorale` — 0–100, boosted by office, degraded by low runway
- `calculateEmployeeSimulationModifiers` — aggregate deltas from effectJson
- `applyTeamEffectsToSimulation` — final burn/revenue/product/risk/investor deltas
- `canAffordHire` — runway-based affordability check
- `calculateHiringCapacity` — max team size (12 normally, 8 if cash tight)
- `checkResignationRisk` — flags employees at risk of quitting

## Server Actions (`lib/actions/team.ts`)

- `getTeamState(startupId)` — loads startup, employees, candidates, capacity, morale, productivity, resign risk
- `hireEmployeeAction(startupId, candidate)` — validates, creates Employee, updates burn
- `fireEmployeeAction(startupId, employeeId)` — marks fired, recalculates burn
- `changeOfficeSetupAction(startupId, setup)` — updates office, recalculates burn

## Pages

### `/startup/[id]/team`
Team management UI:
- Team summary cards (size, payroll, morale, productivity)
- Current office setup display
- Resignation risk warnings
- Active employee cards with fire buttons
- Candidate pool with hire dialogs (skill, impact preview)
- Office setup selector (remote → premium office)
- Locked state if startup not funded

### `/startup/[id]/operate`
Updated with team summary card linking to team page.

### `/startup/[id]` (profile)
Updated with team metrics sidebar (size, payroll, office) and CTA.

### `/dashboard`
Updated startup cards show team size for operating/completed startups.

## Simulation Integration

`lib/simulation/engine.ts` `simulateMonth` now accepts `employees` and `workSetup`:
- Team burn (payroll + office) added to monthly burn
- Product/revenue/risk/investor deltas applied before market impact
- Low runway (<3 months) increases risk, reduces investor score
- Low morale (<40%) reduces revenue output

## Test Coverage

`tests/unit/team.test.ts` — 29 tests covering:
- Candidate determinism, salary ranges, sector modifiers
- Payroll calculation, empty team handling
- Productivity and morale office boosts
- Effect aggregation (engineers → product, sales → revenue)
- Simulation application (burn, low runway risk, low morale revenue penalty)
- Affordability checks and capacity limits
- Resignation risk detection
- Office setup defaults

## Determinism Rules

- Candidate generation is purely seeded — same startup + month + sector always yields same pool
- All financial math is pure functions — no AI involved in outcomes
- AI is used only for narrative summaries (`aiSummary`)
