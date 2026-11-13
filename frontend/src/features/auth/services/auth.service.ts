import { authApi, type LoginInput, type RegisterInput } from '@/shared/api/endpoints';
import type { AuthSessionDto, AuthUserDto } from '@/shared/api/types';

export const authService = {
  login: (input: LoginInput): Promise<AuthSessionDto> => authApi.login(input),
  register: (input: RegisterInput): Promise<AuthSessionDto> => authApi.register(input),
  getCurrentUser: (): Promise<AuthUserDto> => authApi.me(),
  logout: (refreshToken: string): Promise<void> => authApi.logout(refreshToken),
};

export default authService;

