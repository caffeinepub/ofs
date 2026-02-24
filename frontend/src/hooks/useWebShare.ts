import { useCallback } from 'react';

interface ShareFileOptions {
  name: string;
  type: string;
  size: bigint;
  blob: Uint8Array;
}

interface WebShare {
  isShareSupported: boolean;
  shareFile: (options: ShareFileOptions) => Promise<void>;
}

export function useWebShare(): WebShare {
  const isShareSupported = typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator;

  const shareFile = useCallback(async (options: ShareFileOptions) => {
    if (!isShareSupported) {
      throw new Error('Web Share API is not supported');
    }

    try {
      // Convert Uint8Array to regular array for File constructor
      const blobArray = Array.from(options.blob);
      const file = new File([new Uint8Array(blobArray)], options.name, { type: options.type });
      
      const shareData = {
        files: [file],
        title: options.name,
        text: `Sharing ${options.name}`,
      };

      if (navigator.canShare && !navigator.canShare(shareData)) {
        throw new Error('Cannot share this file type');
      }

      await navigator.share(shareData);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled the share
        return;
      }
      throw error;
    }
  }, [isShareSupported]);

  return {
    isShareSupported,
    shareFile,
  };
}
