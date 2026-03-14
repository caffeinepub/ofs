# OFS – File Sharing App

## Current State
Fresh workspace — rebuilding from scratch based on Version 57 reference state.

## Requested Changes (Diff)

### Add
- Full mobile-first file sharing app (OFS – OFFLINE FILE SHARING)
- Transfer tab: file picker, online users dropdown, "Share via Scanner" button (only after file selected)
- History tab: Sent and Received sections with delete buttons (red confirmation screen on delete)
- Users tab: list of online users only (no description)
- AI tab: image compression with file recognition; after compression auto-navigate to Transfer tab
- Profile fullscreen overlay: only display name field + Save Changes button (no avatar, no principal ID)
- Menu fullscreen overlay: navigation links
- Header: app name, menu button, dark/light mode toggle (Sun/Moon icon)
- QR code sharing: sender generates QR, receiver scans on dedicated full-screen scanner page
- "SENDING AS [name]" shown on transfer screen
- No login/authentication screens — app opens directly to main UI
- Large mobile-style fonts throughout
- No footer watermark
- Proper dark mode and light mode with correct color fallbacks (hex fallbacks for Android browsers that don't support oklch)
- Compression button background does not change after sharing

### Modify
- N/A (new build)

### Remove
- N/A (new build)

## Implementation Plan
1. Generate Motoko backend: session management, file metadata storage, online users tracking, QR session management
2. Select components: blob-storage, qr-code
3. Build frontend: mobile-only layout, all tabs, profile/menu overlays, QR flow, AI compression, dark/light mode
