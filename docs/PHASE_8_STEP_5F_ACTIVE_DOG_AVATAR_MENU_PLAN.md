# Phase 8.5F Active Dog Avatar Menu / AppShell Navigation Polish Plan

## Current AppShell / Navigation Summary

- `AppShell` currently uses a transparent top header with the centered DogCareAI logo.
- The right side of the header contains `DogPicker`, the authenticated user email, and the logout button.
- Main navigation is still a separate horizontal-on-mobile / left-column-on-desktop nav list with text links for Dashboard, Dog Profile, Assistant, Reminders, Nearby, and Recommendations.
- `DogPicker` is functional and uses `useDogs()` to read `activeDog`, `dogs`, `activeDogId`, loading/error state, and `setActiveDogId`.
- Active dog persistence is already handled by `useDogs()` using user-scoped localStorage.
- `DogAvatar` is available as a local breed-inspired SVG avatar component and can render recognized-breed or generic fallback avatars.

## Desired UX

- Add a compact circular avatar in the header that represents the active dog, not the Google/user profile.
- Use the existing `DogAvatar` style:
  - recognized breed: breed-inspired local avatar,
  - unknown or missing breed: generic dog avatar,
  - no dog yet: generic dog-style placeholder or clear empty state.
- Clicking the active-dog avatar opens a clean menu.
- The menu should include navigation actions with icons.
- The menu should include dog profile switching if safe:
  - list each dog with its `DogAvatar`,
  - show the active dog clearly,
  - selecting another dog calls the existing `setActiveDogId`.
- Logout should be visually separated near the bottom and should keep the existing auth/sign-out behavior.
- The experience should feel polished and compact without hiding route access or destabilizing completed features.

## Safe Implementation Scope

Recommended Phase 8.5F MVP:

1. Add a new reusable header menu component, for example `src/components/ActiveDogMenu.tsx`.
2. Reuse `DogAvatar`, `useDogs`, `useAuth`, and existing route links.
3. Keep all app routes unchanged.
4. Use local inline SVG icons for menu items, preferably existing local icons where available.
5. Use a button-triggered dropdown on desktop and a full-width or side drawer style panel on small screens if needed for touch safety.
6. Keep DogPicker available during the first implementation if needed as a fallback, then hide or remove it only after manual QA confirms avatar-menu dog switching is stable.
7. Keep logout behavior identical to the current `AppShell` logout handler.
8. Do not change dog persistence, database writes, schema, auth, or route definitions.

Avoid a full navigation rewrite in the first 8.5F pass. The safer approach is to introduce the avatar menu as a header control, verify switching and navigation, then optionally reduce the old nav footprint.

## DogPicker Coexistence / Replacement Recommendation

Recommended: staged replacement.

- Phase 8.5F implementation should initially coexist with the current navigation model.
- If the avatar menu includes dog switching and passes manual QA, the visible `DogPicker` can be replaced by the avatar menu in the header.
- Keep the main navigation list visible during the first pass unless the avatar menu route links are clearly accessible and mobile-safe.
- Do not remove `DogPicker` as a component; keep it available for fallback or future settings/profile screens.
- If dog switching inside the avatar menu feels risky on mobile, ship the avatar menu with navigation first and keep `DogPicker` visible until a follow-up.

## Desktop Behavior

- Header remains transparent and consistent with Phase 8.5A.
- DogCareAI logo remains centered and links to `/`.
- Active dog avatar appears in the header control area.
- Clicking the avatar opens a dropdown aligned to the right side of the header.
- Dropdown sections:
  - active dog summary,
  - dog switcher list,
  - navigation actions with icons,
  - visually separated logout action near the bottom.
- Close menu when:
  - a navigation action is selected,
  - a dog is selected,
  - logout is clicked,
  - Escape is pressed,
  - clicking outside the menu.
- Keep keyboard focus behavior predictable.

## Mobile Behavior

- Avoid horizontal overflow.
- Avatar button should remain at least 44px touch target.
- Menu should not be cramped; use a dropdown sheet or drawer-like panel if necessary.
- Route links and dog rows should be large enough for touch.
- Logout remains separated and easy to identify.
- Ensure the menu can be dismissed with a close button, outside tap/click, and Escape.
- Main navigation should remain reachable until the avatar menu is proven sufficient on mobile.

## Accessibility Requirements

- Avatar trigger is a real `button`, not a clickable `div`.
- Trigger has `aria-haspopup="menu"` or an equivalent dialog/disclosure pattern.
- Trigger exposes open/closed state with `aria-expanded`.
- Menu has an accessible label such as `Active dog menu`.
- Dog avatar image has meaningful `aria-label` through `DogAvatar`.
- Navigation items are keyboard reachable and use regular links where possible.
- Dog switch rows are keyboard reachable buttons.
- Current active dog state is conveyed by text and/or `aria-current`, not color alone.
- Escape closes the menu.
- Focus should return to the avatar trigger after closing.
- Do not rely only on color for logout, active dog, or active route state.

## Risks

- Replacing `DogPicker` too quickly could make active-dog switching harder to test or recover.
- Moving all navigation into a new menu could hide important routes or regress mobile access.
- Mixing navigation links, dog switching, and logout in one component can become too dense if not staged.
- Outside-click and Escape behavior can introduce subtle focus bugs.
- A menu that closes on route navigation must not interrupt existing auth, dog, or route state.
- Dog lists with many profiles may need scrolling within the menu.

## Out Of Scope

- No auth behavior changes.
- No route changes or route removals.
- No dog profile persistence changes.
- No schema, migrations, RLS, storage, env, backend, service-role, or dependency changes.
- No Google/user profile avatar.
- No real dog photo upload.
- No Supabase Storage.
- No floating assistant.
- No Telegram settings relocation.
- No Reminders, Nearby, Recommendations, Assistant, scheduler, Telegram, dog insights, or product logic changes.
- No paid services, external avatar/image APIs, or AI-generated images.

## QA Checklist

- Header logo still links to Dashboard `/`.
- Avatar trigger renders for:
  - active recognized-breed dog,
  - active unknown-breed dog,
  - no dog profiles yet,
  - loading/error dog context states.
- Clicking avatar opens and closes the menu.
- Escape closes the menu.
- Clicking outside closes the menu.
- Keyboard tab order is usable.
- Navigation links still open Dashboard, Dog Profile, Reminders, Nearby, Recommendations, and Assistant.
- Selecting a dog switches the active dog using existing persistence.
- Active dog remains selected after refresh.
- Logout still signs out and redirects to `/auth`.
- Existing AppShell navigation remains available until replacement is manually approved.
- Desktop layout has no overlap between logo, avatar/menu, and account controls.
- Mobile layout has no horizontal overflow and touch targets are comfortable.
- Dashboard, Dog Profile, Reminders, Nearby, Recommendations, Assistant, Google Login, Telegram, scheduler, and product recommendations still work.

## Risks / TODOs

- Decide during implementation whether the avatar menu should fully replace visible `DogPicker` in the header or ship alongside it for one QA pass.
- Confirm whether menu navigation should replace the left-column nav in the same sub-phase or remain as a lower-risk coexistence step.
- Add only local icon components if current route icons are insufficient.
- Consider dog-list scrolling if a user has many active dog profiles.
- Consider a future Settings destination before moving Telegram setup or account preferences.

## Go / No-Go Recommendation

Go, with staged scope.

Phase 8.5F is safe if it introduces an active-dog avatar menu as an AppShell polish layer while reusing `DogAvatar`, `useDogs`, existing route links, and existing logout behavior. The first implementation should avoid a risky full navigation rewrite. Replace the visible `DogPicker` only after dog switching inside the avatar menu is confirmed stable in manual QA, and keep route access obvious on both desktop and mobile.
