# Phase 7 Step 0: Phase 7 Plan

## Phase 7 Purpose

Phase 7 validates the completed beta before moving to Phase 8 Final Version. It should confirm that the shipped Phase 6 beta flow is usable, secure, cost-controlled, and accurately documented.

The beta currently includes:

- Supabase email/password authentication.
- Protected routes.
- Dog Profile create/edit/archive.
- Active dog selection through `DogPicker`.
- Basic Reminders create/edit/complete/delete.
- Dashboard reminder summaries.
- Assistant with Mock Mode.
- Deterministic emergency rules.
- Optional Gemini through `/api/assistant`.
- Vercel production deployment.

## Phase 7 Ground Rules

- Phase 7 is QA and stabilization only.
- Do not add new major features.
- Do not add final-only screens.
- Do not expand the database unless a Critical blocker is found and explicitly approved.
- Do not introduce a paid service requirement.
- Keep Mock Mode available.
- Use Gemini only intentionally and sparingly.
- Fix bugs in small targeted PRs.
- Classify tester feature ideas instead of implementing them immediately.
- Keep Activity Log, Vet Finder, chat persistence, and `ai_usage_logs` persistence out of Phase 7 unless explicitly approved later.

## Phase 7 Step Breakdown

### Phase 7 Step 1 - QA Plan + Test Matrix

- Create `docs/PHASE_7_QA_PLAN.md`.
- Define test environment, severity levels, pass/fail rules, and manual test matrix.
- Include coverage for authentication, routing, Dog Profile, Reminders, Dashboard, Assistant, security, cost-control, mobile UX, and documentation.

### Phase 7 Step 2 - Manual QA Execution

- Run the test matrix manually.
- Document results in `docs/PHASE_7_MANUAL_QA_RESULTS.md`.
- Do not fix bugs during this step unless explicitly approved.
- Record observed behavior clearly enough that a later bugfix PR can reproduce it.

### Phase 7 Step 3 - Bug Triage

- Review failed tests and tester feedback.
- Create `docs/PHASE_7_BUG_TRIAGE.md`.
- Classify issues as Critical, High, Medium, Low, Deferred, or Needs Product Decision.
- Separate real beta bugs from future improvements.

### Phase 7 Step 4 - Bugfix Round 1

- Fix only approved Critical/High bugs and small beta-blocking issues.
- Create a focused PR.
- Add `docs/PHASE_7_BUGFIX_ROUND_1.md`.
- Keep fixes targeted and avoid unrelated refactors.

### Phase 7 Step 5 - Regression QA

- Re-test affected flows after bug fixes.
- Document results in `docs/PHASE_7_REGRESSION_RESULTS.md`.
- Confirm fixes did not regress adjacent beta flows.

### Phase 7 Step 6 - Basic Automated Tests, If Practical

- Decide whether adding a minimal test setup is worth it.
- Prefer small tests for deterministic helpers such as emergency detection, intent detection, reminder helpers, or mock response shape.
- If test setup adds too much complexity, document that automated tests are deferred.
- Do not let test setup become a large tooling project.

### Phase 7 Step 7 - Demo Guide + README Polish

- Prepare demo instructions.
- Add or update `docs/PHASE_7_DEMO_GUIDE.md`.
- Update `README.md` only if needed.
- Include Mock Mode guidance and optional Gemini demo guidance.
- Keep demo instructions honest about beta limitations and medical-safety boundaries.

### Phase 7 Step 8 - Final QA Summary + Beta Readiness Decision

- Create `docs/PHASE_7_QA_SUMMARY.md`.
- Summarize what was tested, what passed, what failed, what was fixed, what was deferred, and whether the beta is ready.
- State whether the project can move to Phase 8 Final Version.

## Phase 7 Test Areas

- Auth.
- Protected routes and routing.
- Dog Profile.
- DogPicker / active dog behavior.
- Reminders.
- Dashboard.
- Assistant Mock Mode.
- Assistant Emergency flow.
- Gemini server-side boundary.
- Security and RLS.
- Cost-control.
- Responsive/mobile UX.
- Documentation/demo readiness.

## Feedback Classification

### Bug

Something that should work according to the beta scope but does not.

### UX Blocker

Something that makes the beta hard to use or hard to understand.

### Copy/Polish

Wording, spacing, labels, or visual clarity.

### Future Improvement

A good idea, but not required for beta.

### Final-Version Feature

Belongs to Phase 8 or later.

## Severity Rules

### Critical

- App cannot load.
- Auth is broken.
- User data isolation is broken.
- Secrets are exposed.
- Gemini key is visible in frontend.
- Core beta flow is unusable.

### High

- Dog Profile, Reminders, Dashboard, or Assistant core flow is broken.

### Medium

- Non-blocking but confusing behavior.

### Low

- UI or copy polish.

### Deferred

- Valuable but outside beta scope.

### Needs Product Decision

- Ambiguous feedback that may change scope or UX direction.

## Phase 7 Non-Goals

Phase 7 should not implement:

- Activity Log.
- Vet Finder.
- Chat persistence.
- `ai_usage_logs` persistence.
- Supabase Storage image upload.
- New database tables.
- New migrations.
- RLS redesign.
- Push notifications.
- Paid APIs.
- Major redesign.
- Multi-owner permissions.
- Complex analytics.
- New final-only routes.

## Expected Phase 7 Artifacts

- `docs/PHASE_7_PLAN.md`.
- `docs/PHASE_7_QA_PLAN.md`.
- `docs/PHASE_7_MANUAL_QA_RESULTS.md`.
- `docs/PHASE_7_BUG_TRIAGE.md`.
- `docs/PHASE_7_BUGFIX_ROUND_1.md`, only if bugfixes are needed.
- `docs/PHASE_7_REGRESSION_RESULTS.md`, if bugfixes are made.
- `docs/PHASE_7_DEMO_GUIDE.md`.
- `docs/PHASE_7_QA_SUMMARY.md`.

## Readiness Criteria for Leaving Phase 7

Phase 7 is complete only when:

- Critical bugs are fixed or explicitly documented as not reproducible.
- High bugs are fixed or consciously deferred with justification.
- Core beta flows pass manual QA.
- Mock Mode works.
- Emergency flow works.
- Gemini boundary is verified at least once, if intentionally enabled.
- No secrets are exposed.
- README/demo guidance is accurate.
- Known limitations are documented.
- Final QA summary exists.

## Validation

Validation for this planning step:

| Command | Result | Notes |
|---|---|---|
| `npm.cmd run build` | Passed | Required elevated sandbox permissions so Vite could spawn esbuild. |
| `npm.cmd run lint` | Passed | TypeScript check completed successfully. |

## Scope Confirmation

- Documentation only.
- No app behavior changed.
- No source code changed.
- No tests were added.
- No manual QA was executed.
- No bug fixes were made.
- No API behavior changed.
- No database schema, migration, RLS policy, or table changes were made.
- No chat persistence or `ai_usage_logs` persistence was added.
- No secrets were added.
- No `VITE_GEMINI_API_KEY` was created.
- Mock Mode, Vercel support, and Netlify backup config were not changed.
- No Activity Log or Vet Finder implementation was added.
- No Excel file was added or modified.
