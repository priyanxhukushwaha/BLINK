import React from 'react';
import { Home, Users, Plus, MessageSquare, User } from 'lucide-react';
import { BottomNavTab } from '../types/navigation';

interface BottomNavProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
  onNewAction?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onNewAction,
}) => {
  return (
    <div className="sticky bottom-0 inset-x-0 w-full px-5 pb-5 pt-2 z-30 pointer-events-auto">
      <div className="relative mx-auto max-w-sm rounded-full bg-[#130728]/80 backdrop-blur-2xl border border-purple-500/20 px-3 py-2 flex items-center justify-around shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(168,85,247,0.15)]">
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          aria-label="Home"
          className={`relative p-2.5 rounded-full transition-all duration-300 ${
            activeTab === 'home'
              ? 'text-purple-300 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]'
              : 'text-purple-300/45 hover:text-purple-200'
          }`}
        >
          <Home className="w-5 h-5 stroke-[2]" />
          {activeTab === 'home' && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-neon-purple shadow-[0_0_6px_#A855F7]" />
          )}
        </button>

        {/* Tab 2: Rooms */}
        <button
          type="button"
          onClick={() => onTabChange('rooms')}
          aria-label="Rooms"
          className={`relative p-2.5 rounded-full transition-all duration-300 ${
            activeTab === 'rooms'
              ? 'text-purple-300 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]'
              : 'text-purple-300/45 hover:text-purple-200'
          }`}
        >
          <Users className="w-5 h-5 stroke-[2]" />
          {activeTab === 'rooms' && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-neon-purple shadow-[0_0_6px_#A855F7]" />
          )}
        </button>

        {/* Center Floating Action Button (+) */}
        <button
          type="button"
          onClick={onNewAction}
          aria-label="Create new conversation or room"
          className="relative -top-3 w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-violet-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.65)] hover:shadow-[0_0_35px_rgba(168,85,247,0.85)] hover:scale-105 active:scale-95 transition-all duration-300 border border-purple-300/30"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Tab 3: Chat */}
        <button
          type="button"
          onClick={() => onTabChange('chat')}
          aria-label="Chat"
          className={`relative p-2.5 rounded-full transition-all duration-300 ${
            activeTab === 'chat'
              ? 'text-purple-300 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]'
              : 'text-purple-300/45 hover:text-purple-200'
          }`}
        >
          <MessageSquare className="w-5 h-5 stroke-[2]" />
          {activeTab === 'chat' && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-neon-purple shadow-[0_0_6px_#A855F7]" />
          )}
        </button>

        {/* Tab 4: Profile */}
        <button
          type="button"
          onClick={() => onTabChange('profile')}
          aria-label="Profile"
          className={`relative p-2.5 rounded-full transition-all duration-300 ${
            activeTab === 'profile'
              ? 'text-purple-300 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]'
              : 'text-purple-300/45 hover:text-purple-200'
          }`}
        >
          <User className="w-5 h-5 stroke-[2]" />
          {activeTab === 'profile' && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-neon-purple shadow-[0_0_6px_#A855F7]" />
          )}
        </button>
      </div>
    </div>
  );
};

