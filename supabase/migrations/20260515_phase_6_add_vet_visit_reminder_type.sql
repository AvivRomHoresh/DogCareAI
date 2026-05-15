-- DogCareAI Phase 6 Pre-Step 5
-- Align beta reminder types before implementing Basic Reminders.
-- This migration is prepared for manual Supabase SQL Editor application.

alter table public.reminders
drop constraint if exists reminders_type_valid;

alter table public.reminders
add constraint reminders_type_valid check (
  type in (
    'feeding',
    'walk',
    'medication',
    'vaccination',
    'grooming',
    'vet_visit',
    'general'
  )
);

