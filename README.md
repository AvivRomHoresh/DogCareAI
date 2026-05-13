# DogCareAI

DogCareAI is an AI-assisted web application for dog owners. The project is being built incrementally from the planning documents in `SPEC.md`, `docs/ARCHITECTURE.md`, and `docs/DESIGN.md`.

## Current Status

Phase 5 has started with the initial client skeleton only:

- React + Vite + TypeScript
- TailwindCSS
- React Router route stubs
- Supabase browser client setup
- Mock AI mode documented through environment variables

Authentication, Dog Profile, AI Assistant, and Reminders are not implemented yet.

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

   The app skeleton can still open without real Supabase values, but future Supabase features will require them.

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

- `/` - Dashboard stub
- `/auth` - Authentication stub
- `/dog-profile` - Dog Profile stub
- `/assistant` - AI Assistant stub
- `/reminders` - Reminders stub

These routes are placeholders for the approved beta flow. They intentionally do not contain working feature logic yet.

## Cost-Control Notes

The MVP must remain demoable without paid services. Mock AI Mode stays available for local development and classroom demos, and real Gemini calls must later go through a secure server-side boundary.
