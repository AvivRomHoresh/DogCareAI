# Phase 6 Step 8B: Gemini Through Vercel Server-Side Function Report

## Branch

- `phase-6-gemini-vercel-function`

## Step Goal

Add real Gemini support behind a secure Vercel Function while preserving Mock Mode, deterministic emergency behavior, fallback behavior, and the existing beta-safe scope.

## Files Changed

- `api/assistant.js`
- `src/lib/mockAiResponse.ts`
- `src/pages/AssistantPage.tsx`
- `.env.example`
- `README.md`
- `docs/PHASE_6_GEMINI_BOUNDARY.md`

## Vercel Function Behavior

- Added `api/assistant.js` as the server-side AI boundary.
- Accepts only `POST`.
- Expects JSON with `dog_id` and `question`.
- Requires `Authorization: Bearer <supabase_access_token>`.
- Returns JSON only and does not return stack traces or secrets.
- Uses the existing `@supabase/supabase-js` dependency.

## Gemini Behavior

- Gemini is called only when:
  - `MOCK_AI_MODE=false`
  - `GEMINI_API_KEY` exists
  - the request is authenticated
  - the active dog is verified through Supabase RLS
  - the question is not an emergency
- Uses REST `fetch` instead of adding a Gemini SDK dependency.
- Uses `AI_MODEL` when configured, otherwise `gemini-2.5-flash`.
- Builds a compact prompt with veterinary safety rules, detected intent, active dog profile summary, relevant reminders, and the user question.
- Does not include secrets, Supabase tokens, service-role keys, full chat history, or unnecessary private data.

## Mock Mode Behavior

- If `MOCK_AI_MODE` is missing, the function defaults to mock mode.
- If `MOCK_AI_MODE=true`, Gemini is not called.
- If `GEMINI_API_KEY` is missing, Gemini is not called.
- Mock responses remain contextual and include active dog name, detected intent, compact profile context, and relevant reminders when available.
- Mock responses return `response_source = "mock"`.

## Emergency Behavior

- The Vercel Function runs deterministic emergency detection before Gemini.
- Emergency responses return `response_source = "emergency_rule"`, `is_emergency = true`, and `detected_intent = "emergency"`.
- Emergency responses advise contacting a veterinarian or emergency animal clinic immediately.
- Emergency responses do not diagnose and do not generate speculative medical instructions.
- The frontend emergency pre-check remains in place for fast UX and cost protection.

## Supabase Validation Behavior

- The function reads `SUPABASE_URL` with fallback to `VITE_SUPABASE_URL`.
- The function reads `SUPABASE_ANON_KEY` with fallback to `VITE_SUPABASE_ANON_KEY`.
- The function creates a Supabase client with the anon key and the user's bearer token.
- The function validates the authenticated user with Supabase Auth.
- The function fetches the dog row through the RLS-protected authenticated flow.
- The function verifies the dog row belongs to the authenticated user.
- The function fetches reminders for that dog through the same RLS-protected flow.
- No Supabase service-role key is used.

## Frontend Behavior

- `/assistant` keeps local user message display and does not persist chat messages.
- Normal non-emergency sends call `/api/assistant` with the Supabase access token.
- Returned structured response metadata is displayed in the chat.
- If `/api/assistant` fails, the frontend shows a friendly fallback response and still uses local dog context for a beta-safe message.
- No AI request is made on page load.

## Cost-Control Confirmation

- No automatic background LLM calls were added.
- Gemini is called only after explicit user send.
- Deterministic emergency detection runs before Gemini.
- Mock Mode remains default-safe.
- Provider timeout uses `AI_REQUEST_TIMEOUT_MS`, default `12000`.
- Prompt input is capped with `AI_MAX_INPUT_CHARS`, default `6000`.
- Provider failures, timeouts, rate limits, empty responses, and thrown errors return a safe fallback.

## Security Confirmation

- `GEMINI_API_KEY` is used only in the Vercel Function.
- No `VITE_GEMINI_API_KEY` was added.
- No real secrets were committed.
- No Supabase service-role key is used.
- Gemini calls are not made from the browser.
- Browser calls `/api/assistant`, not `generativelanguage.googleapis.com`.
- Full chat history is not sent or persisted.
- No full prompts are logged by default.

## Environment Variables Required

Frontend-safe:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-side:

- `GEMINI_API_KEY`
- `MOCK_AI_MODE`
- `AI_MODEL`
- `AI_MAX_INPUT_CHARS`
- `AI_REQUEST_TIMEOUT_MS`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Intentionally Not Implemented

- No Supabase Edge Functions.
- No Netlify Functions.
- No service-role usage.
- No schema changes.
- No RLS changes.
- No migrations.
- No new tables.
- No chat persistence.
- No `ai_usage_logs` persistence.
- No paid-only services.
- No final-only screens.

## Manual Smoke Test Checklist

- Sign in with a Supabase email/password account.
- Create/select an active dog.
- Open `/assistant`.
- With `MOCK_AI_MODE=true` or missing `GEMINI_API_KEY`, confirm mock response still works.
- Confirm `response_source = mock`.
- Set `GEMINI_API_KEY` and `MOCK_AI_MODE=false`.
- Ask a normal dog-care question and confirm `response_source = gemini`.
- Confirm the answer uses dog context.
- Confirm no Gemini key appears in browser source, console, network response, or frontend bundle.
- Confirm browser calls `/api/assistant`, not `generativelanguage.googleapis.com`.
- Ask `my dog is choking` and confirm `response_source = emergency_rule`.
- Ask `הכלב לא נושם` and confirm emergency flow.
- Ask `שלג נדרס, מה ניתן לעשות?` and confirm emergency flow.
- Temporarily simulate missing/invalid `GEMINI_API_KEY` and confirm fallback/mock behavior is friendly.
- Confirm `/`, `/dog-profile`, `/reminders`, and `/assistant` still work.
- Confirm build and lint pass.

## Build and Lint Results

| Command | Result | Notes |
|---|---|---|
| `node -e "import('./api/assistant.js').then(() => console.log('api import ok'))"` | Passed | Basic Vercel Function syntax/import sanity check. |
| `npm.cmd run build` | Passed | Required elevated sandbox permissions so Vite could spawn esbuild. |
| `npm.cmd run lint` | Passed | TypeScript check completed successfully. |

## Readiness Statement for Phase 6 Step 9

After review, manual smoke testing, and merge, the project will be ready for Phase 6 Step 9: Stabilization before Phase 7 QA.
