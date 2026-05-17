# DogCareAI

DogCareAI is an AI-assisted web application for dog owners. The project is being built incrementally from the planning documents in `SPEC.md`, `docs/ARCHITECTURE.md`, and `docs/DESIGN.md`.

## Current Status

Phase 6 beta implementation is complete, and the current phase is Phase 7 QA. DogCareAI remains a beta/demo project and does not provide medical diagnosis.

Vercel Production is the active deployment target. Netlify remains as a backup/static deployment only and should not be used for active Gemini work.

The app currently supports:

- React + Vite + TypeScript
- TailwindCSS
- React Router beta routes
- Supabase browser client setup
- Supabase email/password auth
- Protected beta routes
- Dog Profile create/edit/archive with Supabase RLS
- Frontend-only active dog selection through `DogPicker`
- Basic Reminders create/edit/complete/delete for the active dog
- Dashboard reminder summaries for the active dog
- Assistant with Mock Mode, deterministic emergency rules, and Gemini through `/api/assistant`

Mock Mode is the recommended default for routine testing and demos to avoid Gemini quota usage. Gemini can be enabled intentionally by setting `MOCK_AI_MODE=false` with a server-side `GEMINI_API_KEY`. Do not create `VITE_GEMINI_API_KEY`.

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

Server-side variables such as `GEMINI_API_KEY`, `MOCK_AI_MODE`, `AI_MODEL`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` are for the Vercel Function or future server-side boundaries. They must not be exposed in frontend code.

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
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

Do not add service-role keys to Vercel or the frontend bundle. Netlify remains available as a backup/static deployment path, so do not remove `netlify.toml` yet. Active Gemini work should use Vercel because `/api/assistant` runs as a Vercel Function. `GEMINI_API_KEY` must not be prefixed with `VITE_`.

The Vercel SPA rewrite intentionally excludes `/api/*` so `/api/assistant` can run as a Vercel Function.

## Available Routes

- `/` - Dashboard basics with active dog and reminder summaries
- `/auth` - Supabase email/password auth
- `/dog-profile` - Dog Profile create/edit/archive
- `/assistant` - Beta Assistant with active dog context, emergency pre-check, Mock Mode, and secure Gemini boundary
- `/reminders` - Basic Reminders create/edit/complete/delete

The `/auth` route contains Supabase email/password auth. The `/dog-profile` route supports beta dog profile management through the existing `dogs` table. The `/reminders` route supports basic reminder management through the existing `reminders` table. The dashboard loads active-dog reminder summaries from the existing `reminders` table without making AI calls. The Assistant route calls `/api/assistant` after explicit user action, uses active dog and reminder context, and runs deterministic emergency keyword detection before Gemini. Emergency responses bypass Gemini and advise contacting a veterinarian immediately. DogCareAI does not provide medical diagnosis.

## Cost-Control Notes

The MVP must remain demoable without paid services. Mock AI Mode stays available for local development and classroom demos and is default-safe when `MOCK_AI_MODE` is missing or true, or when `GEMINI_API_KEY` is missing. Real Gemini calls go only through `/api/assistant`, never from the browser.

`AI_RATE_LIMIT_MAX_REQUESTS_PER_MINUTE` controls a beta best-effort per-user Gemini request guard before real provider calls.
