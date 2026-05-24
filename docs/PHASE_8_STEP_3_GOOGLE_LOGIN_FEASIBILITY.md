# Phase 8 Step 3: Google Login Feasibility

## Purpose

This document assesses whether adding Google Login through Supabase Auth is practical and safe for the final DogCareAI demo.

This is a planning-only step. No Google Login code, Supabase provider settings, OAuth secrets, or auth behavior changes are implemented here.

## Current Auth Summary

DogCareAI currently uses Supabase email/password authentication.

Current auth implementation:

- `src/pages/AuthPage.tsx` provides sign in and sign up with email/password through `supabase.auth.signInWithPassword` and `supabase.auth.signUp`.
- `src/hooks/useAuth.tsx` loads the current Supabase session with `supabase.auth.getSession` and subscribes to `supabase.auth.onAuthStateChange`.
- `src/components/ProtectedRoute.tsx` redirects unauthenticated users to `/auth`.
- `src/components/PublicOnlyRoute.tsx` redirects authenticated users away from `/auth` to `/`.
- `src/components/AppShell.tsx` shows authenticated navigation and handles logout with `supabase.auth.signOut`.
- `src/lib/supabaseClient.ts` uses only frontend-safe `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

The existing session listener should work with Supabase OAuth once Google redirects back to the app and Supabase stores the authenticated session.

## Required External Setup

Google Login requires setup outside the codebase before implementation can be verified.

### Google Cloud OAuth Client

Required setup:

- Create or use a Google Cloud project.
- Configure an OAuth consent screen.
- Create a Web OAuth client.
- Add authorized JavaScript origins for the app environments that will be tested, such as:
  - `https://dog-care-ai.vercel.app`
  - the relevant Vercel Preview URL if preview testing is required
  - `http://localhost:5173` if local OAuth testing is required
- Add the Supabase Auth callback URL as an authorized redirect URI:
  - `https://<supabase-project-ref>.supabase.co/auth/v1/callback`

Do not commit the Google OAuth client secret. It belongs only in Google Cloud / Supabase provider configuration.

### Supabase Auth Provider

Required setup:

- Enable the Google provider in Supabase Auth.
- Add the Google OAuth client ID and client secret in Supabase dashboard settings.
- Confirm the Supabase Site URL points to the correct production app URL.
- Add allowed redirect URLs for production, preview, and local development as needed.
- Keep email/password auth enabled.

No OAuth secret should be placed in `.env`, `.env.example`, frontend code, browser-visible config, or Vite variables.

### Vercel URL Considerations

Production OAuth is simpler than preview OAuth because the production URL is stable.

Preview OAuth may require adding one or more Vercel preview URLs to Supabase allowed redirect URLs and Google authorized origins. If preview URL churn becomes slow or unreliable, implementation should be tested directly against production only after code review and merge, or deferred.

## Implementation Plan If Approved

If approved, the implementation should be small and isolated:

1. Keep the existing email/password sign in and sign up form.
2. Add a secondary "Continue with Google" action to `src/pages/AuthPage.tsx`.
3. Call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`.
4. Use the current app origin for `redirectTo`, with the exact target chosen to preserve the existing post-login flow.
5. Reuse the existing `useAuth` session listener and route protection.
6. Show friendly loading and error states if OAuth cannot start.
7. Do not add new database tables, migrations, RLS changes, service-role usage, or OAuth secrets.
8. Keep logout behavior unchanged.
9. Update README/demo documentation only after the provider setup and OAuth flow are verified.

The likely code change is limited to the auth page, with no changes expected in protected route logic.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Redirect URL mismatch | Google login may fail or return to the wrong place. | Configure production, preview, and local URLs deliberately before code implementation. |
| Provider setup friction | Setup may consume time close to the final deadline. | Timebox setup. If blocked, defer and move to Phase 8.4A. |
| Breaking email/password login | Existing stable auth could regress. | Keep email/password UI and code path unchanged; run focused regression. |
| Preview deployment mismatch | Vercel Preview URLs may not match configured OAuth redirects. | Prefer production URL verification after review, or explicitly configure the preview URL used for testing. |
| OAuth secrets exposure | Client secret could be accidentally added to code/env files. | Store OAuth secrets only in Supabase provider settings; never use `VITE_` OAuth secrets. |
| Demo reliability | OAuth popup/redirect can be less predictable than email/password during demos. | Keep email/password as the reliable fallback path. |

## QA Checklist

If Google Login is implemented, run these checks:

- Email/password sign in still works.
- Email/password sign up still works.
- Google login starts only after user click.
- Google login returns to DogCareAI and creates an authenticated Supabase session.
- Authenticated users can access `/`, `/dog-profile`, `/reminders`, `/assistant`, and `/nearby`.
- Authenticated users visiting `/auth` are redirected to `/`.
- Logout works after Google login.
- No Google OAuth client secret appears in repository files, browser source, network responses, or console output.
- No new `VITE_GOOGLE_*` secret variable is introduced.
- Supabase anon key remains the only frontend Supabase key.
- Phase 7/8 critical flows still work: DogPicker persistence, Reminders CRUD, Telegram reminder settings, Dashboard, Assistant mock/emergency, and Nearby Places.

## Go / No-Go Recommendation

Recommendation: proceed with a small Google Login implementation only after the external Google Cloud and Supabase provider setup is confirmed.

Google Login is technically practical because the current Supabase session handling and protected-route architecture should support OAuth with a small auth-page addition. The main risk is not code complexity; it is external redirect/provider configuration close to the June 2, 2026 deadline.

Decision rule:

- Go if Google Cloud OAuth and Supabase Google provider setup can be completed and verified quickly without touching secrets in the repo.
- Defer if redirect configuration, preview URL setup, or provider credentials become unreliable or time-consuming.

If deferred, continue directly to Phase 8.4A: Breed Recognition + Did You Know, because that path is lower risk and more controllable for the final demo.
