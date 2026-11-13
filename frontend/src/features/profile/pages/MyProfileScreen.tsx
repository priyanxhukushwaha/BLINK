import React from 'react';
import { ProfileView } from '@/features/profile';
import { useNavigation } from '@/shared';
import { useProfile } from '../hooks/useProfile';

export const MyProfileScreen: React.FC = () => {
  const { goBack, navigateTo } = useNavigation();
  const { currentUser, logout } = useProfile();

  return (
    <ProfileView
      user={currentUser}
      isCurrentUser={true}
      onBack={goBack}
      onOpenSettings={() => navigateTo('settings')}
      onOpenInvite={() => navigateTo('invite-friends')}
      onOpenTimer={() => navigateTo('message-timer')}
      onLogout={() => {
        void logout();
      }}
    />
  );
};

export { MyProfileScreen as MyProfile };
export default MyProfileScreen;
