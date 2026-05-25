# Phase 8 Step 4B: Product API Feasibility Report

## Purpose

This report records a lightweight feasibility assessment for product data sources that could support Phase 8.4B Breed-Based Product Recommendations.

No app code, schema, environment variables, API keys, dependencies, paid APIs, or persistent test scripts were added.

## APIs Checked

### Open Pet Food Facts

Official/support documentation:

- `https://world.openpetfoodfacts.org`
- `https://support.openfoodfacts.org/help/en-gb/10-open-pet-food-facts/102-where-can-i-find-the-open-pet-food-facts-api`
- `https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/`
- `https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/ref-cheatsheet/`

Reason checked:

- It is pet-specific.
- It can provide food/treat product names, brands, images, category tags, and product page URLs.
- It is based on the Open Food Facts API family.

Observed no-key status:

- Read/search requests worked without an API key in the lightweight Node fetch spike.
- Official Open Food Facts documentation says read operations do not require authentication other than a custom User-Agent.

Observed CORS/browser feasibility:

- Requests with `Origin: http://localhost:5173` returned `Access-Control-Allow-Origin: *`.
- Browser fetch appears feasible, but implementation must still handle CORS/network failures gracefully.

Observed data shape:

- Search responses include `products`.
- Useful fields include:
  - `product_name`
  - `brands`
  - `image_front_small_url`
  - `url`
  - `categories_tags`

Observed quality:

- Searching broad terms such as `dog food` can return mixed pet results, including some cat products.
- Category-filtered search for `dog-food` produced more relevant results.
- Category-filtered search for `dog-treats` produced relevant but limited results.
- Some products have usable image/name/brand/link data, but not all results are demo-polished.

Rate-limit / usage notes:

- Open Food Facts documentation asks API users to use an identifying User-Agent.
- Documentation lists read/search rate limits and warns against search-as-you-type behavior.
- Phase 8.4B should not implement autocomplete or frequent repeated searches.

### Open Food Facts

Reason checked:

- Open Pet Food Facts uses the same API family and documentation pattern.
- It provides the general API behavior, rate-limit guidance, and field-selection patterns.

Feasibility:

- Useful for understanding API usage, but the main product source should be Open Pet Food Facts because DogCareAI recommendations are pet-specific.

### Non-Food Product APIs

No safe no-key product API was identified for toys, accessories, grooming, walking gear, or broad dog products that would avoid scraping, affiliate complexity, marketplace terms, paid access, or unreliable search quality.

Recommendation:

- Keep non-food categories curated/static for the MVP.
- Do not use marketplace APIs, scraping, affiliate product feeds, or paid APIs.

## Lightweight Fetch Spike

The spike used Node's built-in `fetch` through inline commands. No dependency or persistent script was added.

Endpoints checked:

- `https://world.openpetfoodfacts.org/cgi/search.pl?search_terms=dog%20food&search_simple=1&action=process&json=1&page_size=3&fields=product_name,brands,image_front_small_url,url,categories_tags`
- `https://world.openpetfoodfacts.org/cgi/search.pl?tagtype_0=categories&tag_contains_0=contains&tag_0=dog-food&search_simple=1&action=process&json=1&page_size=5&fields=product_name,brands,image_front_small_url,url,categories_tags`
- `https://world.openpetfoodfacts.org/cgi/search.pl?tagtype_0=categories&tag_contains_0=contains&tag_0=dog-treats&search_simple=1&action=process&json=1&page_size=5&fields=product_name,brands,image_front_small_url,url,categories_tags`

Observed results:

| Query | HTTP/CORS | Result quality | MVP usefulness |
|---|---|---|---|
| Broad `dog food` text search | 200 OK, CORS `*` | Mixed dog/cat results | Not reliable enough without filtering |
| Category `dog-food` | 200 OK, CORS `*` | Many dog-food-tagged results with some names, brands, images, and URLs | Practical for optional food enrichment |
| Category `dog-treats` | 200 OK, CORS `*` | Relevant but small result set | Practical for optional treat enrichment |

## Recommended MVP Data Source

Recommendation: hybrid, with local catalog first.

Use:

1. Curated/static local product catalog for all categories.
2. Optional Open Pet Food Facts enrichment for food/treat cards.
3. Local fallback cards whenever the API is unavailable, incomplete, irrelevant, or too slow.

Do not use an external API as the only product source for the demo.

## Product Data That Looks Feasible

Open Pet Food Facts can support:

- Food/treat product name.
- Brand/company.
- Product image URL.
- Product page/info URL.
- Category tags.

Open Pet Food Facts should not be used for:

- Prices.
- Checkout.
- Medical/nutrition claims.
- Allergy suitability claims.
- Real-time stock or availability.
- Toys/accessories/grooming/walking products.

## Product Data That Should Stay Curated

Use local curated/static cards for:

- Toys.
- Accessories.
- Walking gear.
- Grooming items.
- General enrichment ideas.

Why:

- These categories do not have an obvious no-key, no-paid, non-scraping product API.
- Curated cards are more reliable for demo visuals and copy.
- It avoids marketplace/affiliate complexity.

## Fallback Strategy

Fallback should be mandatory:

1. Use matching local catalog cards.
2. If API food/treat results are clean, optionally insert or replace a small number of food/treat cards.
3. If API fails or results are unsuitable, show only local cards.
4. If dog data is missing, show generic product-category ideas.

The UI should never show raw API errors.

## Risks / TODOs

| Risk | Mitigation |
|---|---|
| Open Pet Food Facts search returns irrelevant products | Filter by category tags and keep local catalog primary. |
| Product data may be incomplete | Require product name, brand, image, and URL before showing API-assisted cards. |
| API rate limits | Cache briefly and avoid search-as-you-type or polling. |
| API availability/CORS can change | Keep local fallback mandatory. |
| Product recommendations may look like medical advice | Use cautious copy and avoid health/nutrition certainty. |
| Product images may carry licensing/reuse considerations | Prefer product page links and document source; use placeholders when uncertain. |
| Non-food product APIs are risky | Keep toys/accessories curated/static. |

## Recommendation

Proceed with Phase 8.4B as a curated/static Product Recommendations Catalog MVP.

Optionally add Open Pet Food Facts as a small, fallback-safe assist for food and treats. Use localStorage for favorites/watch-later. Do not add paid APIs, API keys, checkout, prices, affiliate systems, scraping, schema changes, or env variables for the MVP.
