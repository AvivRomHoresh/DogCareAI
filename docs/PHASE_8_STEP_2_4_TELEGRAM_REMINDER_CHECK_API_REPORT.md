# Phase 8.2.4 Telegram Reminder Check/Send API Report

## Step Goal

Add only a secure app-open/user-triggered API route that checks the authenticated user's reminders and sends due or upcoming Telegram notifications.

This step does not add scheduler/cron behavior, UI auto-calling, SMS, WhatsApp, email providers, browser notifications, phone-number collection, or paid services.

## Endpoint Added

- `POST /api/telegram/reminders/check`

Behavior:

- Accepts only `POST`.
- Requires `Authorization: Bearer <supabase_access_token>`.
- Validates the authenticated Supabase user.
- Loads the user's `notification_settings` row through the authenticated Supabase anon/RLS path.
- Requires:
  - `telegram_enabled = true`
  - `reminder_notifications_enabled = true`
  - saved non-empty `telegram_chat_id`
- Reads `TELEGRAM_BOT_TOKEN` server-side only.
- Loads only the authenticated user's non-completed reminders with `scheduled_at`.
- Sends Telegram messages for eligible reminders.
- Records successful sends in `telegram_notification_deliveries`.
- Uses a 24-hour overdue lookback window for missed reminders.
- Sends at most 10 Telegram notifications per check.
- Accepts optional JSON body field `timeZone` for safe message time formatting.
- Returns safe structured JSON with:
  - `success`
  - `message`
  - `checked`
  - `sent`
  - `skipped_duplicate`
  - `skipped`

## Files Changed

- `api/telegram/reminders/check.js`
- `src/pages/RemindersPage.tsx`
- `docs/PHASE_8_STEP_2_4_TELEGRAM_REMINDER_CHECK_API_REPORT.md`

## Reminder Selection Rules

The route uses the authenticated user's notification settings:

- `notify_minutes_before = 0`: include due or overdue reminders only.
- `notify_minutes_before = 15`, `30`, or `60`: include due/overdue reminders and upcoming reminders scheduled within that future window.
- Overdue reminders are included only when `scheduled_at` is within the last 24 hours.
- Each check sends at most 10 Telegram notifications.

Eligible reminders must:

- belong to the authenticated user,
- not have `state = completed`,
- have a non-null `scheduled_at`,
- have `scheduled_at >= now - 24 hours`,
- have `scheduled_at <= now + notify_minutes_before`.

Notification kind:

- `reminder_upcoming` is used when `scheduled_at` is in the future.
- `reminder_missed` is used when `scheduled_at` is in the past.
- `reminder_due` is intentionally not used in this MVP route to keep the first implementation deterministic and simple.

Timezone handling:

- The route accepts an optional request body field: `timeZone`.
- If `timeZone` is valid, message times are formatted in that timezone.
- If `timeZone` is missing or invalid, the route falls back to `Asia/Jerusalem`.

Telegram message format:

Upcoming:

```text
🐶 DogCareAI Reminder
<Dog name> has an upcoming reminder:
<Reminder title>
Time: <formatted reminder time>
```

Missed:

```text
🐶 DogCareAI Missed Reminder
<Dog name> missed a reminder:
<Reminder title>
Scheduled for: <formatted reminder time>
```

If the dog name cannot be loaded, the route uses `Your dog`.

## Duplicate Prevention Behavior

Before sending, the route checks `telegram_notification_deliveries` for an existing delivery with:

- `user_id`
- `reminder_id`
- `notification_kind`
- `reminder_scheduled_at`

After a successful Telegram send, it inserts a delivery row with the same logical key. The database unique constraint remains the final duplicate-prevention guard.

If a duplicate insert conflict occurs, it is counted as `skipped_duplicate` and is not treated as a fatal error.

Missed reminder duplicate behavior:

- A missed reminder sends at most once for the same `reminder_id`, `notification_kind`, and `reminder_scheduled_at`.
- Editing the same reminder to a future `scheduled_at` creates a new notification occurrence because duplicate prevention includes `reminder_scheduled_at`.
- Old delivery records for old scheduled times do not block future notifications for edited future times.

Reminder state adjustment:

- The Reminders edit flow now resets a stored `state = missed` reminder back to `upcoming` when the user edits it to a future `scheduled_at`.
- Completed reminders are not changed by this adjustment.
- Reminders that only appear missed because their scheduled time is in the past already become not missed automatically when edited to a future time.

## Security Notes

- `TELEGRAM_BOT_TOKEN` is read only from server-side environment variables.
- No `VITE_TELEGRAM_BOT_TOKEN` was added.
- The route does not use `SUPABASE_SERVICE_ROLE_KEY`.
- The route validates the Supabase user before loading settings or reminders.
- Settings and reminders are queried with `user_id = authenticated user id`.
- The route does not return bot tokens, chat IDs, raw Telegram errors, or stack traces.
- The route does not log bot tokens or chat IDs.
- Telegram messages include only dog name, reminder title, and reminder time.
- Optional `timeZone` is validated through `Intl.DateTimeFormat` before use.
- No phone numbers are collected or used.

## What Was Intentionally Not Implemented

- No scheduler or cron route.
- No automatic app-load call from the frontend.
- No Reminders page "check now" button.
- No SMS.
- No WhatsApp.
- No email provider.
- No browser notifications.
- No paid services.
- No phone-number collection.
- No Gemini architecture changes.
- No broad reminder CRUD changes. A narrow edit-state correction was added so stored missed reminders become upcoming when rescheduled into the future.
- No database schema changes in this step.

## Validation Results

| Command | Result | Notes |
|---|---|---|
| `npm.cmd run lint` | Passed | TypeScript build check completed. |
| `npm.cmd run build` | Passed | Vite production build completed. |
| `git diff --check` | Passed | No whitespace errors reported. |

## Manual QA Steps

After deploying with `TELEGRAM_BOT_TOKEN` configured server-side:

1. Sign in with a generic QA account.
2. Ensure Telegram settings are saved with:
   - `telegram_enabled = true`
   - `reminder_notifications_enabled = true`
   - valid `telegram_chat_id`
   - selected `notify_minutes_before`
3. Create a reminder for the authenticated user with a scheduled time in the future within the configured window.
4. Start the Telegram bot from the target Telegram account/chat.
5. Call `POST /api/telegram/reminders/check` with the Supabase bearer token and optional `{ "timeZone": "Asia/Jerusalem" }`.
6. Confirm the Telegram message is received.
7. Confirm the response shows `sent = 1`.
8. Call the endpoint again for the same reminder occurrence.
9. Confirm no duplicate Telegram message is sent and `skipped_duplicate` increments.
10. Confirm completed reminders are not sent.
11. Create or leave a non-completed reminder that is overdue within 24 hours and confirm it sends one `reminder_missed` notification.
12. Edit that missed reminder to a future scheduled time and confirm it becomes eligible as a new occurrence.
13. Confirm no bot token, chat ID, raw Telegram error, or stack trace appears in the response.

## Risks / TODOs

- This is still app-open/user-triggered only; reminders are not sent while the app is closed unless the user or a future approved scheduler calls the endpoint.
- The first run can send overdue reminders from the last 24 hours that have not previously been recorded as delivered.
- Very old overdue reminders outside the 24-hour lookback are intentionally skipped.
- If Telegram sends successfully but delivery recording fails for a non-duplicate reason, a future check may attempt the reminder again.
- A single check sends at most 10 notifications; additional eligible reminders can be sent by a later check.
- Frontend wiring for a "Check due reminders now" action is intentionally deferred to the next step.
- Scheduler/cron would require a separate approved design.
