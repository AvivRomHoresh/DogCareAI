# Phase 6 Pre-Step 5 Alignment Report

## Branch

- `phase-6-pre-step5-alignment`

## Why This Alignment Was Needed

After PR #7, the Markdown docs were mostly consistent, but a few small updates were needed before starting Phase 6 Step 5: Basic Reminders.

The main alignment issue was that the Reminders beta UI includes vet visits as a natural reminder type, while the existing database constraint did not yet allow `vet_visit`.

## AGENTS Update Summary

`AGENTS.md` now reflects actual Phase 6 progress:

- Phase 6 Step 0: Baseline build.
- Phase 6 Step 1: Supabase environment setup.
- Phase 6 Step 2: Auth + protected routes.
- Phase 6 Step 3: Database schema + RLS.
- Phase 6 Step 4: Dog Profile.

It also names the next steps:

- Phase 6 Step 5: Basic Reminders.
- Phase 6 Step 6: Dashboard basics.
- Phase 6 Step 7: AI Assistant Mock + Context + Emergency.
- Phase 6 Step 8: Optional Gemini/server-side boundary.
- Phase 6 Step 9: Stabilization before Phase 7 QA.

Existing agent, security, scope, and cost-control rules were kept.

## Reminder Type Alignment Summary

A follow-up migration was prepared to update the `reminders.type` check constraint so it allows:

- `feeding`
- `walk`
- `medication`
- `vaccination`
- `grooming`
- `vet_visit`
- `general`

No RLS policies, grants, tables, or columns were changed.

## Docs Updated

- `AGENTS.md`
- `docs/DESIGN.md`
- `docs/PHASE_6_DATABASE_RLS.md`
- `docs/BACKLOG.md`
- `docs/PHASE_6_PRE_STEP5_ALIGNMENT.md`

## Migration File

- `supabase/migrations/20260515_phase_6_add_vet_visit_reminder_type.sql`

This migration was committed for review only. It was not applied to Supabase in this task.

## Manual Supabase Apply Instructions

After review and approval:

1. Open the Supabase dashboard.
2. Open the project SQL Editor.
3. Copy the full contents of `supabase/migrations/20260515_phase_6_add_vet_visit_reminder_type.sql`.
4. Paste it into a new SQL query.
5. Run the query once.
6. Save the query in Supabase if desired for audit/history.

Do not use a service-role key in frontend code.

## Verification After Applying

After applying the migration, verify the constraint allows `vet_visit`.

Recommended check:

```sql
select
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.reminders'::regclass
  and conname = 'reminders_type_valid';
```

The returned definition should include `vet_visit`.

Optional functional check after Step 5 implements Reminders:

```sql
-- Use an authenticated app flow or a safe test row owned by the signed-in user.
-- Do not bypass RLS with service-role credentials for frontend validation.
```

## Intentionally Not Implemented

- No Step 5 Reminders UI or CRUD.
- No dashboard implementation.
- No AI, Gemini, Edge Functions, or serverless functions.
- No Supabase SQL was applied.
- No RLS policy changes.
- No grant changes.
- No new tables.
- No app feature code changes.
- No Supabase Storage or file upload.
- No secrets were used or committed.

## Readiness Statement

After this alignment PR is reviewed and merged, the project will be ready for Phase 6 Step 5: Basic Reminders.

