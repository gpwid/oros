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
          50: '#f4f6f8',
          100: '#e5e9ee',
          200: '#cbd4df',
          300: '#a3b5c7',
          400: '#7391ab',
          500: '#517491',
          600: '#3e5b74',
          700: '#334a5f',
          800: '#2b3d4f',
          900: '#1e2936',
          950: '#0e141c',
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
