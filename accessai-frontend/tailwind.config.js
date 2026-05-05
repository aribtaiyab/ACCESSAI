/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F5C518',
        hover: '#E0B800',
        background: '#F7F6F2',
        surface: '#FFFFFF',
        border: '#E5E5E5',
        textPrimary: '#111111',
        textSecondary: '#6B6B6B',
        success: '#1D9E75',
        error: '#E24B4A',
      },
      borderRadius: {
        xl: '12px',
      },
    },
  },
  plugins: [],
};
