import { useCallback } from 'react';

interface HapticFeedback {
  triggerLight: () => void;
  triggerMedium: () => void;
  triggerSuccess: () => void;
  isSupported: boolean;
}

export function useHapticFeedback(): HapticFeedback {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const triggerLight = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(10);
    }
  }, [isSupported]);

  const triggerMedium = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(20);
    }
  }, [isSupported]);

  const triggerSuccess = useCallback(() => {
    if (isSupported) {
      navigator.vibrate([15, 100, 15]);
    }
  }, [isSupported]);

  return {
    triggerLight,
    triggerMedium,
    triggerSuccess,
    isSupported,
  };
}
