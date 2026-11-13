import React from 'react';
import { ProfileView } from '@/features/profile';
import { useNavigation } from '@/shared';
import { useChat } from '@/features/chat';

export const FriendProfileScreen: React.FC = () => {
  const { goBack, navigateTo, selectedFriendId } = useNavigation();
  const { getFriendById, friends } = useChat();

  const friend = getFriendById(selectedFriendId || '') || friends[0];

  return (
    <ProfileView
      user={friend}
      isCurrentUser={false}
      onBack={goBack}
      onStartChat={() =>
        navigateTo('private-chat', {
          friendId: friend.id,
          roomId: `room-${friend.displayName.toLowerCase()}`,
        })
      }
    />
  );
};

