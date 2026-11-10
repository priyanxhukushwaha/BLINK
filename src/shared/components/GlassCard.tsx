import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle' | 'danger';
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  hoverEffect = false,
  onClick,
}) => {
  const variantStyles = {
    default:
      'bg-[#120826]/40 backdrop-blur-xl border border-purple-500/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
    elevated:
      'bg-[#1a0c36]/60 backdrop-blur-2xl border border-purple-400/25 shadow-[0_12px_40px_0_rgba(168,85,247,0.15)]',
    subtle:
      'bg-white/[0.03] backdrop-blur-md border border-white/[0.08]',
    danger:
      'bg-red-950/20 backdrop-blur-xl border border-red-500/20 hover:border-red-500/40 text-red-300',
  };

  const hoverStyles = hoverEffect
    ? 'transition-all duration-300 hover:border-purple-400/35 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:bg-[#160a30]/50 active:scale-[0.99] cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl ${variantStyles[variant]} ${hoverStyles} ${className}`}
    >
      {children}
    </div>
  );
};

