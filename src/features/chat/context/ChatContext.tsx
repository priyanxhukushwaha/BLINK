import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message, ConversationRoom, TimerOptionMinutes } from '../types/chat';
import { UserProfile, Friend } from '@/features/profile/types/user';
import { calculateExpirationTime, isMessageExpired } from '../utils/expiration';

interface ChatContextType {
  currentUser: UserProfile;
  friends: Friend[];
  rooms: ConversationRoom[];
  messages: Record<string, Message[]>; // roomId -> Message[]
  activeRoomTimer: TimerOptionMinutes;
  storageError: string | null;
  clearStorageError: () => void;
  sendMessage: (roomId: string, text: string, photoUrl?: string) => boolean;
  simulateRecipientRead: (roomId: string, messageId: string) => void;
  simulateGroupMemberRead: (roomId: string, messageId: string, memberName: string) => void;
  markIncomingAsRead: (roomId: string) => void;
  evictExpiredMessage: (roomId: string, messageId: string) => void;
  setRoomTimer: (roomId: string, minutes: TimerOptionMinutes) => void;
  setDefaultTimer: (minutes: TimerOptionMinutes) => void;
  getFriendById: (friendId: string) => Friend | undefined;
  getRoomById: (roomId: string) => ConversationRoom | undefined;
}

const STORAGE_KEY_MESSAGES = 'ephemeral_demo_messages_v2';
const STORAGE_KEY_TIMERS = 'ephemeral_demo_room_timers_v2';

const CURRENT_USER: UserProfile = {
  id: 'user-me',
  username: '@pkdev',
  displayName: 'Priyanx Kushwaha',
  bio: 'Just a moment here. ✨',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  defaultTimerMinutes: 15,
  inviteLink: 'ephemeral.app/invite/pkdev',
};

const FRIENDS_DATA: Friend[] = [
  {
    id: 'user-aryan',
    username: '@aryan',
    displayName: 'Aryan',
    bio: 'Living in the moment. Leaving no digital footprints. 🌌',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    lastInteractionText: 'Tap to chat',
  },
  {
    id: 'user-meera',
    username: '@meera',
    displayName: 'Meera',
    bio: 'Capturing light & temporary memories. 📸',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    lastInteractionText: 'Photo',
  },
  {
    id: 'user-kabir',
    username: '@kabir',
    displayName: 'Kabir',
    bio: 'Coffee, code, and fleeting conversations. ☕',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    lastInteractionText: 'Same, ready ho?',
  },
  {
    id: 'user-tanya',
    username: '@tanya',
    displayName: 'Tanya',
    bio: 'Present in the moment. ✨',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    lastInteractionText: 'Main bhi ready hu! 🚀',
  },
];

const INITIAL_ROOMS: ConversationRoom[] = [
  {
    id: 'room-late-night',
    name: 'Late Night Crew 🌙',
    type: 'group',
    avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
    memberCount: 12,
    members: ['Meera', 'Kabir', 'Tanya', 'Priyanx', 'Aryan', 'Rohan', 'Sneha', 'Zara', 'Dev', 'Aditi', 'Vikram', 'Ananya'],
    adminId: 'user-meera',
    adminName: 'Meera',
    lastMessageText: 'Tanya: Main bhi ready hu! 🚀',
    timerMinutes: 30,
  },
  {
    id: 'room-aryan',
    name: 'Aryan',
    type: 'private',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    recipientId: 'user-aryan',
    lastMessageText: 'Done! 5m ✓✓',
    timerMinutes: 5,
  },
  {
    id: 'room-project-squad',
    name: 'Project Squad',
    type: 'group',
    avatarUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&auto=format&fit=crop&q=80',
    memberCount: 5,
    members: ['Kabir', 'Aryan', 'Priyanx', 'Sneha', 'Rohan'],
    adminId: 'user-kabir',
    adminName: 'Kabir',
    lastMessageText: 'Review tomorrow at 10am',
    timerMinutes: 60,
  },
  {
    id: 'room-weekend-plans',
    name: 'Weekend Plans 🌊',
    type: 'group',
    avatarUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&auto=format&fit=crop&q=80',
    memberCount: 8,
    members: ['Aryan', 'Meera', 'Tanya', 'Priyanx', 'Dev', 'Zara', 'Aditi', 'Vikram'],
    adminId: 'user-aryan',
    adminName: 'Aryan',
    lastMessageText: 'Anyone up for the stargazing drive?',
    timerMinutes: 15,
  },
];

/**
 * Generates fresh, realistic seed messages relative to current execution time.
 * Only called on very first initialization (never resets stored deadlines on reload).
 */
const getSeedMessages = (): Record<string, Message[]> => {
  const now = Date.now();
  return {
    'room-aryan': [
      {
        id: 'msg-seed-a1',
        roomId: 'room-aryan',
        senderId: 'user-aryan',
        senderName: 'Aryan',
        senderAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
        text: 'Hey! 👋',
        sentAt: now - 180000,
        firstReadAt: now - 120000,
        firstReadBy: 'user-me',
        readBy: ['user-me'],
        timerDurationMs: 5 * 60 * 1000,
        isOutgoing: false,
        status: 'read',
      },
      {
        id: 'msg-seed-a2',
        roomId: 'room-aryan',
        senderId: 'user-me',
        senderName: 'You',
        senderAvatar: CURRENT_USER.avatarUrl,
        text: 'Kal mil rahe ho?',
        sentAt: now - 120000,
        firstReadAt: now - 90000,
        firstReadBy: 'user-aryan',
        readBy: ['user-aryan'],
        timerDurationMs: 5 * 60 * 1000,
        isOutgoing: true,
        status: 'read',
      },
      {
        id: 'msg-seed-a3',
        roomId: 'room-aryan',
        senderId: 'user-aryan',
        senderName: 'Aryan',
        senderAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
        text: 'Haan, 7 baje?',
        sentAt: now - 70000,
        firstReadAt: now - 50000,
        firstReadBy: 'user-me',
        readBy: ['user-me'],
        timerDurationMs: 5 * 60 * 1000,
        isOutgoing: false,
        status: 'read',
      },
      {
        id: 'msg-seed-a4',
        roomId: 'room-aryan',
        senderId: 'user-me',
        senderName: 'You',
        senderAvatar: CURRENT_USER.avatarUrl,
        text: 'Done!',
        sentAt: now - 30000,
        firstReadAt: now - 20000,
        firstReadBy: 'user-aryan',
        readBy: ['user-aryan'],
        timerDurationMs: 5 * 60 * 1000,
        isOutgoing: true,
        status: 'read',
      },
    ],
    'room-late-night': [
      {
        id: 'msg-seed-ln1',
        roomId: 'room-late-night',
        senderId: 'user-meera',
        senderName: 'Meera',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
        text: 'Project ka final review kal hai! ⏳',
        sentAt: now - 360000,
        firstReadAt: now - 300000,
        firstReadBy: 'Kabir',
        readBy: ['Kabir', 'You', 'Tanya'],
        timerDurationMs: 30 * 60 * 1000,
        isOutgoing: false,
        status: 'read',
      },
      {
        id: 'msg-seed-ln2',
        roomId: 'room-late-night',
        senderId: 'user-kabir',
        senderName: 'Kabir',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        text: 'Same, ready ho?',
        sentAt: now - 240000,
        firstReadAt: now - 180000,
        firstReadBy: 'Meera',
        readBy: ['Meera', 'You'],
        timerDurationMs: 30 * 60 * 1000,
        isOutgoing: false,
        status: 'read',
      },
      {
        id: 'msg-seed-ln3',
        roomId: 'room-late-night',
        senderId: 'user-me',
        senderName: 'You',
        senderAvatar: CURRENT_USER.avatarUrl,
        text: 'Haan, docs bhej do.',
        sentAt: now - 120000,
        firstReadAt: now - 60000,
        firstReadBy: 'Tanya',
        readBy: ['Tanya', 'Meera'],
        timerDurationMs: 30 * 60 * 1000,
        isOutgoing: true,
        status: 'read',
      },
      {
        id: 'msg-seed-ln4',
        roomId: 'room-late-night',
        senderId: 'user-tanya',
        senderName: 'Tanya',
        senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
        text: 'Main bhi ready hu! 🚀',
        sentAt: now - 45000,
        firstReadAt: now - 30000,
        firstReadBy: 'Meera',
        readBy: ['Meera', 'Kabir'],
        timerDurationMs: 30 * 60 * 1000,
        isOutgoing: false,
        status: 'read',
      },
    ],
  };
};

function safeSaveToLocalStorage(data: Record<string, Message[]>): boolean {
  try {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn('[BLINK Demo Persistence] localStorage write failed or quota exceeded:', error);
    return false;
  }
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER);
  const [friends] = useState<Friend[]>(FRIENDS_DATA);
  const [rooms, setRooms] = useState<ConversationRoom[]>(() => {
    try {
      const savedTimers = localStorage.getItem(STORAGE_KEY_TIMERS);
      if (savedTimers) {
        const timerMap: Record<string, TimerOptionMinutes> = JSON.parse(savedTimers);
        return INITIAL_ROOMS.map((r) => ({
          ...r,
          timerMinutes: timerMap[r.id] || r.timerMinutes,
        }));
      }
    } catch {
      // ignore
    }
    return INITIAL_ROOMS;
  });

  const [activeRoomTimer, setActiveRoomTimer] = useState<TimerOptionMinutes>(30);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Initialize messages with demo localStorage persistence & boot expiration purge
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (saved) {
        const parsed: Record<string, Message[]> = JSON.parse(saved);
        const now = Date.now();
        const unexpired: Record<string, Message[]> = {};

        for (const [roomId, roomMsgs] of Object.entries(parsed)) {
          unexpired[roomId] = roomMsgs.filter((msg) => !isMessageExpired(msg, now));
        }
        return unexpired;
      }
    } catch (e) {
      console.warn('[BLINK Demo Persistence] Failed to load from localStorage:', e);
    }
    return getSeedMessages();
  });

  const clearStorageError = () => setStorageError(null);

  // Synchronize room timers to localStorage
  const setRoomTimer = (roomId: string, minutes: TimerOptionMinutes) => {
    setActiveRoomTimer(minutes);
    setRooms((prev) => {
      const updated = prev.map((r) => (r.id === roomId ? { ...r, timerMinutes: minutes } : r));
      try {
        const timerMap: Record<string, TimerOptionMinutes> = {};
        updated.forEach((r) => {
          timerMap[r.id] = r.timerMinutes;
        });
        localStorage.setItem(STORAGE_KEY_TIMERS, JSON.stringify(timerMap));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const setDefaultTimer = (minutes: TimerOptionMinutes) => {
    setCurrentUser((prev) => ({ ...prev, defaultTimerMinutes: minutes }));
  };

  /**
   * Sending a message:
   * Rule: Starts as unread (firstReadAt: null, firstReadBy: null, readBy: [])
   * with 60m maximum ceiling.
   */
  const sendMessage = (roomId: string, text: string, photoUrl?: string): boolean => {
    const room = rooms.find((r) => r.id === roomId);
    const durationMinutes = room?.timerMinutes || activeRoomTimer || 30;
    const durationMs = durationMinutes * 60 * 1000;
    const sendTimestamp = Date.now();

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      roomId,
      senderId: currentUser.id,
      senderName: 'You',
      senderAvatar: currentUser.avatarUrl,
      text,
      photoUrl,
      sentAt: sendTimestamp,
      firstReadAt: null, // Strictly unread upon send
      firstReadBy: null,
      readBy: [],
      timerDurationMs: durationMs,
      isOutgoing: true,
      status: 'sent', // Displays as "Sent (Demo)"
    };

    const nextState = {
      ...messages,
      [roomId]: [...(messages[roomId] || []), newMessage],
    };

    const savedSuccessfully = safeSaveToLocalStorage(nextState);
    if (!savedSuccessfully && photoUrl) {
      setStorageError(
        'Attachment storage failed: Demo localStorage quota exceeded. Please use a smaller photo or clear cache.'
      );
      return false;
    }

    setMessages(nextState);

    // Update room latest message
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              lastMessageText: photoUrl ? '📷 Photo' : text,
            }
          : r
      )
    );

    return true;
  };

  /**
   * 1-on-1 Simulated Recipient Read:
   */
  const simulateRecipientRead = (roomId: string, messageId: string) => {
    const readTimestamp = Date.now();

    setMessages((prev) => {
      const roomMsgs = prev[roomId] || [];
      const updatedRoomMsgs = roomMsgs.map((msg) => {
        if (msg.id === messageId && !msg.firstReadAt) {
          return {
            ...msg,
            firstReadAt: readTimestamp,
            firstReadBy: 'Aryan',
            readBy: ['Aryan'],
            status: 'read' as const,
          };
        }
        return msg;
      });

      const nextState = { ...prev, [roomId]: updatedRoomMsgs };
      safeSaveToLocalStorage(nextState);
      return nextState;
    });
  };

  /**
   * Group Chat: "First Seen, Starts Timer" Implementation:
   * 1. If firstReadAt is null: locks firstReadAt and firstReadBy permanently to this member!
   * 2. If firstReadAt is already set: NEVER overwrites firstReadAt or firstReadBy!
   *    Simply adds the member to readBy array.
   */
  const simulateGroupMemberRead = (roomId: string, messageId: string, memberName: string) => {
    const readTimestamp = Date.now();

    setMessages((prev) => {
      const roomMsgs = prev[roomId] || [];
      const updated = roomMsgs.map((msg) => {
        if (msg.id === messageId) {
          const currentReadBy = msg.readBy || [];
          const updatedReadBy = currentReadBy.includes(memberName)
            ? currentReadBy
            : [...currentReadBy, memberName];

          // Critical Rule: Lock firstReadAt ONLY ONCE
          if (msg.firstReadAt === null) {
            return {
              ...msg,
              firstReadAt: readTimestamp,
              firstReadBy: memberName,
              readBy: updatedReadBy,
              status: 'read' as const,
            };
          } else {
            // Already read: firstReadAt & firstReadBy REMAIN UNCHANGED
            return {
              ...msg,
              readBy: updatedReadBy,
            };
          }
        }
        return msg;
      });

      const nextState = { ...prev, [roomId]: updated };
      safeSaveToLocalStorage(nextState);
      return nextState;
    });
  };

  /**
   * When user opens chat, incoming unread messages are marked as seen by the current user.
   * If message was never read by anyone, current user locks firstReadAt!
   */
  const markIncomingAsRead = (roomId: string) => {
    const now = Date.now();
    setMessages((prev) => {
      const roomMsgs = prev[roomId] || [];
      let hasChanges = false;

      const updated = roomMsgs.map((msg) => {
        if (!msg.isOutgoing) {
          const currentReadBy = msg.readBy || [];
          const isAlreadyInReadBy = currentReadBy.includes('You');

          if (msg.firstReadAt === null) {
            hasChanges = true;
            return {
              ...msg,
              firstReadAt: now,
              firstReadBy: 'You',
              readBy: isAlreadyInReadBy ? currentReadBy : [...currentReadBy, 'You'],
              status: 'read' as const,
            };
          } else if (!isAlreadyInReadBy) {
            hasChanges = true;
            return {
              ...msg,
              readBy: [...currentReadBy, 'You'],
            };
          }
        }
        return msg;
      });

      if (!hasChanges) return prev;
      const nextState = { ...prev, [roomId]: updated };
      safeSaveToLocalStorage(nextState);
      return nextState;
    });
  };

  /**
   * Single Coordinated Eviction:
   * Called strictly after ParticleDisintegration finishes its canvas animation.
   */
  const evictExpiredMessage = (roomId: string, messageId: string) => {
    setMessages((prev) => {
      const roomMsgs = prev[roomId] || [];
      const filtered = roomMsgs.filter((m) => m.id !== messageId);
      const nextState = { ...prev, [roomId]: filtered };
      safeSaveToLocalStorage(nextState);
      return nextState;
    });
  };

  const getFriendById = (friendId: string) => friends.find((f) => f.id === friendId);
  const getRoomById = (roomId: string) => rooms.find((r) => r.id === roomId);

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        friends,
        rooms,
        messages,
        activeRoomTimer,
        storageError,
        clearStorageError,
        sendMessage,
        simulateRecipientRead,
        simulateGroupMemberRead,
        markIncomingAsRead,
        evictExpiredMessage,
        setRoomTimer,
        setDefaultTimer,
        getFriendById,
        getRoomById,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
