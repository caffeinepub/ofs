import { useRef, useCallback } from 'react';

interface UseLongPressOptions<T> {
  onLongPress: (data: T) => void;
  delay?: number;
}

export function useLongPress<T>({ onLongPress, delay = 500 }: UseLongPressOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<T | null>(null);

  const start = useCallback(
    (data: T) => (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      dataRef.current = data;
      timeoutRef.current = setTimeout(() => {
        if (dataRef.current) {
          onLongPress(dataRef.current);
        }
      }, delay);
    },
    [onLongPress, delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    dataRef.current = null;
  }, []);

  return useCallback(
    (data: T) => ({
      onTouchStart: start(data),
      onTouchEnd: cancel,
      onTouchMove: cancel,
      onMouseDown: start(data),
      onMouseUp: cancel,
      onMouseLeave: cancel,
    }),
    [start, cancel]
  );
}
