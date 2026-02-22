export interface FileSizeValidation {
  type: 'ok' | 'warning' | 'error';
  message: string;
}

const MB = 1024 * 1024;
const WARNING_THRESHOLD = 10 * MB; // 10MB
const ERROR_THRESHOLD = 50 * MB; // 50MB

export function validateFileSize(size: number): FileSizeValidation {
  if (size > ERROR_THRESHOLD) {
    return {
      type: 'error',
      message: `File size exceeds 50MB limit. Please compress or split the file before uploading.`,
    };
  }

  if (size > WARNING_THRESHOLD) {
    return {
      type: 'warning',
      message: `Large file detected (${formatFileSize(size)}). Upload may take longer on slow connections.`,
    };
  }

  return {
    type: 'ok',
    message: '',
  };
}

export function formatFileSize(bytes: number | bigint): string {
  const size = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  
  if (size === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  
  return `${(size / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
