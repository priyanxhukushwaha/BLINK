export interface UserProfile {
  id: string;
  username: string; // backend handle, already prefixed with '@'
  displayName: string;
  bio: string;
  avatarUrl: string;
  defaultTimerMinutes?: number; // default expiration timer preference (1, 5, 15, 30, 60)
  inviteLink?: string; // e.g. 'blink.app/invite/pkdev'
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

