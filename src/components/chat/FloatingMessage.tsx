import React, { useState, useEffect } from 'react';
import { CheckCheck, Check, Clock, Sparkles } from 'lucide-react';
import { Message } from '../../types/chat';
import { NeonAvatar } from '../common/NeonAvatar';
import { ParticleDisintegration } from './ParticleDisintegration';
import { getRemainingTimeMs, formatRemainingTime } from '../../utils/expiration';

interface FloatingMessageProps {
  message: Message;
  showSender?: boolean;
  onExpire?: (messageId: string) => void;
  onAvatarClick?: () => void;
  onSimulateRead?: (messageId: string) => void;
}

export const FloatingMessage: React.FC<FloatingMessageProps> = ({
  message,
  showSender = false,
  onExpire,
  onAvatarClick,
  onSimulateRead,
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

      // Trigger particle disintegration at expiration deadline
      if (rem <= 0 && !isVaporizing && !isDisintegrated) {
        setIsVaporizing(true);
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 500);
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
  const isAwaitingRead = isOutgoing && message.firstReadAt === null;
  const timeFormatted = formatRemainingTime(remainingMs);
  const isExpiringSoon = remainingMs <= 10000 && !isAwaitingRead; // Under 10s

  return (
    <div
      className={`relative w-full flex my-3.5 transition-all duration-700 ${
        isOutgoing ? 'justify-end' : 'justify-start'
      } ${isVaporizing ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'}`}
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
                className="w-full h-auto object-cover max-h-56"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>
          )}

          {/* Floating Message Text */}
          <div
            className={`relative py-1.5 px-3 rounded-2xl transition-all ${
              isOutgoing ? 'text-right' : 'text-left'
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

            {/* Outgoing Metadata: Countdown + Demo Status Ticks */}
            {isOutgoing && (
              <div className="relative z-10 flex items-center justify-end gap-1.5 mt-1 text-[10px] text-purple-300/60 font-mono">
                {isAwaitingRead ? (
                  <span className="text-purple-300/50">Unread (60m cap)</span>
                ) : (
                  <span className={isExpiringSoon ? 'text-amber-300 font-semibold' : ''}>
                    {timeFormatted}
                  </span>
                )}

                {message.status === 'read' ? (
                  <span className="inline-flex items-center gap-1 text-cyan-400" title="Read (Demo)">
                    <CheckCheck className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span className="text-[9px] uppercase tracking-wider">Read (Demo)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-purple-300/70" title="Sent (Demo)">
                    <Check className="w-3.5 h-3.5" />
                    <span className="text-[9px] uppercase tracking-wider">Sent (Demo)</span>
                  </span>
                )}
              </div>
            )}

            {/* Simulation trigger for demo testing when unread */}
            {isAwaitingRead && onSimulateRead && (
              <div className="relative z-10 mt-1.5 flex justify-end">
                <button
                  type="button"
                  onClick={() => onSimulateRead(message.id)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono text-purple-300 bg-purple-950/70 border border-purple-500/30 hover:border-purple-400 hover:text-white transition-all shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                  title="Visibly simulate recipient reading the message"
                >
                  <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
                  <span>Simulate Recipient Read (Demo)</span>
                </button>
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
