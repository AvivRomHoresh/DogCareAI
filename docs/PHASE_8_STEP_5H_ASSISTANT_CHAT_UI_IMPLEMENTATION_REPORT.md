# Phase 8.5H Interactive Floating Assistant Chat Widget Implementation Report

## Status

Implemented after roadmap pivot. Manual QA and controlled Gemini Preview smoke test passed.

## Files Changed

- `src/components/AssistantChatExperience.tsx`
- `src/components/FloatingAssistantShortcut.tsx`
- `src/pages/AssistantPage.tsx`
- `docs/PHASE_8_STEP_5H_ASSISTANT_CHAT_UI_IMPLEMENTATION_REPORT.md`

## Pivot Summary

- Phase 8.5H was pivoted from a full-page-only Assistant redesign to an interactive floating Doggy chat widget.
- The floating Doggy shortcut is now the primary Assistant entry point.
- The shortcut no longer navigates directly to `/assistant`.
- Clicking the shortcut opens a compact Messenger-style chat window near the bottom-left of the app.
- The widget can be minimized back to the floating Doggy shortcut.
- The existing `/assistant` route remains available for compatibility and renders the same shared chat experience in focused page mode.
- TODO: after Gemini-connected QA passes, the standalone `/assistant` page can be revisited and may be removed, redirected, or fully replaced by the floating chat widget as the primary Assistant experience.

## Floating Widget Behavior

- The floating shortcut still uses the local Doggy logo asset.
- The shortcut remains delayed by about 5 seconds.
- The widget is hidden on `/auth`.
- The widget is hidden on `/assistant` to avoid duplicating the focused route experience.
- Opening, minimizing, or expanding the widget does not call `/api/assistant`.
- The widget includes:
  - Doggy branded chat header,
  - minimize control,
  - assistant/user message bubbles,
  - assistant-style quick prompt chips inside the conversation,
  - compact bottom composer,
  - loading/preparing state after explicit submit,
  - empty-state welcome copy.
- Quick prompts now appear as part of the initial conversation instead of a separate composer section.
- Quick prompts disappear after the first user message is sent in the current local chat session.
- The chat header shows compact active dog details: active dog name, breed, and age with calm fallback text when values are missing.

## Shared Assistant Experience

- Added `AssistantChatExperience` as a reusable UI component.
- `AssistantChatExperience` supports:
  - `mode="widget"` for the floating chat window,
  - `mode="page"` for the `/assistant` compatibility route.
- The same assistant request/safety logic is shared between both modes.
- The previous full-page `AssistantPage` now wraps the shared chat experience instead of owning duplicate assistant UI/logic.

## Preserved Assistant Behavior

- The `/assistant` route remains unchanged and available.
- The existing `/api/assistant` request path remains unchanged.
- The same explicit-submit flow is preserved.
- `sendQuestion()` still handles validation, duplicate-send protection, emergency detection, server request, and fallback behavior.
- Starter prompts only fill the composer and do not auto-send.
- Starter prompts are shown only before the first user message in the current local chat session.
- Messages remain local component state and are not persisted.
- Active dog switching still clears local conversation state.
- Existing reminder-context loading behavior remains unchanged.
- Existing Mock Mode/fallback behavior remains unchanged.
- Existing emergency/safety behavior remains unchanged.

## Cost / API-Call Safety

- No automatic Assistant/API calls were added.
- No `/api/assistant` request happens on app render.
- No `/api/assistant` request happens when the shortcut appears.
- No `/api/assistant` request happens when opening, minimizing, or expanding the widget.
- No `/api/assistant` request happens when starter prompt chips are clicked.
- No polling, prefetching, background requests, or paid API usage were added.
- The user must explicitly press Send before any normal Assistant request can happen.

## Emergency / Safety Notes

- Deterministic emergency detection still runs before normal assistant response handling.
- Emergency responses still use the local emergency-rule response.
- The safety disclaimer remains visible in page mode.
- The UI does not present Doggy as a replacement for veterinary care.

## Mobile / Accessibility Notes

- The widget uses a compact max width and viewport-relative width to avoid horizontal overflow.
- The widget uses a finite viewport-relative height with an internal scrollable conversation area.
- The minimize control is a real button with an accessible label.
- The shortcut trigger is a real button with an accessible label.
- Prompt chips are real buttons and remain keyboard reachable.
- The composer textarea has a visible label and the submit button remains keyboard reachable.
- The widget composer is compact so the conversation area keeps visual priority while preserving usable typing and send controls.
- The conversation area uses `role="log"` with an accessible label.
- The preparing state includes visible text, not only animation.
- Speaker labels are shown as text in message bubbles.

## What Was Intentionally Not Changed

- No `/api/assistant` changes.
- No Gemini/server-side boundary changes.
- No new Assistant capability.
- No chat persistence, schema, RLS, storage, backend, service-role, env, API key, or dependency changes.
- No changes to auth, Telegram, scheduler, Reminders, Nearby, Recommendations, Dog Profile, Dashboard, dog insights, or product recommendation logic.
- No paid API usage.

## QA Checklist

- Open an authenticated app page other than `/assistant`: passed.
- Confirm the Doggy shortcut appears after about 5 seconds: passed.
- Confirm clicking the shortcut opens the floating chat widget instead of navigating away: passed.
- Confirm the widget appears near the bottom-left of the app: passed.
- Confirm minimize returns to the floating shortcut: passed.
- Confirm the chat header shows active dog name, breed, and age or calm fallback text: passed.
- Confirm starter prompts appear inside the initial chat conversation: passed.
- Confirm starter prompts disappear after the first user message is sent: passed.
- Confirm no `/api/assistant` request happens on page load: passed.
- Confirm no `/api/assistant` request happens when opening or minimizing the widget: passed.
- Confirm starter prompt chips only fill the composer: passed.
- Confirm a normal question sends only after pressing Send: passed.
- Confirm Mock Mode/fallback behavior still works if the server response fails: passed.
- Confirm emergency wording still triggers the emergency-rule response before normal generation: passed.
- Confirm empty-question validation still works: passed.
- Confirm duplicate sends are still blocked while sending: passed.
- Confirm `/assistant` still opens and shows a focused chat experience: passed.
- Confirm mobile/narrow layout has no obvious horizontal overflow or important control overlap: passed.

## Gemini Preview Smoke Test

- Gemini was tested through a Vercel Preview deployment instead of local `vercel dev`.
- The test used a controlled short prompt to limit usage.
- Opening the app, opening/minimizing the widget, and clicking Quick Prompts did not call `/api/assistant`.
- Explicit Send produced the expected `/api/assistant` request.
- The Assistant API/server boundary was not changed.
- Preview `MOCK_AI_MODE` was restored to `true` after testing.

## Risks / TODOs

- Manual browser QA should confirm widget placement does not cover important controls on each primary page.
- Widget chat state is local to the widget and is not persisted across app reloads.
- The focused `/assistant` route remains for compatibility; future UX can decide whether to simplify or redirect it.
- Full long-term Assistant product behavior should still preserve explicit-submit-only cost control.

## Validation Results

- `npm.cmd run lint`: passed
- `npm.cmd run build`: passed with the existing Vite chunk-size warning
- `git diff --check`: passed with Windows LF/CRLF normalization warnings only
