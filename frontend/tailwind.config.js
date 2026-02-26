/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "oklch(var(--popover) / <alpha-value>)",
          foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
      },
      fontSize: {
        // Mobile-optimized font size scale
        "xs":   ["0.75rem",  { lineHeight: "1rem" }],        /* 12px */
        "sm":   ["0.875rem", { lineHeight: "1.25rem" }],     /* 14px */
        "base": ["1rem",     { lineHeight: "1.5rem" }],      /* 16px */
        "lg":   ["1.125rem", { lineHeight: "1.75rem" }],     /* 18px */
        "xl":   ["1.25rem",  { lineHeight: "1.75rem" }],     /* 20px */
        "2xl":  ["1.375rem", { lineHeight: "1.875rem" }],    /* 22px */
        "3xl":  ["1.75rem",  { lineHeight: "2.125rem" }],    /* 28px */
        "4xl":  ["2rem",     { lineHeight: "2.25rem" }],     /* 32px */
        "5xl":  ["2.5rem",   { lineHeight: "1" }],           /* 40px */
        "6xl":  ["3rem",     { lineHeight: "1" }],           /* 48px */
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
      height: {
        "screen-dvh": "100dvh",
        "screen-svh": "100svh",
        "screen-lvh": "100lvh",
      },
      minHeight: {
        "screen-dvh": "100dvh",
        "screen-svh": "100svh",
        "screen-lvh": "100lvh",
        "touch": "44px",
      },
      minWidth: {
        "touch": "44px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
    function ({ addUtilities }) {
      addUtilities({
        ".safe-area-inset-bottom": {
          "padding-bottom": "env(safe-area-inset-bottom)",
        },
        ".safe-area-inset-top": {
          "padding-top": "env(safe-area-inset-top)",
        },
        ".touch-action-none": {
          "touch-action": "none",
        },
        ".touch-action-pan-y": {
          "touch-action": "pan-y",
        },
        ".touch-action-pan-x": {
          "touch-action": "pan-x",
        },
      });
    },
  ],
};
