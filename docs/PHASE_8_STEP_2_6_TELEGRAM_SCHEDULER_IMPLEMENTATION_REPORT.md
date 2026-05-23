# Phase 8.2.6 Telegram Scheduler Implementation Report

## Step Goal

Add a protected scheduled Telegram reminder endpoint that can be called by cron-job.org every few minutes.

This step keeps the existing manual "Check due reminders now" button and does not implement frontend changes.

## Endpoint Added

```text
POST /api/telegram/reminders/scheduled-check
```

The endpoint:

- accepts only `POST`,
- requires `X-Telegram-Cron-Secret`,
- checks enabled Telegram reminder settings,
- sends eligible upcoming/missed Telegram reminder notifications,
- records successful deliveries,
- returns safe count-only JSON.

## Files Changed

- `.env.example`
- `api/telegram/reminders/scheduled-check.js`
- `docs/PHASE_8_STEP_2_6_TELEGRAM_SCHEDULER_IMPLEMENTATION_REPORT.md`

## Environment Variables Required

Server-side only:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CRON_SECRET`
- `SUPABASE_URL` or `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Do not create:

- `VITE_TELEGRAM_BOT_TOKEN`
- `VITE_TELEGRAM_CRON_SECRET`
- `VITE_SUPABASE_SERVICE_ROLE_KEY`

No real secrets were added to the repository.

## cron-job.org Setup Summary

Recommended cron-job.org configuration:

- URL: `https://<vercel-deployment>/api/telegram/reminders/scheduled-check`
- Method: `POST`
- Header: `X-Telegram-Cron-Secret: <secret>`
- Frequency: every 5 minutes

The endpoint should be tested against Vercel Preview before production use.

## Service-Role Safety Notes

The scheduled endpoint is not called by an authenticated user, so it uses `SUPABASE_SERVICE_ROLE_KEY` server-side to scan enabled users.

Safety constraints in the endpoint:

- reads only enabled `notification_settings` rows,
- processes only rows with Telegram and reminder notifications enabled,
- processes only reminders where `user_id` matches the settings row,
- loads dog names only for the same `user_id`,
- inserts delivery rows with matching `user_id`, reminder, and dog metadata,
- never returns the service-role key,
- never returns bot token, cron secret, full chat IDs, raw Supabase errors, raw Telegram errors, or stack traces.

## Selection Logic

The endpoint loads notification settings where:

- `telegram_enabled = true`,
- `reminder_notifications_enabled = true`,
- `telegram_chat_id is not null`.

For each enabled user, it loads reminders where:

- `state != completed`,
- `scheduled_at is not null`,
- `scheduled_at >= now - 24 hours`,
- `scheduled_at <= now + notify_minutes_before`.

Notification kinds:

- `reminder_upcoming` for future reminders,
- `reminder_missed` for past reminders.

`reminder_due` remains unused for this MVP.

Timezone:

- scheduled runs use `Asia/Jerusalem` as the fallback/demo timezone.

## Limits

The endpoint uses conservative caps:

- `MAX_USERS_PER_RUN = 25`
- `MAX_NOTIFICATIONS_PER_RUN = 25`
- `MAX_NOTIFICATIONS_PER_USER = 5`
- `OVERDUE_LOOKBACK_HOURS = 24`

If caps are reached, the response sets:

```json
{ "capped": true }
```

## Duplicate Prevention Behavior

The endpoint keeps existing duplicate prevention with `telegram_notification_deliveries`.

The duplicate key remains:

- `user_id`,
- `reminder_id`,
- `notification_kind`,
- `reminder_scheduled_at`.

Duplicates are counted as `skipped_duplicate`, not fatal.

## Response Shape

Successful responses use safe JSON:

```json
{
  "success": true,
  "message": "Scheduled Telegram reminder check complete. No new notifications were sent.",
  "users_checked": 0,
  "reminders_checked": 0,
  "sent": 0,
  "skipped_duplicate": 0,
  "skipped": 0,
  "capped": false,
  "diagnostic": null
}
```

Failure responses are also safe JSON and do not include secrets, raw provider errors, or stack traces.

## What Was Intentionally Not Implemented

- No frontend changes.
- No Vercel Cron.
- No scheduler UI.
- No SMS.
- No WhatsApp.
- No email provider.
- No browser notifications.
- No phone-number collection.
- No paid services.
- No RLS changes.
- No schema changes.
- No Gemini architecture changes.

## Manual QA Steps

1. Add `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and Supabase URL in Vercel Preview.
2. Send `GET /api/telegram/reminders/scheduled-check` and confirm method-not-allowed safe JSON.
3. Send `POST` without `X-Telegram-Cron-Secret` and confirm unauthorized safe JSON.
4. Send `POST` with the wrong secret and confirm unauthorized safe JSON.
5. Send `POST` with the correct secret and confirm the scheduled check runs.
6. Create an eligible future reminder and confirm Telegram sends once.
7. Call the endpoint again and confirm the duplicate is skipped.
8. Complete a reminder and confirm it is not sent.
9. Create a missed reminder within 24 hours and confirm it sends once.
10. Confirm old missed reminders older than 24 hours are not sent.
11. Confirm no token, cron secret, service-role key, full chat ID, raw Telegram error, or raw Supabase error appears in responses.
12. Confirm the manual "Check due reminders now" button still works.
13. Confirm "Send test message" still works.

## Validation Results

| Command | Result | Notes |
|---|---|---|
| `npm.cmd run lint` | Passed | TypeScript build check completed. |
| `npm.cmd run build` | Passed | Vite production build completed. |
| `git diff --check` | Passed | No whitespace errors; Git reported an LF/CRLF working-copy warning for `.env.example` only. |

## Risks / TODOs

- cron-job.org is external and best-effort.
- Delivery is approximate to the cron frequency, not exact to the second.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must remain server-side only.
- The scheduled endpoint currently uses `Asia/Jerusalem`; storing per-user timezone is a future improvement.
- Vercel/Supabase free-tier limits may apply.
