import React from 'react';
import { StatusBar } from '../components/StatusBar';
import { BackButton } from '../components/BackButton';
import { GlowButton } from '../components/GlowButton';
import { useNavigation } from '../context/NavigationContext';

interface PlaceholderScreenProps {
  title: string;
  screenNumber: number;
  description?: string;
}

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({
  title,
  screenNumber,
  description,
}) => {
  const { goBack, navigateTo } = useNavigation();

  return (
    <div className="relative flex-1 flex flex-col justify-between p-6 select-none">
      <div>
        <StatusBar />
        <div className="flex items-center gap-3 pt-2">
          <BackButton onClick={goBack} />
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center my-auto text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-2xl font-bold text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)] mb-4">
          #{screenNumber}
        </div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-purple-200/60 mt-1 max-w-xs">
          {description || 'Screen stub active for testing & validation.'}
        </p>
      </div>

      <div className="pb-4">
        <GlowButton fullWidth variant="secondary" onClick={() => navigateTo('home-rooms')}>
          Back to Home
        </GlowButton>
      </div>
    </div>
  );
};
