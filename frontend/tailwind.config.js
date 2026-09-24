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
        cyber: {
          950: '#070B14', // Deepest background
          900: '#0B1120', // Card surface
          850: '#0F172A', // Elevated surface
          800: '#1E293B', // Border / subtle divider
          700: '#334155', // Muted text / stroke
          accent: '#06B6D4', // Primary Cyan
          'accent-glow': 'rgba(6, 182, 212, 0.15)',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
          indigo: '#6366F1',
        },
        severity: {
          low: '#10B981',      // Emerald / Normal / Low
          medium: '#F59E0B',   // Amber / Medium
          high: '#F97316',     // Orange / High
          critical: '#F43F5E', // Rose / Critical
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'cyber-sm': '0 1px 3px rgba(0, 0, 0, 0.5), 0 0 10px rgba(6, 182, 212, 0.05)',
        'cyber': '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 20px rgba(6, 182, 212, 0.1)',
        'cyber-glow': '0 0 25px rgba(6, 182, 212, 0.25)',
        'threat-critical': '0 0 25px rgba(244, 63, 94, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar': 'radar 4s linear infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
