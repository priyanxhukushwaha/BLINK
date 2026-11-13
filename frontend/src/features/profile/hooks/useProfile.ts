import { useChat } from '@/features/chat';
import type { UserProfile } from '../types/user';

export function useProfile() {
  const {
    currentUser,
    profileCache,
    getProfile,
    setDefaultTimer,
    logout,
  } = useChat();

  return {
    currentUser,
    profileCache,
    getProfile: (userId: string): Promise<UserProfile | null> => getProfile(userId),
    setDefaultTimer,
    logout,
  };
}

export default useProfile;

