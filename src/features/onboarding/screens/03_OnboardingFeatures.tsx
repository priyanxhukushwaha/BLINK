import React from 'react';
import { Shield, Clock, Users } from 'lucide-react';
import { StatusBar, GlassCard, GlowButton, useNavigation } from '@/shared';

export const OnboardingFeatures: React.FC = () => {
  const { navigateTo } = useNavigation();

  const features = [
    {
      icon: <Shield className="w-6 h-6 text-purple-200 stroke-[2.2]" />,
      title: 'Privacy First',
      description: 'No history, No backups.',
      glowColor: 'from-purple-600/30 to-indigo-600/20',
      iconBg: 'bg-purple-900/40 border-purple-400/30',
    },
    {
      icon: <Clock className="w-6 h-6 text-fuchsia-200 stroke-[2.2]" />,
      title: 'Your Time, Your Chat',
      description: 'Messages delete automatically (1 min – 60 min).',
      glowColor: 'from-fuchsia-600/30 to-purple-600/20',
      iconBg: 'bg-fuchsia-900/40 border-fuchsia-400/30',
    },
    {
      icon: <Users className="w-6 h-6 text-cyan-200 stroke-[2.2]" />,
      title: 'Chat Together',
      description: 'Private & group rooms with full control.',
      glowColor: 'from-cyan-600/30 to-purple-600/20',
      iconBg: 'bg-cyan-950/40 border-cyan-400/30',
    },
  ];

  return (
    <div className="relative flex-1 flex flex-col justify-between p-6 select-none">
      <StatusBar />

      {/* Feature Cards Container */}
      <div className="flex-1 flex flex-col justify-center gap-4 my-auto py-4">
        {features.map((feature, idx) => (
          <GlassCard
            key={idx}
            className="p-5 flex items-center gap-4 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300"
          >
            {/* Glowing Icon Square */}
            <div
              className={`w-13 h-13 p-3 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-[0_0_15px_rgba(168,85,247,0.25)] ${feature.iconBg}`}
            >
              {feature.icon}
            </div>

            {/* Feature Content */}
            <div className="flex flex-col">
              <h3 className="text-base font-semibold text-white tracking-wide">
                {feature.title}
              </h3>
              <p className="text-xs text-purple-200/65 mt-0.5 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Bottom Carousel Indicator (2 steps) and Continue Button */}
      <div className="flex flex-col items-center gap-6 pb-2">
        {/* Exactly Two Pagination Steps: Step 2 active */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-800/60" />
          <div className="w-6 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-[0_0_8px_#A855F7]" />
        </div>

        {/* Button */}
        <GlowButton
          fullWidth
          size="lg"
          onClick={() => navigateTo('home-rooms')}
        >
          Continue
        </GlowButton>
      </div>
    </div>
  );
};
