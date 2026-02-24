import { ExternalBlob } from '../backend';
import { saveToDevice } from './saveToDevice';

/**
 * Download a transferred file by reading bytes from ExternalBlob and saving to device
 */
export async function downloadTransferFile(
  blob: ExternalBlob,
  fileName: string,
  fileType: string
): Promise<void> {
  try {
    // Get the file bytes from the ExternalBlob
    const fileBytes = await blob.getBytes();
    
    // Create a Blob from the bytes
    const fileBlob = new Blob([fileBytes], { type: fileType || 'application/octet-stream' });
    
    // Save to device
    await saveToDevice(fileBlob, fileName, fileType || 'application/octet-stream');
  } catch (error: any) {
    // Re-throw with context
    if (error.message === 'Save cancelled') {
      throw error;
    }
    throw new Error(`Failed to download ${fileName}: ${error.message}`);
  }
}
