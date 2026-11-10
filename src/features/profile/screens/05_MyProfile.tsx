import React from 'react';
import { ProfileView } from '../components/ProfileView';
import { useNavigation } from '../../../shared/context/NavigationContext';
import { useChat } from '../../chat/context/ChatContext';

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

