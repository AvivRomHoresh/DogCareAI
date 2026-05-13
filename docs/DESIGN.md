# DogCare AI — Design Document

**Status:** Phase 3 complete  
**Related documents:** `SPEC.md`, `docs/ARCHITECTURE.md`, `docs/ADR-001-stack-choice.md`, `docs/ADR-002-ai-cost-control.md`  
**Goal:** define the exact screens, UI structure, components, style rules, and interface behavior before implementation in Codex.

---

## 1. Design Purpose

This document prevents the coding agent from inventing unrelated screens, adding unnecessary features, or over-engineering the UI.

DogCare AI should feel like a simple, calm, practical dog-care assistant for dog owners. The design must support the beta scope first:

1. Dog Profile
2. Dashboard/Home
3. AI Assistant with safe mock/real mode behavior
4. Basic Reminders
5. README/demo-friendly flow

Final-version additions may include Activity Log and Vet Finder, but they must not block the beta.

---

## 2. Product Design Principles

### 2.1 Simple before beautiful

The UI should be clean and usable, not complex. Do not spend time on advanced animations, heavy visual effects, or unnecessary design systems.

### 2.2 One clear action per screen

Each screen should have a primary action:

- Dog Profile: save dog details.
- Dashboard: understand today’s dog-care status.
- AI Assistant: ask a dog-care question.
- Reminders: create or complete reminders.
- Activity Log: record or review care actions.
- Vet Finder: find nearby/helpful vet-search options without paid APIs.

### 2.3 Zero-cost MVP awareness

The UI must not imply features that require paid services. Avoid designs that depend on:

- paid map APIs,
- paid notification infrastructure,
- background LLM calls,
- automatic AI analysis without user action,
- hidden premium features.

### 2.4 AI is helpful, not medical authority

The assistant may provide general dog-care guidance, but the UI must clearly show that urgent or medical cases require a veterinarian.

---

## 3. Navigation Structure

### 3.1 Beta navigation

Use a small navigation structure with these main routes:

| Route | Screen | Beta Required |
|---|---|---|
| `/` | Dashboard / Home | Yes |
| `/dog-profile` | Dog Profile | Yes |
| `/assistant` | AI Assistant | Yes |
| `/reminders` | Reminders | Yes |

### 3.2 Final navigation

Additional routes may be added only after the beta is stable:

| Route | Screen | Final Required |
|---|---|---|
| `/activity-log` | Activity Log | Yes, final phase |
| `/vet-finder` | Vet Finder | Yes, final phase |
| `/settings` | Settings | Optional only if needed |

### 3.3 Screens not allowed in MVP

Do not add the following unless explicitly requested later:

- social feed,
- dog-owner community,
- payments or premium plans,
- marketplace,
- complex multi-owner permissions,
- full calendar integration,
- Google Maps paid API integration,
- pet medical diagnosis module,
- image upload / image diagnosis,
- mobile app-specific push notification infrastructure.

---

## 4. App Layout

### 4.1 Desktop layout

Desktop should use a simple app shell:

- top header with app name and selected dog,
- left sidebar or compact horizontal navigation,
- main content area with cards,
- optional status badge for `Mock AI Mode`.

Recommended layout:

```text
+------------------------------------------------------+
| DogCare AI                     Selected dog: Luna    |
+----------------+-------------------------------------+
| Dashboard      | Main screen content                 |
| Dog Profile    |                                     |
| Assistant      |                                     |
| Reminders      |                                     |
+----------------+-------------------------------------+
```

### 4.2 Mobile layout

Mobile should be simple and usable with one hand:

- top header,
- content stacked vertically,
- bottom navigation or compact top navigation,
- full-width buttons,
- forms arranged in one column.

Recommended breakpoint behavior:

| Width | Behavior |
|---|---|
| Small/mobile | Single-column layout, bottom or top nav |
| Tablet | Cards in one or two columns |
| Desktop | Sidebar + main content grid |

---

## 5. Visual Style Rules

### 5.1 General look

Use a calm, modern, minimal style.

Recommended style:

- light background: off-white or very light gray,
- white cards,
- rounded corners,
- soft borders,
- subtle shadow only when useful,
- readable spacing,
- no visual clutter.

### 5.2 Tailwind guidance

Use Tailwind classes directly. Keep components simple.

Recommended patterns:

```text
Page container: max-w-6xl mx-auto px-4 py-6
Card: bg-white border rounded-2xl shadow-sm p-4
Primary button: rounded-xl px-4 py-2 font-medium
Input: rounded-xl border px-3 py-2 w-full
Badge: rounded-full px-2 py-1 text-xs font-medium
```

### 5.3 Color language

Use colors consistently:

| Purpose | Suggested color direction |
|---|---|
| Primary action | blue or teal |
| Success / completed | green |
| Warning / mock mode / caution | amber |
| Error | red |
| Neutral text | gray/slate |

Avoid using too many colors. The app should feel calm and trustworthy.

### 5.4 Typography

Use system fonts. Do not add custom font dependencies unless already available.

Suggested scale:

| Element | Style |
|---|---|
| Page title | large, bold |
| Section title | medium, semibold |
| Body text | regular, readable |
| Helper text | small, muted |
| Error text | small, red, clear |

---

## 6. Shared Components

The implementation should prefer reusable components.

### 6.1 Layout components

| Component | Purpose |
|---|---|
| `AppShell` | Shared page frame with navigation |
| `Header` | App name, selected dog, optional user/auth area |
| `Navigation` | Links to dashboard, dog profile, assistant, reminders |
| `PageContainer` | Consistent width and spacing |
| `SectionHeader` | Title + optional action |

### 6.2 UI components

| Component | Purpose |
|---|---|
| `Button` | Primary/secondary/destructive actions |
| `Card` | Main content blocks |
| `Input` | Text inputs |
| `Select` | Dropdown fields |
| `Textarea` | Longer notes/questions |
| `Badge` | Status, type, mock mode, priority |
| `EmptyState` | Friendly message when no data exists |
| `LoadingState` | Loading indication |
| `ErrorBanner` | Clear recoverable errors |
| `Toast` | Short feedback after save/delete/complete |

### 6.3 Feature components

| Component | Used in | Purpose |
|---|---|---|
| `DogProfileForm` | Dog Profile | Create/edit dog details |
| `DogSummaryCard` | Dashboard | Display key dog details |
| `ReminderList` | Reminders/Dashboard | Show reminders |
| `ReminderForm` | Reminders | Add/edit reminder |
| `ChatPanel` | AI Assistant | Chat layout |
| `MessageBubble` | AI Assistant | User/assistant messages |
| `ContextSummaryCard` | AI Assistant | Show what dog context is used |
| `ActivityTimeline` | Activity Log | Final phase activity history |
| `VetSearchPanel` | Vet Finder | Final phase city/search helper |

---

## 7. Screen Specifications

## 7.1 Dashboard / Home

**Route:** `/`  
**Beta:** required

### Purpose

Give the user a quick understanding of the current dog-care status and provide fast access to core actions.

### Main content

- greeting/title,
- selected dog summary,
- today’s reminders,
- quick action buttons:
  - Edit Dog Profile,
  - Ask AI Assistant,
  - Add Reminder.

### Components

- `DogSummaryCard`
- `ReminderList`
- `QuickActionCard`
- `EmptyState`

### Empty state

If no dog profile exists:

- show message: “Create your dog profile to get started.”
- primary button: “Create Dog Profile”

### Error state

If dog/reminder data cannot load:

- show `ErrorBanner`
- include retry action if easy to implement

### Design rules

- Do not show final features as active if not implemented.
- Activity Log and Vet Finder can be hidden until final phase or shown as disabled “coming later” only if useful for the demo.

---

## 7.2 Dog Profile

**Route:** `/dog-profile`  
**Beta:** required

### Purpose

Create and maintain the dog profile that powers reminders and AI context.

### Required fields

| Field | Type | Required |
|---|---|---|
| Dog name | text | Yes |
| Breed | text/select | Optional |
| Age | number/text | Optional |
| Weight | number | Optional |
| Gender | select | Optional |
| Health notes | textarea | Optional |
| Allergies/sensitivities | textarea | Optional |
| Food preferences | textarea | Optional |
| Activity level | select | Optional |

### Actions

- Save profile
- Update profile
- Cancel/back

### Validation

- Dog name cannot be empty.
- Weight must be positive if provided.
- Age must be reasonable if provided.
- Text areas should have reasonable max lengths.

### Success feedback

After save, show a toast or inline message:

```text
Dog profile saved successfully.
```

### Design rules

- Use one-column form on mobile.
- Group optional medical/care notes under a clearly labeled section.
- Do not overcomplicate with multiple tabs in beta.

---

## 7.3 AI Assistant

**Route:** `/assistant`  
**Beta:** required

### Purpose

Allow the user to ask dog-care questions using the selected dog profile as limited context.

### Main content

- selected dog context summary,
- chat message list,
- question input,
- send button,
- suggested starter questions,
- mock/real mode indicator.

### Starter questions

Examples:

- “What should I consider for today’s walk?”
- “How can I build a simple feeding routine?”
- “What reminders should I create for this dog?”
- “Is this situation urgent enough to call a vet?”

### Safety disclaimer

Display a short disclaimer near the chat input or context card:

```text
DogCare AI provides general guidance only. For urgent symptoms or medical concerns, contact a veterinarian.
```

### Mock AI Mode behavior

If `MOCK_AI_MODE` is enabled or no Gemini key is available:

- show amber badge: “Mock AI Mode”
- return useful deterministic demo responses
- do not show errors that make the app look broken

### Loading state

When waiting for AI response:

- disable send button,
- show “Thinking…” or a small loading indicator,
- prevent duplicate submissions.

### Error state

If AI request fails:

- show clear message,
- suggest trying again,
- do not expose internal API details or secrets.

### Design rules

- Do not call AI automatically when opening the page.
- AI should be triggered only after user action.
- Do not display full hidden prompt by default.
- Optional: show a small “context used” summary, not the full prompt.

---

## 7.4 Reminders

**Route:** `/reminders`  
**Beta:** required

### Purpose

Allow the user to create and manage basic dog-care reminders.

### Reminder types

Beta reminder types:

- Feeding
- Walk
- Medication
- Vaccination
- Grooming
- General note

### Reminder fields

| Field | Type | Required |
|---|---|---|
| Title | text | Yes |
| Type | select | Yes |
| Date/time | datetime/date | Optional for beta, preferred |
| Notes | textarea | Optional |
| Status | active/completed | Yes |

### Actions

- Add reminder
- Mark as completed
- Edit reminder
- Delete reminder

### Empty state

If no reminders exist:

```text
No reminders yet. Add your first dog-care reminder.
```

### Design rules

- Keep CRUD simple.
- Use badges for reminder type and status.
- Do not implement background phone push notifications in beta unless it is trivial and does not require paid infrastructure.

---

## 7.5 Activity Log

**Route:** `/activity-log`  
**Beta:** no  
**Final:** required

### Purpose

Track care actions over time.

### Activity types

- Feeding
- Walk
- Medication
- Grooming
- Vet visit
- Behavior note
- General note

### Main content

- activity timeline,
- quick add form,
- filter by type,
- latest activity first.

### Design rules

- Do not block beta on this screen.
- Use one generic `activities` model rather than separate tables for every activity type unless architecture later requires otherwise.

---

## 7.6 Vet Finder

**Route:** `/vet-finder`  
**Beta:** no  
**Final:** required

### Purpose

Help the user find a vet without requiring paid map APIs.

### Allowed MVP approaches

Use one of these zero-cost approaches:

1. City-based search link that opens an external search query.
2. Manual curated list for demo cities.
3. Simple input that generates a search URL.

### Main content

- city input,
- optional emergency checkbox/filter,
- button: “Search vets near me” or “Open search”
- short explanation that results open externally.

### Design rules

- Do not integrate Google Maps API as a required service.
- Do not promise real-time availability.
- Keep it clearly separated from AI medical advice.

---

## 8. Forms and Validation Rules

### 8.1 Required validation behavior

Every form should support:

- required field indication,
- inline validation messages,
- disabled submit while saving,
- success message after save,
- error message after failure.

### 8.2 Error message style

Use short, human-readable messages:

```text
Please enter your dog’s name.
Could not save the reminder. Please try again.
AI response is unavailable right now. Mock mode can still be used for the demo.
```

Do not show raw stack traces in the UI.

---

## 9. Data States

Each data-based screen should handle these states:

| State | Required behavior |
|---|---|
| Loading | Show loading UI, not blank page |
| Empty | Explain what is missing and show next action |
| Error | Explain the issue and allow retry/back |
| Success | Show data clearly |
| Saving | Disable duplicate actions |
| Offline/Unavailable | Show friendly fallback where relevant |

---

## 10. Accessibility Rules

The UI should follow basic accessibility practices:

- every input has a visible label,
- buttons have clear text,
- color is not the only way to communicate status,
- text contrast must be readable,
- clickable elements must be large enough on mobile,
- keyboard navigation should work for forms and buttons,
- error messages should appear near the relevant fields.

---

## 11. Implementation Boundaries for Codex

When implementing from this design, Codex must follow these rules:

1. Implement only the screens listed in this document.
2. Prioritize beta screens before final screens.
3. Use React + Vite + Tailwind according to the architecture document.
4. Use Supabase according to the architecture document.
5. Do not introduce a required paid backend service.
6. Do not expose Gemini or other AI API keys in frontend code.
7. Keep `Mock AI Mode` available.
8. Do not add unrelated features.
9. Keep components small and reusable.
10. Make the app demo-friendly even if real AI is unavailable.

---

## 12. Beta Design Acceptance Criteria

The beta UI is considered ready when:

- the user can create or edit a dog profile,
- the dashboard shows dog information or an empty state,
- the assistant screen allows a user question and returns either real or mock response,
- reminders can be created, viewed, completed, and deleted,
- loading, empty, and error states are handled,
- the app is usable on mobile and desktop,
- no required paid API is needed for the demo,
- the UI does not contain unrelated screens or fake promised features.

---

## 13. Final Design Acceptance Criteria

The final UI is considered ready when, in addition to beta criteria:

- Activity Log works as a simple timeline,
- Vet Finder works through a zero-cost approach,
- README includes screenshots or clear demo instructions,
- security-sensitive UI details are not exposed,
- the app feels consistent across all screens.
