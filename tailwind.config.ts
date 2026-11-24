import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#070D1E",
          900: "#0B1329",
          850: "#0F1A36",
          800: "#132145",
          700: "#1E305B",
          600: "#2B437C",
        },
        iot: {
          blue: "#2563EB",
          "blue-hover": "#1D4ED8",
          "blue-subtle": "#EFF6FF",
          emerald: "#10B981",
          "emerald-subtle": "#ECFDF5",
          amber: "#F59E0B",
          slate: "#64748B",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        "card": "12px",
      },
    },
  },
  plugins: [],
};

export default config;
