/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './store/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          dark: '#1e293b',
          light: '#f1f5f9',
          primary: '#4f46e5',
          secondary: '#0ea5e9',
          accent: '#8b5cf6',
          surface: '#ffffff',
        },
      },
      backgroundImage: {
        'soft-gradient': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        'login-split': 'linear-gradient(to right, rgba(255,255,255,0.9) 50%, rgba(30,41,59,0.95) 50%)',
      },
    },
  },
  plugins: [],
};
