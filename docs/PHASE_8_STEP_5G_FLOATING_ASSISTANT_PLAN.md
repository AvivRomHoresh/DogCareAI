# Phase 8.5G Floating Assistant / Assistant Access Polish Plan

## Current Assistant Behavior Summary

- The Assistant currently lives at the protected `/assistant` route.
- Users must explicitly type a question and submit it before any assistant response is generated.
- The Assistant uses the active dog profile and reminder context from existing app state/data.
- Deterministic emergency detection runs before normal assistant generation.
- Emergency responses bypass Gemini and advise contacting a veterinarian immediately.
- Real Gemini calls, when enabled, go through the existing `/api/assistant` server-side boundary.
- Mock/fallback behavior remains available and demo-safe.
- The Assistant page already shows starter questions and local conversation state.
- Messages are not persisted to Supabase in the current beta.
- Phase 8.5F moved route navigation into the active dog avatar menu, so `/assistant` remains reachable there.

## Desired UX

- Improve assistant access from across the app without making the app feel busier.
- Add a friendly floating assistant entry point that feels like part of DogCareAI.
- The control should be clearly assistant-related, polished, and mobile-safe.
- The assistant must never auto-send questions or auto-call AI.
- The assistant should either:
  - link to the existing `/assistant` page, or
  - open a lightweight in-app panel that reuses existing safe Assistant behavior.
- Keep `/assistant` available as the stable fallback route.
- Preserve the active dog context so users understand the assistant answers are based on the selected dog.

## Safe Implementation Scope

Recommended Phase 8.5G MVP:

1. Add a floating assistant button visible on authenticated app pages.
2. Make the button navigate to `/assistant` rather than opening a full in-app chat panel in the first pass.
3. Use local SVG/CSS only for the assistant icon/mark.
4. Keep the current `/assistant` page and behavior unchanged.
5. Do not duplicate Assistant API logic in a new component.
6. Do not remove Assistant from the avatar menu yet.
7. Add optional small label text such as `Ask Doggy` or `Assistant` if it remains unobtrusive.
8. Ensure the floating button does not cover critical page actions on mobile.

This keeps Phase 8.5G as access polish rather than a risky assistant architecture change.

## Link vs In-App Panel Recommendation

Recommended now: floating button links to `/assistant`.

Reasons:

- Lowest risk.
- Reuses the already tested Assistant page.
- Avoids duplicating state, reminder loading, emergency detection, and `/api/assistant` request logic.
- Preserves explicit user action before any AI call.
- Keeps all existing safety/cost controls intact.
- Easier to QA across mobile and production.

Defer an in-app panel until a later sub-phase unless there is enough time to extract Assistant logic into shared components safely. A panel can be considered later if it opens without sending, shows existing starter prompts, and only calls `/api/assistant` after explicit submit.

## Desktop Behavior

- Floating assistant button appears in a consistent corner, preferably bottom-left to avoid common browser/password widgets and page primary actions.
- Button remains visible across authenticated app pages.
- Button navigates to `/assistant` on click.
- Button uses a polished local assistant/dog-care icon.
- Button can show a short label on wider screens and icon-only on compact layouts.
- Button should not appear on `/auth`.
- Optional: hide or de-emphasize the floating button while already on `/assistant` to avoid redundant navigation.

## Mobile Behavior

- Button stays within the safe viewport area and respects small screens.
- Touch target should be at least 44px.
- Avoid covering bottom form actions, reminder action buttons, or Nearby pagination.
- Use `bottom` spacing that works with mobile browser UI.
- Icon-only or compact label is preferred on narrow screens.
- No horizontal overflow.
- Ensure it does not obscure the active dog avatar menu in the header.

## Accessibility Requirements

- Floating button must be a real link or button.
- If it navigates, use a regular `Link` to `/assistant`.
- Provide an accessible label such as `Open DogCareAI assistant`.
- Do not rely only on icon imagery.
- Preserve visible focus state.
- Ensure keyboard users can tab to the control.
- If a future panel is built, it must support Escape close, focus management, and proper dialog labeling.

## Cost-Control Requirements

- No automatic AI calls.
- No automatic `/api/assistant` request on page load.
- No background LLM calls.
- No polling.
- No prefetching assistant responses.
- No real Gemini call unless the user explicitly submits a question on the Assistant experience.
- Preserve Mock Mode.
- Preserve the existing server-side Gemini boundary.
- Preserve deterministic emergency detection before normal assistant generation.

## Risks

- A floating button can cover important controls on mobile if placed poorly.
- A full in-app assistant panel could duplicate logic from `AssistantPage` and introduce inconsistent safety behavior.
- A panel that opens with automatic greetings must not be confused with an AI-generated response.
- Over-styling the assistant could make it feel like a separate product instead of part of DogCareAI.
- Removing `/assistant` too soon would reduce fallback/debug access.

## Out Of Scope

- No automatic AI calls.
- No new paid API usage.
- No Gemini/server-side boundary changes.
- No env files, API keys, schema, RLS, storage, backend/service-role, auth, Telegram, scheduler, Reminders, Nearby, Recommendations, Dog Profile, Dashboard, dog insights, or product logic changes.
- No new dependencies.
- No chat persistence.
- No proactive assistant messages.
- No notification system.
- No animated typing response unless it is purely local UI state after explicit user action.
- No external assistant avatar/image APIs.
- No AI-generated assistant image assets.

## QA Checklist

- Floating assistant button appears on authenticated app pages.
- Floating assistant button does not appear on `/auth`.
- Clicking the button opens `/assistant`.
- No network request to `/api/assistant` happens when the button renders.
- No network request to `/api/assistant` happens when clicking the button alone.
- `/api/assistant` is called only after explicit question submission on `/assistant`.
- Mock Mode still works.
- Emergency detection still works.
- Assistant starter questions still work.
- Active dog context still appears on Assistant page.
- Avatar menu navigation to Assistant still works.
- Floating button does not cover important controls on Dashboard, Dog Profile, Reminders, Nearby, Recommendations, or Assistant.
- Mobile/narrow viewport has no horizontal overflow.
- Keyboard focus state is visible.

## Risks / TODOs

- Decide exact corner placement during implementation; bottom-left is recommended.
- Decide whether the button should hide on `/assistant` or remain visible but inactive/de-emphasized.
- Consider a future panel only after the floating shortcut has shipped and Assistant logic can be shared safely.
- If a future panel is built, extract shared Assistant conversation components first to avoid divergent behavior.
- Keep monitoring mobile overlap with fixed-position controls or forms.

## Go / No-Go Recommendation

Go for a conservative Phase 8.5G MVP that adds a floating assistant shortcut linking to `/assistant`.

Do not implement a full in-app chat panel in the first pass. The shortcut improves access while preserving existing Assistant safety, Mock Mode, emergency logic, server-side Gemini boundary, and cost controls.
