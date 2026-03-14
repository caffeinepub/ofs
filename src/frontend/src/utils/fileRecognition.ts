export interface FileRecognitionResult {
  category: string;
  mimeType: string;
  extension: string;
  description?: string;
}

const CATEGORY_MAP: Record<string, { category: string; description: string }> =
  {
    // Images
    "image/jpeg": { category: "Photo", description: "JPEG image" },
    "image/png": { category: "Photo", description: "PNG image" },
    "image/gif": { category: "Photo", description: "Animated GIF" },
    "image/webp": { category: "Photo", description: "WebP image" },
    "image/svg+xml": { category: "Photo", description: "SVG vector image" },
    "image/heic": { category: "Photo", description: "HEIC image (iPhone)" },
    // Videos
    "video/mp4": { category: "Video", description: "MP4 video" },
    "video/quicktime": { category: "Video", description: "QuickTime video" },
    "video/webm": { category: "Video", description: "WebM video" },
    "video/x-matroska": { category: "Video", description: "MKV video" },
    // Audio
    "audio/mpeg": { category: "Music", description: "MP3 audio" },
    "audio/wav": { category: "Music", description: "WAV audio" },
    "audio/flac": { category: "Music", description: "FLAC lossless audio" },
    "audio/ogg": { category: "Music", description: "OGG audio" },
    "audio/mp4": { category: "Music", description: "AAC audio" },
    // Documents
    "application/pdf": { category: "Document", description: "PDF document" },
    "application/msword": {
      category: "Document",
      description: "Word document",
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      category: "Document",
      description: "Word document (.docx)",
    },
    "application/vnd.ms-excel": {
      category: "Document",
      description: "Excel spreadsheet",
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      category: "Document",
      description: "Excel spreadsheet (.xlsx)",
    },
    "application/vnd.ms-powerpoint": {
      category: "Document",
      description: "PowerPoint presentation",
    },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      { category: "Document", description: "PowerPoint (.pptx)" },
    "text/plain": { category: "Document", description: "Plain text file" },
    "text/html": { category: "Document", description: "HTML file" },
    "text/csv": { category: "Document", description: "CSV spreadsheet" },
    // Archives
    "application/zip": { category: "Archive", description: "ZIP archive" },
    "application/x-rar-compressed": {
      category: "Archive",
      description: "RAR archive",
    },
    "application/x-7z-compressed": {
      category: "Archive",
      description: "7-Zip archive",
    },
    "application/x-tar": { category: "Archive", description: "TAR archive" },
    "application/gzip": { category: "Archive", description: "GZip archive" },
    // Apps
    "application/vnd.android.package-archive": {
      category: "App",
      description: "Android APK",
    },
    "application/x-apple-diskimage": {
      category: "App",
      description: "macOS disk image",
    },
    // Code
    "application/javascript": {
      category: "Code",
      description: "JavaScript file",
    },
    "application/json": { category: "Code", description: "JSON data file" },
    "application/xml": { category: "Code", description: "XML file" },
    "text/css": { category: "Code", description: "CSS stylesheet" },
  };

export async function recognizeFile(
  file: File,
): Promise<FileRecognitionResult> {
  const mimeType = file.type || "application/octet-stream";
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  // Look up by MIME type
  const known = CATEGORY_MAP[mimeType];
  if (known) {
    return {
      category: known.category,
      mimeType,
      extension,
      description: known.description,
    };
  }

  // Fallback by extension
  const extMap: Record<string, string> = {
    jpg: "Photo",
    jpeg: "Photo",
    png: "Photo",
    gif: "Photo",
    webp: "Photo",
    heic: "Photo",
    mp4: "Video",
    mov: "Video",
    avi: "Video",
    mkv: "Video",
    mp3: "Music",
    wav: "Music",
    flac: "Music",
    aac: "Music",
    pdf: "Document",
    doc: "Document",
    docx: "Document",
    txt: "Document",
    xls: "Document",
    xlsx: "Document",
    zip: "Archive",
    rar: "Archive",
    "7z": "Archive",
    tar: "Archive",
    apk: "App",
    ipa: "App",
    js: "Code",
    ts: "Code",
    json: "Code",
    html: "Code",
    css: "Code",
  };

  const category = extMap[extension] || "Other";
  return {
    category,
    mimeType,
    extension,
    description: `${extension.toUpperCase()} file`,
  };
}
