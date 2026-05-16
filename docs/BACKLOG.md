# DogCareAI Backlog

## Purpose

This backlog captures future improvements discovered during Phase 6 manual testing. These items are intentionally deferred and should not block the current beta flow.

Current phase status: Phase 6 Step 8B has been implemented and merged. The current step is Phase 6 Step 9 - Stabilization before Phase 7 QA.

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
- A future version may add breed suggestions, a datalist, or a dropdown.
- A complete breed database should not block the beta.

### 4. Public Landing Page

- The current app sends unauthenticated users to `/auth`.
- A future version may add a public landing page with Login and Sign Up actions.
- This is not needed for the current beta.

### 5. Automated Tests

- A future version should add automated tests for authentication.
- Dog Profile CRUD should have test coverage.
- Active dog persistence should have test coverage.
- Archive behavior should have test coverage.
- RLS assumptions should be covered through documented verification or integration tests where practical.

### 6. Real Dog Image Upload

- Beta uses static avatar choices and does not use Supabase Storage.
- A future version may add real dog image upload with Supabase Storage.
- Storage upload should remain deferred until after beta or until the core flow is stable.
