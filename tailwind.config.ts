import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fbf8f2',
          100: '#f7f1e6',
          200: '#efe5d0',
          300: '#e3d3b1',
        },
        ink: {
          400: '#a39378',
          500: '#7a6a58',
          600: '#56493b',
          700: '#3a3127',
          800: '#2a241c',
          900: '#1f1a14',
        },
        honey: {
          300: '#f3c97a',
          400: '#e9b257',
          500: '#d99634',
          600: '#bf7a1f',
          700: '#945c14',
        },
        espresso: {
          700: '#2f261e',
          800: '#241c16',
          900: '#1a1410',
        },
      },
      fontFamily: {
        serif: ['var(--font-newsreader)', 'ui-serif', 'Georgia', 'serif'],
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      animation: {
        rise: 'rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        fadeSwap: 'fadeSwap 2.2s ease-in-out both',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeSwap: {
          '0%, 100%': { opacity: '0', transform: 'translateY(8px)' },
          '12%, 88%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
