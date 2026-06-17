import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        maria: {
          forest: {
            DEFAULT: "#0F3D32",
            light: "#1B5A4A",
            dark: "#082820"
          },
          ocean: {
            DEFAULT: "#2AABB8",
            light: "#4BC4CF",
            dark: "#1E8A94"
          },
          sand: {
            DEFAULT: "#E8DCC8",
            light: "#F5EDD6",
            dark: "#D4C4A8"
          },
          sunset: {
            DEFAULT: "#E8773A",
            light: "#F0945E",
            dark: "#C85F28"
          },
          gold: {
            DEFAULT: "#C9A962",
            light: "#DFC88A",
            dark: "#A8873F"
          },
          pearl: "#FFFFFF",
          cream: "#F5EDD6"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "Times New Roman", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        maria: "0 24px 64px -32px rgba(8, 40, 32, 0.45)",
        "maria-soft": "0 8px 32px -12px rgba(15, 61, 50, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
