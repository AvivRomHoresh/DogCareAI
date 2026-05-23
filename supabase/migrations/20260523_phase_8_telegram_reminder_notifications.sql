-- DogCareAI Phase 8.2.1
-- Telegram reminder notification settings and delivery tracking.
-- Review this file before applying it manually in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  telegram_chat_id text,
  telegram_enabled boolean not null default false,
  reminder_notifications_enabled boolean not null default false,
  notify_minutes_before integer not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_settings_user_id_unique unique (user_id),
  constraint notification_settings_chat_id_not_empty check (
    telegram_chat_id is null or length(trim(telegram_chat_id)) > 0
  ),
  constraint notification_settings_notify_minutes_valid check (
    notify_minutes_before in (0, 15, 30, 60)
  ),
  constraint notification_settings_telegram_enabled_requires_chat_id check (
    not telegram_enabled
    or (telegram_chat_id is not null and length(trim(telegram_chat_id)) > 0)
  ),
  constraint notification_settings_reminders_require_telegram_enabled check (
    not reminder_notifications_enabled or telegram_enabled
  )
);

create table public.telegram_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  reminder_id uuid not null references public.reminders(id) on delete cascade,
  notification_kind text not null,
  reminder_scheduled_at timestamptz not null,
  sent_at timestamptz not null default now(),
  telegram_message_id text,
  created_at timestamptz not null default now(),
  constraint telegram_notification_deliveries_kind_valid check (
    notification_kind in ('reminder_due', 'reminder_upcoming', 'reminder_missed')
  ),
  constraint telegram_notification_deliveries_message_id_not_empty check (
    telegram_message_id is null or length(trim(telegram_message_id)) > 0
  ),
  constraint telegram_notification_deliveries_unique_occurrence unique (
    user_id,
    reminder_id,
    notification_kind,
    reminder_scheduled_at
  )
);

create index notification_settings_user_id_idx
on public.notification_settings (user_id);

create index telegram_notification_deliveries_user_id_idx
on public.telegram_notification_deliveries (user_id);

create index telegram_notification_deliveries_reminder_id_idx
on public.telegram_notification_deliveries (reminder_id);

create index telegram_notification_deliveries_user_id_sent_at_idx
on public.telegram_notification_deliveries (user_id, sent_at);

create trigger notification_settings_set_updated_at
before update on public.notification_settings
for each row execute function public.set_updated_at();

alter table public.notification_settings enable row level security;
alter table public.telegram_notification_deliveries enable row level security;

create policy "Notification settings are selectable by owner"
on public.notification_settings
for select
to authenticated
using (user_id = auth.uid());

create policy "Notification settings are insertable by owner"
on public.notification_settings
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Notification settings are updatable by owner"
on public.notification_settings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Notification settings are deletable by owner"
on public.notification_settings
for delete
to authenticated
using (user_id = auth.uid());

create policy "Telegram deliveries are selectable by owner"
on public.telegram_notification_deliveries
for select
to authenticated
using (user_id = auth.uid());

create policy "Telegram deliveries are insertable for owned reminders"
on public.telegram_notification_deliveries
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.reminders
    where reminders.id = telegram_notification_deliveries.reminder_id
      and reminders.user_id = auth.uid()
      and reminders.dog_id = telegram_notification_deliveries.dog_id
  )
  and exists (
    select 1
    from public.dogs
    where dogs.id = telegram_notification_deliveries.dog_id
      and dogs.user_id = auth.uid()
  )
);

-- Authenticated frontend users and authenticated server-side requests using the
-- user's JWT need table grants to reach these tables through the Supabase Data API.
-- RLS above still controls row-level access. Anonymous users should not access
-- notification settings or delivery records.
grant usage on schema public to authenticated;

revoke all privileges on table public.notification_settings from authenticated;
revoke all privileges on table public.telegram_notification_deliveries from authenticated;

revoke all privileges on table public.notification_settings from anon;
revoke all privileges on table public.telegram_notification_deliveries from anon;

grant select, insert, update, delete on public.notification_settings to authenticated;
grant select, insert on public.telegram_notification_deliveries to authenticated;
