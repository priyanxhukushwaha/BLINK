import React, { useState, useEffect, useRef } from 'react';
import { Clock, MoreVertical, Sparkles, AlertCircle, X, Shield } from 'lucide-react';
import { StatusBar, BackButton, NeonAvatar, useNavigation } from '@/shared';
import { FloatingMessage, ChatInputBar, MessageTimerModal, useChat } from '@/features/chat';

export const PrivateChatRoom: React.FC = () => {
  const { goBack, navigateTo, activeRoomId, selectedFriendId } = useNavigation();
  const {
    messages,
    sendMessage,
    simulateRecipientRead,
    markIncomingAsRead,
    evictExpiredMessage,
    getFriendById,
    rooms,
    storageError,
    clearStorageError,
  } = useChat();

  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine current active room & friend
  const currentRoomId = activeRoomId || 'room-aryan';
  const targetFriendId = selectedFriendId || 'user-aryan';
  const friend = getFriendById(targetFriendId) || {
    id: 'user-aryan',
    username: '@aryan',
    displayName: 'Aryan',
    bio: 'Living in the moment. Leaving no digital footprints. 🌌',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
  };

  const room = rooms.find((r) => r.id === currentRoomId);
  const roomMessages = messages[currentRoomId] || [];
  const roomTimer = room?.timerMinutes || 5;

  // On entry: mark incoming messages as read (starts recipient's countdown)
  useEffect(() => {
    markIncomingAsRead(currentRoomId);
  }, [currentRoomId, markIncomingAsRead]);

  // Smooth auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages.length]);

  const handleOpenProfile = () => {
    navigateTo('friend-profile', { friendId: friend.id });
  };

  return (
    <div className="relative flex-1 flex flex-col justify-between select-none h-full overflow-hidden">
      {/* Top Header */}
      <div className="px-4 pt-3 pb-2.5 z-20 bg-[#070312]/90 backdrop-blur-xl border-b border-purple-500/15">
        <StatusBar />

        <div className="flex items-center justify-between pt-1.5">
          {/* Left: Back Button + Recipient Info */}
          <div className="flex items-center gap-2.5">
            <BackButton onClick={goBack} />

            {/* Recipient Profile Trigger */}
            <div
              onClick={handleOpenProfile}
              className="flex items-center gap-2.5 cursor-pointer group"
              title="View friend profile"
            >
              <NeonAvatar
                src={friend.avatarUrl}
                name={friend.displayName}
                size="sm"
                glow
                glowColor="purple"
                className="group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-wide group-hover:text-purple-300 transition-colors">
                  {friend.displayName}
                </span>
                <span className="text-[10px] text-purple-300/60 font-mono -mt-0.5">
                  Tap for profile
                </span>
              </div>
            </div>
          </div>

          {/* Right Actions: Message Timer Pill + Options (NO CALL ICONS) */}
          <div className="flex items-center gap-1.5">
            {/* Expiration Timer Pill */}
            <button
              type="button"
              onClick={() => setShowTimerModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/70 border border-purple-500/30 text-purple-200 hover:text-white hover:border-purple-400 transition-all text-xs font-mono shadow-[0_0_12px_rgba(168,85,247,0.25)]"
              title="Set expiration timer"
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

        {/* Options Dropdown */}
        {showOptionsMenu && (
          <div className="absolute top-20 right-4 z-40 p-2 rounded-2xl bg-[#14062a]/95 backdrop-blur-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col gap-1 min-w-[170px] animate-fade-in">
            <button
              type="button"
              onClick={() => {
                setShowOptionsMenu(false);
                handleOpenProfile();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-purple-200 hover:text-white hover:bg-purple-900/40 text-left"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>View Profile</span>
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
              <span>Timer Settings</span>
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

      {/* Floating-Text Message Stream (NO BOXED CHAT BUBBLES) */}
      <div className="flex-1 px-4 py-4 overflow-y-auto space-y-1">
        {roomMessages.length > 0 ? (
          roomMessages.map((msg) => (
            <FloatingMessage
              key={msg.id}
              message={msg}
              showSender={false}
              onAvatarClick={handleOpenProfile}
              onSimulateRead={(messageId) => simulateRecipientRead(currentRoomId, messageId)}
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
              &ldquo;Be present. Leave no history.&rdquo; Send a new fleeting message below.
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
    </div>
  );
};

