import { useState, useEffect } from 'react';

const STORAGE_KEY = 'onboardingCompleted';

interface Onboarding {
  showOnboarding: boolean;
  completeOnboarding: () => void;
}

export function useOnboarding(): Onboarding {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    setShowOnboarding(completed !== 'true');
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    completeOnboarding,
  };
}
