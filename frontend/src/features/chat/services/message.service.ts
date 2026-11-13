import { messageApi } from '@/shared/api/endpoints';
import type { MessageDto, MessagePageDto, PhotoUploadDto } from '@/shared/api/types';

export const messageService = {
  listMessages: (roomId: string, limit = 50): Promise<MessagePageDto> => messageApi.list(roomId, limit),
  sendMessage: (roomId: string, input: { text?: string; photoUrl?: string }): Promise<MessageDto> =>
    messageApi.send(roomId, input),
  markMessagesRead: (roomId: string): Promise<{ readCount: number }> => messageApi.markRead(roomId),
  uploadPhoto: (roomId: string, file: File): Promise<PhotoUploadDto> => messageApi.uploadPhoto(roomId, file),
  deleteMessage: (roomId: string, messageId: string): Promise<{ deleted: true }> =>
    messageApi.remove(roomId, messageId),
};

export default messageService;

