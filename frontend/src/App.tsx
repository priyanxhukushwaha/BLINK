import React from 'react';
import {
  NavigationProvider,
  useNavigation,
  ResponsiveContainer,
  DevScreenSwitcher,
  PlaceholderScreen,
} from '@/shared';
import {
  SplashScreen,
  OnboardingIntro,
  OnboardingFeatures,
} from '@/features/onboarding';
import { HomeRooms } from '@/features/rooms';
import {
  MyProfile,
  FriendProfileScreen,
} from '@/features/profile';
import {
  ChatProvider,
  PrivateChatRoom,
  GroupChatRoom,
  MessageTimerModal,
} from '@/features/chat';

const AppContent: React.FC = () => {
  const { currentScreen } = useNavigation();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'onboarding-intro':
        return <OnboardingIntro />;
      case 'onboarding-features':
        return <OnboardingFeatures />;
      case 'home-rooms':
        return <HomeRooms />;
      case 'my-profile':
        return <MyProfile />;
      case 'friend-profile':
        return <FriendProfileScreen />;
      case 'settings':
        return <PlaceholderScreen screenNumber={6} title="Settings" />;
      case 'private-chat':
        return <PrivateChatRoom />;
      case 'group-chat':
        return <GroupChatRoom />;
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

  return (
    <ResponsiveContainer>
      {renderScreen()}
      <DevScreenSwitcher />
    </ResponsiveContainer>
  );
};

export const App: React.FC = () => {
  return (
    <NavigationProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </NavigationProvider>
  );
};

export default App;
