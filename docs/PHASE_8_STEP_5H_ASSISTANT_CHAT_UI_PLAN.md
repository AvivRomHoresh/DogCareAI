# Phase 8.5H Interactive Floating Assistant Chat Widget Plan

## Roadmap Pivot Note

Phase 8.5H was clarified during implementation. The target experience is now an interactive floating Doggy chat widget, not only a redesigned full `/assistant` page. The floating widget should become the primary Assistant access pattern, while the existing `/assistant` route remains available for compatibility and can render the same shared chat experience in focused page mode.

## Current Assistant Page Behavior Summary

- The Assistant lives at the protected `/assistant` route.
- The page loads the active dog through `useDogs()`.
- The page loads reminder context for the active dog from the existing `reminders` table.
- Users type a question or choose a starter question.
- No Assistant/API call happens until the user explicitly submits a question.
- `sendQuestion()` guards against duplicate sends with `isSendingRef`.
- Deterministic emergency detection runs before normal assistant response generation.
- Emergency responses are handled locally and do not call Gemini.
- Normal non-emergency questions call `/api/assistant` only after explicit submit.
- If `/api/assistant` fails, the page falls back to the existing safe local mock/fallback response.
- Messages are local page state and are not persisted to Supabase.
- The page currently uses a card-based layout with a conversation card, textarea form, starter questions, disclaimer, and `ContextSummaryCard`.

## Desired Chat-Style UX

- Make the Assistant feel like a real, polished chat with Doggy.
- Open the primary chat experience from the floating Doggy shortcut as a compact bottom-area widget.
- Support minimize and expand/open behavior similar to a small Messenger-style chat.
- Keep `/assistant` available for compatibility, preferably using the same shared chat UI in page/focused mode.
- Keep the existing Assistant functionality and safety behavior.
- Replace the plain card-heavy layout with a reusable chat-style composition:
  - clear chat header with Doggy identity,
  - active dog context shown compactly,
  - scrollable message area,
  - assistant/user bubbles with stronger visual distinction,
  - fixed or sticky composer within the page card,
  - starter prompts styled as chat-native quick-reply chips shown only before the first user message,
  - subtle typing/preparing state after explicit submit.
- Keep the page calm, friendly, and product-quality rather than childish.
- Keep the Phase 8.5G floating shortcut, but have it open the chat widget instead of directly navigating to `/assistant`.

## Safe Implementation Scope

Recommended Phase 8.5H implementation:

1. Extract the existing Assistant page behavior into a reusable chat experience component.
2. Wire the floating Doggy shortcut to open that chat experience in widget mode.
3. Keep `/assistant` rendering the same chat experience in page/focused mode.
4. Preserve existing `sendQuestion`, `requestServerAssistantResponse`, emergency handling, fallback response, and reminder loading behavior.
5. Reuse existing `ContextSummaryCard`, `EmergencyAlert`, and `StatusBadge` if they still fit, or reposition/de-emphasize them visually.
6. Convert the conversation section into a compact chat panel with a widget-safe layout.
7. Style starter questions as chat-native quick prompts that populate the composer, not automatic sends.
8. Show starter prompts only at the beginning of the local chat session before the first user message.
9. Keep the existing textarea and submit flow, but make it look like a chat composer.
10. Keep the existing `/assistant` route and `AppShell` integration.

If small helper components are useful, keep them local to `AssistantPage.tsx` or create narrowly scoped UI components that do not own Assistant API logic.

## Existing Logic That Must Be Preserved

- `getDetectedIntent()` emergency pre-check.
- `buildEmergencyResponse()` behavior.
- `requestServerAssistantResponse()` server-boundary call to `/api/assistant`.
- Local fallback/mock response when `/api/assistant` fails.
- `isSendingRef` duplicate-send guard.
- `messages` as local page state.
- `question` validation and max length.
- Active dog requirement before asking.
- Reminder context loading behavior.
- `ContextSummaryCard` dog/reminder context visibility, unless only visually repositioned.
- `DOGCARE_DISCLAIMER` safety copy.

## Cost-Control / API-Call Safety Requirements

- No automatic AI calls.
- No automatic `/api/assistant` calls on page load.
- No assistant requests when the page renders.
- No polling.
- No prefetching.
- No background requests.
- No real Gemini call unless the user explicitly submits a question.
- Starter prompts must not auto-send unless explicitly approved; safest behavior is to fill the composer only.
- Starter prompts should disappear after the first user message in the local chat session.
- Keep Mock Mode available.
- Keep Gemini server-side only through `/api/assistant`.
- Do not add new AI providers or paid APIs.

## Emergency / Safety Behavior Requirements

- Emergency detection must still run before any normal assistant generation.
- Emergency messages must still bypass Gemini.
- Emergency UI should remain prominent and clear.
- Do not soften the veterinary disclaimer.
- Do not introduce diagnosis language.
- Do not imply the assistant replaces professional veterinary advice.
- Assistant copy should stay general informational and dog-care focused.

## Desktop Behavior

- Center the Assistant page within the existing content width.
- Use a polished chat shell with:
  - header area,
  - message history,
  - prompt chips,
  - composer.
- Put dog/reminder context in a side rail or collapsible/supporting panel if it remains readable.
- Keep the composer easy to find.
- Ensure long message history can scroll without breaking the page.
- Keep the floating shortcut hidden on `/assistant` as already implemented.

## Mobile Behavior

- Single-column layout.
- Chat header, message list, starter prompts, and composer stack cleanly.
- Composer should remain reachable without horizontal overflow.
- Bubbles should wrap long text.
- Prompt chips should wrap and remain tappable.
- Avoid fixed-position composer unless it is tested carefully against mobile browser UI.
- Keep touch targets comfortable.

## Accessibility Requirements

- Maintain clear labels for textarea and submit button.
- Message list should have a meaningful accessible label.
- User and assistant messages should identify speaker textually, not only by color/alignment.
- Loading/preparing state should be visible text, not only animation.
- Starter prompts are real buttons.
- Submit button is keyboard reachable and disabled during send.
- Focus states remain visible.
- Do not rely on color alone for emergency or response source states.

## Risks

- Moving logic while redesigning UI could accidentally change when `/api/assistant` is called.
- A sticky composer could overlap content on mobile.
- Quick prompt chips could accidentally become auto-send shortcuts if not kept conservative.
- Hiding too much context could make the Assistant feel less clearly grounded in the active dog.
- Overusing animation could distract from safety content.

## Out Of Scope

- No `/api/assistant` changes.
- No Gemini/server-side boundary changes.
- No new AI capability.
- No automatic AI calls.
- No polling, prefetching, or background requests.
- No paid API usage.
- No chat persistence.
- No Supabase schema, RLS, storage, env, API key, backend/service-role, auth, Telegram, scheduler, Reminders, Nearby, Recommendations, Dog Profile, Dashboard, dog insights, product recommendations, or product logic changes.
- No new dependencies unless explicitly approved.
- No proactive assistant messages.

## QA Checklist

- Floating Doggy shortcut opens a chat widget without navigating away.
- Widget can minimize and reopen.
- `/assistant` opens for authenticated users and remains compatible.
- Page looks like a polished chat-style experience.
- Active dog context still appears.
- Reminder context still loads.
- Starter prompts populate the composer and do not call `/api/assistant`.
- No `/api/assistant` request happens on page load.
- No `/api/assistant` request happens until explicit submit.
- Sending a normal question still works.
- Mock/fallback behavior still works.
- Emergency question still triggers emergency behavior before normal generation.
- Duplicate send guard still works while sending.
- Validation still blocks empty questions.
- Messages remain local and clear after dog switching.
- Floating shortcut opens the widget and remains hidden on `/assistant`.
- Mobile layout has no horizontal overflow.
- No unrelated feature flows are changed.

## Risks / TODOs

- Decide whether starter prompts should only fill the composer or optionally send after a second explicit click; safest MVP is fill-only.
- Consider a future extraction of chat UI components only after the page redesign stabilizes.
- Consider whether `/assistant` should eventually redirect to the widget-first experience after compatibility is no longer needed.
- After Gemini-connected QA passes, consider removing or replacing the standalone `/assistant` page fully with the floating chat widget.

## Go / No-Go Recommendation

Go for Phase 8.5H as a reusable Assistant chat experience with a floating widget as the primary entry point and `/assistant` retained as a compatibility route.

Do not change Assistant business logic, `/api/assistant`, emergency behavior, Mock Mode, or server-side Gemini boundary. The implementation should improve the chat experience while preserving explicit-submit-only cost control.
