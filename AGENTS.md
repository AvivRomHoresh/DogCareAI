# DogCareAI – AGENTS.md

## 1. Purpose

This file gives Codex / coding agents the project context, workflow rules, scope boundaries, and implementation constraints for DogCareAI.

Before writing code, read these files in this order:

1. `SPEC.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DESIGN.md`
4. `docs/ADR-001-stack-choice.md`
5. `docs/ADR-002-ai-cost-control.md`
6. `.env.example`
7. `AGENTS.md`

Do not begin implementation if these files are missing or contradict each other.

---

## 2. Project Summary

DogCareAI is an AI-assisted web application for dog owners.

The app helps users:

- create and manage dog profiles,
- manage dog-care reminders,
- ask contextual dog-care questions,
- receive safe mock/real AI responses,
- demonstrate context engineering and AI-native software engineering concepts.

The MVP must be buildable and demoable without mandatory paid infrastructure.

---

## 3. Approved Tech Stack

### Frontend

- React
- Vite
- TailwindCSS
- React Router

### Backend / Data

- Supabase Authentication
- Supabase Postgres
- Supabase Row-Level Security
- Supabase Storage only after beta unless core beta is already stable

### AI Layer

- Gemini API only through a secure server-side boundary
- Mock AI Mode for development, testing, and demos

### Server-Side Boundary Options

Use one of these:

1. Supabase Edge Function
2. Vercel/Netlify serverless function
3. Mock mode only, if a secure server-side function is unavailable

Never expose Gemini keys or Supabase service-role keys in frontend code.

---

## 4. Current Phase and Implementation Order

The planning phases are complete through Phase 3.

Phase 6 progress completed:

1. Phase 6 Step 0: Baseline build.
2. Phase 6 Step 1: Supabase environment setup.
3. Phase 6 Step 2: Auth + protected routes.
4. Phase 6 Step 3: Database schema + RLS.
5. Phase 6 Step 4: Dog Profile.
6. Phase 6 Step 5: Basic Reminders.
7. Phase 6 Step 6: Dashboard basics.
8. Phase 6 Step 7: AI Assistant Mock + Context + Emergency.
9. Phase 6 Step 8A: Vercel hosting compatibility.
10. Phase 6 Step 8B: Gemini through Vercel server-side boundary.

Current implementation step:

- Phase 6 Step 9: Stabilization before Phase 7 QA.

Next phase after Step 9:

- Phase 7 QA.

Do not implement the full app in one large change.

---

## 5. Beta Scope

The beta must focus only on:

- Authentication
- Dog Profile
- Dashboard / Home
- AI Assistant
- Basic Reminders
- README/demo instructions

### Beta UI routes

- `/auth`
- `/`
- `/dog-profile`
- `/assistant`
- `/reminders`

### Final-only routes

- `/activity-log`
- `/vet-finder`
- `/settings`, optional only if needed

Do not implement final-only screens before the beta flow is stable.

---

## 6. Explicitly Out of Scope for Beta

Do not add these during beta unless explicitly requested later:

- paid OpenAI API usage,
- paid vector database,
- Google Maps paid API,
- social feed,
- marketplace,
- premium plans,
- full calendar view,
- mobile push notification infrastructure,
- image diagnosis,
- active Supabase Storage upload button,
- complex analytics dashboard,
- background scheduled LLM jobs,
- multi-owner permissions,
- community features.

---

## 7. UI / Design Rules

Follow `docs/DESIGN.md` exactly.

Important rules:

- Use mobile-first layouts.
- Keep screens simple and card-based.
- Use one clear primary action per screen.
- Use `DogPicker` to show and control the active dog context.
- Use `StaticAvatarPicker` for beta; do not show a working upload button.
- Use `ContextSummaryCard` in the AI Assistant, collapsed by default.
- Do not expose the full hidden prompt in the UI.
- Do not show final features as active if they are not implemented.

---

## 8. Data and Supabase Rules

All user-owned tables must include `user_id` and use Row-Level Security.

Expected tables may include:

- `profiles`
- `dogs`
- `reminders`
- `activities`
- `medical_records`
- `chat_messages`
- `ai_usage_logs`

Beta does not require every future table to be fully implemented.

If `activities`, `medical_records`, or `chat_messages` are not implemented yet:

- return empty arrays from context helpers,
- continue using dog profile fields for context,
- do not block the AI Assistant or beta demo.

---

## 9. AI Context Engineering Rules

The AI Assistant must not behave like a generic chatbot.

For each AI request:

1. Validate the authenticated user.
2. Verify dog ownership.
3. Run deterministic emergency detection before LLM generation.
4. Load only relevant dog context.
5. Build a compact structured context object.
6. Use `get_context_for_query(user_id, dog_id, question)`.
7. Apply Top-K relevant context limits.
8. Avoid sending full histories.
9. Avoid sending unnecessary personal data.
10. Return structured response metadata.

Recommended response shape:

```json
{
  "message": "Assistant response text",
  "response_source": "gemini | mock | fallback | emergency_rule",
  "is_emergency": false,
  "detected_intent": "feeding | vaccination | walking | routine | behavior | unknown",
  "disclaimer": "DogCareAI provides general informational guidance and is not a substitute for professional veterinary advice."
}
```

Frontend labels must use `response_source`, not server-only environment variables.

---

## 10. Mock AI Mode Rules

Mock AI Mode is required.

When `MOCK_AI_MODE=true` or no Gemini key is available:

- do not call Gemini,
- return a deterministic safe response,
- include visible dog context variables,
- include detected intent if available,
- clearly label the response as mock/demo behavior,
- keep the app demo-friendly.

Example mock behavior:

```text
Because Luna is a 7-year-old Labrador with medium activity level (Intent: Nutrition), this mock response would use her profile, allergies, and recent reminders to answer your question. (Mock Response)
```

---

## 11. Emergency Safety Rules

Emergency detection must run before normal AI generation.

Emergency detection must be deterministic and must not rely only on the LLM.

Use a shared emergency keyword list for frontend UX, but the server-side function is the source of truth.

When emergency logic triggers:

- show `EmergencyAlert`,
- block normal AI send by default,
- do not call the LLM by default,
- return `response_source=emergency_rule`,
- do not provide speculative diagnosis,
- advise contacting a veterinarian immediately.

Frontend emergency pre-check is for UX and cost protection only. It is not a security boundary.

---

## 12. Cost-Control Rules

Follow `docs/ADR-002-ai-cost-control.md`.

Rules:

- No automatic background LLM calls.
- AI calls only after explicit user action.
- Dashboard opening must not call the LLM.
- Use Top-K relevant context.
- Prefer rule-based logic before AI.
- Keep Mock AI Mode available.
- Handle AI provider failures and rate limits gracefully.
- Log only lightweight AI usage metadata.
- Do not log full prompts by default.

---

## 13. Security Rules

Required:

- never expose `GEMINI_API_KEY` in frontend code,
- never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code,
- use Supabase anon key only on the client,
- enable RLS on user-owned tables,
- validate inputs before saving or sending to AI,
- separate system instructions from user content,
- sanitize user-generated content before prompt construction,
- avoid sending PII to the LLM,
- do not print secrets in logs,
- do not commit `.env.local` or real keys.

---

## 14. Coding Conventions

### General

- Keep components small and focused.
- Prefer clear names over clever abstractions.
- Avoid premature optimization.
- Avoid adding dependencies unless necessary.
- Use TypeScript if the project is created with TypeScript; otherwise keep JavaScript simple and consistent.

### Suggested structure

```text
src/
  components/
  pages/
  lib/
  hooks/
  constants/
  services/
  types/
```

Suggested files:

```text
src/constants/emergencyKeywords.ts
src/lib/mockAiResponse.ts
src/lib/getDetectedIntent.ts
src/lib/supabaseClient.ts
src/components/EmergencyAlert.tsx
src/components/ContextSummaryCard.tsx
src/components/DogPicker.tsx
```

Adapt extensions to the chosen JS/TS setup.

---

## 15. Workflow Rules

For every implementation task:

1. Read the relevant docs first.
2. Restate the exact task scope internally.
3. Make the smallest useful change.
4. Do not add unrelated features.
5. Keep the app runnable.
6. Update docs only when behavior changes.
7. Prefer one feature branch per feature.
8. Do not make large multi-feature commits.

Before marking a task done:

- run the app locally if possible,
- check the beta flow manually,
- verify no secrets are exposed,
- verify mock mode still works,
- verify no paid service is required.

---

## 16. Historical First Codex Task

Historical note: this was the first implementation task for the initial project skeleton. It is preserved for context and is not the current implementation step.

When starting implementation, Codex was instructed to do only this:

```text
Read SPEC.md, docs/ARCHITECTURE.md, docs/DESIGN.md and AGENTS.md. Do not implement the full app yet. Create only the initial React + Vite + Tailwind client structure, Supabase client setup, README, and .env.example. Do not create a required paid backend service. Keep mock AI mode available.
```

Expected result:

- app skeleton runs,
- routes are prepared or stubbed,
- Supabase client config is documented,
- `.env.example` exists,
- README explains how to run locally,
- no beta feature is fully implemented yet unless explicitly requested.

---

## 17. Refusal / Stop Conditions for Agent

Stop and ask for clarification before continuing if:

- a requested change contradicts `SPEC.md`, `ARCHITECTURE.md`, or `DESIGN.md`,
- implementation requires a paid service,
- a feature would expose API keys in frontend code,
- a task would expand beyond the current phase,
- emergency logic would rely only on the LLM,
- the app would lose Mock AI Mode support.

---

## 18. Historical Definition of Done for Phase 4

Historical note: this definition described completion criteria for Phase 4 documentation. It is preserved for context and is not the current definition of done.

Phase 4 was complete when this file clearly defined:

- project context,
- approved stack,
- beta scope,
- final scope boundaries,
- Codex workflow rules,
- security rules,
- AI context engineering rules,
- Mock Mode behavior,
- Emergency safety behavior,
- first implementation prompt.
