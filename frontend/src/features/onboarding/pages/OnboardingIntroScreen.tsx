import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { StatusBar, GlowButton, useNavigation } from '@/shared';

export const OnboardingIntroScreen: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <div className="relative flex-1 flex flex-col justify-between p-6 select-none">
      {/* Top Header with Status Bar and Skip */}
      <div>
        <StatusBar />
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => navigateTo('home-rooms')}
            className="px-4 py-1.5 rounded-full text-xs font-semibold text-purple-200/70 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:border-purple-400/30 transition-all duration-200"
          >
            Skip
          </button>
        </div>
      </div>

      {/* Center 3D Glassmorphic Glowing Illustration */}
      <div className="flex flex-col items-center justify-center my-auto py-6">
        <div className="relative w-44 h-44 flex items-center justify-center">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/40 via-fuchsia-500/35 to-cyan-500/20 rounded-3xl blur-2xl animate-pulse-glow" />

          {/* Primary Glassmorphic Chat Bubble */}
          <div className="relative z-10 w-32 h-24 rounded-3xl bg-gradient-to-br from-[#2b1055]/85 to-[#160630]/90 backdrop-blur-xl border border-purple-400/30 shadow-[0_0_30px_rgba(168,85,247,0.35)] flex flex-col justify-center px-4 animate-float-slow">
            {/* Bubble lines */}
            <div className="w-12 h-2 rounded-full bg-purple-300/40 mb-2" />
            <div className="w-20 h-2 rounded-full bg-purple-400/25" />

            {/* Subtle tail accent */}
            <div className="absolute -bottom-2 left-6 w-4 h-4 bg-[#160630] border-r border-b border-purple-400/30 transform rotate-45" />
          </div>

          {/* Floating Clock Badge */}
          <div className="absolute -bottom-1 -right-1 z-20 w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-700 via-fuchsia-600 to-violet-500 p-[1.5px] shadow-[0_0_25px_rgba(192,132,252,0.7)]">
            <div className="w-full h-full rounded-[14px] bg-[#140728] flex items-center justify-center">
              <Clock className="w-8 h-8 text-purple-200 stroke-[2.2] animate-pulse" />
            </div>
          </div>

          {/* Sparkles / Ambient star specks */}
          <div className="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22D3EE] animate-ping" />
          <div className="absolute bottom-6 left-2 w-2 h-2 rounded-full bg-purple-300 shadow-[0_0_10px_#C084FC]" />
        </div>

        {/* Copy */}
        <h2 className="mt-8 text-2xl md:text-3xl font-bold text-center text-white tracking-tight leading-snug">
          Chat Freely,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-200">
            It Disappears
          </span>
        </h2>

        <p className="mt-3 text-sm text-center text-purple-200/70 max-w-xs leading-relaxed font-normal">
          Send messages, share moments, and let them fade — automatically.
        </p>
      </div>

      {/* Bottom Carousel Indicator (2 steps) and Action Button */}
      <div className="flex flex-col items-center gap-6 pb-2">
        {/* Exactly Two Pagination Steps: Step 1 active */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-[0_0_8px_#A855F7]" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-800/60" />
        </div>

        {/* Button */}
        <GlowButton
          fullWidth
          size="lg"
          onClick={() => navigateTo('onboarding-features')}
          icon={<ArrowRight className="w-4 h-4 stroke-[2.5]" />}
        >
          Get Started
        </GlowButton>
      </div>
    </div>
  );
};

export { OnboardingIntroScreen as OnboardingIntro };
export default OnboardingIntroScreen;

