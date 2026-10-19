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
          50: 'rgb(var(--oros-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--oros-100-rgb) / <alpha-value>)',
          200: 'rgb(var(--oros-200-rgb) / <alpha-value>)',
          300: 'rgb(var(--oros-300-rgb) / <alpha-value>)',
          400: 'rgb(var(--oros-400-rgb) / <alpha-value>)',
          500: 'rgb(var(--oros-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--oros-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--oros-700-rgb) / <alpha-value>)',
          750: 'rgb(var(--oros-750-rgb) / <alpha-value>)',
          800: 'rgb(var(--oros-800-rgb) / <alpha-value>)',
          850: 'rgb(var(--oros-850-rgb) / <alpha-value>)',
          900: 'rgb(var(--oros-900-rgb) / <alpha-value>)',
          950: 'rgb(var(--oros-950-rgb) / <alpha-value>)',
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
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['var(--font-serif)', 'Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
        prose: ['var(--font-prose, "Literata")', 'Merriweather', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'IBM Plex Mono', 'monospace']
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
