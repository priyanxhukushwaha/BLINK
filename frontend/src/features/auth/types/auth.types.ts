import type { AuthUserDto } from '@/shared/api/types';
import type { UserProfile } from '@/features/profile/types/user';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  authStatus: AuthStatus;
  authError: string | null;
  isAuthenticating: boolean;
  currentUser: UserProfile;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, displayName: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

