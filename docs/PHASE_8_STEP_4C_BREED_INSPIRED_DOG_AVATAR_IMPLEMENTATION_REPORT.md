# Phase 8 Step 4C: Breed-Inspired Dog Avatar Implementation Report

## Purpose

Phase 8.4C adds a small local breed-inspired dog avatar MVP for Dog Profile.

The feature improves the previous letter-only placeholder without adding upload, storage, generated images, external image APIs, schema changes, or paid services.

The avatar SVG was refined after manual QA to use a cleaner, more polished dog-head style with smoother shapes, restrained color cues, and less childish facial details.

## Files Changed

- `src/components/DogAvatar.tsx`
- `src/pages/DogProfilePage.tsx`
- `docs/PHASE_8_STEP_4C_BREED_INSPIRED_DOG_AVATAR_IMPLEMENTATION_REPORT.md`

## Avatar Component Behavior

`DogAvatar` is a reusable local React component that renders an inline SVG dog illustration.

Inputs:

- `name`
- `breed`
- `weight`
- `profileImageUrl`
- optional `size`
- optional `className`

Behavior:

- Uses local SVG/CSS only.
- Uses the existing static avatar value as a color accent.
- Uses `name` for an accessible avatar label when available.
- Does not request external images.
- Does not use AI-generated images.
- Does not require Supabase Storage.
- Does not add a new schema field.

## Breed / Size Fallback Behavior

The avatar component reuses shared breed matching from Phase 8.4A/8.4B:

- `normalizeBreedName`
- `findBreedMatch`
- `buildSearchableBreedList`
- `sharedCuratedBreedNames`

Breed-inspired variants:

- Maltese, Shih Tzu, French Bulldog -> small/light companion-style avatar.
- Beagle, Border Collie, Bulldog -> medium/hound-style avatar.
- Dachshund -> long-ear/low-hound-style avatar.
- Rottweiler -> large/dark avatar.
- Golden Retriever, Labrador Retriever -> large/golden avatar.
- German Shepherd Dog, Siberian Husky -> large/working avatar.
- Poodle -> curly/light avatar.
- Mixed Breed or unknown -> generic fallback.

Weight fallback:

- Under 10 kg -> small/light style.
- 10 to under 25 kg -> medium/hound style.
- 25 kg or more -> large/working style.
- Missing/invalid weight and unknown breed -> generic fallback.

The visuals are intentionally approximate and do not claim exact breed identification.

Dachshund support was added to the shared breed matcher with common aliases and typos:

- `dachshund`
- `daschund`
- `dachsund`
- `sausage dog`
- `wiener dog`

Because the shared matcher is used by DogAvatar, Did You Know, and Product Recommendations, Dachshund can now be recognized consistently across those features. Product Recommendations treats Dachshund as a small-size breed fallback, and Did You Know includes safe local Dachshund insight candidates.

## UI Locations Updated

Updated:

- Dog Profile avatar preview.

Not updated in this MVP:

- Dashboard selected dog summary.
- DogPicker.
- AppShell/header.
- Top-right dog/avatar menu.

The Dog Profile form behavior remains unchanged. Existing `profile_image_url` values remain compatible and continue acting as an accent/theme choice.

## Out of Scope

This implementation intentionally does not add:

- AppShell/top-right dog menu.
- DogPicker/header avatar menu.
- Real dog photo upload.
- Supabase Storage.
- Storage policies.
- AI image generation.
- External image/avatar APIs.
- API keys.
- Environment variables.
- Paid services.
- Schema, migration, or RLS changes.
- Telegram, Google Login, Nearby, Assistant, scheduler, reminders, product recommendations, dog insights behavior, auth, or service-role changes.

## Future Real Dog Photo Upload Note

A future version can extend `DogAvatar` to prefer a real uploaded photo before falling back to the illustrated avatar.

That future work should be planned separately because it would require Supabase Storage, upload validation, storage policies, delete/replace behavior, and additional QA.

## QA Checklist

- Dog Profile renders an illustrated avatar instead of the previous letter-only placeholder.
- Maltese renders a small/light companion-style avatar.
- Rottweiler renders a large/dark avatar.
- Beagle renders a medium/hound-style avatar.
- Unknown breed such as `abc123` renders a generic fallback.
- Empty breed renders a generic fallback.
- Weight can influence the fallback when breed is unavailable.
- Static avatar color buttons still update the avatar accent.
- Editing name/breed/weight updates the preview before save.
- Saving a dog profile still works.
- Existing `profile_image_url` values remain compatible.
- No broken images appear because the avatar uses local SVG only.
- Dachshund and common aliases/typos render the Dachshund-inspired avatar.
- DogPicker active dog persistence is unchanged.
- Dashboard remains unchanged.
- Mobile Dog Profile layout remains clean.

## Validation Results

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `git diff --check`: passed with existing LF/CRLF working-copy warning on `src/pages/DogProfilePage.tsx`.
- Build completed with the existing Vite chunk-size warning.

## Final Manual QA Results

Final manual QA passed before commit:

- Dog Profile shows the new breed-inspired `DogAvatar` instead of the old plain initial-only avatar.
- Avatar style looks cleaner and more professional than the earlier version.
- The implementation achieves the intended Phase 8.4C goal.
- Maltese shows a small/light companion-style avatar.
- Rottweiler shows a distinct large/darker styled avatar.
- Beagle shows a distinct hound-style avatar.
- Labrador Retriever shows a reasonable retriever-style avatar.
- Dachshund is recognized and shows a suitable long-ear/hound-style avatar.
- Dachshund aliases/typos such as `daschund`, `dachsund`, `sausage dog`, and `wiener dog` are supported where practical.
- German Shepherd is recognized; visual color can be polished further later if needed.
- Unknown breed `abc123` shows a generic dog avatar.
- Empty/missing breed shows a generic dog avatar unless weight-based fallback is available.
- Existing static avatar color values remain compatible as accents.
- Dog create flow still works.
- Dog edit/save flow still works.
- Did You Know still works after shared matcher updates.
- Product Recommendations still work after shared matcher updates.
- Dashboard, Recommendations, Reminders, Nearby, Assistant, Google Login, Telegram, Dog Insights, Product Recommendations, and scheduler flows were not broken.
- No upload, Supabase Storage, schema changes, external image APIs, or AI image generation were added.
- No AppShell/top-right avatar menu was added; that remains deferred to Phase 8.5.

## Risks / TODOs

- The avatar is breed-inspired, not breed-accurate.
- Minor visual polish, such as German Shepherd coloring, can be handled later during UX polish if needed.
- More breed variants could be added later, but the MVP should stay focused on already supported demo breeds.
- Dashboard reuse can be considered later if it stays visually clean.
- Real uploaded dog photos remain future work.
