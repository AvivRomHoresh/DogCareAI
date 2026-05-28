# Phase 8 Plan: API-Enriched Final Demo Upgrade

## Purpose

Phase 8 is the API-Enriched Final Demo Upgrade for DogCareAI. This phase responds to instructor feedback before final submission by making the app feel more useful, dog-owner specific, visually polished, and demo-ready without breaking the stable Phase 7 beta.

This document is the source of truth for Phase 8 scope, ordering, constraints, and QA expectations.

## Deadline

Submission deadline: Tuesday, June 2, 2026.

Because the deadline is close, Phase 8 must stay realistic. The project should prioritize small, isolated upgrades that improve the final demo clearly without expanding into paid services, broad refactors, or unfinished final-only features.

## Instructor Feedback Summary

The final-project feedback asks DogCareAI to improve in these areas:

- Improve UX/UI and logo so the site feels less like a simple school project.
- Improve registration/login.
- Add Google login if practical.
- Improve dog profile with photo and birth date/automatic age if practical.
- Allow viewing and restoring archived dogs.
- Add more real APIs.
- Add nearby dog services based on location.
- Add stronger reminder usefulness.
- Add mobile responsiveness.
- Add a settings page if practical.
- Consider a Doggi floating assistant if time allows.

## Phase 8 Guiding Principles

- API-first: add real external data where it makes the app more dog-owner specific.
- Reminder-first: improve the practical usefulness of dog-care reminders.
- Free-only: use free/open APIs and browser capabilities only.
- Do not break Phase 7 stable beta flows.
- Keep changes demo-focused and realistic for the deadline.
- Prefer small, isolated features over broad rewrites.
- Keep medical-safety disclaimers and avoid diagnosis claims.
- Keep Mock Mode available as the safe routine default.
- Do not expose secrets or move Gemini calls into frontend code.

## Must-Have Scope

Phase 8 should target these items first:

- Nearby Dog Places API using a free/open data source such as OpenStreetMap/Overpass. Completed in Phase 8.1.
- Telegram Reminder Notifications MVP. Completed in Phase 8.2, including test send, manual due-reminder check, scheduled cron-job.org delivery, and duplicate prevention.
- Google Login through Supabase Auth. Completed in Phase 8.3, with email/password auth retained as the fallback.
- Breed Recognition + Did You Know, using the existing dog profile breed value with dogapi.dog enrichment and safe local/general fallbacks. Completed in Phase 8.4A.
- Breed-Based Product Recommendations MVP. Completed in Phase 8.4B, using a curated/static catalog with optional Open Pet Food Facts enrichment for eligible Food/Treat cards.
- Breed-Inspired Dog Avatar. Completed in Phase 8.4C with local SVG/CSS only and no upload/storage/API dependency.
- UX/UI visual foundation with logo and header cleanup. Completed in Phase 8.5A.
- Dashboard redesign and compact Did You Know treatment. Completed in Phase 8.5B.
- Dog Profile page polish. Completed in Phase 8.5C.
- Reminders page polish and safe validation. Completed in Phase 8.5D.
- Nearby + Recommendations page polish and Nearby reliability fixes. Completed in Phase 8.5E.
- Mobile responsive polish.
- README and demo guide updates after implementation.

## Should-Have Scope, If Time Allows

These items are valuable but should not block the must-have demo upgrades:

- Archived dogs view + restore.
- Settings page.
- Dog birth date instead of manual age, with computed age.
- Dog photo upload only if Supabase Storage setup is practical and safe.
- Doggi floating assistant using the existing Assistant API only.

## Deferred / Out of Scope for Phase 8

These items are not approved for Phase 8 unless explicitly approved later:

- SMS reminders.
- Full email reminder system.
- WhatsApp reminders.
- Instagram login.
- Product marketplace APIs.
- Google Places API if billing is required.
- Real Gemini-heavy recommendation engine.
- Full end-to-end test setup.
- Any paid-service dependency.

## Proposed Implementation Order

1. Phase 8.0: Documentation alignment and scope approval.
2. Phase 8.1: Nearby Dog Places API MVP. Completed.
3. Phase 8.2: Telegram Reminder Notifications MVP. Completed.
4. Phase 8.3: Google Login feasibility and MVP. Completed.
5. Phase 8.4A: Breed Recognition + Did You Know. Completed.
6. Phase 8.4B: Breed-Based Product Recommendations MVP. Completed.
7. Phase 8.4C: Profile Image / Breed-Inspired Avatar. Completed.
8. Phase 8.5A: Visual Foundation + Logo + Header Cleanup. Completed.
9. Phase 8.5B: Dashboard Redesign + Compact Did You Know. Completed.
10. Phase 8.5C: Dog Profile Polish. Completed.
11. Phase 8.5D: Reminders Polish + Safe Validation. Completed.
12. Phase 8.5E: Nearby + Recommendations Polish. Completed.
13. Phase 8.6: Optional product polish, such as archive restore, settings, or birth date.
14. Phase 8.7: Final QA + demo rehearsal.

Each implementation step should be handled as a small focused change with its own documentation update and regression checks for the Phase 7 stable flows.

## Feature Details

### Nearby Dog Places

Goal: help dog owners find nearby dog-relevant services without requiring paid map APIs.

Implementation rules:

- Use browser geolocation only after explicit user action.
- Search for nearby vets, pet shops, dog parks, and possibly groomers.
- Prefer OpenStreetMap/Overpass or another free/open data source.
- Show category, name, approximate distance, and data source.
- Limit radius and number of results.
- Cache results briefly to avoid repeated API calls.
- Show OpenStreetMap attribution when OpenStreetMap data is used.
- Provide friendly fallback when location permission is denied.
- Do not make automatic repeated API calls in the background.
- Do not use Google Places if billing is required.

### Telegram Reminder Notifications

Status: completed in Phase 8.2.

Goal: make reminders more useful during the demo by sending reminder notifications through an external channel without adding paid notification infrastructure.

Implementation rules:

- Use Telegram Bot API through a secure server-side function only.
- Keep the Telegram bot token in a server-side environment variable such as `TELEGRAM_BOT_TOKEN`.
- Never expose the Telegram bot token in frontend code, logs, bundles, or browser network responses.
- Use Telegram `chat_id` for delivery; do not collect phone numbers.
- Keep email/password auth and existing reminder CRUD working.
- Add reminder notification settings only after the required schema/RLS plan is approved.
- Prevent duplicate reminder notifications with server-side state where practical.
- Support test messages, manual due-reminder checks, and scheduled delivery through cron-job.org.
- Browser Notifications may be kept as an optional local fallback only; they are not the primary Phase 8.2 feature.
- Do not implement SMS, WhatsApp, or full email reminder systems in Phase 8 unless explicitly approved.
- Do not add paid notification services.

Why Telegram was chosen:

- It satisfies the instructor request for an external notification channel.
- It avoids SMS and WhatsApp per-message cost and provider-registration risk.
- It avoids collecting user phone numbers.
- It allows the bot token to remain server-side behind the existing Vercel Function pattern.

Implemented Phase 8.2 result:

- Telegram settings UI on `/reminders`.
- Server-side Telegram test message endpoint.
- Manual "Check due reminders now" endpoint and UI.
- Scheduled Telegram reminder endpoint for cron-job.org.
- Service-role grants for the scheduled endpoint, applied manually in Supabase.
- Duplicate notification prevention through `telegram_notification_deliveries`.
- Production scheduler verification passed after updating cron-job.org to the current deployment/production URL.

### Google Login

Status: completed in Phase 8.3.

Goal: improve registration/login with Supabase Google OAuth while keeping email/password auth as a fallback.

Implementation rules:

- Use Supabase Auth provider support.
- Keep email/password login working.
- Do not expose OAuth secrets in frontend code.
- Do not add Instagram login.
- Document setup steps and required external console configuration.
- If setup complexity or redirect configuration becomes risky, defer rather than breaking existing auth.

Implemented Phase 8.3 result:

- Google Login feasibility was documented.
- Google Cloud OAuth and Supabase Google provider setup were completed manually outside the repo.
- A secondary "Continue with Google" action was added to `/auth`.
- Existing email/password sign in and sign up remain available.
- Manual QA passed for existing-account Google login, new Google-only account login, logout, re-login, protected routes, data isolation, and email/password fallback.
- No Google Client ID, Google Client Secret, `VITE_GOOGLE_*` variable, or OAuth secret was committed.

### Phase 8.4A: Breed Recognition + Did You Know

Status: completed in Phase 8.4A.

Goal: add lightweight dog-specific enrichment from the breed value already entered in the dog profile.

Implementation rules:

- Use the dog breed value entered in the dog profile.
- Normalize and match the breed as best as practical.
- Show a breed-specific "Did You Know" insight when the breed is recognized.
- If breed is not recognized, show a general dog fact.
- Use dogapi.dog as the preferred no-key external API source where practical.
- Keep safe static/local fallback insight content mandatory.
- Use conservative fuzzy matching for common typos and aliases.
- Rotate already-loaded safe insight candidates without refetching on every click.
- Avoid medical diagnosis, breed-health certainty, or deterministic health claims.
- Do not require an API key, paid API, env variable, schema change, or paid-service dependency.

Implemented Phase 8.4A result:

- Dashboard top Did You Know card below the page title/header and above the main dashboard content.
- dogapi.dog is the preferred breed enrichment source.
- Local fallback facts remain mandatory for empty, unknown, low-confidence, or failed API cases.
- Fuse.js fuzzy matching supports common breed typos and aliases while preserving fallback for low-confidence input.
- "Show another fact" rotates among existing safe candidates without refetching.
- Manual QA passed for recognized breeds, typo matching, aliases, unknown breed fallback, empty breed fallback, refresh stability, and dashboard placement.

### Phase 8.4B: Breed-Based Product Recommendations MVP

Status: completed in Phase 8.4B.

Goal: recommend useful dog-related product categories based on breed, size, and general needs without adding paid marketplace dependencies.

Implementation rules:

- Use curated/static recommendation cards as the reliable base rather than live shopping APIs.
- Recommended categories include food, treats, toys, and accessories.
- Cards include category, product name, brand/company, image/logo/fallback, official information link, and a short reason why the card may fit.
- Use optional Open Pet Food Facts enrichment only for already eligible Food/Treat cards.
- Keep Toys/Accessories curated/static.
- Keep favorites/watch-later localStorage-only and scoped by authenticated user where practical.
- Keep copy demo-safe and avoid claims that a product is medically required.
- Avoid affiliate complexity, paid APIs, unreliable product APIs, scraping, or marketplace dependencies.
- Do not add checkout, prices, affiliate links, runtime scraping, API keys, env variables, schema changes, RLS changes, or paid services.

Implemented Phase 8.4B result:

- Protected `/recommendations` route.
- AppShell Recommendations navigation and Dashboard quick action.
- Shared breed matching with Did You Know through `dogBreedMatching`.
- Profile-aware recommendations using breed, inferred size, age group, and activity tags where available.
- Strict eligibility gates so small-dog-only cards are not shown to clearly large dogs and large-dog-only cards are not shown to clearly small dogs.
- Explicit general fallback recommendations for missing or unrecognized dog data.
- Optional Open Pet Food Facts enrichment for eligible Food/Treat cards only, with curated fallback and hidden raw API errors.
- Curated/static Toys and Accessories cards.
- localStorage favorites/watch-later with stale saved ID cleanup.
- Manual QA passed for Maltese, Rottweiler, unknown breed fallback, filters, favorites, mobile layout, and safety copy.

### Phase 8.4C: Profile Image / Breed-Inspired Avatar

Status: completed in Phase 8.4C.

Goal: improve the dog profile visual experience without making image upload or AI image generation a demo blocker.

Implementation rules:

- Show a breed-inspired local avatar or generic fallback in Dog Profile.
- Reuse shared breed matching where practical.
- Treat real image upload as higher-risk/optional because it may involve Supabase Storage setup and upload policies.
- Treat AI-generated images as higher-risk/optional because they may involve cost, external AI image APIs, or unclear reliability.
- Do not claim actual AI image generation unless a real approved implementation exists.
- Do not block the final demo on profile image upload or AI image generation.

Implemented Phase 8.4C result:

- Dog Profile now uses a reusable `DogAvatar` component instead of the old initial-only avatar preview.
- `DogAvatar` is local inline SVG/CSS only.
- Existing static avatar values remain compatible as color accents.
- Shared breed matching is reused, including Dachshund support and aliases.
- Unknown or empty breed values use a generic avatar or weight-based fallback where available.
- No real image upload, Supabase Storage, schema change, env variable, external image API, or AI-generated image workflow was added.
- AppShell/top-right active dog avatar menu was not implemented and remains deferred to Phase 8.5 UX/UI polish.
- Avatar visuals are breed-inspired, not breed-accurate.

### Phase 8.5A: Visual Foundation + Logo + Header Cleanup

Status: completed in Phase 8.5A.

Goal: improve the global visual foundation, branding, and header polish without changing feature behavior.

Implemented Phase 8.5A result:

- Added a local DogCareAI logo/brand asset at `public/brand/dogcareai-logo.jpg`.
- Added a clickable DogCareAI logo/brand that navigates to Dashboard `/`.
- Made the AppShell header transparent so it blends with the global page background.
- Removed the stale `Phase 6 beta` badge from the primary header.
- Polished the global background with subtle CSS-only nature-inspired gradients.
- Visually improved shared `PageCard`, `StatusBadge`, and header/navigation styling.
- Kept DogPicker, logout, auth, routes, navigation, Dashboard logic, Reminders logic, Nearby logic, Recommendations logic, Assistant behavior, Telegram/scheduler behavior, dog insights, product recommendations, and dog avatar logic unchanged.
- No env files, schema, migrations, RLS, storage, API keys, paid services, dependencies, or backend services were added.

### UX/UI + Mobile Polish

Status: Phase 8.5A, Phase 8.5B, Phase 8.5C, Phase 8.5D, and Phase 8.5E completed; remaining work should focus on final mobile/demo QA and any explicitly approved follow-up polish.

Goal: improve visual quality and mobile usability without a major redesign.

Implementation rules:

- Keep the completed Phase 8.5A logo/header foundation.
- Keep the completed Phase 8.5B Dashboard overview and compact Did You Know treatment.
- Keep the completed Phase 8.5C Dog Profile polish.
- Keep the completed Phase 8.5D Reminders polish and safe validation behavior.
- Keep the completed Phase 8.5E Nearby + Recommendations polish and Nearby reliability behavior.
- Improve header, cards, dashboard hero, empty states, spacing, icons, and shadows.
- Improve mobile layout and tap targets.
- Keep the app calm, readable, card-based, and mobile-first.
- Do not show inactive final-only features as implemented.
- Keep active dog avatar menu, floating assistant, and Telegram/settings move in later focused sub-steps.

Implemented Phase 8.5B result:

- Dashboard title is larger, centered, transparent, and includes a local reusable Dashboard icon.
- Dashboard Quick Actions were removed because AppShell navigation remains available.
- The active dog Dashboard/profile card is expanded and visually central.
- Did You Know is compact and title-area-like, showing only the label, lightbulb action, and fact text.
- Did You Know click rotation and eight-second auto-rotation remain backed by existing safe dog insight fallback behavior.
- Reminder stat cards link to `/reminders?filter=open`, `/reminders?filter=missed`, and `/reminders?filter=completed`.
- `RemindersPage` reads the safe filter query param and falls back to Open for invalid or missing values.
- Reminder CRUD, Telegram manual/test/scheduled behavior, scheduler behavior, duplicate prevention, schema, env files, API keys, storage, RLS, backend behavior, paid services, and service-role behavior were not changed.

Implemented Phase 8.5C result:

- Dog Profile title is centered, transparent, and paired with a local standalone paw icon.
- Dog Profile subtitle now adapts between new-profile and existing-profile states.
- Profile selection moved into a cleaner centered row.
- DogAvatar preview remains in use with compact static accent swatches for existing `profile_image_url` compatibility.
- Save/update and archive actions are centered and visually polished.
- Dog Profile create/edit/save/archive behavior, active dog switching, schema, storage, env files, backend behavior, and unrelated features were not changed.

Implemented Phase 8.5D result:

- Reminders title is centered, transparent, and paired with a local reminder/calendar icon.
- Add/Edit Reminder form is visually polished and shows `Active Profile: [dog name]`.
- State is no longer shown in the reminder form; new reminders default to Open/Upcoming internally.
- New reminder date/time validation requires at least one minute in the future when date/time is used.
- Notes textarea contrast, placeholder, and Repeats alignment were improved.
- Existing missed/completed reminders, filters, Dashboard query-param filters, reminder CRUD, and Telegram test/manual/scheduled behavior remain supported.
- Telegram settings remain on Reminders for now and are deferred to a future Settings or dedicated settings section.

Implemented Phase 8.5E result:

- Nearby title, icon, search card, address/radius alignment, result cards, and pagination were polished.
- Searching-near/radius context now appears inside the search component area.
- Nearby result titles are centered, per-card Source text was removed from the primary UI, and the Google Maps fallback/search action was removed.
- Website handling is best-effort URL sanitation only; missing or invalid website values show `No website available`.
- Nearby pagination is client-side over loaded results when more than 30 results are available.
- Recommendations title, icon, and subtitle were polished, and internal/demo badges were removed.
- Recommendation logic, filters, favorites/localStorage, product cards, matching, and Open Pet Food Facts enrichment were not changed.
- Nearby reliability was improved by using POST Overpass requests instead of long GET `?data=...` URLs.
- `overpass-api.de` remains the primary endpoint for fast local/dev behavior, Private.coffee is the fallback, and a primary `406` is remembered in sessionStorage for the current browser session.
- Relation clauses were removed from the Overpass query to reduce query cost, while node/way searches remain for vets, pet shops, dog parks, and groomers.
- Loading messages are clearer for slow searches.
- No env files, schema, storage, backend, RLS, dependencies, API keys, paid services, or unrelated feature behavior were changed.

## Risks and Mitigation

| Risk | Mitigation |
|---|---|
| External API rate limits | Limit radius/results, cache briefly, avoid background polling, and show graceful fallbacks. |
| Browser geolocation denied | Provide a friendly denied-permission state and optional manual retry. |
| Telegram setup friction | Provide clear connect/test instructions and do not collect phone numbers. |
| Duplicate external notifications | Use server-side delivery tracking where practical, plus frontend in-flight guards. |
| Mobile browser notification limitations | Treat browser notifications as optional fallback only, not the primary external reminder channel. |
| Supabase Google Auth setup complexity | Keep email/password working and defer Google login if provider setup becomes risky. |
| Product recommendation scope creep | Start with curated/static demo-safe cards and avoid marketplace, affiliate, scraping, or paid API dependencies. |
| Image upload or AI avatar complexity | Keep profile image/avatar work optional and do not block the demo on Storage, policies, cost, or external image APIs. |
| Time constraints before June 2 | Prioritize Nearby Places, Reminder Notifications, and visible UX/mobile polish first. |
| Breaking Phase 7 flows | Use small branches, focused regression, and manual checks after each feature. |
| Accidentally adding paid services | Avoid Google Places billing, SMS, paid APIs, and paid notification infrastructure. |

## QA Strategy for Phase 8

Phase 8 QA should include focused feature checks plus regression for stable Phase 7 flows.

### Nearby Places QA

- User must explicitly request location-based search.
- Permission denied state is clear.
- Results show category, approximate distance, and source.
- Radius and result limits are respected.
- OpenStreetMap attribution appears when relevant.
- Repeated page loads do not spam the API.

### Telegram Reminder Notifications QA

- Telegram bot token does not appear in frontend code, browser source, console, or network responses.
- Telegram settings use `chat_id`, not phone number.
- Email/password auth still works.
- Reminder CRUD still works.
- Test notification sends only after user action.
- Upcoming/missed reminder notifications are sent only for the authenticated user's reminders.
- Duplicate notifications are not sent for the same reminder occurrence.
- Missing/invalid Telegram configuration shows a friendly fallback.
- No SMS, WhatsApp, paid email provider, paid notification dependency, API key exposure, or phone-number collection is introduced.

### Google Login QA

- Email/password auth still works.
- Google login works only through Supabase Auth if configured.
- Redirects return to the app correctly.
- No OAuth secrets appear in frontend-visible code or network responses.
- Logout still works.

### Breed Recognition + Did You Know QA

- Recognized breed shows a breed-specific Did You Know insight.
- Unrecognized or low-confidence breed shows a general dog fact fallback.
- Empty breed shows a general dog fact fallback.
- Breed matching handles common casing, spacing, typo, and alias differences where practical.
- The Show another fact action rotates existing safe candidates without extra API refetching.
- Insights are dog-specific but do not imply medical diagnosis or breed-health certainty.
- No paid API key is required.

### Product Recommendations QA

- Recommendations are curated/static or use only approved free sources.
- Cards show category, product/brand/company when available, and a short reason.
- Copy does not claim that a product is medically required.
- No paid API, affiliate requirement, scraping, or marketplace dependency is introduced.

### Profile Image / Breed-Inspired Avatar QA

- Existing static avatar behavior remains stable unless explicitly changed.
- Breed-inspired fallback appears only when implemented and has a safe fallback.
- No real upload or AI image generation is claimed unless actually implemented.
- No paid image API or secret is introduced.

### UX / Mobile QA

- Header, navigation, cards, and forms are usable on mobile.
- Primary actions are reachable with comfortable tap targets.
- Text does not overlap on common mobile widths.
- Logo click navigates to Dashboard.
- Visual polish improves without hiding existing functionality.
- Transparent header remains readable over the global background.

### Phase 7 Regression QA

- Auth.
- Dog Profile.
- DogPicker active dog persistence.
- Reminders CRUD.
- Dashboard summaries.
- Assistant Mock Mode.
- Assistant emergency flow.
- No direct browser Gemini provider call.

## Deliverables

- `docs/PHASE_8_PLAN.md`.
- Feature implementation reports as needed.
- Updated `README.md` after implementation.
- Updated `docs/DEMO_GUIDE.md` after implementation.
- Phase 8 QA results.
- Final demo checklist.

## Final Recommendation

Phase 8.1 Nearby Places, Phase 8.2 Telegram Reminder Notifications, Phase 8.3 Google Login, Phase 8.4A Breed Recognition + Did You Know, Phase 8.4B Product Recommendations Catalog, Phase 8.4C Breed-Inspired Dog Avatar, Phase 8.5A Visual Foundation + Logo + Header Cleanup, Phase 8.5B Dashboard Redesign + Compact Did You Know, Phase 8.5C Dog Profile Polish, Phase 8.5D Reminders Polish, and Phase 8.5E Nearby + Recommendations Polish are complete. The next recommended Phase 8 focus is final mobile/demo QA and any explicitly approved follow-up polish.
