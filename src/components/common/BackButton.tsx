import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick, className = '', label }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className={`inline-flex items-center gap-1.5 p-2 -ml-2 rounded-full text-purple-200 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all duration-200 ${className}`}
    >
      <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
};

