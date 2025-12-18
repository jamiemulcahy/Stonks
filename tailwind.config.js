/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        background: {
          DEFAULT: '#0f0f14',
          secondary: '#1a1a24',
          tertiary: '#24242e',
        },
        surface: {
          DEFAULT: '#1e1e28',
          hover: '#2a2a38',
        },
        border: {
          DEFAULT: '#2e2e3e',
          light: '#3e3e4e',
        },
        // Accent colors
        accent: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
        },
        // Status colors for stocks
        gain: {
          DEFAULT: '#22c55e',
          light: '#4ade80',
        },
        loss: {
          DEFAULT: '#ef4444',
          light: '#f87171',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
