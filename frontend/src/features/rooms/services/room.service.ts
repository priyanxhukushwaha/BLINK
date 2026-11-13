import { roomApi } from '@/shared/api/endpoints';
import type { RoomDetailDto, RoomDto } from '@/shared/api/types';

export const roomService = {
  listRooms: (): Promise<RoomDto[]> => roomApi.list(),
  getRoom: (roomId: string): Promise<RoomDetailDto> => roomApi.get(roomId),
  createPrivateRoom: (recipientId: string): Promise<RoomDto> => roomApi.createPrivate(recipientId),
  createGroupRoom: (input: { name: string; memberIds: string[]; timerMinutes?: number }): Promise<RoomDetailDto> =>
    roomApi.createGroup(input),
  updateRoomTimer: (roomId: string, timerMinutes: number): Promise<RoomDto> =>
    roomApi.updateTimer(roomId, timerMinutes),
};

export default roomService;

