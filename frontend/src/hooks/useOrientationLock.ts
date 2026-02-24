import { useState, useEffect, useCallback } from 'react';

interface OrientationLock {
  isLocked: boolean;
  isSupported: boolean;
  enableLock: () => Promise<void>;
  disableLock: () => Promise<void>;
  toggleLock: () => Promise<void>;
}

const STORAGE_KEY = 'orientationLockEnabled';

export function useOrientationLock(): OrientationLock {
  const [isLocked, setIsLocked] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if Screen Orientation API is supported
    const supported = typeof screen !== 'undefined' && 'orientation' in screen && screen.orientation && 'lock' in screen.orientation;
    setIsSupported(supported);

    // Load preference from localStorage
    if (supported) {
      const savedPreference = localStorage.getItem(STORAGE_KEY);
      if (savedPreference === 'true') {
        enableLock();
      }
    }
  }, []);

  const enableLock = useCallback(async () => {
    if (!isSupported) return;

    try {
      // Type assertion for screen.orientation.lock
      const orientation = screen.orientation as any;
      if (orientation && typeof orientation.lock === 'function') {
        await orientation.lock('portrait');
        setIsLocked(true);
        localStorage.setItem(STORAGE_KEY, 'true');
      }
    } catch (error) {
      console.warn('Failed to lock orientation:', error);
    }
  }, [isSupported]);

  const disableLock = useCallback(async () => {
    if (!isSupported) return;

    try {
      const orientation = screen.orientation as any;
      if (orientation && typeof orientation.unlock === 'function') {
        orientation.unlock();
        setIsLocked(false);
        localStorage.setItem(STORAGE_KEY, 'false');
      }
    } catch (error) {
      console.warn('Failed to unlock orientation:', error);
    }
  }, [isSupported]);

  const toggleLock = useCallback(async () => {
    if (isLocked) {
      await disableLock();
    } else {
      await enableLock();
    }
  }, [isLocked, enableLock, disableLock]);

  return {
    isLocked,
    isSupported,
    enableLock,
    disableLock,
    toggleLock,
  };
}
