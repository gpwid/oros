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
        oros: {
          50: '#f8f9fa',
          100: '#edf0f4',
          200: '#d7dce4',
          300: '#b4bdcd',
          400: '#8793a7',
          500: '#606b81',
          600: '#434c5e',
          700: '#2c3340',
          800: '#1b1f28',
          850: '#14171f',
          900: '#0f1116',
          950: '#090a0d',
        },
        accent: {
          DEFAULT: 'var(--oros-accent, #e2e8f0)',
          muted: 'var(--oros-accent-muted, rgba(226, 232, 240, 0.12))',
          subtle: 'var(--oros-accent-subtle, rgba(226, 232, 240, 0.05))',
          border: 'var(--oros-accent-border, rgba(226, 232, 240, 0.30))',
          hover: 'var(--oros-accent-hover, #ffffff)',
          ring: 'var(--oros-accent-ring, rgba(226, 232, 240, 0.25))',
          glow: 'var(--oros-accent-glow, rgba(226, 232, 240, 0.20))',
          contrast: 'var(--oros-accent-contrast, #090a0d)',
        },
        gold: {
          400: '#f5c542',
          500: '#e0ac1b',
          600: '#b8860b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Cinzel', 'Merriweather', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
