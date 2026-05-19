import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
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
        muted: '#7e7464',
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
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
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
      },
      animation: {
        breathe: 'breathe 7s ease-in-out infinite',
        'breathe-slow': 'breathe-slow 11s ease-in-out infinite',
        'beam-sway': 'beam-sway 9s ease-in-out infinite',
        'beam-sway-2': 'beam-sway-2 13s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
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
