# DogCareAI Beta Demo Guide

## Purpose

This guide prepares DogCareAI for beta/demo review during Phase 7. It explains the recommended demo mode, safe test data expectations, core demo flow, limitations, and success checklist.

DogCareAI is a beta/demo project. It does not provide medical diagnosis and should not be used as a substitute for professional veterinary advice.

## Production URL

Use Vercel Production for the main demo:

```text
https://dog-care-ai.vercel.app
```

Vercel Production is the active deployment target. Netlify remains backup/static deployment only and should not be used for active Gemini work.

## Recommended Demo Mode

Use Mock Mode for routine demos and QA.

Mock Mode is recommended because it:

- avoids unnecessary Gemini quota usage,
- keeps the demo predictable,
- still shows active dog context and detected intent,
- keeps emergency bypass behavior visible,
- demonstrates the server-side `/api/assistant` boundary without requiring real Gemini usage.

Only enable real Gemini intentionally, with server-side `GEMINI_API_KEY` and `MOCK_AI_MODE=false`. Do not create `VITE_GEMINI_API_KEY`. The browser must never call Gemini directly.

## Demo Prerequisites

- Use a generic QA account.
- Do not record passwords.
- Use synthetic dog and reminder data only.
- Do not enter real personal data, real medical records, addresses, phone numbers, or private notes.
- Do not show real secrets, environment variables, bearer tokens, Supabase keys, or Gemini keys.
- Keep Supabase admin/dashboard actions out of the normal demo flow.

Suggested synthetic dog data:

| Field | Example |
|---|---|
| Name | Luna Demo |
| Breed | Labrador mix |
| Age | 7 |
| Weight | 28 kg |
| Activity level | Medium |
| Allergies | Chicken sensitivity |
| Feeding preferences | Dry food in the morning, wet food in the evening |
| Medical notes | Synthetic demo notes only |

Suggested synthetic reminders:

| Reminder | Type | Schedule | Purpose |
|---|---|---|---|
| Morning meal | Feeding | Today | Today open reminder |
| Evening walk | Walk | Today/future | Routine reminder |
| Annual vaccine | Vaccination | Future date | Later reminder |
| Grooming note | Grooming | No date | Unscheduled open reminder |

## Suggested Demo Flow

### 1. Auth Sign Up Or Sign In

- Open `https://dog-care-ai.vercel.app`.
- Sign up or sign in with a generic QA account.
- Confirm the app reaches the authenticated Dashboard.

### 2. Create A Dog Profile

- Open `/dog-profile`.
- Create a synthetic dog profile.
- Add enough optional fields to demonstrate context:
  - breed,
  - age,
  - weight,
  - activity level,
  - allergies,
  - feeding preferences,
  - medical notes.

### 3. Add And Edit Reminders

- Open `/reminders`.
- Add a few synthetic reminders for the active dog.
- Edit one reminder to show update behavior.
- Optionally mark one reminder completed to show completed state.

### 4. Show Dashboard Summary

- Open `/`.
- Show active dog summary cards.
- Show reminder counts.
- Show Today open reminders.
- Show Later & unscheduled open reminders.
- Note that Dashboard does not call the AI assistant or Gemini on load.

### 5. Switch Active Dog With DogPicker

- Create or use a second synthetic dog.
- Use the header `DogPicker` to switch active dog context.
- Show that Dashboard, Reminders, and Assistant context follow the active dog.

### 6. Refresh And Show Active Dog Persistence

- Select the second active dog in `DogPicker`.
- Refresh the same tab.
- Confirm the selected dog remains active after refresh.

This demonstrates the Phase 7 fix for DogPicker active dog persistence.

### 7. Open Assistant

- Open `/assistant`.
- Show the active dog context summary.
- Keep the persistent safety disclaimer visible.
- Point out the Mock Mode / source label in responses.

### 8. Ask A Normal Mock Question

Use a safe prompt such as:

```text
What should I consider for Luna Demo's feeding routine?
```

Expected behavior:

- The browser calls `/api/assistant`.
- The response source is `mock` in routine demo mode.
- The response mentions dog/context information.
- No direct browser request to `generativelanguage.googleapis.com` occurs.

### 9. Demonstrate Rapid Send Protection, If Desired

- Enter a normal non-emergency question.
- Rapidly click Send multiple times.
- Confirm only one user message, one assistant response, and one `/api/assistant` request are produced.

This demonstrates the Phase 7 fix for duplicate Assistant sends.

### 10. Demonstrate Emergency Bypass

Use a safe synthetic emergency prompt, such as:

```text
my dog is choking
```

Expected behavior:

- EmergencyAlert appears.
- Response source is `emergency_rule`.
- The app advises contacting a veterinarian or emergency animal clinic immediately.
- The app does not diagnose.
- Gemini is not called.

## What To Avoid During Demo

- Do not ask for or provide real veterinary advice.
- Do not enter real medical history or personal information.
- Do not use real Gemini quota unless explicitly intended.
- Do not show secrets, `.env.local`, bearer tokens, Supabase keys, or Gemini keys.
- Do not create or mention `VITE_GEMINI_API_KEY`.
- Do not use the Supabase dashboard or admin tools during the normal demo.
- Do not claim Activity Log or Vet Finder are implemented.
- Do not claim chat persistence or `ai_usage_logs` persistence exists.
- Do not present DogCareAI as production medical software.

## Known Limitations

- DogCareAI remains beta/demo software.
- It does not provide medical diagnosis.
- Chat messages are frontend-local only and are not persisted.
- `ai_usage_logs` persistence is not implemented.
- Activity Log and Vet Finder are final-version features, not active beta scope.
- Supabase Storage image upload is deferred; the beta uses static avatars.
- Automated tests were assessed and deferred for the current beta.
- QA-030 Snoozed compatibility was blocked because no safe existing `snoozed` row was available and manual database manipulation was out of scope.
- QA-042 Real Gemini path was blocked because Vercel Production remained in Mock Mode and env/config was not changed.
- QA-054 Gemini rate-limit/fallback behavior was blocked because real Gemini usage was not intentionally enabled.
- Gemini rate limiting is best-effort in-memory and not production-grade shared persistence.

## Recently Fixed In Phase 7

- DogPicker active dog persistence after refresh.
- Assistant duplicate-send protection for rapid Send clicks.

Post-merge production sanity confirmed:

- Production loaded from the merged main commit.
- Auth sanity passed.
- DogPicker active dog persistence passed.
- Assistant duplicate-send protection passed.
- Assistant page load made no automatic `/api/assistant` call.
- No direct browser Gemini provider request was observed.

## Troubleshooting

### Auth Seems Stuck

- Use a new generic QA account.
- Try an incognito/private browser session.
- Avoid reusing old test accounts with uncertain state.
- Do not record the password in notes or screenshots.

### Production Has Not Updated

- Wait for the Vercel Production deployment to complete.
- Confirm Production is serving the latest expected main commit when possible.
- Retry after the deployment status is successful.

### Assistant Returns Mock

This is expected in Mock Mode and is the recommended routine demo behavior.

Only expect `response_source = "gemini"` when Gemini is intentionally enabled server-side with `MOCK_AI_MODE=false` and `GEMINI_API_KEY` configured.

### No Gemini Network Request Appears In Browser

This is correct. The browser should call `/api/assistant`, not Gemini directly.

## Demo Success Checklist

- [ ] Production URL loads.
- [ ] Sign up or sign in works with a generic QA account.
- [ ] Protected beta routes load after auth.
- [ ] Dog Profile create/edit works with synthetic data.
- [ ] DogPicker switches active dog context.
- [ ] Active dog persists after refresh.
- [ ] Reminders create/edit/complete/delete work.
- [ ] Dashboard shows active dog and reminder summaries.
- [ ] Dashboard load does not call `/api/assistant`.
- [ ] Assistant context summary shows the active dog.
- [ ] Normal Assistant question returns a mock response in routine demo mode.
- [ ] Browser calls `/api/assistant`, not Gemini directly.
- [ ] Rapid Send clicks do not duplicate messages or requests.
- [ ] Emergency prompt triggers EmergencyAlert and `emergency_rule`.
- [ ] No secrets, keys, tokens, or private data are shown.
- [ ] Demo stays within beta scope and does not claim final-only features.
