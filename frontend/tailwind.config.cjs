/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 24px 80px rgba(0, 0, 0, 0.38)"
      },
      colors: {
        adler: {
          bg: "#090a0c",
          border: "#1e2028",
          muted: "#8b92a3",
          panel: "#11141a",
          red: "#ff4d5d",
          sidebar: "#0f1115",
          subtle: "#606779",
          surface: "#151923",
          text: "#f4f7fb"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
