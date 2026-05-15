# Phase 6 Step 5: Basic Reminders Report

## Branch

- `phase-6-basic-reminders`

## Step Goal

Implement Basic Reminders functionality using the existing `public.reminders` table, authenticated Supabase client, and Row-Level Security from Phase 6 Step 3.

## Files Changed

- `README.md`
- `src/pages/DashboardPage.tsx`
- `src/pages/RemindersPage.tsx`
- `src/types/reminder.ts`
- `docs/PHASE_6_REMINDERS.md`

## Reminder Behavior Implemented

- `/reminders` now loads reminders for the active dog only.
- Users can create reminders for the active dog.
- Users can select and edit existing reminders.
- Users can mark a reminder as completed.
- Users can delete reminders after confirmation.
- Reminder list cards show title, type, state, scheduled date/time, recurring frequency, and notes when present.
- The list includes beta client-side filters for All reminders, Today open, and Completed.
- The page shows loading, empty, error, saving, validation, and success states.
- Duplicate form submits are blocked while saving.

## Active Dog Dependency

- Reminders depend on `useDogs`.
- If no dog profile exists, the page shows: "Create a dog profile before adding reminders."
- If dogs exist but no active dog is selected, the page asks the user to select a dog.
- Reminder creation is blocked unless there is a valid `activeDogId`.
- The form never allows changing `dog_id`; reminders stay scoped to the current active dog.

## Validation Rules

Client-side validation mirrors the database constraints:

- Reminder title is required.
- Reminder title must be at least `2` characters after trimming.
- Type must be one of the approved reminder types.
- Recurring frequency must be one of the approved frequency values.
- State must be one of the approved state values.

## Supabase and RLS Assumptions

- The Phase 6 Step 3 core schema migration has been manually applied.
- The pre-Step 5 reminder type migration has been manually applied and verified.
- `public.reminders` exists with RLS enabled.
- The frontend uses only the Supabase anon key.
- Reminder list loading queries only rows where `dog_id = activeDogId` and relies on RLS for owner-only access.
- Reminder creation inserts `user_id` from the current authenticated user and `dog_id` from `activeDogId`.
- Reminder updates, completion, and deletion are performed through the authenticated client and remain protected by RLS.
- `SUPABASE_SERVICE_ROLE_KEY` was not used.

## Reminder Types and States

Reminder types:

- `feeding`
- `walk`
- `medication`
- `vaccination`
- `grooming`
- `vet_visit`
- `general`

Reminder states:

- `upcoming`
- `completed`
- `missed`
- `snoozed`

Recurring frequencies:

- `none`
- `daily`
- `weekly`
- `monthly`
- `yearly`

## Recurring Completion Behavior

- One-time reminders with `recurring_frequency = none` are marked `completed`.
- Recurring reminders with a `scheduled_at` value mark the current reminder row `completed`.
- The completed recurring occurrence keeps its original `scheduled_at`.
- The app then creates a new reminder row for the next occurrence with `state = upcoming`.
- The new row copies `user_id`, `dog_id`, `title`, `type`, `recurring_frequency`, and `notes`.
- Next occurrence behavior:
  - `daily`: add 1 day.
  - `weekly`: add 7 days.
  - `monthly`: add 1 month.
  - `yearly`: add 1 year.
- If a recurring reminder is overdue, the next occurrence advances until it is in the future relative to the user's current time.
- This is beta-safe row duplication behavior, not a full recurring-series engine.
- No `series_id`, recurring-series management, background scheduler, notification system, or scheduled processing was added.

## Reminder Filters

- `All reminders` shows the full loaded reminder list for the active dog.
- `Today open` shows reminders scheduled for today in the user's browser timezone where `state != completed`.
- `Completed` shows reminders where `state = completed`.
- Unscheduled reminders remain visible in `All reminders` and do not appear in `Today open`.
- Filtering is frontend-only and does not add database fields or change Supabase queries.

## Dashboard Compatibility

- The dashboard remains intentionally minimal.
- The dashboard link now points to the working Reminders route.
- No full dashboard reminder previews, summaries, or analytics were implemented.

## Intentionally Not Implemented

- Full Dashboard basics.
- AI Assistant, Gemini, Edge Functions, or serverless functions.
- New database tables.
- RLS policy changes.
- Reminder schema changes.
- Activity logging when reminders are completed.
- Push notifications or background scheduled jobs.
- Calendar view.
- Supabase Storage.
- Final-only screens.
- Paid services.

## Manual Smoke Test Checklist

- Sign in with a Supabase email/password account.
- Open `/reminders` with no dog profile and confirm the dog-profile empty state appears.
- Create a dog profile and make it the active dog.
- Open `/reminders` and confirm an empty reminders state appears.
- Create a reminder with a title, type, date/time, repeat option, notes, and default `upcoming` state.
- Confirm the reminder persists after refresh.
- Edit the reminder title, type, scheduled date/time, recurring frequency, notes, and state.
- Mark a reminder completed and confirm its state changes to `completed`.
- Mark a recurring scheduled reminder completed and confirm the completed occurrence remains in Completed while a new upcoming occurrence is created.
- Confirm All reminders, Today open, and Completed filters show the expected client-side subsets.
- Delete a reminder and confirm it is removed from the list.
- Switch to a different active dog and confirm only that dog's reminders load.
- Confirm invalid or one-character titles show readable validation messages.
- Confirm `/assistant` remains a stub.

## Build and Lint Results

| Command | Result |
|---|---|
| `npm.cmd run build` | Passed |
| `npm.cmd run lint` | Passed |

## Readiness Statement

After review, manual smoke testing, and merge, the project will be ready for Phase 6 Step 6: Dashboard basics.
