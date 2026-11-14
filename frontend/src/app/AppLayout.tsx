import React from 'react';
import { ResponsiveContainer, DevScreenSwitcher } from '@/shared';
import { useAuth } from '@/features/auth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isDemoMode, exitDemoMode } = useAuth();

  return (
    <ResponsiveContainer>
      {import.meta.env.DEV && isDemoMode && (
        <div className="w-full flex-shrink-0 z-40 bg-[#0e051c]/95 backdrop-blur-md border-b border-purple-500/25 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono shadow-[0_2px_15px_rgba(168,85,247,0.18)] select-none animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            </span>
            <span className="font-bold tracking-wider text-cyan-300">DEMO MODE</span>
            <span className="text-purple-400/50">·</span>
            <span className="text-purple-200/70 tracking-wide">LOCAL SIMULATION</span>
          </div>
          <button
            type="button"
            onClick={exitDemoMode}
            className="px-2.5 py-0.5 rounded-full bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 hover:border-purple-400 text-purple-200 hover:text-white transition-all text-[10px] font-mono shadow-[0_0_8px_rgba(168,85,247,0.2)]"
            title="Exit Demo Mode and return to real auth"
          >
            Exit Demo ✕
          </button>
        </div>
      )}
      {children}
      <DevScreenSwitcher />
    </ResponsiveContainer>
  );
};

export default AppLayout;

