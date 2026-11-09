import React from 'react';

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className = '',
  disabled = false,
}) => {
  const sizeStyles = {
    sm: 'py-2 px-4 text-xs font-semibold tracking-wide',
    md: 'py-3.5 px-6 text-sm font-semibold tracking-wide',
    lg: 'py-4 px-8 text-base font-semibold tracking-wide',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-violet-600 text-white shadow-[0_0_24px_rgba(168,85,247,0.45)] hover:shadow-[0_0_35px_rgba(168,85,247,0.7)] hover:brightness-110 active:scale-[0.98]',
    secondary:
      'bg-[#1e1038]/70 backdrop-blur-md border border-purple-400/25 text-purple-200 hover:border-purple-400/50 hover:bg-[#251445]/80 active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-white/[0.06] text-purple-200 active:scale-[0.98]',
    danger:
      'bg-gradient-to-r from-rose-900/60 to-red-800/60 border border-red-500/30 text-red-200 hover:border-red-500/50 hover:shadow-[0_0_25px_rgba(239,68,68,0.35)] active:scale-[0.98]',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full flex items-center justify-center gap-2.5 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
        fullWidth ? 'w-full' : ''
      } ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      <span>{children}</span>
      {icon && <span className="transition-transform group-hover:translate-x-0.5">{icon}</span>}
    </button>
  );
};

