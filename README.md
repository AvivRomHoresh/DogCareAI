# DogCareAI

DogCareAI is an AI-assisted web application for dog owners. The project is being built incrementally from the planning documents in `SPEC.md`, `docs/ARCHITECTURE.md`, and `docs/DESIGN.md`.

## Current Status

Phase 7 QA is complete. Phase 8.1 Nearby Places, Phase 8.2 Telegram Reminder Notifications, Phase 8.3 Google Login, Phase 8.4A Breed Recognition + Did You Know, Phase 8.4B Product Recommendations Catalog, Phase 8.4C Breed-Inspired Dog Avatar, and Phase 8.5A Visual Foundation + Logo + Header Cleanup are complete, and DogCareAI remains a beta/demo project that does not provide medical diagnosis.

Next Phase 8 work should continue with page-specific UX/mobile polish and final demo rehearsal.

Vercel Production is the active deployment target. Netlify remains as a backup/static deployment only and should not be used for active Gemini work.

The app currently supports:

- React + Vite + TypeScript
- TailwindCSS
- React Router beta routes
- Local DogCareAI logo/brand in a transparent polished header
- Supabase browser client setup
- Supabase email/password auth with Google Login as a secondary option
- Protected beta routes
- Dog Profile create/edit/archive with Supabase RLS
- Breed-inspired local SVG dog avatar in Dog Profile
- Frontend-only active dog selection through `DogPicker`
- Basic Reminders create/edit/complete/delete for the active dog
- Telegram reminder notifications with test send, manual due-reminder check, scheduled cron-job.org delivery, and duplicate prevention
- Dashboard reminder summaries and a breed-aware Did You Know card for the active dog
- Product Recommendations Catalog with active-dog matching, optional Open Pet Food Facts enrichment for eligible Food/Treat cards, localStorage favorites, and safe fallback recommendations
- Assistant with Mock Mode, deterministic emergency rules, and Gemini through `/api/assistant`
- Phase 7 QA documentation and beta demo guidance

Mock Mode is the recommended default for routine testing and demos to avoid Gemini quota usage. Gemini can be enabled intentionally by setting `MOCK_AI_MODE=false` with a server-side `GEMINI_API_KEY`. Do not create `VITE_GEMINI_API_KEY`.

Activity Log, Vet Finder, chat persistence, and `ai_usage_logs` persistence are not active beta features.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in the frontend-safe Supabase values if you have a Supabase project:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Authentication now requires these frontend-safe Supabase values. Do not add service-role keys to the frontend.

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Open the URL printed by Vite, usually:

   ```text
   http://localhost:5173
   ```

## Environment Variables

Use `.env.example` as the source of truth. Only variables prefixed with `VITE_` are safe for the browser bundle.

Server-side variables such as `GEMINI_API_KEY`, `MOCK_AI_MODE`, `AI_MODEL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CRON_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` are for Vercel Functions or server-side boundaries. They must not be exposed in frontend code.

For local Gemini testing, add `GEMINI_API_KEY` to `.env.local` and set `MOCK_AI_MODE=false` only when intentionally testing real Gemini. Do not create `VITE_GEMINI_API_KEY`; Gemini keys must stay server-side only.

## Deploying to Vercel

Use the Vite framework preset in Vercel.

- Build command: `npm run build`
- Output directory: `dist`
- Required frontend environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Server-side Assistant variables:
  - `GEMINI_API_KEY`
  - `MOCK_AI_MODE`
  - `AI_MODEL`
  - `AI_MAX_INPUT_CHARS`
  - `AI_REQUEST_TIMEOUT_MS`
  - `AI_RATE_LIMIT_MAX_REQUESTS_PER_MINUTE`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_CRON_SECRET`
  - `SUPABASE_SERVICE_ROLE_KEY`

Do not add service-role keys to frontend code or the frontend bundle. `SUPABASE_SERVICE_ROLE_KEY` is server-side only and is used by the scheduled Telegram reminder endpoint. Netlify remains available as a backup/static deployment path, so do not remove `netlify.toml` yet. Active Gemini and Telegram server-side work should use Vercel because `/api/*` routes run as Vercel Functions. `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CRON_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` must not be prefixed with `VITE_`.

The Vercel SPA rewrite intentionally excludes `/api/*` so `/api/assistant` can run as a Vercel Function.

## Available Routes

- `/` - Dashboard basics with active dog and reminder summaries
- `/auth` - Supabase email/password auth with Google Login as a secondary option
- `/dog-profile` - Dog Profile create/edit/archive
- `/assistant` - Beta Assistant with active dog context, emergency pre-check, Mock Mode, and secure Gemini boundary
- `/reminders` - Basic Reminders create/edit/complete/delete and Telegram reminder settings

The `/auth` route contains Supabase email/password auth plus Google Login as a secondary option. Email/password remains available as the reliable fallback path. The `/dog-profile` route supports beta dog profile management through the existing `dogs` table. The `/reminders` route supports basic reminder management through the existing `reminders` table plus optional Telegram reminder settings. The dashboard loads active-dog reminder summaries from the existing `reminders` table without making AI calls. The Assistant route calls `/api/assistant` after explicit user action, uses active dog and reminder context, and runs deterministic emergency keyword detection before Gemini. Emergency responses bypass Gemini and advise contacting a veterinarian immediately. DogCareAI does not provide medical diagnosis.

## Cost-Control Notes

The MVP must remain demoable without paid services. Mock AI Mode stays available for local development and classroom demos and is default-safe when `MOCK_AI_MODE` is missing or true, or when `GEMINI_API_KEY` is missing. Real Gemini calls go only through `/api/assistant`, never from the browser.

`AI_RATE_LIMIT_MAX_REQUESTS_PER_MINUTE` controls a beta best-effort per-user Gemini request guard before real provider calls.

## Phase 7 / Beta Demo Docs

- `docs/DEMO_GUIDE.md` - recommended beta demo flow, known limitations, and success checklist.
- `docs/PHASE_7_QA_PLAN.md` - QA plan and manual test matrix.
- `docs/PHASE_7_MANUAL_QA_RESULTS.md` - full Phase 7 manual QA execution results.
- `docs/PHASE_7_BUG_TRIAGE.md` - triage for bugs and blocked tests found during manual QA.
- `docs/PHASE_7_BUGFIX_ROUND_1.md` - approved Phase 7 bugfix round.
- `docs/PHASE_7_REGRESSION_QA.md` - targeted regression results for the bugfix round.
- `docs/PHASE_7_AUTOMATED_TESTS_ASSESSMENT.md` - decision to defer automated tests for the current beta unless dependency/package changes are explicitly approved.

## Phase 8 Docs

- `docs/PHASE_8_PLAN.md` - final demo upgrade plan.
- `docs/PHASE_8_STEP_1_NEARBY_DOG_PLACES_REPORT.md` - Nearby Places implementation report.
- `docs/PHASE_8_STEP_2_6_TELEGRAM_SCHEDULER_QA_REPORT.md` - completed Telegram scheduler QA and production verification.
- `docs/PHASE_8_STEP_4A_BREED_DID_YOU_KNOW_IMPLEMENTATION_REPORT.md` - completed breed recognition and Did You Know implementation report.
