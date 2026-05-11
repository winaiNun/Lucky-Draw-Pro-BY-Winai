import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sarabun', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float-1': 'float1 6s ease-in-out infinite',
        'float-2': 'float2 8s ease-in-out infinite',
        'float-3': 'float3 7s ease-in-out infinite',
        'float-4': 'float4 9s ease-in-out infinite',
        'float-5': 'float5 5s ease-in-out infinite',
        'float-6': 'float6 10s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'zoom-in': 'zoomIn 0.5s ease-out forwards',
        'winner-reveal': 'winnerReveal 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
      keyframes: {
        float1: { '0%,100%': { transform: 'translateY(0) rotate(0deg)' }, '50%': { transform: 'translateY(-20px) rotate(5deg)' } },
        float2: { '0%,100%': { transform: 'translateY(0) translateX(0)' }, '33%': { transform: 'translateY(-15px) translateX(10px)' }, '66%': { transform: 'translateY(10px) translateX(-10px)' } },
        float3: { '0%,100%': { transform: 'translateY(0) rotate(-3deg)' }, '50%': { transform: 'translateY(-25px) rotate(3deg)' } },
        float4: { '0%,100%': { transform: 'translateY(0) translateX(0)' }, '50%': { transform: 'translateY(-18px) translateX(-12px)' } },
        float5: { '0%,100%': { transform: 'translateY(0) rotate(0deg)' }, '50%': { transform: 'translateY(-22px) rotate(-5deg)' } },
        float6: { '0%,100%': { transform: 'translateY(0) translateX(0)' }, '33%': { transform: 'translateY(12px) translateX(15px)' }, '66%': { transform: 'translateY(-20px) translateX(-8px)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 10px rgba(139,92,246,0.5)' }, '50%': { boxShadow: '0 0 30px rgba(139,92,246,1), 0 0 60px rgba(139,92,246,0.5)' } },
        zoomIn: { from: { transform: 'scale(0.5)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        winnerReveal: { from: { transform: 'scale(0.3) rotate(-10deg)', opacity: '0' }, to: { transform: 'scale(1) rotate(0deg)', opacity: '1' } },
      },
    },
  },
  plugins: [],
} satisfies Config
