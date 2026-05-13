# DogCareAI – Full Project Specification (V3)

## 1. Project Overview

### Project Name
**DogCareAI**

### Project Type
AI-assisted web application for dog owners.

### Project Vision
DogCareAI is an AI-native pet care platform designed to help dog owners manage their dog’s daily life, health information, reminders, and behavioral guidance through a centralized intelligent system.

Unlike a regular reminder application, DogCareAI combines:
- structured pet management,
- contextual AI assistance,
- proactive recommendations,
- agentic workflows,
- and personalized dog-aware interactions.

The project follows the concepts taught in:
- Agentic Software Engineering (ASE)
- Spec-driven development
- Context engineering
- AI-assisted workflows
- Vibecoding methodologies

### Zero-Cost MVP Constraint
The MVP must be designed so it can be built, tested, and demonstrated without requiring paid subscriptions or paid cloud usage.

This does not guarantee that external providers will always keep their free tiers unchanged. Instead, the architecture must avoid mandatory paid services, avoid automatic upgrades, minimize AI usage, and provide fallback behavior when free-tier limits are reached.

---

## 2. Main Goals

The system aims to:
- Simplify dog care management
- Help owners maintain consistent routines
- Reduce forgotten medical events
- Provide AI-assisted guidance
- Create personalized experiences for each dog
- Demonstrate practical AI-native software engineering concepts

---

## 3. Target Users

### Primary Users
- Dog owners
- Families with dogs
- First-time adopters
- Busy pet owners

### Secondary Users (Future Scope)
- Veterinarians
- Dog trainers
- Pet sitters
- Pet boarding services

---

## 4. Core MVP Features

### 4.1 Authentication System

Users can:
- Register
- Login
- Logout
- Persist sessions securely

#### Authentication Requirements
- Email/password authentication
- Protected routes
- Session persistence
- Secure environment variables
- Supabase Row-Level Security for user-owned data

---

### 4.2 Dog Profile Management

Each user can manage one or multiple dogs.

#### Dog Profile Fields
- Name
- Breed
- Age
- Weight
- Gender
- Profile image
- Medical notes
- Allergies
- Vaccination history
- Feeding preferences
- Activity level
- Special conditions

#### Functional Requirements
Users can:
- Add dogs
- Edit dog profiles
- Archive profiles
- Switch between dogs

---

### 4.3 Daily Care Dashboard

The dashboard acts as the main control center.

#### Dashboard Components
- Upcoming reminders
- Daily schedule
- Vaccination alerts
- Recent activities
- AI recommendations
- Dog health summaries
- Quick actions

#### Quick Action FAB (Floating Action Button)
A floating mobile-friendly button provides fast access to:
- Start AI chat
- Log medication
- Log feeding
- Log walk/activity
- Add reminder

---

### 4.4 Reminder System

Users can create reminders for:
- Feeding
- Medication
- Walks
- Grooming
- Vet visits
- Vaccinations

#### Reminder Properties
- Reminder type
- Dog association
- Date/time
- Recurring frequency
- Notes
- Notification state

#### Reminder States
- Upcoming
- Completed
- Missed
- Snoozed

---

## 5. AI Assistant System

The AI Assistant is the central intelligent feature of the platform.

The assistant provides contextual guidance related to:
- nutrition,
- exercise,
- routines,
- general health awareness,
- behavioral suggestions,
- and dog-care recommendations.

The assistant is not intended to replace veterinarians.

For the zero-cost MVP, AI usage should be limited, intentional, and protected by fallback behavior. The system should support a mock AI mode for development, testing, and demonstrations when the free-tier AI provider is unavailable or rate-limited.

---

## 6. AI Safety & Expectation Management

### Automatic Disclaimer
Every AI interaction displays a persistent disclaimer:

> “DogCareAI provides general informational guidance and is not a substitute for professional veterinary advice.”

---

### Emergency Detection System

The AI assistant includes emergency keyword detection.

#### Example Emergency Keywords
- bleeding
- poison
- choking
- seizure
- unconscious
- difficulty breathing

#### Emergency Behavior
When emergency patterns are detected:
- Normal AI flow is interrupted
- Emergency alert UI appears
- Quick-access emergency contact button is shown
- AI avoids dangerous medical hallucinations
- User is advised to contact a veterinarian immediately

Emergency detection should not rely only on the LLM. In the MVP, it should be implemented with deterministic rule-based logic before normal AI generation.

---

## 7. Context Engineering Architecture

Context engineering is one of the core concepts of the project.

The AI assistant does not operate as a generic chatbot. Instead, every response is generated using structured contextual information related to the specific dog and user.

---

### 7.1 Context Pipeline

Before generating every AI response:

1. User message is received.
2. Active dog profile is loaded.
3. Relevant medical records are loaded.
4. Reminder/activity history is loaded.
5. Recent conversation history is loaded.
6. Safety instructions are injected.
7. Dynamic system prompt is constructed.
8. Context package is sent to the LLM.

---

### 7.2 Dynamic Prompt Construction

The assistant uses a structured system prompt template.

#### Example Context Variables
- Dog breed
- Dog age
- Weight
- Allergies
- Medical conditions
- Activity level
- Conversation history
- User preferences
- Safety constraints

Dog context should be serialized as structured JSON so the model receives clear, machine-readable context instead of unstructured raw text.

---

### 7.3 AI Behavioral Rules

The assistant must:
- Avoid pretending to be a veterinarian
- Avoid definitive diagnoses
- Encourage professional consultation when necessary
- Ask clarification questions when context is ambiguous
- Handle multi-dog ambiguity safely
- Refuse unsafe requests that attempt to bypass veterinary safety rules

---

### 7.4 Multi-Dog Context Awareness

If the user owns multiple dogs and asks ambiguous questions such as:

> “What food should I buy?”

The AI should:
- detect ambiguity,
- identify multiple possible dog contexts,
- ask which dog the user refers to.

---

### 7.5 Context Selection & Token Budget

To avoid long, expensive, and irrelevant prompts, the system will not send the entire user history to the LLM.

Instead, it will use a Top-K Relevant Context strategy.

For each AI request, the system selects only the most relevant context items, such as:
- the active dog profile,
- recent chat messages,
- relevant medical records,
- recent reminders,
- relevant activities.

#### MVP Context Limits
The MVP should enforce practical prompt limits:
- Send only the active dog profile by default.
- Include only the last few relevant chat messages.
- Include only recent or directly relevant reminders and activities.
- Avoid sending full historical records unless specifically needed.
- Prefer short summaries over raw long histories.

#### MVP Relevance Strategy
In the MVP, relevance should be determined using simple rule-based filtering, such as:
- active dog selection,
- reminder type,
- activity type,
- date range,
- emergency keyword detection,
- and explicit user intent.

Future versions may improve relevance selection using:
- embeddings,
- vector databases,
- semantic similarity search,
- and Retrieval-Augmented Generation (RAG).

The MVP intentionally avoids expensive vector database infrastructure in order to remain free to operate.

---

## 8. Proactive Care Agent (Agentic Workflow)

DogCareAI includes a lightweight proactive care workflow.

In the MVP, this workflow should be primarily rule-based rather than LLM-based. This keeps the feature useful while avoiding unnecessary AI calls and preventing hidden operational costs.

---

### Responsibilities
The proactive care system may:
- Detect upcoming birthdays
- Detect upcoming vaccinations
- Detect missed reminders
- Detect missing recent activity logs
- Suggest periodic checkups based on age
- Recommend reviewing the care routine when repeated reminders are missed

#### Example
> “Cookie is turning 7 soon. Consider scheduling a senior wellness checkup.”

---

### Proactive Agent Trigger Strategy

In the MVP, the proactive care workflow will run:
- only when the user logs in,
- or when the dashboard is opened.

It should not run continuously in the background.

For the MVP, proactive suggestions should be generated using deterministic application logic when possible. If an AI-generated explanation is needed, the user should explicitly click a button such as “Generate AI explanation” so that the system does not spend AI calls automatically.

Future versions may use:
- scheduled backend execution,
- Supabase Scheduled Edge Functions,
- or background cron jobs.

---

## 9. Database Architecture

### Core Entities

#### Auth Users
Managed by Supabase Authentication.

#### Profiles
Stores non-sensitive application-level user profile data.

#### Dogs
Stores dog profiles.

#### Reminders
Stores scheduled reminders.

#### Activities
Stores feeding, walking, medication, grooming, and other activity logs.

#### ChatMessages
Stores AI conversation history only when needed.

#### MedicalRecords
Stores health-related dog information.

#### AIUsageLogs
Stores lightweight metadata about AI usage for debugging and cost control.

---

### Relationships

#### User → Dogs
One-to-many

#### Dog → Reminders
One-to-many

#### Dog → Activities
One-to-many

#### Dog → MedicalRecords
One-to-many

#### Dog → ChatMessages
One-to-many

#### User → AIUsageLogs
One-to-many

---

### Activities Entity Design

The Activities table stores all dog-related actions in a unified structure.

#### Suggested Fields
- id
- user_id
- dog_id
- type
- timestamp
- notes
- metadata
- created_at

#### Example Activity Types
- feeding
- walk
- medication
- grooming
- vet_visit
- note

This structure allows the dashboard to display a single chronological activity feed without creating separate tables for every activity type.

---

### AI Usage Logs Entity

The AIUsageLogs table should avoid storing full prompts by default.

#### Suggested Metadata
- id
- user_id
- dog_id
- model
- request_type
- estimated_input_tokens
- estimated_output_tokens
- status
- created_at

This helps monitor free-tier usage while reducing privacy risks.

---

### Row-Level Security

If Supabase is used, Row-Level Security should be enabled so each user can access only their own dogs, reminders, activities, medical records, and chat history.

---

## 10. MVP Cost Optimization Strategy

The MVP is intentionally designed to minimize operational costs and remain usable through free-tier services.

### Cost Reduction Strategies
- Use Gemini free-tier APIs when possible.
- Limit AI context size.
- Use Top-K relevant context selection.
- Avoid continuous background AI execution.
- Avoid vector databases in MVP.
- Avoid unnecessary AI calls.
- Restrict AI usage to explicit user interactions.
- Use rule-based logic before AI whenever possible.
- Cache frequently accessed information.
- Use free-tier hosting platforms.
- Add a mock AI mode for development and demos when API limits are reached.

### Free-Tier Infrastructure Plan

#### Frontend Hosting
- Vercel Free Tier  
or
- Netlify Free Tier

#### Backend & Database
- Supabase Free Tier

#### AI Provider
- Gemini API Free Tier

### Cost Guardrails
The MVP should include explicit cost-control behavior:
- No paid API key is required for the basic demo.
- No automatic background LLM calls.
- No paid vector database.
- No paid Google Maps API in MVP.
- No automatic upgrade to paid cloud plans.
- AI calls should fail gracefully when rate limits are reached.
- The UI should show a friendly fallback message when the AI provider is unavailable.

The architecture is optimized for educational use, demonstration, and low operational cost. It is not designed as a high-scale production deployment in the MVP phase.

---

## 11. Suggested Tech Stack

### Frontend
- React
- Vite
- TailwindCSS

### Backend / Backend-as-a-Service
For the zero-cost MVP, the project should avoid a separate always-running custom backend server.

Preferred MVP backend approach:
- Supabase Authentication
- Supabase Postgres Database
- Supabase Storage for dog profile images if needed
- Supabase Row-Level Security
- Optional serverless function only for secure AI calls

### AI Integration
- Gemini API Free Tier
- Mock AI mode for development, testing, and fallback demos

### API Key Safety
The Gemini API key must not be exposed directly in the frontend bundle.

Preferred options:
- Serverless function proxy using the hosting provider free tier
- Supabase Edge Function if available within free-tier limits
- Mock mode when secure server-side execution is unavailable

### Hosting
- Vercel Free Tier  
or
- Netlify Free Tier

### Explicitly Out of MVP Scope
The MVP should not require:
- paid OpenAI API usage,
- paid vector databases,
- paid Google Maps API,
- paid cron infrastructure,
- paid monitoring tools,
- or paid custom domains.

---

## 12. UI/UX Requirements

### Design Philosophy
The application should feel:
- Friendly
- Calm
- Modern
- Mobile-first
- Clean and lightweight

---

### Mobile-First Design

The system is optimized primarily for mobile usage because dog owners often use the app:
- during walks,
- outdoors,
- in clinics,
- or while multitasking.

---

### Accessibility Requirements

The system should support:
- Proper color contrast
- Keyboard navigation
- Responsive text sizing
- Screen-reader compatibility
- Clear icon labeling

---

### Loading UX

The UI should use:
- skeleton screens,
- loading placeholders,
- and smooth transitions

while loading dashboard data or waiting for AI responses.

This improves perceived responsiveness and overall user experience.

---

## 13. Main User Flows

### Flow 1 – Registration
1. User opens landing page.
2. User clicks Sign Up.
3. User enters credentials.
4. Account is created.
5. User is redirected to dashboard.

---

### Flow 2 – Add Dog
1. User opens dashboard.
2. User clicks “Add Dog”.
3. User enters dog details.
4. User uploads image.
5. User saves profile.
6. Dog becomes active profile.

---

### Flow 3 – Add Reminder
1. User selects dog.
2. User clicks “Add Reminder”.
3. User selects reminder type.
4. User chooses date/time.
5. User saves reminder.
6. Reminder appears on dashboard.

---

### Flow 4 – AI Interaction
1. User opens AI assistant.
2. User asks a question.
3. Context pipeline loads.
4. AI generates contextual response.
5. Chat history is stored only when needed and allowed by the app design.

---

### Flow 5 – Emergency Scenario
1. User writes emergency-related message.
2. Emergency detection triggers.
3. Emergency UI appears.
4. AI displays urgent safety guidance.
5. User receives emergency contact options.

---

## 14. Error Handling

The system must gracefully handle:
- Invalid login attempts
- Missing fields
- AI API failures
- AI rate-limit errors
- Free-tier quota exhaustion
- Empty states
- Lost internet connection
- Invalid reminder dates
- Missing dog context
- Unauthorized data access attempts

---

## 15. Offline & Caching Strategy

Full offline mode is not required for MVP.

However, the system should cache:
- vaccination history,
- recent reminders,
- recent dog information.

This allows limited usability in areas with weak internet connectivity.

The cached data must not bypass user authorization. Sensitive information should not be stored insecurely on the client.

---

## 16. Logging & Observability

The system should log only the information needed for debugging and cost awareness.

Recommended logs:
- AI request status
- Estimated token usage
- Reminder actions
- API failures
- Authentication errors
- Rate-limit events

The system should avoid logging full medical histories, full prompts, or sensitive personal information unless explicitly required for debugging in a safe local development environment.

This improves:
- debugging,
- reliability,
- privacy,
- and free-tier usage monitoring.

---

## 17. Security, Privacy & Prompt Safety

The system should implement:
- Protected routes
- Secure environment variables
- Basic rate limiting
- Input validation
- Secure API key handling
- Supabase Row-Level Security
- No exposed AI provider keys in frontend code

---

### Privacy Considerations

The system should avoid sending unnecessary personally identifiable information (PII) to the LLM.

Examples of sensitive information that should not be sent:
- Full names
- Phone numbers
- Addresses
- Authentication data
- Exact location data

Only dog-related contextual information required for the response should be included.

For the MVP demo, synthetic or non-sensitive dog data should be preferred over real medical or personal data.

---

### Free-Tier AI Privacy Note

If a free-tier AI provider is used, the project should assume that submitted content may be handled under that provider’s free-tier data policy.

Therefore, the MVP should avoid sending sensitive personal information, private addresses, phone numbers, or real confidential medical records to the LLM.

---

### Prompt Injection Protection

User-generated content should be sanitized and separated from system instructions before insertion into prompts.

The system should reduce risks related to:
- prompt injection,
- malicious instructions,
- unsafe override attempts,
- system prompt manipulation,
- and user attempts to bypass veterinary safety rules.

#### Implementation Guidelines
- Keep system instructions separate from user content.
- Serialize dog context as structured JSON.
- Never allow user text to overwrite safety rules.
- Apply emergency detection before normal AI generation.

---

## 18. Success Criteria

The project is considered successful if:
- Users can manage multiple dogs
- Reminders function correctly
- AI responses are contextual
- Emergency detection works without relying only on the LLM
- Mobile UX is responsive
- Core flows work reliably
- The architecture demonstrates context engineering principles
- The MVP can be demonstrated without paid infrastructure
- AI rate-limit failures are handled gracefully

---

## 19. Test Cases

### Functional Tests
- Registration works
- Login works
- Dog creation works
- Reminder creation works
- AI assistant responds correctly
- Multiple dog switching works
- Dashboard loads recent activities from the unified Activities table
- Rule-based proactive suggestions appear on dashboard login/open

---

### Edge Cases

#### Multi-Dog Ambiguity
AI asks clarification questions.

#### Missing Internet
Cached information is still accessible.

#### Empty Dashboard
System shows friendly empty-state UI.

#### AI Failure
Fallback message is displayed.

#### Invalid Medical Input
System validates dangerous or malformed inputs.

#### Emergency Scenario
Emergency UI overrides normal AI response flow.

#### AI Free-Tier Limit
If the AI provider rate limit is reached, the system displays a friendly fallback message and does not crash.

#### API Key Safety
The AI provider API key is not visible in frontend source code or browser developer tools.

#### Proactive Workflow Cost Control
Opening the dashboard should not automatically trigger unnecessary LLM calls.

#### Row-Level Security
A user cannot access another user’s dog profiles, reminders, activities, or chat history.

---

## 20. Future Scope

Possible future extensions include:
- Veterinary RAG knowledge base
- Voice interaction
- AI-generated care plans
- Advanced proactive agents
- Multi-agent orchestration
- Wearable integrations
- Smart feeding device integrations
- AGENTS.md support
- CLAUDE.md workflows
- AI memory persistence
- Personalized AI behavior models
