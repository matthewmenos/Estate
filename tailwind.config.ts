import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep coastal teal — replaces the old navy "ink" for the same role
        // (dark text, dark surfaces) with a totally different hue family.
        ink: {
          DEFAULT: "#0C3B36",
          soft: "#1F5C54",
        },
        // Brighter warm white — replaces the muted sandstone background.
        paper: {
          DEFAULT: "#FFFBF3",
          raised: "#FFFFFF",
        },
        // Vibrant coral — replaces the muted brick-rust primary action color.
        rust: {
          DEFAULT: "#FF5A36",
          dark: "#E8451F",
        },
        // Sunny amber — replaces the muted antique gold.
        gold: {
          DEFAULT: "#FFB627",
          soft: "#FFD166",
        },
        slate: {
          DEFAULT: "#57636D",
        },
        // New: a bright mint-teal accent for secondary UI moments (status
        // pills, secondary outlines) — didn't exist in the old palette.
        teal: {
          DEFAULT: "#2FB8A6",
          soft: "#7EDBCE",
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
          { lineHeight: "1.02", letterSpacing: "-0.03em", fontWeight: "700" },
        ],
        section: [
          "clamp(1.5rem, 1.5vw + 1rem, 2.125rem)",
          { lineHeight: "1.12", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
      },
      boxShadow: {
        // Tinted with the new teal ink instead of flat black — a small but
        // real modern-UI signal that reads very differently from a neutral shadow.
        soft: "0 1px 2px rgba(12,59,54,0.06), 0 6px 16px rgba(12,59,54,0.08)",
        raised: "0 16px 36px rgba(12,59,54,0.16), 0 4px 10px rgba(255,90,54,0.08)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
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
