import type { Config } from "tailwindcss";

// Design tokens mirror docs/Design.md section 2-3 exactly.
// Do not add colors here without updating Design.md first (Rules.md: no undocumented deps/tokens).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#050608",
        panel: "#0a0e13",
        "panel-soft": "#0d1218",
        ink: "#f4f6f8",
        muted: "#8894a0",
        dim: "#56616c",
        orange: { DEFAULT: "#ec6408", soft: "#ff9a52" },
        blue: "#3e9bd0",
        green: "#3bd29d",
        red: "#ff4b42",
        amber: "#feba12",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: { panel: "14px" },
      boxShadow: {
        panel: "0 24px 60px rgba(0,0,0,.38)",
      },
    },
  },
  plugins: [],
};
export default config;
