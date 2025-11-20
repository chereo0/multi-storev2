/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#F97316',
        background: '#F9FAFB',
        text: '#111827',
        muted: '#6B7280',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

