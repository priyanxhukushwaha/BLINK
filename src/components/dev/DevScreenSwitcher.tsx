import React from 'react';
import { ScreenId } from '../../types/navigation';
import { useNavigation } from '../../context/NavigationContext';

const SCREENS: { id: ScreenId; label: string; number: number }[] = [
  { id: 'splash', label: 'Splash Screen', number: 1 },
  { id: 'onboarding-intro', label: 'Onboarding - Intro', number: 2 },
  { id: 'onboarding-features', label: 'Onboarding - Features', number: 3 },
  { id: 'home-rooms', label: 'Home - Rooms & Friends', number: 4 },
  { id: 'my-profile', label: 'My Profile', number: 5 },
  { id: 'friend-profile', label: 'Friend Profile (Unified)', number: 5 },
  { id: 'settings', label: 'Settings', number: 6 },
  { id: 'private-chat', label: 'Private Chat Room', number: 7 },
  { id: 'group-chat', label: 'Group Chat Room', number: 8 },
  { id: 'message-timer', label: 'Message Timer Modal', number: 9 },
  { id: 'invite-friends', label: 'Invite Friends', number: 10 },
  { id: 'private-notifications', label: 'Private Notifications', number: 11 },
  { id: 'message-disappearing', label: 'Message Disappearing Demo', number: 12 },
];

export const DevScreenSwitcher: React.FC = () => {
  const { currentScreen, navigateTo, isDevMode, toggleDevMode } = useNavigation();

  if (!isDevMode) {
    return (
      <button
        type="button"
        onClick={toggleDevMode}
        title="Development Tool: Quick Screen Navigator (Ctrl+Shift+D)"
        className="fixed bottom-3 right-3 z-50 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider bg-purple-950/80 border border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400 backdrop-blur-md opacity-60 hover:opacity-100 transition-all duration-200"
      >
        DEV: 12 Screens
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 pointer-events-auto">
      <div className="rounded-2xl bg-[#110724]/95 backdrop-blur-2xl border border-purple-500/30 p-3 shadow-[0_0_40px_rgba(0,0,0,0.9),0_0_20px_rgba(168,85,247,0.3)]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-500/20 text-xs text-purple-300">
          <span className="font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            DEV HARNESS: Quick Screen Jump (12 Screens)
          </span>
          <button
            type="button"
            onClick={toggleDevMode}
            className="text-[10px] text-purple-400/80 hover:text-white px-2 py-0.5 rounded bg-white/[0.05]"
          >
            Close (Ctrl+Shift+D)
          </button>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto pr-1">
          {SCREENS.map((s) => {
            const isActive = currentScreen === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => navigateTo(s.id)}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-medium text-left truncate transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-[0_0_10px_#A855F7]'
                    : 'bg-purple-950/40 text-purple-200/80 hover:bg-purple-900/50 hover:text-white'
                }`}
                title={s.label}
              >
                <span className="font-bold text-purple-300 mr-1">#{s.number}</span>
                {s.label.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

