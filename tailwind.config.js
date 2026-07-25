/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        school: {
          blue: '#1E3A8A', // Deep Blue for contrast
          lightblue: '#BFDBFE', // Light blue requested
          gold: '#FBBF24', // Gold for accents
          goldlight: '#FDE68A',
        }
      },
      animation: {
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { top: '0%' },
          '50%': { top: '100%' },
          '100%': { top: '0%' },
        }
      }
    },
  },
  plugins: [],
}
