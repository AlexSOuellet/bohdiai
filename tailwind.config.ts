import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './blocks/**/*.{ts,tsx}', './widgets/**/*.{ts,tsx}'],
  theme: {
    screens: {
      md: '720px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        bg: '#0a0805',
        'bg-2': '#15110a',
        text: {
          DEFAULT: '#f3ede0',
          soft: '#d8d2c4',
        },
        muted: '#8a8070',
        honey: {
          DEFAULT: '#e9a13d',
          warm: '#f3c97a',
          deep: '#c9831e',
        },
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        display: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '14px',
        xl: '20px',
        pill: '9999px',
      },
      transitionDuration: {
        fast: '180ms',
        base: '260ms',
        slow: '520ms',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
        inout: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      zIndex: {
        behind: '-1',
        base: '0',
        raised: '1',
        content: '10',
        sticky: '20',
        toast: '50',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.6', transform: 'translateX(-50%) scale(0.95)' },
          '50%': { opacity: '1', transform: 'translateX(-50%) scale(1.1)' },
        },
        'breathe-slow': {
          '0%, 100%': { opacity: '0.5', transform: 'translateX(-50%) scale(0.92)' },
          '50%': { opacity: '0.9', transform: 'translateX(-50%) scale(1.14)' },
        },
        'beam-sway': {
          '0%, 100%': { opacity: '0.35', transform: 'translateX(-50%) rotate(-3deg)' },
          '50%': { opacity: '0.55', transform: 'translateX(-50%) rotate(3deg)' },
        },
        'beam-sway-2': {
          '0%, 100%': { opacity: '0.25', transform: 'translateX(-50%) rotate(4deg)' },
          '50%': { opacity: '0.45', transform: 'translateX(-50%) rotate(-2deg)' },
        },
        'pulse-glow': {
          '0%, 100%': {
            color: '#c9831e',
            textShadow: '0 0 0 rgba(243, 201, 122, 0)',
          },
          '50%': {
            color: '#ffe9b8',
            textShadow:
              '0 0 24px rgba(243, 201, 122, 0.9), 0 0 60px rgba(243, 201, 122, 0.5), 0 0 100px rgba(233, 161, 61, 0.3)',
          },
        },
        'pulse-ring': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(233, 161, 61, 0.55), 0 0 10px #e9a13d',
          },
          '50%': {
            boxShadow: '0 0 0 8px rgba(233, 161, 61, 0), 0 0 18px #e9a13d',
          },
        },
        'browser-bob': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'flash-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'rot-swap': {
          '0%, 100%': { opacity: '0', transform: 'translateY(6px)' },
          '10%, 90%': { opacity: '1', transform: 'translateY(0)' },
        },
        'orb-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.08)', opacity: '0.9' },
        },
        'ring-spin': {
          to: { transform: 'rotate(360deg)' },
        },
        'pulse-dark': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'scroll-left': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'scroll-right': {
          from: { transform: 'translateX(-50%)' },
          to: { transform: 'translateX(0)' },
        },
        'build-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.99)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        breathe: 'breathe 7s ease-in-out infinite',
        'breathe-slow': 'breathe-slow 11s ease-in-out infinite',
        'beam-sway': 'beam-sway 9s ease-in-out infinite',
        'beam-sway-2': 'beam-sway-2 13s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.8s ease-in-out infinite',
        'rot-swap': 'rot-swap 2.4s ease-in-out infinite',
        'orb-pulse': 'orb-pulse 2.4s ease-in-out infinite',
        'ring-spin': 'ring-spin 3s linear infinite',
        'ring-spin-rev': 'ring-spin 5s linear infinite reverse',
        'pulse-dark': 'pulse-dark 1.6s ease-in-out infinite',
        'scroll-left': 'scroll-left 140s linear infinite',
        'scroll-right': 'scroll-right 160s linear infinite',
        'build-in': 'build-in 0.6s cubic-bezier(0.2,0.7,0.2,1) forwards',
        'browser-bob': 'browser-bob 6s ease-in-out infinite',
        rise: 'rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'flash-in': 'flash-in 0.4s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        blink: 'blink 1s steps(1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
