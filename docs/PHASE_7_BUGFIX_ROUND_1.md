# Phase 7 Step 4: Bugfix Round 1

## Purpose

This document records the first approved Phase 7 bugfix round after manual QA and triage.

The scope was limited to the two approved Phase 7 bugs from `docs/PHASE_7_BUG_TRIAGE.md`. No new features were added.

## Bugs Fixed

| Bug ID | Area | Severity | Summary | Result |
|---|---|---|---|---|
| P7-BUG-002 | DogPicker | Major | Active dog selection does not persist after refresh. | Fixed in frontend active-dog hydration/persistence logic. |
| P7-BUG-003 | Assistant | Major | Rapid Send clicks create duplicate assistant requests and responses. | Fixed with a synchronous frontend in-flight submit guard. |

## Files Changed

- `src/hooks/useDogs.tsx`
- `src/pages/AssistantPage.tsx`
- `docs/PHASE_7_BUGFIX_ROUND_1.md`

## Summary of Code Changes

### P7-BUG-002: Active Dog Persistence

- Added an explicit stored-dog hydration flag in `DogProvider`.
- Delayed active-dog fallback until both dog rows and the stored active dog ID have loaded.
- Re-read the persisted active dog ID during reconciliation and prefer it over the current in-memory fallback when it matches an available dog.
- Skipped reconciliation during temporary dog-loading errors so transient load failures do not clear or overwrite a valid stored active dog selection.
- Kept the existing safe fallback when the stored dog is missing, archived, deleted, invalid, or unavailable to the current user.

### P7-BUG-003: Duplicate Assistant Sends

- Added a synchronous `useRef` in-flight guard in `AssistantPage`.
- Guarded the submit path before any message append or `/api/assistant` request can start.
- Kept the existing `isSending` UI state so the Send button and starter questions remain disabled while a response is pending.
- Reset the in-flight guard in `finally` so fallback, mock, and emergency flows all recover safely.

## Intentionally Not Changed

- No migrations.
- No RLS changes.
- No new tables.
- No Gemini architecture changes.
- No `/api/assistant` contract changes.
- No chat persistence.
- No `ai_usage_logs` persistence.
- No environment or deployment configuration changes.
- No Mock Mode default changes.
- No Activity Log.
- No Vet Finder.
- No new features.

## Validation Commands

| Command | Result | Notes |
|---|---|---|
| `npm.cmd run lint` | Passed | TypeScript check completed successfully. |
| `npm.cmd run build` | Passed | Initial sandbox run hit Vite/esbuild `spawn EPERM`; reran with approved elevated permissions and the production build completed successfully. |

No test script exists in `package.json`; available scripts are `dev`, `build`, `preview`, and `lint`.

## Targeted Regression Results

Final targeted regression results are recorded in `docs/PHASE_7_REGRESSION_QA.md`. QA-017, QA-018, QA-039, QA-040, QA-041, and QA-053 passed before merge readiness.

## Remaining Known Items

- QA-030 remains blocked because no safe existing `snoozed` row was available and manual database manipulation was out of scope.
- QA-042 remains blocked because Vercel Production was in Mock Mode and env/config was not changed.
- QA-054 remains blocked because real Gemini rate-limit/fallback behavior requires intentionally enabled Gemini usage.
- P7-BUG-001 remains Not Reproducible / traceability only.

## Readiness for Phase 7 Step 5

Step 5 targeted regression has been completed and the branch is ready for review, commit/push, and merge to main.
