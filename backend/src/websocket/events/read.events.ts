import { z } from 'zod';
import * as messageService from '../../modules/messages/message.service';
import { ApiError } from '../../utils/ApiError';
import { SOCKET_LIMITS, WS_EVENTS } from '../../utils/constants';
import { requireSocketUser, type BlinkSocket } from '../socket.auth';
import { SocketRateLimiter, errorResponse } from '../socket.util';

const readPayloadSchema = z.object({ roomId: z.string().uuid() });

export function registerReadEvents(socket: BlinkSocket): void {
  const limiter = new SocketRateLimiter(SOCKET_LIMITS.markReadPerMinute);

  socket.on(WS_EVENTS.MARK_READ, (payload, ack) => {
    void (async () => {
      const user = requireSocketUser(socket);
      if (!limiter.allow()) {
        throw ApiError.tooManyRequests();
      }

      const parsed = readPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        throw ApiError.badRequest('A valid room id is required', 'VALIDATION_ERROR');
      }

      const result = await messageService.markRoomRead(parsed.data.roomId, user.id);
      ack?.({ ok: true, data: result });
    })().catch((error: unknown) => ack?.(errorResponse(error)));
  });
}
