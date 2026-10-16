import type { Config } from "tailwindcss";

const c = (v: string) => `rgb(var(--${v}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        sans: ["Archivo", "system-ui", "sans-serif"],
      },
      colors: {
        bg: c("bg"),
        rail: c("rail"),
        surface: c("surface"),
        raised: c("raised"),
        hover: c("hover"),
        line: c("line"),
        ink: c("ink"),
        "ink-2": c("ink-2"),
        "ink-3": c("ink-3"),
        brand: c("brand"),
        "brand-strong": c("brand-strong"),
        cyan: c("cyan"),
        navy: c("navy"),
        danger: c("danger"),
        warn: c("warn"),
        ok: c("ok"),
      },
      borderRadius: { xl: "14px", "2xl": "18px" },
      boxShadow: {
        pop: "0 12px 40px -12px rgb(0 0 0 / 0.45)",
        glow: "0 8px 24px -8px rgb(var(--brand) / 0.55)",
      },
      keyframes: {
        "slide-in": { from: { transform: "translateX(24px)", opacity: "0" }, to: { transform: "none", opacity: "1" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        pulse2: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".35" } },
      },
      animation: {
        "slide-in": "slide-in .22s ease-out",
        "fade-in": "fade-in .18s ease-out",
        pulse2: "pulse2 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
