import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message, ConversationRoom, TimerOptionMinutes } from '../types/chat';
import { UserProfile, Friend } from '../types/user';
import { calculateExpirationTime, isMessageExpired } from '../utils/expiration';

interface ChatContextType {
  currentUser: UserProfile;
  friends: Friend[];
  rooms: ConversationRoom[];
  messages: Record<string, Message[]>; // roomId -> Message[]
  activeRoomTimer: TimerOptionMinutes;
  sendMessage: (roomId: string, text: string, photoUrl?: string) => void;
  setRoomTimer: (roomId: string, minutes: TimerOptionMinutes) => void;
  setDefaultTimer: (minutes: TimerOptionMinutes) => void;
  getFriendById: (friendId: string) => Friend | undefined;
  getRoomById: (roomId: string) => ConversationRoom | undefined;
}

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

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER);
  const [friends] = useState<Friend[]>(FRIENDS_DATA);
  const [rooms, setRooms] = useState<ConversationRoom[]>(INITIAL_ROOMS);
  const [activeRoomTimer, setActiveRoomTimer] = useState<TimerOptionMinutes>(15);

  const now = Date.now();
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    'room-aryan': [
      {
        id: 'msg-a1',
        roomId: 'room-aryan',
        senderId: 'user-aryan',
        senderName: 'Aryan',
        senderAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
        text: 'Hey! 👋',
        sentAt: now - 240000,
        firstReadAt: now - 200000,
        timerDurationMs: 5 * 60 * 1000,
        isOutgoing: false,
        status: 'read',
      },
      {
        id: 'msg-a2',
        roomId: 'room-aryan',
        senderId: 'user-me',
        senderName: 'You',
        senderAvatar: CURRENT_USER.avatarUrl,
        text: 'Kal mil rahe ho?',
        sentAt: now - 180000,
        firstReadAt: now - 160000,
        timerDurationMs: 5 * 60 * 1000,
        isOutgoing: true,
        status: 'read',
      },
      {
        id: 'msg-a3',
        roomId: 'room-aryan',
        senderId: 'user-aryan',
        senderName: 'Aryan',
        senderAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
        text: 'Haan, 7 baje?',
        sentAt: now - 100000,
        firstReadAt: now - 90000,
        timerDurationMs: 5 * 60 * 1000,
        isOutgoing: false,
        status: 'read',
      },
      {
        id: 'msg-a4',
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
    'room-late-night': [
      {
        id: 'msg-ln1',
        roomId: 'room-late-night',
        senderId: 'user-meera',
        senderName: 'Meera',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
        text: 'Project ka final review kal hai! ⏳',
        sentAt: now - 400000,
        firstReadAt: now - 350000,
        timerDurationMs: 30 * 60 * 1000,
        isOutgoing: false,
        status: 'read',
      },
      {
        id: 'msg-ln2',
        roomId: 'room-late-night',
        senderId: 'user-kabir',
        senderName: 'Kabir',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        text: 'Same, ready ho?',
        sentAt: now - 300000,
        firstReadAt: now - 280000,
        timerDurationMs: 30 * 60 * 1000,
        isOutgoing: false,
        status: 'read',
      },
      {
        id: 'msg-ln3',
        roomId: 'room-late-night',
        senderId: 'user-me',
        senderName: 'You',
        senderAvatar: CURRENT_USER.avatarUrl,
        text: 'Haan, docs bhej do.',
        sentAt: now - 150000,
        firstReadAt: now - 120000,
        timerDurationMs: 30 * 60 * 1000,
        isOutgoing: true,
        status: 'read',
      },
      {
        id: 'msg-ln4',
        roomId: 'room-late-night',
        senderId: 'user-tanya',
        senderName: 'Tanya',
        senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
        text: 'Main bhi ready hu! 🚀',
        sentAt: now - 45000,
        firstReadAt: now - 30000,
        timerDurationMs: 30 * 60 * 1000,
        isOutgoing: false,
        status: 'read',
      },
    ],
    'room-weekend-plans': [
      {
        id: 'msg-wp1',
        roomId: 'room-weekend-plans',
        senderId: 'user-aryan',
        senderName: 'Aryan',
        senderAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
        text: 'Anyone up for the stargazing drive?',
        sentAt: now - 600000,
        firstReadAt: now - 540000,
        timerDurationMs: 15 * 60 * 1000,
        isOutgoing: false,
        status: 'read',
      },
    ],
  });

  // Real-time wall-clock expiration check
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      setMessages((prev) => {
        let changed = false;
        const updated: Record<string, Message[]> = {};

        for (const [roomId, roomMsgs] of Object.entries(prev)) {
          const filtered = roomMsgs.filter((msg) => {
            const expired = isMessageExpired(msg, currentTime);
            if (expired) changed = true;
            return !expired;
          });
          updated[roomId] = filtered;
        }

        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = (roomId: string, text: string, photoUrl?: string) => {
    const room = rooms.find((r) => r.id === roomId);
    const durationMinutes = room?.timerMinutes || activeRoomTimer || 15;
    const durationMs = durationMinutes * 60 * 1000;
    const sendTimestamp = Date.now();

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      roomId,
      senderId: currentUser.id,
      senderName: 'You',
      senderAvatar: currentUser.avatarUrl,
      text,
      photoUrl,
      sentAt: sendTimestamp,
      firstReadAt: sendTimestamp + 1500,
      timerDurationMs: durationMs,
      isOutgoing: true,
      status: 'delivered',
    };

    setMessages((prev) => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), newMessage],
    }));

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
  };

  const setRoomTimer = (roomId: string, minutes: TimerOptionMinutes) => {
    setActiveRoomTimer(minutes);
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, timerMinutes: minutes } : r))
    );
  };

  const setDefaultTimer = (minutes: TimerOptionMinutes) => {
    setCurrentUser((prev) => ({ ...prev, defaultTimerMinutes: minutes }));
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
        sendMessage,
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
