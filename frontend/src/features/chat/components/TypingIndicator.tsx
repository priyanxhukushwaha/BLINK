import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TypingMember {
  userId: string;
  username: string;
  displayName?: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingMember[];
  isGroupChat?: boolean;
  className?: string;
}

/**
 * Formats typing user names into natural, expressive copy.
 * Handles deduplication and grammar for single or multiple members.
 */
export function formatTypingText(
  typingUsers: TypingMember[],
  isGroupChat: boolean = false
): string {
  // Deduplicate names cleanly
  const uniqueNames = Array.from(
    new Set(
      typingUsers
        .map((u) => u.displayName || u.username.replace(/^@/, ''))
        .filter(Boolean)
    )
  );

  if (uniqueNames.length === 0) return '';

  if (!isGroupChat) {
    return `${uniqueNames[0]} is typing...`;
  }

  // Group Chat Copy Formatter
  if (uniqueNames.length === 1) {
    return `${uniqueNames[0]} is typing...`;
  }
  if (uniqueNames.length === 2) {
    return `${uniqueNames[0]} and ${uniqueNames[1]} are typing...`;
  }
  if (uniqueNames.length === 3) {
    return `${uniqueNames[0]}, ${uniqueNames[1]}, and ${uniqueNames[2]} are typing...`;
  }
  const remainingCount = uniqueNames.length - 2;
  return `${uniqueNames[0]}, ${uniqueNames[1]}, and ${remainingCount} ${
    remainingCount === 1 ? 'other' : 'others'
  } are typing...`;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  isGroupChat = false,
  className = '',
}) => {
  const text = formatTypingText(typingUsers, isGroupChat);

  return (
    <AnimatePresence>
      {typingUsers.length > 0 && text && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={`px-4 pb-1 flex items-center pointer-events-none select-none z-20 ${className}`}
        >
          {/* Bubble-less floating badge with ambient purple glow */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-950/50 via-purple-900/30 to-indigo-950/20 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.18)] backdrop-blur-md">
            {/* Animated Pulsing & Bouncing Neon Dots */}
            <div className="flex items-center gap-1">
              <motion.span
                animate={{ y: [0, -3.5, 0], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 0.85,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0,
                }}
                className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22D3EE]"
              />
              <motion.span
                animate={{ y: [0, -3.5, 0], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 0.85,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.2,
                }}
                className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#C084FC]"
              />
              <motion.span
                animate={{ y: [0, -3.5, 0], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 0.85,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.4,
                }}
                className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_6px_#E879F9]"
              />
            </div>

            {/* Floating typography with subtle glow */}
            <span className="text-xs font-medium text-purple-200 tracking-wide text-shadow-floating drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]">
              {text}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TypingIndicator;

