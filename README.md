# DogCareAI

DogCareAI is an AI-assisted web application for dog owners. The project is being built incrementally from the planning documents in `SPEC.md`, `docs/ARCHITECTURE.md`, and `docs/DESIGN.md`.

## Current Status

Phase 6 has started with authentication, protected route setup, database schema, Dog Profile support, Basic Reminders, Dashboard basics, and the beta mock Assistant flow:

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
- Beta Assistant mock responses using active dog and reminder context
- Deterministic emergency pre-check before mock response generation
- Mock AI mode documented through environment variables

No real Gemini calls are made yet. The Gemini/server-side boundary remains deferred to Phase 6 Step 8.

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

Server-side variables such as `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `MOCK_AI_MODE` are reserved for a future Supabase Edge Function or serverless function. They must not be exposed in frontend code.

## Available Routes

- `/` - Dashboard basics with active dog and reminder summaries
- `/auth` - Supabase email/password auth
- `/dog-profile` - Dog Profile create/edit/archive
- `/assistant` - Beta mock Assistant with active dog context and emergency pre-check
- `/reminders` - Basic Reminders create/edit/complete/delete

The `/auth` route contains Supabase email/password auth. The `/dog-profile` route supports beta dog profile management through the existing `dogs` table. The `/reminders` route supports basic reminder management through the existing `reminders` table. The dashboard loads active-dog reminder summaries from the existing `reminders` table without making AI calls. The Assistant route supports frontend-local beta mock responses, uses active dog and reminder context, and runs deterministic emergency keyword detection before generating any mock response.

## Cost-Control Notes

The MVP must remain demoable without paid services. Mock AI Mode stays available for local development and classroom demos. The current Assistant does not call Gemini or any real AI provider; real Gemini calls must later go through a secure server-side boundary.
