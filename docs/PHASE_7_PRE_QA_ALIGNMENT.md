# Phase 7 Pre-QA Markdown Alignment Report

## Branch

- `phase-7-pre-qa-md-alignment`

## Why This Alignment Was Needed

Phase 6 Step 9 was merged, but the current-status Markdown still pointed to Phase 6 stabilization as the active work. This alignment updates the repository documentation so agents and reviewers start Phase 7 from the real project state.

## Files Changed

- `AGENTS.md`
- `README.md`
- `docs/BACKLOG.md`
- `docs/PHASE_7_PRE_QA_ALIGNMENT.md`

## Current Project State

- Phase 6 beta implementation is complete through Step 9.
- The current phase is Phase 7 QA.
- Vercel Production is the active deployment target.
- Netlify remains as a backup/static deployment path and should not be used for active Gemini work.
- The beta supports Supabase email/password auth, protected routes, Dog Profile, Basic Reminders, Dashboard summaries, and the Assistant with Mock Mode, deterministic emergency handling, and Gemini through `/api/assistant`.

## Phase 6 Completion Summary

- Step 0: Baseline build.
- Step 1: Supabase environment setup.
- Step 2: Auth + protected routes.
- Step 3: Database schema + RLS.
- Step 4: Dog Profile.
- Step 5: Basic Reminders.
- Step 6: Dashboard basics.
- Step 7: AI Assistant Mock + Context + Emergency.
- Step 8A: Vercel hosting compatibility.
- Step 8B: Gemini through Vercel server-side boundary.
- Step 9: Stabilization before Phase 7 QA.

## Phase 7 QA Focus

- Manual QA of the full beta flow.
- Basic automated tests where practical.
- README/demo documentation alignment.
- Bug fixes only, unless explicitly approved.

## Cost-Control State

- Mock Mode remains available and should be used for routine testing and demos.
- Gemini calls are explicit user actions only through `/api/assistant`.
- Emergency responses bypass Gemini.
- `AI_RATE_LIMIT_MAX_REQUESTS_PER_MINUTE` provides a beta best-effort per-user Gemini request guard.
- No automatic LLM calls happen on Dashboard or Assistant page load.

## Security State

- `GEMINI_API_KEY` remains server-side only.
- No `VITE_GEMINI_API_KEY` is used.
- Supabase client usage stays on the anon-key and RLS path.
- No Supabase service-role key is used by the beta app.
- No secrets were added or documented as committed values.

## Known Limitations To Test Or Document

- No chat persistence.
- No `ai_usage_logs` persistence.
- No automated tests yet.
- Emergency detection is deterministic keyword-based and not exhaustive.
- Gemini rate limit is best-effort in-memory and not production-grade shared persistence.
- Activity Log and Vet Finder are final-phase features, not beta blockers.
- Mock Mode should remain available for routine testing and demos.
- DogCareAI remains beta/demo software and does not provide medical diagnosis.

## App Behavior Confirmation

- No app behavior changed.
- No source code changed.
- No API behavior changed.
- No database schema, migration, RLS policy, table, persistence, secret, package, Vercel, Netlify, or Excel file changes were made.

## Build and Lint Results

| Command | Result | Notes |
|---|---|---|
| `npm.cmd run build` | Passed | Required elevated sandbox permissions so Vite could spawn esbuild. |
| `npm.cmd run lint` | Passed | TypeScript check completed successfully. |
