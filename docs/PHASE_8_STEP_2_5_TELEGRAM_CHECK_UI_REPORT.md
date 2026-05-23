# Phase 8.2.5 Telegram Reminder Check UI Report

## Step Goal

Wire the existing Telegram reminders settings card to the existing reminder check API with a user-triggered action.

This step does not implement scheduler/cron, automatic app-load sending, polling, SMS, WhatsApp, email providers, browser notifications, phone-number collection, paid services, schema/RLS changes, or Gemini architecture changes.

## Files Changed

- `src/components/TelegramReminderSettingsCard.tsx`
- `docs/PHASE_8_STEP_2_5_TELEGRAM_CHECK_UI_REPORT.md`

## UI Added

Added a "Check due reminders now" button to the Telegram reminders card on `/reminders`.

Added helper text:

```text
The reminder check runs only when you click it while the app is open. It does not run in the background yet.
```

The existing feedback area now can show API count details:

- checked
- sent
- skipped duplicate
- skipped

## API Call Behavior

The button calls:

- `POST /api/telegram/reminders/check`

Request behavior:

- Uses the current Supabase access token.
- Sends `Authorization: Bearer <access_token>`.
- Sends `Content-Type: application/json`.
- Sends JSON body:

```json
{ "timeZone": "resolved browser timezone" }
```

The timezone value comes from:

```ts
Intl.DateTimeFormat().resolvedOptions().timeZone
```

If the API returns count fields, the UI displays them in a compact result summary.

If the local Vite dev server returns a non-JSON response because the Vercel API route is unavailable, the UI shows a
friendly message telling the tester to use Vercel Preview or `vercel dev` for Telegram delivery testing.

## Validation Rules

The check action requires:

- saved Telegram settings,
- no unsaved changes,
- Telegram enabled,
- reminder notifications enabled,
- saved non-empty chat ID,
- current Supabase access token.

The check button is disabled while loading settings, saving settings, sending a test message, or checking reminders.

## Security Notes

- No `TELEGRAM_BOT_TOKEN` is referenced in frontend code.
- No `VITE_TELEGRAM_BOT_TOKEN` was added.
- The frontend sends only the Supabase access token to the app's own API route.
- The frontend does not send or expose Telegram bot tokens.
- Chat IDs are not logged.
- The check happens only after explicit user click.
- There is no polling, interval, app-load send, or background delivery.

## What Was Intentionally Not Implemented

- No scheduler.
- No cron route.
- No automatic reminder checks on page load.
- No polling or intervals.
- No SMS.
- No WhatsApp.
- No email provider.
- No browser notifications.
- No phone-number collection.
- No paid services.
- No schema/RLS changes.
- No Gemini architecture changes.

## Manual QA Steps

1. Sign in with a generic QA account.
2. Open `/reminders`.
3. Confirm the Telegram reminders card includes "Check due reminders now".
4. Confirm the helper text explains this only runs while the app is open after a click.
5. Try checking before saving settings and confirm a friendly validation message.
6. Save Telegram settings with Telegram enabled, reminder notifications enabled, and a valid chat ID.
7. Click "Check due reminders now".
8. Confirm the browser calls `/api/telegram/reminders/check`.
9. Confirm the request includes `Authorization: Bearer <access_token>`.
10. Confirm the request body includes a `timeZone`.
11. Confirm the response message appears in the UI.
12. Confirm counts display when returned by the API.
13. Confirm no Telegram bot token appears in browser-visible surfaces.
14. Confirm existing reminder create/edit/complete/delete still works.
15. In local Vite dev without Vercel functions, confirm unavailable API routes show the friendly Vercel Preview /
    `vercel dev` guidance instead of raw HTML or a generic error.

## Validation Results

| Command | Result | Notes |
|---|---|---|
| `npm.cmd run lint` | Passed | TypeScript build check completed. |
| `npm.cmd run build` | Passed | Vite production build completed. |
| `git diff --check` | Passed | No whitespace errors; Git reported an LF/CRLF working-copy warning for `src/components/TelegramReminderSettingsCard.tsx` only. |

## Risks / TODOs

- Full delivery still requires `TELEGRAM_BOT_TOKEN` configured server-side.
- Local Vite dev does not run Vercel API routes by itself; use Vercel Preview or `vercel dev` for end-to-end Telegram
  delivery testing.
- The route checks reminders only after explicit user click.
- The app still does not send Telegram reminders while closed.
- Scheduler/cron remains deferred and would need separate approval.
