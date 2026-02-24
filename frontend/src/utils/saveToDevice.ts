/**
 * Save a file to the user's device using File System Access API when available,
 * with fallback to traditional download
 */
export async function saveToDevice(
  blob: Blob,
  fileName: string,
  mimeType: string
): Promise<void> {
  // Try File System Access API first (modern browsers)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'File',
            accept: { [mimeType]: [] },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err: any) {
      // User cancelled the picker
      if (err.name === 'AbortError') {
        throw new Error('Save cancelled');
      }
      // Fall through to traditional download on other errors
      console.log('File System Access API failed, falling back to download:', err.message);
    }
  }

  // Fallback to traditional download
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (err: any) {
    console.error('Download fallback failed:', err);
    throw new Error('Failed to save file to device');
  }
}
