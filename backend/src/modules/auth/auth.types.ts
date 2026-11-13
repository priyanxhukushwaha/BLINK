import type { UserProfileDto } from '../users/user.types';

export interface AuthSessionDto {
  user: UserProfileDto;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResultDto {
  accessToken: string;
  refreshToken: string;
}
