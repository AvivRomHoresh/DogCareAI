# DogCareAI – Phase 2 Summary

## Phase 2 Deliverables Created

- `docs/ARCHITECTURE.md`
- `docs/ADR-001-stack-choice.md`
- `docs/ADR-002-ai-cost-control.md`
- `.env.example`
- `docs/DESIGN.md` draft with Phase 3 UX carryover items

## What Phase 2 Solves

Phase 2 turns the approved `SPEC.md` into a clear architecture plan before Codex starts coding.

It defines:

- the approved zero-cost MVP stack
- data flow
- Supabase responsibility
- AI service boundary
- context engineering pipeline
- `get_context_for_query` helper design
- secrets policy
- AI cost-control strategy
- chat debounce / duplicate-send protection
- mock AI mode
- beta decision to defer Supabase Storage image uploads
- lightweight AI usage logging with `latency_ms`
- Phase 3 UX decisions for emergency pre-check, empty states, and contextual Mock AI responses

## Review Notes Applied

The following improvements were added after review:

1. Context selection is now defined as a concrete helper: `get_context_for_query(user_id, dog_id, question)`.
2. Gemini rate limits are described as model-dependent instead of hardcoding one universal RPM value.
3. The chat flow now includes frontend debounce and in-flight request protection.
4. `ai_usage_logs` now includes `latency_ms`, `response_source`, and optional `error_code`.
5. Emergency detection is split into frontend pre-check and server-side authoritative detection.
6. Supabase Storage image upload is deferred for beta; placeholder dog avatars are enough.
7. A Mermaid context-engineering data-flow diagram was added to `ARCHITECTURE.md`.
8. Emergency UX was clarified: the frontend should show EmergencyAlert before sending/saving a normal chat message.
9. Empty states were added to the Phase 3 design draft.
10. Mock AI mode was upgraded to use contextual templates with the active dog's name and detected intent.
11. A final review clarified that Mock/Fallback UI labels should use AI response metadata, not direct frontend access to server-side environment variables.
12. A final review clarified that deferred context tables may return empty arrays during beta, while dog profile fields still support context engineering.

## Next Phase

After reviewing and accepting these files, continue to Phase 3 by finalizing the included `docs/DESIGN.md` draft:

- screen list
- layout rules
- minimal UI style
- responsive/mobile-first behavior
- EmergencyAlert UI
- empty states
- contextual Mock AI response UX
- AI response contract using `response_source` so the frontend does not need server-only env variables

Only after Phase 3 and Phase 4 should Codex create the first project skeleton.
