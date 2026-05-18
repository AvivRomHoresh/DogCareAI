# Phase 7 Step 2: Manual QA Execution Results

## 1. Title and Purpose

This file records actual manual QA execution results for the approved Phase 7 QA plan in `docs/PHASE_7_QA_PLAN.md`.

This is Phase 7 Step 2 only. The purpose is to execute and document QA results, not to fix bugs. No app code, migrations, RLS policies, environment files, Gemini architecture, persistence, tables, or features should be changed during this step.

## 2. Execution Metadata

| Field | Value |
|---|---|
| QA date | 2026-05-18 |
| Tester | TBD |
| App version / commit | `d98b891 docs: add Phase 7 QA plan` |
| Environment | TBD |
| Vercel Production URL | TBD |
| Local environment, if used | TBD |
| Browser/device | TBD |
| Mock Mode / Gemini mode | TBD |
| Test accounts used | TBD; use generic QA accounts only |
| Notes | Do not record real passwords, secrets, tokens, API keys, or private credentials. |

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
| QA-001 | Landing / routing | Unauthenticated root redirect | Logged out | Open `/` directly | User is redirected to `/auth` or shown auth flow; app does not crash | Vercel Production | Critical | Not Run |  |  |  |
| QA-002 | Landing / routing | Direct refresh on Dashboard | Logged in | Open `/`, refresh browser | Dashboard reloads successfully through Vercel SPA routing | Vercel Production | Major | Not Run |  |  |  |
| QA-003 | Landing / routing | Direct refresh on nested routes | Logged in | Open and refresh `/dog-profile`, `/reminders`, `/assistant` | Each route reloads without 404 | Vercel Production | Major | Not Run |  |  |  |
| QA-004 | Auth | Sign up with valid test account | Test email available | Open `/auth`, choose sign up, submit valid email/password | Account is created or confirmation message appears | Vercel Production | Critical | Not Run |  | Do not record password |  |
| QA-005 | Auth | Sign in with valid account | Test account exists | Open `/auth`, sign in | User reaches Dashboard | Vercel Production | Critical | Not Run |  |  |  |
| QA-006 | Auth | Invalid login error | Logged out | Submit invalid credentials | Friendly error appears; no crash; password not logged | Vercel Production | Major | Not Run |  |  |  |
| QA-007 | Auth | Logout | Logged in | Click logout | User returns to `/auth`; protected routes require login | Vercel Production | Critical | Not Run |  |  |  |
| QA-008 | Protected routes | Block protected routes when logged out | Logged out | Open `/dog-profile`, `/reminders`, `/assistant` directly | Redirect to `/auth`; no protected content visible | Vercel Production | Critical | Not Run |  |  |  |
| QA-009 | Protected routes | Hide Auth for authenticated users | Logged in | Open `/auth` directly | User is redirected to `/` | Vercel Production | Minor | Not Run |  |  |  |
| QA-010 | Dog Profile | Empty dog profile state | Logged in as account with no dogs | Open `/dog-profile` | Friendly empty state appears | Vercel Production | Major | Not Run |  |  |  |
| QA-011 | Dog Profile | Create minimal dog | Logged in, no active dog required | Create dog with valid name only | Dog saves and becomes available/active | Vercel Production | Critical | Not Run |  |  |  |
| QA-012 | Dog Profile | Create complete dog profile | Logged in | Fill optional profile fields and save | Profile saves; values persist after refresh | Vercel Production | Major | Not Run |  |  |  |
| QA-013 | Dog Profile | Validation: blank or short name | Logged in | Try blank or 1-character dog name | Inline validation prevents save | Vercel Production | Major | Not Run |  |  |  |
| QA-014 | Dog Profile | Validation: invalid age/weight | Logged in | Enter invalid age or weight | Inline validation prevents save | Vercel Production | Major | Not Run |  |  |  |
| QA-015 | Dog Profile | Edit dog profile | Dog exists | Change profile fields and save | Updated values persist after refresh | Vercel Production | Major | Not Run |  |  |  |
| QA-016 | Dog Profile | Archive dog | Dog exists | Archive active dog | Dog is hidden from active list; no hard delete UI appears | Vercel Production | Major | Not Run |  |  |  |
| QA-017 | DogPicker | Active dog persistence | At least 2 dogs exist | Select dog, refresh | Same active dog remains selected when available | Vercel Production | Major | Not Run |  |  |  |
| QA-018 | DogPicker | Switch dogs | At least 2 dogs exist | Switch active dog from header | Dashboard/Reminders/Assistant context updates | Vercel Production | Major | Not Run |  |  |  |
| QA-019 | DogPicker | Archived dog removed from active choices | Dog archived | Open DogPicker | Archived dog is not selectable | Vercel Production | Major | Not Run |  |  |  |
| QA-020A | Reminders | Missing dog / no active dog state | Logged in with no dogs | Open `/reminders` | Friendly missing-dog or create-dog state appears; reminder actions are unavailable until a dog exists; app does not crash | Vercel Production | Major | Not Run |  |  |  |
| QA-020 | Reminders | Empty reminders state | Active dog exists, no reminders | Open `/reminders` | Friendly empty state appears | Vercel Production | Major | Not Run |  |  |  |
| QA-021 | Reminders | Create reminder | Active dog exists | Create valid reminder | Reminder saves for active dog and appears in list | Vercel Production | Critical | Not Run |  |  |  |
| QA-022 | Reminders | Validation: invalid title | Active dog exists | Try blank or 1-character reminder title | Validation prevents save | Vercel Production | Major | Not Run |  |  |  |
| QA-023 | Reminders | Edit reminder | Reminder exists | Edit title/type/date/notes/state | Updated values persist after refresh | Vercel Production | Major | Not Run |  |  |  |
| QA-024 | Reminders | Mark one-time reminder completed | Upcoming reminder exists | Click complete | Reminder state becomes completed; appears under Completed | Vercel Production | Major | Not Run |  |  |  |
| QA-025 | Reminders | Complete recurring reminder | Recurring scheduled reminder exists | Mark completed | Completed occurrence remains; new upcoming occurrence is created | Vercel Production | Major | Not Run |  |  |  |
| QA-026 | Reminders | Delete reminder | Reminder exists | Delete and confirm | Reminder disappears and does not reappear after refresh | Vercel Production | Major | Not Run |  |  |  |
| QA-027 | Reminders | Open filter | Active dog has open, missed, completed reminders | Select Open | Shows non-completed, non-effectively-missed reminders, including unscheduled open reminders | Vercel Production | Major | Not Run |  |  |  |
| QA-028 | Reminders | Today open filter | Active dog has today future and past reminders | Select Today open | Shows today non-completed reminders that are not effectively missed | Vercel Production | Major | Not Run |  |  |  |
| QA-029 | Reminders | Missed filter | Past-due incomplete reminder exists | Select Missed | Shows explicit missed and effective missed reminders | Vercel Production | Major | Not Run |  |  |  |
| QA-030 | Reminders | Snoozed compatibility | Existing snoozed row if available | View reminder list/form | App does not crash; Snoozed is hidden from State select | Vercel Production | Minor | Not Run |  | Do not create DB rows manually unless approved |  |
| QA-031 | Dashboard | No dog empty state | Logged in with no dogs | Open `/` | Shows "Create your dog profile to get started." | Vercel Production | Major | Not Run |  |  |  |
| QA-032 | Dashboard | Active dog summary | Active dog exists | Open `/` | Shows selected dog summary | Vercel Production | Major | Not Run |  |  |  |
| QA-033 | Dashboard | Reminder summary counts | Active dog has mixed reminders | Open `/` | Open, today, missed, and completed counts are correct | Vercel Production | Major | Not Run |  |  |  |
| QA-034 | Dashboard | Today open section | Active dog has today reminders | Open `/` | Today open reminders appear only in Today section | Vercel Production | Major | Not Run |  |  |  |
| QA-035 | Dashboard | Later and unscheduled section | Active dog has future and unscheduled open reminders | Open `/` | Future scheduled items appear first; unscheduled items follow; today items are not duplicated | Vercel Production | Major | Not Run |  |  |  |
| QA-036 | Dashboard | No AI on dashboard load | Logged in | Open `/` with network tab open | No `/api/assistant` or Gemini request occurs | Vercel Production | Critical | Not Run |  | Cost-control check |  |
| QA-037 | Dashboard | Quick actions | Logged in with dog | Use Dashboard quick actions | Links go to Dog Profile, Reminders, Assistant | Vercel Production | Minor | Not Run |  |  |  |
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
| Passed | 0 |
| Failed | 0 |
| Blocked | 0 |
| Needs Review | 0 |
| Not Run | 56 |

## 6. Bugs Discovered During QA

No bugs have been recorded yet. Add bugs here only after manual execution identifies an issue.

| Bug ID | Related Test ID | Severity | Area | Title | Status | Notes |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

## 7. Open Questions / Needs Review

No needs-review items have been recorded yet. Add observations here when behavior may require a product or scope decision rather than a straightforward bug fix.

| Item ID | Related Test ID | Area | Question / Observation | Status | Notes |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

## 8. Next Steps

After manual execution is completed:

- Failed tests and needs-review items will be triaged.
- Bugs will be documented in `docs/PHASE_7_BUG_TRIAGE.md`.
- Only approved Phase 7 fixes will be handled in a later step.
- No bug fixes should be made directly in Phase 7 Step 2 unless explicitly approved.
