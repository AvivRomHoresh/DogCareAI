# ADR-001 – Stack Choice for DogCareAI MVP

## Status

Accepted for MVP planning.

## Date

2026-05-12

## Context

DogCareAI must be implemented as a course project using spec-driven and AI-assisted development practices.

The MVP must be realistic for a short timeline and should be demonstrable without mandatory paid infrastructure.

The approved specification requires:

- web application architecture
- authentication
- dog profile management
- reminders
- contextual AI assistant
- secure AI key handling
- zero-cost-oriented implementation
- fallback behavior when AI is unavailable

The earlier generic MERN-like direction was replaced by a simpler zero-cost MVP stack.

## Decision

Use the following stack for the MVP:

### Frontend

- React
- Vite
- TailwindCSS

### Backend / Data

- Supabase Auth
- Supabase Postgres
- Supabase Row-Level Security
- Supabase Storage deferred until after beta unless the core flow is complete

### AI

- Gemini API through a secure server-side boundary
- Mock AI mode for development, testing, and demonstrations

### Hosting

- Vercel or Netlify free-tier-oriented deployment
- Supabase free-tier-oriented backend

## Reasoning

### React + Vite

React + Vite is suitable because:

- it is fast to scaffold
- it fits a student project timeline
- it works well with component-based UI
- it is easy for Codex to modify incrementally
- it supports clean separation between screens and components

### TailwindCSS

TailwindCSS is suitable because:

- it supports fast UI development
- it avoids spending too much time on custom CSS
- it works well for mobile-first layouts
- it keeps styling close to components

### Supabase

Supabase is suitable because it provides multiple required backend capabilities without building a custom always-running backend server:

- authentication
- Postgres database
- row-level security
- optional storage
- optional edge functions

This keeps the MVP simpler and more realistic.

For beta, Supabase Storage should not be treated as mandatory. Dog profile images can use placeholders or static avatars until the core AI/reminder flow is stable.

### Gemini + Mock Mode

The AI feature is important for the course, but it must not create mandatory costs.

Therefore:

- Gemini is used only through a secure server-side boundary
- AI calls are triggered only by explicit user actions
- Mock AI mode is available when API access is unavailable or rate-limited
- no background LLM jobs are required for MVP
- duplicate chat requests are reduced with frontend debounce and in-flight request protection

## Alternatives Considered

### MERN Stack: React + Node/Express + MongoDB

Rejected for MVP as the default architecture because:

- it adds backend setup and hosting complexity
- it may require a separate backend deployment
- it creates more moving parts before beta
- it is not necessary for the approved zero-cost MVP

A custom Node/Express server can still be added later if the project grows.

### Paid AI API First

Rejected because:

- the lecturer explicitly raised cost concerns
- the user wants the project to avoid required payments
- the MVP must be demoable even when AI quota is unavailable

### Vector Database / RAG Infrastructure

Rejected for MVP because:

- it adds cost and complexity
- rule-based Top-K context is enough for the beta
- the specification explicitly allows future RAG improvements

### Mandatory Image Upload in Beta

Rejected for beta because:

- it does not prove the main AI/context-engineering requirement
- it adds storage setup work and edge cases
- placeholder avatars are sufficient for the first demonstration

## Consequences

### Positive

- faster MVP delivery
- fewer services to configure
- simpler deployment path
- strong alignment with zero-cost requirements
- easier Codex prompting and review
- built-in authentication and RLS support
- better focus on the course's AI/context-engineering requirements

### Tradeoffs

- less backend customization than a full custom server
- advanced background jobs are postponed
- complex AI retrieval is postponed
- image upload is postponed unless there is time
- mock mode must be carefully explained as intentional cost-control behavior

## Implementation Rules

- Do not expose `GEMINI_API_KEY` in frontend code.
- Do not expose Supabase service-role keys in frontend code.
- Enable RLS on user-owned tables.
- Build one feature at a time.
- Use feature branches.
- Keep the beta scope focused on Dog Profile, AI Assistant, Reminders, and README.
- Use placeholder dog avatars for beta unless image upload is finished safely without hurting the core flow.
