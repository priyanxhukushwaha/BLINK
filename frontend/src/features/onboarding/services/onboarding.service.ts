const ONBOARDING_COMPLETED_KEY = 'blink.onboarding_completed';

export const onboardingService = {
  isCompleted: (): boolean => {
    try {
      return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
    } catch {
      return false;
    }
  },
  markCompleted: (): void => {
    try {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } catch {
      // ignore
    }
  },
  reset: (): void => {
    try {
      localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    } catch {
      // ignore
    }
  },
};

export default onboardingService;

