import React from 'react';
import { ProfileView } from '../components/common/ProfileView';
import { useNavigation } from '../context/NavigationContext';
import { useChat } from '../context/ChatContext';

export const MyProfile: React.FC = () => {
  const { goBack, navigateTo } = useNavigation();
  const { currentUser } = useChat();

  return (
    <ProfileView
      user={currentUser}
      isCurrentUser={true}
      onBack={goBack}
      onOpenSettings={() => navigateTo('settings')}
      onOpenInvite={() => navigateTo('invite-friends')}
      onOpenTimer={() => navigateTo('message-timer')}
      onLogout={() => navigateTo('onboarding-intro')}
    />
  );
};

