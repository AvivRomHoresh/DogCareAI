# Phase 8 Step 4B: Product Recommendations Catalog Plan

## Purpose

Phase 8.4B plans a demo-safe Product Recommendations Catalog for DogCareAI.

The goal is to make the app feel more useful and dog-owner specific by recommending dog product categories from existing dog profile data, while avoiding checkout, affiliate complexity, paid APIs, medical claims, and broad infrastructure changes.

This is planning only. No app code, schema, environment variables, secrets, paid APIs, or product integrations were added.

## Feature Goal

Add a lightweight recommendations experience that suggests dog-related product categories for the active dog:

- Food.
- Treats.
- Toys.
- Accessories.

Recommendations should be framed as helpful ideas to consider, not as required purchases or veterinary/nutritional advice.

## Current Data Summary

The existing `dogs` model includes:

- `breed`: free-text string or null.
- `age`: numeric years or null.
- `weight`: numeric kilograms or null.
- `activity_level`: `low`, `medium`, `high`, or null.
- `gender`: available but not needed for the MVP.
- `feeding_preferences`, `allergies`, `medical_notes`, and `special_conditions`: available but should be used cautiously and not turned into medical product claims.

The current active dog comes from `useDogs()` and is already available to Dashboard and other authenticated app pages.

### Directly Usable Data

- Breed can be reused through the Phase 8.4A matching/fallback approach.
- Age can be grouped into broad life stages:
  - Puppy: under 1 year.
  - Adult: 1 to under 7 years.
  - Senior: 7 years or older.
- Weight can be used to infer size:
  - Small: under 10 kg.
  - Medium: 10 to under 25 kg.
  - Large: 25 kg or more.
- Activity level can lightly influence wording for toys/accessories.

### Fallback Data Behavior

- Missing breed: use generic dog recommendations.
- Missing age: use adult/general copy without implying life stage.
- Missing weight: use medium/general product sizing copy.
- Missing activity level: use neutral enrichment wording.
- Allergies or medical notes: show a caution to check labels and consult a veterinarian when needed, but do not generate specific medical or nutrition claims.

## Recommendation Strategy

Use a small local catalog as the primary MVP source. Each item should have:

- Category.
- Brand/company.
- Product name.
- Product image or local placeholder.
- Official/product information link when available.
- Short reason why it may fit the dog.
- Safe fit tags such as `small-dog`, `senior`, `high-activity`, or `chew-toy`.

Recommendation matching should be deterministic and explainable:

- Breed group can influence activity/enrichment tone, but not medical advice.
- Age group can influence general category emphasis, such as softer toys for senior dogs or puppy training accessories.
- Size group can influence size wording, such as "choose the small size" or "look for large-dog sizing."
- Activity level can influence toys/accessories, such as puzzle toys for enrichment or walking accessories for active dogs.
- Always include generic fallbacks so every active dog gets useful cards.

## Product Card Fields

Recommended MVP card fields:

- `id`
- `category`
- `brand`
- `productName`
- `imageUrl` or local placeholder style
- `officialUrl`
- `reason`
- `sourceLabel`
- `fitTags`
- `isApiAssisted`

Display fields:

- Category badge.
- Brand/company.
- Product name.
- Product image or polished placeholder.
- Short reason.
- Official/product info link.
- Favorite or watch-later action.

Copy should use cautious language:

- Use "may fit", "consider", "look for", or "good demo match".
- Avoid "required", "best", "medically needed", "treats allergies", or "prevents disease".

## API Feasibility Summary

The companion feasibility report evaluated Open Pet Food Facts / Open Food Facts.

Recommendation: use a hybrid approach.

- Primary MVP source: curated/static local catalog.
- Optional API assist: Open Pet Food Facts for food/treat product name, brand, image, and product page link where results are clean.
- Mandatory fallback: local product cards remain available when the API fails, returns incomplete data, or returns irrelevant products.

Food/treat API enrichment is practical enough for a small optional enhancement, but not reliable enough to be the only catalog source for the final demo. Non-food categories should start curated/static.

## Favorites / Watch-Later Recommendation

Recommended MVP storage: `localStorage`.

Why:

- No schema/RLS migration is needed.
- Keeps the feature isolated and reversible.
- Safe for the deadline.
- Enough for demo behavior such as starring cards in the current browser.

Tradeoffs:

- Favorites do not sync across devices.
- Favorites may be cleared with browser data.
- Favorites are not shared across accounts in a secure persistent way.

Supabase table with RLS is the stronger long-term option, but it adds migration, policies, QA, and production deployment risk. Defer Supabase persistence unless favorites become a core assessed requirement.

Suggested localStorage key:

- `dogcareai.productFavorites.<userId>`.

Store only product/card ids, not secrets or personal data.

## UI Placement Recommendation

Recommended MVP placement: dedicated authenticated page.

Suggested route:

- `/recommendations`

Why:

- Product cards need room for filters, categories, images, links, and favorite actions.
- Dashboard already has reminders, Did You Know, and quick actions.
- A dedicated page feels more like a real feature and less like a crowded dashboard widget.

Navigation:

- Add an AppShell navigation entry such as "Recommendations".
- Add a small Dashboard quick action link after the page exists.

Optional later placement:

- Dog Profile can include a small link to recommendations for the selected dog.

## Implementation Phases

### Phase 8.4B.1: Static Catalog MVP

- Create local product catalog data.
- Create recommendation helper that accepts the active dog.
- Infer age group and size group.
- Render a dedicated recommendations page.
- Add filters for category.
- Add favorite/watch-later using localStorage.
- Use polished placeholders or curated image URLs only if the source is safe and stable.

### Phase 8.4B.2: Optional Open Pet Food Facts Assist

- Fetch a small number of food/treat products only after page load or user action.
- Use no API keys.
- Limit requests and cache briefly.
- Only accept products with name, brand, image, and product page link.
- Keep local catalog cards if API results are incomplete or irrelevant.
- Do not show prices.

### Phase 8.4B.3: Documentation + QA

- Add implementation report.
- Update README and demo guide after implementation.
- Run feature QA and Phase 7/8 regression checks.

## QA Checklist

- Recommendations page is protected behind auth.
- Active dog context appears correctly.
- Breed, age, weight, and activity-level fallbacks work when missing.
- Puppy/adult/senior grouping behaves as expected.
- Small/medium/large size grouping behaves as expected.
- Generic recommendations appear for incomplete profiles.
- Food, treats, toys, and accessories categories are present.
- Product card links open in a new tab with `rel="noopener noreferrer"`.
- Favorite/watch-later toggles persist in localStorage for the current user/browser.
- No purchase/checkout behavior exists.
- No price is shown unless later explicitly approved.
- No medical diagnosis, nutritional certainty, allergy treatment, or required-product claim appears.
- API failure, CORS failure, or empty API results fall back to local catalog.
- Dashboard, Dog Profile, Reminders, Nearby, Google Login, Telegram, Assistant, and scheduler flows are unchanged.
- No API keys, env vars, schema changes, RLS changes, paid services, or secrets are introduced.

## Risks / TODOs

| Risk | Mitigation |
|---|---|
| Product recommendations could imply medical or nutritional advice | Use cautious copy and avoid allergy/disease claims. |
| Open Pet Food Facts search quality is inconsistent | Keep curated local catalog as primary source. |
| Product links/images may change | Prefer official/product information links and fallback placeholders. |
| Favorites via localStorage are not synced | Accept for MVP; document as demo-local behavior. |
| Page could feel like shopping | Use "ideas" and "official info" framing, no prices, cart, checkout, or affiliate language. |
| Scope creep into marketplace APIs | Keep paid APIs, scraping, affiliate links, and checkout out of scope. |

## Go / No-Go Recommendation

Proceed with Phase 8.4B using a curated/static product catalog first.

Add API-assisted food/treat enrichment only if it stays small and fallback-safe. Use localStorage for favorites/watch-later for the final demo. Defer Supabase persistence, checkout, prices, affiliate integrations, and live shopping APIs.
