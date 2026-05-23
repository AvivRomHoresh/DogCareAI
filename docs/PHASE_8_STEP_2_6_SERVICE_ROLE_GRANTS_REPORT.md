# Phase 8.2.6 Service Role Grants Report

## Purpose

This report documents the minimal Supabase grant migration for the scheduled Telegram reminder endpoint.

The scheduled endpoint was reaching Supabase with `SUPABASE_SERVICE_ROLE_KEY`, but loading `notification_settings`
returned diagnostic `load_settings_failed_42501`, which indicates permission denied.

## Migration Name

```text
supabase/migrations/20260523_phase_8_telegram_service_role_grants.sql
```

## Why This Migration Was Needed

The Phase 8.2.1 Telegram schema migration granted table access to `authenticated` for the app-open/manual Telegram
flows.

The Phase 8.2.6 scheduled endpoint is not called with a logged-in user's JWT. It uses server-side service-role access to
scan enabled notification settings across users. The scheduled endpoint therefore needs explicit database privileges for
the `service_role` role on the small set of tables it reads and writes.

## Exact Tables Granted

The migration grants `service_role` access only to:

- `public.notification_settings`
- `public.reminders`
- `public.dogs`
- `public.telegram_notification_deliveries`

## Exact Privileges Granted

Schema:

- `grant usage on schema public to service_role`

Read access:

- `grant select on table public.notification_settings to service_role`
- `grant select on table public.reminders to service_role`
- `grant select on table public.dogs to service_role`
- `grant select on table public.telegram_notification_deliveries to service_role`

Write access:

- `grant insert on table public.telegram_notification_deliveries to service_role`

## Security Notes

- No RLS policies were changed.
- RLS was not disabled.
- Existing table structure was not changed.
- No permissions were granted to `anon`.
- No permissions were granted to `authenticated`.
- No update/delete privileges were granted to `service_role`.
- No frontend code was changed.
- No secrets were added to the repository.
- `SUPABASE_SERVICE_ROLE_KEY` must remain server-side only in Vercel Environment Variables.
- The scheduled endpoint must continue constraining access in code to enabled Telegram notification settings and matching user reminders.

## What Was Intentionally Not Changed

- No schema changes.
- No RLS policy changes.
- No frontend changes.
- No manual `/api/telegram/reminders/check` changes.
- No `/api/telegram/test` changes.
- No scheduler logic changes.
- No cron-job.org configuration changes.
- No broad grants beyond the scheduled endpoint's required tables.

## Validation Results

| Command | Result | Notes |
|---|---|---|
| `npm.cmd run lint` | Passed | TypeScript build check completed. |
| `npm.cmd run build` | Passed | Vite production build completed. |
| `git diff --check` | Passed | No whitespace errors. |

## Manual Supabase Application Instructions

Apply this migration manually in the Supabase SQL Editor:

```text
supabase/migrations/20260523_phase_8_telegram_service_role_grants.sql
```

After applying, do not print or expose `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CRON_SECRET`, or full Telegram chat IDs.

## QA Steps After Applying The Migration

1. Confirm the migration runs successfully in Supabase SQL Editor.
2. Call `GET /api/telegram/reminders/scheduled-check` and confirm method-not-allowed safe JSON.
3. Call `POST /api/telegram/reminders/scheduled-check` without the cron secret and confirm unauthorized safe JSON.
4. Call `POST /api/telegram/reminders/scheduled-check` with the correct cron secret.
5. Confirm `load_settings_failed_42501` no longer appears.
6. Confirm enabled Telegram notification settings are processed.
7. Confirm eligible reminders send Telegram notifications.
8. Confirm duplicate sends are skipped.
9. Confirm completed reminders are not sent.
10. Confirm no secrets, raw Supabase errors, raw Telegram errors, stack traces, or full chat IDs appear in responses.

## Risks / TODOs

- `service_role` bypasses RLS, so the scheduled endpoint must remain tightly constrained in code.
- The migration should be applied only after review.
- If `load_settings_failed_42501` persists after applying this migration, verify that Vercel's `SUPABASE_SERVICE_ROLE_KEY` belongs to the same Supabase project as the configured Supabase URL.
