# Phase 8 Step 4A: Dog API Feasibility Report

## Purpose

This report records a small feasibility spike for free dog APIs that could support Phase 8.4A Breed Recognition + Did You Know.

No app code, schema, environment variables, dependencies, paid APIs, or API keys were added.

## APIs Checked

### dogapi.dog

Official documentation:

- `https://dogapi.dog/docs`
- `https://dogapi.dog/docs/api-v2`

Endpoints considered:

- `https://dogapi.dog/api/v2/breeds`
- `https://dogapi.dog/api/v2/facts`

Observed data shape:

- Uses JSON:API-style responses.
- Breed endpoint returns `data`, `meta`, and `links`.
- Each breed record includes:
  - `id`
  - `type`
  - `attributes.name`
  - `attributes.description`
  - additional attributes such as life span, weight, and hypoallergenic status.
- Facts endpoint returns `data` with fact body text in `attributes.body`.

Feasibility:

- No API key was needed for the tested endpoints.
- Fetch succeeded from the local Node spike.
- When tested with an `Origin: http://localhost:5173` header, response headers included `access-control-allow-origin: *`.
- Browser fetch appears feasible, though final implementation should still handle CORS/network failure gracefully.

Notes:

- Name filtering did not appear to reduce the returned breed list in the lightweight spike, so the MVP should expect to fetch the breed list and match client-side.
- Breed descriptions are useful, but external text must be displayed cautiously and never as medical advice.

### Dog CEO API

Official documentation:

- `https://dog.ceo/dog-api/documentation.php`

Endpoints considered:

- `https://dog.ceo/api/breeds/list/all`
- `https://dog.ceo/api/breeds/image/random`
- `https://dog.ceo/api/breed/{breed}/images/random`

Observed data shape:

- Breed list returns:
  - `message`: object of breed names and sub-breed arrays.
  - `status`.
- Image endpoints return:
  - `message`: image URL.
  - `status`.

Feasibility:

- No API key was needed for the tested endpoints.
- Fetch succeeded from the local Node spike.
- Response headers included `access-control-allow-origin: *`.
- Browser fetch appears feasible.

Notes:

- Dog CEO is excellent for breed lists and images.
- It does not provide breed-specific insight text.
- Breed/sub-breed naming may need custom mapping from user-entered free text.
- Dog CEO should be optional for 8.4A unless an image is desired.

## Lightweight Fetch Spike

The spike used Node's built-in `fetch` through an inline command. No dependencies or persistent scripts were added.

Endpoints tested:

- `https://dogapi.dog/api/v2/breeds`
- `https://dogapi.dog/api/v2/facts`
- `https://dog.ceo/api/breeds/list/all`
- `https://dog.ceo/api/breeds/image/random`
- `https://dog.ceo/api/breed/labrador/images/random`

Summary of observed results:

| Endpoint | Result | CORS Observation | Usefulness |
|---|---|---|---|
| dogapi.dog breeds | 200 OK | `access-control-allow-origin: *` when Origin header was sent | Best source for breed descriptions |
| dogapi.dog facts | 200 OK | `access-control-allow-origin: *` when Origin header was sent | Good general fact source |
| Dog CEO breed list | 200 OK | `access-control-allow-origin: *` | Good breed-list/image helper |
| Dog CEO random image | 200 OK | `access-control-allow-origin: *` | Optional visual polish |
| Dog CEO Labrador image | 200 OK | `access-control-allow-origin: *` | Optional breed image |

## Recommended MVP Data Source

Recommendation: use dogapi.dog as the primary API source for Phase 8.4A.

Why:

- It has breed information, not just images.
- It has general dog facts.
- It worked without an API key.
- CORS appeared browser-compatible in the spike.
- It can support the "Did You Know" goal more directly than Dog CEO.

Recommended use:

- Fetch dogapi.dog breeds once and cache briefly in memory or sessionStorage.
- Match the active dog's free-text breed against API breed names with local normalization and aliases.
- Use a short, safe excerpt from the matched breed description.
- If breed matching fails, fetch a dogapi.dog general fact if available.
- If API fact fetch fails, use a local static fallback fact.

Dog CEO role:

- Defer for the first 8.4A implementation unless a breed image is explicitly desired.
- If used, keep it optional and fallback-safe.

## Fallback Strategy

Fallback levels:

1. API-backed breed insight from dogapi.dog.
2. API-backed general dog fact from dogapi.dog.
3. Local static general dog fact.

Local fallback should always exist and should not require network access.

Suggested local fallback:

`Dogs often read routines and body language closely, so consistent daily care cues can help them feel more secure.`

## Risks / TODOs

| Risk | Mitigation |
|---|---|
| dogapi.dog CORS or availability changes | Keep local fallback and do not block Dashboard rendering. |
| Breed name matching is imperfect | Normalize breed input and maintain a small alias map. |
| External descriptions may be too broad or deterministic | Display short cautious excerpts or use local fallback. |
| API calls could happen too often | Cache the breed list/facts and avoid repeated fetches per render. |
| Dog CEO names differ from common breed names | Treat Dog CEO as optional image support only. |
| No official SLA for free APIs | Keep the feature demo-safe without the API. |

## Recommendation

Proceed with a hybrid API-first implementation.

Use dogapi.dog first for breed descriptions and facts, keep local/static fallback for demo reliability, and treat Dog CEO as optional image or breed-list support only.

Do not add API keys, paid APIs, dependencies, schema changes, or env variables for Phase 8.4A.
