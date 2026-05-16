# Phase 6 Step 7: AI Assistant Mock + Context + Emergency Report

## Branch

- `phase-6-ai-assistant-mock-context-emergency`

## Step Goal

Implement the beta `/assistant` flow with active dog context, reminder context, deterministic intent detection, deterministic emergency detection, and mock/demo responses only.

## Files Changed

- `README.md`
- `AGENTS.md`
- `docs/BACKLOG.md`
- `src/components/ContextSummaryCard.tsx`
- `src/components/EmergencyAlert.tsx`
- `src/constants/emergencyKeywords.ts`
- `src/lib/getDetectedIntent.ts`
- `src/lib/mockAiResponse.ts`
- `src/pages/AssistantPage.tsx`
- `docs/PHASE_6_AI_ASSISTANT.md`
- `docs/PHASE_6_PRE_STEP7_ALIGNMENT.md`

`AGENTS.md`, `docs/BACKLOG.md`, and `docs/PHASE_6_PRE_STEP7_ALIGNMENT.md` are the pre-Step 7 documentation alignment carried into this branch before implementation began.

After implementation, `AGENTS.md` and `docs/BACKLOG.md` were updated so the repository points to Phase 6 Step 8 after this PR is reviewed and merged.

## Assistant Behavior Implemented

- `/assistant` now shows a working beta Assistant screen instead of a stub.
- The page includes a title, active dog badges, persistent safety disclaimer, mock mode badge, starter questions, local chat list, question textarea, and Send button.
- Chat messages are frontend-local only and are not persisted to Supabase.
- Sending is disabled while a response is being generated, and duplicate submits are ignored while `isSending` is active.
- The Assistant does not send any request on page load.

## Context Behavior Implemented

- The Assistant uses the existing `useDogs` active dog context.
- `ContextSummaryCard` summarizes selected dog profile fields and loaded reminder context.
- The context summary is compact and does not expose or pretend to expose a hidden LLM prompt.
- If no dog profile exists, the page shows a friendly empty state with a link to `/dog-profile`.
- If dogs exist but no active dog is selected, the page asks the user to select a dog before asking questions.

## Emergency Behavior Implemented

- `src/constants/emergencyKeywords.ts` defines shared emergency keywords in English and Hebrew.
- Emergency detection runs before normal mock response generation.
- Emergency questions show `EmergencyAlert`.
- Emergency responses use `response_source = "emergency_rule"`, `is_emergency = true`, and `detected_intent = "emergency"`.
- Emergency flow advises contacting a veterinarian or emergency animal clinic immediately.
- Emergency flow avoids diagnosis and does not generate a normal mock response.
- No AI provider is called for emergency detection or response.

## Post-Merge Emergency Keyword Hotfix

- Manual QA found that some accident, trauma, and repeated vomiting examples were not detected as emergencies.
- Emergency keyword coverage was expanded for English and Hebrew accident, trauma, vomiting, severe pain, collapse, breathing, and gum-color symptoms.
- No Gemini, backend, schema, RLS, paid service, or Assistant UI changes were added in this hotfix.

## Mock Response Behavior Implemented

- `src/lib/getDetectedIntent.ts` provides rule-based intent detection for:
  - feeding
  - vaccination
  - walking
  - routine
  - behavior
  - emergency
  - unknown
- `src/lib/mockAiResponse.ts` returns structured mock metadata with:
  - `message`
  - `response_source`
  - `is_emergency`
  - `detected_intent`
  - `disclaimer`
- Mock responses mention the active dog name, detected intent, available profile details, and relevant reminder context when available.
- Mock responses are clearly labeled as beta mock/demo behavior and confirm that no real AI provider was called.

## Active Dog Dependency

- Assistant sending is blocked unless there is a valid active dog.
- Switching active dogs clears the frontend-local chat and reloads reminder context for the new active dog.
- The page relies on the header `DogPicker` for active dog selection.

## Reminder Context Behavior

- The Assistant loads reminders for the active dog only from `public.reminders`.
- Reminder loading is skipped when `activeDogId` is missing.
- The query filters by `dog_id = activeDogId` and relies on Supabase RLS for user isolation.
- If reminder loading fails, the Assistant shows a friendly context warning and can still generate mock responses from dog profile context.
- Reminder context is used only for frontend mock response wording. It does not trigger background jobs or database updates.

## Cost-Control Confirmation

- Dashboard opening still does not trigger any LLM call.
- Assistant opening does not trigger any LLM call.
- Sending an Assistant message generates only a local deterministic mock response.
- No Gemini calls were added.
- No paid services were added.
- Mock AI behavior remains demo-friendly.

## Security Confirmation

- No `GEMINI_API_KEY` is exposed in frontend code.
- No `SUPABASE_SERVICE_ROLE_KEY` is used.
- The frontend uses only the existing Supabase browser client and anon-key flow.
- Reminder context queries rely on existing RLS.
- No secrets were committed.

## Intentionally Not Implemented

- No Gemini calls.
- No Edge Functions or serverless functions.
- No database schema changes.
- No RLS policy changes.
- No new tables.
- No chat persistence.
- No `ai_usage_logs` persistence.
- No Supabase service-role usage.
- No paid services.
- No final-only routes.
- No Activity Log.
- No Vet Finder.

## Manual Smoke Test Checklist

- Sign in with a Supabase email/password account.
- Open `/assistant` with no dog profile and confirm the empty state appears.
- Create a dog profile and make it active.
- Open `/assistant` and confirm the context summary shows the active dog.
- Ask a feeding/routine/walking/vaccination/behavior question and confirm the detected intent is reasonable.
- Confirm the response is clearly labeled as mock/demo behavior.
- Confirm no Gemini/API key is required.
- Confirm no network call is made to a real AI provider.
- Confirm the Send button is disabled while a response is being generated.
- Confirm duplicate sends are blocked.
- Confirm reminders for the active dog are included in the context summary or mock response where relevant.
- Switch active dogs and confirm the assistant context updates.
- Enter an emergency keyword such as "my dog is choking" or "הכלב לא נושם" and confirm EmergencyAlert appears.
- Confirm emergency flow does not generate a normal mock answer.
- Confirm emergency response advises contacting a veterinarian immediately and does not diagnose.
- Confirm `/`, `/dog-profile`, and `/reminders` still work.
- Confirm build and lint pass.

## Build and Lint Results

| Command | Result | Notes |
|---|---|---|
| `npm.cmd run build` | Passed | Required elevated sandbox permissions so Vite could spawn esbuild. |
| `npm.cmd run lint` | Passed | TypeScript check completed successfully. |

## Readiness Statement for Phase 6 Step 8

After review, manual smoke testing, and merge, the project will be ready for Phase 6 Step 8: Optional Gemini/server-side boundary. Step 8 should keep Gemini behind a secure server-side boundary and preserve Mock AI Mode.
