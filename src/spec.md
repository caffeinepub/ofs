# Specification

## Summary
**Goal:** Enable offline-first guest usage (no mandatory login) and support fully offline file sharing via export/import share packages with save-to-device receiving.

**Planned changes:**
- Open the app directly into an “Offline (no login)” usable mode when there is no Internet Identity session (do not show the LoginScreen by default).
- Gate backend-authenticated React Query hooks so they do not run for anonymous/guest users, avoiding unauthorized canister calls and retries; keep existing online features working when authenticated.
- Add an “Offline Share Package” workflow to export a self-contained share file (e.g., a single .html) embedding selected file bytes plus minimal metadata, requiring no network or authentication.
- Implement receiver-side import/open of the offline share package to preview embedded file details and allow saving the embedded file to device storage.
- Add “Save to device” for offline-received/imported files using File System Access API (showSaveFilePicker) when available, with a standard browser download fallback (correct filename and MIME type).
- Make the app reopenable offline after first online load by caching the app shell/static assets (PWA-style) and show a clear English message when users attempt online-only features while offline.

**User-visible outcome:** Users can use the app in a guest offline mode without logging in, export files as offline share packages to share without connectivity, open those packages offline on another device, and save the embedded files to local storage; after first load online, the app UI can reopen while offline.
