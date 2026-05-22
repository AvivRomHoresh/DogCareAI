# Phase 8.2.1 Telegram Reminder Schema + RLS Report

## Step Goal

Add only the minimal Supabase schema and Row-Level Security needed for the Telegram Reminder Notifications MVP.

This step does not implement UI, Telegram API routes, Telegram message sending, bot-token configuration, or reminder notification logic.

## Migration Name

- `supabase/migrations/20260523_phase_8_telegram_reminder_notifications.sql`

## Tables Added

### `public.notification_settings`

Purpose: store Telegram reminder notification preferences for each authenticated user.

Fields:

- `id`
- `user_id`
- `telegram_chat_id`
- `telegram_enabled`
- `reminder_notifications_enabled`
- `notify_minutes_before`
- `created_at`
- `updated_at`

Constraints:

- One row per user through `notification_settings_user_id_unique`.
- `telegram_chat_id` may be null, but cannot be blank when present.
- `notify_minutes_before` must be one of `0`, `15`, `30`, or `60`.
- `telegram_enabled = true` requires a non-empty `telegram_chat_id`.
- `reminder_notifications_enabled = true` requires `telegram_enabled = true`.

### `public.telegram_notification_deliveries`

Purpose: track sent Telegram reminder notifications and prevent duplicate sends for the same reminder occurrence.

Fields:

- `id`
- `user_id`
- `dog_id`
- `reminder_id`
- `notification_kind`
- `reminder_scheduled_at`
- `sent_at`
- `telegram_message_id`
- `created_at`

Constraints:

- `dog_id` references `public.dogs(id)` with `on delete cascade`.
- `reminder_id` references `public.reminders(id)` with `on delete cascade`.
- `notification_kind` must be one of:
  - `reminder_due`
  - `reminder_upcoming`
  - `reminder_missed`
- `telegram_message_id` may be null, but cannot be blank when present.

## RLS Policies

RLS is enabled on both new tables.

`notification_settings` policies:

- Authenticated users can select only rows where `user_id = auth.uid()`.
- Authenticated users can insert only rows where `user_id = auth.uid()`.
- Authenticated users can update only rows where `user_id = auth.uid()`.
- Authenticated users can delete only rows where `user_id = auth.uid()`.

`telegram_notification_deliveries` policies:

- Authenticated users can select only delivery records where `user_id = auth.uid()`.
- Authenticated users can insert delivery records only when:
  - `user_id = auth.uid()`,
  - the referenced reminder belongs to the authenticated user,
  - the referenced reminder's `dog_id` matches the delivery `dog_id`,
  - the referenced dog belongs to the authenticated user.

The delivery table intentionally grants only `select` and `insert` to authenticated users. It does not grant update or delete because delivery rows are intended to be lightweight send records for duplicate prevention.

## Duplicate Prevention Rule

`telegram_notification_deliveries` includes a unique constraint on:

- `user_id`
- `reminder_id`
- `notification_kind`
- `reminder_scheduled_at`

This prevents duplicate Telegram sends for the same user, reminder, notification type, and scheduled occurrence.

## Security Notes

- No Telegram bot token is stored in the database.
- No phone number field was added.
- The schema stores Telegram `chat_id`, not phone numbers.
- Anonymous users have no table privileges on the new tables.
- Authenticated access remains owner-scoped through RLS.
- The future server-side Telegram API should continue to use the authenticated user's Supabase JWT/RLS path where practical.
- `SUPABASE_SERVICE_ROLE_KEY` is not required for this app-open MVP schema.

## What Was Intentionally Not Added

- No UI.
- No Telegram API route.
- No Telegram message sending.
- No Telegram bot token environment variable.
- No frontend Telegram secret.
- No SMS.
- No WhatsApp.
- No email reminder service.
- No scheduler or cron endpoint.
- No service-role usage.
- No changes to existing `profiles`, `dogs`, or `reminders` tables.
- No changes to existing RLS policies.
- No reminder CRUD behavior changes.
- No Gemini architecture changes.

## Validation Results

| Command | Result | Notes |
|---|---|---|
| `npm.cmd run lint` | Passed | TypeScript build check completed. |
| `npm.cmd run build` | Passed | Vite production build completed. |
| `git diff --check` | Passed | No whitespace errors reported. |
| Supabase schema validation | Not run | No local Supabase validation command is configured in the project. Migration is prepared for manual Supabase SQL Editor review/application. |

## Risks / TODOs

- The migration must be reviewed and manually applied in Supabase before Telegram UI/API work depends on it.
- The future API route must avoid returning or logging the Telegram bot token.
- The future UI should explain that Telegram uses `chat_id` and does not collect phone numbers.
- The app-open MVP will not send notifications while the user never opens the app.
- A future external scheduler would require a separate approved design, especially if it needs elevated server-side access.
