import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, User, X } from 'lucide-react';
import { GlassCard, GlowButton, StatusBar, useNavigation } from '@/shared';
import { useAuth } from '../hooks/useAuth';

type AuthMode = 'login' | 'register';

const inputClass =
  'w-full bg-transparent text-sm text-white placeholder-purple-300/40 outline-none';

export const AuthScreen: React.FC = () => {
  const { resetTo } = useNavigation();
  const { login, register, authError, isAuthenticating, clearAuthError } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setLocalError(null);
    clearAuthError();
  };

  const submit = async () => {
    setLocalError(null);

    const handle = username.trim().replace(/^@/, '');
    if (!handle || !password) {
      setLocalError('Enter your username and password.');
      return;
    }
    if (mode === 'register' && !displayName.trim()) {
      setLocalError('Enter the name your friends will see.');
      return;
    }

    const ok =
      mode === 'login'
        ? await login(handle, password)
        : await register(handle, displayName.trim(), password);

    if (ok) {
      setPassword('');
      resetTo('home-rooms');
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void submit();
  };

  const error = localError || authError;

  return (
    <div className="relative flex-1 flex flex-col justify-between p-6 select-none overflow-y-auto">
      <div>
        <StatusBar />

        {/* Brand */}
        <div className="flex flex-col items-center pt-8 pb-4 animate-fade-in">
          <div className="relative w-28 h-16 flex items-center justify-center mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 via-fuchsia-500/40 to-cyan-500/40 blur-2xl rounded-full animate-pulse-glow" />
            <svg
              viewBox="0 0 160 80"
              className="w-full h-full relative z-10 drop-shadow-[0_0_18px_rgba(192,132,252,0.9)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M48 24C32 24 20 36 20 48C20 60 32 72 48 72C66 72 78 54 88 42C98 30 110 24 124 24C140 24 152 36 152 48C152 60 140 72 124 72C106 72 94 54 84 42C74 30 62 24 48 24Z"
                stroke="url(#auth-infinity-gradient)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient
                  id="auth-infinity-gradient"
                  x1="20"
                  y1="24"
                  x2="152"
                  y2="72"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#C084FC" />
                  <stop offset="45%" stopColor="#A855F7" />
                  <stop offset="70%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <h1 className="text-xl font-bold tracking-wide text-white">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-xs text-purple-200/60 mt-1.5 text-center max-w-[260px] leading-relaxed">
            {mode === 'login'
              ? 'Sign in to pick up your fleeting conversations.'
              : 'Your messages still disappear. Only your identity stays.'}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mt-4 p-2.5 rounded-2xl bg-rose-950/80 border border-rose-500/30 flex items-center justify-between text-xs text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setLocalError(null);
                clearAuthError();
              }}
              className="p-1 rounded-full text-rose-300 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2.5">
          <GlassCard variant="default" className="p-3.5 flex items-center gap-3">
            <User className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              className={inputClass}
            />
            <span className="text-[10px] font-mono text-purple-300/40">@</span>
          </GlassCard>

          {mode === 'register' && (
            <GlassCard variant="default" className="p-3.5 flex items-center gap-3 animate-fade-in">
              <User className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Display name"
                autoComplete="name"
                className={inputClass}
              />
            </GlassCard>
          )}

          <GlassCard variant="default" className="p-3.5 flex items-center gap-3">
            <Lock className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="p-1 rounded-full text-purple-300/50 hover:text-purple-200 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </GlassCard>

          <div className="pt-2">
            <GlowButton
              fullWidth
              size="lg"
              onClick={() => {
                void submit();
              }}
              disabled={isAuthenticating}
            >
              {isAuthenticating
                ? 'Connecting…'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </GlowButton>
          </div>

          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      </div>

      {/* Mode toggle */}
      <div className="pt-6 pb-2 text-center">
        <span className="text-xs text-purple-300/50">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
        </span>
        <button
          type="button"
          onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
          className="ml-1.5 text-xs font-semibold text-purple-200 hover:text-white transition-colors"
        >
          {mode === 'login' ? 'Register' : 'Sign In'}
        </button>
      </div>
    </div>
  );
};

export const AuthLoadingScreen: React.FC = () => (
  <div className="relative flex-1 flex flex-col items-center justify-center select-none">
    <div className="relative w-24 h-14 flex items-center justify-center mb-5">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/40 via-fuchsia-500/30 to-cyan-500/30 blur-2xl rounded-full animate-pulse-glow" />
      <svg
        viewBox="0 0 160 80"
        className="w-full h-full relative z-10 drop-shadow-[0_0_15px_rgba(192,132,252,0.8)] animate-pulse-glow"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M48 24C32 24 20 36 20 48C20 60 32 72 48 72C66 72 78 54 88 42C98 30 110 24 124 24C140 24 152 36 152 48C152 60 140 72 124 72C106 72 94 54 84 42C74 30 62 24 48 24Z"
          stroke="url(#auth-loading-gradient)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient
            id="auth-loading-gradient"
            x1="20"
            y1="24"
            x2="152"
            y2="72"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <span className="text-[11px] tracking-[0.3em] uppercase text-purple-300/50 animate-pulse">
      Restoring session
    </span>
  </div>
);
