# Phase 8.2.6 Telegram Scheduler QA Report

## Purpose

This report records the successful QA result for the Phase 8.2.6 scheduled Telegram reminder endpoint.

The scheduled endpoint is intended for cron-job.org to call automatically every few minutes so Telegram reminders can be sent without a user clicking "Check due reminders now".

## Environment

- Environments used: Vercel Preview and the current deployment/production URL
- Endpoint tested: `POST /api/telegram/reminders/scheduled-check`
- Test methods: manual CMD request and cron-job.org Test Run
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

## Successful cron-job.org Automation Result

cron-job.org Test Run succeeded against the Vercel Preview scheduled endpoint.

A real future reminder was created, and Telegram delivered the reminder notification automatically without CMD and
without clicking "Check due reminders now".

This confirms the scheduled Telegram automation works end-to-end.

After cron-job.org is configured, CMD is no longer needed for routine scheduled reminder delivery checks. Manual CMD
requests may still be useful for troubleshooting.

## Production cron-job.org Verification

After the branch was merged and the deployment target changed, the cron-job.org URL was updated from the Preview URL to
the current deployment/production URL as needed.

The updated cron-job.org Test Run succeeded. This confirms the scheduled Telegram endpoint is reachable from
cron-job.org beyond Preview and that scheduled Telegram reminders are verified without CMD and without clicking the
manual "Check due reminders now" button.

Duplicate prevention should remain verified by repeated cron-job.org Test Run after an automatic delivery.

## Confirmed Behavior

- Vercel Preview endpoint deployed and responded.
- Vercel Protection Bypass worked for Preview access.
- Production/updated cron-job.org Test Run succeeded.
- `TELEGRAM_CRON_SECRET` authorization worked.
- `SUPABASE_SERVICE_ROLE_KEY` worked server-side.
- Service-role grants fixed the previous `42501` settings-load failure.
- The scheduled endpoint can read enabled notification settings.
- The scheduled endpoint can read eligible reminders.
- cron-job.org automation succeeded.
- A real reminder notification was delivered automatically.
- Scheduled Telegram reminders are verified without CMD and without the manual reminder-check button.
- Duplicate prevention works.
- Previously delivered reminder occurrences were counted as `skipped_duplicate`.
- Duplicate prevention should also be verified by a repeated cron-job.org run after an automatic delivery.
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

The scheduler is ready for demo with cron-job.org automation.

Recommended cron-job.org configuration:

- Method: `POST`
- URL: Vercel deployment URL plus `/api/telegram/reminders/scheduled-check`
- Header: `X-Telegram-Cron-Secret: <secret>`
- Frequency: every 5 minutes for demo/safety

If Vercel Preview protection remains enabled, cron-job.org also needs the Vercel Protection Bypass configuration used during QA. For Production, use the production endpoint and the app-level cron secret.

The cron-job.org URL has been updated from the Preview URL to the current deployment/production URL as needed.

The manual "Check due reminders now" button remains available only as a demo/manual fallback and troubleshooting tool.

## Remaining Limitation

Delivery timing depends on cron-job.org frequency and availability.

For the current demo scope, the current 5-minute interval is acceptable. The app does not guarantee exact-to-the-second reminder delivery.

## Validation Results

| Command | Result | Notes |
|---|---|---|
| `npm.cmd run lint` | Passed | TypeScript build check completed. |
| `npm.cmd run build` | Passed | Vite production build completed. |
| `git diff --check` | Passed | No whitespace errors. |
