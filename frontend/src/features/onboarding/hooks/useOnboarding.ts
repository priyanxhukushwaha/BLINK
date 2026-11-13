import { useState, useCallback } from 'react';
import { onboardingService } from '../services/onboarding.service';

export function useOnboarding() {
  const [isCompleted, setIsCompleted] = useState<boolean>(() => onboardingService.isCompleted());

  const complete = useCallback(() => {
    onboardingService.markCompleted();
    setIsCompleted(true);
  }, []);

  const reset = useCallback(() => {
    onboardingService.reset();
    setIsCompleted(false);
  }, []);

  return {
    isCompleted,
    complete,
    reset,
  };
}

export default useOnboarding;

