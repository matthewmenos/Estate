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
    },
  },
  plugins: [],
};
export default config;
