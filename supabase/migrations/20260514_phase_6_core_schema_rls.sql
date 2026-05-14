-- DogCareAI Phase 6 Step 3
-- Minimal beta schema for profiles, dogs, and reminders.
-- Review this file before applying it manually in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_user_id_unique unique (user_id)
);

create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  breed text,
  age numeric,
  weight numeric,
  gender text,
  profile_image_url text,
  medical_notes text,
  allergies text,
  vaccination_history text,
  feeding_preferences text,
  activity_level text,
  special_conditions text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dogs_name_not_empty check (length(trim(name)) > 0),
  constraint dogs_age_reasonable check (age is null or (age >= 0 and age <= 40)),
  constraint dogs_weight_reasonable check (weight is null or (weight > 0 and weight <= 200)),
  constraint dogs_activity_level_valid check (
    activity_level is null or activity_level in ('low', 'medium', 'high')
  ),
  constraint dogs_gender_valid check (
    gender is null or gender in ('male', 'female', 'unknown')
  )
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  type text not null,
  title text not null,
  scheduled_at timestamptz,
  recurring_frequency text not null default 'none',
  notes text,
  state text not null default 'upcoming',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reminders_title_not_empty check (length(trim(title)) > 0),
  constraint reminders_type_valid check (
    type in ('feeding', 'walk', 'medication', 'vaccination', 'grooming', 'general')
  ),
  constraint reminders_recurring_frequency_valid check (
    recurring_frequency in ('none', 'daily', 'weekly', 'monthly', 'yearly')
  ),
  constraint reminders_state_valid check (
    state in ('upcoming', 'completed', 'missed', 'snoozed')
  )
);

create index profiles_user_id_idx on public.profiles (user_id);

create index dogs_user_id_idx on public.dogs (user_id);
create index dogs_user_id_is_archived_idx on public.dogs (user_id, is_archived);

create index reminders_user_id_idx on public.reminders (user_id);
create index reminders_dog_id_idx on public.reminders (dog_id);
create index reminders_user_id_state_idx on public.reminders (user_id, state);
create index reminders_scheduled_at_idx on public.reminders (scheduled_at);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger dogs_set_updated_at
before update on public.dogs
for each row execute function public.set_updated_at();

create trigger reminders_set_updated_at
before update on public.reminders
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.dogs enable row level security;
alter table public.reminders enable row level security;

create policy "Profiles are selectable by owner"
on public.profiles
for select
to authenticated
using (user_id = auth.uid());

create policy "Profiles are insertable by owner"
on public.profiles
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Profiles are updatable by owner"
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Profiles are deletable by owner"
on public.profiles
for delete
to authenticated
using (user_id = auth.uid());

create policy "Dogs are selectable by owner"
on public.dogs
for select
to authenticated
using (user_id = auth.uid());

create policy "Dogs are insertable by owner"
on public.dogs
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Dogs are updatable by owner"
on public.dogs
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Dogs are deletable by owner"
on public.dogs
for delete
to authenticated
using (user_id = auth.uid());

create policy "Reminders are selectable by owner"
on public.reminders
for select
to authenticated
using (user_id = auth.uid());

create policy "Reminders are insertable for owned dogs"
on public.reminders
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.dogs
    where dogs.id = reminders.dog_id
      and dogs.user_id = auth.uid()
  )
);

create policy "Reminders are updatable for owned dogs"
on public.reminders
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.dogs
    where dogs.id = reminders.dog_id
      and dogs.user_id = auth.uid()
  )
);

create policy "Reminders are deletable by owner"
on public.reminders
for delete
to authenticated
using (user_id = auth.uid());

-- Authenticated frontend users need table grants to reach these tables through
-- the Supabase Data API. RLS above still controls row-level access.
-- Anonymous users should not access these beta data tables.
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.dogs to authenticated;
grant select, insert, update, delete on public.reminders to authenticated;

revoke all on public.profiles from anon;
revoke all on public.dogs from anon;
revoke all on public.reminders from anon;
