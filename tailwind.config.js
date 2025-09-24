/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#d4af37',
        cobalt: '#2b7cff',
        plum: '#7C3AED',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial'],
      },
      animation: {
        'fade-in': 'fadeIn 0.18s ease-out',
        'slide-in-left': 'slideInLeft 0.22s ease-out',
        'slide-in-right': 'slideInRight 0.22s ease-out',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideInLeft: {
          'from': { opacity: '0', transform: 'translateX(-30px) translateY(20px)' },
          'to': { opacity: '1', transform: 'translateX(0) translateY(0)' },
        },
        slideInRight: {
          'from': { opacity: '0', transform: 'translateX(30px) translateY(20px)' },
          'to': { opacity: '1', transform: 'translateX(0) translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
