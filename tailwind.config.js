module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],

  theme: {
    extend: {
      colors: {
        primary: '#06B6D4',
        brand: '#0F172A',
        muted: '#64748B',
        bg: '#F8FAFC',
        card: '#FFFFFF',
      },
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui'],
      }
    }
  },

  plugins: [],
};
