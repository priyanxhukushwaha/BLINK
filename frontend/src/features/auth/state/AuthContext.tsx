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

export const DEMO_USER: UserProfile = {
  id: 'user-me',
  username: '@pkdev',
  displayName: 'Priyanx Kushwaha',
  bio: 'Just a moment here. ✨',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  defaultTimerMinutes: 15,
  inviteLink: 'ephemeral.app/invite/pkdev',
};

const DEV_DEMO_STORAGE_KEY = 'ephemeral_dev_demo_active';

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
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (!import.meta.env.DEV) return false;
    return localStorage.getItem(DEV_DEMO_STORAGE_KEY) === 'true';
  });

  const [authStatus, setAuthStatus] = useState<AuthStatus>(() => {
    if (import.meta.env.DEV && localStorage.getItem(DEV_DEMO_STORAGE_KEY) === 'true') {
      return 'authenticated';
    }
    return 'loading';
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    if (import.meta.env.DEV && localStorage.getItem(DEV_DEMO_STORAGE_KEY) === 'true') {
      return DEMO_USER;
    }
    return EMPTY_USER;
  });

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const enterDemoMode = useCallback(() => {
    if (!import.meta.env.DEV) return;
    localStorage.setItem(DEV_DEMO_STORAGE_KEY, 'true');
    setIsDemoMode(true);
    setCurrentUser(DEMO_USER);
    setAuthStatus('authenticated');
    setAuthError(null);
  }, []);

  const exitDemoMode = useCallback(() => {
    localStorage.removeItem(DEV_DEMO_STORAGE_KEY);
    setIsDemoMode(false);
    setCurrentUser(EMPTY_USER);
    setAuthStatus('unauthenticated');
    setAuthError(null);
  }, []);

  const applySession = useCallback((session: AuthSessionDto) => {
    localStorage.removeItem(DEV_DEMO_STORAGE_KEY);
    setIsDemoMode(false);
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
      // In development demo mode, do not call backend or check refresh token
      if (import.meta.env.DEV && isDemoMode) {
        setAuthStatus('authenticated');
        setCurrentUser(DEMO_USER);
        return;
      }

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
  }, [applySession, clearLocalSession, isDemoMode]);

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
    if (isDemoMode) {
      exitDemoMode();
      return;
    }
    const token = getRefreshToken();
    if (token) {
      void authService.logout(token).catch(() => undefined);
    }
    clearLocalSession();
  }, [clearLocalSession, exitDemoMode, isDemoMode]);

  return (
    <AuthContext.Provider
      value={{
        authStatus,
        authError,
        isAuthenticating,
        currentUser,
        isDemoMode,
        enterDemoMode,
        exitDemoMode,
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

