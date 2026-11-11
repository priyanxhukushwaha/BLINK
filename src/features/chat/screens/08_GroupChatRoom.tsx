import React, { useState, useEffect, useRef } from 'react';
import { Clock, MoreVertical, Sparkles, AlertCircle, X, Users, Shield, UserCheck } from 'lucide-react';
import { StatusBar, BackButton, NeonAvatar, GlassCard, useNavigation } from '@/shared';
import { FloatingMessage, ChatInputBar, MessageTimerModal, useChat } from '@/features/chat';

export const GroupChatRoom: React.FC = () => {
  const { goBack, navigateTo, activeRoomId } = useNavigation();
  const {
    messages,
    sendMessage,
    simulateGroupMemberRead,
    markIncomingAsRead,
    evictExpiredMessage,
    rooms,
    storageError,
    clearStorageError,
  } = useChat();

  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Group room configuration
  const currentRoomId = activeRoomId || 'room-late-night';
  const room = rooms.find((r) => r.id === currentRoomId) || {
    id: 'room-late-night',
    name: 'Late Night Crew 🌙',
    type: 'group' as const,
    avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
    memberCount: 12,
    members: ['Meera', 'Kabir', 'Tanya', 'Priyanx', 'Aryan', 'Rohan', 'Sneha', 'Zara', 'Dev', 'Aditi', 'Vikram', 'Ananya'],
    adminId: 'user-meera',
    adminName: 'Meera',
    timerMinutes: 30,
  };

  const roomMessages = messages[currentRoomId] || [];
  const roomTimer = room.timerMinutes || 30;

  // On entry: mark incoming messages as read by current user
  useEffect(() => {
    markIncomingAsRead(currentRoomId);
  }, [currentRoomId, markIncomingAsRead]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages.length]);

  const handleOpenAdminProfile = () => {
    const adminId = room.adminId || 'user-meera';
    navigateTo('friend-profile', { friendId: adminId });
  };

  const handleOpenMemberProfile = (senderName: string) => {
    // Map member name to friend ID
    const friendIdMap: Record<string, string> = {
      Meera: 'user-meera',
      Kabir: 'user-kabir',
      Tanya: 'user-tanya',
      Aryan: 'user-aryan',
    };
    const targetId = friendIdMap[senderName] || 'user-meera';
    navigateTo('friend-profile', { friendId: targetId });
  };

  return (
    <div className="relative flex-1 flex flex-col justify-between select-none h-full overflow-hidden">
      {/* Top Header */}
      <div className="px-4 pt-3 pb-2.5 z-20 bg-[#070312]/90 backdrop-blur-xl border-b border-purple-500/15">
        <StatusBar />

        <div className="flex items-center justify-between pt-1.5">
          {/* Left: Back Button + Group Avatar & Title */}
          <div className="flex items-center gap-2.5">
            <BackButton onClick={goBack} />

            {/* Group Avatar: Independent click opens Group Admin Profile (Meera) */}
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAdminProfile();
              }}
              className="cursor-pointer group flex-shrink-0"
              title={`View Group Admin Profile (${room.adminName || 'Meera'})`}
            >
              <NeonAvatar
                src={room.avatarUrl}
                name={room.name}
                size="sm"
                glow
                glowColor="purple"
                className="group-hover:scale-105 transition-transform"
              />
            </div>

            {/* Group Name & Members count: Click opens Members Roster */}
            <div
              onClick={() => setShowMembersDrawer(true)}
              className="flex flex-col cursor-pointer group"
              title="View group members"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-wide group-hover:text-purple-300 transition-colors">
                  {room.name}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-purple-300/60 font-mono -mt-0.5">
                <Users className="w-2.5 h-2.5 text-purple-400" />
                <span>{room.memberCount || 12} members (tap to view)</span>
              </div>
            </div>
          </div>

          {/* Right Actions: Timer Pill + Options (NO CALL ICONS) */}
          <div className="flex items-center gap-1.5">
            {/* Expiration Timer Pill */}
            <button
              type="button"
              onClick={() => setShowTimerModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/70 border border-purple-500/30 text-purple-200 hover:text-white hover:border-purple-400 transition-all text-xs font-mono shadow-[0_0_12px_rgba(168,85,247,0.25)]"
              title="Set group expiration timer"
            >
              <Clock className="w-3.5 h-3.5 text-neon-purple animate-pulse" />
              <span>{roomTimer}m</span>
            </button>

            {/* Options Button */}
            <button
              type="button"
              onClick={() => setShowOptionsMenu((prev) => !prev)}
              aria-label="Options"
              className="p-1.5 rounded-full text-purple-300/70 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Options Dropdown Menu */}
        {showOptionsMenu && (
          <div className="absolute top-20 right-4 z-40 p-2 rounded-2xl bg-[#14062a]/95 backdrop-blur-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col gap-1 min-w-[190px] animate-fade-in">
            <button
              type="button"
              onClick={() => {
                setShowOptionsMenu(false);
                setShowMembersDrawer(true);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-purple-200 hover:text-white hover:bg-purple-900/40 text-left"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Group Members (12)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowOptionsMenu(false);
                handleOpenAdminProfile();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-purple-200 hover:text-white hover:bg-purple-900/40 text-left"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Admin Profile ({room.adminName || 'Meera'})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowOptionsMenu(false);
                setShowTimerModal(true);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-purple-200 hover:text-white hover:bg-purple-900/40 text-left"
            >
              <Clock className="w-3.5 h-3.5 text-neon-purple" />
              <span>Group Timer Settings</span>
            </button>
          </div>
        )}
      </div>

      {/* Storage Error Alert Banner */}
      {storageError && (
        <div className="mx-4 mt-2 p-2.5 rounded-2xl bg-rose-950/80 border border-rose-500/30 flex items-center justify-between text-xs text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)] z-30 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{storageError}</span>
          </div>
          <button
            type="button"
            onClick={clearStorageError}
            className="p-1 rounded-full text-rose-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating-Text Multi-User Message Stream */}
      <div className="flex-1 px-4 py-4 overflow-y-auto space-y-1">
        {roomMessages.length > 0 ? (
          roomMessages.map((msg) => (
            <FloatingMessage
              key={msg.id}
              message={msg}
              showSender={true}
              isGroupChat={true}
              onAvatarClick={() => handleOpenMemberProfile(msg.senderName)}
              onSimulateGroupRead={(messageId, memberName) =>
                simulateGroupMemberRead(currentRoomId, messageId, memberName)
              }
              onExpire={(messageId) => evictExpiredMessage(currentRoomId, messageId)}
            />
          ))
        ) : (
          /* Ephemeral Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-purple-950/40 border border-purple-500/20 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              All messages have vanished
            </h3>
            <p className="text-xs text-purple-300/60 mt-1 max-w-xs leading-relaxed">
              &ldquo;Be present. Leave no history.&rdquo; Send a new group conversation above.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <ChatInputBar
        onSendMessage={(text, photoUrl) => sendMessage(currentRoomId, text, photoUrl)}
      />

      {/* Modal: Message Timer Sheet */}
      {showTimerModal && (
        <MessageTimerModal
          isModal
          onClose={() => setShowTimerModal(false)}
        />
      )}

      {/* Slide-over Drawer: Group Members Roster */}
      {showMembersDrawer && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setShowMembersDrawer(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#130728] border border-purple-500/30 p-5 shadow-[0_0_50px_rgba(168,85,247,0.35)] space-y-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-neon-purple" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Group Members ({room.memberCount || 12})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMembersDrawer(false)}
                className="p-1 rounded-full text-purple-300/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(room.members || ['Meera', 'Kabir', 'Tanya', 'Priyanx']).map((member, idx) => {
                const isAdmin = member === (room.adminName || 'Meera');
                const isYou = member === 'Priyanx';
                return (
                  <GlassCard
                    key={idx}
                    hoverEffect
                    onClick={() => {
                      setShowMembersDrawer(false);
                      if (isAdmin) {
                        handleOpenAdminProfile();
                      } else if (!isYou) {
                        handleOpenMemberProfile(member);
                      } else {
                        navigateTo('my-profile');
                      }
                    }}
                    className="p-3 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <NeonAvatar
                        name={member}
                        size="xs"
                        glow={isAdmin}
                        glowColor={isAdmin ? 'purple' : 'cyan'}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          {member} {isYou && '(You)'}
                        </span>
                        {isAdmin && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-purple-200 bg-purple-900/60 border border-purple-400/30">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-purple-300/60">
                      Tap for profile &rarr;
                    </span>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
