import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Message, ConversationRoom, TimerOptionMinutes, RoomMemberProfile } from '../types/chat';
import { UserProfile, Friend } from '@/features/profile/types/user';
import {
  ApiRequestError,
  clearTokens,
  fetchObjectUrl,
  getAccessToken,
  getRefreshToken,
  mediaUrl,
  refreshSession,
  setAccessToken,
  setAuthExpiredHandler,
  setRefreshToken,
} from '@/shared/api/client';
import { authApi, friendApi, messageApi, roomApi, userApi } from '@/shared/api/endpoints';
import { createChatSocket, type ChatSocket } from '@/shared/api/socket';
import type {
  AuthSessionDto,
  AuthUserDto,
  FriendDto,
  MessageDto,
  RoomDetailDto,
  RoomDto,
} from '@/shared/api/types';
import { calculateExpirationTime, isMessageExpired } from '../utils/expiration';
import { normalizeMemberId } from '../utils/memberUtils';
import { useAuth, DEMO_USER } from '@/features/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface ChatContextType {
  authStatus: AuthStatus;
  authError: string | null;
  isAuthenticating: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, displayName: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearAuthError: () => void;

  currentUser: UserProfile;
  friends: Friend[];
  rooms: ConversationRoom[];
  messages: Record<string, Message[]>; // roomId -> Message[]
  roomMembers: Record<string, RoomMemberProfile[]>;
  profileCache: Record<string, UserProfile>;
  activeRoomTimer: TimerOptionMinutes;
  storageError: string | null;
  clearStorageError: () => void;
  openRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => void;
  ensurePrivateRoom: (friendId: string) => Promise<string | null>;
  getProfile: (userId: string) => Promise<UserProfile | null>;
  sendMessage: (roomId: string, text: string, photo?: File) => Promise<boolean>;
  simulateRecipientRead?: (roomId: string, messageId: string) => void;
  simulateGroupMemberRead?: (roomId: string, messageId: string, memberId: string) => void;
  markIncomingAsRead: (roomId: string) => void;
  evictExpiredMessage: (roomId: string, messageId: string) => void;
  setRoomTimer: (roomId: string, minutes: TimerOptionMinutes) => Promise<void>;
  setDefaultTimer: (minutes: TimerOptionMinutes) => Promise<void>;
  getFriendById: (friendId: string) => Friend | undefined;
  getRoomById: (roomId: string) => ConversationRoom | undefined;
}

export const STORAGE_KEY_MESSAGES_V1 = 'ephemeral_messages_v1';
export const STORAGE_KEY_MESSAGES_V2 = 'ephemeral_demo_messages_v2';
export const STORAGE_KEY_TIMERS = 'ephemeral_demo_room_timers_v2';

const EMPTY_USER: UserProfile = {
  id: '',
  username: '',
  displayName: '',
  bio: '',
  avatarUrl: '',
};

const TIMER_VALUES: TimerOptionMinutes[] = [1, 5, 15, 30, 60];

function toTimerMinutes(value: number | undefined): TimerOptionMinutes {
  return TIMER_VALUES.includes(value as TimerOptionMinutes)
    ? (value as TimerOptionMinutes)
    : 15;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}

function mapUser(user: AuthUserDto): UserProfile {
  return {
    ...user,
    avatarUrl: mediaUrl(user.avatarUrl),
  };
}

function mapFriend(friend: FriendDto): Friend {
  return {
    ...friend,
    avatarUrl: mediaUrl(friend.avatarUrl),
  };
}

function mapMember(member: RoomDetailDto['members'][number]): RoomMemberProfile {
  return {
    id: member.id,
    username: member.username,
    displayName: member.displayName,
    bio: member.bio,
    avatarUrl: mediaUrl(member.avatarUrl),
    role: member.role,
  };
}

function mapRoom(room: RoomDto): ConversationRoom {
  return {
    id: room.id,
    name: room.name,
    type: room.type,
    avatarUrl: mediaUrl(room.avatarUrl),
    memberCount: room.memberCount,
    members: room.members,
    adminId: room.adminId,
    adminName: room.adminName,
    lastMessageText: room.lastMessageText || 'No messages yet',
    timerMinutes: toTimerMinutes(room.timerMinutes),
    recipientId: room.recipientId,
    unreadCount: room.unreadCount,
  };
}

function mapMessage(message: MessageDto, currentUserId: string): Message {
  return {
    id: message.id,
    roomId: message.roomId,
    senderId: message.senderId,
    senderName: message.senderName,
    senderAvatar: mediaUrl(message.senderAvatar),
    text: message.text,
    photoUrl: undefined,
    photoPath: message.photoUrl,
    sentAt: message.sentAt,
    firstReadAt: message.firstReadAt,
    firstReadBy: message.firstReadBy,
    readBy: message.readBy ?? [],
    timerDurationMs: message.timerDurationMs,
    expiresAt: message.expiresAt,
    isOutgoing: message.senderId === currentUserId,
    status: message.status,
  };
}

function sortMessages(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => a.sentAt - b.sentAt);
}

// ---------------- Demo Simulation Data & Helpers ----------------

export const DEMO_FRIENDS: Friend[] = [
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

export const DEMO_GROUP_MEMBERS: RoomMemberProfile[] = [
  {
    id: 'user-meera',
    username: '@meera',
    displayName: 'Meera',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    bio: 'Capturing light & temporary memories. 📸',
    role: 'ADMIN',
  },
  {
    id: 'user-kabir',
    username: '@kabir',
    displayName: 'Kabir',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bio: 'Coffee, code, and fleeting conversations. ☕',
    role: 'MEMBER',
  },
  {
    id: 'user-tanya',
    username: '@tanya',
    displayName: 'Tanya',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    bio: 'Present in the moment. ✨',
    role: 'MEMBER',
  },
  {
    id: 'user-me',
    username: '@pkdev',
    displayName: 'Priyanx',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    bio: 'Just a moment here. ✨',
    role: 'MEMBER',
  },
  {
    id: 'user-aryan',
    username: '@aryan',
    displayName: 'Aryan',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    bio: 'Living in the moment. Leaving no digital footprints. 🌌',
    role: 'MEMBER',
  },
  {
    id: 'user-rohan',
    username: '@rohan',
    displayName: 'Rohan',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    bio: 'Night walks and ambient music.',
    role: 'MEMBER',
  },
  {
    id: 'user-sneha',
    username: '@sneha',
    displayName: 'Sneha',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
    bio: 'Design, typography, and clean lines.',
    role: 'MEMBER',
  },
  {
    id: 'user-zara',
    username: '@zara',
    displayName: 'Zara',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    bio: 'Always on the go. ✈️',
    role: 'MEMBER',
  },
  {
    id: 'user-dev',
    username: '@dev',
    displayName: 'Dev',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    bio: 'Building things that vanish cleanly.',
    role: 'MEMBER',
  },
  {
    id: 'user-aditi',
    username: '@aditi',
    displayName: 'Aditi',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    bio: 'Reading between the lines.',
    role: 'MEMBER',
  },
  {
    id: 'user-vikram',
    username: '@vikram',
    displayName: 'Vikram',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
    bio: 'Looking at stars.',
    role: 'MEMBER',
  },
  {
    id: 'user-ananya',
    username: '@ananya',
    displayName: 'Ananya',
    avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80',
    bio: 'Silence is luxury.',
    role: 'MEMBER',
  },
];

export const INITIAL_DEMO_ROOMS: ConversationRoom[] = [
  {
    id: 'room-late-night',
    name: 'Late Night Crew 🌙',
    type: 'group',
    avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
    memberCount: 12,
    members: ['user-meera', 'user-kabir', 'user-tanya', 'user-me', 'user-aryan', 'user-rohan', 'user-sneha', 'user-zara', 'user-dev', 'user-aditi', 'user-vikram', 'user-ananya'],
    memberProfiles: DEMO_GROUP_MEMBERS,
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
    lastMessageText: 'Done!',
    timerMinutes: 5,
  },
  {
    id: 'room-project-squad',
    name: 'Project Squad',
    type: 'group',
    avatarUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&auto=format&fit=crop&q=80',
    memberCount: 5,
    members: ['user-kabir', 'user-aryan', 'user-me', 'user-sneha', 'user-rohan'],
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
    members: ['user-aryan', 'user-meera', 'user-tanya', 'user-me', 'user-dev', 'user-zara', 'user-aditi', 'user-vikram'],
    adminId: 'user-aryan',
    adminName: 'Aryan',
    lastMessageText: 'Anyone up for the stargazing drive?',
    timerMinutes: 15,
  },
];

export function getDemoRooms(): ConversationRoom[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TIMERS);
    if (!raw) return INITIAL_DEMO_ROOMS;
    const timers = JSON.parse(raw);
    return INITIAL_DEMO_ROOMS.map((room) => ({
      ...room,
      timerMinutes: toTimerMinutes(timers[room.id] ?? room.timerMinutes),
    }));
  } catch {
    return INITIAL_DEMO_ROOMS;
  }
}

export const getSeedMessages = (): Record<string, Message[]> => {
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
        expiresAt: now - 120000 + 5 * 60 * 1000,
        isOutgoing: false,
        status: 'read',
      },
      {
        id: 'msg-seed-a2',
        roomId: 'room-aryan',
        senderId: 'user-me',
        senderName: 'You',
        senderAvatar: DEMO_USER.avatarUrl,
        text: 'Kal mil rahe ho?',
        sentAt: now - 120000,
        firstReadAt: now - 90000,
        firstReadBy: 'user-aryan',
        readBy: ['user-aryan'],
        timerDurationMs: 5 * 60 * 1000,
        expiresAt: now - 90000 + 5 * 60 * 1000,
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
        expiresAt: now - 50000 + 5 * 60 * 1000,
        isOutgoing: false,
        status: 'read',
      },
      {
        id: 'msg-seed-a4',
        roomId: 'room-aryan',
        senderId: 'user-me',
        senderName: 'You',
        senderAvatar: DEMO_USER.avatarUrl,
        text: 'Done!',
        sentAt: now - 30000,
        firstReadAt: now - 20000,
        firstReadBy: 'user-aryan',
        readBy: ['user-aryan'],
        timerDurationMs: 5 * 60 * 1000,
        expiresAt: now - 20000 + 5 * 60 * 1000,
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
        firstReadBy: 'user-kabir',
        readBy: ['user-kabir', 'user-me', 'user-tanya'],
        timerDurationMs: 30 * 60 * 1000,
        expiresAt: now - 300000 + 30 * 60 * 1000,
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
        firstReadBy: 'user-meera',
        readBy: ['user-meera', 'user-me'],
        timerDurationMs: 30 * 60 * 1000,
        expiresAt: now - 180000 + 30 * 60 * 1000,
        isOutgoing: false,
        status: 'read',
      },
      {
        id: 'msg-seed-ln3',
        roomId: 'room-late-night',
        senderId: 'user-me',
        senderName: 'You',
        senderAvatar: DEMO_USER.avatarUrl,
        text: 'Haan, docs bhej do.',
        sentAt: now - 120000,
        firstReadAt: now - 60000,
        firstReadBy: 'user-tanya',
        readBy: ['user-tanya', 'user-meera'],
        timerDurationMs: 30 * 60 * 1000,
        expiresAt: now - 60000 + 30 * 60 * 1000,
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
        firstReadBy: 'user-meera',
        readBy: ['user-meera', 'user-kabir'],
        timerDurationMs: 30 * 60 * 1000,
        expiresAt: now - 30000 + 30 * 60 * 1000,
        isOutgoing: false,
        status: 'read',
      },
    ],
  };
};

function safeSaveToLocalStorage(data: Record<string, Message[]>): boolean {
  try {
    localStorage.setItem(STORAGE_KEY_MESSAGES_V2, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn('[BLINK Demo Persistence] localStorage write failed or quota exceeded:', error);
    return false;
  }
}

export function loadAndMigrateMessages(): Record<string, Message[]> {
  const seed = getSeedMessages();

  try {
    const v2Raw = localStorage.getItem(STORAGE_KEY_MESSAGES_V2);
    const v1Raw = localStorage.getItem(STORAGE_KEY_MESSAGES_V1);

    let baseData: Record<string, Message[]> = {};

    if (v2Raw) {
      baseData = JSON.parse(v2Raw);
    } else if (v1Raw) {
      baseData = JSON.parse(v1Raw);
    }

    if (v1Raw && v2Raw) {
      try {
        const v1Parsed: Record<string, Message[]> = JSON.parse(v1Raw);
        for (const [roomId, v1Msgs] of Object.entries(v1Parsed)) {
          if (!baseData[roomId] || baseData[roomId].length === 0) {
            baseData[roomId] = v1Msgs;
          } else {
            const existingIds = new Set(baseData[roomId].map((m) => m.id));
            const missingFromV2 = v1Msgs.filter((m) => !existingIds.has(m.id));
            if (missingFromV2.length > 0) {
              baseData[roomId] = [...baseData[roomId], ...missingFromV2];
            }
          }
        }
      } catch (e) {
        console.warn('[BLINK Migration] Failed to merge v1 secondary data:', e);
      }
    }

    if (Object.keys(baseData).length === 0) {
      safeSaveToLocalStorage(seed);
      return seed;
    }

    if (!baseData['room-late-night'] || baseData['room-late-night'].length === 0) {
      baseData['room-late-night'] = seed['room-late-night'] || [];
    }

    const processed: Record<string, Message[]> = {};
    for (const [roomId, roomMsgs] of Object.entries(baseData)) {
      if (!Array.isArray(roomMsgs)) continue;

      const deduplicated: Message[] = [];
      const seenIds = new Set<string>();

      for (const rawMsg of roomMsgs) {
        if (!rawMsg || !rawMsg.id || seenIds.has(rawMsg.id)) continue;
        seenIds.add(rawMsg.id);

        const normalizedFirstReadBy = normalizeMemberId(rawMsg.firstReadBy);
        const normalizedReadBy = Array.isArray(rawMsg.readBy)
          ? Array.from(
              new Set(
                rawMsg.readBy
                  .map((r) => normalizeMemberId(r))
                  .filter((r): r is string => Boolean(r))
              )
            )
          : [];

        const normalizedMsg: Message = {
          ...rawMsg,
          firstReadBy: normalizedFirstReadBy,
          readBy: normalizedReadBy,
          expiresAt: calculateExpirationTime(rawMsg),
        };

        if (!isMessageExpired(normalizedMsg)) {
          deduplicated.push(normalizedMsg);
        }
      }

      processed[roomId] = deduplicated;
    }

    safeSaveToLocalStorage(processed);
    return processed;
  } catch (err) {
    console.error('[BLINK Migration] Migration error, falling back to seed:', err);
    safeSaveToLocalStorage(seed);
    return seed;
  }
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isDemoMode,
    currentUser: authUser,
    logout: authLogout,
  } = useAuth();

  const [authStatus, setAuthStatus] = useState<AuthStatus>(() => {
    if (isDemoMode) return 'authenticated';
    return 'loading';
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    if (isDemoMode) return authUser.id ? authUser : DEMO_USER;
    return EMPTY_USER;
  });
  const [friends, setFriends] = useState<Friend[]>(() => {
    if (isDemoMode) return DEMO_FRIENDS;
    return [];
  });
  const [rooms, setRooms] = useState<ConversationRoom[]>(() => {
    if (isDemoMode) return getDemoRooms();
    return [];
  });
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    if (isDemoMode) return loadAndMigrateMessages();
    return {};
  });
  const [roomMembers, setRoomMembers] = useState<Record<string, RoomMemberProfile[]>>(() => {
    const initial: Record<string, RoomMemberProfile[]> = {};
    if (isDemoMode) {
      initial['room-late-night'] = DEMO_GROUP_MEMBERS;
    }
    return initial;
  });
  const [profileCache, setProfileCache] = useState<Record<string, UserProfile>>({});
  const [activeRoomTimer, setActiveRoomTimer] = useState<TimerOptionMinutes>(15);
  const [storageError, setStorageError] = useState<string | null>(null);

  const socketRef = useRef<ChatSocket | null>(null);
  const currentUserRef = useRef<UserProfile>(EMPTY_USER);
  const friendsRef = useRef<Friend[]>([]);
  const roomsRef = useRef<ConversationRoom[]>([]);
  const profileCacheRef = useRef<Record<string, UserProfile>>({});
  const activeRoomIdRef = useRef<string | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const photoUrlCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    friendsRef.current = friends;
  }, [friends]);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    profileCacheRef.current = profileCache;
  }, [profileCache]);

  const revokeObjectUrls = useCallback(() => {
    photoUrlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
    photoUrlCacheRef.current.clear();
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
  }, []);

  const hydratePhotos = useCallback(async (list: Message[]): Promise<Message[]> => {
    return Promise.all(
      list.map(async (message) => {
        if (!message.photoPath) return message;

        const cached = photoUrlCacheRef.current.get(message.photoPath);
        if (cached) {
          return { ...message, photoUrl: cached };
        }

        try {
          const url = await fetchObjectUrl(message.photoPath);
          photoUrlCacheRef.current.set(message.photoPath, url);
          objectUrlsRef.current.add(url);
          return { ...message, photoUrl: url };
        } catch {
          return message;
        }
      })
    );
  }, []);

  const upsertMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const current = prev[message.roomId] ?? [];
      const index = current.findIndex((item) => item.id === message.id);
      if (index === -1) {
        return { ...prev, [message.roomId]: sortMessages([...current, message]) };
      }

      const existing = current[index];
      const next = [...current];
      next[index] = {
        ...existing,
        ...message,
        photoUrl: message.photoUrl ?? existing.photoUrl,
        photoPath: message.photoPath ?? existing.photoPath,
      };
      return { ...prev, [message.roomId]: next };
    });

    setRooms((prev) =>
      prev.map((room) =>
        room.id === message.roomId
          ? {
              ...room,
              lastMessageText: message.photoUrl ? '📷 Photo' : message.text || room.lastMessageText,
              unreadCount:
                message.isOutgoing || activeRoomIdRef.current === message.roomId
                  ? room.unreadCount
                  : (room.unreadCount ?? 0) + 1,
            }
          : room
      )
    );
  }, []);

  const applyRoomDetail = useCallback((detail: RoomDetailDto) => {
    const room = mapRoom(detail.room);
    const members = detail.members.map(mapMember);

    setRooms((prev) => {
      const exists = prev.some((item) => item.id === room.id);
      return exists
        ? prev.map((item) => (item.id === room.id ? { ...item, ...room, memberProfiles: members } : item))
        : [{ ...room, memberProfiles: members }, ...prev];
    });
    setRoomMembers((prev) => ({ ...prev, [room.id]: members }));

    return room;
  }, []);

  const simulateRecipientRead = useCallback((roomId: string, messageId: string) => {
    const readTimestamp = Date.now();
    setMessages((prev) => {
      const roomMsgs = prev[roomId] || [];
      const updated = roomMsgs.map((msg) => {
        if (msg.id === messageId && !msg.firstReadAt) {
          const timerDurationMs = msg.timerDurationMs || 5 * 60 * 1000;
          return {
            ...msg,
            firstReadAt: readTimestamp,
            firstReadBy: 'user-aryan',
            readBy: ['user-aryan'],
            expiresAt: Math.min(msg.sentAt + 60 * 60 * 1000, readTimestamp + timerDurationMs),
            status: 'read' as const,
          };
        }
        return msg;
      });
      const nextState = { ...prev, [roomId]: updated };
      safeSaveToLocalStorage(nextState);
      return nextState;
    });
  }, []);

  const simulateGroupMemberRead = useCallback((roomId: string, messageId: string, memberId: string) => {
    const readTimestamp = Date.now();
    const stableId = normalizeMemberId(memberId) || memberId;

    setMessages((prev) => {
      const roomMsgs = prev[roomId] || [];
      const updated = roomMsgs.map((msg) => {
        if (msg.id === messageId) {
          const currentReadBy = msg.readBy || [];
          const updatedReadBy = currentReadBy.includes(stableId)
            ? currentReadBy
            : [...currentReadBy, stableId];

          if (msg.firstReadAt === null) {
            const timerDurationMs = msg.timerDurationMs || 30 * 60 * 1000;
            return {
              ...msg,
              firstReadAt: readTimestamp,
              firstReadBy: stableId,
              readBy: updatedReadBy,
              expiresAt: Math.min(msg.sentAt + 60 * 60 * 1000, readTimestamp + timerDurationMs),
              status: 'read' as const,
            };
          } else {
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
  }, []);

  const markIncomingAsRead = useCallback(
    (roomId: string) => {
      const userId = currentUserRef.current.id || (isDemoMode ? DEMO_USER.id : '');
      if (!roomId || !userId) return;

      const now = Date.now();
      setMessages((prev) => {
        const list = prev[roomId];
        if (!list) return prev;

        let changed = false;
        const next = list.map((message) => {
          if (message.isOutgoing) return message;

          const readBy = message.readBy ?? [];
          const alreadyRead = readBy.includes(userId);
          if (message.firstReadAt !== null && alreadyRead) return message;

          changed = true;
          const firstReadAt = message.firstReadAt ?? now;
          const timerDurationMs = message.timerDurationMs || 15 * 60 * 1000;
          return {
            ...message,
            firstReadAt,
            firstReadBy: message.firstReadBy ?? userId,
            readBy: alreadyRead ? readBy : [...readBy, userId],
            expiresAt: message.expiresAt || Math.min(message.sentAt + 60 * 60 * 1000, firstReadAt + timerDurationMs),
            status: 'read' as const,
          };
        });

        if (changed && isDemoMode) {
          safeSaveToLocalStorage({ ...prev, [roomId]: next });
        }

        return changed ? { ...prev, [roomId]: next } : prev;
      });

      setRooms((prev) =>
        prev.map((room) => (room.id === roomId ? { ...room, unreadCount: 0 } : room))
      );

      if (!isDemoMode) {
        void messageApi.markRead(roomId).catch(() => undefined);
      }
    },
    [isDemoMode]
  );

  const handleNewMessage = useCallback(
    (dto: MessageDto) => {
      const message = mapMessage(dto, currentUserRef.current.id);
      void hydratePhotos([message]).then(([hydrated]) => {
        upsertMessage(hydrated);
      });

      if (
        dto.senderId !== currentUserRef.current.id &&
        activeRoomIdRef.current === dto.roomId
      ) {
        markIncomingAsRead(dto.roomId);
      }
    },
    [hydratePhotos, markIncomingAsRead, upsertMessage]
  );

  const startRealtime = useCallback(() => {
    if (isDemoMode) return;
    socketRef.current?.disconnect();
    const token = getAccessToken();
    if (!token) return;

    const socket = createChatSocket(token);
    socketRef.current = socket;

    socket.on('ws:new_message', handleNewMessage);

    socket.on('ws:message_read', (payload) => {
      setMessages((prev) => {
        const list = prev[payload.roomId];
        if (!list) return prev;

        return {
          ...prev,
          [payload.roomId]: list.map((message) => {
            if (message.id !== payload.messageId) return message;
            const firstReadAt = payload.firstReadAt ?? message.firstReadAt;
            return {
              ...message,
              readBy: payload.readBy,
              firstReadAt,
              firstReadBy: payload.firstReadBy ?? message.firstReadBy,
              status: firstReadAt ? ('read' as const) : message.status,
            };
          }),
        };
      });
    });

    socket.on('ws:message_expired', (payload) => {
      setMessages((prev) => {
        const list = prev[payload.roomId];
        if (!list) return prev;

        return {
          ...prev,
          [payload.roomId]: list.map((message) =>
            message.id === payload.messageId ? { ...message, expiresAt: Date.now() } : message
          ),
        };
      });
    });

    socket.on('ws:message_deleted', (payload) => {
      setMessages((prev) => {
        const list = prev[payload.roomId];
        if (!list) return prev;
        return {
          ...prev,
          [payload.roomId]: list.filter((message) => message.id !== payload.messageId),
        };
      });
    });

    socket.on('ws:room_timer_updated', (payload) => {
      const timerMinutes = toTimerMinutes(payload.timerMinutes);
      setRooms((prev) =>
        prev.map((room) =>
          room.id === payload.roomId ? { ...room, timerMinutes } : room
        )
      );
      if (activeRoomIdRef.current === payload.roomId) {
        setActiveRoomTimer(timerMinutes);
      }
    });

    const refreshRoom = (roomId: string) => {
      void roomApi
        .get(roomId)
        .then((detail) => applyRoomDetail(detail))
        .catch(() => undefined);
    };

    socket.on('ws:member_joined', (payload) => refreshRoom(payload.roomId));
    socket.on('ws:member_left', (payload) => refreshRoom(payload.roomId));

    socket.on('connect_error', () => {
      void refreshSession()
        .then((session) => {
          socket.auth = { token: session.accessToken };
        })
        .catch(() => undefined);
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        void refreshSession()
          .then((session) => {
            socket.auth = { token: session.accessToken };
            socket.connect();
          })
          .catch(() => undefined);
      }
    });
  }, [applyRoomDetail, handleNewMessage, isDemoMode]);

  const loadWorkspace = useCallback(async () => {
    const [roomList, friendList] = await Promise.all([roomApi.list(), friendApi.list()]);
    setRooms(roomList.map(mapRoom));
    setFriends(friendList.map(mapFriend));
  }, []);

  const applySession = useCallback(
    async (session: AuthSessionDto) => {
      setAccessToken(session.accessToken);
      setRefreshToken(session.refreshToken);

      const user = mapUser(session.user);
      currentUserRef.current = user;
      setCurrentUser(user);
      setAuthStatus('authenticated');
      setAuthError(null);
      setActiveRoomTimer(toTimerMinutes(user.defaultTimerMinutes));

      try {
        await loadWorkspace();
      } catch (error) {
        setStorageError(errorMessage(error));
      }

      startRealtime();
    },
    [loadWorkspace, startRealtime]
  );

  const clearLocalSession = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    activeRoomIdRef.current = null;
    currentUserRef.current = EMPTY_USER;

    revokeObjectUrls();

    setCurrentUser(EMPTY_USER);
    setFriends([]);
    setRooms([]);
    setMessages({});
    setRoomMembers({});
    setProfileCache({});
    setActiveRoomTimer(15);
  }, [revokeObjectUrls]);

  // Synchronize state when switching into / out of demo mode
  useEffect(() => {
    if (isDemoMode) {
      setCurrentUser(authUser.id ? authUser : DEMO_USER);
      setFriends(DEMO_FRIENDS);
      setRooms(getDemoRooms());
      setRoomMembers({ 'room-late-night': DEMO_GROUP_MEMBERS });
      setMessages(loadAndMigrateMessages());
      setActiveRoomTimer(15);
      setAuthStatus('authenticated');
      setStorageError(null);
    } else {
      if (!getRefreshToken()) {
        clearLocalSession();
        setAuthStatus('unauthenticated');
      }
    }
  }, [isDemoMode, authUser, clearLocalSession]);

  // Restore a tab session from the refresh token on mount, then load the workspace.
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (isDemoMode) {
        setAuthStatus('authenticated');
        return;
      }

      if (!getRefreshToken()) {
        setAuthStatus('unauthenticated');
        return;
      }

      try {
        const session = await refreshSession();
        if (cancelled) return;
        await applySession(session);
      } catch {
        if (cancelled) return;
        clearTokens();
        clearLocalSession();
        setAuthStatus('unauthenticated');
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [applySession, clearLocalSession, isDemoMode]);

  useEffect(() => {
    setAuthExpiredHandler(() => {
      if (isDemoMode) return;
      clearTokens();
      clearLocalSession();
      setAuthStatus('unauthenticated');
      setAuthError('Your session expired. Please sign in again.');
    });

    return () => setAuthExpiredHandler(null);
  }, [clearLocalSession, isDemoMode]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      revokeObjectUrls();
    };
  }, [revokeObjectUrls]);

  const login = useCallback(
    async (username: string, password: string) => {
      setIsAuthenticating(true);
      setAuthError(null);
      try {
        const session = await authApi.login({ username, password });
        await applySession(session);
        return true;
      } catch (error) {
        setAuthError(errorMessage(error));
        setAuthStatus('unauthenticated');
        return false;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [applySession]
  );

  const register = useCallback(
    async (username: string, displayName: string, password: string) => {
      setIsAuthenticating(true);
      setAuthError(null);
      try {
        const session = await authApi.register({ username, displayName, password });
        await applySession(session);
        return true;
      } catch (error) {
        setAuthError(errorMessage(error));
        setAuthStatus('unauthenticated');
        return false;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    if (isDemoMode) {
      authLogout();
      clearLocalSession();
      return;
    }

    const refreshToken = getRefreshToken();

    clearLocalSession();
    clearTokens();
    setAuthStatus('unauthenticated');
    setAuthError(null);

    if (refreshToken) {
      await authApi.logout(refreshToken);
    }
  }, [authLogout, clearLocalSession, isDemoMode]);

  const openRoom = useCallback(
    async (roomId: string) => {
      if (!roomId) return;
      activeRoomIdRef.current = roomId;

      if (isDemoMode) {
        const room = roomsRef.current.find((r) => r.id === roomId);
        if (room) {
          setActiveRoomTimer(room.timerMinutes);
        }
        markIncomingAsRead(roomId);
        return;
      }

      socketRef.current?.emit('ws:join_room', { roomId });

      try {
        const [detail, page] = await Promise.all([
          roomApi.get(roomId),
          messageApi.list(roomId),
        ]);

        const room = applyRoomDetail(detail);
        setActiveRoomTimer(room.timerMinutes);

        const incoming = await hydratePhotos(
          page.messages.map((message) => mapMessage(message, currentUserRef.current.id))
        );

        setMessages((prev) => {
          const existing = prev[roomId] ?? [];
          const byId = new Map(existing.map((message) => [message.id, message]));

          for (const message of incoming) {
            const previous = byId.get(message.id);
            byId.set(
              message.id,
              previous
                ? {
                    ...previous,
                    ...message,
                    photoUrl: message.photoUrl ?? previous.photoUrl,
                    photoPath: message.photoPath ?? previous.photoPath,
                  }
                : message
            );
          }

          return { ...prev, [roomId]: sortMessages([...byId.values()]) };
        });

        setRooms((prev) =>
          prev.map((item) => (item.id === roomId ? { ...item, unreadCount: 0 } : item))
        );

        markIncomingAsRead(roomId);
      } catch (error) {
        setStorageError(errorMessage(error));
      }
    },
    [applyRoomDetail, hydratePhotos, isDemoMode, markIncomingAsRead]
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      if (activeRoomIdRef.current === roomId) {
        activeRoomIdRef.current = null;
      }
      if (!isDemoMode) {
        socketRef.current?.emit('ws:leave_room', { roomId });
      }
    },
    [isDemoMode]
  );

  const ensurePrivateRoom = useCallback(
    async (friendId: string): Promise<string | null> => {
      const existing = roomsRef.current.find(
        (room) => room.type === 'private' && room.recipientId === friendId
      );
      if (existing) return existing.id;

      if (isDemoMode) {
        const friend = friendsRef.current.find((item) => item.id === friendId);
        const newRoom: ConversationRoom = {
          id: `room-${friendId}`,
          name: friend?.displayName || 'Private Chat',
          type: 'private',
          avatarUrl: friend?.avatarUrl || '',
          recipientId: friendId,
          lastMessageText: 'Tap to chat',
          timerMinutes: 15,
        };
        setRooms((prev) => [newRoom, ...prev]);
        return newRoom.id;
      }

      try {
        const dto = await roomApi.createPrivate(friendId);
        const room = mapRoom(dto);
        setRooms((prev) =>
          prev.some((item) => item.id === room.id) ? prev : [room, ...prev]
        );
        return room.id;
      } catch (error) {
        setStorageError(errorMessage(error));
        return null;
      }
    },
    [isDemoMode]
  );

  const getProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      if (!userId) return null;
      if (userId === currentUserRef.current.id) return currentUserRef.current;

      const cached = profileCacheRef.current[userId];
      if (cached) return cached;

      const friend = friendsRef.current.find((item) => item.id === userId);
      if (friend) {
        const profile: UserProfile = {
          id: friend.id,
          username: friend.username,
          displayName: friend.displayName,
          bio: friend.bio,
          avatarUrl: friend.avatarUrl,
        };
        setProfileCache((prev) => ({ ...prev, [userId]: profile }));
        return profile;
      }

      if (isDemoMode) {
        const member = DEMO_GROUP_MEMBERS.find((m) => m.id === userId);
        if (member) {
          const profile: UserProfile = {
            id: member.id,
            username: member.username,
            displayName: member.displayName,
            bio: member.bio,
            avatarUrl: member.avatarUrl,
          };
          setProfileCache((prev) => ({ ...prev, [userId]: profile }));
          return profile;
        }
        return null;
      }

      try {
        const dto = await userApi.get(userId);
        const profile = mapUser(dto);
        setProfileCache((prev) => ({ ...prev, [userId]: profile }));
        return profile;
      } catch {
        return null;
      }
    },
    [isDemoMode]
  );

  const sendMessage = useCallback(
    async (roomId: string, text: string, photo?: File): Promise<boolean> => {
      const trimmed = text.trim();
      if (!roomId || (!trimmed && !photo)) return false;

      if (isDemoMode) {
        let photoUrl: string | undefined;
        if (photo) {
          photoUrl = URL.createObjectURL(photo);
          objectUrlsRef.current.add(photoUrl);
        }

        const room = roomsRef.current.find((r) => r.id === roomId);
        const timerMinutes = room?.timerMinutes ?? 15;
        const timerDurationMs = timerMinutes * 60 * 1000;
        const now = Date.now();

        const newMsg: Message = {
          id: `msg-demo-${now}-${Math.random().toString(36).substring(2, 7)}`,
          roomId,
          senderId: currentUserRef.current.id || DEMO_USER.id,
          senderName: 'You',
          senderAvatar: currentUserRef.current.avatarUrl || DEMO_USER.avatarUrl,
          text: trimmed,
          photoUrl,
          sentAt: now,
          firstReadAt: null, // First Seen Starts Timer!
          firstReadBy: null,
          readBy: [],
          timerDurationMs,
          expiresAt: now + 60 * 60 * 1000, // 60-min maximum lifetime ceiling for unread messages
          isOutgoing: true,
          status: 'sent',
        };

        upsertMessage(newMsg);

        setMessages((prev) => {
          const next = { ...prev, [roomId]: [...(prev[roomId] ?? []), newMsg] };
          safeSaveToLocalStorage(next);
          return next;
        });

        // In 1-on-1 private chat with Aryan, simulate Aryan reading it after 2.5s
        if (roomId === 'room-aryan') {
          setTimeout(() => {
            simulateRecipientRead(roomId, newMsg.id);
          }, 2500);
        }

        return true;
      }

      try {
        let photoUrl: string | undefined;
        if (photo) {
          const upload = await messageApi.uploadPhoto(roomId, photo);
          photoUrl = upload.photoUrl;
        }

        const dto = await messageApi.send(roomId, {
          text: trimmed || undefined,
          photoUrl,
        });

        const [hydrated] = await hydratePhotos([
          mapMessage(dto, currentUserRef.current.id),
        ]);
        upsertMessage(hydrated);
        return true;
      } catch (error) {
        setStorageError(errorMessage(error));
        return false;
      }
    },
    [hydratePhotos, isDemoMode, simulateRecipientRead, upsertMessage]
  );

  const evictExpiredMessage = useCallback(
    (roomId: string, messageId: string) => {
      setMessages((prev) => {
        const list = prev[roomId];
        if (!list) return prev;

        const target = list.find((message) => message.id === messageId);
        if (target?.photoUrl && target.photoUrl.startsWith('blob:')) {
          URL.revokeObjectURL(target.photoUrl);
          objectUrlsRef.current.delete(target.photoUrl);
        }
        if (target?.photoPath) {
          const url = photoUrlCacheRef.current.get(target.photoPath);
          if (url) {
            URL.revokeObjectURL(url);
            objectUrlsRef.current.delete(url);
            photoUrlCacheRef.current.delete(target.photoPath);
          }
        }

        const next = {
          ...prev,
          [roomId]: list.filter((message) => message.id !== messageId),
        };

        if (isDemoMode) {
          safeSaveToLocalStorage(next);
        }

        return next;
      });
    },
    [isDemoMode]
  );

  const setRoomTimer = useCallback(
    async (roomId: string, minutes: TimerOptionMinutes) => {
      if (isDemoMode) {
        setRooms((prev) =>
          prev.map((item) => (item.id === roomId ? { ...item, timerMinutes: minutes } : item))
        );
        if (activeRoomIdRef.current === roomId) {
          setActiveRoomTimer(minutes);
        }
        try {
          const raw = localStorage.getItem(STORAGE_KEY_TIMERS) || '{}';
          const timers = JSON.parse(raw);
          timers[roomId] = minutes;
          localStorage.setItem(STORAGE_KEY_TIMERS, JSON.stringify(timers));
        } catch {
          // ignore
        }
        return;
      }

      try {
        const dto = await roomApi.updateTimer(roomId, minutes);
        const room = mapRoom(dto);
        setRooms((prev) =>
          prev.map((item) => (item.id === roomId ? { ...item, ...room } : item))
        );
        if (activeRoomIdRef.current === roomId) {
          setActiveRoomTimer(minutes);
        }
      } catch (error) {
        setStorageError(errorMessage(error));
      }
    },
    [isDemoMode]
  );

  const setDefaultTimer = useCallback(
    async (minutes: TimerOptionMinutes) => {
      if (isDemoMode) {
        setCurrentUser((prev) => ({ ...prev, defaultTimerMinutes: minutes }));
        if (!activeRoomIdRef.current) {
          setActiveRoomTimer(minutes);
        }
        return;
      }

      try {
        const dto = await userApi.updateMe({ defaultTimerMinutes: minutes });
        const user = mapUser(dto);
        currentUserRef.current = user;
        setCurrentUser(user);
        if (!activeRoomIdRef.current) {
          setActiveRoomTimer(minutes);
        }
      } catch (error) {
        setStorageError(errorMessage(error));
      }
    },
    [isDemoMode]
  );

  const getFriendById = useCallback(
    (friendId: string) => friends.find((friend) => friend.id === friendId),
    [friends]
  );

  const getRoomById = useCallback(
    (roomId: string) => rooms.find((room) => room.id === roomId),
    [rooms]
  );

  const clearStorageError = useCallback(() => setStorageError(null), []);
  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <ChatContext.Provider
      value={{
        authStatus,
        authError,
        isAuthenticating,
        login,
        register,
        logout,
        clearAuthError,
        currentUser,
        friends,
        rooms,
        messages,
        roomMembers,
        profileCache,
        activeRoomTimer,
        storageError,
        clearStorageError,
        openRoom,
        leaveRoom,
        ensurePrivateRoom,
        getProfile,
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
