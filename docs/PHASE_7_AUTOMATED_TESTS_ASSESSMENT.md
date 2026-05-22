# Phase 7 Step 6: Basic Automated Tests Assessment

## Purpose

This document assesses whether adding basic automated tests is practical during Phase 7 Step 6.

Phase 7 is QA and stabilization only. This assessment does not add tests, dependencies, application code, migrations, RLS policies, environment changes, Gemini architecture changes, or new features.

## Current Test Infrastructure

### Existing Package Scripts

`package.json` currently defines:

| Script | Command | Current Role |
|---|---|---|
| `dev` | `vite` | Local development server. |
| `build` | `tsc -b && vite build` | TypeScript project build and production Vite build. |
| `preview` | `vite preview` | Local preview of the built app. |
| `lint` | `tsc -b --pretty false` | TypeScript compile check used as lint/static validation. |

There is currently no `test` script.

### Existing Test Framework

No automated test framework is currently installed.

The project does not currently include:

- Vitest.
- Jest.
- React Testing Library.
- Playwright or Cypress test setup.
- jsdom configuration.
- test files.
- test fixtures or factories.

### Current Validation Coverage

The current beta is validated through:

- TypeScript checking via `npm.cmd run lint`.
- Production build validation via `npm.cmd run build`.
- Manual QA documented in `docs/PHASE_7_MANUAL_QA_RESULTS.md`.
- Targeted regression documented in `docs/PHASE_7_REGRESSION_QA.md`.
- Production sanity checks after the Phase 7 bugfix merge.

Build and lint have been passing during Phase 7. They do not replace behavioral tests, but they catch type errors, invalid imports, and production build regressions.

## Practicality Assessment

### Cheap Candidates for Automated Tests

The best candidates are pure helper functions that do not require React rendering, Supabase mocking, browser APIs, or Vercel configuration:

- `src/constants/emergencyKeywords.ts`
  - `containsEmergencyKeyword`.
  - English emergency examples such as choking, vomiting, and hit-by-car wording.
  - Hebrew emergency examples covered by the current keyword list.
- `src/lib/getDetectedIntent.ts`
  - Emergency intent priority.
  - Feeding, vaccination, walking, routine, behavior, and unknown intent detection.
- `src/lib/reminderHelpers.ts`
  - Reminder labels.
  - Effective missed behavior.
  - Open reminder behavior.
  - Schedule sorting.
  - Today/future date helpers, with care because they depend on the current local date/time.
- `src/lib/mockAiResponse.ts`
  - Structured response shape.
  - `response_source = "mock"`.
  - no emergency flag for mock responses.
  - inclusion of active dog context and relevant reminder context.

These tests would be relatively low-risk if a small test runner is approved.

### More Expensive Candidates

Some useful behaviors are harder to test without a broader setup:

- Active dog localStorage persistence in `useDogs`.
  - Requires React hook/component rendering.
  - Requires mocking Supabase auth/session and dog queries.
  - Requires jsdom or browser-like localStorage.
- Assistant duplicate-submit guard.
  - Requires rendering `AssistantPage` or extracting the submit guard into a separately testable helper.
  - Requires mocking Supabase session, `/api/assistant`, active dog context, reminders, and timers.
- Full route protection and auth redirects.
  - Requires React Router test setup and auth-provider mocking.
- Vercel Function behavior in `api/assistant.js`.
  - Requires request/response harnessing, Supabase mocking, fetch mocking, and careful secret handling.
- End-to-end flows.
  - Require Playwright/Cypress or similar, test account management, environment coordination, and more maintenance.

These are valuable but would add setup and fragility that may be too large for the remaining beta QA phase.

### What Should Not Be Automated in This Phase

The following should not be automated during Phase 7 Step 6 unless explicitly approved later:

- Full browser end-to-end test suite.
- Real Gemini calls.
- Rate-limit tests against real provider usage.
- Production credential or secret checks beyond existing manual/security sanity checks.
- Database/RLS integration tests that require admin access or seeded database state.
- Tests that require schema changes, migrations, new tables, or service-role usage.
- Activity Log, Vet Finder, chat persistence, or `ai_usage_logs` persistence tests, because those features are not implemented in the beta.

## Recommended Approach

Recommendation: defer automated tests for this beta and rely on lint, build, manual QA, targeted regression, and production sanity for Phase 7.

Reasoning:

- There is no test runner today.
- Adding even a small runner would require dependency and package changes.
- The highest-risk beta bugs found in manual QA have already been fixed and regression-tested.
- Remaining blocked tests are environment/data-condition limitations rather than obvious unit-test gaps:
  - QA-030 requires a safe `snoozed` row.
  - QA-042 requires intentionally enabled Gemini.
  - QA-054 requires controlled real Gemini usage.
- The cheapest automated tests would cover pure helper logic, but their benefit is modest compared with the setup churn at this late beta phase.
- Phase 7 should avoid turning into a tooling project.

## Suggested Minimal Tests If Later Approved

If the team decides to add a very small test setup later, the least risky path would be:

1. Add a minimal TypeScript-friendly unit test runner, likely Vitest.
2. Add only pure helper tests first.
3. Avoid React component tests and browser e2e tests until after beta signoff.

Initial test candidates:

- Emergency keyword detection:
  - `my dog is choking`.
  - `my dog was hit by a car`.
  - `my dog keeps vomiting`.
  - Hebrew examples used in QA.
  - a safe non-emergency prompt returns false.
- Intent detection:
  - emergency overrides other intents.
  - feeding, vaccination, walking, routine, behavior, and unknown examples.
- Reminder helpers:
  - completed reminders are not open.
  - past scheduled non-completed reminders are effectively missed.
  - unscheduled reminders sort after scheduled reminders.
- Mock AI response:
  - response source is `mock`.
  - response includes selected dog name.
  - response includes disclaimer metadata.

Avoid initial tests that require:

- jsdom.
- React Testing Library.
- Supabase mocking.
- Vercel Function request mocking.
- real network calls.
- real Gemini calls.

## Risks And Tradeoffs

| Tradeoff | Notes |
|---|---|
| Dependency overhead | Any real test runner adds dev dependencies and package-lock changes. |
| Time cost | Even small test setup requires configuration, scripts, CI expectations, and future maintenance. |
| Fragility | Date/time helpers and UI flows can become brittle without careful test design. |
| Limited immediate payoff | Manual QA already covered 56 tests, targeted regression, and production sanity. |
| Course/demo benefit | A small pure-helper test suite would demonstrate engineering maturity, but not enough to justify risky setup churn without approval. |

## Final Recommendation For Phase 7 Step 6

Mark Phase 7 Step 6 automated tests as not practical for the current beta without explicit approval for dependency and package changes.

The project should continue using:

- `npm.cmd run lint`.
- `npm.cmd run build`.
- documented manual QA.
- targeted regression after bug fixes.
- production sanity checks.

Automated tests should be revisited after Phase 7 signoff or early in Phase 8, preferably after pure helper boundaries are kept stable and a minimal test runner is explicitly approved.

## Next Step

Recommended next action:

- Document this Step 6 decision.
- Move to Phase 7 Step 7: Demo Guide + README Polish.

If automated tests are later approved, the implementation plan should be:

1. Add a minimal unit test runner.
2. Add a `test` script.
3. Add only pure helper tests for emergency detection, intent detection, reminder helpers, and mock response shape.
4. Keep browser/component/e2e testing deferred.
5. Run `npm.cmd run lint`, `npm.cmd run build`, and the new test command before any test PR is considered complete.

## Scope Confirmation

- No automated tests were added.
- No dependencies were added.
- No package files were changed.
- No app code changed.
- No migrations, schema changes, RLS changes, or new tables were added.
- No environment files or deployment configuration changed.
- No Gemini architecture changes were made.
- No Activity Log, Vet Finder, chat persistence, or `ai_usage_logs` persistence was added.
- No secrets were added or exposed.
