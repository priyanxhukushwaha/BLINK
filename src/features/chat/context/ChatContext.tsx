import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message, ConversationRoom, TimerOptionMinutes } from '@/features/chat/types/chat';
import { UserProfile, Friend } from '@/features/profile';
import { calculateExpirationTime, isMessageExpired } from '@/features/chat/utils/expiration';

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
  markIncomingAsRead: (roomId: string) => void;
  evictExpiredMessage: (roomId: string, messageId: string) => void;
  setRoomTimer: (roomId: string, minutes: TimerOptionMinutes) => void;
  setDefaultTimer: (minutes: TimerOptionMinutes) => void;
  getFriendById: (friendId: string) => Friend | undefined;
  getRoomById: (roomId: string) => ConversationRoom | undefined;
}

const STORAGE_KEY_MESSAGES = 'ephemeral_demo_messages_v1';
const STORAGE_KEY_TIMERS = 'ephemeral_demo_room_timers_v1';

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
    members: ['Meera', 'Kabir', 'Tanya', 'Priyanx'],
    adminId: 'user-meera',
    adminName: 'Meera',
    lastMessageText: 'Tanya: Main bhi ready hu! 🚀',
    timerMinutes: 30,
  },
  {
    id: 'room-project-squad',
    name: 'Project Squad',
    type: 'group',
    avatarUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&auto=format&fit=crop&q=80',
    memberCount: 5,
    members: ['Kabir', 'Aryan', 'Priyanx'],
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
    members: ['Aryan', 'Meera', 'Tanya', 'Priyanx'],
    adminId: 'user-aryan',
    adminName: 'Aryan',
    lastMessageText: 'Anyone up for the stargazing drive?',
    timerMinutes: 15,
  },
];

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
        timerDurationMs: 5 * 60 * 1000,
        isOutgoing: true,
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
    console.warn('[EPHEMERAL Demo Persistence] localStorage write failed or quota exceeded:', error);
    return false;
  }
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER);
  const [friends] = useState<Friend[]>(FRIENDS_DATA);
  const [rooms, setRooms] = useState<ConversationRoom[]>(() => {
    // Hydrate saved room timers if present
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
      // ignore JSON parse error
    }
    return INITIAL_ROOMS;
  });

  const [activeRoomTimer, setActiveRoomTimer] = useState<TimerOptionMinutes>(5);
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
      console.warn('[EPHEMERAL Demo Persistence] Failed to load from localStorage:', e);
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
   * Rule 1: Starts as unread (firstReadAt: null) with 60m maximum ceiling.
   * Rule 2: Handled with safe localStorage persistence and quota error protection.
   */
  const sendMessage = (roomId: string, text: string, photoUrl?: string): boolean => {
    const room = rooms.find((r) => r.id === roomId);
    const durationMinutes = room?.timerMinutes || activeRoomTimer || 5;
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
      timerDurationMs: durationMs,
      isOutgoing: true,
      status: 'sent', // Displays as "Sent (Demo)"
    };

    const nextState = {
      ...messages,
      [roomId]: [...(messages[roomId] || []), newMessage],
    };

    // Test saving to localStorage first to protect against quota exhaustion
    const savedSuccessfully = safeSaveToLocalStorage(nextState);
    if (!savedSuccessfully && photoUrl) {
      setStorageError(
        'Attachment storage failed: Demo localStorage quota exceeded. Please use a smaller photo or clear cache.'
      );
      // Do not corrupt state or messages
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
   * Simulated Recipient Read:
   * Visibly simulates Aryan reading the message in the local demo.
   * Locks firstReadAt and begins the timer countdown.
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
            status: 'read' as const, // Displays as "Read (Demo)"
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
   * When user opens chat, incoming messages from friend are viewed/read,
   * setting firstReadAt to initiate the receiver's countdown.
   */
  const markIncomingAsRead = (roomId: string) => {
    const now = Date.now();
    setMessages((prev) => {
      const roomMsgs = prev[roomId] || [];
      let hasChanges = false;

      const updated = roomMsgs.map((msg) => {
        if (!msg.isOutgoing && msg.firstReadAt === null) {
          hasChanges = true;
          return {
            ...msg,
            firstReadAt: now,
            status: 'read' as const,
          };
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
   * Removes the message safely from React state and localStorage.
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
