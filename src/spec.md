# Specification

## Summary
**Goal:** Display the user's display name on the Transfer dashboard immediately after they save their profile, without requiring a page refresh.

**Planned changes:**
- Ensure the useUpdateProfile mutation invalidates the profile query cache after successful profile updates
- Verify the FileTransfer component automatically receives updated profile data via the useProfile hook
- Confirm the display name appears on the Transfer dashboard immediately after profile save

**User-visible outcome:** When a new user saves their display name on the Profile page, they will see their name appear on the Transfer dashboard instantly without needing to refresh or navigate away.
