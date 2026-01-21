/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: ["selector"],
  safelist: [
    {
      pattern: /col-span-(\d+)/,
      variants: ["lg"],
    },
    // Height
    {
      pattern: /h-(0|2|3|4|6|8|12|16|24|32)/,
      variants: ["lg"],
    },
    // Text sizes for all screen sizes
    {
      pattern: /text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/,
      variants: ["lg"],
    },
    // Alignments
    {
      pattern: /text-(left|center|right)/,
    },
  ],
  theme: {
    extend: {
      colors: {
        transparent: "transparent",
        primary: {
          50: "#e6f1ef",
          100: "#cce2df",
          200: "#99c5bf",
          300: "#66a89f",
          400: "#338a7f",
          500: "#006B5B", // PostPal Green
          600: "#006052",
          700: "#004b40",
          800: "#00362e",
          900: "#00201b",
          950: "#000b09",
        },
        accent: {
          50: "#fff4e9",
          100: "#ffe9d2",
          200: "#ffd3a5",
          300: "#ffbd78",
          400: "#ffa74b",
          500: "#F9921D", // PostPal Orange
          600: "#e0831a",
          700: "#af6614",
          800: "#7d490f",
          900: "#4b2c09",
          950: "#190f03",
        },
        neutral: {
          50: "#f8f9f9",
          100: "#f1f2f3",
          200: "#e3e5e6",
          300: "#cbd1d3",
          400: "#94a0a4",
          500: "#647479",
          600: "#4d5d62",
          700: "#3d4a4e",
          800: "#2d373a",
          900: "#1d2426",
          950: "#0d1011",
        },
      },
      cursor: {
        fancy: "url(https://www.svgrepo.com/show/269/color-picker.svg)",
      },
      fontFamily: {
        sans: ["Roboto", ...defaultTheme.fontFamily.sans],
        headings: ["Roboto", ...defaultTheme.fontFamily.sans],
        accent: ["Covered By Your Grace", "cursive"],
      },
      keyframes: {
        dropdown: {
          "0%": { transform: "translateY(-1rem)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        fadeUp: {
          "0%": { transform: "translateY(1rem)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
      },
      animation: {
        dropdown: "dropdown 100ms ease-in-out forwards",
        fadeUp: "fadeUp 10ms ease-in-out forwards",
      },
    },
  },
  variants: {
    animation: ["responsive"],
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwindcss/plugin")(function ({ addVariant }) {
      addVariant("dark-me", ".dark_&");
    }),
  ],
};
