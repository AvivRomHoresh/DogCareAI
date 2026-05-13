# ADR-002 – AI Cost Control and Zero-Cost MVP Strategy

## Status

Accepted for MVP planning.

## Date

2026-05-12

## Context

DogCareAI includes an AI assistant and context engineering pipeline.

However, the project must be designed so that it can be built, tested, and demonstrated without mandatory paid subscriptions or paid cloud usage.

The lecturer raised concern that LLM usage could become expensive. Therefore, the architecture must show clear cost-control decisions.

## Decision

DogCareAI will use a cost-controlled AI architecture:

1. No automatic background LLM calls.
2. AI is called only after explicit user action.
3. The MVP uses `get_context_for_query` and Top-K relevant context instead of full-history prompts.
4. Rule-based logic is used before AI where possible.
5. Emergency detection is deterministic before normal AI generation.
6. Mock AI mode is supported for development, testing, and demos.
7. AI rate-limit and quota failures are handled gracefully.
8. Frontend duplicate sends are reduced with debounce and in-flight request protection.
9. No paid vector database is required for the MVP.
10. No paid Google Maps API is required for the MVP.
11. No AI provider key is exposed in frontend code.

## Cost-Control Rules

### 1. Explicit AI Calls Only

AI should be called only when the user intentionally performs an AI action, such as:

- asking a question in the AI assistant
- clicking “Generate AI explanation”

Opening the dashboard must not automatically call the LLM.

---

### 2. Rule-Based Proactive Suggestions

The proactive care workflow should use deterministic application logic for the MVP.

Examples:

- upcoming vaccination reminder
- missed reminder warning
- birthday/age-based suggestion
- missing recent activity log

If an explanation is needed, the user must explicitly request AI generation.

---

### 3. Top-K Relevant Context Through `get_context_for_query`

The system must not send the entire dog history, full chat history, or all medical records to the LLM.

Instead, the secure AI function should call:

```text
get_context_for_query(user_id, dog_id, question)
```

The helper should:

- detect simple intent categories from the user question
- fetch only relevant rows
- apply item limits and date limits
- return structured JSON context
- avoid unrelated history

Example:

```text
Question: "When does my dog need the next vaccine?"
→ Include: dog profile, allergies, vaccination medical records, vaccination reminders
→ Avoid: old walk history, unrelated grooming notes
```

Default context should include:

- active dog profile
- only recent or directly relevant reminders
- only recent or directly relevant activities
- only relevant medical records
- only a few recent chat messages
- short summaries instead of long raw histories

This reduces:

- token usage
- latency
- privacy exposure
- cost risk

---

### 4. Mock AI Mode

Mock AI mode must be supported through an environment variable.

When enabled, the system returns safe predefined responses without calling the AI provider.

Mock mode is useful for:

- local development
- testing
- classroom demos
- cases where API quota is unavailable
- avoiding accidental costs

Example behavior:

```text
MOCK_AI_MODE=true
→ AI endpoint returns a safe demo response based on the dog profile and user question.
```

Mock responses should still demonstrate context engineering. They should include the active dog's name and detected intent instead of returning the same generic text for every question.

Example:

```text
Based on Cookie's profile, this mock response would use Cookie's feeding preferences and allergies to answer your nutrition question. (Mock Response)
```

This makes classroom demos stronger while avoiding AI calls. The UI or response text must clearly label the response as mock/demo behavior. The frontend should base that label on the AI response metadata, such as `response_source=mock`, not on direct access to server-side environment variables.

---

### 5. Rate-Limit, Duplicate-Send, and Failure Handling

Gemini rate limits are model-dependent and may change. The project should not document one universal RPM number as a fixed guarantee.

The app must reduce accidental duplicate AI calls:

- debounce the chat send action
- disable send while a request is pending
- ignore repeated Enter/click submissions during the same pending request
- show a loading indicator

If the AI provider is unavailable or rate-limited, the app must not crash.

The user should see a friendly fallback message:

```text
The AI assistant is temporarily unavailable. Your dog profile and reminders still work. Please try again later.
```

Emergency guidance should still use deterministic safety handling when emergency keywords are detected.

---

### 6. Deterministic Emergency Detection

Emergency detection should run before any normal LLM generation.

For faster UX, the frontend may also use an emergency keywords constant, but the server-side AI function must repeat the check and remain the source of truth.

Recommended future frontend file:

```text
src/constants/emergencyKeywords.ts
```

Recommended behavior:

```text
Emergency keyword detected
→ return emergency UI response
→ do not call the LLM by default
→ log response_source = emergency_rule
```

---

### 7. No Paid Services Required for MVP

The MVP must not require:

- paid OpenAI API usage
- paid vector database
- paid Google Maps API
- paid cron service
- paid monitoring platform
- paid custom domain
- paid always-running backend server

This does not guarantee that external providers will keep free tiers unchanged forever. The project only guarantees that the architecture avoids mandatory paid services and includes fallbacks.

## AI Usage Logging

The system may log lightweight metadata:

- model
- request type
- response source: `gemini`, `mock`, `fallback`, or `emergency_rule`
- estimated input tokens
- estimated output tokens
- latency in milliseconds: `latency_ms`
- status
- timestamp
- error code, if relevant

The system should not log full prompts by default.

## Privacy Benefit

Cost control also improves privacy because less user data is sent to the LLM.

The system should avoid sending:

- full names
- phone numbers
- addresses
- authentication data
- exact location data
- unnecessary medical history

Only dog-care context required for the answer should be included.

## Consequences

### Positive

- lower cost risk
- safer demo environment
- better privacy
- clearer answer to lecturer’s concern
- easier local development
- app remains usable even if AI is unavailable
- better demonstration value through `latency_ms` and `response_source`

### Tradeoffs

- AI answers may be less context-rich than a full-history system
- rule-based relevance is simpler than semantic retrieval
- mock mode must be documented honestly as a fallback/demo mode
- frontend debounce improves UX but does not replace server-side rate-limit handling

## Implementation Checklist

- [ ] Add `MOCK_AI_MODE` environment variable
- [ ] Add `AI_MAX_CONTEXT_ITEMS` environment variable
- [ ] Add `AI_MAX_INPUT_CHARS` environment variable
- [ ] Add `AI_REQUEST_TIMEOUT_MS` environment variable
- [ ] Add optional `AI_RATE_LIMIT_MAX_REQUESTS_PER_MINUTE` environment variable
- [ ] Add optional `VITE_CHAT_DEBOUNCE_MS` frontend variable
- [ ] Build AI prompt from selected context only
- [ ] Implement `get_context_for_query`
- [ ] Implement deterministic emergency detection before LLM call
- [ ] Add frontend debounce / in-flight guard for chat sends
- [ ] Handle AI API failures gracefully
- [ ] Make Mock AI responses context-aware using the active dog name and detected intent
- [ ] Return `response_source` from the AI endpoint so the frontend can display Mock/Fallback labels safely
- [ ] Log only lightweight AI usage metadata
- [ ] Include `latency_ms` and `response_source` in AI usage logs
- [ ] Do not expose AI keys in frontend code
