# Phase 8 Step 4B: Product Recommendations Catalog Implementation Report

## Purpose

This report documents the Phase 8.4B Product Recommendations Catalog MVP.

The feature adds a demo-safe recommendations catalog based on active dog profile data. It does not add checkout, prices, affiliate flow, scraping, paid APIs, API keys, schema changes, RLS changes, or environment variables.

## Files Changed

- `src/App.tsx`
- `src/components/AppShell.tsx`
- `src/components/ProductRecommendationCard.tsx`
- `src/components/ProductRecommendationFilters.tsx`
- `src/lib/dogBreedMatching.ts`
- `src/lib/dogInsights.ts`
- `src/lib/productRecommendations.ts`
- `src/pages/DashboardPage.tsx`
- `src/pages/RecommendationsPage.tsx`
- `docs/PHASE_8_STEP_4B_PRODUCT_RECOMMENDATIONS_IMPLEMENTATION_REPORT.md`

## Route Added

- `/recommendations`

The route is protected through the existing `ProtectedRoute` pattern.

## Recommendation Logic

The MVP uses the active dog profile through `useDogs()`.

Profile signals used:

- `breed`
- `age`
- `weight`
- `activity_level`
- limited caution for `allergies` and `feeding_preferences`

Derived profile groups:

- Age group:
  - puppy: under 1 year
  - adult: 1 to under 7 years
  - senior: 7 years or older
  - unknown: missing or invalid age
- Size group:
  - small: under 10 kg
  - medium: 10 to under 25 kg
  - large: 25 kg or more
  - unknown: missing or invalid weight
- Breed-inferred size fallback:
  - Maltese and Shih Tzu -> small.
  - French Bulldog -> small.
  - Beagle, Border Collie, and Bulldog -> medium.
  - Siberian Husky, Golden Retriever, Labrador Retriever, German Shepherd Dog, and Rottweiler -> large.
  - Poodle and Mixed Breed stay unknown/general unless weight is known.
- Breed group:
  - Beagle
  - Border Collie
  - Bulldog
  - French Bulldog
  - German Shepherd
  - Golden Retriever
  - Labrador Retriever
  - Maltese
  - Mixed Breed
  - Poodle
  - Rottweiler
  - Shih Tzu
  - Siberian Husky
  - unknown fallback

Matching is deterministic and conservative. Weak or missing profile data still produces general recommendations.

The recommendation engine applies hard eligibility before scoring:

- Small-size product cards are not recommended to large dogs when weight or breed-inferred size is known.
- Large-size accessories are not recommended to small dogs when weight or breed-inferred size is known.
- Puppy-only cards are not recommended as top options for adult/senior dogs.
- Senior-only cards are not recommended as top options for puppies.
- If weight is missing but breed is recognized, breed-inferred size is used.
- If a saved breed value is present but unrecognized, only explicit general fallback cards are eligible so noisy free-text values like `abc123` do not drive size/age recommendations.
- If breed is missing entirely but age/size are known, age/size/general cards can still appear.
- If all profile signals are missing, only explicit general fallback cards are eligible.

Scoring prioritizes breed match, size match, age group match, activity/enrichment/training/walking/grooming tags, and category balance across Food, Treats, Toys, and Accessories.

Catalog cards include product specificity metadata:

- `exactProduct`.
- `productLine`.
- `brandCategory`.
- `fallback`.

Product line and brand-category cards are modeled honestly as product lines or official overviews, not exact product/variant claims. General fallback cards are explicitly marked and used when profile data is unclear or a safe broad option is needed.

Breed matching is shared with Phase 8.4A Did You Know through `src/lib/dogBreedMatching.ts`, so the two features now use the same normalization, aliases, curated demo breed list, and Fuse.js-backed fuzzy matching.

Shared matching supports:

- Maltese.
- Rottweiler.
- Border Collie.
- Beagle.
- `Bigel` / `Beagel` -> Beagle.
- `Labrador retriver` -> Labrador Retriever.
- `golden retriver` -> Golden Retriever.
- `frenchie` -> French Bulldog.
- `gsd` -> German Shepherd Dog.
- `husky` -> Siberian Husky.
- `german shepard` -> German Shepherd Dog.
- `mixed breed` / `mutt` -> Mixed Breed.

Unknown values such as `abc123` still fall back safely.

Expected QA behavior:

- Maltese receives small-dog appropriate recommendations.
- Rottweiler receives large-dog appropriate recommendations.
- Beagle receives medium/enrichment/scent/training-style recommendations where available.
- `abc123` receives safe general fallback recommendations.

## Product Catalog Approach

The primary MVP source is a curated/static local catalog.

The catalog contains products across:

- Food.
- Treats.
- Toys.
- Accessories.

The curated catalog was cleaned up to 19 stronger items for demo quality across Food, Treats, Toys, and Accessories. Weak entries were removed instead of keeping a larger but less trustworthy catalog.

Each product card includes:

- category
- brand/company
- product name
- static product, product-line, or official brand/company visual
- short safe reason
- official/product information link
- source label
- favorite/watch-later action

The MVP uses statically curated product, product-line, or official brand/company visuals for every curated catalog card. Styled placeholders remain only as runtime fallback if an image or logo fails to load. Food and Treats cards can show API-backed product images only when Open Pet Food Facts returns clean dog-related data with a product name, image, and product page URL.

Image behavior:

- No runtime scraping is used.
- Every curated catalog card starts with a static `imageUrl` from a product image, product-line visual, or official brand/company logo.
- API-assisted Food/Treat cards may use Open Pet Food Facts product images.
- Static image/logo URLs were manually curated and should match the card brand/product line.
- If an image fails to load, the card falls back to the styled placeholder instead of showing a broken image icon.
- Styled placeholders are not the intended starting state for catalog cards; they are the safe runtime fallback.

Product links were reviewed and weak overview links were removed or replaced. Links that were ambiguous between dog and cat products, too broad for the card, or tied to questionable exact product pages were removed. Remaining links are dog-specific official product, product-line, brand category, or fallback information pages. Links are for information only and are not affiliate, marketplace, cart, checkout, or price links. Overview links remain only when the card is honestly modeled as a product line, brand category, or fallback card.

Catalog cleanup notes:

- Removed weak or misleading entries rather than keeping them for count.
- Removed dog/cat-mixed or overly broad overview links where they did not clearly support the card.
- Replaced mismatched brand images so a card does not show another company's logo or product image.
- Enforced product-name and metadata consistency: explicit small/mini/X-small style items stay small-only, large/giant style items stay large-only, puppy items stay puppy-only, and senior items stay senior-only.
- Added strict fallback behavior for unrecognized saved breed values such as `abc123`.

## API Enrichment Decision

Open Pet Food Facts enrichment was added as a small optional slice for Food and Treats only.

Behavior:

- Uses the public no-key Open Pet Food Facts search endpoint.
- Requests only a small result set for curated Food/Treat cards that define safe search metadata.
- Accepts an API result only when it has a product name, product page URL, image, and dog-food/dog-treat category signal.
- Rejects cat-only or noisy results.
- Uses the API product image, name, brand fallback, and product page URL when accepted.
- Shows `Open Pet Food Facts` and `API assisted` labels for API-backed cards.
- Caches enrichment results in memory and `sessionStorage` for a short period to avoid repeated calls.
- Hides raw API errors from the UI.
- API enrichment can only enrich an already eligible Food/Treat curated card; it cannot introduce unrelated products or bypass eligibility.

Fallback:

- Curated/static catalog cards remain mandatory and are shown when API enrichment fails, is unavailable, is incomplete, or looks unrelated.
- Toys and Accessories remain curated/static because no safe no-key non-food product API was approved for this MVP.

## Favorites / Watch-Later Behavior

Favorites use `localStorage` only.

Key pattern:

- `dogcareai.productFavorites.<userId>`

Behavior:

- Starred product ids persist after refresh in the same browser.
- Saved filter shows starred recommendations.
- Saved ids are reconciled against the current catalog when loaded so stale ids from removed/replaced catalog entries do not inflate the Saved count or create an empty Saved view with a non-zero count.
- No Supabase table, migration, or RLS policy was added.
- No secrets or personal data are stored.

Limitations:

- Saved products do not sync across devices.
- Saved products can be cleared with browser storage.

## Safety Rules

The catalog intentionally avoids:

- checkout
- cart
- purchase flow
- prices
- affiliate links
- scraping
- paid APIs
- medical diagnosis
- nutritional certainty
- allergy treatment claims
- language that says a product is required

Copy uses cautious phrasing such as "may fit", "consider", and "choose the size and life-stage line that matches your dog."

## What Was Intentionally Not Changed

- No schema changes.
- No migrations.
- No RLS changes.
- No environment variable changes.
- No API keys.
- No paid APIs.
- No dependency changes.
- No Telegram behavior changes.
- No Google Login behavior changes.
- No Nearby behavior changes.
- No Assistant or Gemini architecture changes.
- No scheduler or service-role behavior changes.
- No reminder CRUD behavior changes.
- No dog insights content or placement changes. The only dog-insight-related code change is shared breed matcher reuse so Did You Know and Recommendations agree on breed recognition.

## QA Checklist

- `/recommendations` is protected.
- AppShell navigation includes Recommendations.
- Dashboard quick action links to Recommendations.
- Active dog name appears when available.
- Missing breed still shows general recommendations.
- Unknown breed still shows general recommendations.
- Unknown non-empty breed values such as `abc123` show explicit general fallback cards only.
- Missing age shows unknown age group and general recommendations.
- Missing weight shows unknown size group and general recommendations.
- Food, Treats, Toys, Accessories, All, and Saved filters work.
- Star/watch-later action persists after refresh in the same browser.
- Stale saved product ids from older catalog versions are removed from localStorage after favorites load safely.
- Product info links open in a new tab with `rel="noopener noreferrer"`.
- Food/Treat API enrichment can show Open Pet Food Facts-backed image/name/link when a clean dog-related result is available.
- Food/Treat API failure or noisy result falls back to the curated card without raw API errors.
- Toys/Accessories remain curated/static.
- Maltese and the existing Did You Know typo/alias cases use shared breed matching.
- Maltese and Rottweiler do not receive nearly identical top product lists.
- Rottweiler does not receive small-dog-only food recommendations.
- Maltese does not receive large-dog-only harness/accessory recommendations.
- Unknown breed `abc123` with no age/weight details shows explicit general fallback cards only.
- Unknown breed `abc123`, even if other profile fields exist, does not drive specific small/large/puppy/senior product recommendations.
- Food and Treats filters respect the same eligibility gates as the All view.
- Toys and Accessories also respect size, age, and breed tags where practical.
- Product cards fall back to placeholders if API-backed images fail to load.
- Product cards have static product/product-line image or official brand/company logo coverage before runtime fallback.
- Product links open stable official dog product, product-line, brand-category, or fallback information pages.
- Mobile layout stacks cleanly.
- No checkout, cart, prices, affiliate flow, scraping, paid API, API key, or env var appears.
- No medical, nutrition certainty, allergy-treatment, or required-product claims appear.
- Dashboard, Dog Profile, Reminders, Nearby, Google Login, Telegram, Assistant, scheduler, and service-role flows remain unchanged.

## Validation Results

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `git diff --check`: passed with existing LF/CRLF working-copy warnings on touched TypeScript files.
- Build completed with the existing Vite chunk-size warning.
- Curated official/product information links were checked with a lightweight HEAD/GET probe; all returned 200 after cleanup.

## Final Manual QA Results

Final manual QA passed before commit:

- `/recommendations` opens for authenticated users.
- `/recommendations` is protected and redirects unauthenticated users to `/auth`.
- AppShell Recommendations navigation works.
- Dashboard quick action opens Recommendations.
- Product recommendations render correctly.
- Active dog data is used where available.
- Did You Know and Recommendations use the same shared breed matching logic.
- Maltese is recognized consistently and receives small-dog appropriate recommendations.
- Rottweiler is recognized consistently and receives large-dog appropriate recommendations.
- Maltese and Rottweiler receive genuinely different recommendation sets.
- Rottweiler no longer receives Puppy X-Small, Small, Mini, or small-breed-specific food recommendations.
- Maltese no longer receives large-dog-specific accessories or food.
- Unknown breed `abc123` with missing profile details uses explicit general fallback recommendations.
- Missing dog data still shows useful generic fallback recommendations.
- Food, Treats, Toys, and Accessories filters respect size/age/breed eligibility where available.
- Weak or mixed Dog/Cat overview links were removed or replaced.
- Product-line/overview cards are described honestly and are not presented as exact product variants.
- Product links tested during QA did not lead to 404.
- Cards show a product image, product-line image, brand/company logo, or styled fallback.
- Cards do not show broken image icons.
- Category filters work: All, Food, Treats, Toys, Accessories, and Saved.
- Optional Open Pet Food Facts enrichment does not override eligibility and does not break the UI.
- Toys and Accessories remain curated/static and do not depend on product APIs.
- Favorite/star action works.
- Favorites persist after page refresh.
- Stale saved product ids are cleaned from localStorage.
- Saved count reflects only valid products that can actually render.
- Saved filter shows saved products only.
- Removing a favorite updates Saved correctly.
- Mobile layout is usable and cards/filters do not break.
- No runtime scraping was added.
- No raw API errors were shown.
- No prices, checkout, cart, purchase flow, affiliate links, scraping, or marketplace integration were observed.
- No unsafe medical, nutritional certainty, breed-health certainty, or required-product claims were observed.
- Dashboard, Dog Profile, Reminders, Nearby, Google Login, Telegram, Assistant, Dog Insights, and scheduler flows were not broken.

## Risks / TODOs

- Curated product links may change over time.
- localStorage favorites are browser-local and not synced.
- Product image/logo URLs are manually curated and may change over time; the runtime `onError` fallback prevents broken image icons.
- Open Pet Food Facts search quality is not guaranteed; curated fallback must remain in place.
- Product recommendations should continue to avoid medical and nutritional claims.
