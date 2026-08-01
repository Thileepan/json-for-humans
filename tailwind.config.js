/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./app.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eef7f2',
          100: '#d6ecdf',
          200: '#addac1',
          300: '#7cc19d',
          400: '#4da67a',
          500: '#2f8a5f',
          600: '#226e4b',
          700: '#1d583e',
          800: '#194633',
          900: '#153a2b',
        },
      },
    },
  },
  plugins: [],
}
