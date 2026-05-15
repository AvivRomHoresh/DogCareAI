# Phase 6 Step 3: Database Schema + RLS Report

## Branch

- `phase-6-db-schema-rls`

## Step Goal

Prepare a reviewable SQL migration for the minimal beta database schema and Row-Level Security policies.

The core schema migration was initially prepared for review only. After review, it was manually applied in Supabase and verified.

## Migration File

- `supabase/migrations/20260514_phase_6_core_schema_rls.sql`

## Follow-Up Migration Before Step 5

A follow-up migration was prepared before Phase 6 Step 5 to align reminder types with the Reminders beta UI:

- `supabase/migrations/20260515_phase_6_add_vet_visit_reminder_type.sql`

This follow-up migration adds `vet_visit` as an allowed `reminders.type` value. It does not change RLS policies, grants, tables, or existing reminder fields.

## Tables Created

- `public.profiles`
- `public.dogs`
- `public.reminders`

## Fields Summary

`profiles`:

- `id`
- `user_id`
- `display_name`
- `created_at`
- `updated_at`

`dogs`:

- `id`
- `user_id`
- `name`
- `breed`
- `age`
- `weight`
- `gender`
- `profile_image_url`
- `medical_notes`
- `allergies`
- `vaccination_history`
- `feeding_preferences`
- `activity_level`
- `special_conditions`
- `is_archived`
- `created_at`
- `updated_at`

`reminders`:

- `id`
- `user_id`
- `dog_id`
- `type`
- `title`
- `scheduled_at`
- `recurring_frequency`
- `notes`
- `state`
- `created_at`
- `updated_at`

## Constraints Summary

- `profiles.user_id` is unique and references `auth.users(id)`.
- All user-owned rows reference `auth.users(id)` with `on delete cascade`.
- `dogs.name` cannot be empty after trimming.
- `dogs.age` must be null or between `0` and `40`.
- `dogs.weight` must be null or greater than `0` and less than or equal to `200`.
- `dogs.activity_level` must be null or one of `low`, `medium`, `high`.
- `dogs.gender` must be null or one of `male`, `female`, `unknown`.
- `reminders.title` cannot be empty after trimming.
- `reminders.type` in the core migration initially allowed `feeding`, `walk`, `medication`, `vaccination`, `grooming`, and `general`.
- The pre-Step 5 follow-up migration updates `reminders.type` to also allow `vet_visit`.
- `reminders.recurring_frequency` must be one of `none`, `daily`, `weekly`, `monthly`, `yearly`.
- `reminders.state` must be one of `upcoming`, `completed`, `missed`, `snoozed`.
- `public.set_updated_at()` keeps `updated_at` current on updates for all three tables.

## Indexes Summary

- `profiles_user_id_idx`
- `dogs_user_id_idx`
- `dogs_user_id_is_archived_idx`
- `reminders_user_id_idx`
- `reminders_dog_id_idx`
- `reminders_user_id_state_idx`
- `reminders_scheduled_at_idx`

## RLS Policy Summary

RLS is enabled on all three tables.

`profiles`:

- Authenticated users can select, insert, update, and delete only rows where `user_id = auth.uid()`.

`dogs`:

- Authenticated users can select, insert, update, and delete only rows where `user_id = auth.uid()`.

`reminders`:

- Authenticated users can select and delete only reminders where `user_id = auth.uid()`.
- Authenticated users can insert and update reminders only when `user_id = auth.uid()` and `dog_id` belongs to a dog owned by `auth.uid()`.

## Grants Summary

- `authenticated` has `usage` on schema `public`.
- `authenticated` has `select`, `insert`, `update`, and `delete` grants on `profiles`, `dogs`, and `reminders`.
- `anon` table access is explicitly revoked for `profiles`, `dogs`, and `reminders`.
- The migration revokes all table privileges from `authenticated` and `anon` before granting only the required authenticated permissions.
- RLS remains the real row-level protection; grants only allow authenticated frontend users to reach these tables through the Supabase Data API.

## Manual Verification Results

Manual Supabase verification passed:

- RLS is enabled on `profiles`, `dogs`, and `reminders`.
- `pg_policies` returns 12 policies for the beta tables.
- `authenticated` has only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on `profiles`, `dogs`, and `reminders`.
- `anon` has no table access to `profiles`, `dogs`, or `reminders`.
- Extra authenticated privileges were cleaned by revoking all table privileges from `authenticated` and `anon`, then granting only the required minimum permissions to `authenticated`.

## Future Tables Intentionally Deferred

- `activities`
- `medical_records`
- `chat_messages`
- `ai_usage_logs`

These tables remain deferred to keep the beta schema small and focused.

## Manual Application Steps

This migration has been reviewed and manually applied once in Supabase.

For a new environment:

1. Open the Supabase dashboard.
2. Open the project SQL Editor.
3. Copy the full contents of `supabase/migrations/20260514_phase_6_core_schema_rls.sql`.
4. Paste it into a new SQL query.
5. Run the query once.
6. Save the query in Supabase if desired for audit/history.

Do not use a service-role key for frontend work.

## Verification After Applying

After the migration is applied, verify in Supabase:

- Tables exist under `public`: `profiles`, `dogs`, `reminders`.
- RLS is enabled on all three tables.
- Policies exist for owner-only access.
- `profiles.user_id` has a unique constraint.
- `dogs` includes the validation constraints for name, age, weight, gender, and activity level.
- `reminders` includes validation constraints for type, recurring frequency, state, and non-empty title.
- Indexes exist for common owner, dog, state, archive, and schedule queries.
- Updating a row changes `updated_at`.

## Intentionally Not Implemented

- No Dog Profile CRUD was implemented.
- No Reminders CRUD was implemented.
- No Dashboard data loading was implemented.
- No AI, Gemini, Edge Functions, or serverless functions were implemented.
- No service-role key was used.
- No secrets were committed.

## Readiness Statement

After review and manual application of the migration, the project will be ready for Phase 6 Step 4: Dog Profile.
