import React, { useState } from 'react';

interface NeonAvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  glow?: boolean;
  glowColor?: 'purple' | 'cyan' | 'pink';
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export const NeonAvatar: React.FC<NeonAvatarProps> = ({
  src,
  name,
  size = 'md',
  glow = true,
  glowColor = 'purple',
  onClick,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
    '2xl': 'w-32 h-32 text-3xl',
  };

  const glowClasses = glow
    ? glowColor === 'purple'
      ? 'ring-2 ring-purple-500/60 shadow-[0_0_18px_rgba(168,85,247,0.45)]'
      : glowColor === 'cyan'
      ? 'ring-2 ring-cyan-400/60 shadow-[0_0_18px_rgba(34,211,238,0.45)]'
      : 'ring-2 ring-pink-500/60 shadow-[0_0_18px_rgba(244,63,94,0.45)]'
    : 'border border-white/10';

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${sizeClasses[size]} ${glowClasses} ${className}`}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-bold bg-gradient-to-tr from-[#2d1254] via-[#4c1d95] to-[#7c3aed] text-purple-100">
          {initials || '?'}
        </div>
      )}
    </div>
  );
};

