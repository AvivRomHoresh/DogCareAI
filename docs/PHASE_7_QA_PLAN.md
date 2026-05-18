# Phase 7 Step 1: QA Plan + Test Matrix

## 1. Title and Purpose

This document defines the Phase 7 QA plan before manual QA execution begins.

This is Phase 7 Step 1 only. It creates the test strategy, test matrix, severity model, reporting rules, and QA output plan for validating the completed DogCareAI beta. It does not execute QA, fix bugs, add tests, or change application behavior.

Phase 7 validates the beta that was completed in Phase 6. The goal is to confirm that the current app is stable enough for beta/demo use and that any issues are documented and triaged before Phase 8 Final Version work begins.

## 2. Scope of QA

### Included in Phase 7 QA

- Supabase email/password authentication.
- Public/auth route:
  - `/auth`
- Protected authenticated beta routes:
  - `/`
  - `/dog-profile`
  - `/reminders`
  - `/assistant`
- Direct route refresh behavior on Vercel.
- Dog Profile create/edit/archive.
- Static dog avatar behavior.
- `DogPicker` and active dog persistence.
- Basic Reminders create/edit/complete/delete.
- Recurring reminder completion behavior that completes the current row and creates the next upcoming occurrence.
- Reminder filters and client-side effective missed behavior.
- Dashboard reminder summaries.
- Assistant Mock Mode.
- Assistant Gemini server-side boundary through `/api/assistant`.
- Deterministic emergency bypass before Gemini.
- Error, loading, empty, and validation states.
- Basic responsive/mobile usability.
- Security sanity checks for RLS assumptions and secret exposure.
- Cost-control sanity checks.
- README/demo documentation accuracy.

### Explicitly Out of Scope

- Adding Activity Log.
- Adding Vet Finder.
- Adding final-only screens.
- Adding new database tables.
- Adding migrations.
- Changing RLS policies.
- Adding chat persistence.
- Adding `ai_usage_logs` persistence.
- Changing Gemini architecture.
- Adding Supabase Storage image upload.
- Adding push notifications.
- Adding calendar integration.
- Adding paid services or paid APIs.
- Adding complex analytics.
- Adding automated tests during this planning step.
- Fixing bugs during Phase 7 Step 1.

Phase 7 is stabilization, validation, and bug documentation only. Feature ideas from QA should be classified, not implemented immediately.

## 3. Test Environment

### Primary Environment

- Vercel Production is the primary QA target.
- Production route refreshes should be tested directly for all beta routes.
- Browser network checks should confirm Assistant calls go to `/api/assistant`, not directly to Gemini.

### Secondary Environment

- Local development is a supporting environment for reproducing issues and checking build/lint behavior.
- Local testing should use `.env.local` with frontend-safe Supabase variables only.
- Local Gemini testing is optional and should be intentional.

### Backup Environment

- Netlify remains backup/static deployment only.
- Netlify should not be used for active Gemini work because the current Gemini boundary is the Vercel Function at `/api/assistant`.
- `netlify.toml` should remain in the repository unless a later approved step removes it.

### AI Mode Guidance

- Mock Mode is the recommended default for routine QA to avoid wasting Gemini quota.
- Gemini testing should be limited, intentional, and documented.
- Emergency tests must confirm the emergency path bypasses Gemini.
- The browser must never expose `GEMINI_API_KEY`.
- Do not create or use `VITE_GEMINI_API_KEY`.

### Secret Safety

- Do not record real credentials in QA documents.
- Do not paste real Supabase keys, Gemini keys, tokens, session values, or network authorization headers into bug reports.
- Screenshots should avoid exposing private email addresses or tokens.

## 4. Test Accounts and Test Data

### Test Accounts

Use safe, generic test accounts created specifically for QA.

Recommended account set:

- User A: primary beta account for normal flow testing.
- User B: isolation account to verify one user cannot see another user's dogs or reminders.
- Optional User C: account with no dog profile for empty-state testing.

Do not include real passwords or real account credentials in this file or future QA reports.

### Dog Profile Test Data

Use non-sensitive synthetic dog data:

| Dog | Purpose | Suggested Data |
|---|---|---|
| Luna | Normal complete profile | Labrador, age 7, weight 28 kg, female, medium activity, mild chicken sensitivity |
| Max | Minimal profile | Name only |
| Nala | Multi-dog switching | Mixed breed, age 2, high activity |
| Senior Demo Dog | Edge profile | Age 14, low activity, medical notes and allergies |

Dog Profile fields to exercise:

- Name.
- Breed.
- Age.
- Weight.
- Gender.
- Static avatar.
- Medical notes.
- Allergies.
- Vaccination history.
- Feeding preferences.
- Activity level.
- Special conditions.

### Reminder Test Data

Create reminders for the active dog only.

Recommended reminder set:

| Reminder | Type | Schedule | State | Purpose |
|---|---|---|---|---|
| Morning meal | Feeding | Today, future time | Upcoming | Today open reminder |
| Evening walk | Walk | Today, future time | Upcoming | Today open reminder |
| Old medication | Medication | Yesterday | Upcoming | Effective missed behavior |
| Annual vaccine | Vaccination | Future date | Upcoming | Later reminder |
| Grooming note | Grooming | No scheduled date | Upcoming | Unscheduled open reminder |
| Completed vet visit | Vet visit | Past date | Completed | Completed count/history |
| Recurring walk | Walk | Future date | Upcoming, weekly | Recurring completion behavior |

Reminder values should remain generic and should not contain real medical history.

### Assistant Test Prompts

Use safe, non-sensitive prompts:

- "What should I consider for Luna's feeding routine?"
- "How much activity should Luna get today?"
- "What reminders should I create for this dog?"
- "How can I help with barking during walks?"
- "When should I think about vaccination reminders?"

### Emergency-Related Test Prompts

Use the exact prompts below to verify emergency bypass:

- "my dog is choking"
- "my dog was hit by a car"
- "my dog keeps vomiting"
- "שלג נדרס, מה ניתן לעשות?"
- "הכלב נדרס"
- "שלג לא מפסיק להקיא, מה אפשר לעשות?"
- "הכלב לא נושם"

Expected emergency behavior:

- Emergency alert appears.
- Response source is `emergency_rule`.
- Gemini is not called.
- No diagnosis is provided.
- The user is advised to contact a veterinarian or emergency animal clinic immediately.

## 5. Severity Levels

| Severity | Meaning | DogCareAI Example | Expected Triage Priority |
|---|---|---|---|
| Blocker | QA cannot continue or the app cannot be meaningfully used. | Vercel Production does not load, or login is impossible for all accounts. | Stop QA for affected flow; document immediately; fix before lower severity work. |
| Critical | Security, data isolation, secret exposure, or core beta failure. | User A can see User B dogs/reminders; `GEMINI_API_KEY` appears in browser; emergency prompt calls Gemini. | Highest priority Phase 7 fix. Must be fixed or documented as not reproducible before beta signoff. |
| Major | Core feature is broken but the app is partly usable. | Dog Profile cannot save; reminders cannot be created; `/api/assistant` always fails for normal questions. | Fix in Phase 7 if reproducible and inside beta scope. |
| Minor | Non-blocking bug or confusing behavior with workaround. | Empty state wording is unclear; reminder count is stale until refresh. | Triage after Blocker/Critical/Major. Fix if small and approved. |
| Trivial / Cosmetic | Visual polish, copy, spacing, or low-risk consistency issue. | A badge label is slightly awkward or spacing is uneven on desktop. | Defer unless it affects demo clarity. |

## 6. Pass / Fail Rules

### Pass

A test passes when:

- The observed behavior matches the expected result.
- No console or network error appears for the tested action, unless the expected result explicitly includes a handled error.
- The behavior remains inside beta scope and does not expose final-only features as active.
- Data remains scoped to the authenticated user and active dog.

### Fail

A test fails when:

- Expected beta behavior does not work.
- The UI crashes, hangs, or shows raw technical errors.
- Data appears under the wrong user or wrong active dog.
- A protected route is accessible without authentication.
- A secret, token, or Gemini key appears in frontend-visible surfaces.
- A cost-control rule is violated, such as an automatic AI call on page load.

### Blocked

A test is blocked when:

- Required environment access is unavailable.
- A prior failed step prevents the test from being executed.
- Test data cannot be created due to a setup issue.
- The tester cannot safely verify the behavior without secrets or admin access.

### Needs Review

A result needs review when:

- Behavior differs from tester expectations but may be intentional beta behavior.
- Documentation and implementation appear to disagree.
- The issue may be a product decision rather than a bug.
- The result depends on deployment configuration not visible to the tester.

### Documentation Rule

For every non-pass result, record:

- Expected behavior.
- Actual behavior.
- Environment.
- User/account type.
- Active dog state.
- Steps to reproduce.
- Screenshots or network/console evidence when useful.
- Whether the issue is reproducible.

Do not include secrets, real credentials, bearer tokens, API keys, or private personal data in QA notes.

## 7. Manual Test Matrix

Status values for Step 2 should be: `Not Run`, `Pass`, `Fail`, `Blocked`, or `Needs Review`.

| Test ID | Area | Scenario | Preconditions | Steps | Expected Result | Environment | Priority | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| QA-001 | Landing / routing | Unauthenticated root redirect | Logged out | Open `/` directly | User is redirected to `/auth` or shown auth flow; app does not crash | Vercel Production | Critical | Not Run | |
| QA-002 | Landing / routing | Direct refresh on Dashboard | Logged in | Open `/`, refresh browser | Dashboard reloads successfully through Vercel SPA routing | Vercel Production | Major | Not Run | |
| QA-003 | Landing / routing | Direct refresh on nested routes | Logged in | Open and refresh `/dog-profile`, `/reminders`, `/assistant` | Each route reloads without 404 | Vercel Production | Major | Not Run | |
| QA-004 | Auth | Sign up with valid test account | Test email available | Open `/auth`, choose sign up, submit valid email/password | Account is created or confirmation message appears | Vercel Production | Critical | Not Run | Do not record password |
| QA-005 | Auth | Sign in with valid account | Test account exists | Open `/auth`, sign in | User reaches Dashboard | Vercel Production | Critical | Not Run | |
| QA-006 | Auth | Invalid login error | Logged out | Submit invalid credentials | Friendly error appears; no crash; password not logged | Vercel Production | Major | Not Run | |
| QA-007 | Auth | Logout | Logged in | Click logout | User returns to `/auth`; protected routes require login | Vercel Production | Critical | Not Run | |
| QA-008 | Protected routes | Block protected routes when logged out | Logged out | Open `/dog-profile`, `/reminders`, `/assistant` directly | Redirect to `/auth`; no protected content visible | Vercel Production | Critical | Not Run | |
| QA-009 | Protected routes | Hide Auth for authenticated users | Logged in | Open `/auth` directly | User is redirected to `/` | Vercel Production | Minor | Not Run | |
| QA-010 | Dog Profile | Empty dog profile state | Logged in as account with no dogs | Open `/dog-profile` | Friendly empty state appears | Vercel Production | Major | Not Run | |
| QA-011 | Dog Profile | Create minimal dog | Logged in, no active dog required | Create dog with valid name only | Dog saves and becomes available/active | Vercel Production | Critical | Not Run | |
| QA-012 | Dog Profile | Create complete dog profile | Logged in | Fill optional profile fields and save | Profile saves; values persist after refresh | Vercel Production | Major | Not Run | |
| QA-013 | Dog Profile | Validation: blank or short name | Logged in | Try blank or 1-character dog name | Inline validation prevents save | Vercel Production | Major | Not Run | |
| QA-014 | Dog Profile | Validation: invalid age/weight | Logged in | Enter invalid age or weight | Inline validation prevents save | Vercel Production | Major | Not Run | |
| QA-015 | Dog Profile | Edit dog profile | Dog exists | Change profile fields and save | Updated values persist after refresh | Vercel Production | Major | Not Run | |
| QA-016 | Dog Profile | Archive dog | Dog exists | Archive active dog | Dog is hidden from active list; no hard delete UI appears | Vercel Production | Major | Not Run | |
| QA-017 | DogPicker | Active dog persistence | At least 2 dogs exist | Select dog, refresh | Same active dog remains selected when available | Vercel Production | Major | Not Run | |
| QA-018 | DogPicker | Switch dogs | At least 2 dogs exist | Switch active dog from header | Dashboard/Reminders/Assistant context updates | Vercel Production | Major | Not Run | |
| QA-019 | DogPicker | Archived dog removed from active choices | Dog archived | Open DogPicker | Archived dog is not selectable | Vercel Production | Major | Not Run | |
| QA-020A | Reminders | Missing dog / no active dog state | Logged in with no dogs | Open `/reminders` | Friendly missing-dog or create-dog state appears; reminder actions are unavailable until a dog exists; app does not crash | Vercel Production | Major | Not Run | |
| QA-020 | Reminders | Empty reminders state | Active dog exists, no reminders | Open `/reminders` | Friendly empty state appears | Vercel Production | Major | Not Run | |
| QA-021 | Reminders | Create reminder | Active dog exists | Create valid reminder | Reminder saves for active dog and appears in list | Vercel Production | Critical | Not Run | |
| QA-022 | Reminders | Validation: invalid title | Active dog exists | Try blank or 1-character reminder title | Validation prevents save | Vercel Production | Major | Not Run | |
| QA-023 | Reminders | Edit reminder | Reminder exists | Edit title/type/date/notes/state | Updated values persist after refresh | Vercel Production | Major | Not Run | |
| QA-024 | Reminders | Mark one-time reminder completed | Upcoming reminder exists | Click complete | Reminder state becomes completed; appears under Completed | Vercel Production | Major | Not Run | |
| QA-025 | Reminders | Complete recurring reminder | Recurring scheduled reminder exists | Mark completed | Completed occurrence remains; new upcoming occurrence is created | Vercel Production | Major | Not Run | |
| QA-026 | Reminders | Delete reminder | Reminder exists | Delete and confirm | Reminder disappears and does not reappear after refresh | Vercel Production | Major | Not Run | |
| QA-027 | Reminders | Open filter | Active dog has open, missed, completed reminders | Select Open | Shows non-completed, non-effectively-missed reminders, including unscheduled open reminders | Vercel Production | Major | Not Run | |
| QA-028 | Reminders | Today open filter | Active dog has today future and past reminders | Select Today open | Shows today non-completed reminders that are not effectively missed | Vercel Production | Major | Not Run | |
| QA-029 | Reminders | Missed filter | Past-due incomplete reminder exists | Select Missed | Shows explicit missed and effective missed reminders | Vercel Production | Major | Not Run | |
| QA-030 | Reminders | Snoozed compatibility | Existing snoozed row if available | View reminder list/form | App does not crash; Snoozed is hidden from State select | Vercel Production | Minor | Not Run | Do not create DB rows manually unless approved |
| QA-031 | Dashboard | No dog empty state | Logged in with no dogs | Open `/` | Shows "Create your dog profile to get started." | Vercel Production | Major | Not Run | |
| QA-032 | Dashboard | Active dog summary | Active dog exists | Open `/` | Shows selected dog summary | Vercel Production | Major | Not Run | |
| QA-033 | Dashboard | Reminder summary counts | Active dog has mixed reminders | Open `/` | Open, today, missed, and completed counts are correct | Vercel Production | Major | Not Run | |
| QA-034 | Dashboard | Today open section | Active dog has today reminders | Open `/` | Today open reminders appear only in Today section | Vercel Production | Major | Not Run | |
| QA-035 | Dashboard | Later and unscheduled section | Active dog has future and unscheduled open reminders | Open `/` | Future scheduled items appear first; unscheduled items follow; today items are not duplicated | Vercel Production | Major | Not Run | |
| QA-036 | Dashboard | No AI on dashboard load | Logged in | Open `/` with network tab open | No `/api/assistant` or Gemini request occurs | Vercel Production | Critical | Not Run | Cost-control check |
| QA-037 | Dashboard | Quick actions | Logged in with dog | Use Dashboard quick actions | Links go to Dog Profile, Reminders, Assistant | Vercel Production | Minor | Not Run | |
| QA-038 | Assistant Mock Mode | Missing dog empty state | Logged in with no dogs | Open `/assistant` | Friendly empty state; chat sending disabled | Vercel Production | Major | Not Run | |
| QA-039 | Assistant Mock Mode | Active dog context summary | Active dog exists | Open `/assistant` | Context summary shows active dog fields and reminder context | Vercel Production | Major | Not Run | |
| QA-040 | Assistant Mock Mode | Normal mock response | Mock Mode enabled | Ask feeding/routine question | Response source is mock; response mentions dog context; no Gemini call | Vercel Production | Critical | Not Run | |
| QA-041 | Assistant Mock Mode | Duplicate send protection | Active dog exists | Send question and click Send repeatedly | Only one in-flight request/response is produced; button disabled while sending | Vercel Production | Major | Not Run | |
| QA-042 | Assistant Gemini boundary | Real Gemini path | Gemini intentionally enabled | Ask normal question | Browser calls `/api/assistant`; response source is gemini; no direct browser Gemini call | Vercel Production | Critical | Not Run | Use sparingly |
| QA-043 | Assistant Gemini boundary | Missing/invalid Gemini fallback | Gemini unavailable or intentionally disabled | Ask normal question | Friendly mock/fallback behavior; app does not crash | Vercel Production | Major | Not Run | |
| QA-044 | Emergency bypass | English choking emergency | Active dog exists | Ask "my dog is choking" | EmergencyAlert appears; source emergency_rule; Gemini not called | Vercel Production | Critical | Not Run | |
| QA-045 | Emergency bypass | English accident/vomiting emergency | Active dog exists | Ask "my dog was hit by a car" and "my dog keeps vomiting" | Both trigger emergency flow without normal answer | Vercel Production | Critical | Not Run | |
| QA-046 | Emergency bypass | Hebrew emergency prompts | Active dog exists | Ask Hebrew emergency prompts from test data section | Emergency flow appears; no diagnosis; advise vet immediately | Vercel Production | Critical | Not Run | |
| QA-047 | Error handling | Supabase/network failure behavior | Safe way to simulate unavailable network | Load data screen while offline or blocked | Friendly error or loading state; no crash or raw stack trace | Local / Vercel Production | Major | Not Run | |
| QA-048 | Responsive behavior | Mobile navigation and layout | Mobile viewport | Check all beta routes at mobile width | Text fits; navigation works; primary actions are reachable | Vercel Production | Major | Not Run | |
| QA-049 | Responsive behavior | Desktop layout | Desktop viewport | Check all beta routes | Layout is readable; Assistant conversation appears before starter questions | Vercel Production | Minor | Not Run | |
| QA-050 | Production sanity | Vercel deployed environment variables | Vercel Production configured | Open app and sign in | Supabase auth works; app does not show missing config warning | Vercel Production | Critical | Not Run | |
| QA-051 | Security sanity | No frontend Gemini key | Browser devtools available | Inspect source, bundle search, console, network response | No `GEMINI_API_KEY`, no `VITE_GEMINI_API_KEY`, no bearer token leaked in UI | Vercel Production | Critical | Not Run | |
| QA-052 | Security sanity | User isolation | User A and User B exist | Create dog/reminders as User A, sign out, sign in User B | User B cannot see User A dogs/reminders | Vercel Production | Critical | Not Run | |
| QA-053 | Cost-control sanity | No automatic AI call on Assistant load | Active dog exists | Open `/assistant` with network tab open | No `/api/assistant` request until user sends a question | Vercel Production | Critical | Not Run | |
| QA-054 | Cost-control sanity | Rate-limit/fallback handling | Gemini intentionally enabled and safe to test | Trigger repeated normal sends within configured limit boundaries | App handles limit/fallback gracefully without exposing internals | Vercel Production | Major | Not Run | Use sparingly; rate limiting is best-effort beta behavior, in-memory, and applies only before real Gemini calls, not production-grade shared persistence. |
| QA-055 | Documentation readiness | README setup and deployment notes | Current README | Review README against actual app/deployment | README is beta/demo accurate and does not claim final features | Local | Minor | Not Run | |

## 8. Screen-Based QA Checklist

### Landing / Home

- [ ] Unauthenticated users are directed to authentication before seeing protected content.
- [ ] Authenticated users see the Dashboard on `/`.
- [ ] Empty state appears when no dog profile exists.
- [ ] Active dog summary appears when a dog exists.
- [ ] Reminder summary cards show correct active-dog counts.
- [ ] Today reminders and later/unscheduled reminders do not duplicate the same reminder.
- [ ] Dashboard opening does not call `/api/assistant`.
- [ ] Quick actions navigate to Dog Profile, Reminders, and Assistant.
- [ ] Loading and error states are readable.
- [ ] Mobile layout stacks cleanly.

### Login / Register

- [ ] Sign up accepts valid test account data.
- [ ] Sign in accepts valid test account data.
- [ ] Invalid credentials show friendly errors.
- [ ] Password validation uses the expected minimum length.
- [ ] Submit is disabled while auth request is pending.
- [ ] Authenticated users visiting `/auth` are redirected to `/`.
- [ ] Logout clears authenticated app access.
- [ ] Missing frontend Supabase config shows a setup-friendly message instead of crashing.

### Dashboard

- [ ] Uses the current active dog from `DogPicker`.
- [ ] Does not query reminders without a valid active dog.
- [ ] Shows active dog name.
- [ ] Shows open reminder count.
- [ ] Shows today open count.
- [ ] Shows missed count.
- [ ] Shows completed count.
- [ ] Shows empty reminder state when active dog has no reminders.
- [ ] Shows no-today and no-later empty states correctly.
- [ ] Switches cleanly when active dog changes.

### Dog Profile

- [ ] Empty state appears for a new account.
- [ ] Minimal dog profile can be created.
- [ ] Complete dog profile can be created.
- [ ] Existing dog profile can be edited.
- [ ] Archive hides dog from active choices.
- [ ] Static avatar choices save correctly.
- [ ] Name validation works.
- [ ] Age validation works.
- [ ] Weight validation works.
- [ ] Duplicate save is blocked while saving.
- [ ] Data persists after refresh.
- [ ] User A cannot see User B dogs.

### Reminders

- [ ] Page requires an active dog.
- [ ] Empty state appears when active dog has no reminders.
- [ ] Reminder can be created.
- [ ] Reminder can be edited.
- [ ] Reminder can be completed.
- [ ] Reminder can be deleted after confirmation.
- [ ] Recurring completion creates the next upcoming occurrence.
- [ ] Open filter works.
- [ ] Today open filter works.
- [ ] Missed filter works.
- [ ] Completed filter works.
- [ ] All filter works.
- [ ] Past-due incomplete reminders display as missed without mutating the database automatically.
- [ ] Snoozed remains hidden from the form State select.
- [ ] Reminder data stays scoped to active dog and authenticated user.

### Assistant

- [ ] Missing dog state blocks chat sending and links users to Dog Profile.
- [ ] Active dog context is visible in `ContextSummaryCard`.
- [ ] Reminder context appears where relevant.
- [ ] Starter questions are usable.
- [ ] Send button disables while sending.
- [ ] Duplicate sends are blocked.
- [ ] Mock responses clearly show mock/demo behavior.
- [ ] Emergency responses show `EmergencyAlert`.
- [ ] Gemini responses, when intentionally enabled, come only through `/api/assistant`.
- [ ] No chat history persists after refresh or active dog switch.
- [ ] Medical disclaimer remains visible.
- [ ] Assistant does not provide diagnosis.

### Shared Layout / Navigation

- [ ] Header shows app identity.
- [ ] Authenticated navigation includes beta routes only.
- [ ] Final-only routes are not active.
- [ ] DogPicker appears for authenticated users.
- [ ] Logout is visible and works.
- [ ] Mobile navigation remains usable.
- [ ] Desktop layout remains readable.
- [ ] Text does not overlap or overflow key controls.

## 9. Assistant-Specific QA

### Mock Mode Behavior

- Confirm Mock Mode is the routine QA default.
- Confirm normal questions return `response_source = mock` when Mock Mode is enabled.
- Confirm mock responses use active dog context and detected intent.
- Confirm mock responses do not claim to be real Gemini answers.
- Confirm no Gemini provider request is made in Mock Mode.

### Gemini Behavior Through `/api/assistant`

- Test Gemini only when intentionally enabled with server-side `GEMINI_API_KEY` and `MOCK_AI_MODE=false`.
- Confirm the browser calls `/api/assistant`.
- Confirm the browser does not call `generativelanguage.googleapis.com`.
- Confirm returned metadata uses `response_source = gemini` for successful Gemini responses.
- Confirm responses remain concise, general, and non-diagnostic.
- Confirm dog context is reflected without exposing private implementation details.

### Emergency Bypass Behavior

- Emergency detection must happen before Gemini.
- Emergency prompts must return `response_source = emergency_rule`.
- Emergency prompts must show `EmergencyAlert`.
- Emergency prompts must not generate a normal mock or Gemini answer.
- Emergency prompts must advise contacting a veterinarian or emergency animal clinic immediately.
- Emergency prompts must avoid diagnosis or speculative medical instructions.

### Secret and Persistence Checks

- Confirm there is no `VITE_GEMINI_API_KEY`.
- Confirm no Gemini key appears in browser source, frontend bundle, console, or network response.
- Confirm Supabase service-role key is not used or exposed.
- Confirm chat messages are frontend-local only and not persisted.
- Confirm `ai_usage_logs` persistence is not implemented in beta.

### Error, Quota, and Missing Configuration Handling

- Missing Gemini key should produce mock or fallback behavior, not a crash.
- Provider timeout or error should produce a friendly fallback.
- Rate limiting should protect Gemini calls before provider usage where applicable.
- Error UI must not expose stack traces, secrets, tokens, or raw provider internals.

## 10. Bug Report Template

Use this template in `docs/PHASE_7_MANUAL_QA_RESULTS.md` or `docs/PHASE_7_BUG_TRIAGE.md`.

```md
## Bug ID

- `P7-BUG-000`

## Title

- Short descriptive title.

## Environment

- Vercel Production / Local / Netlify backup.
- Browser and device/viewport.
- Mock Mode or Gemini enabled.

## Severity

- Blocker / Critical / Major / Minor / Trivial-Cosmetic.

## Area

- Auth / Routing / Dog Profile / DogPicker / Reminders / Dashboard / Assistant / Security / Cost-control / Docs.

## Preconditions

- Account state.
- Active dog state.
- Reminder/test data state.

## Steps to Reproduce

1. Step one.
2. Step two.
3. Step three.

## Expected Result

- What should have happened.

## Actual Result

- What actually happened.

## Screenshots / Evidence

- Attach screenshot path or describe evidence.
- Do not include secrets, credentials, tokens, or private data.

## Console / Network Notes

- Summarize relevant console or network behavior.
- Redact tokens, keys, emails, and authorization headers.

## Suspected Cause, If Known

- Optional. Use only if there is a clear clue.

## Status

- New / Confirmed / Needs Repro / Fixed / Deferred / Not Reproducible / Out of Scope.

## Owner

- Unassigned / owner name.

## Notes

- Additional context, links, or triage comments.
```

## 11. Bug Triage Rules

- Do not fix bugs during Phase 7 Step 1.
- Log bugs clearly with expected vs actual behavior.
- Classify every bug by severity and area.
- Reproduce issues before marking them confirmed when practical.
- Blocker and Critical issues take priority over UI polish.
- Security and cost-control issues get high priority.
- Any Gemini key exposure, direct browser Gemini call, or emergency flow that calls Gemini is Critical.
- User data isolation issues are Critical.
- Bugs inside beta scope should be considered for immediate Phase 7 fixes.
- Future improvements should move to backlog unless they block the beta demo.
- Final-version features should be marked Phase 8 or later.
- Ambiguous feedback should be marked Needs Product Decision before implementation.

For each bug, decide whether it belongs to:

- Immediate Phase 7 fix.
- Phase 7 backlog/deferred.
- Phase 8 Final Version.
- Out of scope.
- Needs Product Decision.

## 12. Phase 7 Output Plan

Phase 7 should produce:

- `docs/PHASE_7_QA_PLAN.md` - this QA plan and test matrix.
- `docs/PHASE_7_MANUAL_QA_RESULTS.md` - manual execution results.
- `docs/PHASE_7_BUG_TRIAGE.md` - bug list and triage decisions.
- Fix plan or focused bugfix PR notes, if issues are approved for fixing.
- `docs/PHASE_7_BUGFIX_ROUND_1.md`, only if bug fixes are needed.
- `docs/PHASE_7_REGRESSION_RESULTS.md`, if bug fixes are made.
- `docs/PHASE_7_DEMO_GUIDE.md` - demo instructions and mode guidance.
- `docs/PHASE_7_QA_SUMMARY.md` - final QA signoff and release readiness note.

## 13. Open Questions / Alignment Notes

- Some historical Phase 6 reports correctly describe routes as stubs at the time they were written. They should not be treated as current-state contradictions.
- `SPEC.md` and `docs/ARCHITECTURE.md` describe future tables such as `activities`, `medical_records`, `chat_messages`, and `ai_usage_logs`; the current beta intentionally implements only `profiles`, `dogs`, and `reminders`.
- `docs/ARCHITECTURE.md` mentions AI usage logging as an architectural goal, but `ai_usage_logs` persistence remains intentionally deferred in the current beta.
- `SPEC.md` includes broader dashboard/proactive-care concepts. The current beta dashboard is intentionally limited to active dog and reminder summaries and must not automatically call the LLM.
- `docs/PHASE_6_VERCEL_HOSTING.md` says `/api/*` is excluded so future Vercel Functions can work; after Step 8B, `/api/assistant` now exists and is the active Gemini boundary.

## 14. Acceptance Criteria for This Document

- [x] All central project docs were reviewed:
  - `SPEC.md`
  - `docs/ARCHITECTURE.md`
  - `docs/DESIGN.md`
  - `docs/ADR-001-stack-choice.md`
  - `docs/ADR-002-ai-cost-control.md`
  - `AGENTS.md`
  - `README.md`
  - `docs/BACKLOG.md`
  - `docs/PHASE_7_PRE_QA_ALIGNMENT.md`
  - `docs/PHASE_7_PLAN.md`
- [x] Relevant Phase 6 reports were reviewed:
  - Auth.
  - Database / RLS.
  - Dog Profile.
  - Reminders.
  - Dashboard.
  - Assistant.
  - Vercel Hosting.
  - Gemini Boundary.
  - Stabilization.
- [x] QA scope is aligned with Phase 7.
- [x] The plan emphasizes stabilization, validation, and bug documentation only.
- [x] No new features were added.
- [x] No code fixes were made.
- [x] No migrations, tables, RLS changes, persistence, secrets, or architecture changes were made.
- [x] No Excel file was added or modified.
- [x] Test matrix is ready for manual execution after review.
