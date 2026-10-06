/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vyra: {
          bg: "#0b0f19",
          card: "#111827",
          border: "#1f2937",
          accent: "#3b82f6",
          gnss: "#38bdf8",     // sky blue
          hybrid: "#10b981",   // emerald
          dr: "#f59e0b",       // amber
          danger: "#ef4444",   // red
          purple: "#a855f7",
        }
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      }
    },
  },
  plugins: [],
}
