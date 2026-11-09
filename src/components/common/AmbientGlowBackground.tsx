import React from 'react';

interface AmbientGlowBackgroundProps {
  intensity?: 'subtle' | 'normal' | 'vibrant';
  showBottomWave?: boolean;
}

export const AmbientGlowBackground: React.FC<AmbientGlowBackgroundProps> = ({
  intensity = 'normal',
  showBottomWave = true,
}) => {
  const opacityMultiplier =
    intensity === 'subtle' ? 'opacity-40' : intensity === 'vibrant' ? 'opacity-90' : 'opacity-70';

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#040208]">
      {/* Deep cosmic gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080314] via-[#040208] to-[#0d051d]" />

      {/* Top right ambient purple orb */}
      <div
        className={`absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-purple-600/30 to-violet-900/10 blur-[100px] ${opacityMultiplier}`}
      />

      {/* Center left subtle cyan glance */}
      <div
        className={`absolute top-1/3 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-600/15 via-purple-700/20 to-transparent blur-[110px] ${opacityMultiplier}`}
      />

      {/* Bottom neon purple / magenta glow reservoir */}
      <div
        className={`absolute -bottom-40 left-1/2 -translate-x-1/2 w-[500px] h-[380px] rounded-full bg-gradient-to-t from-purple-600/35 via-fuchsia-600/20 to-transparent blur-[120px] ${opacityMultiplier}`}
      />

      {/* Futuristic fluid neon wave SVG at the bottom matching reference storyboard */}
      {showBottomWave && (
        <div className="absolute bottom-0 inset-x-0 h-44 overflow-hidden pointer-events-none opacity-45">
          <svg
            viewBox="0 0 1200 400"
            className="w-full h-full object-cover transform translate-y-6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 320C200 240 400 380 600 280C800 180 1000 340 1200 270V400H0V320Z"
              fill="url(#wave-gradient-1)"
            />
            <path
              d="M0 350C250 300 450 390 700 310C950 230 1050 360 1200 330V400H0V350Z"
              fill="url(#wave-gradient-2)"
              opacity="0.6"
            />
            <defs>
              <linearGradient id="wave-gradient-1" x1="0" y1="200" x2="1200" y2="400" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7E22CE" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#A855F7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="wave-gradient-2" x1="0" y1="200" x2="1200" y2="400" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#C084FC" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#9333EA" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
    </div>
  );
};

