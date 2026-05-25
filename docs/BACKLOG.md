# DogCareAI Backlog

## Purpose

This backlog captures future improvements discovered during beta and Phase 8 demo work. These items are intentionally deferred and should not block the current stable demo flow.

Current phase status: Phase 7 QA is complete. Phase 8.1 Nearby Places, Phase 8.2 Telegram Reminder Notifications, Phase 8.3 Google Login, and Phase 8.4A Breed Recognition + Did You Know are complete and merged to main.

## QA Notes

- During remaining Phase 8 work, bugs discovered in stable demo flows should be fixed.
- Larger improvements should stay deferred unless they block the final demo.
- Final-only features such as Activity Log and Vet Finder remain deferred unless explicitly approved.

## Deferred Improvements

### 1. Dog Birth Date and Computed Age

- Current beta uses the numeric `age` field because that is what the existing schema supports.
- A full version should replace or supplement manual age with `birth_date`.
- The app should compute age automatically from `birth_date`.
- This requires a future database migration and UI update.
- This matters because manually entered age becomes outdated and feels less professional.

### 2. Archived Dog Management

- Beta archive behavior sets `is_archived = true` and hides archived dogs from the active list.
- A full version should add a way to view archived profiles.
- A full version should add a restore action for archived profiles.
- Restore is intentionally not implemented in the current beta step.

### 3. Breed Input Improvement

- Beta uses a free-text breed input.
- Phase 8.4A now uses the existing breed value for best-effort breed matching and Did You Know insights.
- A future version may add breed suggestions, a datalist, or a dropdown.
- A complete breed database should not block the final demo.

### 4. Breed-Based Product Recommendations

- Phase 8.4B should start with curated/static product recommendation cards.
- Product recommendations may use breed, size, and general needs to suggest categories such as food, treats, toys, and accessories.
- Avoid paid shopping APIs, affiliate complexity, scraping, unreliable marketplace APIs, and claims that products are medically required.

### 5. Public Landing Page

- The current app sends unauthenticated users to `/auth`.
- A future version may add a public landing page with Login and Sign Up actions.
- This is not needed for the current beta.

### 6. Automated Tests

- A future version should add automated tests for authentication.
- Dog Profile CRUD should have test coverage.
- Active dog persistence should have test coverage.
- Archive behavior should have test coverage.
- RLS assumptions should be covered through documented verification or integration tests where practical.

### 7. Real Dog Image Upload

- Beta uses static avatar choices and does not use Supabase Storage.
- Phase 8.4C may add or plan profile image support and breed-inspired avatar fallbacks.
- Real dog image upload with Supabase Storage remains higher-risk/optional because it requires storage setup and upload policies.
- AI-generated images remain optional and should not be claimed unless a real approved implementation exists.
