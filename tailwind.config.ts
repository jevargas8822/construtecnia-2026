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
        adeic: {
          navy: {
            950: "#070E1A",
            900: "#0B192C",
            850: "#0F223D",
            800: "#142B4E",
            700: "#1E3E62",
            600: "#2A5585",
            500: "#3B71AB",
            100: "#EAF1F8",
            50: "#F3F7FB",
          },
          gold: {
            600: "#B8860B",
            500: "#D4AF37",
            400: "#E5C158",
            300: "#F3D78A",
            200: "#FAECC3",
            100: "#FDF8EA",
          },
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
