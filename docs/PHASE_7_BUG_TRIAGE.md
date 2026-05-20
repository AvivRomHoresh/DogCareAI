# Phase 7 Step 3: Bug Triage

## Purpose

This document triages bugs and blocked tests discovered during Phase 7 manual QA.

This is a documentation and triage step only. No fixes are implemented in this step, and no app code, configuration, database schema, migrations, RLS policies, environment files, Gemini architecture, or deployment settings are changed.

## QA Result Summary

| Metric | Count |
|---|---:|
| Total tests | 56 |
| Passed | 51 |
| Failed | 2 |
| Blocked | 3 |
| Needs Review | 0 |
| Not Run | 0 |

## Bug Triage Table

| Bug ID | Related Test ID | Area | Severity | Status | Summary | Evidence / Reproduction Notes | Triage Decision | Recommended Fix Timing | Notes |
|---|---|---|---|---|---|---|---|---|---|
| P7-BUG-001 | QA-005 | Auth | Critical | Not Reproducible / Traceability only | Headless sign-in with a generated QA account stayed on `/auth`. | Controlled manual browser/incognito retest with the same QA account after logout reached Dashboard successfully. | No fix needed unless it reappears. | No Phase 7 fix. | Keep for traceability only. |
| P7-BUG-002 | QA-017 | DogPicker | Major | New / Confirmed from QA | Active dog selection does not persist after refresh. | Selecting a second active dog updates the current session, but refreshing returns the UI to the first active dog. | Candidate for Phase 7 bugfix. | Phase 7 bugfix round 1. | Fix should avoid schema changes, migrations, RLS changes, new tables, or new features. |
| P7-BUG-003 | QA-041 | Assistant | Major | New / Confirmed from QA | Rapid Send clicks create duplicate assistant requests and responses. | Rapid clicks produced duplicate user messages, duplicate mock responses, and duplicate `/api/assistant` requests instead of a single in-flight request. | Candidate for Phase 7 bugfix. | Phase 7 bugfix round 1. | Prefer frontend duplicate-submit protection if possible. Do not change Gemini architecture. |

## Detailed Triage Notes

### P7-BUG-001: Auth Sign-In Headless Result

- Status: Not Reproducible.
- Severity: Critical in the initial headless observation, but not confirmed after controlled manual retest.
- Area: Auth.
- Decision: No fix needed unless it reappears.
- Reason: Controlled manual browser/incognito retest passed. Sign-up created an active session, logout worked, and later sign-in with the same controlled QA account reached Dashboard successfully.
- Recommended timing: No Phase 7 fix.
- Notes: Keep this item only for traceability. If similar behavior reappears, retest with a controlled QA account before reopening it as a confirmed auth bug.

### P7-BUG-002: Active Dog Selection Persistence

- Status: New / Confirmed from QA.
- Severity: Major.
- Area: DogPicker.
- Summary: Selected active dog does not persist after refresh.
- Impact: The active dog context may reset after refresh, which can affect Dashboard, Reminders, and Assistant user experience.
- Decision: Candidate for Phase 7 bugfix.
- Recommended timing: Phase 7 bugfix round 1.
- Notes: This should be fixed without schema changes, migrations, RLS changes, new tables, or new features.

### P7-BUG-003: Duplicate Assistant Sends

- Status: New / Confirmed from QA.
- Severity: Major.
- Area: Assistant.
- Summary: Rapid Send clicks create duplicate assistant requests and responses.
- Impact: Users can see duplicate messages and duplicate responses. If Gemini is enabled, the issue can also create unnecessary cost risk through duplicate API calls.
- Decision: Candidate for Phase 7 bugfix.
- Recommended timing: Phase 7 bugfix round 1.
- Notes: This should be fixed with frontend duplicate-submit protection only if possible. Do not change Gemini architecture.

## Blocked Tests

| Test ID | Area | Reason Blocked | Risk | Recommended Follow-up | Phase |
|---|---|---|---|---|---|
| QA-030 | Reminders | No safe existing `snoozed` row was available, and manual database manipulation is out of scope for manual QA. | Low beta risk because Snoozed is intentionally hidden from the user-facing State select, while type/schema compatibility remains documented. | Revisit only if safe seeded test data or an approved non-production test fixture becomes available. | Deferred / future QA |
| QA-042 | Assistant Gemini boundary | Vercel Production was in Mock Mode and environment/configuration was not changed during QA. | Medium validation gap for the real Gemini path in Production. Mock Mode and server boundary behavior were otherwise verified where safe. | Test intentionally in a controlled Gemini-enabled environment when quota and configuration changes are explicitly approved. | Future controlled Gemini QA |
| QA-054 | Cost-control | Gemini rate-limit/fallback behavior requires real Gemini usage; Production remained in Mock Mode and env/config was not changed. | Medium validation gap for real-provider rate limit behavior. Documentation and implementation state still identify the limiter as best-effort in-memory. | Verify in a controlled Gemini-enabled environment only when explicit quota/config approval exists. | Future controlled Gemini QA |

## Triage Decision Summary

Fix in Phase 7:

- P7-BUG-002: DogPicker active dog selection does not persist after refresh.
- P7-BUG-003: Rapid Send clicks create duplicate assistant requests and responses.

Do not fix now:

- P7-BUG-001: Auth sign-in headless result is not reproducible after controlled manual browser/incognito retest.

Keep blocked / defer:

- QA-030: Snoozed compatibility.
- QA-042: Real Gemini path.
- QA-054: Gemini rate-limit/fallback behavior.

## Constraints for Future Fixes

Any Phase 7 bugfix work must follow these constraints:

- No new features.
- No Activity Log.
- No Vet Finder.
- No new tables.
- No migrations.
- No RLS changes.
- No chat persistence.
- No `ai_usage_logs` persistence.
- No Gemini architecture changes.
- No secrets exposure.
- No environment or deployment configuration changes unless explicitly approved.
- Keep Mock Mode as the routine default.

## Proposed Next Step

Proceed to Phase 7 Step 4: Bugfix Round 1.

Recommended Step 4 scope:

- Fix only P7-BUG-002.
- Fix only P7-BUG-003.
- Avoid broad refactors and feature expansion.

Recommended targeted regression tests after fixes:

- QA-017.
- QA-018, if the DogPicker persistence fix touches active dog switching or archived dog choices.
- QA-038, if the Assistant duplicate-submit fix touches missing dog / no active dog disabled-send behavior.
- QA-039, if the Assistant duplicate-submit fix touches active dog context or context summary behavior.
- QA-040, if the Assistant duplicate-submit fix touches normal mock send/response behavior.
- QA-041.
- QA-053, if the Assistant duplicate-submit fix touches when `/api/assistant` requests are created.

Do not retest all 56 manual QA cases unless the fixes are broader than expected.
