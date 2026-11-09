import React, { useState } from 'react';
import { Search, Bell, Clock, Users, X, MessageSquare, Plus, UserPlus, Sparkles, MessageCircle } from 'lucide-react';
import { StatusBar } from '../components/common/StatusBar';
import { NeonAvatar } from '../components/common/NeonAvatar';
import { BottomNav } from '../components/layout/BottomNav';
import { GlassCard } from '../components/common/GlassCard';
import { useNavigation } from '../context/NavigationContext';
import { useChat } from '../context/ChatContext';

export const HomeRooms: React.FC = () => {
  const { navigateTo, activeNavTab, setActiveNavTab } = useNavigation();
  const { rooms, friends } = useChat();

  const [activeTab, setActiveTab] = useState<'rooms' | 'friends'>('rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Search filtering
  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFriends = friends.filter(
    (f) =>
      f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative flex-1 flex flex-col justify-between select-none">
      {/* Top Header & Search Area */}
      <div className="px-5 pt-3 pb-2 z-20">
        <StatusBar />

        {isSearching ? (
          <div className="flex items-center gap-2 pt-2 pb-1 animate-fade-in">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full bg-purple-950/60 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Search className="w-4 h-4 text-purple-300/70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username or room..."
                autoFocus
                className="w-full bg-transparent text-sm text-white placeholder-purple-300/40 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="p-2 rounded-full text-purple-200 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-2 pb-2">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-5 flex items-center justify-center">
                <div className="absolute inset-0 bg-purple-500/40 blur-md rounded-full" />
                <svg viewBox="0 0 160 80" className="w-full h-full relative z-10" fill="none">
                  <path
                    d="M48 24C32 24 20 36 20 48C20 60 32 72 48 72C66 72 78 54 88 42C98 30 110 24 124 24C140 24 152 36 152 48C152 60 140 72 124 72C106 72 94 54 84 42C74 30 62 24 48 24Z"
                    stroke="url(#home-infinity-gradient)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="home-infinity-gradient" x1="20" y1="24" x2="152" y2="72" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#C084FC" />
                      <stop offset="100%" stopColor="#22D3EE" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="text-base font-bold tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                EPHEMERAL
              </span>
            </div>

            {/* Actions: Search & Notifications */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSearching(true)}
                aria-label="Search conversations"
                className="p-2 rounded-full text-purple-200/80 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigateTo('private-notifications')}
                aria-label="Private Notifications"
                className="relative p-2 rounded-full text-purple-200/80 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neon-purple shadow-[0_0_8px_#A855F7] animate-pulse" />
              </button>
            </div>
          </div>
        )}

        {/* Segmented Navigation Control: Rooms vs Friends */}
        <div className="flex p-1 mt-2.5 rounded-full bg-[#150a2e]/60 border border-purple-500/20 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
              activeTab === 'rooms'
                ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-violet-600 text-white shadow-[0_0_18px_rgba(168,85,247,0.5)]'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            Rooms
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
              activeTab === 'friends'
                ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-violet-600 text-white shadow-[0_0_18px_rgba(168,85,247,0.5)]'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            Friends
          </button>
        </div>
      </div>

      {/* Main Conversation List (Minimal, spacious, floating aesthetic, NO boxed cards) */}
      <div className="flex-1 px-5 py-3 overflow-y-auto space-y-2">
        {activeTab === 'rooms' ? (
          // ROOMS TAB:
          // Clicking group picture opens the Group Admin's profile (Screen 5)
          // Clicking group name / row opens Group Chat Room (Screen 8)
          filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => navigateTo('group-chat', { roomId: room.id })}
                className="group flex items-center justify-between py-3.5 px-3 rounded-2xl hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
              >
                {/* Left: Group Avatar (Independent Click -> Opens Group Admin's Profile) */}
                <div className="flex items-center gap-3.5">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents navigating to group chat room
                      const adminFriendId = room.adminId || 'user-meera';
                      navigateTo('friend-profile', { friendId: adminFriendId });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        const adminFriendId = room.adminId || 'user-meera';
                        navigateTo('friend-profile', { friendId: adminFriendId });
                      }
                    }}
                    className="group/avatar relative cursor-pointer focus:outline-none flex-shrink-0"
                    title={`View Group Admin Profile (${room.adminName || 'Admin'})`}
                  >
                    <NeonAvatar
                      src={room.avatarUrl}
                      name={room.name}
                      size="md"
                      glow
                      glowColor="purple"
                      className="group-hover/avatar:scale-105 group-hover/avatar:ring-purple-400 transition-all duration-300"
                    />
                  </div>

                  {/* Room Name + Members + Message Preview (Click -> Opens Group Chat) */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white tracking-wide group-hover:text-purple-200 transition-colors">
                        {room.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-300/60 bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-500/15">
                        <Users className="w-2.5 h-2.5 text-purple-400 stroke-[2.5]" />
                        {room.memberCount}
                      </span>
                    </div>
                    <span className="text-xs text-purple-200/60 mt-0.5 truncate max-w-[210px]">
                      {room.lastMessageText}
                    </span>
                  </div>
                </div>

                {/* Right: Remaining Room Timer Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/50 border border-purple-500/20 text-purple-300/80 text-[11px] font-mono shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                  <Clock className="w-3 h-3 text-purple-400" />
                  <span>{room.timerMinutes}m</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-purple-300/50">
              No rooms matching "{searchQuery}"
            </div>
          )
        ) : (
          // FRIENDS TAB:
          // 1. Friend's profile picture independent click -> opens Friend Profile (Screen 5)
          // 2. Friend's username & name click -> directly opens Private Chat Room (Screen 7)
          filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="relative flex items-center justify-between py-3.5 px-3 rounded-2xl hover:bg-white/[0.03] transition-colors duration-200"
              >
                {/* Area 1: Independent Profile Picture Click -> Opens Friend Profile */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo('friend-profile', { friendId: friend.id });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      navigateTo('friend-profile', { friendId: friend.id });
                    }
                  }}
                  className="group/avatar relative cursor-pointer focus:outline-none flex-shrink-0"
                  title={`View ${friend.displayName}'s profile`}
                >
                  <NeonAvatar
                    src={friend.avatarUrl}
                    name={friend.displayName}
                    size="md"
                    glow
                    glowColor="purple"
                    className="group-hover/avatar:scale-105 group-hover/avatar:ring-purple-400 transition-all duration-300"
                  />
                </div>

                {/* Area 2: Independent Username & Name Click -> Opens Private Chat Room */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    navigateTo('private-chat', {
                      friendId: friend.id,
                      roomId: `room-${friend.displayName.toLowerCase()}`,
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigateTo('private-chat', {
                        friendId: friend.id,
                        roomId: `room-${friend.displayName.toLowerCase()}`,
                      });
                    }
                  }}
                  className="flex-1 ml-4 cursor-pointer focus:outline-none group/info"
                  title={`Chat with ${friend.displayName}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white tracking-wide group-hover/info:text-purple-300 transition-colors">
                      {friend.displayName}
                    </span>
                    <span className="text-[11px] font-mono text-purple-300/50">
                      {friend.username}
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/50 mt-0.5 tracking-tight">
                    {friend.lastInteractionText || 'Tap to chat'}
                  </p>
                </div>

                {/* Area 3: Right quick-action button -> Opens Private Chat Room */}
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('private-chat', {
                      friendId: friend.id,
                      roomId: `room-${friend.displayName.toLowerCase()}`,
                    });
                  }}
                  className="p-2 rounded-full text-purple-300/40 hover:text-white hover:bg-purple-900/30 transition-all duration-200"
                  title="Start temporary chat"
                >
                  <MessageSquare className="w-4 h-4 text-purple-400/80" />
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-purple-300/50">
              No friends matching "{searchQuery}"
            </div>
          )
        )}
      </div>

      {/* Action Menu Modal (Opened by Central + Button) */}
      {showActionMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          onClick={() => setShowActionMenu(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#130728] border border-purple-500/30 p-5 shadow-[0_0_50px_rgba(168,85,247,0.35)] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-neon-purple animate-pulse" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  New Ephemeral Action
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowActionMenu(false)}
                className="p-1 rounded-full text-purple-300/60 hover:text-white hover:bg-white/[0.06]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action 1: Start Private Chat */}
            <GlassCard
              hoverEffect
              onClick={() => {
                setShowActionMenu(false);
                navigateTo('private-chat', {
                  friendId: 'user-aryan',
                  roomId: 'room-aryan',
                });
              }}
              className="p-3.5 flex items-center gap-3 cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-purple-900/50 border border-purple-400/30 text-purple-200">
                <MessageCircle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Start Private Chat</span>
                <span className="text-[11px] text-purple-300/60">
                  Direct floating conversation with a friend
                </span>
              </div>
            </GlassCard>

            {/* Action 2: Create Group Room */}
            <GlassCard
              hoverEffect
              onClick={() => {
                setShowActionMenu(false);
                navigateTo('group-chat', { roomId: 'room-late-night' });
              }}
              className="p-3.5 flex items-center gap-3 cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-fuchsia-900/50 border border-fuchsia-400/30 text-fuchsia-200">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Create Group Room</span>
                <span className="text-[11px] text-purple-300/60">
                  Multi-member room with first-seen expiration
                </span>
              </div>
            </GlassCard>

            {/* Action 3: Invite Friends */}
            <GlassCard
              hoverEffect
              onClick={() => {
                setShowActionMenu(false);
                navigateTo('invite-friends');
              }}
              className="p-3.5 flex items-center gap-3 cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-400/30 text-cyan-200">
                <UserPlus className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Invite Friends</span>
                <span className="text-[11px] text-purple-300/60">
                  Share your temporary invite link
                </span>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Floating Bottom Navigation Dock */}
      <BottomNav
        activeTab={activeNavTab}
        onTabChange={(tab) => {
          setActiveNavTab(tab);
          if (tab === 'profile') navigateTo('my-profile');
          if (tab === 'rooms') setActiveTab('rooms');
          if (tab === 'chat') setActiveTab('friends');
          if (tab === 'home') navigateTo('home-rooms');
        }}
        onNewAction={() => setShowActionMenu(true)}
      />
    </div>
  );
};
