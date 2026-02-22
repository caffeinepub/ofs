# Specification

## Summary
**Goal:** Optimize the Offline File Sharing application for mobile devices with PWA enhancements, native mobile features, and improved mobile UX.

**Planned changes:**
- Add iOS-specific PWA meta tags and viewport configuration for proper safe area support
- Enhance service worker with cache versioning, runtime caching strategies, and background sync
- Implement haptic feedback for major user interactions using Vibration API
- Add orientation lock utility with settings toggle for portrait mode
- Implement proper mobile keyboard handling with auto-scroll and appropriate input modes
- Add mobile-specific performance optimizations including lazy loading and virtualized lists
- Implement native mobile share functionality using Web Share API
- Add PWA install prompt with custom banner in mobile menu
- Implement network-aware behavior with warnings for large uploads on slow/metered connections
- Add bottom safe area padding to navigation bar for devices with gesture indicators
- Implement mobile-optimized onboarding flow with swipeable tutorial cards
- Add visual feedback for network requests with loading indicator in header
- Implement file size limits with validation and user-friendly error messages
- Add mobile-optimized empty states for each dashboard tab with illustrations
- Implement optimistic UI updates for file transfers with pending status indicators

**User-visible outcome:** Users can install the app as a PWA on mobile devices, receive haptic feedback during interactions, share files using native share functionality, and experience a polished mobile interface with proper safe area handling, network-aware warnings, onboarding tutorial, and optimized performance.
