import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
const hsl = (v: string) => `hsl(var(--${v}) / <alpha-value>)`;
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Figtree", "ui-sans-serif", "system-ui", "sans-serif"] },
      colors: {
        background: hsl("background"), foreground: hsl("foreground"), border: hsl("border"), input: hsl("input"), ring: hsl("ring"),
        card: { DEFAULT: hsl("card"), foreground: hsl("card-foreground") },
        primary: { DEFAULT: hsl("primary"), foreground: hsl("primary-foreground") },
        secondary: { DEFAULT: hsl("secondary"), foreground: hsl("secondary-foreground") },
        muted: { DEFAULT: hsl("muted"), foreground: hsl("muted-foreground") },
        accent: { DEFAULT: hsl("accent"), foreground: hsl("accent-foreground") },
        destructive: { DEFAULT: hsl("destructive"), foreground: hsl("destructive-foreground") },
        status: { normal: hsl("status-normal"), warning: hsl("status-warning"), critical: hsl("status-critical"), offline: hsl("status-offline") },
      },
      borderRadius: { lg: "0.75rem", md: "0.5rem", sm: "0.375rem" },
      boxShadow: { card: "0 1px 2px hsl(160 30% 10% / 0.04), 0 4px 16px hsl(160 30% 10% / 0.04)" },
    },
  },
  plugins: [animate],
} satisfies Config;
