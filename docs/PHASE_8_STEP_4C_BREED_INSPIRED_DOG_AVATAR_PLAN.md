# Phase 8 Step 4C: Breed-Inspired Dog Avatar Plan

## Purpose

Phase 8.4C should improve the existing dog profile avatar placeholder with a small, local, breed-inspired illustrated avatar.

This phase is not the Google-style top-right active dog avatar menu. Header/menu UX belongs in Phase 8.5 UX/UI polish.

## Current Avatar Summary

The current Dog Profile UI stores a beta-safe static avatar choice in `dogs.profile_image_url`.

Current behavior:

- `src/pages/DogProfilePage.tsx` renders a "Static avatar" preview.
- The preview is a rounded square with a color theme and the first letter of the dog name.
- Users can choose one of four static color values from `STATIC_AVATAR_OPTIONS` in `src/types/dog.ts`.
- The saved value is stored in the existing `profile_image_url` field.
- There is no file upload, Supabase Storage, external image API, or generated image workflow.

Other UI locations:

- Dashboard currently shows selected dog text in the active dog summary, but does not render the same letter avatar.
- `DogPicker` currently shows active dog text/select controls, but does not render a circular avatar.
- AppShell does not contain a dog avatar menu.

## Feature Goal

Replace or enhance the letter-based dog profile avatar preview with a simple local illustration that feels more dog-specific.

Desired behavior:

- Recognized breed -> show a breed-inspired illustrated avatar.
- Unrecognized breed -> show a generic illustrated dog avatar.
- Missing breed -> show a generic illustrated dog avatar.
- Weight/size may influence the avatar when breed is missing or ambiguous.
- The existing static avatar color choice can remain as a lightweight accent/theme choice.

Examples:

- Maltese -> small/light companion-style avatar.
- Rottweiler -> large/dark strong-dog style avatar.
- Beagle -> medium/scent-hound style avatar.
- Unknown breed -> generic dog avatar.

## Recommended UI Locations

Recommended Phase 8.4C implementation:

1. Dog Profile avatar preview: must update.
2. Dashboard selected dog summary: optional if the same reusable component can be added cleanly without layout churn.
3. DogPicker/AppShell header: defer to Phase 8.5.

Rationale:

- Dog Profile is the current place where the placeholder exists and where users expect profile polish.
- Dashboard can benefit from a small read-only version, but it is not required for the first 8.4C implementation.
- DogPicker and a Google-style active dog avatar menu would change navigation/header behavior and should stay in Phase 8.5.

## Avatar Mapping Strategy

Use existing dog profile data:

- `name`
- `breed`
- `weight`
- existing `profile_image_url` static color value, as an optional accent

Reuse the shared breed matching utility from Phase 8.4A/8.4B:

- `src/lib/dogBreedMatching.ts`
- Normalize breed input.
- Use aliases/fuzzy matching already proven for Did You Know and Recommendations.
- Keep low-confidence or unknown breed values on the generic fallback.

Suggested avatar groups:

- `small-light`: Maltese, Shih Tzu, similar small/light companion breeds.
- `medium-hound`: Beagle and scent-hound-style demo breeds.
- `large-dark`: Rottweiler and similar large/dark demo breeds.
- `large-golden`: Golden Retriever / Labrador Retriever style.
- `large-working`: German Shepherd Dog / Siberian Husky style.
- `curly-general`: Poodle / mixed fluffy-style fallback.
- `generic`: unknown, missing, or low-confidence match.

Weight fallback:

- Under 10 kg -> small/generic companion style.
- 10 to under 25 kg -> medium/generic style.
- 25 kg or more -> large/generic style.
- Missing weight and unknown breed -> generic.

## Visual Direction

Use local React/SVG/CSS illustration only.

Visual expectations:

- Simple illustrated dog face or bust.
- Works in the existing Dog Profile avatar area.
- Works at small sizes if reused later.
- Uses a restrained DogCareAI palette.
- Should feel friendly but not childish.
- Avoid exact breed realism; use "inspired by" shapes/colors.
- Use accessible labels where the avatar conveys dog identity, and `aria-hidden` where the dog name is already visible next to it.

Possible implementation shape:

- `src/components/BreedInspiredDogAvatar.tsx`
- `src/lib/dogAvatar.ts` for mapping, if the mapping grows beyond a few lines.
- Keep all artwork inline/local; no image requests.

## Implementation Plan

1. Create a small avatar mapping helper.
2. Reuse `dogBreedMatching` to identify supported demo breeds.
3. Infer a size group from weight only when breed is missing or unknown.
4. Create a reusable `BreedInspiredDogAvatar` component using local SVG/CSS.
5. Replace the Dog Profile letter preview with the illustrated avatar.
6. Keep the existing static avatar color buttons as accent/theme choices unless implementation shows they are confusing.
7. Optionally add a read-only small avatar to the Dashboard selected dog card if it stays visually clean.
8. Do not change database schema or upload behavior.
9. Document final behavior and QA results after implementation.

## Out of Scope

Do not implement in Phase 8.4C:

- Google-style top-right active dog avatar menu.
- DogPicker dropdown redesign.
- Real image upload.
- Supabase Storage.
- Storage policies.
- AI-generated images.
- External avatar/image APIs.
- API keys or environment variables.
- Paid services.
- Breed-perfect visual claims.
- Any medical, behavioral, or breed certainty claims.

## Future Real Dog Photo Upload Note

A future version may support real dog photos through Supabase Storage, but that should be planned separately because it requires:

- Storage bucket setup.
- Upload validation.
- RLS/storage policies.
- File size/type handling.
- Delete/replace behavior.
- More QA and abuse prevention.

For the final demo, a local illustrated avatar is safer and more reliable.

## QA Checklist

- Dog Profile renders a breed-inspired avatar for Maltese.
- Dog Profile renders a breed-inspired avatar for Rottweiler.
- Dog Profile renders a breed-inspired avatar for Beagle.
- Unknown breed such as `abc123` shows a generic fallback.
- Empty breed shows a generic fallback.
- Weight can influence generic small/medium/large fallback when breed is unavailable.
- Existing static avatar selection still works if retained as an accent/theme choice.
- Saving a dog profile still works.
- Editing breed updates the preview before save, if practical.
- Existing `profile_image_url` values remain compatible.
- No broken images appear because no external images are used.
- Dashboard remains stable if a read-only avatar preview is added.
- DogPicker active dog persistence is not changed.
- No schema, RLS, migration, env, API key, Supabase Storage, Telegram, Google Login, Nearby, Assistant, Reminders, scheduler, or product recommendation behavior changes.
- Mobile Dog Profile layout remains clean.

## Risks / TODOs

- SVG illustrations could look too cartoonish if overdesigned; keep them restrained.
- Breed-inspired visuals are approximate and should not imply exact breed identification.
- Supporting too many breed-specific variants could expand scope; start with the demo breeds already supported by shared matching.
- If the existing static avatar color selector feels redundant after the illustration update, adjust copy rather than removing the data behavior.
- Dashboard reuse should be skipped if it creates layout churn.

## Go / No-Go Recommendation

Go, with a narrow scope.

Recommended first implementation should update the Dog Profile avatar preview using a local reusable component and shared breed matching. Keep DogPicker/header avatar menu work deferred to Phase 8.5, and do not add upload, storage, external image APIs, or generated images.
