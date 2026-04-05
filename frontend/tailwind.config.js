/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Sora'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
        display: ["'Cabinet Grotesk'", "'Sora'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
