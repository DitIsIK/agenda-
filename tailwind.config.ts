import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#2563EB", hover: "#1D4ED8" },
        study: "#16A34A",
        exam: "#DC2626",
        lesson: "#2563EB",
        task: "#71717A",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 8px 20px -8px rgba(0,0,0,0.12)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [animatePlugin],
};

export default config;
