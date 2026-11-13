import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from './client';
import type { MessageDto, ReadReceiptPayload, RoomMemberDto } from './types';

export interface SocketUserDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

export interface ServerToClientEvents {
  'ws:authenticated': (payload: { user: SocketUserDto }) => void;
  'ws:new_message': (message: MessageDto) => void;
  'ws:message_read': (payload: ReadReceiptPayload) => void;
  'ws:message_expired': (payload: { roomId: string; messageId: string }) => void;
  'ws:message_deleted': (payload: { roomId: string; messageId: string }) => void;
  'ws:room_timer_updated': (payload: { roomId: string; timerMinutes: number }) => void;
  'ws:member_joined': (payload: { roomId: string; user: RoomMemberDto }) => void;
  'ws:member_left': (payload: { roomId: string; userId: string }) => void;
  'ws:typing': (payload: { roomId: string; userId: string; username: string }) => void;
  'ws:notification': (payload: { type: string; data: unknown }) => void;
}

export interface ClientToServerEvents {
  'ws:join_room': (payload: { roomId: string }) => void;
  'ws:leave_room': (payload: { roomId: string }) => void;
  'ws:typing': (payload: { roomId: string }) => void;
}

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createChatSocket(token: string): ChatSocket {
  return io(API_BASE_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
}
