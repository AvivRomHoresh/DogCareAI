# Phase 7 Step 5: Targeted Regression QA

## Purpose

This document records targeted regression QA for Phase 7 Step 5 before merging the `phase-7-bugfix-round-1` branch back to `main`.

Regression was limited to the approved Phase 7 bugfix scope for:

- P7-BUG-002: DogPicker active dog selection persistence after refresh.
- P7-BUG-003: Assistant duplicate sends on rapid Send clicks.

No fixes were made during this step.

## Environment Metadata

| Field | Value |
|---|---|
| Branch | `phase-7-bugfix-round-1` |
| Revision under test | `phase-7-bugfix-round-1` at `1cad548` plus uncommitted follow-up changes: `src/hooks/useDogs.tsx` persistedDogId precedence fix |
| Environment used | Local branch regression server at `http://127.0.0.1:4173` |
| Vercel Preview | A Vercel Preview deployment existed for commit `1cad548`, but it returned deployment protection `401`, so it was not usable for this regression run. |
| Browser/device | Headless Chrome on Windows through Chrome DevTools Protocol |
| Tester | Codex |
| Date | 2026-05-21 |
| Mock/Gemini mode | Mock Mode / no intentional Gemini usage |
| Test data | Synthetic QA account, two synthetic active dogs, and one synthetic reminder created through the authenticated Supabase anon/RLS client. No passwords, tokens, Supabase keys, Gemini keys, or private credentials are recorded here. |
| Commit note | Final commit hash will be recorded after the bugfix/regression changes are committed. |

## Regression Summary

| Test ID | Related Bug | Area | Status | Result Summary | Evidence / Notes |
|---|---|---|---|---|---|
| QA-017 | P7-BUG-002 | DogPicker | Pass | Active dog selection persisted after refresh. | The selected second dog ID was written before refresh and the same selected dog remained active after same-tab refresh. |
| QA-018 | P7-BUG-002 | DogPicker | Pass | Active dog switching still updates current route context without refresh. | Switching dogs updated Dashboard, Reminders, and Assistant context during the same session. |
| QA-039 | P7-BUG-002 | Assistant | Pass | Assistant context summary still receives active dog context. | Context summary showed the active dog profile fields and loaded reminder context. |
| QA-041 | P7-BUG-003 | Assistant | Pass | Duplicate-send protection worked in manual browser verification. | The user manually verified in a normal browser flow that rapid Send clicks did not create duplicate user messages, assistant responses, or `/api/assistant` requests. Local CDP automation could not perform the submit reliably, so this was verified manually. |
| QA-040 | P7-BUG-003 | Assistant | Pass | Normal mock Assistant response worked in manual browser verification. | The user manually verified in a normal browser flow that the response source was mock, the response used dog/context information, and no direct browser Gemini provider request was observed. Local CDP automation could not perform the submit reliably, so this was verified manually. |
| QA-053 | P7-BUG-003 | Assistant | Pass | Assistant load still does not call `/api/assistant`. | Opening `/assistant` and waiting without submitting created zero `/api/assistant` requests. |

## Detailed Results

### QA-017: DogPicker Active Dog Persistence

- Status: Pass.
- Related bug: P7-BUG-002.
- Environment: local branch regression server.
- Steps executed:
  - Created synthetic QA account and two active synthetic dogs.
  - Selected the second dog in the header DogPicker.
  - Confirmed the selected dog ID was written before refresh.
  - Refreshed the same tab.
- Expected:
  - The selected second dog remains active after refresh.
  - The UI does not fall back to the first dog while the stored selected dog is still valid.
- Actual:
  - After refresh, the selected second dog remained active.
- Result:
  - P7-BUG-002 appears fixed in the local branch regression run.

### QA-018: DogPicker Switching

- Status: Pass.
- Related bug: P7-BUG-002.
- Steps executed:
  - Switched between two active dogs from the header DogPicker.
  - Checked Dashboard, Reminders, and Assistant context after switching.
- Expected:
  - Context updates to the selected dog without refresh.
- Actual:
  - Dashboard, Reminders, and Assistant reflected the selected dog during the same session.

### QA-039: Assistant Active Dog Context Summary

- Status: Pass.
- Related bug: P7-BUG-002.
- Steps executed:
  - Opened Assistant with an active dog.
  - Expanded the context summary.
- Expected:
  - Active dog and reminder context are shown correctly.
- Actual:
  - Context summary showed active dog profile fields and loaded reminder context.

### QA-041: Assistant Duplicate Send Protection

- Status: Pass.
- Related bug: P7-BUG-003.
- Steps executed:
  - Opened Assistant with an active dog.
  - Entered a normal non-emergency question.
  - Rapidly clicked Send multiple times in a normal browser flow.
- Expected:
  - Only one user message, one assistant response, and one `/api/assistant` request are produced.
- Actual:
  - Rapid Send clicks did not create duplicate user messages.
  - Rapid Send clicks did not create duplicate assistant responses.
  - Rapid Send clicks did not create duplicate `/api/assistant` requests.
  - Duplicate submits were ignored or prevented while the request was in flight.
- Result:
  - P7-BUG-003 appears fixed.
  - Note: local CDP automation could not perform the Assistant submit reliably, so QA-041 was verified manually by the user in a normal browser flow.

### QA-040: Normal Mock Mode Response

- Status: Pass.
- Related bug: P7-BUG-003.
- Steps executed:
  - Asked a normal feeding/routine-style Assistant question in Mock Mode in a normal browser flow.
- Expected:
  - Response source is mock.
  - Response mentions dog context.
  - No direct browser Gemini provider request occurs.
- Actual:
  - Normal Assistant mock response worked.
  - Response source was mock.
  - Response used dog/context information.
  - No direct browser Gemini provider request was observed.
- Result:
  - Normal mock send behavior passed.
  - Note: local CDP automation could not perform the Assistant submit reliably, so QA-040 was verified manually by the user in a normal browser flow.

### QA-053: No Automatic AI Call On Assistant Load

- Status: Pass.
- Related bug: P7-BUG-003.
- Steps executed:
  - Opened `/assistant` with network request counting.
  - Did not submit a question.
- Expected:
  - No `/api/assistant` request occurs until explicit user send.
- Actual:
  - Zero `/api/assistant` requests occurred on Assistant load.

## Bug Status After Regression

| Bug ID | Status After Regression | Notes |
|---|---|---|
| P7-BUG-002 | Fixed | QA-017 passed after the active-dog reconciliation precedence fix. |
| P7-BUG-003 | Fixed | QA-040 and QA-041 passed in manual browser verification after local CDP automation could not perform the submit reliably. QA-053 passed. |

## Merge Readiness Recommendation

The branch is ready to merge to `main` after review, commit, and push.

Reason:

- QA-017 passed, so P7-BUG-002 appears fixed.
- QA-040 and QA-041 passed in a normal browser flow, so P7-BUG-003 appears fixed.
- QA-053 passed, confirming Assistant load still does not call `/api/assistant` before explicit user send.

Recommended next action:

- Review, commit, and push the completed bugfix and regression documentation before merging the branch back to `main`.

## Unchanged Constraints Confirmation

- No migrations were changed.
- No RLS policies were changed.
- No schema changes were made.
- No environment or deployment configuration was changed.
- No Gemini architecture changes were made.
- No new features were added.
- No Activity Log was added.
- No Vet Finder was added.
- No persistence additions were made.
- No chat persistence or `ai_usage_logs` persistence was added.
- No secrets, tokens, Supabase keys, Gemini keys, or private credentials were recorded.
