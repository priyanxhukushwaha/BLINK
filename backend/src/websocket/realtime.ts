import type { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../types/socket';

export type BlinkServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type ServerEventName = keyof ServerToClientEvents;

let io: BlinkServer | null = null;

export function attachRealtime(server: BlinkServer): void {
  io = server;
}

export function detachRealtime(): void {
  io = null;
}

export function roomChannel(roomId: string): string {
  return `room:${roomId}`;
}

export function userChannel(userId: string): string {
  return `user:${userId}`;
}

function emit(target: string, event: string, args: unknown[]): void {
  if (!io) return;
  const channel = io.to(target);
  // Socket.IO's overloaded emit does not accept a variable event name; the
  // public helpers below keep call sites fully typed.
  (channel.emit as unknown as (name: string, ...rest: unknown[]) => boolean)(event, ...args);
}

export function emitToRoom<K extends ServerEventName>(
  roomId: string,
  event: K,
  ...args: Parameters<ServerToClientEvents[K]>
): void {
  emit(roomChannel(roomId), event, args);
}

export function emitToUser<K extends ServerEventName>(
  userId: string,
  event: K,
  ...args: Parameters<ServerToClientEvents[K]>
): void {
  emit(userChannel(userId), event, args);
}

export function emitToUsers<K extends ServerEventName>(
  userIds: readonly string[],
  event: K,
  ...args: Parameters<ServerToClientEvents[K]>
): void {
  for (const userId of new Set(userIds)) {
    emit(userChannel(userId), event, args);
  }
}

/**
 * Makes every live socket of the given users listen on a room channel. Used
 * when a room is created or a member is added, so room broadcasts reach the
 * new audience immediately without waiting for a client re-join.
 */
export function joinUsersToRoom(userIds: readonly string[], roomId: string): void {
  if (!io) return;
  for (const userId of new Set(userIds)) {
    io.in(userChannel(userId)).socketsJoin(roomChannel(roomId));
  }
}

export function removeUsersFromRoom(userIds: readonly string[], roomId: string): void {
  if (!io) return;
  for (const userId of new Set(userIds)) {
    io.in(userChannel(userId)).socketsLeave(roomChannel(roomId));
  }
}
