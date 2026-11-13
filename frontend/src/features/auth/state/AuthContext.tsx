import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AuthContextType, AuthStatus } from '../types/auth.types';
import type { UserProfile } from '@/features/profile/types/user';
import { authService } from '../services/auth.service';
import {
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  refreshSession,
  mediaUrl,
  ApiRequestError,
} from '@/shared/api/client';
import type { AuthUserDto, AuthSessionDto } from '@/shared/api/types';

const EMPTY_USER: UserProfile = {
  id: '',
  username: '',
  displayName: '',
  bio: '',
  avatarUrl: '',
};

function mapUser(user: AuthUserDto): UserProfile {
  return {
    ...user,
    avatarUrl: mediaUrl(user.avatarUrl),
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(EMPTY_USER);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const applySession = useCallback((session: AuthSessionDto) => {
    setAccessToken(session.accessToken);
    setRefreshToken(session.refreshToken);
    const user = mapUser(session.user);
    setCurrentUser(user);
    setAuthStatus('authenticated');
    setAuthError(null);
  }, []);

  const clearLocalSession = useCallback(() => {
    clearTokens();
    setCurrentUser(EMPTY_USER);
    setAuthStatus('unauthenticated');
    setAuthError(null);
  }, []);

  // Bootstrap session from stored refresh token on mount
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
        applySession(session);
      } catch {
        if (cancelled) return;
        clearLocalSession();
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [applySession, clearLocalSession]);

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      setIsAuthenticating(true);
      setAuthError(null);
      try {
        const session = await authService.login({ username, password });
        applySession(session);
        return true;
      } catch (err) {
        setAuthError(errorMessage(err));
        return false;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [applySession]
  );

  const register = useCallback(
    async (username: string, displayName: string, password: string): Promise<boolean> => {
      setIsAuthenticating(true);
      setAuthError(null);
      try {
        const session = await authService.register({ username, displayName, password });
        applySession(session);
        return true;
      } catch (err) {
        setAuthError(errorMessage(err));
        return false;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [applySession]
  );

  const logout = useCallback(async (): Promise<void> => {
    const token = getRefreshToken();
    if (token) {
      void authService.logout(token).catch(() => undefined);
    }
    clearLocalSession();
  }, [clearLocalSession]);

  return (
    <AuthContext.Provider
      value={{
        authStatus,
        authError,
        isAuthenticating,
        currentUser,
        login,
        register,
        logout,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

