import React from 'react';
import type { ScreenId } from '@/shared/types/navigation';
import { PlaceholderScreen } from '@/shared/screens/PlaceholderScreen';
import {
  SplashScreen,
  OnboardingIntroScreen,
  OnboardingFeaturesScreen,
} from '@/features/onboarding';
import { HomeScreen } from '@/features/rooms';
import { MyProfileScreen, FriendProfileScreen } from '@/features/profile';
import {
  PrivateChatScreen,
  GroupChatScreen,
  MessageTimerModal,
} from '@/features/chat';
import { AuthScreen, AuthLoadingScreen } from '@/features/auth';

export const PUBLIC_INTRO_SCREENS: ScreenId[] = [
  'splash',
  'onboarding-intro',
  'onboarding-features',
];

interface AppRoutesProps {
  currentScreen: ScreenId;
  authStatus: 'loading' | 'authenticated' | 'unauthenticated';
}

export const AppRoutes: React.FC<AppRoutesProps> = ({ currentScreen, authStatus }) => {
  if (authStatus === 'loading') {
    return <AuthLoadingScreen />;
  }

  if (authStatus === 'unauthenticated' && !PUBLIC_INTRO_SCREENS.includes(currentScreen)) {
    return <AuthScreen />;
  }

  switch (currentScreen) {
    case 'splash':
      return <SplashScreen />;
    case 'onboarding-intro':
      return <OnboardingIntroScreen />;
    case 'onboarding-features':
      return <OnboardingFeaturesScreen />;
    case 'home-rooms':
      return <HomeScreen />;
    case 'my-profile':
      return <MyProfileScreen />;
    case 'friend-profile':
      return <FriendProfileScreen />;
    case 'settings':
      return <PlaceholderScreen screenNumber={6} title="Settings" />;
    case 'private-chat':
      return <PrivateChatScreen />;
    case 'group-chat':
      return <GroupChatScreen />;
    case 'message-timer':
      return <MessageTimerModal />;
    case 'invite-friends':
      return <PlaceholderScreen screenNumber={10} title="Invite Friends" />;
    case 'private-notifications':
      return <PlaceholderScreen screenNumber={11} title="Private Notifications" />;
    case 'message-disappearing':
      return <PlaceholderScreen screenNumber={12} title="Message Disappearing Animation" />;
    default:
      return <SplashScreen />;
  }
};

export default AppRoutes;

