# Specification

## Summary
**Goal:** Persist the display name when saving on the Profile page and show it on the Transfer screen.

**Planned changes:**
- On ProfilePage, wire the "Save Changes" button to call an update-profile backend mutation that persists the display name.
- After a successful save, update the React Query user-profile cache so the new name is immediately available app-wide.
- Show a success toast or inline message after the name is saved.
- On the Transfer screen, read the current user's display name from the cached profile query and render it visibly (e.g., "Sending as: [Name]"), with a fallback to "Anonymous" or a truncated principal if no name is set.

**User-visible outcome:** Users can save a display name on the Profile page and immediately see it reflected on the Transfer screen without reloading the app.
