# Phase 8.2.6 Plan: Automatic Telegram Reminder Scheduler

## Goal

Phase 8.2.6 should add automatic Telegram reminder sending through a scheduled server-side endpoint.

The current Telegram MVP already supports:

- saving Telegram reminder settings,
- sending a Telegram test message,
- manually checking due reminders,
- sending upcoming/missed reminder messages,
- preventing duplicate sends through `telegram_notification_deliveries`.

This step plans the next layer: a scheduled check that can run without user clicks.

## Proposed Scheduler

Use [cron-job.org](https://cron-job.org/) to call a protected Vercel API route.

Recommended demo/safety frequency:

- every 5 minutes.

Why cron-job.org:

- it is external and free,
- it avoids Vercel Cron limitations on the Hobby plan,
- it can call a URL owned by this project,
- it keeps the project free and demo-friendly.

Do not use Vercel Cron for frequent reminders on the Hobby plan because it is limited to daily cron jobs.

## Proposed Endpoint

Recommended endpoint:

```text
POST /api/telegram/reminders/scheduled-check
```

Purpose:

- scan enabled Telegram reminder settings,
- find eligible reminders,
- send Telegram notifications server-side,
- record successful deliveries,
- return safe counts.

The existing manual endpoint should remain available:

```text
POST /api/telegram/reminders/check
```

The manual button remains useful for demo, troubleshooting, and user-triggered checks.

## Endpoint Authentication

The scheduled endpoint must be protected by a server-side secret:

```text
TELEGRAM_CRON_SECRET
```

cron-job.org should send the secret in a request header:

```text
X-Telegram-Cron-Secret: <secret>
```

The endpoint must:

- accept only `POST`,
- reject missing secrets,
- reject incorrect secrets,
- never return the configured secret,
- never expose the secret in frontend code,
- never use a `VITE_` prefix for this secret.

Do not create:

```text
VITE_TELEGRAM_CRON_SECRET
```

## Supabase Access Model

The scheduled endpoint is not called by a logged-in user, so it cannot rely on a user Supabase access token.

Recommended implementation model:

- use a server-side Supabase elevated key only if required to scan multiple users,
- keep that key only in Vercel Environment Variables,
- do not expose it to frontend code,
- do not use a `VITE_` prefix,
- constrain every query in code as tightly as possible.

Likely required server-side variable:

```text
SUPABASE_SERVICE_ROLE_KEY
```

Important risk:

- Supabase service-role access bypasses RLS.

Mitigation:

- use it only inside the protected scheduled Vercel Function,
- require `TELEGRAM_CRON_SECRET`,
- query only the specific tables and columns needed,
- process only users with enabled Telegram reminder settings,
- never return user data, chat IDs, reminder text beyond safe counts, raw errors, or secrets.

If implementation can safely avoid service-role access, prefer the safer alternative. However, scanning reminders across users usually requires server-side elevated access.

## Query Strategy

Load notification settings where:

- `telegram_enabled = true`,
- `reminder_notifications_enabled = true`,
- `telegram_chat_id is not null`.

For each enabled user, load eligible reminders where:

- reminder belongs to that user,
- reminder is not completed,
- `scheduled_at` is not null,
- `scheduled_at` is within the notification window:
  - from `now - 24 hours`,
  - to `now + notify_minutes_before`.

Respect each user's `notify_minutes_before` value:

- `0` means due/missed only,
- `15`, `30`, or `60` allow upcoming reminders inside that future window.

Use the same notification kinds as the manual endpoint:

- `reminder_upcoming` for future reminders inside the notify-before window,
- `reminder_missed` for reminders whose scheduled time already passed.

Keep duplicate prevention with:

- `user_id`,
- `reminder_id`,
- `notification_kind`,
- `reminder_scheduled_at`.

Editing the same reminder to a new future `scheduled_at` should be treated as a new occurrence because the unique delivery key includes `reminder_scheduled_at`.

## Safety Limits

The scheduled endpoint should include conservative limits:

- max users per run,
- max notifications per run,
- max notifications per user per run.

Recommended initial limits:

- max users per run: 50,
- max notifications per run: 50,
- max notifications per user per run: 5.

The endpoint response should include safe counts only, for example:

- `users_checked`,
- `reminders_checked`,
- `sent`,
- `skipped_duplicate`,
- `skipped`,
- `errors`.

Do not include:

- bot token,
- cron secret,
- service-role key,
- full chat IDs,
- raw Telegram response bodies,
- raw Supabase errors,
- stack traces.

Messages should remain short and safe, matching the manual reminder check style.

## Timezone

The scheduled endpoint cannot reliably know each user's browser timezone.

Recommended MVP fallback:

```text
Asia/Jerusalem
```

Future improvement:

- add a `timezone` field to `notification_settings`,
- save the user's browser timezone from the settings UI,
- use that value for Telegram message formatting.

Do not add the timezone field in the planning step. If added later, it should be a separate approved schema change.

## cron-job.org Setup Guide

1. Create or sign in to a cron-job.org account.
2. Create a new cron job.
3. Set URL to the Vercel deployment URL plus:

   ```text
   /api/telegram/reminders/scheduled-check
   ```

4. Set method:

   ```text
   POST
   ```

5. Add request header:

   ```text
   X-Telegram-Cron-Secret: <secret>
   ```

6. Set schedule:

   ```text
   every 5 minutes
   ```

7. Expected successful response:

   ```json
   {
     "success": true,
     "message": "Scheduled Telegram reminder check complete.",
     "users_checked": 1,
     "reminders_checked": 2,
     "sent": 1,
     "skipped_duplicate": 1,
     "skipped": 0,
     "errors": 0
   }
   ```

The exact counts may differ by data. The response must remain secret-free.

## QA Checklist

- Secret missing -> request rejected with safe JSON.
- Wrong secret -> request rejected with safe JSON.
- Correct secret -> scheduled check runs.
- Eligible future reminder -> Telegram notification sent.
- Second cron call for same reminder occurrence -> duplicate skipped.
- Completed reminder -> not sent.
- Missed reminder within 24 hours -> sent once.
- Missed reminder older than 24 hours -> skipped.
- User with Telegram disabled -> skipped.
- User with reminder notifications disabled -> skipped.
- User with missing chat ID -> skipped.
- Telegram API failure -> skipped/error count, no raw Telegram body exposed.
- Supabase error -> safe error count/message, no raw secret exposed.
- Response includes counts only.
- No token, cron secret, service-role key, or full chat ID appears in response.
- Existing manual "Check due reminders now" button still works.
- Existing "Send test message" button still works.
- Existing reminder create/edit/complete/delete still works.

## Risks And Limitations

| Risk | Mitigation |
|---|---|
| cron-job.org is external and best-effort | Document that delivery is not guaranteed to the exact minute. |
| Vercel/Supabase free-tier limits may apply | Use conservative max users/notifications per run. |
| Service-role key bypasses RLS | Use only in server-side protected endpoint; constrain queries carefully. |
| App depends on Vercel deployment availability | Keep manual check as a fallback/demo tool. |
| No exact-to-the-second delivery | Every 5 minutes is acceptable for demo. |
| Timezone is approximate | Use `Asia/Jerusalem` for MVP and document future timezone storage. |
| Duplicate notifications | Keep `telegram_notification_deliveries` unique key and skip duplicates. |
| Secret leakage risk | Never expose cron secret, bot token, service-role key, or full chat IDs. |

## Implementation Order

1. Approve this plan.
2. Add server-side env placeholders to `.env.example`:
   - `TELEGRAM_CRON_SECRET=`
   - `SUPABASE_SERVICE_ROLE_KEY=`, only if implementation requires it and project policy allows it.
3. Add `POST /api/telegram/reminders/scheduled-check`.
4. Protect the endpoint with `X-Telegram-Cron-Secret`.
5. Reuse reminder selection/send helper logic where practical.
6. Keep the manual authenticated check endpoint working.
7. Add conservative per-run and per-user limits.
8. Return safe count-only JSON.
9. Run:
   - `npm.cmd run lint`
   - `npm.cmd run build`
   - `git diff --check`
10. Push to Vercel Preview.
11. Configure cron-job.org against the Preview URL first.
12. Run end-to-end scheduled QA.
13. Document final implementation and QA results.

## Recommended Implementation Approach

Proceed with a protected Vercel Function called by cron-job.org every 5 minutes.

Use:

- `TELEGRAM_CRON_SECRET` for endpoint authentication,
- `TELEGRAM_BOT_TOKEN` for Telegram sends,
- `SUPABASE_SERVICE_ROLE_KEY` only if scanning multiple users cannot be done safely without it.

Keep the scheduled endpoint small, defensive, and count-oriented. Do not implement SMS, WhatsApp, email providers, browser notifications, paid APIs, or phone-number collection.
