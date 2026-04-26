/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF8F3',
        'warm-gold': '#C4956A',
        'warm-brown': '#8B7355',
        'warm-light': '#B8A88A',
        'james-orange': '#E8621A',
        'james-dark': '#0D0B09',
        'james-card': '#141210',
        'hermes-ivory': '#F7F3EE',
        'hermes-sand': '#E8DDD0',
        'hermes-taupe': '#9C8B7A',
      },
      fontFamily: {
        naikai: ['LXGW WenKai', 'PingFang TC', 'PingFang SC', 'Microsoft JhengHei', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Noto Serif TC', 'serif'],
      },
      letterSpacing: {
        'luxury': '0.25em',
        'editorial': '0.15em',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 30s linear infinite',
        'bounce-in': 'bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up': 'slide-up 0.6s ease-out forwards',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
