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
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        prose: ['Literata', 'Merriweather', 'Georgia', 'serif'],
        mono: ['IBM Plex Mono', 'monospace']
      },
      transitionTimingFunction: {
        'snappy': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
      },
      keyframes: {
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        dropdownIn: {
          '0%': { opacity: '0', transform: 'scale(0.97) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'modal-in': 'modalIn 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'dropdown-in': 'dropdownIn 140ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-left': 'slideInLeft 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-right': 'slideInRight 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'toast-in': 'toastIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}
