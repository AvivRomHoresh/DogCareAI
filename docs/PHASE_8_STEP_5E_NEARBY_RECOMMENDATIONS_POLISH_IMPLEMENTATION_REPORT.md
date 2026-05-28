# Phase 8.5E Nearby + Recommendations Polish Implementation Report

## Summary

Phase 8.5E polishes the Nearby and Recommendations pages without changing backend behavior, auth, reminders, dog profile, assistant, dog insights, or product recommendation matching logic. Nearby search remains OpenStreetMap/Overpass based with browser geolocation or address search, and Recommendations keeps the existing curated catalog, optional Open Pet Food Facts enrichment, filters, favorites, and localStorage behavior.

## Files Changed

- `src/components/NearbyDogPlacesCard.tsx`
- `src/components/icons/NearbyIcon.tsx`
- `src/components/icons/RecommendationsIcon.tsx`
- `src/pages/NearbyPage.tsx`
- `src/pages/RecommendationsPage.tsx`
- `docs/PHASE_8_STEP_5E_NEARBY_RECOMMENDATIONS_POLISH_IMPLEMENTATION_REPORT.md`

## Nearby Reliability Findings

- Nearby search continues to use the existing OpenStreetMap/Overpass, Photon, and Nominatim flow.
- The previous search concern appears likely temporary based on the current implementation path and manual context.
- No backend validation service, scraping, API key, dependency, or paid service was added.
- Website link handling is best-effort sanitation only; it does not guarantee that a remote site is live.

## Nearby UI Polish

- Replaced the older boxed Nearby page header with a centered transparent title area.
- Added a local inline SVG nearby/location icon next to the title.
- Added user-facing copy that explains the page can help find vets, pet shops, dog parks, and groomers.
- Kept the imperfect-results note visible but subtle.
- Moved the "Searching near" and radius summary into the search card so it feels like contextual search status.
- Aligned the address input and radius select with matching heights and bottom alignment on desktop.
- Kept current-location and address search actions available.
- Removed prominent implementation-tool wording from the main title area while preserving subtle OpenStreetMap attribution.

## Nearby Result Cards

- Centered each result title.
- Removed the primary "Source" and completeness score text from result cards.
- Removed the "Find on Google Maps" / Google Maps search fallback action.
- Kept the direct navigation link based on the mapped place coordinates.
- Kept a subtle footer note that place details come from OpenStreetMap and may be incomplete.

## Website Link Handling

- Website actions are shown only when a URL is present and passes conservative client-side sanitation.
- Accepted website URLs must normalize to `http` or `https` and have a plausible hostname.
- Missing, invalid, non-web, or questionable values render as `No website available`.
- No runtime `HEAD` checks or CORS-sensitive live validation were added.

## Pagination

- Nearby searches now keep up to 90 loaded results so pagination can appear when more than 30 results are available.
- The UI shows 30 results per page.
- Page controls use Previous, numbered page buttons, and Next.
- Pagination is client-side only over already-loaded results and does not refetch when changing pages.
- Pagination resets to page 1 when the loaded places, filter, or sort order changes.

## Recommendations Polish

- Replaced the older boxed Recommendations page header with a centered transparent title area.
- Added a local inline SVG recommendations/product icon next to the title.
- Replaced demo/internal subtitle wording with user-facing personalized product-ideas copy.
- Removed small internal/demo badges under the title, including active dog, catalog/API, and checkout labels.
- Kept recommendation matching logic, product catalog logic, API enrichment, favorites, localStorage, filters, and safety copy unchanged.

## Intentionally Not Changed

- Nearby data source, fetch endpoints, geolocation behavior, address suggestion behavior, and cache strategy remain fundamentally unchanged.
- Recommendations logic, filters, favorites, Open Pet Food Facts enrichment, and product recommendation eligibility were not changed.
- Dashboard, Dog Profile, Assistant, Reminders CRUD, Telegram, scheduler, auth, Google Login, dog insights, schema, migrations, RLS, storage, env files, service-role behavior, backend behavior, dependencies, and paid services were not changed.

## Mobile / Responsive Notes

- Nearby and Recommendations title areas center and scale down on narrow screens.
- Nearby search controls stack cleanly on mobile.
- Result cards keep centered titles and mobile-friendly action layout.
- Pagination controls wrap on narrow screens and remain keyboard reachable.

## QA Checklist

- Nearby page loads for an authenticated user.
- Nearby title is centered and includes the local nearby/location icon.
- Nearby copy mentions vets, pet shops, dog parks, and groomers.
- Address input and Radius select align cleanly on desktop and stack on mobile.
- "Searching near" and Radius status appear inside the search card after a search.
- Current-location search still works.
- Address search and suggestions still work.
- Category filters still work.
- Sort controls still work.
- Result card titles are centered.
- Source/completeness text is no longer prominent on each result card.
- "Search dog services on Google Maps" / Google search fallback action is not shown.
- Website links show only for safe-looking website URLs.
- Missing or questionable website values show `No website available`.
- Pagination appears when more than 30 results are loaded.
- Changing pages does not refetch results.
- OpenStreetMap attribution remains subtle.
- Recommendations page title is centered and includes the local recommendations icon.
- Recommendations subtitle is user-facing and avoids demo/catalog implementation wording.
- Internal/demo badges are not shown under the Recommendations title.
- Recommendations filters, favorites, localStorage, and optional API enrichment still work.
- No schema, env, backend, dependency, or unrelated feature behavior changed.

## Final Manual QA Results

- Nearby title and icon look polished.
- Search from address and Radius are visually aligned.
- Address search works.
- Use my current location works.
- Searching near/radius context is shown inside the search component area.
- Nearby result titles are centered.
- Per-card Source text is removed from the primary UI.
- Google Maps fallback/search action is removed.
- Website handling is clear: valid-looking URLs show a website action, and missing/invalid URLs show `No website available`.
- Nearby pagination works when more than 30 results are loaded.
- Pagination changes pages client-side without obvious refetch/reset behavior.
- Nearby mobile layout does not show obvious overflow.
- Recommendations title and icon look polished.
- Recommendations internal/demo badges were removed.
- Recommendations subtitle is user-facing and no longer sounds like demo/internal copy.
- Recommendation filters still work.
- Favorites/localStorage still work.
- Product cards and Open Pet Food Facts optional enrichment were not broken.
- No env, schema, storage, backend, RLS, dependencies, API keys, or unrelated feature behavior changed.

## Hotfix Note: Nearby Reliability

- After merge, production Nearby search showed the generic load-error state for both current-location and address searches.
- Browser Network evidence showed the production request to `https://overpass-api.de/api/interpreter?data=...` failed with HTTP `406`.
- Local development still worked, which pointed to a production/browser transport issue rather than a no-results state.
- Investigation found the 8.5E loaded-result cap change from 30 to 90 does not materially change the external Overpass query shape because the query still uses `out body center 100`; the cap is client-side slicing after a response.
- The root transport fix replaces the Overpass GET URL-query request with a POST request using `application/x-www-form-urlencoded;charset=UTF-8` and a `data` form body.
- The primary endpoint remains `https://overpass-api.de/api/interpreter`.
- If the primary endpoint returns `406`, `429`, `502`, `503`, `504`, or has a network/parse failure, the app tries one fallback endpoint: `https://overpass.private.coffee/api/interpreter`.
- If all endpoints fail, the UI keeps the existing clean Nearby load-error message and does not expose raw technical errors.
- Sanitized console warnings include only endpoint label, HTTP status, and error category.
- Pagination remains implemented as a client-side UI over already-loaded results and does not refetch on page changes.
- The fix preserves the 8.5E Nearby visual polish, website sanitation, centered titles, subtle source note, Recommendations polish, and no-results/error separation.
- QA should verify current-location search, address search, no-results state, error state, fallback behavior if the primary endpoint fails, and that page changes never refetch when pagination is visible.

### Hotfix Manual QA Results

- Nearby works locally.
- Overpass request now uses POST.
- No long Overpass GET request with `?data=...` is used.
- Address search still works.
- Use my current location still works.
- Nearby visual polish remains intact.
- Recommendations polish remains unchanged.
- UI still shows the clean load-error message if all Overpass attempts fail.
- No env, schema, storage, backend, RLS, dependencies, API keys, or unrelated feature behavior changed.

## Follow-Up Reliability Refinement

- Production QA showed the primary Overpass endpoint can consistently return `406`, while the fallback endpoint succeeds but can take around 50 seconds.
- The app now remembers a primary `406` for the current browser session using sessionStorage and skips directly to the fallback endpoint on later Nearby searches in that session.
- The endpoint preference is session-only and is not persisted long-term.
- The Overpass query was lightened by removing `relation` clauses and keeping `node` and `way` searches for vets, pet shops, dog parks, and dog groomers.
- The query still uses POST form encoding and keeps `[out:json][timeout:18]`.
- If a search takes longer than about 9 seconds, the UI changes the loading message to: `Still searching nearby places... this can take a few more seconds.`
- No endpoint, status, query, coordinate, or address details are shown in the UI.
- QA should verify a first production search can fall back after primary `406`, a second search in the same tab skips the primary endpoint, and the long-loading message appears without disrupting results.

## Result-First Reliability Refinement

- Production QA showed the Private.coffee Overpass endpoint is the endpoint that returns real results, while `overpass-api.de` can quickly fail with `406`.
- The endpoint order now prefers `https://overpass.private.coffee/api/interpreter` first.
- `https://overpass-api.de/api/interpreter` remains as a secondary fallback only.
- If the secondary endpoint returns `406`, the app remembers that for the current browser session and skips the secondary endpoint on later searches.
- Each Nearby search gets a finite total Overpass budget of about 110 seconds, so slow valid responses can complete while avoiding infinite loading.
- The query remains node/way-only for the supported Nearby categories and keeps relation clauses removed.
- Loading copy now progresses in three calm stages:
  - initial: `Checking your location and searching OpenStreetMap...`
  - after about 9 seconds: `Still searching nearby places... this can take a few more seconds.`
  - after about 30 seconds: `Map data is taking longer than usual. We are still searching for nearby places...`
- Existing sessionStorage result caching remains available for recently loaded rounded-location/radius searches.
- Cached results are labeled with `Showing recently loaded nearby results.`
- If all endpoint attempts fail and no cached result is available, the UI keeps the existing clean Nearby load-error message.
- No backend proxy, env vars, API keys, paid service, dependency, or schema/storage changes were added.

### Result-First Local QA Results

- Nearby current-location search works.
- Nearby address search works.
- Overpass requests remain POST, not long GET `?data=...` requests.
- Preferred endpoint is Private.coffee.
- `overpass-api.de` remains secondary fallback only.
- Loading messages are clear for slow searches.
- Nearby visual polish remains intact.
- Recommendations polish remains unchanged.
- No env, schema, storage, backend, RLS, dependencies, API keys, or unrelated feature behavior changed.

## Endpoint Strategy Hotfix

- Local QA after the result-first merge showed Nearby still worked, but development searches became slower because Private.coffee was preferred for every environment.
- The endpoint order was adjusted back to `https://overpass-api.de/api/interpreter` first to restore the faster local path.
- Private.coffee remains the single fallback endpoint when the primary endpoint returns a recoverable error such as production `406`.
- A primary `406` from `overpass-api.de` is still remembered in sessionStorage for the current browser session, so later searches in that tab skip directly to Private.coffee.
- POST form-encoded Overpass requests are preserved; the app does not return to long GET `?data=...` URLs.
- The lighter node/way-only query, finite long timeout, clear slow-loading messages, cached-result fallback, Nearby visual polish, pagination, website handling, and Recommendations polish remain unchanged.
- No backend proxy, env vars, API keys, paid service, dependency, schema, storage, RLS, or unrelated feature behavior changes were added.
- QA should verify local current-location and address searches are fast again, production can still fall back after a primary `406`, and repeat production searches in the same tab skip the primary endpoint after that `406`.

### Endpoint Strategy Hotfix Local QA Results

- Nearby current-location search feels fast again.
- Nearby address search feels fast again.
- Overpass requests still use POST, not long GET `?data=...` requests.
- `overpass-api.de` is restored as the primary endpoint.
- Private.coffee remains fallback only.
- Session-level skip after an `overpass-api.de` `406` remains in place.
- Nearby visual polish remains intact.
- Recommendations polish remains unchanged.
- No env, schema, storage, backend, RLS, dependencies, API keys, or unrelated feature behavior changed.

### Follow-Up Local QA Results

- Nearby current-location search still works.
- Nearby address search still works.
- Overpass requests remain POST, not long GET `?data=...` requests.
- Nearby visual polish remains intact.
- Long-loading message is available for slow searches.
- Recommendations polish remains unchanged.
- No env, schema, storage, backend, RLS, dependencies, API keys, or unrelated feature behavior changed.

## Validation Results

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed, with the existing Vite chunk-size warning.
- `git diff --check`: passed, with expected LF/CRLF working-copy warnings on Windows.

## Risks / TODOs

- Website sanitation is intentionally best-effort and does not prove that a website is live.
- Nearby result completeness depends on OpenStreetMap data coverage.
- A future browser QA pass should test pagination in a high-density location with more than 30 dog-related results.
