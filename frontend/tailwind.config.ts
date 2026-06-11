import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F1B2D",        // deep navy — headings, footer
        steel: "#44546A",      // body text
        mist: "#F5F7FA",       // section backgrounds
        line: "#E2E8F0",       // borders
        brand: {
          DEFAULT: "#0E7490",  // gulf teal — primary accent
          dark: "#155E75",
          soft: "#E0F2F7"
        },
        gold: "#B8860B"        // sparing secondary accent
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      maxWidth: { content: "72rem" }
    }
  },
  plugins: []
};
export default config;
