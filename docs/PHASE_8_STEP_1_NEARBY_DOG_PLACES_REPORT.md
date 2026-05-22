# Phase 8.1 Nearby Dog Places API MVP Report

## Step Goal

Implement a small, isolated Nearby Dog Places MVP that makes DogCareAI more dog-owner specific by using browser geolocation and OpenStreetMap/Overpass data after explicit user action.

## What Changed

- Added a dedicated `/nearby` page and authenticated navigation tab for Nearby Places.
- Replaced the full Dashboard Nearby card with a compact Dashboard quick-action link.
- Added browser geolocation handling that runs only after the user clicks "Find near me."
- Added manual address search through Nominatim geocoding, triggered only after the user clicks "Search address."
- Added Photon address suggestions after a short debounce for safer no-key OSM-based address discovery.
- Added OpenStreetMap/Overpass search for dog-relevant nearby places.
- Added approximate distance calculation and normalized result categories.
- Added result filters for All, Vets, Pet shops, Dog parks, and Dog groomers.
- Added sorting by best match, distance, and name.
- Added address, website, phone, opening hours, and Google Maps link support when OSM tags provide enough data.
- Added Facebook and Instagram link extraction from OSM tags when available.
- Added a 3 km / 5 km / 10 km radius selector, with 5 km as the default.
- Split per-place Google Maps actions into "Navigate" and "Find on Google Maps."
- Added Google Maps fallback search links as normal outbound URLs only.
- Added brief client-side session cache to avoid repeated identical Overpass calls.
- Added clear UI states for idle, loading, permission denied, unsupported geolocation, no results, API error, and results.
- Added OpenStreetMap attribution and a reminder that results may be incomplete.

## Files Changed

- `src/components/NearbyDogPlacesCard.tsx`
- `src/lib/nearbyDogPlaces.ts`
- `src/App.tsx`
- `src/components/AppShell.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/NearbyPage.tsx`
- `docs/PHASE_8_STEP_1_NEARBY_DOG_PLACES_REPORT.md`

## API / Data Source Used

- Browser Geolocation API.
- Nominatim address geocoding:
  - `https://nominatim.openstreetmap.org/search`
- Photon address suggestions:
  - `https://photon.komoot.io/api/`
- OpenStreetMap data through the public Overpass API endpoint:
  - `https://overpass-api.de/api/interpreter`

No Google Maps API, Google Places API, Google Geolocation API, paid API, API key, or secret was added.

The Google Maps actions are normal outbound URLs only:

- "Navigate" uses an exact coordinate-based Google Maps Directions URL from the mapped OpenStreetMap location.
- "Find on Google Maps" uses a text search URL from the strongest available place name and address.
- Fallback category searches use the selected category plus the searched address or current-location label/coordinates.

These links do not use Google Places API, Google Maps API, Google Geolocation API, Google Place IDs, API keys, Places ratings, reviews, scraping, billing, or secrets.

## Implementation Details

The feature now lives on `/nearby` as a dedicated protected page so the Dashboard stays focused on active-dog summaries and reminders. The Dashboard keeps only a small "Nearby Places" quick-action link.

The helper in `src/lib/nearbyDogPlaces.ts` handles:

- checking browser geolocation support,
- requesting current location after a user click,
- geocoding a typed address through Nominatim after a user click,
- fetching Photon address suggestions after at least 3 typed characters and a debounce,
- building a limited Overpass query,
- fetching nearby results,
- normalizing Overpass nodes, ways, and relations,
- extracting OSM address, website, phone, and opening-hours tags when available,
- extracting OSM Facebook and Instagram tags when available,
- building normal outbound Google Maps directions and search URLs,
- calculating approximate haversine distance,
- calculating a local OSM data-completeness score,
- limiting results,
- caching results in `sessionStorage` for 10 minutes.

The query searches within the selected 3 km, 5 km, or 10 km radius and returns up to 30 normalized results for:

- veterinary clinics,
- pet shops,
- dog parks,
- dog groomers where practical based on available OSM tags.

The UI in `src/components/NearbyDogPlacesCard.tsx` shows:

- category,
- place name or fallback label,
- approximate distance,
- address when available,
- website when available,
- phone when available,
- opening-hours availability when available,
- "Navigate" and "Find on Google Maps" links,
- normal outbound Google Maps fallback search links when OSM results are missing or filtered out,
- Facebook and Instagram links when OSM tags are present,
- data source,
- OSM attribution,
- graceful fallback messages.

Manual address search:

- The user can type an address, such as `התזמורת 60, ראשון לציון`.
- Photon suggestions appear after at least 3 typed characters and about a 700ms debounce.
- Suggestion results are limited to 5 and cached briefly in `sessionStorage`.
- Selecting a suggestion fills the address input and stores its coordinates.
- If a selected suggestion is searched, those coordinates are used directly.
- If Photon fails or returns no suggestions, the manual Nominatim search flow still works.
- Photon suggestion requests are debounced; Nominatim and Overpass requests are not sent while typing.
- Nominatim geocoding runs only when the user clicks "Search address."
- If Nominatim geocoding succeeds, the returned coordinates are used for the existing Overpass nearby search.
- The UI shows the current searched location in the "Searching near" state.
- Empty address, address not found, geocoding unavailable, and search failed states are handled with friendly messages.
- Nominatim is not used for autocomplete.

Current-location behavior:

- Geolocation is never requested on page load.
- The user must click "Find near me" or "Use my current location."
- If cached nearby results exist in `sessionStorage`, the page can restore and display them automatically without triggering a new permission prompt or API request.
- The feature does not auto-trigger the browser location prompt when permission is unknown, denied, or prompt-only.

Filter controls:

- All.
- Vets.
- Pet shops.
- Dog parks.
- Dog groomers.

Sorting controls:

- Best match: local "most complete OSM info" heuristic using website, address, phone, opening hours, name, and distance as tie-breaker.
- Distance: nearest first.
- Name A-Z.

Google ratings and Google reviews are intentionally not used because they require the Google Places API and billing/API-key setup.

## Limitations

- OpenStreetMap/Overpass data may be incomplete or stale.
- Results do not indicate live opening status, availability, emergency capacity, ratings, or appointment status.
- Best match is based on local OSM data completeness, not quality ratings.
- Browser location permission can be denied or unavailable.
- Nominatim can fail, rate-limit, or return no match for ambiguous addresses.
- Mobile browser behavior may vary by platform and permission state.
- This is not an emergency-service locator and does not replace contacting a veterinarian directly.
- Client-side caching is best-effort and scoped to the browser session.
- OSM may miss businesses that appear in Google, Waze, Easy, or other commercial directories.
- Google Maps search may still show similar businesses when names are ambiguous because no Google Place ID is available.

## QA Results

| Check | Result | Notes |
|---|---|---|
| `npm.cmd run lint` | Passed | TypeScript build check completed. |
| `npm.cmd run build` | Passed | Vite production build completed after the dedicated-page refinement. |
| `git diff --check` | Passed | No whitespace errors; Git reported LF/CRLF working-copy warnings only. |
| Local preview app load | Passed | `http://127.0.0.1:4173` returned HTTP 200 and redirected unauthenticated users to `/auth`. |
| `/nearby` route and nav entry | Pending manual verification | Added as a protected route and authenticated nav item. |
| Dashboard quick action | Pending manual verification | Dashboard no longer hosts the full feature and links to `/nearby`. |
| Location requested only after user action | Passed by implementation review | The card calls `getCurrentPosition()` only inside the `Find near me` click handler. |
| Manual address search | Pending manual verification | Nominatim geocoding runs only after clicking `Search address`; Nominatim autocomplete or type-ahead requests were not added. |
| Address suggestions | Pending manual verification | Photon suggestions are debounced, no-key, limited to 5, and cached briefly in `sessionStorage`. Nominatim is not used for autocomplete. |
| Radius selector | Pending manual verification | Supports 3 km, 5 km default, and 10 km. |
| Permission denied state | Not manually forced yet | Covered by explicit geolocation error handling. |
| Unsupported geolocation state | Not manually forced yet | Requires browser capability override or unsupported browser. |
| Repeated loads do not automatically call Overpass | Passed by implementation review | The Overpass request is only made after user-triggered current-location or address search. Cached session results can display without a new request. |
| Results show category, address, distance, source, and links | Not fully executed by Codex | Requires an authenticated session and allowed browser location or successful address search. |
| Filtering and sorting | Pending manual verification | Implemented client-side after fetching all supported categories for the location. |
| Google Maps links | Pending manual verification | Per-place actions split into coordinate-based `Navigate` and text-based `Find on Google Maps`; fallback category searches are normal outbound URLs only. |
| Social/contact links | Pending manual verification | Website, Facebook, Instagram, and `tel:` phone links render when OSM tags provide values. |
| External API failure fallback | Not manually forced yet | Covered by error-state implementation. |

## Phase 7 Regression Checks

Targeted Phase 7 regression checks for this step:

- Auth still works.
- Dog Profile still works.
- DogPicker active dog persistence still works.
- Reminders CRUD still works.
- Dashboard still works.
- Assistant Mock Mode still works.
- Assistant emergency flow still works.
- No direct browser Gemini provider call was introduced.

These are pending manual verification after build/local smoke testing.

Codex validation confirmed lint/build and local app load. Full authenticated browser regression should be run in a normal browser or Vercel Preview because the local Codex browser session could not complete interactive sign-up field entry in this environment.

## Known Risks / Fallbacks

- Overpass may rate-limit or temporarily reject requests; the UI shows a friendly API error and does not crash.
- Nominatim may be unavailable or unable to resolve an address; the UI shows address-specific fallback states.
- Photon suggestions may be unavailable or incomplete; manual Nominatim search remains the fallback.
- If geolocation permission is denied, the UI explains the issue and suggests manual search.
- If geolocation is unsupported, the UI explains that manual search is still available.
- The feature uses no stored precise location and does not persist location to Supabase.
- Google Maps links are normal outbound URLs only and are provided as fallback convenience, not an API integration.
- Google Maps search links can still be ambiguous for similarly named businesses because the app intentionally does not use Google Place IDs or Google Places API.
- The feature does not add schema, RLS, auth, reminder, Gemini, or deployment changes.
