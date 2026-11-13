export type TimerOptionMinutes = 1 | 5 | 15 | 30 | 60;

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  photoUrl?: string;
  sentAt: number;             // Epoch timestamp when sent
  firstReadAt: number | null; // Epoch timestamp when first seen by any recipient (starts timer)
  firstReadBy?: string | null; // User ID / Name of the first member who read the message
  readBy?: string[];           // List of user IDs / Names who have read the message
  timerDurationMs: number;    // Selected expiration duration (e.g. 30 * 60 * 1000)
  isOutgoing: boolean;
  status: 'sent' | 'delivered' | 'read' | 'expiring' | 'expired';
}

export interface ConversationRoom {
  id: string;
  name: string;
  type: 'private' | 'group';
  avatarUrl: string;
  memberCount?: number;
  members?: string[]; // IDs or names
  adminId?: string;   // Group Admin ID
  adminName?: string; // Group Admin Name
  lastMessageText: string;
  timerMinutes: TimerOptionMinutes;
  recipientId?: string; // for private chats
  unreadCount?: number;
}
