import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#17233D",
          soft: "#2E3E60",
        },
        paper: {
          DEFAULT: "#EFE7D8",
          raised: "#FBF8F1",
        },
        rust: {
          DEFAULT: "#9C3F24",
          dark: "#7C321D",
        },
        gold: {
          DEFAULT: "#B4880B",
          soft: "#D9B94A",
        },
        slate: {
          DEFAULT: "#4A5568",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        hero: [
          "clamp(2.75rem, 5vw + 1rem, 4.5rem)",
          { lineHeight: "1.04", letterSpacing: "-0.025em", fontWeight: "600" },
        ],
        section: [
          "clamp(1.5rem, 1.5vw + 1rem, 2.125rem)",
          { lineHeight: "1.15", letterSpacing: "-0.015em", fontWeight: "600" },
        ],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(23,35,61,0.05), 0 6px 16px rgba(23,35,61,0.06)",
        raised: "0 12px 32px rgba(23,35,61,0.14), 0 2px 6px rgba(23,35,61,0.08)",
      },
      keyframes: {
        houseFloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "house-float": "houseFloat 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
