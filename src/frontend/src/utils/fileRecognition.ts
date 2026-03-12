export interface FileRecognitionResult {
  detectedFormat: string;
  mimeType: string;
  fileSize: number;
  fileSizeFormatted: string;
  width?: number;
  height?: number;
  isImage: boolean;
  isUnknown: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function detectMagicBytes(
  bytes: Uint8Array,
): { format: string; mimeType: string } | null {
  if (bytes.length < 4) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { format: "JPEG", mimeType: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { format: "PNG", mimeType: "image/png" };
  }

  // GIF: 47 49 46 38
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return { format: "GIF", mimeType: "image/gif" };
  }

  // WEBP: 52 49 46 46 ... 57 45 42 50
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { format: "WEBP", mimeType: "image/webp" };
  }

  // BMP: 42 4D
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return { format: "BMP", mimeType: "image/bmp" };
  }

  // PDF: 25 50 44 46
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return { format: "PDF", mimeType: "application/pdf" };
  }

  // ZIP / DOCX / XLSX / PPTX: 50 4B 03 04
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    // Try to distinguish DOCX/XLSX/PPTX by file extension hint
    return { format: "ZIP", mimeType: "application/zip" };
  }

  // MP4: ftyp at offset 4 (66 74 79 70)
  if (
    bytes.length >= 8 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return { format: "MP4", mimeType: "video/mp4" };
  }

  // MP3: ID3 tag (49 44 33) or sync word FF FB / FF F3 / FF F2
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return { format: "MP3", mimeType: "audio/mpeg" };
  }
  if (
    bytes[0] === 0xff &&
    (bytes[1] === 0xfb || bytes[1] === 0xf3 || bytes[1] === 0xf2)
  ) {
    return { format: "MP3", mimeType: "audio/mpeg" };
  }

  // WAV: 52 49 46 46 ... 57 41 56 45
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
  ) {
    return { format: "WAV", mimeType: "audio/wav" };
  }

  // OGG: 4F 67 67 53
  if (
    bytes[0] === 0x4f &&
    bytes[1] === 0x67 &&
    bytes[2] === 0x67 &&
    bytes[3] === 0x53
  ) {
    return { format: "OGG", mimeType: "audio/ogg" };
  }

  // FLAC: 66 4C 61 43
  if (
    bytes[0] === 0x66 &&
    bytes[1] === 0x4c &&
    bytes[2] === 0x61 &&
    bytes[3] === 0x43
  ) {
    return { format: "FLAC", mimeType: "audio/flac" };
  }

  // AVI: 52 49 46 46 ... 41 56 49 20
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes.length >= 12 &&
    bytes[8] === 0x41 &&
    bytes[9] === 0x56 &&
    bytes[10] === 0x49
  ) {
    return { format: "AVI", mimeType: "video/avi" };
  }

  // MKV: 1A 45 DF A3
  if (
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return { format: "MKV", mimeType: "video/x-matroska" };
  }

  // TIFF: 49 49 2A 00 (little-endian) or 4D 4D 00 2A (big-endian)
  if (
    (bytes[0] === 0x49 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x2a &&
      bytes[3] === 0x00) ||
    (bytes[0] === 0x4d &&
      bytes[1] === 0x4d &&
      bytes[2] === 0x00 &&
      bytes[3] === 0x2a)
  ) {
    return { format: "TIFF", mimeType: "image/tiff" };
  }

  // SVG: starts with <?xml or <svg
  const textStart = new TextDecoder().decode(bytes.slice(0, 64));
  if (
    textStart.includes("<svg") ||
    (textStart.includes("<?xml") && textStart.includes("svg"))
  ) {
    return { format: "SVG", mimeType: "image/svg+xml" };
  }

  // Plain text / JSON / CSV heuristic
  const isPrintable = bytes
    .slice(0, 32)
    .every((b) => (b >= 0x09 && b <= 0x0d) || (b >= 0x20 && b <= 0x7e));
  if (isPrintable) {
    const text = new TextDecoder().decode(bytes.slice(0, 128));
    if (text.trimStart().startsWith("{") || text.trimStart().startsWith("[")) {
      return { format: "JSON", mimeType: "application/json" };
    }
    if (text.includes(",") && text.includes("\n")) {
      return { format: "CSV", mimeType: "text/csv" };
    }
    return { format: "Text", mimeType: "text/plain" };
  }

  return null;
}

function refineZipFormat(file: File): { format: string; mimeType: string } {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const extMap: Record<string, { format: string; mimeType: string }> = {
    docx: {
      format: "DOCX",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    xlsx: {
      format: "XLSX",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    pptx: {
      format: "PPTX",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    },
    zip: { format: "ZIP", mimeType: "application/zip" },
    jar: { format: "JAR", mimeType: "application/java-archive" },
    apk: { format: "APK", mimeType: "application/vnd.android.package-archive" },
  };
  return extMap[ext] ?? { format: "ZIP", mimeType: "application/zip" };
}

function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

const IMAGE_FORMATS = new Set([
  "JPEG",
  "PNG",
  "GIF",
  "WEBP",
  "BMP",
  "TIFF",
  "SVG",
  "ICO",
]);

export async function recognizeFile(
  file: File,
): Promise<FileRecognitionResult> {
  // Read first 16 bytes for magic number detection
  const headerBytes = await file.slice(0, 16).arrayBuffer();
  const bytes = new Uint8Array(headerBytes);

  let detected = detectMagicBytes(bytes);

  // Refine ZIP-based formats using file extension
  if (detected?.format === "ZIP") {
    detected = refineZipFormat(file);
  }

  // Fallback: use browser-reported MIME type and extension
  if (!detected) {
    const ext = file.name.split(".").pop()?.toUpperCase() ?? "";
    const browserMime = file.type || "application/octet-stream";
    if (ext) {
      detected = { format: ext, mimeType: browserMime };
    }
  }

  const isUnknown = !detected;
  const format = detected?.format ?? "Unknown";
  const mimeType =
    detected?.mimeType ?? file.type ?? "application/octet-stream";
  const isImage = IMAGE_FORMATS.has(format) || mimeType.startsWith("image/");

  let width: number | undefined;
  let height: number | undefined;

  if (isImage && format !== "SVG") {
    const dims = await getImageDimensions(file);
    if (dims) {
      width = dims.width;
      height = dims.height;
    }
  }

  return {
    detectedFormat: format,
    mimeType,
    fileSize: file.size,
    fileSizeFormatted: formatFileSize(file.size),
    width,
    height,
    isImage,
    isUnknown,
  };
}
