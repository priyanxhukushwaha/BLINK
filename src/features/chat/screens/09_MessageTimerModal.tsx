import React, { useState } from 'react';
import { Clock, Check, X } from 'lucide-react';
import { StatusBar } from '../../../shared/components/StatusBar';
import { BackButton } from '../../../shared/components/BackButton';
import { GlowButton } from '../../../shared/components/GlowButton';
import { GlassCard } from '../../../shared/components/GlassCard';
import { TimerOptionMinutes } from '../types/chat';
import { useChat } from '../context/ChatContext';
import { useNavigation } from '../../../shared/context/NavigationContext';

const TIMER_OPTIONS: { minutes: TimerOptionMinutes; label: string }[] = [
  { minutes: 1, label: '1 Minute' },
  { minutes: 5, label: '5 Minutes' },
  { minutes: 15, label: '15 Minutes' },
  { minutes: 30, label: '30 Minutes' },
  { minutes: 60, label: '60 Minutes (Max)' },
];

interface MessageTimerModalProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const MessageTimerModal: React.FC<MessageTimerModalProps> = ({
  onClose,
  isModal = false,
}) => {
  const { goBack, activeRoomId } = useNavigation();
  const { rooms, activeRoomTimer, setRoomTimer } = useChat();

  const currentRoom = rooms.find((r) => r.id === activeRoomId);
  const currentDuration = currentRoom?.timerMinutes || activeRoomTimer || 5;

  const [selectedMinutes, setSelectedMinutes] = useState<TimerOptionMinutes>(currentDuration);

  const handleSetTimer = () => {
    if (activeRoomId) {
      setRoomTimer(activeRoomId, selectedMinutes);
    }
    if (onClose) {
      onClose();
    } else {
      goBack();
    }
  };

  const content = (
    <div className="relative flex-1 flex flex-col justify-between p-6 select-none">
      <div>
        {!isModal && <StatusBar />}
        <div className="flex items-center justify-between pt-2 pb-4">
          {!isModal ? (
            <BackButton onClick={goBack} />
          ) : (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-neon-purple animate-pulse" />
              <h2 className="text-sm font-bold text-white tracking-wide">Expiration Timer</h2>
            </div>
          )}
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-purple-300/60 hover:text-white hover:bg-white/[0.06]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Header Title & Explanatory Copy */}
        <div className="text-center my-3">
          <h1 className="text-xl font-bold text-white tracking-wide">
            Message Timer
          </h1>
          <p className="text-xs text-purple-200/70 mt-1.5 max-w-xs mx-auto leading-relaxed">
            Timer starts once the recipient reads the message. Messages strictly expire after this duration (or 60 minutes if unread).
          </p>
        </div>

        {/* Radio Option List */}
        <div className="flex flex-col gap-2.5 my-6">
          {TIMER_OPTIONS.map((option) => {
            const isSelected = selectedMinutes === option.minutes;
            return (
              <GlassCard
                key={option.minutes}
                onClick={() => setSelectedMinutes(option.minutes)}
                hoverEffect
                className={`p-4 flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-purple-400/50 bg-[#210d42]/70 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                    : 'border-purple-500/15'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold tracking-wide ${
                    isSelected ? 'text-white' : 'text-purple-200/80'
                  }`}>
                    {option.label}
                  </span>
                </div>

                {/* Glowing Radio Indicator */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-2 border-purple-400 bg-gradient-to-tr from-purple-600 to-fuchsia-500 shadow-[0_0_10px_#C084FC]'
                      : 'border border-purple-400/30 bg-purple-950/40'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2 pb-4">
        <GlowButton fullWidth size="lg" onClick={handleSetTimer}>
          Set Timer ({selectedMinutes}m)
        </GlowButton>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-3xl bg-[#120626] border border-purple-500/30 overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.4)]"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  return content;
};

