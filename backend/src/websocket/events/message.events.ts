import { z } from 'zod';
import * as messageService from '../../modules/messages/message.service';
import { ApiError } from '../../utils/ApiError';
import { MAX_MESSAGE_LENGTH, SOCKET_LIMITS, WS_EVENTS } from '../../utils/constants';
import { requireSocketUser, type BlinkSocket } from '../socket.auth';
import { SocketRateLimiter, errorResponse } from '../socket.util';

const sendMessageSchema = z.object({
  roomId: z.string().uuid(),
  text: z.string().max(MAX_MESSAGE_LENGTH * 2).optional(),
  photoUrl: z.string().min(1).max(300).optional(),
});

export function registerMessageEvents(socket: BlinkSocket): void {
  const limiter = new SocketRateLimiter(SOCKET_LIMITS.sendMessagePerMinute);

  socket.on(WS_EVENTS.SEND_MESSAGE, (payload, ack) => {
    void (async () => {
      const user = requireSocketUser(socket);
      if (!limiter.allow()) {
        throw ApiError.tooManyRequests();
      }

      const parsed = sendMessageSchema.safeParse(payload);
      if (!parsed.success) {
        throw ApiError.badRequest(
          parsed.error.issues[0]?.message ?? 'Invalid message',
          'VALIDATION_ERROR',
        );
      }

      const message = await messageService.sendMessage(parsed.data.roomId, user.id, {
        text: parsed.data.text,
        photoUrl: parsed.data.photoUrl,
      });

      ack?.({ ok: true, data: message });
    })().catch((error: unknown) => ack?.(errorResponse(error)));
  });
}
