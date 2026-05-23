-- DogCareAI Phase 8.2.6
-- Minimal service_role grants for the scheduled Telegram reminder endpoint.
-- Review this file before applying it manually in the Supabase SQL Editor.

grant usage on schema public to service_role;

grant select on table public.notification_settings to service_role;
grant select on table public.reminders to service_role;
grant select on table public.dogs to service_role;
grant select on table public.telegram_notification_deliveries to service_role;

grant insert on table public.telegram_notification_deliveries to service_role;
