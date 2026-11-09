import React, { useState, useEffect } from 'react';
import { CheckCheck, Check, Clock } from 'lucide-react';
import { Message } from '../../types/chat';
import { NeonAvatar } from '../common/NeonAvatar';
import { ParticleDisintegration } from './ParticleDisintegration';
import { getRemainingTimeMs, formatRemainingTime } from '../../utils/expiration';

interface FloatingMessageProps {
  message: Message;
  showSender?: boolean;
  onExpire?: (messageId: string) => void;
  onAvatarClick?: () => void;
}

export const FloatingMessage: React.FC<FloatingMessageProps> = ({
  message,
  showSender = false,
  onExpire,
  onAvatarClick,
}) => {
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    getRemainingTimeMs(message)
  );
  const [isVaporizing, setIsVaporizing] = useState(false);
  const [isDisintegrated, setIsDisintegrated] = useState(false);

  // Wall-clock countdown ticker
  useEffect(() => {
    const checkTimer = () => {
      const rem = getRemainingTimeMs(message);
      setRemainingMs(rem);

      if (rem <= 3000 && rem > 0 && !isVaporizing) {
        setIsVaporizing(true);
      } else if (rem <= 0 && !isDisintegrated) {
        setIsVaporizing(true);
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [message, isVaporizing, isDisintegrated]);

  const handleParticleComplete = () => {
    setIsDisintegrated(true);
    if (onExpire) {
      onExpire(message.id);
    }
  };

  if (isDisintegrated) {
    return null;
  }

  const isOutgoing = message.isOutgoing;
  const timeFormatted = formatRemainingTime(remainingMs);
  const isExpiringSoon = remainingMs <= 10000; // Under 10 seconds

  return (
    <div
      className={`relative w-full flex my-3.5 transition-all duration-700 ${
        isOutgoing ? 'justify-end' : 'justify-start'
      } ${isVaporizing ? 'opacity-30 blur-[2px] scale-95' : 'opacity-100'}`}
    >
      {/* Particle Disintegration Canvas */}
      <ParticleDisintegration
        active={isVaporizing}
        onComplete={handleParticleComplete}
        width={320}
        height={90}
      />

      <div
        className={`relative flex items-end gap-2.5 max-w-[85%] ${
          isOutgoing ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Incoming: Independent Sender Avatar */}
        {!isOutgoing && (
          <div
            onClick={onAvatarClick}
            className={`flex-shrink-0 mb-1 ${
              onAvatarClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''
            }`}
            title={`View ${message.senderName}'s profile`}
          >
            <NeonAvatar
              src={message.senderAvatar}
              name={message.senderName}
              size="sm"
              glow
              glowColor="purple"
            />
          </div>
        )}

        {/* Message Content Container (NO BOXED BUBBLE BACKGROUND - PURE FLOATING TEXT) */}
        <div
          className={`relative flex flex-col ${
            isOutgoing ? 'items-end' : 'items-start'
          }`}
        >
          {/* Group Chat: Sender Label (for incoming messages) */}
          {!isOutgoing && showSender && (
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-xs font-semibold text-purple-300 drop-shadow-[0_0_6px_rgba(192,132,252,0.6)]">
                {message.senderName}
              </span>
              <span className="text-[10px] text-purple-300/40 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {timeFormatted}
              </span>
            </div>
          )}

          {/* Photo attachment if present */}
          {message.photoUrl && (
            <div className="relative mb-2 rounded-2xl overflow-hidden border border-purple-500/25 shadow-[0_0_20px_rgba(168,85,247,0.3)] max-w-[220px]">
              <img
                src={message.photoUrl}
                alt="Shared moment"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          {/* Floating Message Text */}
          <div
            className={`relative py-1.5 px-3 rounded-2xl transition-all ${
              isOutgoing
                ? 'text-right'
                : 'text-left'
            }`}
          >
            {/* Subtle ethereal back-gradient glow (no rigid borders, no heavy box) */}
            <div
              className={`absolute inset-0 rounded-2xl pointer-events-none ${
                isOutgoing
                  ? 'bg-gradient-to-l from-purple-600/15 via-fuchsia-600/10 to-transparent'
                  : 'bg-gradient-to-r from-purple-900/20 via-indigo-950/15 to-transparent'
              }`}
            />

            {/* Actual Text Typography */}
            <p
              className={`relative z-10 text-[15px] font-normal leading-relaxed tracking-wide select-text ${
                isOutgoing
                  ? 'text-purple-100 text-glow-purple drop-shadow-[0_2px_10px_rgba(168,85,247,0.35)]'
                  : 'text-white/95 text-shadow-floating'
              } ${isExpiringSoon ? 'animate-pulse text-purple-300' : ''}`}
            >
              {message.text}
            </p>

            {/* Outgoing Metadata: Countdown + Status Ticks */}
            {isOutgoing && (
              <div className="relative z-10 flex items-center justify-end gap-1.5 mt-1 text-[10px] text-purple-300/60 font-mono">
                <span className={isExpiringSoon ? 'text-amber-300 font-semibold' : ''}>
                  {timeFormatted}
                </span>
                {message.status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-cyan-400 stroke-[2.2]" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-purple-300/70" />
                )}
              </div>
            )}

            {/* Incoming 1-on-1 Metadata (when showSender is false) */}
            {!isOutgoing && !showSender && (
              <div className="relative z-10 flex items-center gap-1.5 mt-1 text-[10px] text-purple-300/50 font-mono">
                <span>Seen · {timeFormatted}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

