import React from 'react';
import { NavigationProvider } from '@/shared/state/NavigationContext';
import { AuthProvider } from '@/features/auth';
import { ChatProvider } from '@/features/chat';
import { RoomsProvider } from '@/features/rooms';
import { ProfileProvider } from '@/features/profile';
import { OnboardingProvider } from '@/features/onboarding';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <NavigationProvider>
      <AuthProvider>
        <ChatProvider>
          <RoomsProvider>
            <ProfileProvider>
              <OnboardingProvider>
                {children}
              </OnboardingProvider>
            </ProfileProvider>
          </RoomsProvider>
        </ChatProvider>
      </AuthProvider>
    </NavigationProvider>
  );
};

export default AppProviders;
