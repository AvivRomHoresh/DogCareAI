# Phase 6 Step 6: Dashboard Basics Report

## Branch

- `phase-6-dashboard-basics`

## Step Goal

Implement a practical beta dashboard on `/` using the existing Dog Profile and Basic Reminders data.

The dashboard remains a frontend/Supabase data screen only. It does not trigger AI behavior or any background automation.

## Files Changed

- `README.md`
- `src/lib/reminderHelpers.ts`
- `src/pages/DashboardPage.tsx`
- `src/pages/RemindersPage.tsx`
- `docs/PHASE_6_DASHBOARD.md`

## Dashboard Behavior Implemented

- `/` now shows an active-dog dashboard instead of the earlier dashboard stub.
- The dashboard uses the existing `useDogs` active dog context.
- If no dog profile exists, the existing friendly empty state remains: "Create your dog profile to get started."
- If dog profiles exist but no active dog is selected, the dashboard asks the user to select a dog from the header.
- The dashboard does not query reminders unless there is a valid `activeDogId`.
- The dashboard shows a simple selected-dog profile summary.
- Quick actions link to:
  - Edit Dog Profile: `/dog-profile`
  - Add Reminder: `/reminders`
  - Ask Assistant: `/assistant`

## Reminder Summary Behavior

The dashboard loads reminders for the active dog only from `public.reminders`.

Reminder sections:

- Today open reminders:
  - `scheduled_at` is today in the user's local timezone.
  - `state !== 'completed'`.
- Later & unscheduled open reminders:
  - `state !== 'completed'`.
  - `scheduled_at` is after today in the user's local timezone or `scheduled_at` is null.
  - Today reminders are intentionally not duplicated in this section because they already appear in Today open reminders.
  - Scheduled reminders after today appear first, sorted by `scheduled_at` ascending.
  - Unscheduled open reminders appear after scheduled future reminders.
  - Limited to the next 5 reminders.
- Completed reminders:
  - Shows only a count for the active dog.

Summary cards:

- Active dog name
- Open reminders count
- Today open count
- Completed reminders count

Empty states:

- If the active dog has no reminders, the dashboard shows: "No reminders yet. Add your first dog-care reminder."
- If there are no open reminders for today, the dashboard shows: "No open reminders for today."
- If there are no later or unscheduled open reminders, the dashboard shows: "No later or unscheduled open reminders."

Recurring reminders are displayed from the current `reminders` table state only. The dashboard does not generate recurring reminders or run background scheduling.

## Active Dog Dependency

- Dashboard data depends on `activeDogId`.
- Reminder loading is skipped when `activeDogId` is missing.
- Switching active dogs reloads reminder summaries for the selected dog.
- Dashboard reminders remain scoped to the current active dog and do not expose a dog selector inside reminder cards.

## Shared Reminder Helpers

Added `src/lib/reminderHelpers.ts` for small shared reminder utilities:

- reminder type, frequency, and state labels
- local date/time formatting
- today/future schedule checks
- open reminder predicate
- schedule sorting helper

`RemindersPage` now reuses the shared labels and today helper to avoid duplicating simple date/filter logic.

## Supabase and RLS Assumptions

- The Phase 6 Step 3 core schema migration has been manually applied.
- The pre-Step 5 reminder type migration has been manually applied and verified.
- `public.dogs` and `public.reminders` exist with RLS enabled.
- The frontend uses only the Supabase anon key.
- Dashboard reminder loading queries `public.reminders` with `dog_id = activeDogId`.
- Owner isolation relies on Supabase RLS policies where `user_id = auth.uid()`.
- `SUPABASE_SERVICE_ROLE_KEY` was not used.
- No secrets were committed.

## Intentionally Not Implemented

- AI Assistant behavior.
- Gemini calls.
- Edge Functions or serverless functions.
- Database schema changes.
- RLS policy changes.
- Supabase service-role usage.
- Activity logging.
- Push notifications.
- Calendar integration.
- Background scheduled jobs.
- Recurring reminder generation from the dashboard.
- Complex analytics or charts.
- Final-only screens.
- Paid services.

Dashboard opening does not trigger any LLM call.

## Manual Smoke Test Checklist

- Sign in with a Supabase email/password account.
- Open `/` with no dog profile and confirm the "Create your dog profile to get started." empty state appears.
- Create a dog profile and confirm `/` shows the active dog summary.
- With dogs present but no active dog selected, confirm the dashboard asks the user to select a dog.
- Create reminders for the active dog from `/reminders`.
- Return to `/` and confirm summary cards show active dog, open count, today open count, and completed count.
- Confirm reminders scheduled today and not completed appear under Today open reminders.
- Confirm reminders scheduled today and not completed do not duplicate in the later/unscheduled section.
- Confirm open reminders after today and unscheduled open reminders appear under Later & unscheduled open reminders, limited to the next 5.
- Confirm scheduled reminders after today appear before unscheduled reminders.
- Confirm completed reminders affect only the completed count and do not appear in open lists.
- Confirm an active dog with no reminders shows "No reminders yet. Add your first dog-care reminder."
- Switch active dogs and confirm the dashboard reloads reminders only for the selected dog.
- Confirm `/assistant` is still a stub and no AI behavior was added.

## Build and Lint Results

| Command | Result | Notes |
|---|---|---|
| `npm.cmd run build` | Passed | Required elevated sandbox permissions so Vite could spawn esbuild. |
| `npm.cmd run lint` | Passed | TypeScript check completed successfully. |

## Readiness Statement

After review, manual smoke testing, and merge, the project will be ready for Phase 6 Step 7: AI Assistant Mock + Context + Emergency.
