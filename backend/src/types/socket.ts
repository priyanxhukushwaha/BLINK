import type { MessageDto } from '../modules/messages/message.types';
import type { NotificationDto } from '../modules/notifications/notification.types';
import type { RoomMemberUser } from '../modules/rooms/room.types';
import type { AckResponse, AuthUser } from './common';

export interface SocketUser extends AuthUser {
  displayName: string;
  avatarUrl: string;
}

export interface ClientToServerEvents {
  'ws:authenticate': (
    payload: { token: string },
    ack?: (response: AckResponse<{ user: SocketUser }>) => void,
  ) => void;
  'ws:join_room': (payload: { roomId: string }, ack?: (response: AckResponse) => void) => void;
  'ws:leave_room': (payload: { roomId: string }, ack?: (response: AckResponse) => void) => void;
  'ws:send_message': (
    payload: { roomId: string; text?: string; photoUrl?: string },
    ack?: (response: AckResponse<MessageDto>) => void,
  ) => void;
  'ws:mark_read': (
    payload: { roomId: string },
    ack?: (response: AckResponse<{ readCount: number }>) => void,
  ) => void;
  'ws:typing': (payload: { roomId: string }) => void;
}

export interface ServerToClientEvents {
  'ws:authenticated': (payload: { user: SocketUser }) => void;
  'ws:new_message': (message: MessageDto) => void;
  'ws:message_read': (payload: {
    roomId: string;
    messageId: string;
    readBy: string[];
    firstReadAt?: number;
    firstReadBy?: string | null;
  }) => void;
  'ws:message_expired': (payload: { roomId: string; messageId: string }) => void;
  'ws:message_deleted': (payload: { roomId: string; messageId: string }) => void;
  'ws:room_timer_updated': (payload: { roomId: string; timerMinutes: number }) => void;
  'ws:member_joined': (payload: { roomId: string; user: RoomMemberUser }) => void;
  'ws:member_left': (payload: { roomId: string; userId: string }) => void;
  'ws:typing': (payload: { roomId: string; userId: string; username: string }) => void;
  'ws:notification': (payload: { type: string; data: NotificationDto }) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: SocketUser | null;
  authTimer?: NodeJS.Timeout;
}
