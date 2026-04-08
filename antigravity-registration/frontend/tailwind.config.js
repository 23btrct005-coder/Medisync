/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#00f3ff',
          purple: '#bc13fe',
          cyan: '#0ff'
        },
        space: {
          900: '#0B0D17',
          800: '#11152a',
          700: '#1b2241'
        }
      },
      backgroundImage: {
        'glass-panel': 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))',
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(0, 243, 255, 0.5)',
        'neon-purple': '0 0 15px rgba(188, 19, 254, 0.5)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}
