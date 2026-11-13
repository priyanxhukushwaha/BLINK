import { prisma } from '../config/database';
import { logger } from '../config/logger';
import type { AckResponse } from '../types/common';
import type { SocketUser } from '../types/socket';
import { ApiError } from '../utils/ApiError';
import { WS_AUTH_TIMEOUT_MS, WS_EVENTS } from '../utils/constants';
import { roomChannel, userChannel, type BlinkServer } from './realtime';
import { resolveSocketUser, type BlinkSocket } from './socket.auth';
import { errorResponse } from './socket.util';
import { registerMessageEvents } from './events/message.events';
import { registerReadEvents } from './events/read.events';
import { registerRoomEvents } from './events/room.events';
import { registerTypingEvents } from './events/typing.events';

export function registerSocketHandlers(_io: BlinkServer, socket: BlinkSocket): void {
  socket.data.user = null;

  const authTimer = setTimeout(() => {
    if (!socket.data.user) {
      socket.disconnect(true);
    }
  }, WS_AUTH_TIMEOUT_MS);
  authTimer.unref?.();
  socket.data.authTimer = authTimer;

  let authenticating = false;

  const authenticateConnection = async (
    token: unknown,
    ack?: (response: AckResponse<{ user: SocketUser }>) => void,
  ): Promise<void> => {
    if (socket.data.user) {
      ack?.({ ok: true, data: { user: socket.data.user } });
      return;
    }

    if (typeof token !== 'string' || token.length < 20) {
      throw ApiError.unauthorized('A valid access token is required', 'INVALID_TOKEN');
    }
    if (authenticating) {
      return;
    }

    authenticating = true;
    try {
      const user = await resolveSocketUser(token);

      const memberships = await prisma.roomMember.findMany({
        where: { userId: user.id },
        select: { roomId: true },
      });

      await socket.join([
        userChannel(user.id),
        ...memberships.map((membership) => roomChannel(membership.roomId)),
      ]);

      socket.data.user = user;
      if (socket.data.authTimer) {
        clearTimeout(socket.data.authTimer);
        socket.data.authTimer = undefined;
      }

      socket.emit(WS_EVENTS.AUTHENTICATED, { user });
      ack?.({ ok: true, data: { user } });
    } finally {
      authenticating = false;
    }
  };

  socket.on(WS_EVENTS.AUTHENTICATE, (payload, ack) => {
    void authenticateConnection(payload?.token, ack).catch((error: unknown) => {
      ack?.(errorResponse(error));
      socket.disconnect(true);
    });
  });

  // Optional faster path: the client may pass the token during the handshake.
  const header = socket.handshake.headers.authorization;
  const headerToken = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;
  const handshakeToken =
    typeof socket.handshake.auth?.token === 'string'
      ? (socket.handshake.auth.token as string)
      : headerToken;

  if (handshakeToken) {
    void authenticateConnection(handshakeToken).catch(() => socket.disconnect(true));
  }

  registerRoomEvents(socket);
  registerMessageEvents(socket);
  registerReadEvents(socket);
  registerTypingEvents(socket);

  socket.on('disconnect', (reason) => {
    if (socket.data.authTimer) {
      clearTimeout(socket.data.authTimer);
      socket.data.authTimer = undefined;
    }
    logger.debug('socket_disconnected', { socketId: socket.id, reason });
  });
}
