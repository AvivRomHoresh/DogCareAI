# Phase 8 Step 4A: Breed Recognition + Did You Know Implementation Report

## Purpose

This report documents the Phase 8.4A Breed Recognition + Did You Know MVP implementation.

The feature adds a small Dashboard card that uses the active dog's existing `breed` value to show a dog/breed insight, preferring dogapi.dog data where practical and falling back to local static content when needed.

## Files Changed

- `src/lib/dogInsights.ts`
- `src/components/BreedDidYouKnowCard.tsx`
- `src/pages/DashboardPage.tsx`
- `docs/PHASE_8_STEP_4A_BREED_DID_YOU_KNOW_IMPLEMENTATION_REPORT.md`

## API Used

Primary API:

- `https://dogapi.dog/api/v2/breeds`
- `https://dogapi.dog/api/v2/facts`

The implementation uses dogapi.dog because the Phase 8.4A feasibility spike found it supports no-key breed data and dog facts with browser-feasible CORS behavior.

No API key, env variable, paid API, schema change, migration, or RLS change was added.

## Dependency Added

- `fuse.js`

Fuse.js was added as the only new dependency for robust client-side breed matching. It is used only in the Phase 8.4A dog insight helper and does not introduce API keys, paid services, backend behavior, or secret handling.

## Fallback Behavior

The card always has a safe fallback path.

Fallback is used when:

- there is no breed saved for the active dog;
- the breed is unrecognized;
- dogapi.dog fails or times out;
- dogapi.dog returns unusable data;
- external text is filtered as unsuitable for the demo safety rules.

Fallback content is local/static and does not require network access.

## Breed Matching Behavior

The helper normalizes breed input by:

- trimming spaces;
- lowercasing;
- collapsing repeated whitespace;
- normalizing punctuation such as hyphens, underscores, periods, slashes, and backslashes;
- removing simple parenthetical text;
- comparing against normalized dogapi.dog breed names.

The helper builds a normalized searchable breed list from:

- dogapi.dog breed names;
- local curated demo breed names;
- local alias and typo mappings.

The helper also supports a small alias/typo map for common inputs such as:

- `lab` / `labrador` -> `labrador retriever`
- `golden` -> `golden retriever`
- `gsd` -> `german shepherd dog`
- `frenchie` -> `french bulldog`
- `mix` / `mutt` -> `mixed breed`
- `Bigel` / `Beagel` -> `Beagle`
- `Labrador retriver` -> `Labrador Retriever`
- `golden retriver` -> `Golden Retriever`
- `german shepard` -> `German Shepherd Dog`
- `husky` -> `Siberian Husky`

For broader near-miss matching, Fuse.js is used with a conservative threshold and stricter handling for short inputs. Very short ambiguous values fall back unless explicitly aliased.

## Safety / Content Rules

The implementation avoids:

- medical diagnosis;
- breed-health certainty;
- product, food, supplement, or medication recommendations;
- "this breed always..." claims;
- raw API errors in the UI.

External text is shortened and filtered for unsuitable terms. If the API content is not suitable, the UI uses local fallback content instead.

## UI Behavior

The Dashboard now shows a compact "Did You Know?" card near the top of the Dashboard when there is an active dog.

The final placement is a Dashboard top insight section: below the global `Care workspace` header/title area and above the main Dashboard content card and summary sections. It is not rendered inside `AppShell`. On mobile, the card stacks naturally with the rest of the Dashboard content.

The card shows:

- title;
- insight text;
- loading state while API data is checked;
- breed-specific or fallback badge;
- source label, either `dogapi.dog` or `local fallback`;
- helper text explaining whether the breed was matched or fallback content was used.

The card does not block Dashboard rendering and does not affect reminder summaries, quick actions, DogPicker behavior, or other Dashboard content.

## Random Insight Behavior

When multiple safe display candidates are available for a recognized breed, the helper chooses a session-stable random candidate. This gives the Dashboard more variety without refetching dogapi.dog on every render.

The candidate pool can include:

- a short safe excerpt from the dogapi.dog breed description;
- local cautious breed-context variations that do not make medical, food, product, or certainty claims;
- curated local fact pools for common demo breeds such as Beagle, Labrador Retriever, Golden Retriever, French Bulldog, German Shepherd Dog, Poodle, Bulldog, Shih Tzu, Siberian Husky, and Mixed Breed.

The random choice is stored as a session-scoped seed in `sessionStorage`, so a browser session remains stable while still allowing variation across sessions.

A compact "Show another fact" action appears when multiple safe facts are already loaded. It rotates through the existing candidate list and does not refetch the API.

## Fuzzy Breed Matching

The helper now includes conservative fuzzy matching for near-miss free-text breed input.

Examples to QA:

- `Bigel` should match `Beagle` if dogapi.dog breed data is available.
- `Labrador retriver` should match `Labrador Retriever` if dogapi.dog breed data is available.
- `Beagel` should match `Beagle`.
- `golden retriver` should match `Golden Retriever`.
- `frenchie` should match `French Bulldog`.
- `gsd` should match `German Shepherd Dog`.
- `husky` should match `Siberian Husky`.
- `german shepard` should match `German Shepherd Dog`.

Fuzzy matching uses a small edit-distance threshold and similarity check. If confidence is too low, the helper falls back to a general dog fact.

No-overmatch cases:

- Empty breed falls back.
- `abc123` should fall back.
- Very short ambiguous input falls back unless it is explicitly aliased, such as `gsd`.

When a fuzzy match is used, the UI helper text can show a subtle note such as `Matched Luna's saved breed as Beagle.`

## Caching / Reliability

The helper uses in-memory and `sessionStorage` caching with a six-hour TTL to avoid repeated dogapi.dog fetches on every Dashboard render.

API requests use a short timeout and fail closed to local fallback content.

## What Was Intentionally Not Changed

- Dog Profile schema or fields.
- Breed input UI.
- Supabase migrations.
- RLS policies.
- Auth or Google Login.
- Telegram reminders.
- Reminder CRUD.
- Nearby Places.
- Assistant / Gemini architecture.
- Scheduler or service-role behavior.
- Env files or API keys.
- Product recommendations.
- Profile images or avatars.

## QA Checklist

- Dog with recognized breed shows a breed-specific Did You Know insight.
- Breed matching is case-insensitive.
- Breed matching handles extra spaces.
- Breed matching handles simple punctuation variations.
- Alias such as `lab` maps to Labrador Retriever when dogapi.dog data is available.
- Near-miss typo such as `Bigel` maps to Beagle when dogapi.dog data is available.
- Near-miss typo such as `Beagel` maps to Beagle when dogapi.dog data is available.
- Near-miss typo such as `Labrador retriver` maps to Labrador Retriever when dogapi.dog data is available.
- `golden retriver`, `frenchie`, `gsd`, `husky`, and `german shepard` map to their expected breed names.
- `abc123`, empty breed, and very short ambiguous strings fall back to a general dog fact.
- Low-confidence typo falls back to a general dog fact.
- Empty breed shows fallback content.
- Unrecognized breed shows fallback content.
- API failure shows local fallback instead of breaking the Dashboard.
- Switching active dogs updates the card.
- Refresh preserves active dog and shows the correct insight.
- Multiple safe candidates can vary across browser sessions without repeated API fetching.
- "Show another fact" rotates through already-loaded candidates without refetching.
- Dog Profile breed edits update the Dashboard card after saving.
- Dashboard reminder summaries still load.
- Dog Profile create/edit still works.
- DogPicker persistence still works.
- Reminders CRUD still works.
- Assistant Mock Mode still works.
- Telegram, Nearby, Google Login, and scheduler behavior are untouched.
- No medical diagnosis, breed-health certainty, or product recommendation appears.

## Final Manual QA Results

Final manual browser QA passed:

- AppShell/header layout looks normal again.
- Did You Know card appears below the `Care workspace` title/header area.
- Did You Know card appears above the main Dashboard content card.
- The placement looks visually acceptable.
- The card is a Dashboard top insight section, not inside `AppShell`.
- `Show another fact` has the preferred subtle text-action styling.
- `Show another fact` rotates the displayed insight without refetching.
- Known breed `Beagle` renders correctly.
- Typo breed `Bigel` matches safely to `Beagle`.
- Typo breed `Beagel` matches safely to `Beagle`.
- Known breed `Labrador Retriever` renders correctly.
- Typo breed `Labrador retriver` matches safely to `Labrador Retriever`.
- Typo breed `golden retriver` matches safely to `Golden Retriever`.
- Alias `frenchie` matches safely to `French Bulldog`.
- Alias `gsd` matches safely to German Shepherd / German Shepherd Dog.
- Alias `husky` matches safely to Siberian Husky.
- Typo breed `german shepard` matches safely to German Shepherd / German Shepherd Dog.
- Unknown breed `abc123` uses fallback correctly.
- Empty/missing breed uses fallback correctly.
- Page refresh remains stable.
- No raw API errors were shown.
- No unsafe medical, breed-health certainty, product, food, or "always/never" claims were observed.
- Dashboard, Dog Profile, Reminders, Nearby, Google Login, Telegram, Assistant, and scheduler flows were not broken.

## Validation Results

- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.
- `git diff --check` passed with only the existing LF/CRLF warning for `src/pages/DashboardPage.tsx`.

## Risks / TODOs

- dogapi.dog is a free external API without a reliability guarantee.
- CORS or availability could change, so local fallback remains required.
- Free-text breed matching is best-effort.
- API descriptions may not always be suitable, so filtering and fallback are intentionally conservative.
- Dog CEO images were deferred for this MVP to keep the feature focused on Did You Know text.
