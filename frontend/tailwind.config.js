/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        primary: "#0C5A56",
        accent: "#F4563C",
        cream: "#F1E3C3",
        gold: "#F7C520",
      },
    },
  },
  plugins: [],
};
