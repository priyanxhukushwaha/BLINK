export type TimerOptionMinutes = 1 | 5 | 15 | 30 | 60;

export interface RoomMemberProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  /** Displayable URL (blob URL for authenticated photos). */
  photoUrl?: string;
  /** Server path used to fetch the authenticated photo. */
  photoPath?: string;
  sentAt: number;             // Epoch timestamp when sent
  firstReadAt: number | null; // Epoch timestamp when first seen by any recipient (starts timer)
  firstReadBy?: string | null; // User ID of the first member who read the message
  readBy?: string[];           // User IDs who have read the message
  timerDurationMs: number;    // Selected expiration duration (e.g. 30 * 60 * 1000)
  expiresAt: number;          // Server-authoritative expiration timestamp
  isOutgoing: boolean;
  status: 'sent' | 'delivered' | 'read' | 'expiring' | 'expired';
}

export interface ConversationRoom {
  id: string;
  name: string;
  type: 'private' | 'group';
  avatarUrl: string;
  memberCount?: number;
  members?: string[]; // User IDs
  memberProfiles?: RoomMemberProfile[];
  adminId?: string;   // Group Admin ID
  adminName?: string; // Group Admin Name
  lastMessageText: string;
  timerMinutes: TimerOptionMinutes;
  recipientId?: string; // for private chats
  unreadCount?: number;
}
