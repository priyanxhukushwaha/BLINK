import { useChat, ConversationRoom, TimerOptionMinutes } from '@/features/chat';

export function useRooms() {
  const {
    rooms,
    activeRoomTimer,
    setRoomTimer,
    getRoomById,
    ensurePrivateRoom,
  } = useChat();

  return {
    rooms,
    activeRoomTimer,
    setRoomTimer: (roomId: string, minutes: TimerOptionMinutes) => setRoomTimer(roomId, minutes),
    getRoomById: (roomId: string) => getRoomById(roomId),
    ensurePrivateRoom: (friendId: string) => ensurePrivateRoom(friendId),
  };
}

export default useRooms;

