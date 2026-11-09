import React from 'react';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { ChatProvider } from './context/ChatContext';
import { ResponsiveContainer } from './components/layout/ResponsiveContainer';
import { SplashScreen } from './screens/01_SplashScreen';
import { OnboardingIntro } from './screens/02_OnboardingIntro';
import { OnboardingFeatures } from './screens/03_OnboardingFeatures';
import { HomeRooms } from './screens/04_HomeRooms';
import { MyProfile } from './screens/05_MyProfile';
import { FriendProfileScreen } from './screens/FriendProfileScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { DevScreenSwitcher } from './components/dev/DevScreenSwitcher';

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
        return <PlaceholderScreen screenNumber={7} title="Private Chat Room (Floating Text)" />;
      case 'group-chat':
        return <PlaceholderScreen screenNumber={8} title="Group Chat Room (Floating Text)" />;
      case 'message-timer':
        return <PlaceholderScreen screenNumber={9} title="Message Timer Modal" />;
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
