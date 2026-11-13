import React, { useEffect, useRef, useState } from 'react';
import { Clock, MoreVertical, Sparkles, AlertCircle, X, Shield } from 'lucide-react';
import { StatusBar, BackButton, NeonAvatar, useNavigation } from '@/shared';
import { FloatingMessage, ChatInputBar, MessageTimerModal, useChat, useChatRoom } from '@/features/chat';

export const PrivateChatScreen: React.FC = () => {
  const { goBack, navigateTo, activeRoomId, selectedFriendId } = useNavigation();
  const { getFriendById, profileCache } = useChat();

  const {
    room,
    messages: roomMessages,
    roomTimer,
    resolveMemberName,
    sendMessage,
    evictExpiredMessage,
    storageError,
    clearStorageError,
  } = useChatRoom(activeRoomId);

  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentRoomId = activeRoomId ?? '';
  const friendId = room?.recipientId ?? selectedFriendId;
  const friend = friendId ? getFriendById(friendId) : undefined;
  const memberProfile = room?.memberProfiles?.find((member) => member.id === friendId);
  const cachedProfile = friendId ? profileCache[friendId] : undefined;

  const recipient = friend ?? memberProfile ?? cachedProfile;
  const recipientName = room?.name || recipient?.displayName || 'Conversation';
  const recipientAvatar = room?.avatarUrl || recipient?.avatarUrl;

  // Smooth auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages.length]);

  const handleOpenProfile = () => {
    if (!friendId) return;
    navigateTo('friend-profile', { friendId });
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
              className={`flex items-center gap-2.5 ${friendId ? 'cursor-pointer group' : ''}`}
              title={friendId ? 'View friend profile' : recipientName}
            >
              <NeonAvatar
                src={recipientAvatar}
                name={recipientName}
                size="sm"
                glow
                glowColor="purple"
                className={friendId ? 'group-hover:scale-105 transition-transform' : ''}
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-wide group-hover:text-purple-300 transition-colors">
                  {recipientName}
                </span>
                <span className="text-[10px] text-purple-300/60 font-mono -mt-0.5">
                  {friendId ? 'Tap for profile' : 'Private chat'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Actions: Message Timer Pill + Options */}
          <div className="flex items-center gap-1.5">
            {/* Expiration Timer Pill */}
            <button
              type="button"
              onClick={() => setShowTimerModal(true)}
              disabled={!room}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/70 border border-purple-500/30 text-purple-200 hover:text-white hover:border-purple-400 transition-all text-xs font-mono shadow-[0_0_12px_rgba(168,85,247,0.25)] disabled:opacity-40"
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
            {friendId && (
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
            )}
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

      {/* Connection / API Error Alert Banner */}
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
              resolveMemberName={resolveMemberName}
              onAvatarClick={handleOpenProfile}
              onExpire={(messageId) => evictExpiredMessage(messageId)}
            />
          ))
        ) : (
          /* Blink Empty State */
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
        disabled={!room}
        onSendMessage={(text, photo) => {
          void sendMessage(text, photo);
        }}
      />

      {/* Modal: Message Timer Sheet */}
      {showTimerModal && room && (
        <MessageTimerModal
          isModal
          onClose={() => setShowTimerModal(false)}
        />
      )}
    </div>
  );
};

export { PrivateChatScreen as PrivateChatRoom };
export default PrivateChatScreen;

