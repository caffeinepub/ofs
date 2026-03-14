const PREFIX = "ofs://";

export function createQRPayload(fileId: string): string {
  return `${PREFIX}${fileId}`;
}

export function parseQRPayload(data: string): string | null {
  if (data.startsWith(PREFIX)) {
    return data.slice(PREFIX.length);
  }
  // Also accept raw UUIDs/IDs
  if (data.length > 0 && !data.includes(" ")) {
    return data;
  }
  return null;
}
