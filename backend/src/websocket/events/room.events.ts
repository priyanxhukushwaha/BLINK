import { z } from 'zod';
import { assertRoomMembership } from '../../modules/rooms/room.service';
import { ApiError } from '../../utils/ApiError';
import { SOCKET_LIMITS, WS_EVENTS } from '../../utils/constants';
import { roomChannel } from '../realtime';
import { requireSocketUser, type BlinkSocket } from '../socket.auth';
import { SocketRateLimiter, errorResponse } from '../socket.util';

const roomPayloadSchema = z.object({ roomId: z.string().uuid() });

export function registerRoomEvents(socket: BlinkSocket): void {
  const joinLimiter = new SocketRateLimiter(SOCKET_LIMITS.joinRoomPerMinute);

  socket.on(WS_EVENTS.JOIN_ROOM, (payload, ack) => {
    void (async () => {
      const user = requireSocketUser(socket);
      if (!joinLimiter.allow()) {
        throw ApiError.tooManyRequests();
      }

      const parsed = roomPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        throw ApiError.badRequest('A valid room id is required', 'VALIDATION_ERROR');
      }

      await assertRoomMembership(parsed.data.roomId, user.id);
      await socket.join(roomChannel(parsed.data.roomId));
      ack?.({ ok: true });
    })().catch((error: unknown) => ack?.(errorResponse(error)));
  });

  socket.on(WS_EVENTS.LEAVE_ROOM, (payload) => {
    const parsed = roomPayloadSchema.safeParse(payload);
    if (parsed.success) {
      void socket.leave(roomChannel(parsed.data.roomId));
    }
  });
}
