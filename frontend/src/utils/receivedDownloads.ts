import type { TransferRecordData } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

/**
 * Detect if a file is an installable package based on extension
 */
export function isInstallablePackage(fileName: string): boolean {
  const installableExtensions = ['.apk', '.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm'];
  const lowerFileName = fileName.toLowerCase();
  return installableExtensions.some(ext => lowerFileName.endsWith(ext));
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: bigint): string {
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(time: bigint): string {
  const date = new Date(Number(time) / 1000000); // Convert nanoseconds to milliseconds
  return date.toLocaleString();
}

/**
 * Filter transfer history for successfully received files by current user
 */
export function filterReceivedTransfers(
  transferHistory: TransferRecordData[],
  currentPrincipal: Principal | null | undefined
): TransferRecordData[] {
  if (!currentPrincipal) return [];
  
  return transferHistory.filter(
    (record) =>
      record.success &&
      record.receiver.toString() === currentPrincipal.toString()
  );
}

/**
 * Filter transfer history for successfully sent files by current user
 */
export function filterSentTransfers(
  transferHistory: TransferRecordData[],
  currentPrincipal: Principal | null | undefined
): TransferRecordData[] {
  if (!currentPrincipal) return [];
  
  return transferHistory.filter(
    (record) =>
      record.success &&
      record.sender.toString() === currentPrincipal.toString()
  );
}
