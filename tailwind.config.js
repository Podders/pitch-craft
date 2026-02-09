/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Oswald", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"]
      },
      colors: {
        night: {
          900: "#0a0f14",
          800: "#0e141b",
          700: "#141b23",
          600: "#1b2430"
        },
        neon: {
          500: "#39ff88",
          400: "#68ffb1",
          300: "#9bffd0"
        },
        ember: {
          500: "#ff7a59",
          400: "#ff9b82"
        }
      },
      boxShadow: {
        glow: "0 0 30px rgba(57, 255, 136, 0.2)"
      }
    }
  },
  plugins: []
};
