import { useEffect, useMemo } from 'react';
import { useChat } from '../state/ChatContext';
import { createMemberNameResolver } from '../utils/memberUtils';

export function useChatRoom(roomId: string | undefined) {
  const {
    messages,
    screenshotAlerts,
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
    typingUsers,
    sendTyping,
    simulatePartnerTyping,
  } = useChat();

  const currentRoomId = roomId ?? '';
  const room = currentRoomId ? getRoomById(currentRoomId) : undefined;
  const roomMessages = currentRoomId ? messages[currentRoomId] ?? [] : [];
  const members = currentRoomId ? (roomMembers[currentRoomId] ?? room?.memberProfiles ?? []) : [];
  const roomTimer = room?.timerMinutes ?? 15;
  const roomTypingUsers = currentRoomId ? typingUsers[currentRoomId] ?? [] : [];

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

  const notifyTyping = () => {
    if (!currentRoomId) return;
    sendTyping(currentRoomId);
  };

  const simulateTyping = (user?: { userId: string; username: string; displayName?: string }) => {
    if (!currentRoomId || !simulatePartnerTyping) return;
    simulatePartnerTyping(currentRoomId, user);
  };

  return {
    room,
    messages: roomMessages,
    screenshotAlert: currentRoomId ? screenshotAlerts[currentRoomId] : undefined,
    members,
    roomTimer,
    currentUser,
    resolveMemberName,
    sendMessage: send,
    evictExpiredMessage: evict,
    storageError,
    clearStorageError,
    typingUsers: roomTypingUsers,
    sendTyping: notifyTyping,
    simulatePartnerTyping: simulateTyping,
  };
}

export default useChatRoom;
