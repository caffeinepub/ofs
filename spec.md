# Specification

## Summary
**Goal:** Replace the modal-based QR scanner flow with a dedicated full-screen `/receive` page so that receivers navigate to a new route instead of seeing a modal overlay.

**Planned changes:**
- Add a new `/receive` route that renders a full-screen page with the camera viewfinder and QR scanning logic (reusing existing QRScannerModal logic).
- After a successful scan, display the file details and download UI inline on the same `/receive` page (reusing QRReceiveDialog logic) instead of opening a separate modal.
- Include a back/close button on the `/receive` page that navigates the user back to the previous screen.
- Update the scan/receive QR button in TransferHistory (and any other trigger locations) to navigate to `/receive` instead of opening QRScannerModal as a modal dialog.

**User-visible outcome:** When a receiver taps the scan button, they are taken to a dedicated full-screen camera scanner page. After scanning a QR code, the file download UI appears on that same screen. The existing sender QR code generation flow is unchanged.
