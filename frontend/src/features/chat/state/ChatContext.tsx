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

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface ChatContextType {
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
  markIncomingAsRead: (roomId: string) => void;
  evictExpiredMessage: (roomId: string, messageId: string) => void;
  setRoomTimer: (roomId: string, minutes: TimerOptionMinutes) => Promise<void>;
  setDefaultTimer: (minutes: TimerOptionMinutes) => Promise<void>;
  getFriendById: (friendId: string) => Friend | undefined;
  getRoomById: (roomId: string) => ConversationRoom | undefined;
}

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

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserProfile>(EMPTY_USER);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [rooms, setRooms] = useState<ConversationRoom[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [roomMembers, setRoomMembers] = useState<Record<string, RoomMemberProfile[]>>({});
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

  const markIncomingAsRead = useCallback((roomId: string) => {
    const userId = currentUserRef.current.id;
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
        return {
          ...message,
          firstReadAt: message.firstReadAt ?? now,
          firstReadBy: message.firstReadBy ?? userId,
          readBy: alreadyRead ? readBy : [...readBy, userId],
          status: 'read' as const,
        };
      });

      return changed ? { ...prev, [roomId]: next } : prev;
    });

    setRooms((prev) =>
      prev.map((room) => (room.id === roomId ? { ...room, unreadCount: 0 } : room))
    );

    void messageApi.markRead(roomId).catch(() => undefined);
  }, []);

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

    // Socket.io keeps the access token from the handshake. Refresh it before a
    // reconnect so a stale token never leaves the realtime channel silent.
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
  }, [applyRoomDetail, handleNewMessage]);

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

  // Restore a tab session from the refresh token, then load the workspace.
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
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
    // Boot runs once; applySession/clearLocalSession are stable callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAuthExpiredHandler(() => {
      clearTokens();
      clearLocalSession();
      setAuthStatus('unauthenticated');
      setAuthError('Your session expired. Please sign in again.');
    });

    return () => setAuthExpiredHandler(null);
  }, [clearLocalSession]);

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
    const refreshToken = getRefreshToken();

    clearLocalSession();
    clearTokens();
    setAuthStatus('unauthenticated');
    setAuthError(null);

    if (refreshToken) {
      await authApi.logout(refreshToken);
    }
  }, [clearLocalSession]);

  const openRoom = useCallback(
    async (roomId: string) => {
      if (!roomId || !currentUserRef.current.id) return;

      activeRoomIdRef.current = roomId;
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
    [applyRoomDetail, hydratePhotos, markIncomingAsRead]
  );

  const leaveRoom = useCallback((roomId: string) => {
    if (activeRoomIdRef.current === roomId) {
      activeRoomIdRef.current = null;
    }
    socketRef.current?.emit('ws:leave_room', { roomId });
  }, []);

  const ensurePrivateRoom = useCallback(async (friendId: string): Promise<string | null> => {
    const existing = roomsRef.current.find(
      (room) => room.type === 'private' && room.recipientId === friendId
    );
    if (existing) return existing.id;

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
  }, []);

  const getProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
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

    try {
      const dto = await userApi.get(userId);
      const profile = mapUser(dto);
      setProfileCache((prev) => ({ ...prev, [userId]: profile }));
      return profile;
    } catch {
      return null;
    }
  }, []);

  const sendMessage = useCallback(
    async (roomId: string, text: string, photo?: File): Promise<boolean> => {
      const trimmed = text.trim();
      if (!roomId || (!trimmed && !photo)) return false;

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
    [hydratePhotos, upsertMessage]
  );

  const evictExpiredMessage = useCallback((roomId: string, messageId: string) => {
    setMessages((prev) => {
      const list = prev[roomId];
      if (!list) return prev;

      const target = list.find((message) => message.id === messageId);
      if (target?.photoPath) {
        const url = photoUrlCacheRef.current.get(target.photoPath);
        if (url) {
          URL.revokeObjectURL(url);
          objectUrlsRef.current.delete(url);
          photoUrlCacheRef.current.delete(target.photoPath);
        }
      }

      return {
        ...prev,
        [roomId]: list.filter((message) => message.id !== messageId),
      };
    });
  }, []);

  const setRoomTimer = useCallback(
    async (roomId: string, minutes: TimerOptionMinutes) => {
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
    []
  );

  const setDefaultTimer = useCallback(async (minutes: TimerOptionMinutes) => {
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
  }, []);

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
