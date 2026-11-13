import React, { createContext, useContext } from 'react';
import { useProfile } from '../hooks/useProfile';
import type { UserProfile } from '../types/user';

export interface ProfileContextType {
  currentUser: UserProfile;
  profileCache: Record<string, UserProfile>;
  getProfile: (userId: string) => Promise<UserProfile | null>;
  setDefaultTimer: (minutes: 1 | 5 | 15 | 30 | 60) => Promise<void> | void;
  logout: () => Promise<void>;
}

export const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const profileState = useProfile();

  return (
    <ProfileContext.Provider value={profileState}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfileContext = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
};

