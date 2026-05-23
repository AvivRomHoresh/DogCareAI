# Phase 8.2.6 Telegram Scheduler QA Report

## Purpose

This report records the successful QA result for the Phase 8.2.6 scheduled Telegram reminder endpoint.

The scheduled endpoint is intended for cron-job.org to call automatically every few minutes so Telegram reminders can be sent without a user clicking "Check due reminders now".

## Environment

- Environment used: Vercel Preview
- Endpoint tested: `POST /api/telegram/reminders/scheduled-check`
- Test method: manual CMD request
- Vercel Protection Bypass: required for external automation access during Preview testing
- App endpoint secret: `TELEGRAM_CRON_SECRET` required
- Supabase elevated access: `SUPABASE_SERVICE_ROLE_KEY` configured server-side only
- Service-role grants migration: applied manually in Supabase

No secrets, tokens, service-role keys, bot tokens, cron secrets, or full chat IDs are recorded in this report.

## Issue Resolved

The scheduled endpoint previously reached Supabase but failed while loading `notification_settings` with:

```text
load_settings_failed_42501
```

The `42501` permission-denied failure was resolved after manually applying:

```text
supabase/migrations/20260523_phase_8_telegram_service_role_grants.sql
```

This confirms the scheduled endpoint can now read the required settings/reminder tables and insert delivery records through the narrow service-role grants.

## Successful CMD Result

The scheduled endpoint returned success with the following safe count result:

```json
{
  "users_checked": 1,
  "reminders_checked": 4,
  "sent": 0,
  "skipped_duplicate": 4,
  "skipped": 0,
  "capped": false,
  "diagnostic": null
}
```

## Confirmed Behavior

- Vercel Preview endpoint deployed and responded.
- Vercel Protection Bypass worked for Preview access.
- `TELEGRAM_CRON_SECRET` authorization worked.
- `SUPABASE_SERVICE_ROLE_KEY` worked server-side.
- Service-role grants fixed the previous `42501` settings-load failure.
- The scheduled endpoint can read enabled notification settings.
- The scheduled endpoint can read eligible reminders.
- Duplicate prevention works.
- Previously delivered reminder occurrences were counted as `skipped_duplicate`.
- No phone number was collected.
- No frontend secrets were added.
- No `VITE_TELEGRAM_BOT_TOKEN` was added.
- No `VITE_TELEGRAM_CRON_SECRET` was added.
- No `VITE_SUPABASE_SERVICE_ROLE_KEY` was added.

## Security Notes

- Telegram bot token remains server-side only.
- Cron secret remains server-side only.
- Supabase service-role key remains server-side only.
- The scheduled endpoint returns safe counts and diagnostics only.
- The QA result did not expose secrets, raw Supabase errors, raw Telegram errors, stack traces, or full chat IDs.

## cron-job.org Readiness

The scheduler is ready for cron-job.org setup.

Recommended cron-job.org configuration:

- Method: `POST`
- URL: Vercel deployment URL plus `/api/telegram/reminders/scheduled-check`
- Header: `X-Telegram-Cron-Secret: <secret>`
- Frequency: every 5 minutes for demo/safety

If Vercel Preview protection remains enabled, cron-job.org also needs the Vercel Protection Bypass configuration used during QA. For Production, use the production endpoint and the app-level cron secret.

## Remaining Limitation

Delivery timing depends on cron-job.org frequency and availability.

For the current demo scope, a 5-minute interval is acceptable. The app does not guarantee exact-to-the-second reminder delivery.

## Validation Results

| Command | Result | Notes |
|---|---|---|
| `npm.cmd run lint` | Passed | TypeScript build check completed. |
| `npm.cmd run build` | Passed | Vite production build completed. |
| `git diff --check` | Passed | No whitespace errors. |
