/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#03050f",
          green: "#00ffa0",
          "green-dim": "#00cc80",
          surface: "#080d1a",
          border: "#0d1f2d",
          muted: "#2a3a4a",
          text: "#8899aa",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "Courier New", "Courier", "monospace"],
      },
      animation: {
        "cursor-blink": "blink 1s step-end infinite",
        "scan-line": "scan 4s linear infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0 },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
    },
  },
  plugins: [],
};
