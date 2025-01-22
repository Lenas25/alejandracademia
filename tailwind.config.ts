
import type { Config } from "tailwindcss";
import daisyui from 'daisyui';

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    'node_modules/preline/dist/*.js',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        flamingo: "#D8B2B1",
        black: "#151515",
        white: "#FFFFFF",
        yellow: "#F6B81D",
        darkpink: "#a16361",
        grey: "#D9D9D9",
        lightpink: "#FDEAF2",
        rose: "#A87C79",
      },
    },
  },
  plugins: [
    daisyui,
  ],
} satisfies Config;
