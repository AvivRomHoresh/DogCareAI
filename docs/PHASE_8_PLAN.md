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

- Nearby Dog Places API using a free/open data source such as OpenStreetMap/Overpass.
- Telegram Reminder Notifications MVP.
- Google Login through Supabase Auth, if setup is practical without paid services.
- Dog/Breed API enrichment, such as a public dog API or breed image enrichment.
- Dog facts / Did You Know / dog insights.
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
2. Phase 8.1: Nearby Dog Places API MVP.
3. Phase 8.2: Telegram Reminder Notifications MVP.
4. Phase 8.3: Google Login.
5. Phase 8.4: Dog/Breed API + Dog Insights.
6. Phase 8.5: UX/UI + Mobile polish + logo.
7. Phase 8.6: Optional product polish, such as archive restore, settings, or birth date.
8. Phase 8.7: Phase 8 QA + demo rehearsal.

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

Goal: make reminders more useful during the demo by sending reminder notifications through an external channel without adding paid notification infrastructure.

Implementation rules:

- Use Telegram Bot API through a secure server-side function only.
- Keep the Telegram bot token in a server-side environment variable such as `TELEGRAM_BOT_TOKEN`.
- Never expose the Telegram bot token in frontend code, logs, bundles, or browser network responses.
- Use Telegram `chat_id` for delivery; do not collect phone numbers.
- Keep email/password auth and existing reminder CRUD working.
- Add reminder notification settings only after the required schema/RLS plan is approved.
- Prevent duplicate reminder notifications with server-side state where practical.
- Start with an app-open MVP: check/send due notifications only while the authenticated user is using the app or explicitly triggers a check.
- Browser Notifications may be kept as an optional local fallback only; they are not the primary Phase 8.2 feature.
- Do not implement SMS, WhatsApp, or full email reminder systems in Phase 8 unless explicitly approved.
- Do not add paid notification services.

Why Telegram was chosen:

- It satisfies the instructor request for an external notification channel.
- It avoids SMS and WhatsApp per-message cost and provider-registration risk.
- It avoids collecting user phone numbers.
- It allows the bot token to remain server-side behind the existing Vercel Function pattern.

### Google Login

Goal: improve registration/login if Supabase provider setup is practical.

Implementation rules:

- Use Supabase Auth provider support.
- Keep email/password login working.
- Do not expose OAuth secrets in frontend code.
- Do not add Instagram login.
- Document setup steps and required external console configuration.
- If setup complexity or redirect configuration becomes risky, defer rather than breaking existing auth.

### Dog/Breed API

Goal: add dog-specific enrichment without medical claims.

Implementation rules:

- Use a free public dog/breed API if practical.
- Prefer no-key APIs where possible, such as dog image/breed data APIs.
- Show a breed image, breed-related image, or fallback random dog image.
- Do not use breed data for medical diagnosis.
- Provide graceful fallback when the external API is unavailable.

### Dog Insights

Goal: add lightweight dog-specific value to the Dashboard or profile experience.

Implementation rules:

- Show a random dog fact, breed-related insight, or Did You Know card.
- Prefer safe static/local facts if an external API is unreliable.
- Rotate the fact on Dashboard load or user action.
- Avoid medical certainty and keep guidance general.

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

### Dog API / Insights QA

- Breed image or dog image loads when the external API is available.
- Fallback state works when the API fails.
- Insights are dog-specific but do not imply medical diagnosis.
- No paid API key is required.

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

Phase 8 should continue from Nearby Dog Places into Telegram Reminder Notifications because those steps best match the instructor priorities: more real APIs, more dog-owner specificity, external reminder delivery, and stronger reminder usefulness while staying free, focused, and demo-friendly.
