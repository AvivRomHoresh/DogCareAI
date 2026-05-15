# Phase 6 Step 4: Dog Profile Report

## Branch

- `phase-6-dog-profile`

## Step Goal

Implement beta Dog Profile functionality using the existing `public.dogs` table, authenticated Supabase client, and Row-Level Security from Phase 6 Step 3.

## Files Changed

- `README.md`
- `src/components/AppShell.tsx`
- `src/components/DogPicker.tsx`
- `src/hooks/useDogs.tsx`
- `src/main.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/DogProfilePage.tsx`
- `src/types/dog.ts`
- `docs/PHASE_6_DOG_PROFILE.md`

## Dog Profile Behavior Implemented

- `/dog-profile` now loads non-archived dog profiles from Supabase.
- The page shows loading, empty, error, saving, success, and validation states.
- Users can create dog profiles with the authenticated user's `user_id`.
- Users can edit an existing dog profile selected from the page.
- Users can archive a dog profile by setting `is_archived = true`.
- Archived dogs are removed from the visible active list after refresh.
- Dog profile image behavior uses beta-safe static avatar choices stored in `profile_image_url`.
- No file upload button was added.
- Supabase Storage was not used.

## Supported Dog Fields

- `name`
- `breed`
- `age`
- `weight`
- `gender`
- `profile_image_url`
- `medical_notes`
- `allergies`
- `vaccination_history`
- `feeding_preferences`
- `activity_level`
- `special_conditions`

## DogPicker and Active Dog Behavior

- Added `DogProvider` and `useDogs`.
- `DogPicker` now displays the active dog context.
- If multiple dogs exist, `DogPicker` allows switching the active dog.
- Active dog id is stored in local component state and `localStorage`.
- Active dog selection is scoped per authenticated user.
- If the stored active dog no longer exists in the non-archived list, the provider selects the first available dog or clears the selection.
- The active dog state remains frontend-only; no database field was added.

## Validation Rules

Client-side validation mirrors the database constraints:

- Dog name is required and cannot be blank.
- Age must be empty or between `0` and `40`.
- Weight must be empty or greater than `0` and less than or equal to `200`.
- Gender must be empty or one of `male`, `female`, `unknown`.
- Activity level must be empty or one of `low`, `medium`, `high`.
- Duplicate save submissions are blocked while saving.

## Supabase and RLS Assumptions

- The Phase 6 Step 3 migration has been manually applied.
- `public.dogs` exists with RLS enabled.
- The frontend uses only the Supabase anon key.
- Dog list loading selects non-archived dogs and relies on RLS to return only rows owned by the authenticated user.
- Dog creation inserts `user_id` from the current authenticated user.
- Dog updates and archives are performed through the authenticated client and remain protected by RLS.
- `SUPABASE_SERVICE_ROLE_KEY` was not used.

## Dashboard Compatibility

- The dashboard remains intentionally minimal.
- It now shows a small selected-dog summary or the approved empty state: "Create your dog profile to get started."
- No reminders data loading was implemented.
- No AI data loading or AI calls were implemented.

## Intentionally Not Implemented

- Reminders CRUD.
- Full dashboard data loading.
- AI Assistant, Gemini, Edge Functions, or serverless functions.
- New database tables.
- RLS policy changes.
- Supabase Storage or dog image uploads.
- Hard deletes for dog profiles.
- Final-only screens.
- Paid services.

## Manual Smoke Test Checklist

- Sign in with a Supabase email/password account.
- Open `/dog-profile`.
- Confirm the empty state appears when no dog exists.
- Create a dog with only a name.
- Create or update a dog with optional age, weight, gender, activity level, and care notes.
- Confirm invalid age, invalid weight, and blank name show readable validation messages.
- Refresh the browser and confirm the active dog selection persists.
- Create a second dog and switch active dog from the header DogPicker.
- Archive the active dog and confirm it disappears from the visible list.
- Confirm another dog is selected, or the active dog is cleared if none remain.
- Confirm `/` shows either selected dog summary or the empty state.
- Confirm `/assistant` and `/reminders` remain stubs.

## Build and Lint Results

| Command | Result | Notes |
|---|---|---|
| `npm run build` | Blocked by PowerShell script policy | Use `npm.cmd` on this Windows environment. |
| `npm.cmd run build` | Passed | Required elevated sandbox permissions so Vite could spawn esbuild. |
| `npm.cmd run lint` | Passed | TypeScript check completed successfully. |

## Readiness Statement

The project is ready for Phase 6 Step 5: Basic Reminders.

