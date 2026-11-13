import React, { useEffect, useState } from 'react';
import { ProfileView } from '@/features/profile';
import { useNavigation } from '@/shared';
import { useChat } from '@/features/chat';
import { Friend, UserProfile } from '@/features/profile/types/user';

export const FriendProfileScreen: React.FC = () => {
  const { goBack, navigateTo, selectedFriendId } = useNavigation();
  const { getFriendById, getProfile, ensurePrivateRoom } = useChat();
  const [profile, setProfile] = useState<UserProfile | Friend | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!selectedFriendId) {
      setProfile(null);
      return () => {
        cancelled = true;
      };
    }

    const friend = getFriendById(selectedFriendId);
    if (friend) {
      setProfile(friend);
      return () => {
        cancelled = true;
      };
    }

    void getProfile(selectedFriendId).then((result) => {
      if (!cancelled) setProfile(result);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedFriendId, getFriendById, getProfile]);

  const handleStartChat = async () => {
    if (!profile) return;
    const roomId = await ensurePrivateRoom(profile.id);
    if (roomId) {
      navigateTo('private-chat', { friendId: profile.id, roomId });
    }
  };

  if (!profile) {
    return (
      <div className="relative flex-1 flex flex-col items-center justify-center p-6 text-center">
        <button
          type="button"
          onClick={goBack}
          className="absolute top-6 left-5 text-xs text-purple-300/70 hover:text-white"
        >
          Back
        </button>
        <p className="text-sm text-purple-200/70">Loading profile…</p>
      </div>
    );
  }

  return (
    <ProfileView
      user={profile}
      isCurrentUser={false}
      onBack={goBack}
      onStartChat={() => {
        void handleStartChat();
      }}
    />
  );
};
