# Phase 7 Step 2: Manual QA Execution Results

## 1. Title and Purpose

This file records actual manual QA execution results for the approved Phase 7 QA plan in `docs/PHASE_7_QA_PLAN.md`.

This is Phase 7 Step 2 only. The purpose is to execute and document QA results, not to fix bugs. No app code, migrations, RLS policies, environment files, Gemini architecture, persistence, tables, or features should be changed during this step.

## 2. Execution Metadata

| Field | Value |
|---|---|
| QA date | 2026-05-20 |
| Tester | Codex |
| App version / commit | `2a40adf docs: record Phase 7 QA batch 3 results` |
| Environment | Vercel Production |
| Vercel Production URL | `https://dog-care-ai.vercel.app` |
| Local environment, if used | Not used for Batch 1, Batch 2, Batch 3, or Batch 4 |
| Browser/device | Headless Chrome 148 on Windows |
| Mock Mode / Gemini mode | Not exercised in Batch 1, Batch 2, Batch 3, or Batch 4; routing/auth, Dog Profile/DogPicker, Reminders, and Dashboard only |
| Test accounts used | Generic QA accounts created through the Auth UI; no passwords recorded |
| Notes | Batch 1 covered QA-001 through QA-009. Batch 2 covered QA-010 through QA-019. Batch 3 covered QA-020A through QA-030. Batch 4 covered QA-031 through QA-037. Do not record real passwords, secrets, tokens, API keys, or private credentials. |

## 3. Execution Rules

- Use only these statuses: `Not Run`, `Pass`, `Fail`, `Blocked`, `Needs Review`.
- Do not mark a test as `Pass` unless it was actually executed.
- Do not invent results.
- If a test cannot be executed, mark it `Blocked` and explain why.
- If behavior is unclear, mark it `Needs Review`.
- Record expected vs actual behavior for every non-pass result.
- Do not include secrets, private credentials, bearer tokens, Supabase keys, Gemini keys, or API keys.
- Redact sensitive console and network details before adding evidence.
- Bug fixes are not performed in this document or this step.

## 4. Manual QA Results Matrix

Initial status for every row is `Not Run`. Update rows only after actual manual execution.

| Test ID | Area | Scenario | Preconditions | Steps | Expected Result | Environment | Priority | Status | Actual Result | Evidence / Notes | Bug ID, if applicable |
|---|---|---|---|---|---|---|---|---|---|---|---|
| QA-001 | Landing / routing | Unauthenticated root redirect | Logged out | Open `/` directly | User is redirected to `/auth` or shown auth flow; app does not crash | Vercel Production | Critical | Pass | Opening `/` while logged out redirected/rendered the Auth sign-in page without crashing. | Path after load: `/auth`. |  |
| QA-002 | Landing / routing | Direct refresh on Dashboard | Logged in | Open `/`, refresh browser | Dashboard reloads successfully through Vercel SPA routing | Vercel Production | Major | Pass | Authenticated Dashboard refreshed successfully through Vercel routing. | Path after refresh: `/`. |  |
| QA-003 | Landing / routing | Direct refresh on nested routes | Logged in | Open and refresh `/dog-profile`, `/reminders`, `/assistant` | Each route reloads without 404 | Vercel Production | Major | Pass | Nested authenticated routes refreshed without 404 and rendered expected page content. | `/dog-profile` rendered Dog Profile; `/reminders` rendered Reminders; `/assistant` rendered AI Assistant. |  |
| QA-004 | Auth | Sign up with valid test account | Test email available | Open `/auth`, choose sign up, submit valid email/password | Account is created or confirmation message appears | Vercel Production | Critical | Pass | Generic QA account was created and redirected to Dashboard with an active session. | Password not recorded. |  |
| QA-005 | Auth | Sign in with valid account | Test account exists | Open `/auth`, sign in | User reaches Dashboard | Vercel Production | Critical | Pass | Controlled manual retest in a normal browser/incognito flow signed in with the same QA account after logout and reached Dashboard successfully. | Email verification is disabled, so the expected beta behavior is immediate sign-up session and successful later sign-in. Previous Codex headless result was not reproducible and is likely a headless/timing/session/test-account artifact. |  |
| QA-006 | Auth | Invalid login error | Logged out | Submit invalid credentials | Friendly error appears; no crash; password not logged | Vercel Production | Major | Pass | Invalid credentials stayed on Auth and showed a friendly error without crashing. | No password recorded. |  |
| QA-007 | Auth | Logout | Logged in | Click logout | User returns to `/auth`; protected routes require login | Vercel Production | Critical | Pass | Logout returned to Auth and protected route access required login afterward. | Path after logout: `/auth`; protected check path: `/auth`. |  |
| QA-008 | Protected routes | Block protected routes when logged out | Logged out | Open `/dog-profile`, `/reminders`, `/assistant` directly | Redirect to `/auth`; no protected content visible | Vercel Production | Critical | Pass | Logged-out visits to protected routes redirected/rendered Auth without protected content. | `/dog-profile -> /auth`; `/reminders -> /auth`; `/assistant -> /auth`. |  |
| QA-009 | Protected routes | Hide Auth for authenticated users | Logged in | Open `/auth` directly | User is redirected to `/` | Vercel Production | Minor | Pass | Authenticated visit to `/auth` redirected to Dashboard. | Path after load: `/`. |  |
| QA-010 | Dog Profile | Empty dog profile state | Logged in as account with no dogs | Open `/dog-profile` | Friendly empty state appears | Vercel Production | Major | Pass | New synthetic QA account opened `/dog-profile` with zero dogs and saw the create-dog empty state. | Empty state text included "Create your dog profile to get started" and the new dog form was available. |  |
| QA-011 | Dog Profile | Create minimal dog | Logged in, no active dog required | Create dog with valid name only | Dog saves and becomes available/active | Vercel Production | Critical | Pass | Created `QA Minimal Dog` with name only; profile saved and appeared in the active dog/profile selectors. | Synthetic dog data only. |  |
| QA-012 | Dog Profile | Create complete dog profile | Logged in | Fill optional profile fields and save | Profile saves; values persist after refresh | Vercel Production | Major | Pass | Created `QA Complete Dog` with breed, age, weight, gender, activity level, and notes; values were visible after returning to the profile. | Later edit verification also confirmed stored profile fields persisted after a fresh page load. |  |
| QA-013 | Dog Profile | Validation: blank or short name | Logged in | Try blank or 1-character dog name | Inline validation prevents save | Vercel Production | Major | Pass | Blank name and one-character name were blocked; no new dog was created. | Inline messages included "Please enter your dog's name" and "Dog name must be at least 2 characters." |  |
| QA-014 | Dog Profile | Validation: invalid age/weight | Logged in | Enter invalid age or weight | Inline validation prevents save | Vercel Production | Major | Pass | Negative age and weight values were blocked by validation; active dog count stayed unchanged. | Browser validation prevented save for values below zero. |  |
| QA-015 | Dog Profile | Edit dog profile | Dog exists | Change profile fields and save | Updated values persist after refresh | Vercel Production | Major | Pass | Edited `QA Complete Dog` breed, age, and health notes; updated values were still present after a fresh page load. | Verified edited breed `Edited QA Breed`, age `5`, and edited synthetic health notes. |  |
| QA-016 | Dog Profile | Archive dog | Dog exists | Archive active dog | Dog is hidden from active list; no hard delete UI appears | Vercel Production | Major | Pass | Archived `QA Complete Dog`; the profile was hidden from the active dog/profile selectors and the remaining dog stayed available. | Confirmed archive flow hides without hard-delete UI; no database rows were manually altered. |  |
| QA-017 | DogPicker | Active dog persistence | At least 2 dogs exist | Select dog, refresh | Same active dog remains selected when available | Vercel Production | Major | Fail | Selecting `QA Complete Dog` from the header DogPicker updated the current screen and wrote the selected dog ID to localStorage, but refreshing returned the UI to `QA Minimal Dog`. | Same-tab refresh did not preserve the selected second dog while both dogs were available. Batch 2 DogPicker persistence was checked while both synthetic dogs were still active; archive visibility was checked afterward. | P7-BUG-002 |
| QA-018 | DogPicker | Switch dogs | At least 2 dogs exist | Switch active dog from header | Dashboard/Reminders/Assistant context updates | Vercel Production | Major | Pass | Switching from `QA Minimal Dog` to `QA Complete Dog` in the header updated the current session; Dashboard and Assistant showed `QA Complete Dog` context. | Dashboard showed `Active dog: QA Complete Dog`; Assistant showed `Active dog: QA Complete Dog`. Persistence after refresh is tracked separately in QA-017. |  |
| QA-019 | DogPicker | Archived dog removed from active choices | Dog archived | Open DogPicker | Archived dog is not selectable | Vercel Production | Major | Pass | After archiving `QA Complete Dog`, only `QA Minimal Dog` remained available in the active/profile selection UI. | Archived profile was not selectable; app did not crash. |  |
| QA-020A | Reminders | Missing dog / no active dog state | Logged in with no dogs | Open `/reminders` | Friendly missing-dog or create-dog state appears; reminder actions are unavailable until a dog exists; app does not crash | Vercel Production | Major | Pass | Fresh synthetic QA account with no dog opened `/reminders` and saw the missing-dog reminder state. | Page showed "Create a dog profile before adding reminders"; no reminder form fields were available until a dog existed. |  |
| QA-020 | Reminders | Empty reminders state | Active dog exists, no reminders | Open `/reminders` | Friendly empty state appears | Vercel Production | Major | Pass | After creating `QA Batch3 Dog`, `/reminders` loaded with zero reminders and the empty Open state. | Page showed the reminder form and "No open reminders." |  |
| QA-021 | Reminders | Create reminder | Active dog exists | Create valid reminder | Reminder saves for active dog and appears in list | Vercel Production | Critical | Pass | Created `QA Open Reminder`; it saved for the active dog and appeared in the reminders list. | Synthetic reminder used Feeding type, upcoming state, one-time recurrence, and a scheduled date. |  |
| QA-022 | Reminders | Validation: invalid title | Active dog exists | Try blank or 1-character reminder title | Validation prevents save | Vercel Production | Major | Pass | Blank title and one-character title attempts did not create reminders. | Validation was exercised before valid reminder creation; reminder count did not increase until a valid title was used. |  |
| QA-023 | Reminders | Edit reminder | Reminder exists | Edit title/type/date/notes/state | Updated values persist after refresh | Vercel Production | Major | Pass | Edited the created reminder to `QA Edited Reminder` with Walk type, updated date, notes, and upcoming state; updated values remained visible after saving. | Later Completed/All views showed the edited reminder with the updated title and type. |  |
| QA-024 | Reminders | Mark one-time reminder completed | Upcoming reminder exists | Click complete | Reminder state becomes completed; appears under Completed | Vercel Production | Major | Pass | Marked `QA Complete One-Time` completed; it appeared in the Completed filter with state Completed. | Completed one-time reminder no longer appeared in Open. |  |
| QA-025 | Reminders | Complete recurring reminder | Recurring scheduled reminder exists | Mark completed | Completed occurrence remains; new upcoming occurrence is created | Vercel Production | Major | Pass | Marked `QA Recurring Daily` completed; the UI showed "Recurring reminder completed and the next occurrence was created." | Completed filter showed the completed occurrence, and Open/All showed the next upcoming daily occurrence. |  |
| QA-026 | Reminders | Delete reminder | Reminder exists | Delete and confirm | Reminder disappears and does not reappear after refresh | Vercel Production | Major | Pass | Deleted `QA Delete Target` with confirmation; it was removed from the list. | Follow-up All/Open checks no longer showed the deleted target reminder. |  |
| QA-027 | Reminders | Open filter | Active dog has open, missed, completed reminders | Select Open | Shows non-completed, non-effectively-missed reminders, including unscheduled open reminders | Vercel Production | Major | Pass | Open filter showed open non-missed reminders including `QA Today Future 2`, `QA Recurring Daily`, and `QA Unscheduled Open`. | Completed reminders and missed reminders were not shown in Open. |  |
| QA-028 | Reminders | Today open filter | Active dog has today future and past reminders | Select Today open | Shows today non-completed reminders that are not effectively missed | Vercel Production | Major | Pass | Today open filter showed `QA Today Future 2` and did not show the past-due reminder. | Past-due today reminder appeared under Missed instead of Today open. |  |
| QA-029 | Reminders | Missed filter | Past-due incomplete reminder exists | Select Missed | Shows explicit missed and effective missed reminders | Vercel Production | Major | Pass | Missed filter showed both `QA Past Due` and `QA Explicit Missed`. | `QA Past Due` was stored as upcoming with a past scheduled time and displayed as Missed by client-side effective-state logic. |  |
| QA-030 | Reminders | Snoozed compatibility | Existing snoozed row if available | View reminder list/form | App does not crash; Snoozed is hidden from State select | Vercel Production | Minor | Blocked | No existing snoozed reminder row was available through safe UI-created data, and manual database manipulation was out of scope. | Verified the State select only exposed Upcoming, Completed, and Missed; full existing-row snoozed compatibility could not be executed without manually creating a DB row. |  |
| QA-031 | Dashboard | No dog empty state | Logged in with no dogs | Open `/` | Shows "Create your dog profile to get started." | Vercel Production | Major | Pass | Fresh synthetic QA account with no dog opened `/` and saw the Dashboard no-dog empty state. | Dashboard showed "0 dog profiles" and "Create your dog profile to get started." |  |
| QA-032 | Dashboard | Active dog summary | Active dog exists | Open `/` | Shows selected dog summary | Vercel Production | Major | Pass | Dashboard loaded with active dog `QA Batch3 Dog` and showed the selected dog summary. | Summary showed `Active dog: QA Batch3 Dog` and the selected-dog card for the same dog. |  |
| QA-033 | Dashboard | Reminder summary counts | Active dog has mixed reminders | Open `/` | Open, today, missed, and completed counts are correct | Vercel Production | Major | Pass | Dashboard summary cards showed Open `3`, Today open `1`, Missed `3`, and Completed `3` for the synthetic reminder dataset. | Counts matched the visible dataset: one today-open reminder, future/unscheduled open reminders, missed reminders, and completed reminders. |  |
| QA-034 | Dashboard | Today open section | Active dog has today reminders | Open `/` | Today open reminders appear only in Today section | Vercel Production | Major | Pass | Today open section showed `QA Dashboard Today Live`. | The today reminder was not duplicated in the Later & unscheduled section. |  |
| QA-035 | Dashboard | Later and unscheduled section | Active dog has future and unscheduled open reminders | Open `/` | Future scheduled items appear first; unscheduled items follow; today items are not duplicated | Vercel Production | Major | Pass | Later & unscheduled section showed future `QA Recurring Daily` before unscheduled `QA Unscheduled Open`. | Today reminder was intentionally not duplicated in this section. |  |
| QA-036 | Dashboard | No AI on dashboard load | Logged in | Open `/` with network tab open | No `/api/assistant` or Gemini request occurs | Vercel Production | Critical | Pass | Dashboard loaded with no resource entries for `/api/assistant` or `generativelanguage.googleapis.com`. | Browser resource inspection returned an empty AI request list on Dashboard load. |  |
| QA-037 | Dashboard | Quick actions | Logged in with dog | Use Dashboard quick actions | Links go to Dog Profile, Reminders, Assistant | Vercel Production | Minor | Pass | Dashboard quick actions navigated to Dog Profile, Reminders, and Assistant. | Verified `Edit Dog Profile -> /dog-profile`, `Add Reminder -> /reminders`, and `Ask Assistant -> /assistant`. |  |
| QA-038 | Assistant Mock Mode | Missing dog empty state | Logged in with no dogs | Open `/assistant` | Friendly empty state; chat sending disabled | Vercel Production | Major | Not Run |  |  |  |
| QA-039 | Assistant Mock Mode | Active dog context summary | Active dog exists | Open `/assistant` | Context summary shows active dog fields and reminder context | Vercel Production | Major | Not Run |  |  |  |
| QA-040 | Assistant Mock Mode | Normal mock response | Mock Mode enabled | Ask feeding/routine question | Response source is mock; response mentions dog context; no Gemini call | Vercel Production | Critical | Not Run |  |  |  |
| QA-041 | Assistant Mock Mode | Duplicate send protection | Active dog exists | Send question and click Send repeatedly | Only one in-flight request/response is produced; button disabled while sending | Vercel Production | Major | Not Run |  |  |  |
| QA-042 | Assistant Gemini boundary | Real Gemini path | Gemini intentionally enabled | Ask normal question | Browser calls `/api/assistant`; response source is gemini; no direct browser Gemini call | Vercel Production | Critical | Not Run |  | Use sparingly |  |
| QA-043 | Assistant Gemini boundary | Missing/invalid Gemini fallback | Gemini unavailable or intentionally disabled | Ask normal question | Friendly mock/fallback behavior; app does not crash | Vercel Production | Major | Not Run |  |  |  |
| QA-044 | Emergency bypass | English choking emergency | Active dog exists | Ask "my dog is choking" | EmergencyAlert appears; source emergency_rule; Gemini not called | Vercel Production | Critical | Not Run |  |  |  |
| QA-045 | Emergency bypass | English accident/vomiting emergency | Active dog exists | Ask "my dog was hit by a car" and "my dog keeps vomiting" | Both trigger emergency flow without normal answer | Vercel Production | Critical | Not Run |  |  |  |
| QA-046 | Emergency bypass | Hebrew emergency prompts | Active dog exists | Ask Hebrew emergency prompts from test data section | Emergency flow appears; no diagnosis; advise vet immediately | Vercel Production | Critical | Not Run |  |  |  |
| QA-047 | Error handling | Supabase/network failure behavior | Safe way to simulate unavailable network | Load data screen while offline or blocked | Friendly error or loading state; no crash or raw stack trace | Local / Vercel Production | Major | Not Run |  |  |  |
| QA-048 | Responsive behavior | Mobile navigation and layout | Mobile viewport | Check all beta routes at mobile width | Text fits; navigation works; primary actions are reachable | Vercel Production | Major | Not Run |  |  |  |
| QA-049 | Responsive behavior | Desktop layout | Desktop viewport | Check all beta routes | Layout is readable; Assistant conversation appears before starter questions | Vercel Production | Minor | Not Run |  |  |  |
| QA-050 | Production sanity | Vercel deployed environment variables | Vercel Production configured | Open app and sign in | Supabase auth works; app does not show missing config warning | Vercel Production | Critical | Not Run |  |  |  |
| QA-051 | Security sanity | No frontend Gemini key | Browser devtools available | Inspect source, bundle search, console, network response | No `GEMINI_API_KEY`, no `VITE_GEMINI_API_KEY`, no bearer token leaked in UI | Vercel Production | Critical | Not Run |  |  |  |
| QA-052 | Security sanity | User isolation | User A and User B exist | Create dog/reminders as User A, sign out, sign in User B | User B cannot see User A dogs/reminders | Vercel Production | Critical | Not Run |  |  |  |
| QA-053 | Cost-control sanity | No automatic AI call on Assistant load | Active dog exists | Open `/assistant` with network tab open | No `/api/assistant` request until user sends a question | Vercel Production | Critical | Not Run |  |  |  |
| QA-054 | Cost-control sanity | Rate-limit/fallback handling | Gemini intentionally enabled and safe to test | Trigger repeated normal sends within configured limit boundaries | App handles limit/fallback gracefully without exposing internals | Vercel Production | Major | Not Run |  | Use sparingly; rate limiting is best-effort beta behavior, in-memory, and applies only before real Gemini calls, not production-grade shared persistence. |  |
| QA-055 | Documentation readiness | README setup and deployment notes | Current README | Review README against actual app/deployment | README is beta/demo accurate and does not claim final features | Local | Minor | Not Run |  |  |  |

## 5. Execution Summary

| Counter | Count |
|---|---:|
| Total tests | 56 |
| Passed | 36 |
| Failed | 1 |
| Blocked | 1 |
| Needs Review | 0 |
| Not Run | 18 |

## 6. Bugs Discovered During QA

Bugs discovered during manual QA are listed below. Add new bugs only after manual execution identifies an issue.

| Bug ID | Related Test ID | Severity | Area | Title | Status | Notes |
|---|---|---|---|---|---|---|
| P7-BUG-001 | QA-005 | Critical | Auth | Sign in with generated QA account stays on Auth page | Not Reproducible | Initial headless Codex run failed, but a controlled manual browser/incognito retest successfully signed in after logout and reached Dashboard. No confirmed auth bug. |
| P7-BUG-002 | QA-017 | Major | DogPicker | Active dog selection does not persist after refresh | New | Selecting the second dog from the header DogPicker updates the current session and localStorage, but refreshing returns the UI to the first active dog. |

## 7. Open Questions / Needs Review

Needs-review items discovered during manual QA are listed below. Add observations here when behavior may require a product or scope decision rather than a straightforward bug fix.

| Item ID | Related Test ID | Area | Question / Observation | Status | Notes |
|---|---|---|---|---|---|
| P7-NR-001 | QA-005 | Auth | Codex headless sign-in with a generated QA account stayed on `/auth`, while manual user observation with an existing account reaches Dashboard successfully. Determine whether this is a real auth issue, a test-account issue, or a headless/timing artifact. | Resolved - Not Reproducible | Resolved by controlled manual browser/incognito retest. QA-005 is now marked Pass. |

## 8. Next Steps

After manual execution is completed:

- Failed tests and needs-review items will be triaged.
- Bugs will be documented in `docs/PHASE_7_BUG_TRIAGE.md`.
- Only approved Phase 7 fixes will be handled in a later step.
- No bug fixes should be made directly in Phase 7 Step 2 unless explicitly approved.
