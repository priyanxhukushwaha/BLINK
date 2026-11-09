import React from 'react';
import { AmbientGlowBackground } from '../common/AmbientGlowBackground';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  showWave?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  showWave = true,
}) => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#040208] text-white selection:bg-purple-500/30 selection:text-purple-200">
      {/* Dynamic ambient gradient waves & glow orbs */}
      <AmbientGlowBackground showBottomWave={showWave} />

      {/* Production Natural Responsive Shell */}
      <div
        className={`relative z-10 w-full min-h-screen md:min-h-[844px] md:max-h-[920px] md:max-w-[430px] md:my-6 md:rounded-[44px] md:shadow-[0_0_80px_rgba(168,85,247,0.25),0_0_0_1px_rgba(192,132,252,0.18)] bg-[#070312]/80 backdrop-blur-2xl overflow-hidden flex flex-col ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

