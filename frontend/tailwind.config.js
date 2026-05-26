/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Outfit", "ui-sans-serif", "system-ui"],
        body: ["Manrope", "ui-sans-serif", "system-ui"],
      },
      colors: {
        ink: "#0A0A0A",
        bone: "#FAFAFA",
        nabi: {
          50: "#EEF0FF",
          100: "#E0E3FF",
          200: "#C2C8FF",
          300: "#9CA3FF",
          400: "#6C73F0",
          500: "#4F46E5",
          600: "#4338CA",
          700: "#3730A3",
          800: "#312E81",
          900: "#1E1B4B",
        },
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        beam: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.5s ease-out forwards",
        beam: "beam 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
