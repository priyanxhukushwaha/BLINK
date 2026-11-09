import React, { useState, useEffect } from 'react';
import { Wifi } from 'lucide-react';

interface StatusBarProps {
  timeOverride?: string;
  className?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ timeOverride, className = '' }) => {
  const [time, setTime] = useState(timeOverride || '9:41');

  useEffect(() => {
    if (timeOverride) {
      setTime(timeOverride);
      return;
    }
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTime(`${hours % 12 || 12}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [timeOverride]);

  return (
    <div
      className={`w-full flex items-center justify-between px-6 pt-3 pb-2 text-white/85 text-xs font-semibold select-none z-30 ${className}`}
    >
      <span className="tracking-tight text-white/90">{time}</span>
      <div className="flex items-center gap-1.5 text-white/80">
        {/* Cellular bars */}
        <div className="flex items-end gap-[1.5px] h-3">
          <div className="w-[2.5px] h-[3px] bg-white rounded-[0.5px]" />
          <div className="w-[2.5px] h-[5px] bg-white rounded-[0.5px]" />
          <div className="w-[2.5px] h-[7px] bg-white rounded-[0.5px]" />
          <div className="w-[2.5px] h-[9px] bg-white rounded-[0.5px]" />
        </div>
        {/* WiFi */}
        <Wifi className="w-3.5 h-3.5 stroke-[2.2]" />
        {/* Battery */}
        <div className="flex items-center">
          <div className="w-5 h-2.5 rounded-[3px] border border-white/80 p-[1px] flex items-center">
            <div className="h-full w-full bg-white rounded-[1.5px]" />
          </div>
          <div className="w-[1px] h-1 bg-white/70 rounded-r-[1px] -ml-[0.5px]" />
        </div>
      </div>
    </div>
  );
};

