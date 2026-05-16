# Phase 6 Step 8A: Vercel Hosting Compatibility Report

## Branch

- `phase-6-vercel-hosting-compatibility`

## Step Goal

Prepare the existing React + Vite + Supabase beta app for Vercel deployment without adding Gemini or server-side functions.

## Files Changed

- `vercel.json`
- `README.md`
- `docs/PHASE_6_VERCEL_HOSTING.md`

## Vercel Config Added

- Added `vercel.json` with a single SPA rewrite to `/index.html`.
- The SPA rewrite intentionally excludes `/api/*` so future Vercel Functions can work.
- The rewrite supports direct refreshes and deep links for React Router beta routes:
  - `/`
  - `/auth`
  - `/dog-profile`
  - `/assistant`
  - `/reminders`

## Environment Variables Needed in Vercel

Frontend-safe required variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not add `SUPABASE_SERVICE_ROLE_KEY` to the frontend. `GEMINI_API_KEY` is not part of this step and must not be prefixed with `VITE_` when added later behind a secure server-side boundary.

## Manual Deployment Checklist

- Create or connect the Vercel project from the GitHub repository.
- Use framework preset: Vite.
- Use build command: `npm run build`.
- Use output directory: `dist`.
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project environment variables.
- Deploy a preview.
- Open `/`, `/auth`, `/dog-profile`, `/assistant`, and `/reminders` directly in the browser.
- Refresh each route and confirm Vercel serves the app through `index.html`.
- Confirm authentication, Dog Profile, Dashboard, Reminders, and mock Assistant behavior still work with Supabase RLS.
- Keep Netlify deployment and `netlify.toml` in place until Vercel is verified.

## Validation Results

| Command | Result | Notes |
|---|---|---|
| `npm.cmd run build` | Passed | Required elevated sandbox permissions so Vite could spawn esbuild. |
| `npm.cmd run lint` | Passed | TypeScript check completed successfully. |

## Intentionally Not Implemented

- No Gemini.
- No Vercel Functions.
- No Netlify Functions.
- No Supabase Edge Functions.
- No schema changes.
- No RLS changes.
- No migrations.
- No new tables.
- No persistence changes.
- No paid services.
- Netlify config was not removed.
