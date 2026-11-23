import React, { useState } from 'react';
import { Search, Clock, Users, User, X, MessageSquare } from 'lucide-react';
import { StatusBar, NeonAvatar, useNavigation } from '@/shared';
import { useChat, ConversationRoom } from '@/features/chat';

export const HomeScreen: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { rooms, friends, ensurePrivateRoom, currentUser } = useChat();

  const [activeTab, setActiveTab] = useState<'friends' | 'rooms'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Search filtering
  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFriends = friends.filter(
    (f) =>
      f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openPrivateChat = async (friendId: string) => {
    const roomId = await ensurePrivateRoom(friendId);
    if (roomId) {
      navigateTo('private-chat', { friendId, roomId });
    }
  };

  const openRoom = (room: ConversationRoom) => {
    if (room.type === 'private') {
      navigateTo('private-chat', {
        roomId: room.id,
        friendId: room.recipientId,
      });
    } else {
      navigateTo('group-chat', { roomId: room.id });
    }
  };

  const openRoomOwnerProfile = (room: ConversationRoom) => {
    const targetId = room.type === 'private' ? room.recipientId : room.adminId;
    if (targetId) {
      navigateTo('friend-profile', { friendId: targetId });
    }
  };

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
                BLINK
              </span>
            </div>

            {/* Actions: Search & Profile */}
            <div className="flex items-center gap-2">
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
                onClick={() => navigateTo('my-profile')}
                aria-label="Profile"
                className="relative rounded-full ring-1 ring-purple-500/40 hover:ring-purple-400 hover:scale-105 active:scale-95 transition-all cursor-pointer p-0.5"
                title="My Profile & Settings"
              >
                <NeonAvatar
                  src={currentUser.avatarUrl}
                  name={currentUser.displayName || 'You'}
                  size="xs"
                  glow={false}
                />
              </button>
            </div>
          </div>
        )}

        {/* Segmented Navigation Control: 1-to-1 Personal Chat (Friends) first, Group Chat (Rooms) second */}
        <div className="flex p-1 mt-2.5 rounded-full bg-[#150a2e]/60 border border-purple-500/20 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-1.5 ${
              activeTab === 'friends'
                ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-violet-600 text-white shadow-[0_0_18px_rgba(168,85,247,0.5)]'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Friends</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-1.5 ${
              activeTab === 'rooms'
                ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-violet-600 text-white shadow-[0_0_18px_rgba(168,85,247,0.5)]'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Rooms</span>
          </button>
        </div>
      </div>

      {/* Main Conversation List (Minimal, spacious, floating aesthetic, NO boxed cards) */}
      <div className="flex-1 px-5 py-3 overflow-y-auto space-y-2">
        {activeTab === 'friends' ? (
          // 1-TO-1 PERSONAL CHAT (FRIENDS TAB):
          // Avatar opens the friend profile; name/row opens the private chat.
          filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="relative flex items-center justify-between py-3.5 px-3 rounded-2xl hover:bg-white/[0.03] transition-colors duration-200"
              >
                {/* Area 1: Profile Picture -> Friend Profile */}
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

                {/* Area 2: Username & Name -> Private Chat */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    void openPrivateChat(friend.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      void openPrivateChat(friend.id);
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
                    {(friend.unreadCount ?? 0) > 0 && (
                      <span className="min-w-[16px] h-4 px-1 rounded-full bg-neon-purple text-[9px] font-bold text-white flex items-center justify-center shadow-[0_0_8px_#A855F7]">
                        {friend.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-purple-200/50 mt-0.5 tracking-tight">
                    {friend.lastInteractionText || 'Tap to chat'}
                  </p>
                </div>

                {/* Area 3: Right quick-action -> Private Chat */}
                <button
                  type="button"
                  onClick={() => {
                    void openPrivateChat(friend.id);
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
              {searchQuery ? `No friends matching "${searchQuery}"` : 'No conversations yet'}
            </div>
          )
        ) : (
          // GROUP CHAT (ROOMS TAB):
          // Clicking an avatar opens the chat partner/admin profile.
          // Clicking the row opens the matching chat room.
          filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => openRoom(room)}
                className="group flex items-center justify-between py-3.5 px-3 rounded-2xl hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
              >
                {/* Left: Avatar */}
                <div className="flex items-center gap-3.5">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      openRoomOwnerProfile(room);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        openRoomOwnerProfile(room);
                      }
                    }}
                    className="group/avatar relative cursor-pointer focus:outline-none flex-shrink-0"
                    title={
                      room.type === 'private'
                        ? `View ${room.name}'s profile`
                        : `View Group Admin Profile (${room.adminName || 'Admin'})`
                    }
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

                  {/* Room Name + Members + Message Preview */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white tracking-wide group-hover:text-purple-200 transition-colors">
                        {room.name}
                      </span>
                      {room.type === 'group' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-300/60 bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-500/15">
                          <Users className="w-2.5 h-2.5 text-purple-400 stroke-[2.5]" />
                          {room.memberCount}
                        </span>
                      )}
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
              {searchQuery ? `No rooms matching "${searchQuery}"` : 'No rooms yet'}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export { HomeScreen as HomeRooms };
export default HomeScreen;

