import { apiRequest, API_BASE_URL } from './client';
import type {
  AuthSessionDto,
  AuthUserDto,
  FriendDto,
  MessageDto,
  MessagePageDto,
  PhotoUploadDto,
  RoomDetailDto,
  RoomDto,
} from './types';

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  displayName: string;
  password: string;
}

export const authApi = {
  login: (input: LoginInput) =>
    apiRequest<AuthSessionDto>('/api/auth/login', { method: 'POST', body: input }),

  register: (input: RegisterInput) =>
    apiRequest<AuthSessionDto>('/api/auth/register', { method: 'POST', body: input }),

  me: () => apiRequest<AuthUserDto>('/api/auth/me'),

  /** Possession-based logout: revokes exactly the presented refresh token. */
  logout: async (refreshToken: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  },
};

export const userApi = {
  me: () => apiRequest<AuthUserDto>('/api/users/me'),

  get: (userId: string) => apiRequest<AuthUserDto>(`/api/users/${userId}`),

  search: (query: string) =>
    apiRequest<AuthUserDto[]>(`/api/users/search?q=${encodeURIComponent(query)}`),

  updateMe: (input: { displayName?: string; bio?: string; defaultTimerMinutes?: number }) =>
    apiRequest<AuthUserDto>('/api/users/me', { method: 'PATCH', body: input }),
};

export const friendApi = {
  list: () => apiRequest<FriendDto[]>('/api/friends'),
};

export const roomApi = {
  list: () => apiRequest<RoomDto[]>('/api/rooms'),

  get: (roomId: string) => apiRequest<RoomDetailDto>(`/api/rooms/${roomId}`),

  createPrivate: (recipientId: string) =>
    apiRequest<RoomDto>('/api/rooms/private', { method: 'POST', body: { recipientId } }),

  createGroup: (input: { name: string; memberIds: string[]; timerMinutes?: number }) =>
    apiRequest<RoomDetailDto>('/api/rooms/group', { method: 'POST', body: input }),

  updateTimer: (roomId: string, timerMinutes: number) =>
    apiRequest<RoomDto>(`/api/rooms/${roomId}/timer`, {
      method: 'PATCH',
      body: { timerMinutes },
    }),
};

export const messageApi = {
  list: (roomId: string, limit = 50) =>
    apiRequest<MessagePageDto>(`/api/rooms/${roomId}/messages?limit=${limit}`),

  send: (roomId: string, input: { text?: string; photoUrl?: string }) =>
    apiRequest<MessageDto>(`/api/rooms/${roomId}/messages`, { method: 'POST', body: input }),

  markRead: (roomId: string) =>
    apiRequest<{ readCount: number }>(`/api/rooms/${roomId}/messages/read`, { method: 'POST' }),

  uploadPhoto: (roomId: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return apiRequest<PhotoUploadDto>(`/api/rooms/${roomId}/messages/photo`, {
      method: 'POST',
      formData,
    });
  },

  remove: (roomId: string, messageId: string) =>
    apiRequest<{ deleted: true }>(`/api/rooms/${roomId}/messages/${messageId}`, {
      method: 'DELETE',
    }),
};
