import React from 'react';
import { Camera } from 'lucide-react';
import type { ScreenshotAlert } from '../types/chat';

interface ScreenshotNoticeProps {
  alert?: ScreenshotAlert;
}

export const ScreenshotNotice: React.FC<ScreenshotNoticeProps> = ({ alert }) => {
  if (!alert) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-4 mt-2 flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-950/60 p-2.5 text-xs text-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.12)] animate-fade-in"
    >
      <Camera className="h-4 w-4 flex-shrink-0 text-amber-300" />
      <span>{alert.displayName} may have taken a screenshot.</span>
    </div>
  );
};

export default ScreenshotNotice;
