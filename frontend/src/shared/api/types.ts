/** DTOs returned by the BLINK backend (see backend/src/modules/*). */

export interface AuthUserDto {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  defaultTimerMinutes?: number;
  inviteLink?: string;
}

export interface AuthSessionDto {
  user: AuthUserDto;
  accessToken: string;
  refreshToken: string;
}

export interface MessageDto {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  photoUrl?: string;
  sentAt: number;
  firstReadAt: number | null;
  firstReadBy: string | null;
  readBy: string[];
  timerDurationMs: number;
  expiresAt: number;
  status: 'delivered' | 'read';
}

export interface MessagePageDto {
  messages: MessageDto[];
  hasMore: boolean;
}

export type RoomTypeDto = 'private' | 'group';

export interface RoomDto {
  id: string;
  name: string;
  type: RoomTypeDto;
  avatarUrl: string;
  memberCount: number;
  members: string[];
  adminId?: string;
  adminName?: string;
  lastMessageText: string;
  timerMinutes: number;
  recipientId?: string;
  unreadCount: number;
}

export interface RoomMemberDto {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: number;
}

export interface RoomDetailDto {
  room: RoomDto;
  members: RoomMemberDto[];
}

export interface FriendDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  lastInteractionText: string;
  unreadCount: number;
}

export interface PhotoUploadDto {
  photoUrl: string;
  expiresAt: number;
}

export interface ReadReceiptPayload {
  roomId: string;
  messageId: string;
  readBy: string[];
  firstReadAt?: number;
  firstReadBy?: string | null;
}
