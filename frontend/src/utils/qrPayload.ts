/**
 * Encodes a session ID as a deep-link URL for QR code generation
 */
export function encodeQRPayload(sessionId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/?session=${encodeURIComponent(sessionId)}`;
}

/**
 * Parses a QR code payload (either raw session ID or deep-link URL)
 * Returns the session ID or null if invalid
 */
export function parseQRPayload(payload: string): string | null {
  if (!payload) return null;

  // Trim whitespace for robust paste-based workflow
  const trimmed = payload.trim();

  // Try to parse as URL first
  try {
    const url = new URL(trimmed);
    const sessionId = url.searchParams.get('session');
    if (sessionId) {
      return sessionId;
    }
  } catch {
    // Not a valid URL, treat as raw session ID
  }

  // Return as raw session ID if it looks valid
  if (trimmed.length > 0) {
    return trimmed;
  }

  return null;
}
