import { useState, useEffect } from 'react';

interface NetworkConnection extends EventTarget {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  saveData: boolean;
  downlink: number;
  rtt: number;
}

interface NetworkInfo {
  connectionType: string;
  isSlow: boolean;
  isMetered: boolean;
  saveData: boolean;
  isSupported: boolean;
}

declare global {
  interface Navigator {
    connection?: NetworkConnection;
    mozConnection?: NetworkConnection;
    webkitConnection?: NetworkConnection;
  }
}

export function useNetworkInfo(): NetworkInfo {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    connectionType: '4g',
    isSlow: false,
    isMetered: false,
    saveData: false,
    isSupported: false,
  });

  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (!connection) {
      return;
    }

    const updateNetworkInfo = () => {
      const effectiveType = connection.effectiveType || '4g';
      const isSlow = effectiveType === '2g' || effectiveType === 'slow-2g';
      const saveData = connection.saveData || false;

      setNetworkInfo({
        connectionType: effectiveType,
        isSlow,
        isMetered: saveData,
        saveData,
        isSupported: true,
      });
    };

    updateNetworkInfo();

    connection.addEventListener('change', updateNetworkInfo);

    return () => {
      connection.removeEventListener('change', updateNetworkInfo);
    };
  }, []);

  return networkInfo;
}
