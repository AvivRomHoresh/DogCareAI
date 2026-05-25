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
- Breed-Based Product Recommendations MVP, using curated/static demo-safe recommendation cards first.
- Profile Image / Breed-Inspired Avatar planning or small fallback improvements, without requiring paid image APIs.
- UX/UI visual upgrade with logo.
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
6. Phase 8.4B: Breed-Based Product Recommendations MVP.
7. Phase 8.4C: Profile Image / Breed-Inspired Avatar.
8. Phase 8.5: UX/UI + Mobile polish + logo.
9. Phase 8.6: Optional product polish, such as archive restore, settings, or birth date.
10. Phase 8.7: Final QA + demo rehearsal.

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

Goal: recommend useful dog-related product categories based on breed, size, and general needs without adding paid marketplace dependencies.

Implementation rules:

- Start with curated/static recommendation cards rather than live shopping APIs.
- Recommended categories may include food, treats, toys, and accessories.
- Cards may include category, product name, brand/company, image or placeholder, and a short reason why it fits.
- Keep copy demo-safe and avoid claims that a product is medically required.
- Avoid affiliate complexity, paid APIs, unreliable product APIs, scraping, or marketplace dependencies.
- Use a free reliable API only if explicitly approved later.

### Phase 8.4C: Profile Image / Breed-Inspired Avatar

Goal: improve the dog profile visual experience without making image upload or AI image generation a demo blocker.

Implementation rules:

- Add or plan support for a dog profile image.
- If no image exists, show a breed-inspired avatar or fallback.
- Treat real image upload as higher-risk/optional because it may involve Supabase Storage setup and upload policies.
- Treat AI-generated images as higher-risk/optional because they may involve cost, external AI image APIs, or unclear reliability.
- Do not claim actual AI image generation unless a real approved implementation exists.
- Do not block the final demo on profile image upload or AI image generation.

### UX/UI + Mobile Polish

Goal: improve visual quality and mobile usability without a major redesign.

Implementation rules:

- Add a simple logo.
- Make clicking the logo navigate to Dashboard.
- Improve header, cards, dashboard hero, empty states, spacing, icons, and shadows.
- Improve mobile layout and tap targets.
- Keep the app calm, readable, card-based, and mobile-first.
- Do not show inactive final-only features as implemented.

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

Phase 8.1 Nearby Places, Phase 8.2 Telegram Reminder Notifications, Phase 8.3 Google Login, and Phase 8.4A Breed Recognition + Did You Know are complete. The next recommended Phase 8 focus is Phase 8.4B curated product recommendations, then Phase 8.4C profile image/avatar polish, and UX/mobile polish.
