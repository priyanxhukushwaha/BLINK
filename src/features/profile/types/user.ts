export interface UserProfile {
  id: string;
  username: string; // e.g. '@pkdev' or '@aryan'
  displayName: string; // e.g. 'Priyanx Kushwaha' or 'Aryan'
  bio: string;
  avatarUrl: string;
  defaultTimerMinutes?: number; // default expiration timer preference (1, 5, 15, 30, 60)
  inviteLink?: string; // e.g. 'ephemeral.app/invite/pkdev'
}

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  lastInteractionText?: string;
  unreadCount?: number;
}

