import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#102A43",
        ink: "#1F2937",
        saffron: "#F97316",
        telangana: "#0F766E",
        cream: "#FFF7ED",
        mist: "#F8FAFC",
        "dark-surface": "#000000",
        "dark-card": "#111111",
        "dark-border": "#222222",
        "dark-text": "#F1F5F9",
        "dark-muted": "#94A3B8",
      },
      boxShadow: {
        civic: "0 18px 60px rgba(16, 42, 67, 0.12)",
        "civic-dark": "0 18px 60px rgba(0, 0, 0, 0.4)",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Telugu", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
