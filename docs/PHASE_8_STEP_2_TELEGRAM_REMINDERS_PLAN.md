# Phase 8.2 Plan: Telegram Reminder Notifications MVP

## Goal

Phase 8.2 adds an external reminder notification channel for DogCareAI using Telegram.

This step responds to instructor feedback that reminders should be more useful and should notify users through an external channel such as Email, SMS, WhatsApp, or Telegram. Telegram is the selected MVP channel because it can satisfy the external notification requirement without SMS/WhatsApp per-message costs, without collecting phone numbers, and without exposing bot credentials in frontend code.

## Scope

Phase 8.2 should implement a small Telegram Reminder Notifications MVP:

- connect a Telegram `chat_id` to the authenticated DogCareAI user,
- enable or disable Telegram reminder notifications,
- send a test Telegram message after explicit user action,
- send due or upcoming reminder notifications through a secure server-side function,
- prevent duplicate sends for the same reminder occurrence,
- keep existing reminder create/edit/complete/delete behavior working,
- keep email/password authentication working,
- keep Mock Mode and the existing Assistant/Gemini boundary unchanged.

Browser Notifications may remain an optional local fallback only. They are not the primary Phase 8.2 feature.

## Non-Goals

Phase 8.2 should not implement:

- SMS reminders,
- WhatsApp reminders,
- full email reminder systems,
- paid notification services,
- phone-number collection,
- Instagram login,
- chat persistence,
- `ai_usage_logs` persistence,
- Gemini architecture changes,
- reminder marketplace/product integrations,
- background AI jobs,
- medical diagnosis,
- broad reminder redesign.

## Why Telegram

Telegram was chosen because:

- it satisfies the instructor request for an external notification channel,
- Telegram Bot API can be used without per-message SMS/WhatsApp billing,
- the app can use Telegram `chat_id` instead of collecting phone numbers,
- the bot token can stay server-side in `TELEGRAM_BOT_TOKEN`,
- the implementation can follow the existing Vercel Function security pattern already used by `/api/assistant`,
- the app can remain free/demo-friendly.

## Proposed UX

Add a small Telegram notifications setup surface, preferably on the Reminders page first. If a Settings page is approved later, this setup can move there.

Recommended UI:

- A "Telegram reminders" card on `/reminders`.
- Short explanation:
  - Telegram reminders use a bot and a Telegram chat ID.
  - DogCareAI does not collect phone numbers.
  - Telegram setup is optional.
- Fields and controls:
  - Telegram chat ID input.
  - Enable Telegram reminders toggle.
  - Optional notify-before setting, such as 15 minutes, 30 minutes, 1 hour, or due now only.
  - Save settings button.
  - Send test message button.
  - Check due reminders now button, if useful for demo.
- Friendly states:
  - not connected,
  - connected/enabled,
  - disabled,
  - saving,
  - sending test,
  - missing bot configuration,
  - invalid chat ID or Telegram send failure.

Setup instructions should tell the user to start the DogCareAI Telegram bot before sending test messages. The app should not ask for a phone number.

## Data Model Recommendation

### Recommended MVP With Schema Changes

For a reliable MVP, add small RLS-protected tables.

Recommended table: `public.notification_settings`

Suggested fields:

- `id`
- `user_id`
- `telegram_chat_id`
- `telegram_enabled`
- `reminder_notifications_enabled`
- `notify_minutes_before`
- `created_at`
- `updated_at`

Recommended table: `public.telegram_notification_deliveries`

Suggested fields:

- `id`
- `user_id`
- `dog_id`
- `reminder_id`
- `notification_kind`
- `reminder_scheduled_at`
- `sent_at`
- `telegram_message_id`, nullable
- `created_at`

RLS:

- Authenticated users can select, insert, update, and delete only their own `notification_settings`.
- Authenticated users can select their own delivery records.
- Inserts for delivery records should be server-mediated where practical.
- Policies must keep `user_id = auth.uid()` as the ownership boundary.

Duplicate prevention:

- Add a uniqueness rule or server check for a logical key such as:
  - `user_id`,
  - `reminder_id`,
  - `notification_kind`,
  - `reminder_scheduled_at`.

This schema is more work than local-only storage, but it is safer, cross-device, easier to QA, and better aligned with real external notifications.

### No-Schema Alternative And Tradeoff

It is technically possible to avoid schema changes by storing the Telegram chat ID in `localStorage` and passing it to a server function with each send request.

This is not recommended for the main MVP because:

- settings become browser-specific,
- cross-device reminders do not work,
- duplicate prevention becomes weak,
- chat ID handling is harder to audit,
- the demo feels less like a real external-notification feature.

If the deadline becomes too tight, the no-schema approach can be used only as a temporary demo fallback and should be documented honestly.

## Server-Side Function / API Recommendation

Use a minimal Vercel Function or small set of functions.

Recommended endpoints:

- `POST /api/telegram/test`
  - validates the Supabase user,
  - verifies saved Telegram settings belong to the user,
  - sends a test Telegram message,
  - returns a safe structured result.

- `POST /api/telegram/reminders/check`
  - validates the Supabase user,
  - loads the user's enabled Telegram settings,
  - loads due/upcoming reminders through RLS-safe Supabase access,
  - checks delivery records to prevent duplicate sends,
  - sends Telegram messages server-side,
  - records successful deliveries,
  - returns counts and safe status metadata.

The functions should:

- accept only `POST`,
- require `Authorization: Bearer <supabase_access_token>`,
- use Supabase anon/RLS flow where possible,
- never expose stack traces or secrets,
- never return the Telegram bot token,
- avoid logging full message payloads or chat IDs unless redacted,
- sanitize reminder text before sending,
- handle Telegram failures gracefully.

## Environment Variables Needed

Server-side only:

- `TELEGRAM_BOT_TOKEN`
- optional `TELEGRAM_NOTIFICATIONS_ENABLED`
- optional `TELEGRAM_CRON_SECRET`, only if an external scheduler is approved later.

Frontend-safe variables:

- none required for Telegram in the preferred design.

Do not create:

- `VITE_TELEGRAM_BOT_TOKEN`
- `VITE_TELEGRAM_*` values containing secrets
- any frontend-exposed bot credential

## Security Constraints

- The Telegram bot token must never be placed in frontend code.
- The Telegram bot token must never be returned in API responses.
- Do not commit real Telegram tokens.
- Do not collect phone numbers.
- Do not use SMS or WhatsApp providers.
- Validate the Supabase user before reading notification settings or reminders.
- Verify user ownership through RLS and `user_id`.
- Keep all Telegram sends behind a server-side function.
- Do not use Supabase service-role keys unless a later scheduler design is explicitly approved and documented.
- Do not send private medical details beyond the reminder title/type/date needed for the notification.
- Do not claim diagnosis or urgent medical triage through Telegram reminders.

## Duplicate-Notification Prevention

Duplicate prevention should be server-side, not only a frontend button guard.

Recommended behavior:

1. Determine the reminder occurrence being notified.
2. Build a stable logical delivery key from:
   - user ID,
   - reminder ID,
   - reminder scheduled time,
   - notification kind.
3. Check whether a delivery already exists.
4. If it exists, skip sending.
5. If it does not exist, send the Telegram message.
6. Record the delivery after success.

The frontend should still disable duplicate clicks while a check or test send is pending.

## App-Open MVP Behavior

The first MVP should not require an always-running backend or paid scheduler.

Recommended app-open behavior:

- When the user opens Dashboard or Reminders, do not send immediately on page load.
- Show a clear Telegram reminders card/status.
- Allow the user to click "Check due reminders now" for a deterministic demo.
- Optionally run a controlled check after the user is authenticated and Telegram is enabled, with a short cooldown to avoid repeated calls.
- Send only due/upcoming reminders that match the configured notify-before window.
- Completed reminders should not trigger Telegram notifications.
- Recurring reminders should use the current reminder row or occurrence time for duplicate prevention.

This keeps the MVP free and avoids hidden background behavior.

## Optional External Scheduler Path

An external scheduler such as cron-job.org may be documented as a later optional improvement, not part of the first MVP.

Possible future path:

- cron-job.org calls a protected endpoint such as `/api/telegram/reminders/scheduled-check`.
- The endpoint requires `TELEGRAM_CRON_SECRET`.
- The design must decide how to scan eligible users safely.
- If scanning all users requires a Supabase service-role key, that must be explicitly approved, server-side only, and documented before implementation.

Because this adds operational and security complexity, Phase 8.2 should start with the app-open/user-triggered MVP.

## QA Checklist

Telegram setup:

- User can save a Telegram chat ID without entering a phone number.
- User can enable and disable Telegram reminder notifications.
- Invalid or missing chat ID shows a friendly error.
- Missing `TELEGRAM_BOT_TOKEN` shows a friendly server-side configuration message.
- Test message sends only after explicit user action.

Reminder behavior:

- Existing reminder create/edit/complete/delete still works.
- Upcoming reminder notification can be sent to Telegram.
- Completed reminders are not sent.
- Missed reminders are handled according to the documented MVP rule.
- Recurring reminders do not create duplicate notifications for the same occurrence.
- Duplicate clicks do not produce duplicate Telegram messages.

Security:

- Telegram bot token does not appear in browser source, frontend bundle, console, or network responses.
- No `VITE_TELEGRAM_BOT_TOKEN` exists.
- User A cannot read or send User B's Telegram settings or reminders.
- API routes require Supabase authentication.
- No phone number is collected.

Regression:

- Auth still works.
- Dog Profile still works.
- DogPicker active dog persistence still works.
- Reminders CRUD still works.
- Dashboard still works.
- Assistant Mock Mode still works.
- Assistant emergency flow still works.
- No direct browser Gemini provider call is introduced.

Validation:

- `npm.cmd run lint`
- `npm.cmd run build`
- targeted manual QA for Telegram setup and reminder sends.

## Risks And Fallbacks

| Risk | Mitigation |
|---|---|
| Telegram user has not started the bot | Show setup instructions and a clear failed-send message. |
| Chat ID setup is confusing | Keep instructions short, include a test message button, and avoid phone-number collection. |
| Telegram Bot API fails or rate-limits | Show a friendly fallback and do not break reminder CRUD. |
| Duplicate notifications | Use delivery records plus frontend in-flight guards. |
| Schema/RLS work adds complexity | Keep tables minimal and user-owned; defer scheduler until the MVP works. |
| App-open MVP does not send while app is closed | Document this honestly and keep optional scheduler as a later improvement. |
| External scheduler requires elevated access | Defer and require explicit approval before using service-role or cron secrets. |
| Deadline pressure | Implement connect, test message, and user-triggered due check first. |

## Implementation Order

1. Approve this plan.
2. Add a small RLS-protected notification settings migration.
3. Add delivery tracking for duplicate prevention.
4. Add server-side Telegram test-send function.
5. Add server-side due-reminder check/send function.
6. Add the Reminders page Telegram setup card.
7. Add user-triggered "Check due reminders now" behavior.
8. Update `.env.example`, README, and demo guide with server-side Telegram setup instructions.
9. Run lint/build and targeted manual QA.
10. Document Phase 8.2 implementation results.

## Recommended MVP Decision

Use Telegram as the primary Phase 8.2 external notification channel.

Use a server-side Vercel Function with `TELEGRAM_BOT_TOKEN`, RLS-protected notification settings, and delivery tracking for duplicate prevention.

Keep Browser Notifications as optional fallback only, and keep SMS, WhatsApp, and full email systems out of scope unless explicitly approved later.
