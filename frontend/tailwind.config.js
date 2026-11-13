/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: {
          950: '#040208',
          900: '#070312',
          850: '#0d061f',
          800: '#130a2a',
          700: '#1d103c',
        },
        neon: {
          purple: '#A855F7',
          violet: '#C084FC',
          electric: '#9D4EDD',
          deep: '#7E22CE',
          glow: '#D8B4FE',
          cyan: '#22D3EE',
          cyanGlow: '#06B6D4',
          pink: '#F43F5E',
        },
        surface: {
          glass: 'rgba(255, 255, 255, 0.04)',
          glassBorder: 'rgba(192, 132, 252, 0.18)',
          glassHover: 'rgba(255, 255, 255, 0.08)',
          glassDark: 'rgba(13, 6, 31, 0.75)',
        }
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(168, 85, 247, 0.4)',
        'glow-md': '0 0 25px -2px rgba(168, 85, 247, 0.55)',
        'glow-lg': '0 0 40px 0px rgba(168, 85, 247, 0.65)',
        'glow-cyan': '0 0 25px -2px rgba(34, 211, 238, 0.5)',
        'glow-dock': '0 -8px 30px -5px rgba(168, 85, 247, 0.25)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

