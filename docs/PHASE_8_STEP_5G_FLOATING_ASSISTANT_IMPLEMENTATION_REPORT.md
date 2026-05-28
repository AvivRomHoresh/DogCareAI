# Phase 8.5G Floating Assistant Shortcut Implementation Report

## Summary

Phase 8.5G adds a floating Assistant shortcut that links to the existing `/assistant` route. This is an access polish change only. It does not open a new chat panel, does not call `/api/assistant`, and does not change Assistant behavior, Gemini behavior, Mock Mode, emergency detection, auth, routes, schema, backend behavior, or app feature logic.

## Files Changed

- `src/components/AppShell.tsx`
- `src/components/FloatingAssistantShortcut.tsx`
- `src/components/icons/AssistantShortcutIcon.tsx`
- `docs/PHASE_8_STEP_5G_FLOATING_ASSISTANT_IMPLEMENTATION_REPORT.md`

## Shortcut Behavior

- Adds a floating `Ask Doggy` shortcut for authenticated app pages.
- The shortcut is a normal React Router `Link` to `/assistant`.
- It is hidden on `/assistant` to avoid redundant navigation.
- It is also hidden on `/auth`.
- The visual treatment uses DogCareAI styling, a rounded floating button, and the local Doggy assistant logo asset at `/brand/doggy-assistant-logo.jpg`.
- The local inline SVG assistant/dog-care icon remains only as an image-load fallback.
- After manual QA feedback, the shortcut was moved to the left side of the viewport.
- The shortcut appears after about 5 seconds on each eligible page.
- When it appears, it slides down smoothly from above into its final fixed position.
- No dependencies were added.

## Cost-Control / API-Call Safety

- The shortcut does not import Assistant page logic.
- The shortcut does not fetch `/api/assistant`.
- The shortcut does not call Gemini.
- The shortcut does not send, prefill, or submit a question.
- Clicking the shortcut only navigates to the existing `/assistant` route.
- Existing Assistant safety remains unchanged:
  - user must explicitly submit a question,
  - emergency detection runs before normal assistant generation,
  - Mock Mode remains available,
  - real Gemini calls remain server-side only through `/api/assistant`.

## Mobile / Accessibility Notes

- The shortcut is a real link with `aria-label="Open DogCareAI assistant"`.
- It has a visible focus state.
- It uses an icon-only compact treatment on narrow screens and shows branded Doggy assistant text on wider screens.
- It is fixed near the bottom-left with spacing intended to avoid common page controls.
- It does not alter the active dog avatar menu or header layout.

## What Was Intentionally Not Changed

- No in-app assistant panel was added.
- The existing `/assistant` page and route remain unchanged.
- No automatic assistant calls were added.
- No Gemini/server-side boundary changes were made.
- No env files, API keys, schema, RLS, storage, backend/service-role behavior, auth, Telegram, scheduler, Reminders, Nearby, Recommendations, Dog Profile, Dashboard, dog insights, product recommendations, or product logic were changed.

## QA Checklist

- Floating Assistant shortcut appears on authenticated app pages.
- Floating Assistant shortcut does not appear on `/auth`.
- Floating Assistant shortcut does not appear on `/assistant`.
- Floating Assistant shortcut appears after about 5 seconds on eligible pages.
- Floating Assistant shortcut slides down smoothly into place.
- Clicking the shortcut navigates to `/assistant`.
- Rendering the shortcut does not call `/api/assistant`.
- Clicking the shortcut does not call `/api/assistant`.
- `/api/assistant` is called only after explicit question submission on `/assistant`.
- Mock Mode still works.
- Emergency detection still works.
- Active dog context still appears on Assistant page.
- Avatar menu navigation to Assistant still works.
- Shortcut does not cover critical controls on Dashboard, Dog Profile, Reminders, Nearby, or Recommendations.
- Mobile/narrow viewport has no horizontal overflow.

## Manual QA Results

- Floating Doggy assistant shortcut appears after about 5 seconds.
- Entrance animation feels smooth and polished.
- Shortcut is placed on the left side.
- Local Doggy logo asset displays correctly.
- Shortcut is hidden on `/assistant`.
- Shortcut is hidden on `/auth`.
- Clicking the shortcut only navigates to `/assistant`.
- No `/api/assistant` request happens when the shortcut renders.
- No `/api/assistant` request happens when the shortcut is clicked.
- Assistant page behavior remains unchanged.
- Mobile/narrow viewport does not show obvious overlap with important controls.
- No Assistant logic, Gemini boundary, Mock Mode, emergency behavior, env, schema, backend, RLS, API keys, dependencies, or unrelated feature behavior changed.

## Risks / TODOs

- Manual QA should confirm left-side placement does not cover important page actions on common mobile sizes.
- A future in-app assistant panel should only be considered after extracting shared Assistant behavior safely.
- If future pages add fixed bottom actions, the shortcut may need page-aware spacing.

## Validation Results

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed, with the existing Vite chunk-size warning.
- `git diff --check`: passed, with expected LF/CRLF working-copy warnings on Windows.
