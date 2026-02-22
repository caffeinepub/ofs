import { useEffect, RefObject } from 'react';

interface KeyboardHandlerOptions {
  inputRefs?: Array<RefObject<HTMLInputElement | HTMLTextAreaElement | null>>;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function useKeyboardHandler(options: KeyboardHandlerOptions = {}) {
  const { inputRefs = [], onFocus, onBlur } = options;

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Scroll input into view with some padding
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
        onFocus?.();
      }
    };

    const handleBlur = () => {
      onBlur?.();
    };

    const handleTouchOutside = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        // Blur active element if tapping outside
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    document.addEventListener('touchstart', handleTouchOutside);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [onFocus, onBlur]);

  return {
    scrollIntoView: (ref: RefObject<HTMLElement>) => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
  };
}
