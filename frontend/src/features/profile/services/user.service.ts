import { userApi } from '@/shared/api/endpoints';
import type { AuthUserDto } from '@/shared/api/types';

export const userService = {
  getCurrentProfile: (): Promise<AuthUserDto> => userApi.me(),
  getProfileById: (userId: string): Promise<AuthUserDto> => userApi.get(userId),
  searchUsers: (query: string): Promise<AuthUserDto[]> => userApi.search(query),
  updateProfile: (input: { displayName?: string; bio?: string; defaultTimerMinutes?: number }): Promise<AuthUserDto> =>
    userApi.updateMe(input),
};

export default userService;

