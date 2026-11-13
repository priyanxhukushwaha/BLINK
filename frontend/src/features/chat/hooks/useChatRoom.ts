import { useEffect, useMemo } from 'react';
import { useChat } from '../state/ChatContext';
import { createMemberNameResolver } from '../utils/memberUtils';

export function useChatRoom(roomId: string | undefined) {
  const {
    messages,
    openRoom,
    leaveRoom,
    sendMessage,
    evictExpiredMessage,
    getRoomById,
    roomMembers,
    profileCache,
    currentUser,
    storageError,
    clearStorageError,
  } = useChat();

  const currentRoomId = roomId ?? '';
  const room = currentRoomId ? getRoomById(currentRoomId) : undefined;
  const roomMessages = currentRoomId ? messages[currentRoomId] ?? [] : [];
  const members = currentRoomId ? (roomMembers[currentRoomId] ?? room?.memberProfiles ?? []) : [];
  const roomTimer = room?.timerMinutes ?? 15;

  const resolveMemberName = useMemo(() => {
    return createMemberNameResolver(members, currentUser.id);
  }, [currentUser.id, members]);

  // Realtime room subscription lifecycle
  useEffect(() => {
    if (!currentRoomId) return;
    void openRoom(currentRoomId);
    return () => leaveRoom(currentRoomId);
  }, [currentRoomId, openRoom, leaveRoom]);

  const send = async (text: string, photo?: File): Promise<boolean> => {
    if (!currentRoomId) return false;
    return sendMessage(currentRoomId, text, photo);
  };

  const evict = (messageId: string) => {
    if (!currentRoomId) return;
    evictExpiredMessage(currentRoomId, messageId);
  };

  return {
    room,
    messages: roomMessages,
    members,
    roomTimer,
    currentUser,
    resolveMemberName,
    sendMessage: send,
    evictExpiredMessage: evict,
    storageError,
    clearStorageError,
  };
}

export default useChatRoom;

