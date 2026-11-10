import React, { useEffect } from 'react';
import { StatusBar, useNavigation } from '@/shared';

export const SplashScreen: React.FC = () => {
  const { navigateTo } = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigateTo('onboarding-intro');
    }, 2800);
    return () => clearTimeout(timer);
  }, [navigateTo]);

  return (
    <div
      onClick={() => navigateTo('onboarding-intro')}
      className="relative flex-1 flex flex-col justify-between items-center py-6 px-4 cursor-pointer select-none"
    >
      <StatusBar />

      {/* Center Branding & Infinity Symbol */}
      <div className="flex flex-col items-center justify-center -mt-10 animate-fade-in">
        {/* Glowing Infinity Logo */}
        <div className="relative w-36 h-24 flex items-center justify-center mb-6">
          {/* Ambient Glow behind logo */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 via-fuchsia-500/40 to-cyan-500/40 blur-2xl rounded-full animate-pulse-glow" />

          <svg
            viewBox="0 0 160 80"
            className="w-full h-full relative z-10 drop-shadow-[0_0_18px_rgba(192,132,252,0.9)] animate-pulse-glow"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Infinity Path with dual-tone gradient */}
            <path
              d="M48 24C32 24 20 36 20 48C20 60 32 72 48 72C66 72 78 54 88 42C98 30 110 24 124 24C140 24 152 36 152 48C152 60 140 72 124 72C106 72 94 54 84 42C74 30 62 24 48 24Z"
              stroke="url(#infinity-neon-gradient)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="infinity-neon-gradient" x1="20" y1="24" x2="152" y2="72" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="45%" stopColor="#A855F7" />
                <stop offset="70%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#22D3EE" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl font-bold tracking-[0.25em] text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.7)] text-center pl-2">
          EPHEMERAL
        </h1>

        {/* Tagline */}
        <p className="mt-3 text-sm font-medium tracking-wide text-purple-200/80 text-center">
          Be present. Leave no history.
        </p>

        <p className="mt-1 text-xs text-purple-300/40 tracking-wider">
          Conversations for the moment.
        </p>
      </div>

      {/* Subtle bottom prompt */}
      <div className="text-[11px] text-purple-400/40 tracking-widest uppercase animate-pulse">
        Tap to continue
      </div>
    </div>
  );
};

