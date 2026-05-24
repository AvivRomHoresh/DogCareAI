# Phase 8 Step 4A: Breed Recognition + Did You Know Plan

## Purpose

Phase 8.4A adds a lightweight, demo-safe dog insight feature using the existing dog profile `breed` value.

The goal is to show a breed-specific "Did You Know" insight when DogCareAI can recognize the active dog's breed through a free dog API, and to fall back to local/static content when the breed is missing, unrecognized, or the API is unavailable.

This is a planning-only document. No code, schema, environment variables, paid APIs, external API keys, or app behavior are changed in this step.

## Current Data Summary

DogCareAI already stores breed on the existing `dogs` table and exposes it through the frontend `Dog` type.

Relevant current files:

- `src/types/dog.ts`
  - `Dog.breed` is typed as `string | null`.
- `src/pages/DogProfilePage.tsx`
  - The Dog Profile form includes a free-text `Breed` input.
  - Saving a profile writes `breed: form.breed.trim() || null`.
  - No schema change is needed for Phase 8.4A.
- `src/hooks/useDogs.tsx`
  - Loads non-archived dogs through Supabase and exposes `activeDog`.
  - The active dog already contains `breed`.
- `src/pages/DashboardPage.tsx`
  - Displays the active dog's name, breed, age, and activity level.
  - This page already acts as the first "today at a glance" surface for dog-specific context.
- `src/components/ContextSummaryCard.tsx`
  - Assistant context already displays breed as one of the dog profile facts.

The current breed input is free text, so Phase 8.4A should treat matching as best-effort and always provide a fallback.

## Recommended UI Placement

Recommended placement: Dashboard, near the existing selected-dog summary.

Rationale:

- The insight is a lightweight "at a glance" demo enhancement, so the Dashboard is a natural first surface.
- The Dashboard already receives `activeDog` from `useDogs`, so no extra Supabase data loading is required.
- Dog Profile should remain focused on editing dog details rather than showing enrichment content.
- Keeping the card on Dashboard avoids changing reminder, assistant, auth, Telegram, Google Login, Nearby, or scheduler behavior.

Suggested placement:

- Add a compact "Did You Know?" card below or near the existing "Selected dog" card.
- Show API-backed breed insight when the breed is recognized and the API returns usable content.
- Show local fallback content when no breed exists, the breed is unrecognized, or the API fails.
- Include a small label such as:
  - `Breed insight`
  - `General dog fact`
  - `Fallback fact`
- Include short helper copy:
  - `Based on the breed saved in the dog profile.`
  - `Using a fallback fact because this breed is not recognized yet.`

Optional later placement:

- A small read-only preview could be added to Dog Profile after the Dashboard version is stable, but it should not be part of the initial MVP unless explicitly approved.

## Recommended Data Approach

Recommendation: use a hybrid API-first approach with local/static fallback.

Primary target:

- Use `dogapi.dog` first where practical because it provides no-key breed data and dog facts.
- Use the current active dog's free-text `breed` value to match against the dogapi.dog breed list.
- Use API breed description content only when it can be displayed safely with cautious wording.
- Use dogapi.dog facts as a general fact option if breed-specific matching fails.

Secondary optional helper:

- Use Dog CEO API only if an image or breed-list helper is useful.
- Dog CEO is strong for breed lists and random breed images, but it does not provide breed insight text.

Always keep local fallback:

- The demo must not depend on an external API as the only source of content.
- If the API fails, times out, returns unusable data, or CORS changes, show a local static fact.
- The local fallback should be deterministic and safe.

Why hybrid is preferred:

- It responds to the instructor request for more real API usage.
- It keeps the final demo reliable.
- It requires no paid service.
- It requires no API key or secret.
- It avoids schema and env changes.
- It remains easy to remove or disable if the API becomes unreliable.

## Candidate APIs

### dogapi.dog

Candidate endpoints:

- `https://dogapi.dog/api/v2/breeds`
- `https://dogapi.dog/api/v2/facts`

Expected usefulness:

- Breed list and breed descriptions.
- Random/general dog facts.
- No API key required based on feasibility spike.
- Browser fetch appears feasible because CORS headers were returned when tested with an Origin header.

Limitations:

- Breed lookup by name may need client-side matching against the returned breed list.
- Breed description copy should be treated as external content and displayed cautiously.
- Content should not be used as medical advice or breed-health certainty.

### Dog CEO API

Candidate endpoints:

- `https://dog.ceo/api/breeds/list/all`
- `https://dog.ceo/api/breed/{breed}/images/random`
- `https://dog.ceo/api/breeds/image/random`

Expected usefulness:

- Breed list.
- Random dog images.
- Breed-specific dog images when the breed maps cleanly to Dog CEO naming.
- No API key required based on feasibility spike.
- Browser fetch appears feasible because CORS headers are present.

Limitations:

- No breed insight text.
- Breed/sub-breed naming differs from common user-entered breed names.
- Images should be treated as optional polish, not required for the Did You Know MVP.

## Breed Matching Approach

Breed matching should be friendly but intentionally modest.

Normalization rules:

- Trim leading/trailing spaces.
- Convert to lowercase.
- Collapse repeated whitespace.
- Normalize punctuation such as hyphens, underscores, periods, and slashes into spaces.
- Remove simple parenthetical text if practical.
- Compare normalized user input against normalized API breed names.

Alias rules:

- Support a small local alias map before or alongside API matching.
- Examples:
  - `lab`, `labrador`, `labrador retriever` -> `Labrador Retriever`
  - `golden`, `golden retriever` -> `Golden Retriever`
  - `german shepherd`, `gsd` -> `German Shepherd`
  - `frenchie`, `french bulldog` -> `French Bulldog`
  - `cavalier`, `cavalier king charles spaniel` -> `Cavalier King Charles Spaniel`
  - `mixed`, `mix`, `mixed breed`, `mutt` -> local mixed-breed fallback insight

Fallback behavior:

- If `breed` is empty, null, or unrecognized, return a general dog fact.
- If dogapi.dog facts are available, the general fact can come from the API.
- If dogapi.dog facts fail, use a local static fact.
- The fallback should be positive and useful without implying the breed is known.

Recommended local fallback:

- `Dogs often read routines and body language closely, so consistent daily care cues can help them feel more secure.`

## Content Safety Rules

Insight copy must stay educational and non-medical.

Allowed:

- General enrichment facts.
- Breed background or broad care-context facts.
- Gentle care-context suggestions.
- Historically or behaviorally broad wording.
- "Often", "many", "can", "may", and "tend to" phrasing.

Not allowed:

- Medical diagnosis.
- Breed-health certainty.
- Claims that a breed always behaves a certain way.
- Product, food, supplement, or medication claims.
- Advice that replaces a veterinarian.
- Claims that user-specific health risk is known from breed alone.

External API text handling:

- Display only short, safe excerpts if needed.
- Avoid showing long external descriptions if they feel too broad, deterministic, or medical.
- Prefer wrapping external facts in cautious UI copy, such as `Many sources describe this breed as...`.
- If content is questionable, fall back to local static content.

## Implementation Plan If Approved

1. Add local fallback and matching helper.
   - Suggested file: `src/lib/breedInsights.ts`.
   - Include normalization, alias map, safe fallback facts, and helper types.

2. Add API helper with no keys.
   - Suggested file: `src/lib/dogApiInsights.ts`.
   - Fetch `dogapi.dog/api/v2/breeds` and optionally `dogapi.dog/api/v2/facts`.
   - Keep timeouts and error handling short.
   - Cache results in memory or sessionStorage to avoid repeated API calls.
   - Do not add dependencies.

3. Add a small UI card.
   - Suggested file: `src/components/BreedInsightCard.tsx`.
   - Accept `breed?: string | null`.
   - Show loading, API insight, fallback, and error-safe fallback states.
   - Keep it compact and mobile-friendly.

4. Place the card on Dashboard.
   - Add it near the selected-dog summary in `src/pages/DashboardPage.tsx`.
   - Render only when there is an active dog.
   - Do not block Dashboard rendering on API loading.

5. Keep Dog Profile unchanged for the MVP.
   - The existing breed input remains the source of truth.
   - No breed dropdown or autocomplete in this step.

6. Add implementation documentation.
   - Suggested report: `docs/PHASE_8_STEP_4A_BREED_DID_YOU_KNOW_REPORT.md`.

7. Run validation.
   - `npm.cmd run lint`
   - `npm.cmd run build`
   - `git diff --check`

## QA Checklist

Functional checks:

- Dog with recognized breed shows a breed-specific Did You Know insight.
- Breed matching is case-insensitive.
- Breed matching handles extra spaces.
- Breed matching handles simple punctuation variations.
- A supported alias maps to the expected breed.
- Empty breed shows a general fallback fact.
- Unrecognized breed shows a general fallback fact.
- API failure shows local fallback instead of breaking the Dashboard.
- Switching active dogs updates the insight.
- Refresh preserves active dog and shows the correct insight.
- Dog Profile breed edits update the Dashboard insight after saving.
- Repeated Dashboard loads do not spam the dog API.

Safety checks:

- No medical diagnosis appears.
- No breed-health certainty appears.
- No product/food recommendation appears.
- No paid API or API key is used.
- No env file or secret is added.
- External text is short, cautious, and appropriate for a demo.

Regression checks:

- Dashboard still loads reminder summaries.
- Dog Profile create/edit still works.
- DogPicker persistence still works.
- Reminders CRUD still works.
- Assistant still works in Mock Mode.
- Telegram settings/check UI is untouched.
- Nearby Places is untouched.
- Google Login is untouched.

Mobile/UX checks:

- Did You Know card fits on mobile.
- Text does not overlap.
- The card does not crowd existing Dashboard controls.
- Loading and fallback states are clear and friendly.

## Risks / TODOs

| Risk | Mitigation |
|---|---|
| Free-text breeds may not match API names. | Use normalization, aliases, and local fallback. |
| API may fail or change CORS behavior. | Keep local static fallback and do not block Dashboard rendering. |
| External API content may overstate breed behavior. | Use cautious excerpts or local fallback if content is not suitable. |
| Too many API calls could be noisy. | Cache breed list/facts and avoid repeated fetches per render. |
| Dashboard may become crowded. | Use one compact card near the selected-dog summary. |
| Product recommendation scope creep. | Keep Phase 8.4A separate from Phase 8.4B. |
| Image/avatar scope creep. | Keep Phase 8.4A separate from Phase 8.4C. |

## Go / No-Go Recommendation

Recommendation: proceed with Phase 8.4A as an API-first hybrid MVP.

Use dogapi.dog as the primary no-key dog API for breed/fact data where practical, optionally use Dog CEO only for image or breed-list support if needed, and always keep local/static fallback content for demo reliability.

This approach matches the current Phase 8 goals:

- It uses a real dog API.
- It uses the existing `dogs.breed` value.
- It requires no schema change.
- It requires no env change.
- It requires no paid service or API key.
- It does not touch Telegram, Google Login, Nearby, Assistant, scheduler, RLS, auth, or reminders behavior.
- It improves the demo with dog-specific value while staying safe and easy to QA.
